import sys
import os

# Add project root to path to allow importing ai_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from ai_service.inference import inference_service
try:
    from ai_service.object_detection import detect_objects
except ImportError:
    print("Warning: Could not import object_detection. Make sure ultralytics is installed.")
    detect_objects = None

class AIService:
    def detect_garbage(self, image_path: str) -> bool:
        """
        Uses a hybrid pipeline to detect garbage.
        1. MobileNetV2 Binary Classifier (Fast, good for piles).
        2. YOLOv8 Object Detection (Slower, good for small scattered items).
        """
        # Step 1: Binary Classification
        is_garbage_binary = inference_service.predict(image_path)
        
        if is_garbage_binary:
            return True
            
        # Step 2: Object Detection (Fallback for small items)
        if detect_objects:
            detections = detect_objects(image_path, conf_threshold=0.25)
            # If we found any objects (people are already filtered out by detect_objects)
            if len(detections) > 0:
                print(f"Hybrid Pipeline: Binary missed it, but YOLO found {len(detections)} objects.")
                return True
                
        return False

    def detect_garbage_bytes(self, image_bytes: bytes) -> bool:
        # For bytes, we currently only support the binary model 
        # because YOLO expects a file path or numpy array.
        # We could save to temp file if needed, but for now let's stick to binary.
        return inference_service.predict_bytes(image_bytes)

    def verify_cleanup(self, original_image_path: str, cleanup_image_path: str) -> bool:
        """
        Verifies cleanup.
        Logic: The cleanup image should NOT be detected as garbage (i.e., it should be 'clean').
        """
        is_garbage = inference_service.predict(cleanup_image_path)
        # If it's NOT garbage, then it's clean -> Verification Passed
        return not is_garbage

ai_service = AIService()
