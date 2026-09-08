import sys
import os
import torch
import cv2
import numpy as np

# Add the lunara-backend directory to the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.lightglue_model import LightGlueModel
from app.matchers.lightglue import LightGlueMatcher
from lightglue.utils import load_image

def main():
    print("Initializing LightGlue configuration...")
    config = {
        "extractor": "superpoint",
        "max_num_keypoints": 2048,
        "filter_threshold": 0.1
    }
    
    print("Loading model...")
    model = LightGlueModel(config)
    matcher = LightGlueMatcher(model)
    
    # Download sample images if they don't exist
    url1 = "https://raw.githubusercontent.com/cvg/LightGlue/main/assets/sacre_coeur1.jpg"
    url2 = "https://raw.githubusercontent.com/cvg/LightGlue/main/assets/sacre_coeur2.jpg"
    
    img1_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', 'test_img1.jpg')
    img2_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', 'test_img2.jpg')
    
    import urllib.request
    if not os.path.exists(img1_path):
        print("Downloading sample image 1...")
        urllib.request.urlretrieve(url1, img1_path)
    if not os.path.exists(img2_path):
        print("Downloading sample image 2...")
        urllib.request.urlretrieve(url2, img2_path)
        
    print(f"Loading images from {img1_path} and {img2_path}...")
    image0 = load_image(img1_path)
    image1 = load_image(img2_path)
    
    print("Matching images...")
    result = matcher.match(image0, image1)
    
    print("\n--- MATCHING RESULT ---")
    print(f"Method: {result.method}")
    print(f"Num Keypoints Image A: {result.num_keypoints_a}")
    print(f"Num Keypoints Image B: {result.num_keypoints_b}")
    print(f"Number of Matches: {result.num_matches}")
    print(f"Runtime: {result.runtime_seconds:.4f} seconds")
    print("-----------------------")
    
    if result.num_matches > 0:
        print("SUCCESS! LightGlue matching pipeline is working.")
    else:
        print("WARNING: No matches found.")

if __name__ == "__main__":
    main()
