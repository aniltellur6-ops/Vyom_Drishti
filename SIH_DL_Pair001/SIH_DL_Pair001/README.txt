SIH 2026 - PS 26166
Multi-modal, Sun angle and scale invariant image correspondence
using Chandrayaan-2 optical images

TEST PAIR: Pair-001

MOVING / SOURCE:
Chandrayaan-2 OHRC
Browse image coordinate system
Approx. 1200 x 7980 pixels
Panchromatic
Native resolution approximately 0.28 m/pixel

REFERENCE:
LROC South Pole NAC browse mosaic
V4 geographic-overlap reference
2842 x 550 pixels

IMPORTANT:
The reference image is an overlap-focused LROC product.
The moving OHRC images are NOT pre-registered to the reference.
Do not treat them as already aligned.

EXPERIMENTS:

01_normalized
- OHRC normalized
- LROC original overlap reference

02_clahe
- OHRC CLAHE
- LROC CLAHE

03_structure_gradient
- OHRC structural representation
- LROC gradient representation

MODEL:
SuperPoint + LightGlue

For each experiment, please report:
1. source keypoints
2. reference keypoints
3. raw matches
4. filtered matches
5. geometrically verified inliers
6. inlier ratio
7. estimated transformation
8. RMSE / reprojection error
9. registered image
10. match visualization
11. runtime

IMPORTANT:
Please save the source/reference coordinates of the final matches,
the confidence scores if available, and the inlier mask.

Do not claim successful registration based only on visual match
count. We need geometrically verified correspondences.

KNOWN CHALLENGE:
This is lunar polar imagery with strong illumination/
shadow differences and substantial scale/resolution differences
between OHRC and LROC.

This package is for an independent SuperPoint + LightGlue
evaluation for SIH PS 26166.
