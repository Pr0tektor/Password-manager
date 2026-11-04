import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../sw.js',import.meta.url),'utf8');
function harness(){
  const handlers={}; const added=[]; const deleted=[]; let skipped=0; let claimed=0; const requests=[];
  const scope='https://example.test/Password-manager/';
  const cache={addAll:async urls=>{added.push(...urls);},match:async request=>request.url.endsWith('app.mjs')?new Response('cached-module'):undefined};
  const self={location:{href:scope+'sw.js'},addEventListener:(name,fn)=>{handlers[name]=fn;},clients:{claim:async()=>{claimed++;}},skipWaiting:async()=>{skipped++;}};
  vm.runInNewContext(source,{self,URL,caches:{open:async()=>cache,keys:async()=>['other-app-cache','password-manager-shell-old','password-manager-shell-1.1.0'],delete:async name=>{deleted.push(name);}},fetch:async request=>{requests.push(request);return new Response('network');}});
  return {handlers,added,deleted,requests,scope,get skipped(){return skipped;},get claimed(){return claimed;}};
}
test('both localized manifests have a stable identity, scoped relative URLs and valid install icons',async()=>{
  for(const file of ['manifest.webmanifest','manifest.en.webmanifest']){
    const manifest=JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
    assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
    assert.ok(manifest.name);assert.ok(['ru','en'].includes(manifest.lang));
    for(const icon of manifest.icons){const image=await readFile(new URL('../'+icon.src,import.meta.url));assert.equal(image.subarray(1,4).toString(),'PNG');const [size]=icon.sizes.split('x').map(Number);assert.equal(image.readUInt32BE(16),size);assert.equal(image.readUInt32BE(20),size);}
  }
});
test('service worker precaches only public shell files including complete module graph and guides',async()=>{
  const h=harness();let install;h.handlers.install({waitUntil:task=>{install=task;}});await install;
  assert.ok(h.added.length>15);
  for(const url of h.added){assert.ok(url.startsWith(h.scope));const file=url.slice(h.scope.length)||'index.html';assert.ok((await stat(new URL('../'+file,import.meta.url))).isFile());assert.doesNotMatch(file,/\.csv$|backup\.json|token|secret/);}
  const modules=['app.mjs','crypto.mjs','vault.mjs','csv.mjs','i18n.mjs','pwa.mjs','drive.mjs','drive-ui.mjs','config.mjs'];
  for(const file of modules)assert.ok(h.added.includes(h.scope+file),`Not cached: ${file}`);
});
test('cache rejects Google requests, unknown files, query URLs and non-GET methods',async()=>{
  const h=harness();
  for(const [url,method] of [['https://www.googleapis.com/drive/v3/files','GET'],[h.scope+'backup.json','GET'],[h.scope+'app.mjs?password=x','GET'],[h.scope+'app.mjs','POST']]){
    let handled=false;h.handlers.fetch({request:{url,method},respondWith:()=>{handled=true;}});assert.equal(handled,false);
  }
  let task;h.handlers.fetch({request:{url:h.scope+'app.mjs',method:'GET'},respondWith:promise=>{task=promise;}});assert.equal(await (await task).text(),'cached-module');assert.equal(h.requests.length,0);
});
test('updates only remove app-owned old caches and activate explicitly',async()=>{
  const h=harness();assert.equal(h.skipped,0);let task;
  h.handlers.activate({waitUntil:promise=>{task=promise;}});await task;
  assert.deepEqual(h.deleted,['password-manager-shell-old']);assert.equal(h.claimed,1);
  h.handlers.message({data:{type:'UNRELATED'},waitUntil:()=>assert.fail()});assert.equal(h.skipped,0);
  h.handlers.message({data:{type:'ACTIVATE_UPDATE'},waitUntil:promise=>{task=promise;}});await task;assert.equal(h.skipped,1);
});
