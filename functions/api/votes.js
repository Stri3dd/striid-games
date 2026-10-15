import catalogue from '../../config/catalogue.json' with { type: 'json' };
const ids=new Set(catalogue.map(g=>g.id));
const initialized=new WeakMap();
const schema=[`CREATE TABLE IF NOT EXISTS votes(visitor_id TEXT NOT NULL,game_id TEXT NOT NULL,created_at INTEGER NOT NULL DEFAULT (unixepoch()),PRIMARY KEY(visitor_id,game_id))`,`CREATE INDEX IF NOT EXISTS votes_by_game ON votes(game_id)`,`CREATE TABLE IF NOT EXISTS vote_rate_limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL DEFAULT 1,expires_at INTEGER NOT NULL)`];
async function init(db){if(!initialized.has(db)){const pending=db.batch(schema.map(sql=>db.prepare(sql))).catch(error=>{initialized.delete(db);throw error});initialized.set(db,pending)}await initialized.get(db)}
function visitor(request){const candidate=request.headers.get('Cookie')?.match(/(?:^|;\s*)striid_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];return candidate||crypto.randomUUID()}
function reply(request,body,status=200,id){const headers={'Cache-Control':'no-store','Content-Type':'application/json'};if(id)headers['Set-Cookie']=`striid_visitor=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`;return new Response(JSON.stringify(body),{status,headers})}
async function snapshot(db,id){const [counts,liked]=await db.batch([db.prepare('SELECT game_id, COUNT(*) AS total FROM votes GROUP BY game_id'),db.prepare('SELECT game_id FROM votes WHERE visitor_id = ?').bind(id)]);return {available:true,votes:Object.fromEntries(counts.results.filter(r=>ids.has(r.game_id)).map(r=>[r.game_id,r.total])),liked:liked.results.map(r=>r.game_id)}}
export async function onRequest({request,env,waitUntil}){
 if(!['GET','POST'].includes(request.method))return reply(request,{error:'Method not allowed'},405);
 if(!env.COMMUNITY_DB)return reply(request,{available:false,votes:{},liked:[],message:'Community voting is not connected yet.'},503);
 try{await init(env.COMMUNITY_DB);const id=visitor(request);
  if(request.method==='GET')return reply(request,await snapshot(env.COMMUNITY_DB,id),200,id);
  const origin=request.headers.get('Origin');if(origin!==new URL(request.url).origin)return reply(request,{error:'Same-origin request required'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(request,{error:'JSON required'},415);
  if(Number(request.headers.get('Content-Length'))>1024)return reply(request,{error:'Request too large'},413);
  const text=await request.text();if(text.length>1024)return reply(request,{error:'Request too large'},413);let body;try{body=JSON.parse(text)}catch{return reply(request,{error:'Invalid JSON'},400)}
  if(!body||!ids.has(body.id)||typeof body.liked!=='boolean')return reply(request,{error:'Invalid vote'},400);
  const now=Math.floor(Date.now()/1000),hour=Math.floor(now/3600);const client=request.headers.get('CF-Connecting-IP')||id;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(hour+':'+client+':'+(env.VOTE_SALT||'striid-community')));const bucket=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const rate=await env.COMMUNITY_DB.prepare('INSERT INTO vote_rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+7200).first();
  if(rate.count>60)return reply(request,{error:'Too many votes. Try again later.'},429,id);
  if(body.liked)await env.COMMUNITY_DB.prepare('INSERT OR IGNORE INTO votes(visitor_id,game_id) VALUES(?,?)').bind(id,body.id).run();else await env.COMMUNITY_DB.prepare('DELETE FROM votes WHERE visitor_id=? AND game_id=?').bind(id,body.id).run();
  waitUntil(env.COMMUNITY_DB.prepare('DELETE FROM vote_rate_limits WHERE expires_at < ?').bind(now).run());return reply(request,await snapshot(env.COMMUNITY_DB,id),200,id);
 }catch{return reply(request,{error:'Voting is temporarily unavailable'},503)}
}
