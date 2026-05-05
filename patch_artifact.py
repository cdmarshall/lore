import re, shutil

src = "/Users/cmarshall/Documents/Claude/Artifacts/action-items/index.html"
dst = "/sessions/clever-busy-planck/mnt/outputs/action-items-patched.html"

with open(src, 'r', encoding='utf-8') as f:
    content = f.read()

old = '.menu-row { display: flex; gap: 8px; }'
new = '.menu-row { display: flex; gap: 8px; align-self: center; }'

if old not in content:
    print("ERROR: target string not found")
else:
    patched = content.replace(old, new, 1)
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(patched)
    print("OK: written to", dst)
