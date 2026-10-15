import {mkdir,cp,readFile,stat} from 'node:fs/promises';
const files=['index.html','play.html','about.html','CNAME','_headers','_redirects','_routes.json','config','assets','games','eagler'];
await mkdir('dist',{recursive:true});for(const file of files)await cp(file,'dist/'+file,{recursive:true});
const manifest=JSON.parse(await readFile('games/eaglercraft/manifest.json'));
for(const part of manifest.parts){const info=await stat('games/eaglercraft/'+part.file);if(info.size!==part.bytes||info.size>25*1024*1024)throw new Error('Invalid game part: '+part.file)}
console.log('Static build ready in dist/. worker.mjs provides the game and voting APIs.');
