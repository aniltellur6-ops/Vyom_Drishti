import argparse
import time
import json
import csv
import torch
import cv2
import numpy as np
import matplotlib.pyplot as plt
import os

try:
    from lightglue import LightGlue, SuperPoint
    from lightglue.utils import load_image, rbd
    from lightglue import viz2d
except ImportError:
    print("Please install lightglue: pip install git+https://github.com/cvg/LightGlue.git")
    exit(1)


def run_sift_baseline(img1_path, img2_path):
    """Simple SIFT benchmark for comparison."""
    img1_cv = cv2.imread(img1_path, cv2.IMREAD_GRAYSCALE)
    img2_cv = cv2.imread(img2_path, cv2.IMREAD_GRAYSCALE)

    if img1_cv is None or img2_cv is None:
        return None

    sift = cv2.SIFT_create()
    start_time = time.time()
    
    kp1, des1 = sift.detectAndCompute(img1_cv, None)
    kp2, des2 = sift.detectAndCompute(img2_cv, None)
    
    if des1 is None or des2 is None or len(des1) < 2 or len(des2) < 2:
        return None

    bf = cv2.BFMatcher()
    matches = bf.knnMatch(des1, des2, k=2)

    good_matches = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 2)

    inliers_count = 0
    if len(src_pts) >= 3:
        _, inliers = cv2.estimateAffinePartial2D(dst_pts, src_pts, method=cv2.RANSAC, ransacReprojThreshold=3.0)
        if inliers is not None:
            inliers_count = int(np.sum(inliers))

    processing_time = time.time() - start_time

    return {
        "method": "SIFT Baseline",
        "candidate_matches": len(good_matches),
        "valid_inliers": inliers_count,
        "processing_time_sec": processing_time
    }


def match_superpoint_lightglue(img1_path, img2_path, prefix="dl", conf_thresh=0.0, output_dir="."):
    """
    Reusable model inference function for SuperPoint + LightGlue.
    img1_path: Reference (LROC)
    img2_path: Source/Moving (OHRC)
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device} for Deep Learning matching")

    image0 = load_image(img1_path).to(device) # Reference
    image1 = load_image(img2_path).to(device) # Source

    # Initialize SuperPoint and LightGlue (official pretrained weights)
    extractor = SuperPoint(max_num_keypoints=2048).eval().to(device)
    matcher = LightGlue(features='superpoint').eval().to(device)

    start_time = time.time()

    # Extract features
    feats0 = extractor.extract(image0)
    feats1 = extractor.extract(image1)
    
    kpts0_all = feats0['keypoints'][0].detach().cpu().numpy()
    kpts1_all = feats1['keypoints'][0].detach().cpu().numpy()

    # Match
    matches01 = matcher({"image0": feats0, "image1": feats1})

    # Remove batch dimension
    feats0, feats1, matches01 = [rbd(x) for x in [feats0, feats1, matches01]]

    matches = matches01['matches']
    scores = matches01['scores']
    num_raw_matches = len(matches)

    # Test confidence thresholds
    valid_mask = scores > conf_thresh
    matches = matches[valid_mask]
    scores = scores[valid_mask]
    num_filtered_matches = len(matches)

    # Extract match coordinates (Ref is 0, Src is 1)
    kpts_ref = feats0['keypoints'][matches[..., 0]].detach().cpu().numpy()
    kpts_src = feats1['keypoints'][matches[..., 1]].detach().cpu().numpy()
    scores_np = scores.detach().cpu().numpy()

    # OpenCV format for images to do RANSAC and visualization
    img1_cv = cv2.imread(img1_path, cv2.IMREAD_COLOR)
    img2_cv = cv2.imread(img2_path, cv2.IMREAD_COLOR)

    # Affine 2D RANSAC / MAGSAC++
    M_val = None
    inliers = np.zeros((len(kpts_src), 1), dtype=bool)
    rmse_val = 0.0
    inlier_ratio = 0.0
    registered_img2 = np.zeros_like(img1_cv)

    if len(kpts_src) >= 3:
        method = cv2.USAC_MAGSAC if hasattr(cv2, 'USAC_MAGSAC') else cv2.RANSAC
        M, inliers = cv2.estimateAffine2D(kpts_src, kpts_ref, method=method, ransacReprojThreshold=3.0)
        
        if inliers is not None:
            inliers = inliers.flatten().astype(bool)
            inlier_count = int(np.sum(inliers))
            inlier_ratio = inlier_count / len(kpts_src) if len(kpts_src) > 0 else 0
            
            if inlier_count > 0:
                # Independent Validation for RMSE
                inlier_indices = np.where(inliers)[0]
                if inlier_count > 10:
                    np.random.shuffle(inlier_indices)
                    split_idx = int(0.8 * inlier_count)
                    train_idx = inlier_indices[:split_idx]
                    val_idx = inlier_indices[split_idx:]
                    
                    # Refit on train
                    M_val, _ = cv2.estimateAffine2D(kpts_src[train_idx], kpts_ref[train_idx], method=method)
                    if M_val is None:
                        M_val = M # Fallback
                        val_idx = inlier_indices # Test on all
                else:
                    M_val = M
                    val_idx = inlier_indices
                
                # Calculate RMSE on val points
                val_src = kpts_src[val_idx]
                val_ref = kpts_ref[val_idx]
                
                if len(val_src) > 0 and M_val is not None:
                    val_src_homo = np.hstack([val_src, np.ones((len(val_src), 1))])
                    projected_src = (M_val @ val_src_homo.T).T
                    errors = np.linalg.norm(val_ref - projected_src, axis=1)
                    rmse_val = float(np.sqrt(np.mean(errors**2)))
                
                # Warp image using full transformation for display
                h, w = img1_cv.shape[:2]
                registered_img2 = cv2.warpAffine(img2_cv, M, (w, h))

    end_time = time.time()
    processing_time = end_time - start_time
    
    inliers_bool = inliers.flatten().astype(bool) if inliers is not None else np.zeros(len(kpts_src), dtype=bool)

    # Spatial coverage of INLIERS in source image
    if np.sum(inliers_bool) > 0:
        inlier_src = kpts_src[inliers_bool]
        min_x, min_y = np.min(inlier_src, axis=0)
        max_x, max_y = np.max(inlier_src, axis=0)
        coverage_area = (max_x - min_x) * (max_y - min_y)
        h2, w2 = img2_cv.shape[:2]
        spatial_coverage = float(coverage_area / (h2 * w2))
    else:
        spatial_coverage = 0.0

    mean_confidence = float(np.mean(scores_np[inliers_bool])) if np.sum(inliers_bool) > 0 else 0.0

    metrics = {
        "method": "SuperPoint + LightGlue",
        "num_source_keypoints": len(kpts1_all),
        "num_reference_keypoints": len(kpts0_all),
        "num_raw_matches": num_raw_matches,
        "num_filtered_matches": num_filtered_matches,
        "num_verified_inliers": int(np.sum(inliers_bool)),
        "inlier_ratio": inlier_ratio,
        "rmse_px_independent": rmse_val,
        "spatial_coverage": spatial_coverage,
        "mean_inlier_confidence": mean_confidence,
        "processing_time_sec": processing_time,
        "status": "RELIABLE" if (np.sum(inliers_bool) > 10 and inlier_ratio > 0.1) else "UNRELIABLE"
    }

    # Save CSV and NPY
    os.makedirs(output_dir, exist_ok=True)
    data_to_save = np.column_stack([kpts_src, kpts_ref, scores_np, inliers_bool])
    np.save(os.path.join(output_dir, f"{prefix}_matches.npy"), data_to_save)
    
    with open(os.path.join(output_dir, f"{prefix}_matches.csv"), "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["src_x", "src_y", "ref_x", "ref_y", "confidence", "is_inlier"])
        for row in data_to_save:
            writer.writerow(row)

    # For visualization, only use inliers if they exist, otherwise fallback to none
    if np.sum(inliers_bool) > 0:
        kpts_ref_viz = kpts_ref[inliers_bool]
        kpts_src_viz = kpts_src[inliers_bool]
    else:
        kpts_ref_viz = np.empty((0, 2))
        kpts_src_viz = np.empty((0, 2))

    return {
        "metrics": metrics,
        "kpts_ref_inliers": kpts_ref_viz,
        "kpts_src_inliers": kpts_src_viz,
        "registered_img2": registered_img2,
        "img1_cv": img1_cv,
        "image0_tensor": image0,
        "image1_tensor": image1,
        "transform": M_val.tolist() if M_val is not None else None
    }


def main():
    parser = argparse.ArgumentParser(description="Deep Learning Matching with SuperPoint + LightGlue")
    parser.add_argument("--img1", required=True, help="Path to reference image (LROC)")
    parser.add_argument("--img2", required=True, help="Path to source image (OHRC)")
    parser.add_argument("--prefix", default="dl", help="Prefix for output files")
    parser.add_argument("--conf", type=float, default=0.0, help="Confidence threshold for LightGlue (e.g. 0.8)")
    parser.add_argument("--benchmark", action="store_true", help="Run SIFT baseline for comparison")
    args = parser.parse_args()

    # 1. SIFT Baseline Comparison (if requested)
    if args.benchmark:
        print("Running SIFT baseline...")
        sift_metrics = run_sift_baseline(args.img1, args.img2)
        if sift_metrics:
            print("--- SIFT BASELINE RESULTS ---")
            print(f"Matches        : {sift_metrics['candidate_matches']}")
            print(f"Inliers        : {sift_metrics['valid_inliers']}")
            print(f"Time           : {sift_metrics['processing_time_sec']:.2f} s")
            print("-----------------------------\n")

    # 2. Run DL Matcher
    results = match_superpoint_lightglue(args.img1, args.img2, prefix=args.prefix, conf_thresh=args.conf)
    metrics = results["metrics"]

    # 3. Output files
    # Save registered image
    cv2.imwrite(f"{args.prefix}_registered_moving.png", results["registered_img2"])

    # Save overlay image
    alpha = 0.5
    overlay = cv2.addWeighted(results["img1_cv"], alpha, results["registered_img2"], 1 - alpha, 0)
    cv2.imwrite(f"{args.prefix}_registration_overlay.png", overlay)

    # Save matches visualization
    axes = viz2d.plot_images([results["image0_tensor"].cpu(), results["image1_tensor"].cpu()])
    if len(results["kpts_ref_inliers"]) > 0:
        viz2d.plot_matches(results["kpts_ref_inliers"], results["kpts_src_inliers"], color="lime", lw=0.2)
    viz2d.save_plot(f"{args.prefix}_matches_viz.png")
    plt.close()

    # Save metrics
    if results["transform"]:
        metrics["estimated_transformation"] = results["transform"]
    with open(f"{args.prefix}_metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)

    # 4. Console Summary
    print(f"--- LUNARA DEEP LEARNING MATCHING [{args.prefix}] ---")
    print(f"Source Keypoints : {metrics['num_source_keypoints']}")
    print(f"Ref Keypoints    : {metrics['num_reference_keypoints']}")
    print(f"Raw Matches      : {metrics['num_raw_matches']}")
    print(f"Filtered Matches : {metrics['num_filtered_matches']}")
    print(f"Verified Inliers : {metrics['num_verified_inliers']}")
    print(f"Inlier Ratio     : {metrics['inlier_ratio']:.2%}")
    print(f"RMSE (Indep.)    : {metrics['rmse_px_independent']:.4f} px")
    print(f"Coverage (Src)   : {metrics['spatial_coverage']:.2%}")
    print(f"Confidence       : {metrics['mean_inlier_confidence']:.4f}")
    print(f"Processing Time  : {metrics['processing_time_sec']:.2f} s")
    print(f"Status           : {metrics['status']}")
    print("Files saved:")
    print(f" - {args.prefix}_matches_viz.png")
    print(f" - {args.prefix}_registered_moving.png")
    print(f" - {args.prefix}_registration_overlay.png")
    print(f" - {args.prefix}_matches.csv/.npy")
    print(f" - {args.prefix}_metrics.json")


if __name__ == "__main__":
    main()
