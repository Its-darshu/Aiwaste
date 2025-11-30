import cv2
import numpy as np
from ultralytics import YOLO
import os

# Load the YOLOv8 model (nano version for speed)
# It will download 'yolov8n.pt' automatically if not present
model = YOLO('yolov8n.pt')

def detect_objects(image_path, conf_threshold=0.25):
    """
    Detects objects in an image using a coarse-to-fine tiling approach.
    
    1. Runs inference on the full image.
    2. Splits the image into a 2x2 grid (with overlap) and runs inference on each tile.
    3. Merges predictions using Non-Maximum Suppression (NMS).
    4. Filters out 'person' class (class_id=0) to ignore people.
    
    Args:
        image_path (str): Path to the image file.
        conf_threshold (float): Confidence threshold for detections.
        
    Returns:
        list: A list of dictionaries, each containing:
              {'label': str, 'confidence': float, 'box': [x1, y1, x2, y2]}
    """
    
    # Read the image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image at {image_path}")
        return []

    height, width = img.shape[:2]
    
    all_detections = []

    # --- Stage 1: Coarse Inference (Full Image) ---
    results_full = model(img, verbose=False)
    for r in results_full:
        boxes = r.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            # Class 0 is 'person' in COCO dataset. We ignore people.
            if cls_id == 0:
                continue
                
            conf = float(box.conf[0])
            if conf < conf_threshold:
                continue
            
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            label = model.names[cls_id]
            
            all_detections.append({
                'label': label,
                'confidence': conf,
                'box': [x1, y1, x2, y2]
            })

    # --- Stage 2: Fine-grained Inference (Tiling) ---
    # We'll use a 2x2 grid. 
    # To ensure we catch objects on the boundaries, we can use overlap.
    # Simple 2x2 split:
    # Top-Left, Top-Right, Bottom-Left, Bottom-Right
    
    tile_h = height // 2
    tile_w = width // 2
    
    # Define tiles: (x_start, y_start, x_end, y_end)
    # We add a bit of overlap if we wanted, but for now let's do strict 2x2 
    # plus a center crop could be added later if needed.
    tiles = [
        (0, 0, tile_w, tile_h),          # Top-Left
        (tile_w, 0, width, tile_h),      # Top-Right
        (0, tile_h, tile_w, height),     # Bottom-Left
        (tile_w, tile_h, width, height)  # Bottom-Right
    ]
    
    for tx1, ty1, tx2, ty2 in tiles:
        tile_img = img[ty1:ty2, tx1:tx2]
        
        # Run inference on the tile
        results_tile = model(tile_img, verbose=False)
        
        for r in results_tile:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                if cls_id == 0: # Ignore people
                    continue
                    
                conf = float(box.conf[0])
                if conf < conf_threshold:
                    continue
                
                # Local coordinates in the tile
                lx1, ly1, lx2, ly2 = box.xyxy[0].tolist()
                
                # Map back to global coordinates
                gx1 = lx1 + tx1
                gy1 = ly1 + ty1
                gx2 = lx2 + tx1
                gy2 = ly2 + ty1
                
                # Clamp to image boundaries (just in case)
                gx1 = max(0, min(width, gx1))
                gy1 = max(0, min(height, gy1))
                gx2 = max(0, min(width, gx2))
                gy2 = max(0, min(height, gy2))
                
                label = model.names[cls_id]
                
                all_detections.append({
                    'label': label,
                    'confidence': conf,
                    'box': [gx1, gy1, gx2, gy2]
                })

    # --- Stage 3: Non-Maximum Suppression (NMS) ---
    # Since we have detections from full image AND tiles, we will have duplicates.
    # We need to merge them.
    
    final_detections = nms(all_detections, iou_threshold=0.5)
    
    return final_detections

def nms(detections, iou_threshold=0.5):
    """
    Applies Non-Maximum Suppression to a list of detections.
    """
    if not detections:
        return []
        
    # Sort by confidence (descending)
    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    
    keep = []
    
    while detections:
        current = detections.pop(0)
        keep.append(current)
        
        # Compare with remaining detections
        remaining = []
        for other in detections:
            # If same class and high overlap, suppress it
            if current['label'] == other['label']:
                iou = calculate_iou(current['box'], other['box'])
                if iou < iou_threshold:
                    remaining.append(other)
            else:
                remaining.append(other)
        
        detections = remaining
        
    return keep

def calculate_iou(box1, box2):
    """
    Calculates Intersection over Union (IoU) between two boxes.
    Box format: [x1, y1, x2, y2]
    """
    x1_a, y1_a, x2_a, y2_a = box1
    x1_b, y1_b, x2_b, y2_b = box2
    
    # Intersection
    x1_i = max(x1_a, x1_b)
    y1_i = max(y1_a, y1_b)
    x2_i = min(x2_a, x2_b)
    y2_i = min(y2_a, y2_b)
    
    w_i = max(0, x2_i - x1_i)
    h_i = max(0, y2_i - y1_i)
    intersection = w_i * h_i
    
    # Union
    area_a = (x2_a - x1_a) * (y2_a - y1_a)
    area_b = (x2_b - x1_b) * (y2_b - y1_b)
    union = area_a + area_b - intersection
    
    if union == 0:
        return 0
        
    return intersection / union
