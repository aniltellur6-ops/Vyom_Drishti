# Vyom Drishti (SIH 2k26)
**Autonomous Lunar Image Co-Registration System**

Vyom Drishti is an advanced, multi-modal image registration pipeline designed to align high-resolution lunar surface images with extreme precision. Built for robustness against extreme illumination changes (shadow shifts), varying resolutions, and diverse textures encountered in orbital imagery.

## 🚀 Features

- **Dynamic Pipeline Orchestrator:** Automatically analyzes incoming images for texture quality, shadow coverage, and resolution differences to recommend the most optimal matching model.
- **Multi-Model Support:**
  - **SuperPoint + LightGlue:** Deep-learning based feature extraction and matching for extreme reliability in challenging visual conditions.
  - **SIFT (Scale-Invariant Feature Transform):** Robust baseline for standard photometric alignments.
  - **LoFTR:** Detector-free matching using transformers, ideal for low-texture regions like smooth mare.
  - **RIFT2 (Phase Congruency):** Specialized for severe multimodal radiometric and illumination shifts (shadows).
- **Subpixel Refinement:** Leverages `cv2.findTransformECC` post-RANSAC for exact, subpixel-perfect transformation matrices, protected by spatial validation bounds.
- **Modern React UI:** An interactive frontend for uploading images, selecting models, and visualizing side-by-side comparative alignments, keypoint mappings, and error metrics (RMSE, Inlier Ratios).

## 📁 Repository Structure

```
├── LUNARA_FRONTEND/      # React + Vite frontend (Tailwind CSS, Lucide Icons)
├── lunara-backend/       # Core Python Backend API
│   ├── app/
│   │   ├── geometry/     # RANSAC filtering, ECC subpixel refinement, Spatial Validators
│   │   ├── matchers/     # LoFTR, LightGlue, RIFT2, SIFT implementations
│   │   ├── orchestrator/ # Pipeline routing, Image Condition Analyzers
│   │   └── preprocessing/# CLAHE, normalization
├── main.py               # FastAPI entry point
```

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, PyTorch, OpenCV, Kornia, Kornia-Moons
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Algorithms:** LightGlue, SuperPoint, LoFTR, SIFT, RANSAC, ECC

## ⚙️ Setup & Execution

### 1. Backend Setup
Create a virtual environment and install the dependencies:
```bash
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn opencv-python kornia kornia_moons torch torchvision
```

Run the FastAPI server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
Navigate to the frontend directory and run the development server:
```bash
cd LUNARA_FRONTEND
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---
*Developed for Smart India Hackathon (SIH) 2026*
