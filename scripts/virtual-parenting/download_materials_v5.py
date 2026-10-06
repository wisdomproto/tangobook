"""Download the exact CC0 source maps, checking SHA256 before Blender use."""
import hashlib, json, pathlib, sys, urllib.request

root = pathlib.Path(sys.argv[1]) / 'textures-v5'
root.mkdir(parents=True, exist_ok=True)
manifest_path = pathlib.Path(__file__).with_name('materials-v5-textures.json')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for asset in manifest:
    path = root / asset['file']
    if not path.exists():
        request = urllib.request.Request(asset['download'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=60) as response:
            path.write_bytes(response.read())
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != asset['sha256']:
        raise ValueError(f"Checksum mismatch: {asset['file']}")
    print('Verified', asset['file'])
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
