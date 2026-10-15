import test from 'node:test';
import assert from 'node:assert/strict';
import {eaglerResponse} from '../lib/eagler.mjs';
test('streams game parts in order through a same-origin HTML response',async()=>{
 const seen=[];const pieces=['<!doctype html><html>','original client','</html>'];
 const assets={fetch:async request=>{const i=Number(new URL(request.url).pathname.match(/part-(\d)/)[1]);seen.push(i);return new Response(pieces[i])}};
 const response=eaglerResponse(new Request('https://games.striid.uk/eagler/client'),assets,{parts:pieces.map((_,i)=>({file:'part-'+i})),bytes:pieces.join('').length});
 assert.equal(await response.text(),pieces.join(''));assert.deepEqual(seen,[0,1,2]);assert.match(response.headers.get('Content-Type'),/^text\/html/);assert.equal(response.headers.get('Cross-Origin-Embedder-Policy'),'credentialless');
});
