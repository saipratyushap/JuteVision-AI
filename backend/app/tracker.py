import cv2
import torch
import torchvision
import numpy as np
import os
from ultralytics import YOLO
try:
    from .utils import get_centroid, annotate_frame, detect_with_tiling_shared
except (ImportError, ValueError):
    from app.utils import get_centroid, annotate_frame, detect_with_tiling_shared # type: ignore

class JuteBagTracker:
    def __init__(self, model_name="boxes_custom.pt"):  # Custom boxes model
        print("Initializing BoxTracker (Custom Boxes Model)...")
        self.device = self._get_device()
        print(f"Using device: {self.device}")
        
        # Dynamic path resolution
        current_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(os.path.dirname(current_dir), "models")
        model_path = os.path.join(models_dir, model_name)
        
        try:
            self.model = YOLO(model_path)
            print(f"YOLOv8 loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading YOLO: {e}")
            self.model = None

        # v13.5 Isolation: Removing persistent counts to prevent session leakage
        self.counted_ids = set()
        
        # Track history
        self.track_history = {}

    def reset_state(self):
        """Resets the tracker state to zero."""
        print("Resetting JuteBagTracker state...")
        self.counted_ids = set()
        self.track_history = {}
        return {"status": "reset", "count": 0}

    def _get_device(self):
        """Dynamic Device Setup: Mac (MPS), CUDA, or CPU."""
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def detect_with_tiling(self, frame, strict=False):
        return detect_with_tiling_shared(self.model, frame)

    def process_live_frame(self, frame):
        """
        Processes a single frame from the live webcam feed.
        Uses SCANNING MODE (Blue Zone) to count bags entering the area.
        Updates global state directly.
        """
        if self.model is None:
            return frame

        height, width = frame.shape[:2]
        annotated_frame = frame.copy()
        
        # --- SCANNING MODE (Center Zone Logic) ---
        # 1. Define Zone (Blue Box)
        zone_x1 = int(width * 0.2)
        zone_x2 = int(width * 0.8)
        zone_y1 = int(height * 0.1)
        zone_y2 = int(height * 0.9)
        
        cv2.rectangle(annotated_frame, (zone_x1, zone_y1), (zone_x2, zone_y2), (255, 255, 0), 2)
        cv2.putText(annotated_frame, "LIVE SCANNING ZONE", (zone_x1, zone_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # 2. Run Tracking
        # Relaxed for detection. augment=False for speed in live view.
        results = self.model.track(frame, persist=True, conf=0.3, iou=0.6, 
                                 tracker="bytetrack.yaml", 
                                 agnostic_nms=True,
                                 classes=[0],
                                 augment=False, # Keep false for FPS
                                 verbose=False)
        
        if results and results[0].boxes is not None and len(results[0].boxes) > 0:
            boxes = results[0].boxes.xywh.cpu()
            track_ids = results[0].boxes.id.int().cpu().tolist() if results[0].boxes.id is not None else []
            
            # Use plot() for the base tracking visual (IDs, boxes)
            # We overlay on top of this
            base_plot = results[0].plot()
            # Blend or just copy the plot? Let's use plot() as base but we drew the zone on 'annotated_frame'.
            # simpler: Let's draw the zone on the plot result
            annotated_frame = base_plot
            cv2.rectangle(annotated_frame, (zone_x1, zone_y1), (zone_x2, zone_y2), (255, 255, 0), 2)
            cv2.putText(annotated_frame, "LIVE SCANNING ZONE", (zone_x1, zone_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

            for box, track_id in zip(boxes, track_ids):
                x, y, w, h = box
                cx, cy = float(x), float(y)
                
                # Check Zone
                is_in_zone = (zone_x1 < cx < zone_x2) and (zone_y1 < cy < zone_y2)
                
                if is_in_zone:
                    if track_id not in self.counted_ids:
                        # NEW BAG
                        self.counted_ids.add(track_id)
                        # Visual Feedback
                        cv2.circle(annotated_frame, (int(cx), int(cy)), 10, (0, 255, 0), -1)
                    else:
                        # Already Counted
                        cv2.circle(annotated_frame, (int(cx), int(cy)), 5, (0, 255, 0), -1)
                else:
                    # Outside Zone
                    cv2.circle(annotated_frame, (int(cx), int(cy)), 5, (0, 0, 255), -1)
        
        # Draw Total Count
        cv2.putText(annotated_frame, f"Live Count: {len(self.counted_ids)}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        return annotated_frame

    def process_video(self, video_path, output_path, mode="static", on_update=None):
        """
        Processes a video file to count boxes.
        mode: "static" (whole frame) or "scanning" (center zone)
        """
        import numpy as np # Ensure numpy is available
        print(f"Starting video processing: {video_path} in mode: {mode}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return {"count": 0, "status": "failed", "error": f"Could not open video {video_path}"}

        if self.model is None:
             print("Error: Model not loaded")
             return {"count": 0, "status": "failed", "error": "Model not loaded"}

        # Video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        print(f"Video Info: {width}x{height} @ {fps}fps")

        # Output saver
        # Browser-compatible codec (H.264 / avc1)
        try:
            fourcc = cv2.VideoWriter_fourcc(*'avc1')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            if not out.isOpened():
                raise Exception("avc1 failed")
        except Exception:
            print("Warning: H.264 (avc1) codec failed. Falling back to mp4v.")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frame_idx = 0
        detection_count = 0
        
        # Local Counting State (Reset per video)
        current_count = 0
        counted_ids = set()
        
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
            
            # v13.7 Performance Fix: Frame Skipping
            # Process every 2nd frame for tracking, but every 5th for heavy Tiled Scan
            skip_tracking = (frame_idx % 2 != 0)
            skip_tiling = (frame_idx % 5 != 0)
            
            if mode == "static" and skip_tiling:
                # Still show previous frame with previous detections to avoid flickering
                if 'annotated_frame' in locals():
                    out.write(annotated_frame)
                frame_idx += 1
                continue
            
            if mode != "static" and skip_tracking:
                if 'annotated_frame' in locals():
                    out.write(annotated_frame)
                frame_idx += 1
                continue

            annotated_frame = frame.copy()

            if mode == "static":
                # --- STATIC MODE: Tiled Detection (SAHI-lite) ---
                # 1. Detect using tiles
                # v8.1: Using balanced (strict=False) for static video piles
                final_boxes, _ = self.detect_with_tiling(frame, strict=False)
                
                # 2. Update Count (Use High-Water Mark approach for piles)
                # We assume the user is showing the *same* pile, so the best frame is the one with MOST bags.
                snapshot_count = len(final_boxes)
                if snapshot_count > current_count:
                    current_count = snapshot_count
                    if on_update:
                         try: on_update({"count": current_count, "frame_idx": frame_idx}) 
                         except: pass

                # 3. Optimize Visualization (Static)
                cv2.putText(annotated_frame, "STATIC MODE - TILED SCAN", (50, height - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                for box in final_boxes:
                    x1, y1, x2, y2 = map(int, box)
                    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                    
                    # Draw Box & Dot
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.circle(annotated_frame, (cx, cy), 4, (0, 255, 0), -1)

            else:
                # Run YOLOv8 tracking with OPTIMIZED parameters
                # v13.7 Performance Fix: Set augment=False for better FPS.
                results = self.model.track(frame, persist=True, conf=0.15, iou=0.6, 
                                        tracker="bytetrack.yaml", 
                                        agnostic_nms=True,
                                        classes=[0],
                                        augment=False,
                                        verbose=False)
                
                if results and results[0].boxes is not None and len(results[0].boxes) > 0:
                    detection_count += 1
                    boxes = results[0].boxes.xywh.cpu()
                    track_ids = results[0].boxes.id.int().cpu().tolist() if results[0].boxes.id is not None else []
                    
                    annotated_frame = results[0].plot() # Use default plot for tracking debug

                    # --- SCANNING MODE (Center Zone) ---
                    # Box in the middle 60% of the screen
                    zone_x1 = int(width * 0.2)
                    zone_x2 = int(width * 0.8)
                    zone_y1 = int(height * 0.1)
                    zone_y2 = int(height * 0.9)
                    
                    # Draw Zone (Blue Box)
                    cv2.rectangle(annotated_frame, (zone_x1, zone_y1), (zone_x2, zone_y2), (255, 255, 0), 2)
                    cv2.putText(annotated_frame, "SCANNING ZONE", (zone_x1, zone_y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

                    for box, track_id in zip(boxes, track_ids):
                        x, y, w, h = box
                        cx, cy = float(x), float(y)
                        
                        # Check if center of bag is inside the zone
                        is_in_zone = (zone_x1 < cx < zone_x2) and (zone_y1 < cy < zone_y2)
                        
                        if is_in_zone:
                            if track_id not in counted_ids:
                                # NEW VALID BAG
                                current_count += 1
                                counted_ids.add(track_id)
                                cv2.circle(annotated_frame, (int(cx), int(cy)), 8, (0, 255, 0), -1)
                                cv2.rectangle(annotated_frame, (int(x-w/2), int(y-h/2)), (int(x+w/2), int(y+h/2)), (0, 255, 0), 2)
                                if on_update:
                                    try:
                                        on_update({"count": current_count, "frame_idx": frame_idx})
                                    except:
                                        pass
                            else:
                                # ALREADY COUNTED
                                cv2.circle(annotated_frame, (int(cx), int(cy)), 5, (0, 255, 0), -1)
                        else:
                            # OUTSIDE ZONE
                            cv2.circle(annotated_frame, (int(cx), int(cy)), 5, (0, 0, 255), -1)

            # Draw counting info
            mode_label = "Scanner" if mode == "scanning" else "Static (Max)"
            cv2.putText(annotated_frame, f"Total Bags ({mode_label}): {current_count}", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            
            # Write merged frame
            out.write(annotated_frame)
            
            # Broadcast Frame (Live Feedback)
            # v13.7 Performance Fix: Skip broadcasting if frame_idx is not a multiple of 3 to save WebSocket/CPU bandwidth
            if on_update and frame_idx % 3 == 0: 
                try:
                    import base64
                    _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 50]) # Quality reduced to 50
                    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                    on_update({"type": "frame", "data": jpg_as_text, "count": current_count})
                except Exception as e:
                    print(f"Frame broadcast failed: {e}")

            frame_idx += 1

        cap.release()
        out.release()
        
        # Update global total
        # self.total_count += current_count # v13.5 Disabled for session isolation
        
        print(f"Processed video saved to {output_path} | Final Count: {current_count}")
        return {"count": current_count, "status": "completed"}

    def process_image(self, image_path, output_path, on_update=None, mode="static"):
        """
        Processes a single image file for bag counting.
        """
        import cv2
        import numpy as np
        from PIL import Image, ImageOps

        print(f"Starting image processing: {image_path} (Mode: {mode})")
        
        # v14.45: Fused Drawing (Absolute Alignment)
        try:
            pil_img = Image.open(image_path)
            pil_img = ImageOps.exif_transpose(pil_img)
            frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"PIL loading failed: {e}. Falling back to OpenCV.")
            frame = cv2.imread(image_path)

        if frame is None:
            return {"count": 0, "status": "failed", "error": f"Could not decode image {image_path}"}
            
        orig_h, orig_w = frame.shape[:2]
        
        # 1. Scale Image for AI (Max Dim 1280)
        # This keeps the aspect ratio natural for the model
        scale_ai = 1280 / max(orig_w, orig_h)
        ai_w, ai_h = int(orig_w * scale_ai), int(orig_h * scale_ai)
        ai_frame = cv2.resize(frame, (ai_w, ai_h), interpolation=cv2.INTER_AREA)
        
        # 2. Detect on the Resized Image (No padding yet)
        final_boxes, _ = self.detect_with_tiling(ai_frame, strict=False)
        
        # 3. Draw directly on the AI Frame (Absolute Sync)
        if len(final_boxes) > 0:
            for box in final_boxes:
                x1, y1, x2, y2 = map(int, box[:4])
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                cv2.rectangle(ai_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.circle(ai_frame, (cx, cy), 6, (0, 255, 0), -1)
        
        count = len(final_boxes)
        cv2.putText(ai_frame, f"STATIC IMAGE COUNT: {count}", (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2)
        
        # 4. Final Letterbox for UI (1280x720)
        # We place the ALREADY DRAWN image onto the canvas
        canvas_w, canvas_h = 1280, 720
        canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
        
        scale_ui = min(canvas_w / ai_w, canvas_h / ai_h)
        new_w, new_h = int(ai_w * scale_ui), int(ai_h * scale_ui)
        resized_annotated = cv2.resize(ai_frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        offset_x = (canvas_w - new_w) // 2
        offset_y = (canvas_h - new_h) // 2
        canvas[offset_y:offset_y+new_h, offset_x:offset_x+new_w] = resized_annotated
        
        # Calibration Mark (Top Left of Canvas)
        cv2.rectangle(canvas, (5, 5), (45, 45), (0, 0, 255), 2)
        
        # Save and Broadcast
        cv2.imwrite(output_path, canvas)
        
        if on_update:
            try:
                import base64
                _, buffer = cv2.imencode('.jpg', canvas)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                on_update({"type": "frame", "data": jpg_as_text, "count": count})
            except Exception as e:
                print(f"Frame broadcast failed: {e}")

        print(f"Processed image saved to {output_path} | Final Count: {count}")
        return {
            "count": count, 
            "status": "completed", 
            "video_url": f"/download/{os.path.basename(output_path)}",
            "is_image": True
        }
    # Generator for future streaming support
    # def process_video_generator(self, video_path, line_y=500):
    #     ... implementation deferred ...
