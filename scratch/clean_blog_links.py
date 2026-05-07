import os

files_to_clean = [
    'about.html', 'pricing.html', 'contact.html', 'privacy.html', 
    'terms.html', 'evaluate.html', 'teams.html', 'team-detail.html', 
    'challenges.html'
]

base_path = '/Users/lakshitsinghvi/Documents/ArGen - New Look/frontend/html/'

for filename in files_to_clean:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    new_lines = []
    for line in lines:
        if '/blog' in line:
            # Skip lines that are just blog links
            # We want to be careful not to remove content that just mentions blog
            # But usually it's <a href="/blog" ...>Blog</a>
            if 'href="/blog"' in line:
                continue
        new_lines.append(line)
        
    with open(filepath, 'w') as f:
        f.writelines(new_lines)
        print(f'Cleaned {filename}')
