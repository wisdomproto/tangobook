import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex');
const frozen=JSON.parse(await fs.readFile(root+'/books-before.json','utf8'));
const protectedFields=b=>{const c=structuredClone(b);for(const k of ['updatedAt','cleanCoverImage','coverImages'])delete c[k];return c;};
const rows=[];
for(const id of Object.keys(frozen)){
 const r=JSON.parse(await fs.readFile(root+'/registered/'+id+'.json','utf8'));
 assert.equal(r.status,'registered-verified');assert.deepEqual(protectedFields(r.before),protectedFields(r.after));
 assert.equal(r.after.cleanCoverImage,r.url);assert.equal(sha(await fs.readFile(root+'/cdn/'+id+'.webp')),r.cdnSha256);
 assert(Math.abs(r.dimensions.width/r.dimensions.height-16/9)<.01);
 rows.push({id,cdnSha256:r.cdnSha256,verifiedAt:r.verifiedAt});
}
const response=await fetch('https://www.tangobook.co.kr/api/storybooks',{signal:AbortSignal.timeout(60000)});
assert(response.ok);const current=await response.json();assert(current.success&&Array.isArray(current.data));
const old=JSON.parse(await fs.readFile(root+'/all-list.json','utf8')).data;
const fields=['coverImage','cleanCoverImage','primaryCoverByLang','coversByLang','title','titleTranslations','pageCount'];
let preserved=0;
for(const before of old.filter(b=>!frozen[b.id])){
 const after=current.data.find(b=>b.id===before.id);assert(after);
 for(const f of fields)assert.deepEqual(after[f],before[f],before.id+' '+f);
 preserved++;
}
assert.equal(preserved,945);
const audit={at:new Date().toISOString(),registered:rows.length,total:365,preservedCreativeAndPhonicsListedMetadata:preserved,
 scope:'All365 durable registration ledgers: protected before/after fields, saved CDN SHA/16:9. Fresh945 unaffected listing cover/title/pageCount metadata comparison; not a new full body or browser audit.',rows};
await fs.writeFile(root+'/registration-audit-complete.json',JSON.stringify(audit,null,2));
console.log(JSON.stringify({registered:rows.length,preserved}));
