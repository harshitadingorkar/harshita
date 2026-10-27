# Builds the Claude artifact mirror of this site: .artifact/page.html (index.html without the
# document shell, which the artifact adds itself) and the lists of supporting files to upload.
# Run from the repo root: python3 scripts/artifact-page.py
import os, re

src = open('index.html', encoding='utf-8').read()
head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
body = re.search(r'<body[^>]*>(.*?)</body>', src, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
head = re.sub(r'<title>.*?</title>', '<title>what Harshita keeps &amp; makes</title>', head, flags=re.S)
page = head.strip() + '\n' + body.strip() + '\n'
# Artifact-only extras (kept out of git and off the live site), e.g. the design panel.
if os.path.exists('.artifact/edit-panel.js'):
    page += '<script src="edit-panel.js"></script>\n'
os.makedirs('.artifact', exist_ok=True)
open('.artifact/page.html', 'w', encoding='utf-8').write(page)

skip = re.compile(r'(^|/)(paper[^/]*|\.DS_Store)$')
def walk(top):
    out = []
    for d, _, fs in os.walk(top):
        out += [os.path.join(d, f) for f in fs if not skip.search(os.path.join(d, f))]
    return sorted(out)
part1 = ['collection.html'] + walk('css') + walk('js') + walk('assets')
part2 = walk('data')
open('.artifact/files-1.txt', 'w').write('\n'.join(part1) + '\n')
open('.artifact/files-2.txt', 'w').write('\n'.join(part2) + '\n')
print('page', len(page), 'bytes ·', len(part1), '+', len(part2), 'files')
