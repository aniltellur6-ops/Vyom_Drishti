import os
import ssl
import uuid
import json
import cv2
import time
import numpy as np
import matplotlib.pyplot as plt
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# Fix for "SSL: CERTIFICATE_VERIFY_FAILED" when PyTorch downloads weights
ssl._create_default_https_context = ssl._create_unverified_context

# Set up paths to import lunara-backend modules properly
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'lunara-backend')))

from app.models.lightglue_model import LightGlueModel
from app.matchers.lightglue import LightGlueMatcher
from app.geometry.ransac import GeometricVerifier
from app.orchestrator.pipeline import LunaraOrchestrator
from app.experiments.registry import ExperimentRegistry
from app.experiments.condition_analyzer import ConditionAnalyzer
from lightglue.utils import load_image
from lightglue import viz2d
from app.preprocessing.pipeline import PreprocessingPipeline

app = FastAPI(title="Lunara Scientific Pipeline API", version="2.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS_DIR = "jobs"
os.makedirs(JOBS_DIR, exist_ok=True)
registry = ExperimentRegistry(JOBS_DIR)

# Ensure models are loaded once to avoid high latency on each request
# We instantiate this lazily or globally. For this demo, let's keep it global.
print("Initializing LightGlue model...")
try:
    global_model = LightGlueModel({
        "extractor": "superpoint",
        "max_num_keypoints": 2048,
        "filter_threshold": 0.0
    })
    global_matcher = LightGlueMatcher(global_model)
    system_status = "Ready"
except Exception as e:
    print(f"Error loading model: {e}")
    global_model = None
    global_matcher = None
    system_status = "Error"

@app.get("/api/v1/system/status")
async def get_system_status():
    """Returns the health status of the backend."""
    return {
        "status": system_status,
        "gpu_available": True, # Mock for UI, can be checked properly
        "extractor": "SuperPoint",
        "matcher": "LightGlue"
    }

@app.post("/api/v1/analyze")
async def analyze_condition(
    reference_img: UploadFile = File(...),
    source_img: UploadFile = File(...)
):
    """
    Analyzes the images to determine conditions (illumination, texture, etc).
    """
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    ref_path = os.path.join(job_dir, f"analyze_ref_{reference_img.filename}")
    src_path = os.path.join(job_dir, f"analyze_src_{source_img.filename}")

    with open(ref_path, "wb") as f:
        f.write(await reference_img.read())
    with open(src_path, "wb") as f:
        f.write(await source_img.read())

    analyzer = ConditionAnalyzer()
    
    try:
        results = analyzer.analyze(ref_path, src_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
    # Clean up temp analysis files to save space
    try:
        os.remove(ref_path)
        os.remove(src_path)
    except:
        pass
        
    return results

@app.get("/api/v1/experiments")
async def list_experiments():
    """Returns past experiments from the registry."""
    return registry.get_experiments()

@app.post("/api/v1/preprocess/preview")
async def preview_preprocessing(
    image: UploadFile = File(...),
    resize_scale: float = Form(1.0),
    percentile_norm: bool = Form(True),
    clahe: bool = Form(False),
    clahe_clip_limit: float = Form(2.0),
    clahe_tile_grid: int = Form(8),
    denoise: bool = Form(False),
    denoise_ksize: int = Form(5)
):
    config = {
        "resize_scale": resize_scale,
        "percentile_norm": percentile_norm,
        "clahe": clahe,
        "clahe_clip_limit": clahe_clip_limit,
        "clahe_tile_grid": clahe_tile_grid,
        "denoise": denoise,
        "denoise_ksize": denoise_ksize
    }
    
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    raw_path = os.path.join(job_dir, f"raw_{image.filename}")
    with open(raw_path, "wb") as f:
        f.write(await image.read())
        
    pipeline = PreprocessingPipeline(config)
    out_path = os.path.join(job_dir, f"prep_{image.filename}")
    
    img, success = pipeline.process(raw_path, out_path)
    if not success:
        raise HTTPException(status_code=500, detail="Preprocessing failed.")
        
    return FileResponse(out_path)

@app.post("/api/v1/match")
async def perform_matching(
    reference_img: UploadFile = File(...),
    source_img: UploadFile = File(...),
    requested_method: str = Form("auto"),
    prefix: str = Form("lunara"),
    conf_thresh: float = Form(0.0),
    percentile_norm: bool = Form(True),
    clahe: bool = Form(False),
    clahe_clip_limit: float = Form(2.0),
    clahe_tile_grid: int = Form(8),
    denoise: bool = Form(False),
    denoise_ksize: int = Form(5)
):
    if not global_matcher:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    job_id = str(uuid.uuid4())
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    try:
        config = {
            "percentile_norm": percentile_norm,
            "clahe": clahe,
            "clahe_clip_limit": clahe_clip_limit,
            "clahe_tile_grid": clahe_tile_grid,
            "denoise": denoise,
            "denoise_ksize": denoise_ksize
        }
        
        # Save uploaded files temporarily
        raw_ref_path = os.path.join(job_dir, f"raw_ref_{reference_img.filename}")
        raw_src_path = os.path.join(job_dir, f"raw_src_{source_img.filename}")
        
        with open(raw_ref_path, "wb") as f:
            f.write(await reference_img.read())
            
        with open(raw_src_path, "wb") as f:
            f.write(await source_img.read())

        from app.matchers.sift import SIFTMatcher
        from app.matchers.loftr import LoFTRMatcher
        from app.matchers.rift2 import RIFT2Matcher
        
        matchers_registry = {
            "lightglue": global_matcher,
            "sift": SIFTMatcher(),
            "loftr": LoFTRMatcher(pretrained='outdoor'),
            "rift2": RIFT2Matcher()
        }
        
        orchestrator = LunaraOrchestrator(
            matchers_registry=matchers_registry,
            config={"preprocessing": config}
        )
        
        result = orchestrator.execute(raw_ref_path, raw_src_path, requested_method=requested_method)
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
            
        match_result = result["match_result"]
        geo_result = result["geo_result"]
        registered_image = result["registered_image"]
        metrics = result["metrics"]
        
        # Save registered image as highly compressed JPEG
        reg_img_path = os.path.join(job_dir, f"{prefix}_registered_moving.jpg")
        cv2.imwrite(reg_img_path, registered_image, [cv2.IMWRITE_JPEG_QUALITY, 85])

        # Save overlay image as compressed JPEG
        image_a_cv = cv2.imread(result.get("ref_processed_path", raw_ref_path), cv2.IMREAD_GRAYSCALE)
        alpha = 0.5
        overlay = cv2.addWeighted(image_a_cv, alpha, registered_image, 1 - alpha, 0)
        overlay_path = os.path.join(job_dir, f"{prefix}_registration_overlay.jpg")
        cv2.imwrite(overlay_path, overlay, [cv2.IMWRITE_JPEG_QUALITY, 85])

        # Save matches visualization (only inliers)
        inlier_matches = match_result.matches[geo_result.inlier_mask]
        kpts0 = match_result.keypoints_a[inlier_matches[:, 0]]
        kpts1 = match_result.keypoints_b[inlier_matches[:, 1]]
        
        # Load images for visualization
        image_a_tensor = load_image(result.get("ref_processed_path", raw_ref_path))
        image_b_tensor = load_image(result.get("src_processed_path", raw_src_path))
        
        viz2d.plot_images([image_a_tensor.cpu(), image_b_tensor.cpu()])
        viz2d.plot_matches(kpts0, kpts1, color="lime", lw=0.2)
        viz_path = os.path.join(job_dir, f"{prefix}_matches_viz.jpg")
        viz2d.save_plot(viz_path)
        plt.close()

        # Build response dictionary
        metrics["transformation"] = result["refined_matrix"].tolist()

        # Record in registry
        registry.record_experiment(
            job_id=job_id,
            method=requested_method,
            status="Successful",
            metrics=metrics
        )
            
        return {
            "job_id": job_id,
            "status": "success",
            "metrics": metrics,
            "files": {
                "registered_image": f"/api/v1/results/{job_id}/{prefix}_registered_moving.jpg",
                "overlay_image": f"/api/v1/results/{job_id}/{prefix}_registration_overlay.jpg",
                "matches_viz": f"/api/v1/results/{job_id}/{prefix}_matches_viz.jpg"
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        registry.record_experiment(
            job_id=job_id,
            method=requested_method,
            status="Failed",
            metrics={}
        )
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")

@app.get("/api/v1/results/{job_id}/{filename}")
async def get_result_file(job_id: str, filename: str):
    file_path = os.path.join(JOBS_DIR, job_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
