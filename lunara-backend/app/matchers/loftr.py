import torch
import kornia
import cv2
import numpy as np
import time
from app.matchers.base import MatcherInterface
from app.schemas.matching import MatchingResult

class LoFTRMatcher(MatcherInterface):
    def __init__(self, pretrained='outdoor'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        # Initialize Kornia LoFTR
        self.matcher = kornia.feature.LoFTR(pretrained=pretrained).to(self.device)
        self.matcher.eval()

    def load_kornia_image(self, path: str):
        # Kornia expects images in [B, C, H, W] format, normalized 0-1, grayscale
        img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        # Ensure dimensions are divisible by 8 for LoFTR (padding if necessary)
        h, w = img.shape
        new_h = (h // 8) * 8
        new_w = (w // 8) * 8
        if new_h != h or new_w != w:
            img = cv2.resize(img, (new_w, new_h))
            
        tensor = torch.from_numpy(img).float()[None, None] / 255.0
        return tensor.to(self.device), (h, w), (new_h, new_w)

    def match(self, image_a_path: str, image_b_path: str) -> MatchingResult:
        start_time = time.time()
        
        img_a_tensor, orig_shape_a, new_shape_a = self.load_kornia_image(image_a_path)
        img_b_tensor, orig_shape_b, new_shape_b = self.load_kornia_image(image_b_path)
        
        input_dict = {
            "image0": img_a_tensor,
            "image1": img_b_tensor
        }
        
        with torch.no_grad():
            correspondences = self.matcher(input_dict)
            
        kpts0 = correspondences['keypoints0'].cpu().numpy()
        kpts1 = correspondences['keypoints1'].cpu().numpy()
        confidence = correspondences['confidence'].cpu().numpy()
        
        # Scale keypoints back to original image size if we resized
        scale_x_a = orig_shape_a[1] / new_shape_a[1]
        scale_y_a = orig_shape_a[0] / new_shape_a[0]
        scale_x_b = orig_shape_b[1] / new_shape_b[1]
        scale_y_b = orig_shape_b[0] / new_shape_b[0]
        
        kpts0[:, 0] *= scale_x_a
        kpts0[:, 1] *= scale_y_a
        kpts1[:, 0] *= scale_x_b
        kpts1[:, 1] *= scale_y_b
        
        # In LoFTR, matches are implicitly 1-to-1 index aligned
        # i.e., kpts0[i] matches kpts1[i]
        matches = np.column_stack((np.arange(len(kpts0)), np.arange(len(kpts1))))
        
        return MatchingResult(
            method="loftr",
            keypoints_a=kpts0,
            keypoints_b=kpts1,
            matches=matches,
            confidence=confidence,
            num_keypoints_a=len(kpts0),
            num_keypoints_b=len(kpts1),
            num_matches=len(matches),
            runtime_seconds=time.time() - start_time
        )
