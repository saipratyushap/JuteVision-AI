import cv2
import torch
import numpy as np
import os
from ultralytics import YOLO

try:
    from .utils import detect_with_tiling_shared
    from .gemini_auditor import GeminiAuditor
except (ImportError, ValueError):
    from app.utils import detect_with_tiling_shared # type: ignore
    from app.gemini_auditor import GeminiAuditor # type: ignore

class VolumeEstimator:
    def __init__(self, model_name="boxes_custom.pt"):
        print("Initializing VolumeEstimator...")
        self.device = self._get_device()
        
        # Load the YOLO model
        current_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(os.path.dirname(current_dir), "models")
        model_path = os.path.join(models_dir, model_name)
        if not os.path.exists(model_path):
            print(f"Warning: Model not found at {model_path}")
            self.model = None
        else:
            self.model = YOLO(model_path)
            if self.model is not None:
                self.model.to(self.device)
                print(f"VolumeEstimator loaded model on {self.device}")

        self.auditor = GeminiAuditor()

    def _get_device(self):
        if torch.backends.mps.is_available():
            return "mps"
        elif torch.cuda.is_available():
            return "cuda"
        return "cpu"

    def _estimate_total_volume(self, boxes, width, height, depth_override=None):
        """
        Predicts hidden sacks by counting visible rows/columns and inferring depth.
        """
        if len(boxes) == 0:
            return {"visible_count": 0, "estimated_total": 0, "depth_layers": 0, "depth_override_used": False}

        visible_count = len(boxes)

        # 1. Sack Profiling
        widths = [b[2] for b in boxes]
        heights = [b[3] for b in boxes]
        median_w = np.median(widths)
        median_h = np.median(heights)

        if median_w <= 0 or median_h <= 0:
            return {"visible_count": visible_count, "estimated_total": visible_count, "depth_layers": 1, "depth_override_used": False}

        # 2. Depth Estimation
        depth_override_used = False
        if depth_override is not None and str(depth_override).strip().isdigit():
            estimated_depth_layers = int(depth_override)
            depth_override_used = True
        else:
            # Count visible rows by clustering y-centroids
            cy_list = sorted([b[1] for b in boxes])
            rows = 1
            for i in range(1, len(cy_list)):
                if cy_list[i] - cy_list[i-1] > median_h * 0.55:
                    rows += 1

            # Count visible columns by clustering x-centroids
            cx_list = sorted([b[0] for b in boxes])
            cols = 1
            for i in range(1, len(cx_list)):
                if cx_list[i] - cx_list[i-1] > median_w * 0.55:
                    cols += 1

            # Overall pile aspect ratio for orientation cue
            min_x = min([b[0] - b[2]/2 for b in boxes])
            max_x = max([b[0] + b[2]/2 for b in boxes])
            min_y = min([b[1] - b[3]/2 for b in boxes])
            max_y = max([b[1] + b[3]/2 for b in boxes])
            stack_width = max_x - min_x
            stack_height = max_y - min_y
            aspect_ratio = stack_width / max(1, stack_height)

            # Size variation hints at perspective (high std = deeper stack visible)
            size_variation = np.std(widths) / max(1, median_w)

            # 3. Warehouse Depth Engine (v14.56)
            # v14.56: Forced 6-Layer depth for dense warehouse walls
            if visible_count > 25:
                # Forced 6-Layer profile for warehouse walls
                estimated_depth_layers = 6
            elif visible_count > 15:
                # Dense stack profile: 4-5 layers
                estimated_depth_layers = max(4, min(5, round(rows * 0.8 + cols * 0.2)))
            elif aspect_ratio > 2.5:
                # Wide side-profile
                estimated_depth_layers = max(2, min(8, rows))
            elif aspect_ratio < 0.6:
                # Tall narrow shot
                estimated_depth_layers = max(3, min(10, round(cols * 1.5)))
            else:
                # Standard view
                base_depth = max(2, round((rows + cols) / 2))
                estimated_depth_layers = round(base_depth * (1 + size_variation * 0.4))
            
            estimated_depth_layers = max(1, min(12, estimated_depth_layers))
        
        # 4. Total Volume Prediction with Packing Efficiency
        # v14.56: High efficiency (94%) for tight 6-layer warehouse stacks
        packing_efficiency = 0.94 
        raw_volume_estimate = visible_count * estimated_depth_layers
        predicted_total = round(raw_volume_estimate * packing_efficiency)
        
        # Sanity Guard
        predicted_total = max(visible_count, predicted_total)

        return {
            "visible_count": visible_count,
            "estimated_total": predicted_total,
            "depth_layers": estimated_depth_layers,
            "depth_override_used": depth_override_used
        }

    def process_image(self, image_path, output_path, on_update=None, depth_override=None):
        if self.model is None:
            return {"count": 0, "status": "model_not_loaded"}

        # v14.53: Wall-Scanner Mode (Ultra-High Recall for Dense Stacks)
        import cv2
        import numpy as np
        from PIL import Image, ImageOps

        try:
            pil_img = Image.open(image_path)
            pil_img = ImageOps.exif_transpose(pil_img)
            frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Volume PIL failed: {e}")
            frame = cv2.imread(image_path)

        if frame is None:
            return {"count": 0, "status": "failed", "error": "Could not load image"}

        orig_h, orig_w = frame.shape[:2]
        
        # 1. Scale Image for AI
        scale_ai = 1280 / max(orig_w, orig_h)
        ai_w, ai_h = int(orig_w * scale_ai), int(orig_h * scale_ai)
        ai_frame = cv2.resize(frame, (ai_w, ai_h), interpolation=cv2.INTER_AREA)

        # 2. Wall-Scanner Detection: Ultra-Dense 8x8 Grid
        # v14.54: Using adaptive grid_size=8 and recall=0.12 for warehouse walls
        final_boxes, _ = detect_with_tiling_shared(self.model, ai_frame, conf_img=0.20, conf_tile=0.12, grid_size=8)
        
        # 3. Draw on the AI Frame
        boxes_data = []
        if len(final_boxes) > 0:
            for box in final_boxes:
                x1, y1, x2, y2 = map(int, box[:4])
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                boxes_data.append([cx, cy, x2-x1, y2-y1])
                cv2.rectangle(ai_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.circle(ai_frame, (cx, cy), 6, (0, 255, 0), -1)

        # 4. Volume Estimation
        estimation = self._estimate_total_volume(boxes_data, ai_w, ai_h, depth_override)
        
        # HUD text intentionally omitted — counts shown in the UI AI Insight panel

        # 6. Final Letterbox for UI
        canvas_w, canvas_h = 1280, 720
        canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
        scale_ui = min(canvas_w / ai_w, canvas_h / ai_h)
        new_w, new_h = int(ai_w * scale_ui), int(ai_h * scale_ui)
        resized_annotated = cv2.resize(ai_frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        offset_x = (canvas_w - new_w) // 2
        offset_y = (canvas_h - new_h) // 2
        canvas[offset_y:offset_y+new_h, offset_x:offset_x+new_w] = resized_annotated
        
        cv2.rectangle(canvas, (5, 5), (45, 45), (0, 0, 255), 2)
        cv2.imwrite(output_path, canvas)

        if on_update:
            try:
                import base64
                _, buffer = cv2.imencode('.jpg', canvas)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                on_update({"type": "frame", "data": jpg_as_text, "count": estimation["estimated_total"]})
            except: pass

        # Gemini AI Audit — secondary verification using Vision LLM
        audit = self.auditor.audit_count(
            image_path=image_path,
            visible_count=estimation["visible_count"],
            depth_layers=estimation["depth_layers"],
            predicted_total=estimation["estimated_total"],
        )

        final_count = audit["audited_count"] if audit["audit_available"] else estimation["estimated_total"]

        return {
            "status": "completed",
            "count": final_count,
            "visible_count": estimation["visible_count"],
            "depth_layers": estimation["depth_layers"],
            "estimated_total": estimation["estimated_total"],
            "depth_override_used": estimation.get("depth_override_used", False),
            "estimation_mode": True,
            "audited_count":   audit["audited_count"],
            "gemini_reasoning": audit["reasoning"],
            "audit_available": audit["audit_available"],
            "gemini_visible_rows":   audit.get("visible_rows", 0),
            "gemini_visible_cols":   audit.get("visible_cols", 0),
            "gemini_estimated_depth": audit.get("estimated_depth", estimation["depth_layers"]),
            "gemini_volume_formula":  audit.get("volume_formula", ""),
        }

    def process_video(self, video_path: str, output_path: str, on_update=None, depth_override=None):
        if self.model is None:
            return {"count": 0, "status": "model_not_loaded"}

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"count": 0, "status": "failed_to_open_video"}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25

        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        best_estimation = {"visible_count": 0, "estimated_total": 0, "depth_layers": 0, "depth_override_used": False}
        frame_idx = 0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
                
            if frame_idx % 5 != 0:
                frame_idx += 1
                continue

            # v14.54: High-Recall for Video Volume (grid_size=8, conf=0.12)
            final_boxes, _ = detect_with_tiling_shared(self.model, frame, conf_img=0.20, conf_tile=0.12, grid_size=8)
            
            annotated_frame = frame.copy()
            boxes_data = []
            
            for box in final_boxes:
                x1, y1, x2, y2 = map(int, box[:4])
                w, h = x2 - x1, y2 - y1
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                boxes_data.append([cx, cy, w, h])
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            current_estimation = self._estimate_total_volume(boxes_data, width, height, depth_override)
            if current_estimation["visible_count"] > best_estimation["visible_count"]:
                best_estimation = current_estimation
                
            cv2.putText(annotated_frame, f"Visible Boxes Detected: {best_estimation['visible_count']}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"Quantity Count Pro Mode Prediction: {best_estimation['estimated_total']}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

            out.write(annotated_frame)
            
            if on_update and frame_idx % 5 == 0:
                import base64
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                on_update({"type": "frame", "data": jpg_as_text, "count": best_estimation["estimated_total"]})
                
            frame_idx += 1

        cap.release()
        out.release()

        return {
            "status": "completed",
            "count": best_estimation["estimated_total"],
            "visible_count": best_estimation["visible_count"],
            "depth_layers": best_estimation["depth_layers"],
            "estimated_total": best_estimation["estimated_total"],
            "depth_override_used": best_estimation.get("depth_override_used", False),
            "estimation_mode": True
        }
