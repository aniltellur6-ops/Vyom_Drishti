import sys
import os
import cv2
import time
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.lightglue_model import LightGlueModel
from app.matchers.lightglue import LightGlueMatcher
from app.geometry.ransac import GeometricVerifier
from app.registration.engine import RegistrationEngine
from lightglue.utils import load_image

def main():
    print("--- LUNARA Pipeline Execution ---")
    
    # 1. Configuration
    config = {
        "extractor": "superpoint",
        "max_num_keypoints": 2048,
        "filter_threshold": 0.0
    }
    
    # Paths to IMAGE_1 and IMAGE_2
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    image_a_path = os.path.join(base_dir, "SIH_DL_Pair001", "SIH_DL_Pair001", "02_clahe", "reference_lroc_clahe.png")
    image_b_path = os.path.join(base_dir, "SIH_DL_Pair001", "SIH_DL_Pair001", "02_clahe", "moving_ohrc_clahe.png")
    
    if not os.path.exists(image_a_path) or not os.path.exists(image_b_path):
        print("Error: Could not find test images.")
        print(f"Looking for:\n1. {image_a_path}\n2. {image_b_path}")
        return
        
    print(f"Loading Image 1 (Reference): {image_a_path}")
    print(f"Loading Image 2 (Moving): {image_b_path}")
    
    # 2. Ingestion / Loading
    image_a_tensor = load_image(image_a_path)
    image_b_tensor = load_image(image_b_path)
    
    image_a_cv = cv2.imread(image_a_path, cv2.IMREAD_GRAYSCALE)
    image_b_cv = cv2.imread(image_b_path, cv2.IMREAD_GRAYSCALE)
    
    # 3. Matching
    print("Executing Matching (SuperPoint + LightGlue)...")
    model = LightGlueModel(config)
    matcher = LightGlueMatcher(model)
    
    match_result = matcher.match(image_a_tensor, image_b_tensor)
    
    print(f"Found {match_result.num_matches} matches in {match_result.runtime_seconds:.2f}s")
    
    # 4. Geometry / RANSAC
    print("Executing Geometric Verification (RANSAC)...")
    verifier = GeometricVerifier()
    try:
        geo_result = verifier.verify(
            match_result.keypoints_a, 
            match_result.keypoints_b, 
            match_result.matches, 
            model="affine"
        )
    except ValueError as e:
        print(f"Failed to compute geometry: {e}")
        geo_result = None
    
    if not geo_result:
        print("Failed to compute geometry.")
        return
        
    print(f"Inliers: {geo_result.num_inliers} ({geo_result.inlier_ratio*100:.1f}%)")
    print(f"RMSE: {geo_result.rmse:.3f} pixels")
    
    # 5. Registration
    print("Executing Registration...")
    reg_engine = RegistrationEngine()
    
    start_reg = time.time()
    # We warp Image B to match Image A
    registered_image = reg_engine.register(
        image_b_cv, 
        image_a_cv.shape, 
        geo_result.transformation_matrix, 
        model="affine"
    )
    reg_time = time.time() - start_reg
    
    # 6. Quality / Output
    print(f"Registration completed in {reg_time:.4f}s")
    
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'outputs')
    os.makedirs(out_dir, exist_ok=True)
    
    out_img_path = os.path.join(out_dir, "registered_output.png")
    cv2.imwrite(out_img_path, registered_image)
    print(f"Saved registered image to {out_img_path}")
    
    # Create overlay for visualization
    overlay = cv2.addWeighted(image_a_cv, 0.5, registered_image, 0.5, 0)
    out_overlay_path = os.path.join(out_dir, "registered_overlay.png")
    cv2.imwrite(out_overlay_path, overlay)
    
    # Save experiment record
    record = {
        "experiment_id": "EXP-LUNARA-TEST-001",
        "method": "superpoint_lightglue",
        "matches": match_result.num_matches,
        "inliers": geo_result.num_inliers,
        "inlier_ratio": geo_result.inlier_ratio,
        "rmse": geo_result.rmse,
        "matching_runtime": match_result.runtime_seconds,
        "registration_runtime": reg_time
    }
    
    out_json = os.path.join(out_dir, "experiment_record.json")
    with open(out_json, "w") as f:
        json.dump(record, f, indent=2)
        
    print(json.dumps(record, indent=2))
    print("Pipeline Execution Complete!")

if __name__ == "__main__":
    main()
