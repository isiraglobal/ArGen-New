import os
import re

files_to_fix = [
    'index.html', 'about.html', 'pricing.html', 'contact.html', 'privacy.html', 
    'terms.html', 'evaluate.html', 'teams.html', 'team-detail.html', 
    'challenges.html', 'login.html', 'forgot-password.html', 'reset-password.html'
]

base_path = '/Users/lakshitsinghvi/Documents/ArGen - New Look/frontend/html/'

for filename in files_to_fix:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Determine canonical URL
    page_name = filename.replace('.html', '')
    if page_name == 'index':
        canonical = 'https://argen.isira.club/'
    else:
        canonical = f'https://argen.isira.club/{page_name}'
        
    canonical_tag = f'<link rel="canonical" href="{canonical}">\n'
    
    # Insert before </head> if not exists
    if 'rel="canonical"' not in content:
        content = content.replace('</head>', f'  {canonical_tag}</head>')
        
    with open(filepath, 'w') as f:
        f.write(content)
        print(f'Added canonical to {filename}')
