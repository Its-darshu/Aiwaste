import kagglehub
import shutil
import os
import glob

def download_and_organize():
    print("Downloading dataset...")
    path = kagglehub.dataset_download("farzadnekouei/trash-type-image-dataset")
    print("Path to dataset files:", path)

    target_dir = "ai_service/dataset/garbage"
    os.makedirs(target_dir, exist_ok=True)

    # The dataset likely has subfolders for each type.
    # We want to treat them ALL as "garbage".
    
    # Walk through the dataset directory
    count = 0
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                src_path = os.path.join(root, file)
                # Create a unique name to avoid collisions
                unique_name = f"{count}_{file}"
                dst_path = os.path.join(target_dir, unique_name)
                
                shutil.copy2(src_path, dst_path)
                count += 1
                
    print(f"Successfully moved {count} images to {target_dir}")

    # Download Clean Data (Intel Image Classification)
    print("Downloading clean dataset...")
    clean_path = kagglehub.dataset_download("puneet6060/intel-image-classification")
    print("Path to clean dataset:", clean_path)
    
    clean_target_dir = "ai_service/dataset/clean"
    os.makedirs(clean_target_dir, exist_ok=True)
    
    clean_count = 0
    # We will look for 'street' and 'forest' folders in the dataset
    # Structure is usually: seg_train/seg_train/street, etc.
    for root, dirs, files in os.walk(clean_path):
        # Check if we are in a 'street' or 'forest' or 'mountain' folder
        folder_name = os.path.basename(root).lower()
        if folder_name in ['street', 'forest', 'mountain', 'glacier']:
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    src_path = os.path.join(root, file)
                    unique_name = f"{clean_count}_{file}"
                    dst_path = os.path.join(clean_target_dir, unique_name)
                    shutil.copy2(src_path, dst_path)
                    clean_count += 1
                    
                    # Limit to ~2500 to match garbage dataset
                    if clean_count >= 2600:
                        break
        if clean_count >= 2600:
            break
            
    print(f"Successfully moved {clean_count} images to {clean_target_dir}")

if __name__ == "__main__":
    download_and_organize()
