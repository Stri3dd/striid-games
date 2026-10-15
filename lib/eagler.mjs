// Stream the original document through a normal same-origin URL. Keeping the
// individual stored objects small satisfies the static asset upload limit.
export function eaglerResponse(request,assets,manifest){
 let index=0,reader=null;
 const body=new ReadableStream({
  async pull(controller){try{while(index<manifest.parts.length){if(!reader){const url=new URL('/games/eaglercraft/'+manifest.parts[index].file,request.url);const response=await assets.fetch(new Request(url));if(!response.ok||!response.body)throw new Error('Eaglercraft download unavailable');reader=response.body.getReader()}const {done,value}=await reader.read();if(done){reader=null;index++;continue}controller.enqueue(value);return}controller.close()}catch(error){controller.error(error)}},
  async cancel(){await reader?.cancel()}
 });
 return new Response(body,{headers:{'Content-Type':'text/html;charset=utf-8','Content-Length':String(manifest.bytes),'Cache-Control':'public,max-age=3600','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless','X-Content-Type-Options':'nosniff'}});
}
