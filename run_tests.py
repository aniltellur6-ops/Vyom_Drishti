import sys, os, time
import cv2
import numpy as np

sys.path.insert(0, './lunara-backend')
from app.orchestrator.pipeline import LunaraOrchestrator
from app.matchers.sift import SIFTMatcher
from app.matchers.loftr import LoFTRMatcher
from app.matchers.rift2 import RIFT2Matcher
from app.models.lightglue_model import LightGlueModel

import warnings
warnings.filterwarnings('ignore')

print('Initializing models...')
global_matcher = LightGlueModel()

registry = {
    'lightglue': global_matcher,
    'sift': SIFTMatcher(),
    'loftr': LoFTRMatcher(pretrained='outdoor'),
    'rift2': RIFT2Matcher()
}

config = {'preprocessing': {'clahe': False}}
orchestrator = LunaraOrchestrator(registry, config)

# Create a test image with distinct features (checkerboard/noise mix)
base_img = np.zeros((300, 300), dtype=np.uint8)
cv2.rectangle(base_img, (50, 50), (150, 150), 255, -1)
cv2.rectangle(base_img, (150, 150), (250, 250), 255, -1)
# Add some noise to give SIFT something to grab
noise = np.random.randint(0, 50, (300, 300), dtype=np.uint8)
base_img = cv2.add(base_img, noise)

# Create a slightly shifted version
M = np.float32([[1, 0, 10], [0, 1, 10]])
shifted_img = cv2.warpAffine(base_img, M, (300, 300))

cv2.imwrite('test_ref.png', base_img)
cv2.imwrite('test_src.png', shifted_img)

for method in ['lightglue', 'sift', 'loftr', 'rift2']:
    print('\n--- Testing ' + method.upper() + ' ---')
    res = orchestrator.execute('test_ref.png', 'test_src.png', requested_method=method)
    
    if res['status'] == 'error':
        print('ERROR: ' + res['message'])
    else:
        m = res['metrics']
        print('SUCCESS!')
        print('Inliers: ' + str(m.get('inliers')) + ' / ' + str(res['match_result'].num_matches))
        print('Runtime: ' + str(round(m.get('runtime'), 2)) + 's')
