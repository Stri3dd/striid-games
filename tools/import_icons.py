"""Cache game icons locally; remote failures receive a dedicated title icon."""
import concurrent.futures, gzip, hashlib, html, io, json, pathlib, re, time, urllib.request, unicodedata
from PIL import Image, ImageOps

ROOT=pathlib.Path(__file__).resolve().parent.parent
DEST=ROOT/'assets/game-icons';DEST.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'.cache/icon-metadata';CACHE.mkdir(parents=True,exist_ok=True)
games=json.loads((ROOT/'config/catalogue.json').read_text(encoding='utf8'))
old=json.loads((ROOT/'config/games.json').read_text(encoding='utf8'))
def key(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).lower())
source_file=ROOT/'config/icon-sources.json'
previous=json.loads(source_file.read_text(encoding='utf8')) if source_file.exists() else {}
old_by_key={key(g['name']):g for g in old}
zones=json.loads((ROOT/'.cache/gn-zones.json').read_text()) if (ROOT/'.cache/gn-zones.json').exists() else []
covers={key(g['name']):g['cover'].replace('{COVER_URL}','https://raw.githubusercontent.com/gn-math/covers/main') for g in zones if g.get('cover') and g.get('id',-1)>=0}
HEADERS={'User-Agent':'Mozilla/5.0 (compatible; STRIID game icon importer)','Referer':'https://sites.google.com/view/classroom6x/','Accept-Encoding':'gzip'}
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=16) as r:
        data=r.read(6_000_000)
        if r.headers.get('Content-Encoding')=='gzip':data=gzip.decompress(data)
        return data
def filename(g):return hashlib.sha256(g['id'].encode()).hexdigest()[:16]
def svg_icon(g):
    digest=hashlib.sha256(g['name'].encode()).digest();hue=int.from_bytes(digest[:2],'big')%360
    words=re.findall(r'[\w]+',g['name']);letters=''.join(w[0] for w in words[:2]).upper() or '?'
    if len(words)==1:letters=words[0][:2].upper()
    letters=html.escape(letters);title=html.escape(g['name'])
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="360" height="270" viewBox="0 0 360 270"><title>{title}</title><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="hsl({hue},60%,35%)"/><stop offset="1" stop-color="hsl({hue},55%,13%)"/></linearGradient></defs><rect width="360" height="270" rx="18" fill="url(#b)"/><circle cx="295" cy="45" r="110" fill="none" stroke="white" stroke-opacity=".09" stroke-width="22"/><path d="M0 235 360 65V270H0Z" fill="white" fill-opacity=".04"/><rect x="112" y="58" width="136" height="136" rx="35" fill="hsl({hue},65%,67%)"/><rect x="117" y="58" width="126" height="124" rx="30" fill="hsl({hue},75%,84%)"/><text x="180" y="145" fill="hsl({hue},65%,20%)" font-family="Arial,sans-serif" font-size="61" font-weight="bold" text-anchor="middle">{letters}</text><text x="180" y="234" fill="hsl({hue},55%,86%)" font-family="Arial,sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="3">STRIID GAMES</text></svg>'''
    path=DEST/(filename(g)+'.svg');path.write_text(svg,encoding='utf8');return '/assets/game-icons/'+path.name
def thumbnail_urls(page,name):
    candidates=[]
    for tag in re.findall(r'<img\b[^>]*>',page,re.I):
        attrs={k.lower():html.unescape(v) for k,v in re.findall(r'([\w-]+)="([^"]*)"',tag)}
        src=attrs.get('src','');alt=attrs.get('alt','')
        if src.startswith('https://sites.google.com/sitesv-images-rt/'):
            score=2 if key(name) in key(alt) else 1 if alt and alt.lower()!='unblocked games' else 0
            if score:candidates.append((score,src))
    return [u for _,u in sorted(candidates,key=lambda x:-x[0])]
def save_image(g,url):
    image=Image.open(io.BytesIO(fetch(url)));image.seek(0)
    image=ImageOps.exif_transpose(image).convert('RGB');image=ImageOps.fit(image,(360,270),method=Image.Resampling.LANCZOS)
    path=DEST/(filename(g)+'.webp');image.save(path,'WEBP',quality=84,method=4)
    return '/assets/game-icons/'+path.name
def work(g):
    dest=DEST/(filename(g)+'.webp')
    if dest.exists():return g['id'],'/assets/game-icons/'+dest.name,'artwork',previous.get(g['id'],{}).get('source')
    urls=[];name=key(g['name'])
    if name in old_by_key:
        o=old_by_key[name];urls.append('https://parcoil-assets.onrender.com/'+o['url'].strip()+'/'+o['image'])
    if name in covers:urls.append(covers[name])
    if g.get('image','').startswith('https:'):urls.append(g['image'].replace('=w400','=w1280'))
    for u in urls:
        try:return g['id'],save_image(g,u),'artwork',u
        except Exception:pass
    if g.get('source','').startswith('https://sites.google.com/view/classroom6x/'):
        meta=CACHE/(filename(g)+'.json')
        try:
            if meta.exists():urls=json.loads(meta.read_text())
            else:
                urls=thumbnail_urls(fetch(g['source']).decode('utf8'),g['name']);meta.write_text(json.dumps(urls))
            for u in urls[:1]:
                try:return g['id'],save_image(g,u),'artwork',u
                except Exception:pass
        except Exception:pass
    return g['id'],svg_icon(g),'title-icon',None

results={};artwork=0
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for i,(id,path,kind,source) in enumerate(pool.map(work,games),1):
        results[id]={'path':path,'kind':kind,'source':source};artwork+=kind=='artwork'
        if i%100==0:print(f'{i}/{len(games)} icons ready; {artwork} artwork thumbnails',flush=True)
for g in games:g['image']=results[g['id']]['path'];g['iconType']=results[g['id']]['kind']
(ROOT/'config/catalogue.json').write_text(json.dumps(games,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(ROOT/'config/icon-sources.json').write_text(json.dumps(results,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(f'DONE: {len(games)} local icons, {artwork} artwork thumbnails, {len(games)-artwork} individual title icons',flush=True)
