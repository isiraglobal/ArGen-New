import os
import re

files_to_fix = [
    'index.html', 'about.html', 'pricing.html', 'contact.html', 'privacy.html', 
    'terms.html', 'evaluate.html', 'teams.html', 'team-detail.html', 
    'challenges.html', 'login.html', 'forgot-password.html', 'reset-password.html'
]

base_path = '/Users/lakshitsinghvi/Documents/ArGen - New Look/frontend/html/'

# Patterns to match relative paths for css, js, images
patterns = [
    (r'href="\.\./css/', 'href="/css/'),
    (r'src="\.\./js/', 'src="/js/'),
    (r'src="\.\./images/', 'src="/images/'),
    (r'href="\.\./images/', 'href="/images/'),
    (r'url\(\.\./images/', 'url(/images/'),
]

for filename in files_to_fix:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    new_content = content
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, new_content)
        
    with open(filepath, 'w') as f:
        f.write(new_content)
        print(f'Fixed asset paths in {filename}')
