import {onRequest as votes} from './functions/api/votes.js';
import {onRequestGet as resolve} from './functions/api/resolve.js';
import {onRequestGet as game} from './functions/api/game.js';
import {eaglerResponse} from './lib/eagler.mjs';
import manifest from './games/eaglercraft/manifest.json' with {type:'json'};
export default {
 async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path==='/eagler/client'){if(request.method!=='GET')return new Response('Method not allowed',{status:405});return eaglerResponse(request,env.ASSETS,manifest)}
  const handler={'/api/votes':votes,'/api/resolve':resolve,'/api/game':game}[path];
  if(handler){if(path!=='/api/votes'&&request.method!=='GET')return new Response('Method not allowed',{status:405});return handler({request,env,waitUntil:promise=>ctx.waitUntil(promise)})}
  if(path.startsWith('/api/'))return new Response('Not found',{status:404});
  return env.ASSETS.fetch(request);
 }
};
