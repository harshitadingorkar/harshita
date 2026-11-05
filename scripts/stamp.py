# Stamp every local CSS/JS link in the pages with ?v=<time>, so browsers load fresh files after each push.
# Run before committing: python3 scripts/stamp.py
import re, time, pathlib
v = time.strftime('%Y%m%d%H%M')
for page in ['index.html', 'collection.html', 'door/index.html']:
    p = pathlib.Path(page); s = p.read_text()
    s = re.sub(r'((?:src|href)="(?:\.\./)?(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=\d+)?"', rf'\1?v={v}"', s)
    p.write_text(s)
print('stamped', v)
