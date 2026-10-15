import http from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localDatabase} from './d1-local.mjs';
import {onRequest as votes} from '../functions/api/votes.js';
import {onRequestGet as resolve} from '../functions/api/resolve.js';
import {onRequestGet as game} from '../functions/api/game.js';
import {eaglerResponse} from '../lib/eagler.mjs';
import {Readable} from 'node:stream';
const root=fileURLToPath(new URL('../',import.meta.url));await mkdir(path.join(root,'.cache'),{recursive:true});
const db=localDatabase(path.join(root,'.cache','preview-votes.sqlite'));
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.json':'application/json','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.part':'application/octet-stream'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:4173');if(url.pathname==='/eagler/client'){const manifest=JSON.parse(await readFile(path.join(root,'games/eaglercraft/manifest.json')));const response=eaglerResponse(new Request(url),{fetch:async request=>new Response(Readable.toWeb(createReadStream(path.join(root,new URL(request.url).pathname))))},manifest);res.writeHead(response.status,Object.fromEntries(response.headers));Readable.fromWeb(response.body).pipe(res);return}if(url.pathname.startsWith('/api/')){const endpoint=url.pathname.split('/').pop(),handler={votes,resolve,game}[endpoint];if(!handler){res.writeHead(404);res.end();return}const body=[];for await(const chunk of req){body.push(chunk);if(body.reduce((n,b)=>n+b.length,0)>2048){res.writeHead(413);res.end();return}}const request=new Request(url,{method:req.method,headers:req.headers,...(body.length?{body:Buffer.concat(body),duplex:'half'}:{})});const response=await handler({request,env:{COMMUNITY_DB:db},waitUntil:p=>p.catch(()=>{})});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return}
let pathname=decodeURIComponent(url.pathname);if(pathname==='/eagler'){res.writeHead(301,{Location:'/eagler/'});res.end();return}if(pathname.endsWith('/'))pathname+='index.html';const filename=path.resolve(root,'.'+pathname);if(!filename.startsWith(root)||/^\/(?:\.|tools|tests|functions|lib|migrations)/.test(pathname)){res.writeHead(403);res.end();return}const info=await stat(filename);if(!info.isFile())throw new Error();res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Content-Length':info.size,'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless','Cache-Control':'no-cache'});createReadStream(filename).pipe(res);
}catch(error){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173 (local preview votes only)'));
process.on('SIGINT',()=>{server.close();db.close();process.exit(0)});
