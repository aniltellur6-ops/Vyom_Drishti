import os
import re

directories_to_process = [
    r"d:\PROJECT\ALL PROJECTS\SIH 2k26\LUNARA_FRONTEND\src\views",
    r"d:\PROJECT\ALL PROJECTS\SIH 2k26\LUNARA_FRONTEND\src\components",
    r"d:\PROJECT\ALL PROJECTS\SIH 2k26\LUNARA_FRONTEND\src"
]

replacements = [
    (r'bg-slate-900', r'bg-white'),
    (r'bg-slate-950', r'bg-slate-50'),
    (r'bg-\[\#090d16\]', r'bg-slate-50'),
    (r'border-slate-800', r'border-slate-200'),
    (r'text-white', r'text-slate-900'),
    (r'text-slate-200', r'text-slate-800'),
    (r'text-slate-300', r'text-slate-700'),
    (r'text-slate-400', r'text-slate-600'),
    (r'bg-cyan-950', r'bg-cyan-50'),
    (r'border-cyan-800', r'border-cyan-200'),
    (r'text-cyan-400', r'text-cyan-700'),
    (r'text-cyan-300', r'text-cyan-800'),
    (r'text-emerald-400', r'text-emerald-700'),
    (r'text-amber-400', r'text-amber-700'),
    (r'bg-emerald-950', r'bg-emerald-50'),
    (r'border-emerald-800', r'border-emerald-200'),
    (r'text-emerald-300', r'text-emerald-800'),
    (r'\bLUNARA(?!\w)', r'VYOM DRISHTI'), # Replace LUNARA but not LUNARA_ASSETS (which has _)
    (r'\bLunara(?!\w)', r'Vyom Drishti'), # for title case
]

# Specifically exclude variable names if needed
exclude_files = ["MethodologyView.tsx", "SettingsView.tsx", "AppHeader.tsx"]

for directory in directories_to_process:
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(".tsx") and not file.endswith(".ts"):
                continue
            if file in exclude_files:
                continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for old, new in replacements:
                # Use regex for LUNARA to avoid variables like LunaraClient or LUNARA_ASSETS
                if old == r'\bLUNARA(?!\w)':
                    # Actually wait, LUNARA_ASSETS has an underscore so \w matches it.
                    new_content = re.sub(r'LUNARA\b(?!\s*[_a-zA-Z])', new, new_content)
                elif old == r'\bLunara(?!\w)':
                    new_content = re.sub(r'Lunara\b(?!\s*[_a-zA-Z])', new, new_content)
                else:
                    new_content = re.sub(old, new, new_content)

            # Let's just fix LUNARA without breaking LUNARA_ASSETS or LunaraClient manually
            # "LUNARA" followed by space or punctuation
            new_content = re.sub(r'LUNARA(?=[\s\.,\-\(])', 'VYOM DRISHTI', new_content)
            
            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")
