import test from 'node:test';
import assert from 'node:assert/strict';
import { setLocale } from '../i18n.mjs';
import { initializePwa } from '../pwa.mjs';
class Element extends EventTarget { hidden=false; textContent=''; open=false; showModal(){this.open=true;} click(){this.dispatchEvent(new Event('click'));} }
function setup({failure=false,waiting=null,standalone=false}={}){
  const ids=['install-button','pwa-status','install-confirm','pwa-update','install-dialog'];
  const elements=new Map(ids.map(id=>[id,new Element()]));
  const registration=new EventTarget(); registration.waiting=waiting; registration.active=failure?null:{};
  const worker=new EventTarget();worker.ready=failure?new Promise(()=>{}):Promise.resolve({active:{}});worker.register=async()=>{if(failure)throw new Error('blocked');return registration;};
  const win=new EventTarget();win.isSecureContext=true;
  const originals=new Map(['document','window','navigator','matchMedia','location'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  let reloads=0;
  for(const [key,value] of Object.entries({document:{getElementById:id=>elements.get(id)},window:win,navigator:{serviceWorker:worker},matchMedia:()=>({matches:standalone}),location:{reload:()=>{reloads++;}}}))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  return {elements,worker,registration,win,get reloads(){return reloads;},restore(){for(const [key,descriptor] of originals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('PWA UI handles install prompting, cancellation and offline-ready status',async()=>{
  const h=setup();setLocale('en');
  try{
    initializePwa({beforeReload:()=>{}});await settle();assert.match(h.elements.get('pwa-status').textContent,/Offline mode is ready/);
    h.elements.get('install-button').click();assert.equal(h.elements.get('install-dialog').open,true);
    const event=new Event('beforeinstallprompt',{cancelable:true});let prompted=0;event.prompt=async()=>{prompted++;};event.userChoice=Promise.resolve({outcome:'dismissed'});
    h.win.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(h.elements.get('install-confirm').hidden,false);
    h.elements.get('install-confirm').click();await settle();assert.equal(prompted,1);assert.equal(h.elements.get('install-confirm').hidden,true);
  }finally{h.restore();setLocale('ru');}
});
test('PWA UI locks before activating a waiting update and reloads only on that update',async()=>{
  const messages=[];let locks=0;const h=setup({waiting:{postMessage:message=>messages.push(message)}});
  try{
    initializePwa({beforeReload:()=>{locks++;}});await settle();
    h.worker.dispatchEvent(new Event('controllerchange'));assert.equal(h.reloads,0);
    assert.equal(h.elements.get('pwa-update').hidden,false);h.elements.get('pwa-update').click();
    assert.equal(locks,1);assert.deepEqual(messages,[{type:'ACTIVATE_UPDATE'}]);h.worker.dispatchEvent(new Event('controllerchange'));assert.equal(h.reloads,1);
  }finally{h.restore();}
});
test('PWA UI shows registration failure and hides install control in installed mode',async()=>{
  const h=setup({failure:true,standalone:true});setLocale('en');
  try{
    initializePwa({beforeReload:()=>{}});await settle();
    assert.equal(h.elements.get('install-button').hidden,true);assert.match(h.elements.get('pwa-status').textContent,/Offline setup is unavailable/);
  }finally{h.restore();setLocale('ru');}
});
