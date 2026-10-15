import catalogue from '../../config/catalogue.json' with { type: 'json' };
import {resolveGame} from '../../lib/source.mjs';
const games=new Map(catalogue.map(g=>[g.id,g]));
export async function onRequestGet({request}){const id=new URL(request.url).searchParams.get('id');const game=games.get(id);if(!game||game.mode!=='classroom')return Response.json({available:false,message:'Game not found'},{status:404});try{await resolveGame(game);return Response.json({available:true},{headers:{'Cache-Control':'public,max-age=1800'}})}catch{return Response.json({available:false,message:'This provider’s player is unavailable here right now. Use Open source below to try the original game page.'},{status:502})}}
