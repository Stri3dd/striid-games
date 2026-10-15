export function decodeEntities(value){return value.replace(/&(#x[\da-f]+|#\d+|quot|apos|lt|gt|amp);/gi,(_,name)=>{if(name[0]==='#'){const n=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);return n<=0x10ffff?String.fromCodePoint(n):''}return {quot:'"',apos:"'",lt:'<',gt:'>',amp:'&'}[name.toLowerCase()]})}
export function extractGame(page){
 const codes=[...page.matchAll(/data-code="([^"]*)"/g)].map(m=>decodeEntities(m[1]));
 for(const code of codes){
  const encoded=code.match(/(?:gameXmlUrl|xmlUrl)\s*=\s*["']data:[^"']*?base64,([A-Za-z0-9+/=]+)/i);
  if(encoded){try{const xml=new TextDecoder().decode(Uint8Array.from(atob(encoded[1]),c=>c.charCodeAt(0)));const content=xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);if(content?.[1])return content[1]}catch{}}
  // Some providers expose a plain remote iframe instead of a packed game.
  const frame=code.match(/<iframe[^>]+src=["'](https:\/\/[^"']+)["']/i);
  if(frame&&!/script\.google\.com|accounts\.google\.com/.test(frame[1]))return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;overflow:hidden}</style></head><body><iframe title="Game" allow="autoplay; fullscreen; gamepad" allowfullscreen src="'+frame[1].replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></iframe></body></html>';
 }
 return null;
}
export async function resolveGame(game,fetcher=fetch){
 const response=await fetcher(game.source,{headers:{'User-Agent':'STRIID-Games/1.0 (game-source resolver)'},signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw new Error('Provider returned '+response.status);
 const text=await response.text();if(text.length>6_000_000)throw new Error('Provider page is too large');
 const content=extractGame(text);if(!content)throw new Error('This game currently needs its source page.');
 return content;
}
