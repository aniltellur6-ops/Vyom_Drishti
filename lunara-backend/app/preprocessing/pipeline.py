import cv2
import numpy as np
import os
from typing import Dict, Any, Tuple

class PreprocessingPipeline:
    def __init__(self, config: Dict[str, Any] = None):
        """
        config example:
        {
            "resize_scale": 1.0,
            "percentile_norm": True,
            "clahe": True,
            "clahe_clip_limit": 2.0,
            "clahe_tile_grid": 8,
            "denoise": True,
            "denoise_ksize": 5
        }
        """
        self.config = config or {}

    def process(self, image_path: str, output_path: str = None) -> Tuple[np.ndarray, bool]:
        """
        Processes an image based on the pipeline config.
        Returns the processed image and a boolean indicating success.
        If output_path is provided, saves the result.
        """
        if not os.path.exists(image_path):
            print(f"Error: Image {image_path} not found.")
            return None, False

        # 1. Grayscale Conversion (ensure it's grayscale)
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            print(f"Error: Failed to load {image_path}")
            return None, False

        # 2. 16-bit to Normalized (if applicable) & Percentile Normalization
        # Even for 8-bit, percentile normalization helps stretch contrast safely
        if self.config.get("percentile_norm", True):
            p1, p99 = np.percentile(img, (1, 99))
            if p99 > p1: # Avoid division by zero
                img = np.clip((img - p1) / (p99 - p1) * 255.0, 0, 255).astype(np.uint8)

        # 3. Resolution Alignment (Resize)
        scale = self.config.get("resize_scale", 1.0)
        if scale != 1.0 and scale > 0:
            width = int(img.shape[1] * scale)
            height = int(img.shape[0] * scale)
            img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC)

        # 4. CLAHE
        if self.config.get("clahe", False):
            clip_limit = self.config.get("clahe_clip_limit", 2.0)
            tile_grid = self.config.get("clahe_tile_grid", 8)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid, tile_grid))
            img = clahe.apply(img)

        # 5. Light Denoising
        if self.config.get("denoise", False):
            ksize = self.config.get("denoise_ksize", 5)
            # Ensure ksize is odd
            if ksize % 2 == 0:
                ksize += 1
            img = cv2.GaussianBlur(img, (ksize, ksize), 0)

        # Save if requested
        if output_path:
            cv2.imwrite(output_path, img)

        return img, True
