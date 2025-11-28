import os
from PIL import Image
import numpy as np

def create_dummy_images(category, count=10):
    path = f"ai_service/dataset/{category}"
    os.makedirs(path, exist_ok=True)
    for i in range(count):
        # Create a random image
        img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        img.save(f"{path}/{category}_{i}.jpg")
    print(f"Created {count} dummy images for {category}")

if __name__ == "__main__":
    create_dummy_images("garbage")
    create_dummy_images("clean")
