import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('packages/server/package.json'));
const sharp=require('sharp');
const root='D:/ComfyUI-output/library-clean-covers-20261006',api='https://www.tangobook.co.kr/api';
const sha=b=>createHash('sha256').update(b).digest('hex');
const normalized=u=>u.replace('https://pub-554d78bf0f2346cfb850060ac23280a7.r2.dev/','https://assets.tangobook.co.kr/');
const get=async id=>{const r=await fetch(api+'/storybooks/'+id,{signal:AbortSignal.timeout(60000)});assert(r.ok);const j=await r.json();assert(j.success);return j.data;};
const protectedFields=b=>{const x=structuredClone(b);for(const k of ['updatedAt','cleanCoverImage','coverImages'])delete x[k];return x;};
const originals=JSON.parse(await fs.readFile(root+'/books-before.json','utf8'));
const ids=process.argv.slice(2);assert(ids.length);
for(const name of ['registered','cdn'])await fs.mkdir(path.join(root,name),{recursive:true});
for(const id of ids){
 assert(originals[id],'Only the frozen 365 original books may be modified');
 const record=JSON.parse(await fs.readFile(root+'/generated/'+id+'.json','utf8'));assert.equal(record.status,'visually-approved');
 const bytes=await fs.readFile(record.output);assert.equal(sha(bytes),record.sha256);
 const file=root+'/registered/'+id+'.json';let ledger;try{ledger=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
 const before=await get(id);
 if(ledger?.status==='registered-verified'){assert.equal(before.cleanCoverImage,ledger.url);assert.deepEqual(protectedFields(before),protectedFields(ledger.before));console.log(JSON.stringify({id,status:'already-verified'}));continue;}
 ledger??={id,before,generatedSha256:record.sha256,startedAt:new Date().toISOString()};
 assert.equal(ledger.generatedSha256,record.sha256);assert.deepEqual(protectedFields(before),protectedFields(ledger.before));
 assert(before.cleanCoverImage===ledger.before.cleanCoverImage||before.cleanCoverImage===ledger.url,'Concurrent clean-cover replacement');
 await fs.writeFile(file,JSON.stringify(ledger,null,2));
 if(!ledger.url){const form=new FormData();form.append('image',new Blob([bytes],{type:'image/png'}),id+'.png');form.append('storybookId',id);form.append('storybookTitle',before.title);form.append('type','cover');
  const r=await fetch(api+'/images/upload',{method:'POST',body:form,signal:AbortSignal.timeout(120000)});assert(r.ok,'upload '+r.status);const j=await r.json();assert(j.success&&j.data.imageUrl);ledger.url=normalized(j.data.imageUrl);await fs.writeFile(file,JSON.stringify(ledger,null,2));}
 const response=await fetch(ledger.url,{signal:AbortSignal.timeout(120000)});assert(response.ok);const cdn=Buffer.from(await response.arrayBuffer());const meta=await sharp(cdn).metadata();assert(meta.width&&meta.height&&Math.abs(meta.width/meta.height-16/9)<0.01);
 ledger.cdnSha256=sha(cdn);ledger.dimensions={width:meta.width,height:meta.height};await fs.writeFile(root+'/cdn/'+id+'.webp',cdn);await fs.writeFile(file,JSON.stringify(ledger,null,2));
 const fresh=await get(id);assert.deepEqual(fresh,before,'Concurrent book edit; reconcile before save');
 // Preserve legacy multilingual covers until the new UI is deployed; only its clean base is replaced.
 const revision={id:'library-clean-cover-20261006',imageUrl:ledger.url,prompt:record.prompt};
 const updated={...fresh,cleanCoverImage:ledger.url,coverImages:[...(fresh.coverImages??[]).filter(c=>c.id!==revision.id),revision]};
 const saved=await fetch(api+'/storybooks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storybook:updated}),signal:AbortSignal.timeout(120000)});assert(saved.ok,'save '+saved.status);assert((await saved.json()).success);
 const after=await get(id);assert.equal(after.cleanCoverImage,ledger.url);assert.deepEqual(protectedFields(after),protectedFields(ledger.before),'Non-clean-cover book data changed');
 const version=await fetch(ledger.url+'?v='+ledger.cdnSha256,{signal:AbortSignal.timeout(120000)});assert(version.ok);assert.equal(sha(Buffer.from(await version.arrayBuffer())),ledger.cdnSha256);
 ledger.after=after;ledger.status='registered-verified';ledger.verifiedAt=new Date().toISOString();await fs.writeFile(file,JSON.stringify(ledger,null,2));console.log(JSON.stringify({id,status:ledger.status}));
}
