import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from ai_service.model import create_model
import os

# Configuration
DATASET_DIR = 'ai_service/dataset'
MODEL_SAVE_PATH = 'ai_service/models/waste_model.h5'
BATCH_SIZE = 32
EPOCHS = 5 # Small number for demo/dummy data
IMG_SIZE = (224, 224)

def train():
    if not os.path.exists(DATASET_DIR):
        print("Dataset directory not found!")
        return

    # Data Augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )

    print("Loading training data...")
    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )

    print("Loading validation data...")
    validation_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )

    # Create and Train Model
    model = create_model()
    print("Starting training...")
    model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=validation_generator
    )

    # Save Model
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train()
