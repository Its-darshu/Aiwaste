import sys
import os

# Add project root to path to allow importing ai_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from ai_service.inference import inference_service

class AIService:
    def detect_garbage(self, image_path: str) -> bool:
        """
        Uses the real trained model to detect garbage.
        """
        return inference_service.predict(image_path)

    def detect_garbage_bytes(self, image_bytes: bytes) -> bool:
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
