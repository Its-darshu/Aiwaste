import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os

MODEL_PATH = 'ai_service/models/waste_model.h5'
IMG_SIZE = (224, 224)

class InferenceService:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = load_model(MODEL_PATH)
                print("Model loaded successfully.")
            except Exception as e:
                print(f"Failed to load model: {e}")
        else:
            print("Model file not found. Please train the model first.")

    def reload_model(self):
        print("Reloading model...")
        self.load_model()

    def predict(self, image_path):
        if not self.model:
            self.load_model()
            if not self.model:
                print("Model not loaded. Returning True (Mock behavior).")
                return True

        try:
            img = image.load_img(image_path, target_size=IMG_SIZE)
            img_array = image.img_to_array(img)
            return self._predict_array(img_array)
        except Exception as e:
            print(f"Prediction error: {e}")
            return False

    def predict_bytes(self, image_bytes):
        if not self.model:
            self.load_model()
            if not self.model:
                return True

        try:
            import io
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            img = img.resize(IMG_SIZE)
            img_array = image.img_to_array(img)
            return self._predict_array(img_array)
        except Exception as e:
            print(f"Prediction bytes error: {e}")
            return False

    def _predict_array(self, img_array):
        # Filter out dark images (noise/empty camera)
        brightness = np.mean(img_array)
        if brightness < 40: # Threshold for darkness (0-255)
            print(f"Image too dark (brightness: {brightness:.2f}). Ignoring.")
            return False

        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0

        prediction = self.model.predict(img_array)
        # Increased threshold to 0.85 to reduce false positives
        is_garbage = prediction[0][0] > 0.85
        print(f"Prediction: {prediction[0][0]} -> {'Garbage' if is_garbage else 'Clean'}")
        return bool(is_garbage)

inference_service = InferenceService()
