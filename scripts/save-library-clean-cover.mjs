import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [id,source,followupRequest]=process.argv.slice(2);assert.match(id,/^\d+$/);
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const plan=JSON.parse(await fs.readFile(path.join(root,'generation-plan.json'),'utf8'));
const original=plan.find(e=>e.id===id);assert(original);
let entry=original;
if(followupRequest){
 const request=JSON.parse(await fs.readFile(followupRequest,'utf8'));
 assert.equal(request.id,id);assert.equal(request.output,original.output);
 assert.equal(request.kind,'alternate-representative-scene');
 assert(request.prompt&&Array.isArray(request.references));
 for(const ref of request.references){assert.equal(createHash('sha256').update(await fs.readFile(ref.path)).digest('hex'),ref.sha256);}
 entry={...original,prompt:request.prompt,references:request.references,followupRequest,originalRequestPreserved:true};
}
const bytes=await fs.readFile(source);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert(Math.abs(width/height-16/9)<0.01,'Require landscape 16:9');
await fs.mkdir(path.join(root,'generated'),{recursive:true});
const dest=path.join(root,'generated',id+'.json');try{await fs.access(dest);throw Error('Existing result; do not overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.copyFile(source,entry.output);
const record={...entry,tool:'builtin-image_gen',source,sha256:createHash('sha256').update(bytes).digest('hex'),width,height,generatedAt:new Date().toISOString(),status:'generated-awaiting-visual-review'};
await fs.writeFile(dest,JSON.stringify(record,null,2));console.log(JSON.stringify({id,width,height,sha256:record.sha256}));
