"""Preserve the supplied standalone HTML byte for byte in Pages-sized parts."""
import zipfile, pathlib, hashlib, json, sys
root=pathlib.Path(__file__).resolve().parent.parent/'games/eaglercraft'
with zipfile.ZipFile(sys.argv[1]) as z:
    content=z.read('eaglercraft26-3.html')
parts=[]
for i,start in enumerate(range(0,len(content),20_000_000)):
    name=f'client-{i}.part';data=content[start:start+20_000_000];(root/name).write_bytes(data);parts.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
manifest={'version':'26.3','bytes':len(content),'sha256':hashlib.sha256(content).hexdigest(),'parts':parts}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2));print(json.dumps(manifest))
