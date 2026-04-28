import cv2
import numpy as np
import torch

def get_centroid(mask_logits):
    """
    Calculate centroid (cx, cy) from mask logits.
    """
    # Convert logits to binary mask (threshold > 0.0)
    mask = (mask_logits > 0.0).float()
    
    if mask.sum() == 0:
        return None

    # Calculate centroid using moments or simple mean of coordinates
    # shape is (1, H, W) or (H, W)
    if len(mask.shape) == 3:
        mask = mask.squeeze(0)
        
    h, w = mask.shape
    y_indices, x_indices = torch.where(mask > 0)
    
    if len(y_indices) == 0:
        return None
        
    cy = y_indices.float().mean().item()
    cx = x_indices.float().mean().item()
    
    return (cx, cy)

def annotate_frame(frame, detections, total_count, line_y=500):
    """
    Draw masks, boxes, and IDs on the frame using OpenCV.
    Expects detections to be a dict or similar structure.
    """
    if not isinstance(detections, dict):
        return frame

    obj_ids = detections.get("obj_ids", [])
    mask_logits = detections.get("mask_logits", [])

    for i, obj_id in enumerate(obj_ids):
        # Draw Mask
        if i < len(mask_logits):
            mask = (mask_logits[i] > 0.0).cpu().numpy().squeeze()
            if mask.ndim == 2:
                # Create colored mask overlay
                color = ((obj_id * 50) % 255, (obj_id * 100) % 255, (obj_id * 150) % 255)
                colored_mask = np.zeros_like(frame, dtype=np.uint8)
                colored_mask[mask > 0] = color
                frame = cv2.addWeighted(frame, 1, colored_mask, 0.5, 0)
        
        # Draw ID (at centroid)
        centroid = get_centroid(mask_logits[i])
        if centroid:
            cx, cy = int(centroid[0]), int(centroid[1])
            cv2.putText(frame, f"ID: {obj_id}", (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

    # Draw Global Count
    cv2.putText(frame, f"Total Count: {total_count}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    # Draw Line
    h, w, _ = frame.shape
    cv2.line(frame, (0, line_y), (w, line_y), (0, 255, 0), 2)
    
    return frame

def detect_with_tiling_shared(model, frame, conf_img=0.35, conf_tile=0.30, grid_size=6):
    """
    Shared high-accuracy detection utility.
    v14.54: Warehouse Recall Engine (Adaptive Density & Fusion)
    """
    import torch
    import numpy as np

    def _to6(arr):
        if arr.shape[1] == 6: return arr
        if arr.shape[1] > 6: return arr[:, :6]
        return np.empty((0, 6), dtype=arr.dtype)

    if model is None: return torch.empty((0, 4)), []

    height, width = frame.shape[:2]
    all_detections = []

    # 1. Primary AI Pass
    res = model.predict(frame, conf=conf_img, iou=0.20, imgsz=1280, verbose=False)
    if res and len(res[0].boxes) > 0:
        all_detections.append(_to6(res[0].boxes.data.cpu().numpy()))

    # 2. Adaptive Dense Scan (Uses grid_size parameter)
    t_w, t_h = int(width * 0.35), int(height * 0.35)
    for r in range(grid_size):
        for c in range(grid_size):
            tx1 = int(c * (width - t_w) / (grid_size - 1)) if grid_size > 1 else 0
            ty1 = int(r * (height - t_h) / (grid_size - 1)) if grid_size > 1 else 0
            tile_img = frame[ty1:ty1+t_h, tx1:tx1+t_w]
            if tile_img.size == 0: continue
            res = model.predict(tile_img, conf=conf_tile, iou=0.20, verbose=False)
            if res and len(res[0].boxes) > 0:
                data = _to6(res[0].boxes.data.cpu().numpy().copy())
                data[:, [0, 2]] += tx1
                data[:, [1, 3]] += ty1
                all_detections.append(data)

    if not all_detections: return torch.empty((0, 4)), []
    combined = np.concatenate(all_detections)

    # 3. Precision Post-Processing
    idxs = np.argsort(combined[:, 4])[::-1]
    sorted_combined = combined[idxs]
    
    final_unique = []
    n_total = len(sorted_combined)
    keep_mask = np.ones(n_total, dtype=bool)

    # Adaptive Fusion Radius: 45% for high-recall (dense), 55% for standard
    fusion_radius = 0.45 if conf_tile < 0.20 else 0.55

    for i in range(n_total):
        if not keep_mask[i]: continue
        
        b1 = sorted_combined[i]
        x1, y1, x2, y2 = b1[:4]
        w, h = x2 - x1, y2 - y1
        cx1, cy1 = (x1 + x2) / 2, (y1 + y2) / 2
        diag1 = np.sqrt(w**2 + h**2)
            
        final_unique.append(b1)
        
        for j in range(i + 1, n_total):
            if not keep_mask[j]: continue
            b2 = sorted_combined[j]
            cx2, cy2 = (b2[0] + b2[2]) / 2, (b2[1] + b2[3]) / 2
            
            # --- Dynamic Proximity Fusion ---
            dist = np.sqrt((cx1-cx2)**2 + (cy1-cy2)**2)
            if dist < diag1 * fusion_radius: 
                keep_mask[j] = False
                continue
                
            # --- High-Overlap Deduplication ---
            xi1, yi1, xi2, yi2 = max(x1, b2[0]), max(y1, b2[1]), min(x2, b2[2]), min(y2, b2[3])
            inter = max(0, xi2-xi1) * max(0, yi2-yi1)
            a1, a2 = w*h, (b2[2]-b2[0])*(b2[3]-b2[1])
            if inter / min(a1, a2) > 0.50:
                keep_mask[j] = False

    # 4. Geometry Recovery Engine
    fused_boxes = np.array(final_unique)
    if len(fused_boxes) > 0:
        for i in range(len(fused_boxes)):
            b = fused_boxes[i]
            x1, y1, x2, y2 = b[:4]
            w, h = x2 - x1, y2 - y1
            cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
            
            aspect = w / max(1, h)
            if aspect < 0.7: # If skinny (Label Lock)
                new_w = h * 1.3
                fused_boxes[i, 0] = cx - new_w / 2
                fused_boxes[i, 1] = cy - h / 2
                fused_boxes[i, 2] = cx + new_w / 2
                fused_boxes[i, 3] = cy + h / 2
            elif aspect > 2.8: # If too flat
                new_h = w / 1.5
                fused_boxes[i, 1] = cy - new_h / 2
                fused_boxes[i, 3] = cy + new_h / 2
            
            fused_boxes[i, 0] = max(0, fused_boxes[i, 0])
            fused_boxes[i, 1] = max(0, fused_boxes[i, 1])
            fused_boxes[i, 2] = min(width, fused_boxes[i, 2])
            fused_boxes[i, 3] = min(height, fused_boxes[i, 3])

    if len(fused_boxes) == 0: return torch.empty((0, 4)), []
    return torch.tensor(fused_boxes[:, :4]), list(range(len(fused_boxes)))
