"""
Multi-Camera Tracker
====================
Manages any number of camera feeds simultaneously. Each camera cell
can process an uploaded video OR connect to a live camera source.
Per-camera counts are tracked independently and aggregated into a total.
"""

import cv2
import torch
import numpy as np
import os
import threading
import time
import base64
from ultralytics import YOLO

try:
    from .camera_manager import CameraManager
except (ImportError, ValueError):
    from camera_manager import CameraManager  # type: ignore


class MultiCameraManager:
    def __init__(self, model_name="boxes_custom.pt"):
        print("Initializing MultiCameraManager...")

        self.model_name = model_name
        self.cameras = {}  # camera_id -> camera_data dict
        self._lock = threading.Lock()
        self._live_frame_idx = {}  # camera_id -> int

        # Model path resolution
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.models_dir = os.path.join(os.path.dirname(current_dir), "models")
        self.model_path = os.path.join(self.models_dir, model_name)

        # Verify model exists
        if not os.path.exists(self.model_path):
            print(f"MultiCameraManager: WARNING - Model not found at {self.model_path}")

        # Device
        self.device = self._get_device()
        print(f"MultiCameraManager: Using device: {self.device}")

    def _get_device(self):
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def _create_tracker(self):
        """Creates a fresh YOLO model instance for a camera."""
        try:
            model = YOLO(self.model_path)
            return model
        except Exception as e:
            print(f"MultiCameraManager: Error creating tracker: {e}")
            return None

    # --- Camera Cell Management ---

    def add_camera(self, camera_id, label=""):
        """Add a new camera cell."""
        with self._lock:
            if camera_id in self.cameras:
                return {"status": "already_exists", "camera_id": camera_id}

            self.cameras[camera_id] = {
                "label": label or f"Camera {camera_id}",
                "model": None,  # Lazy loaded
                "source": None,
                "mode": None,  # 'video' or 'live'
                "active": False,
                "thread": None,
                "count": 0,
                "current_frame": None,
                "counted_ids": set(),
                "track_history": {},
                "status": "idle",  # idle, processing, completed, live, error
                "video_url": None,
                "error": None,
            }

            print(f"MultiCameraManager: Added camera '{camera_id}' ({label})")
            return {"status": "added", "camera_id": camera_id, "label": label}

    def remove_camera(self, camera_id):
        """Stop and remove a camera cell."""
        with self._lock:
            if camera_id not in self.cameras:
                return {"status": "not_found"}

            cam = self.cameras[camera_id]
            cam["active"] = False

            # Wait for thread to finish
            thread = cam.get("thread")
            if thread is not None and hasattr(thread, "is_alive") and thread.is_alive():
                thread.join(timeout=3)

            self.cameras.pop(camera_id, None)
            print(f"MultiCameraManager: Removed camera '{camera_id}'")
            return {"status": "removed", "camera_id": camera_id}

    def get_cameras(self):
        """Get list of all camera cells and their states."""
        with self._lock:
            result = {}
            total = 0
            for cam_id, cam in self.cameras.items():
                result[cam_id] = {
                    "label": cam["label"],
                    "mode": cam["mode"],
                    "count": cam["count"],
                    "status": cam["status"],
                    "video_url": cam["video_url"],
                    "error": cam["error"],
                }
                total += cam["count"]

            return {"cameras": result, "total": total}

    def get_counts(self):
        """Get per-camera counts + total."""
        return self.get_cameras()

    # --- Video Processing (Per-Camera) ---

    def process_camera_video(
        self, camera_id, video_path, output_path, on_update=None
    ):
        """
        Process an uploaded video for a specific camera cell.
        Runs in the caller's thread (or background task thread).
        """
        with self._lock:
            if camera_id not in self.cameras:
                return {"status": "camera_not_found"}

            cam = self.cameras[camera_id]
            cam["status"] = "processing"
            cam["count"] = 0
            cam["counted_ids"] = set()
            cam["track_history"] = {}

        # Create model for this camera
        model = self._create_tracker()
        if model is None:
            with self._lock:
                cam["status"] = "error"
                cam["error"] = "Failed to load model"
            return {"status": "model_error"}

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            with self._lock:
                cam["status"] = "error"
                cam["error"] = "Failed to open video"
            return {"status": "video_error"}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25

        # ROI zone (center 85% of frame - expanded for better recall)
        zone_x1, zone_y1 = int(width * 0.075), int(height * 0.075)
        zone_x2, zone_y2 = int(width * 0.925), int(height * 0.925)

        # Output writer
        try:
            fourcc = cv2.VideoWriter_fourcc(*"avc1")
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            if not out.isOpened():
                raise Exception("avc1 failed")
        except Exception:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        counted_ids = set()
        frame_idx = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1

        while cap.isOpened():
            try:
                # v14.33 Performance Note: Disabled frame skipping for maximum tracking stability.
                # Processing every frame ensures ByteTrack never loses the ID, preventing double-counts.
                success, frame = cap.read()
                if not success:
                    break

                annotated_frame = frame.copy()

                # Run tracking - v14.57: Temporal Stability Guard
                results = model.track(
                    frame,
                    persist=True,
                    conf=0.40, # High confidence for stable video IDs
                    iou=0.70, # High IOU to prevent track switching
                    tracker="bytetrack.yaml",
                    classes=[0],
                    augment=False,
                    verbose=False,
                )

                # Draw zone
                cv2.rectangle(
                    annotated_frame,
                    (zone_x1, zone_y1),
                    (zone_x2, zone_y2),
                    (255, 255, 0),
                    1,
                )

                current_count = len(counted_ids)

                if results and results[0].boxes.id is not None:
                    boxes = results[0].boxes.xywh.cpu().numpy()
                    ids = results[0].boxes.id.int().cpu().tolist()

                    for box, tid in zip(boxes, ids):
                        cx, cy = float(box[0]), float(box[1])
                        w, h = float(box[2]), float(box[3])

                        # Standard Filters
                        ar = w / h
                        if ar < 0.35 or ar > 4.0:
                            continue
                        if w < width * 0.05 or h < height * 0.05: # Stricter size filter
                            continue

                        # Check if in zone
                        in_zone = (
                            zone_x1 < cx < zone_x2 and zone_y1 < cy < zone_y2
                        )

                        # v14.57: Track Maturity (15 frames)
                        if tid not in cam["track_history"]:
                            cam["track_history"][tid] = 0
                        
                        if in_zone:
                            cam["track_history"][tid] += 1
                            if cam["track_history"][tid] >= 15 and tid not in counted_ids:
                                counted_ids.add(tid)
                                current_count = len(counted_ids)
                            
                            color = (0, 255, 0) if tid in counted_ids else (0, 255, 255)
                            cv2.circle(annotated_frame, (int(cx), int(cy)), 8, color, -1)
                        else:
                            cv2.circle(annotated_frame, (int(cx), int(cy)), 5, (0, 0, 255), -1)

                        # Draw BB
                        x1, y1 = int(cx - w / 2), int(cy - h / 2)
                        x2, y2 = int(cx + w / 2), int(cy + h / 2)
                        color = (0, 255, 0) if tid in counted_ids else (0, 100, 255)
                        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)

                # HUD
                label = self.cameras.get(camera_id, {}).get("label", camera_id)
                cv2.putText(
                    annotated_frame,
                    f"{label}: {current_count} boxes",
                    (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (0, 255, 0),
                    2,
                )

                # Progress
                progress = 0
                if total_frames > 0:
                    progress = int((frame_idx / total_frames) * 100)
                cv2.putText(
                    annotated_frame,
                    f"Progress: {progress}%",
                    (20, height - 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (200, 200, 200),
                    1,
                )

                out.write(annotated_frame)

                # Update camera state
                with self._lock:
                    if camera_id in self.cameras:
                        self.cameras[camera_id]["count"] = current_count
                        self.cameras[camera_id]["current_frame"] = annotated_frame.copy()

                # Broadcast frame (v13.7 Throttling)
                if on_update and frame_idx % 6 == 0:
                    try:
                        _, buffer = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
                        jpg_text = base64.b64encode(buffer).decode("utf-8")
                        on_update({
                            "type": "multi_cctv_frame",
                            "camera_id": camera_id,
                            "data": jpg_text,
                            "count": current_count,
                            "progress": progress,
                        })
                    except Exception as e:
                        print(f"MultiCam: Frame broadcast failed for {camera_id}: {e}")

                frame_idx += 1
            except Exception as e:
                print(f"MultiCam: Error processing frame {frame_idx} for {camera_id}: {e}")
                frame_idx += 1
                continue

        cap.release()
        out.release()

        # Final state update & Broadcast
        video_url = f"/download/{os.path.basename(output_path)}"
        with self._lock:
            if camera_id in self.cameras:
                self.cameras[camera_id]["count"] = current_count
                self.cameras[camera_id]["status"] = "completed"
                self.cameras[camera_id]["video_url"] = video_url
        
        if on_update:
            on_update({
                "type": "multi_cctv_frame",
                "camera_id": camera_id,
                "count": current_count,
                "progress": 100,
                "status": "completed",
                "video_url": video_url
            })

        print(
            f"MultiCam: Camera '{camera_id}' completed. Count={current_count}"
        )

        return {
            "camera_id": camera_id,
            "count": current_count,
            "status": "completed",
            "video_url": video_url,
        }

    # --- Live Camera Stream (Per-Camera) ---

    def start_live(self, camera_id, source):
        """
        Start live detection on a camera source (RTSP URL, HTTP stream, or webcam index).
        Runs in a background thread.
        """
        with self._lock:
            if camera_id not in self.cameras:
                return {"status": "camera_not_found"}

            cam = self.cameras[camera_id]
            if cam["active"]:
                return {"status": "already_active"}

            cam["active"] = True
            cam["mode"] = "live"
            cam["status"] = "live"
            cam["source"] = source
            cam["count"] = 0
            cam["counted_ids"] = set()

        # Start thread
        thread = threading.Thread(
            target=self._live_loop,
            args=(camera_id, source),
            daemon=True,
        )
        thread.start()

        with self._lock:
            self.cameras[camera_id]["thread"] = thread

        return {"status": "live_started", "camera_id": camera_id}

    def _live_loop(self, camera_id, source):
        """Background thread for live camera detection."""
        model = self._create_tracker()
        if model is None:
            with self._lock:
                if camera_id in self.cameras:
                    self.cameras[camera_id]["status"] = "error"
                    self.cameras[camera_id]["error"] = "Model load failed"
            return

        # Try to open source (int for webcam, string for URL)
        try:
            src = int(source)
        except (ValueError, TypeError):
            src = source

        if src == 0:
            cap = CameraManager.get_cap()
        else:
            cap = cv2.VideoCapture(src)
            
        if not cap or not cap.isOpened():
            with self._lock:
                if camera_id in self.cameras:
                    self.cameras[camera_id]["status"] = "error"
                    self.cameras[camera_id]["error"] = f"Cannot open source: {source}"
            return

        counted_ids = set()

        while True:
            with self._lock:
                if camera_id not in self.cameras or not self.cameras[camera_id]["active"]:
                    break

            success, frame = cap.read()
            if not success:
                time.sleep(0.1)
                continue

            height, width = frame.shape[:2]
            annotated = frame.copy()

            # Zone (Expanded to 85% for better recall)
            zx1, zy1 = int(width * 0.075), int(height * 0.075)
            zx2, zy2 = int(width * 0.925), int(height * 0.925)
            cv2.rectangle(annotated, (zx1, zy1), (zx2, zy2), (255, 255, 0), 1)

            # Track
            # v13.7 Performance Fix: Run AI only every 3rd frame in live loop to save CPU
            if camera_id not in self._live_frame_idx:
                self._live_frame_idx[camera_id] = 0
            self._live_frame_idx[camera_id] += 1
            
            if self._live_frame_idx[camera_id] % 3 == 0:
                results = model.track(
                    frame,
                    persist=True,
                    conf=0.32, # Tuned for v14.31
                    iou=0.45,
                    tracker="bytetrack.yaml",
                    classes=[0],
                    augment=False,
                    verbose=False,
                )
            else:
                results = None # Skip AI this frame

            if results and results[0].boxes.id is not None:
                boxes = results[0].boxes.xywh.cpu().numpy()
                ids = results[0].boxes.id.int().cpu().tolist()

                for box, tid in zip(boxes, ids):
                    cx, cy = float(box[0]), float(box[1])
                    in_zone = zx1 < cx < zx2 and zy1 < cy < zy2

                    # v14.32: Track Maturity (Live)
                    with self._lock:
                        cam = self.cameras[camera_id]
                        if "track_history" not in cam:
                            cam["track_history"] = {}
                    
                    if tid not in cam["track_history"]:
                        cam["track_history"][tid] = 0
                    
                    if in_zone:
                        cam["track_history"][tid] += 1
                        if cam["track_history"][tid] >= 10 and tid not in counted_ids: # 10 frames for live
                            counted_ids.add(tid)
                        
                        color = (0, 255, 0) if tid in counted_ids else (255, 255, 0)
                        cv2.circle(annotated, (int(cx), int(cy)), 5, color, -1)
                    else:
                        cv2.circle(annotated, (int(cx), int(cy)), 5, (0, 0, 255), -1)

            count = len(counted_ids)

            # HUD
            label = self.cameras.get(camera_id, {}).get("label", camera_id)
            cv2.putText(
                annotated,
                f"{label}: {count} boxes",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )
            cv2.putText(
                annotated,
                "LIVE",
                (width - 80, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2,
            )

            # Update state
            with self._lock:
                if camera_id in self.cameras:
                    self.cameras[camera_id]["count"] = count
                    self.cameras[camera_id]["current_frame"] = annotated.copy()

            time.sleep(0.03)  # ~30fps cap

        cap.release()
        with self._lock:
            if camera_id in self.cameras:
                self.cameras[camera_id]["active"] = False
                self.cameras[camera_id]["status"] = "idle"

    def process_camera_image(self, camera_id, image_path, output_path, on_update=None):
        """
        Process an uploaded image for a specific camera using Quantity Count Pro logic
        (VolumeEstimator with tiled detection + depth estimation).
        """
        with self._lock:
            if camera_id not in self.cameras:
                return {"status": "camera_not_found"}
            cam = self.cameras[camera_id]
            cam["status"] = "processing"
            cam["count"] = 0

        try:
            try:
                from .volume_estimator import VolumeEstimator
            except (ImportError, ValueError):
                from volume_estimator import VolumeEstimator  # type: ignore

            ve = VolumeEstimator()

            if on_update:
                on_update({
                    "type": "multi_cctv_frame",
                    "camera_id": camera_id,
                    "count": 0,
                    "progress": 10,
                    "detection_mode": "warehouse-multi",
                })

            results = ve.process_image(image_path, output_path)
            # Use AI-audited count when Gemini ran, else fall back to YOLO predicted total
            final_count = results.get("count", results.get("estimated_total", 0))
            yolo_estimated = results.get("estimated_total", 0)

            img = cv2.imread(output_path)
            frame_data = None
            if img is not None:
                _, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                frame_data = base64.b64encode(buf).decode("utf-8")
                with self._lock:
                    if camera_id in self.cameras:
                        self.cameras[camera_id]["current_frame"] = img.copy()

            image_url = f"/download/{os.path.basename(output_path)}"
            with self._lock:
                if camera_id in self.cameras:
                    self.cameras[camera_id]["count"] = final_count
                    self.cameras[camera_id]["status"] = "completed"
                    self.cameras[camera_id]["video_url"] = image_url

            if on_update:
                on_update({
                    "type": "multi_cctv_frame",
                    "camera_id": camera_id,
                    "data": frame_data,
                    "count": final_count,
                    "visible_count":     results.get("visible_count", 0),
                    "estimated_total":   yolo_estimated,
                    "progress": 100,
                    "status": "completed",
                    "video_url": image_url,
                    "detection_mode": "warehouse-multi",
                    # Gemini AI audit fields
                    "audit_available":        results.get("audit_available", False),
                    "audited_count":          results.get("audited_count", final_count),
                    "gemini_reasoning":       results.get("gemini_reasoning"),
                    "gemini_visible_rows":    results.get("gemini_visible_rows", 0),
                    "gemini_visible_cols":    results.get("gemini_visible_cols", 0),
                    "gemini_estimated_depth": results.get("gemini_estimated_depth"),
                    "gemini_volume_formula":  results.get("gemini_volume_formula", ""),
                    "depth_layers":           results.get("depth_layers", 0),
                })

            print(f"MultiCam: Camera '{camera_id}' image processed. Count={final_count}")
            return {"camera_id": camera_id, "count": final_count, "status": "completed", "video_url": image_url}

        except Exception as e:
            print(f"MultiCam: Error processing image for {camera_id}: {e}")
            with self._lock:
                if camera_id in self.cameras:
                    self.cameras[camera_id]["status"] = "error"
                    self.cameras[camera_id]["error"] = str(e)
            if on_update:
                on_update({
                    "type": "multi_cctv_frame",
                    "camera_id": camera_id,
                    "count": 0,
                    "status": "error",
                    "detection_mode": "warehouse-multi",
                })
            return {"status": "error", "error": str(e)}

    def stop_camera(self, camera_id):
        """Stop a specific camera's live feed."""
        with self._lock:
            if camera_id in self.cameras:
                self.cameras[camera_id]["active"] = False
                return {"status": "stopping", "camera_id": camera_id}
        return {"status": "not_found"}

    def get_frame(self, camera_id):
        """Get the latest annotated frame for a camera (for MJPEG streaming)."""
        with self._lock:
            cam = self.cameras.get(camera_id)
            if cam and cam["current_frame"] is not None:
                return cam["current_frame"].copy()
        return None

    def stop_all(self):
        """Stop all camera feeds."""
        with self._lock:
            for cam_id in list(self.cameras.keys()):
                self.cameras[cam_id]["active"] = False

        # Wait for threads
        for cam_id, cam in self.cameras.items():
            thread = cam.get("thread")
            if thread is not None and hasattr(thread, "is_alive") and thread.is_alive():
                thread.join(timeout=3)

        print("MultiCameraManager: All cameras stopped.")
        return {"status": "all_stopped"}

    def generate_mjpeg(self, camera_id):
        """Generator for MJPEG streaming of a specific camera."""
        while True:
            frame = self.get_frame(camera_id)
            if frame is not None:
                ret, buffer = cv2.imencode(".jpg", frame)
                if ret:
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + buffer.tobytes()
                        + b"\r\n"
                    )
            time.sleep(0.03)

            # Check if camera is still active
            with self._lock:
                cam = self.cameras.get(camera_id)
                if not cam or not cam["active"]:
                    break
