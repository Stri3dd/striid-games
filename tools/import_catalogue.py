"""Import public game titles/links, retaining source attribution. No game binaries copied."""
import json, re, pathlib, html, unicodedata
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
def key(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', s).lower()).replace('unblockedgames','').replace('unblocked','')
def genres(title):
    t=title.lower(); out=[]
    rules={
      'Sports':r'ball|basket|soccer|football|tennis|hockey|golf|bowl|pool|billiard|cricket|baseball|boxing|wrestl|skate|sport|fishing',
      'Driving':r'drift|driv|racing|racer|rally|truck|traffic|parking|moto|bike|kart|car\b|cars\b|road|wheel|motor|vehicle|polytrack',
      'Puzzle':r'2048|sudoku|wordle|puzzle|chess|checkers|mahjong|solitaire|connect|match|blox|block|brain|logic|riddle|tetris|cut.the.rope|water.sort|unblock|minesweep|hex|memory|merge',
      'Multiplayer':r'1v1|1.on.1|2.player|two.player|multiplayer|\.io\b|random|snipers|fireboy|among.us|smash.kart|tank.trouble|shell.shock',
      'Sandbox':r'minecraft|eagler|craft|sandbox|sand.game|townscaper|worldbox|terraria|powder|little.alchemy|fluid|silk|mutilate|ragdoll|melon.play',
      'Clicker':r'clicker|idle|incremental|doge.miner|cookie|capybara.click|popcat|space.company',
      'Strategy':r'tower|\btd\b|bloons|defen[cs]e|strategy|chess|war\b|conflict|kingdom|empire|civiliz|battle.for|age.of',
      'Adventure':r'adventure|escape|quest|explor|henry.stick|riddle.school|robber|bank|diamond|prison|henry|zelda|pokemon|dungeon',
      'Horror':r'horror|backroom|fnaf|freddy|granny|slender|scary|baldi|amanda|poppy|santy|nightmare|five.nights|garten|zombie',
      'Action':r'shoot|gun|strike|combat|battle|fight|sniper|doom|quake|superhot|stickman|vex|ninja|slope|run\b|runner|jump|dash|surviv|tunnel|subway|dino|ovo|platform|super.mario'
    }
    for g,p in rules.items():
        if re.search(p,t):out.append(g)
    return out or ['Arcade']

links=json.loads((ROOT/'.cache/classroom-links.json').read_text())
old=json.loads((ROOT/'config/games.json').read_text())
games={}; ignored=[]
excluded={'home','sites','contact-us','dmca','privacy-policy','terms','about','sitemap','unblocked-games','unblocked-games-for-schools'}
for item in links:
    path=item['url'].split('?')[0].rstrip('/'); slug=path.rsplit('/',1)[-1]; title=item['title'].strip()
    if not path.startswith('/view/classroom6x/') or slug in excluded or not title:
        ignored.append(item);continue
    k=key(title)
    if not k or k in games:continue
    games[k]={'id':'c6x-'+slug,'name':title,'genres':genres(title),'source':'https://sites.google.com'+path,'provider':'Classroom 6x','mode':'classroom','slug':slug}
for game in old:
    k=key(game['name']); existing=games.get(k)
    if existing:
        existing['legacyUrl']=game['url'].strip()
        continue
    games[k]={'id':'native-'+game['url'].strip(),'name':game['name'],'genres':genres(game['name']),'provider':'Parcoil','mode':'legacy','legacyUrl':game['url'].strip()}
# User-supplied browser build. Keep the version reported by the file itself.
games['eaglercraft263']={'id':'eaglercraft-26-3','name':'Eaglercraft 26.3','genres':['Sandbox','Multiplayer'],'provider':'Local game','mode':'local','url':'/eagler/','featured':True}
for g in games.values():
    if g['name']=='8 Ball Pool':
        g.update(mode='local',provider='STRIID original',url='/games/pool/')
        g.pop('source',None)
    if g['name']=='1v1.lol':g['featured']=True
    if g['name']=='8 Ball Pool':g['featured']=True

# Use public thumbnail URLs from source markup when available; otherwise the UI
# renders its own genre cover. Do not copy or execute the source site's markup.
class Images(HTMLParser):
    def __init__(self):super().__init__();self.images={}
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='img' and a.get('alt') and a.get('src','').startswith('https://sites.google.com/sitesv-images-rt/'):
            label=re.sub(r'\b(unblocked|games?|online)\b','',a['alt'],flags=re.I)
            self.images[key(label)]=a['src'].replace('=w1280','=w400')
p=Images();p.feed((ROOT/'.cache/classroom.html').read_text(encoding='utf8'))
for name in ['8-ball-pool','1v1-lol']:
    path=ROOT/'.cache'/f'{name}.html'
    if path.exists():p.feed(path.read_text(encoding='utf8'))
for k,g in games.items():
    if k in p.images:g['image']=p.images[k]
out=sorted(games.values(),key=lambda x:x['name'].casefold())
(ROOT/'config/catalogue.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf8')
report={'importedAt':'2026-10-15','source':'https://sites.google.com/view/classroom6x/','sourceListings':sum(g['id'].startswith('c6x-') for g in out),'retainedLegacy':sum(g['mode']=='legacy' for g in out),'total':len(out),'thumbnails':sum('image' in g for g in out),'note':'Listings imported from public navigation. Game payloads resolved on demand; availability depends on source hosting. Counts do not imply every game has been tested.'}
(ROOT/'config/import-report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report))

