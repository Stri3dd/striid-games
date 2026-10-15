import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

test('every catalogue game has a nonempty local icon with recorded provenance',async()=>{
 const root=new URL('../',import.meta.url);
 const games=JSON.parse(await readFile(new URL('config/catalogue.json',root),'utf8'));
 const sources=JSON.parse(await readFile(new URL('config/icon-sources.json',root),'utf8'));
 for(const game of games){
  assert.match(game.image,/^\/assets\/game-icons\/[a-f0-9]{16}\.(webp|svg)$/u,game.name);
  assert.equal(sources[game.id]?.path,game.image,game.name);
  assert.ok((await stat(new URL(game.image.slice(1),root))).size>100,game.name);
 }
});
