import test from 'node:test';
import assert from 'node:assert/strict';
import { DriveClient, DRIVE_SCOPE, validClientId } from '../drive.mjs';
import { createVault, encryptVault, openVault } from '../crypto.mjs';
const response = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{'Content-Type':'application/json'}});
test('Client ID validation accepts public web IDs and rejects tokens, secrets and URLs',()=>{
  assert.equal(validClientId('12345-example_client.apps.googleusercontent.com'),true);
  for(const invalid of ['', 'https://example.com', 'client-secret', '12345-abc.apps.googleusercontent.com<script>']) assert.equal(validClientId(invalid),false);
});
test('Drive uploads only a validated encrypted envelope, with limited-scope authorization',async()=>{
  const requests=[];
  const client = new DriveClient({fetchImpl:async(url,options)=>{
    requests.push({url:String(url),options});
    if(String(url).includes('/upload/')) return response({id:'backup_id',name:'backup.json'});
    return response({files:[{id:'folder_id'}]});
  }});
  client.authorizeToken('test-token',3600,DRIVE_SCOPE);
  const master='drive test-only master phrase'; const opened=await createVault(master);
  const now='2026-11-04T10:00:00.000Z';
  const entry={id:'a',title:'Private name',username:'private@example.test',password:'private-test-secret',apiKeys:[{label:'private key label',value:'dummy-api-secret-only'}],url:'https://example.test/',notes:'private note',createdAt:now,updatedAt:now};
  const envelope=await encryptVault([entry],opened.key,opened.salt);
  assert.equal(envelope.version,2);
  const result=await client.backup(JSON.stringify({...envelope,unexpectedPlaintext:'must-not-leak'}),{date:new Date(now)});
  assert.equal(result.id,'backup_id'); assert.equal(requests.length,2);
  const upload=requests[1]; assert.match(upload.options.headers['Content-Type'],/^multipart\/related; boundary=/);
  assert.equal(upload.options.headers.Authorization,'Bearer test-token'); assert.equal(upload.options.credentials,'omit'); assert.equal(upload.options.cache,'no-store');
  for(const plaintext of [master,entry.title,entry.username,entry.password,entry.notes,entry.apiKeys[0].label,entry.apiKeys[0].value,'must-not-leak']) assert.equal(upload.options.body.includes(plaintext),false);
  assert.ok(upload.options.body.includes(envelope.ciphertext));
  assert.deepEqual((await openVault(JSON.stringify(envelope),master)).entries,[entry]);
});
test('malformed plaintext backup is rejected before any Google request',async()=>{
  let calls=0; const client=new DriveClient({fetchImpl:async()=>{calls++;return response({});}});
  client.authorizeToken('test-token',3600,DRIVE_SCOPE);
  await assert.rejects(client.backup('{"password":"plain"}'),/проверку/); assert.equal(calls,0);
});
test('folder creation, backup listing and untrusted file IDs are handled without broad Drive search',async()=>{
  const calls=[]; let index=0;
  const client=new DriveClient({fetchImpl:async(url,options)=>{
    calls.push({url:String(url),options}); index++;
    return [response({files:[]}),response({id:'new_folder'}),response({id:'new_backup'}),response({files:[{id:'valid-file',name:'copy.json'},{id:'../../bad',name:'bad'},{id:'<html>',name:'bad'}],nextPageToken:'more'})][index-1];
  }});
  client.authorizeToken('test-token',3600,DRIVE_SCOPE);
  const vault=await createVault('drive folder test-only phrase'); await client.backup(JSON.stringify(vault.envelope));
  assert.equal(calls[1].options.method,'POST'); assert.match(calls[1].options.body,/Password Manager Backups/);
  const listed=await client.listBackups(); assert.deepEqual(listed.files.map(x=>x.id),['valid-file']); assert.equal(listed.hasMore,true);
  assert.match(decodeURIComponent(calls[3].url),/encrypted-vault/);
});
test('Google access is not usable without consent, after expiry or after disconnect',async()=>{
  let now=0; const client=new DriveClient({now:()=>now,fetchImpl:async()=>response({files:[]})});
  await assert.rejects(client.listBackups(),/истёк/);
  assert.throws(()=>client.authorizeToken('test',3600,'openid'),/доступ/);
  client.authorizeToken('test',3600,DRIVE_SCOPE); assert.equal(client.connected,true); now=3_600_000; assert.equal(client.connected,false);
  now=0; client.authorizeToken('test',3600,DRIVE_SCOPE); let revoked=false;
  await client.disconnect(async token=>{assert.equal(token,'test');revoked=true;}); assert.equal(revoked,true); assert.equal(client.connected,false);
});
test('401 forgets the token; forbidden, network and cancellation errors are actionable',async()=>{
  for(const [reply,pattern] of [[()=>response({},401),/истёк/],[()=>response({},403),/недостаточно/],[()=>{throw new TypeError('offline');},/запрос/],[()=>{throw new DOMException('cancel','AbortError');},/отменена/]]){
    const client=new DriveClient({fetchImpl:async()=>reply()}); client.authorizeToken('test',3600,DRIVE_SCOPE);
    await assert.rejects(client.listBackups(),pattern);
  }
});
