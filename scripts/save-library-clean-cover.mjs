import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [id,source,followupRequest]=process.argv.slice(2);assert.match(id,/^\d+$/);
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const plan=JSON.parse(await fs.readFile(path.join(root,'generation-plan.json'),'utf8'));
const original=plan.find(e=>e.id===id);assert(original);
let entry=original;
let tool='builtin-image_gen';
if(followupRequest){
 const request=JSON.parse(await fs.readFile(followupRequest,'utf8'));
 assert.equal(request.id,id);assert.equal(request.output,original.output);
 assert.equal(request.kind,'alternate-representative-scene');
 assert(request.prompt&&Array.isArray(request.references));
 for(const ref of request.references){assert.equal(createHash('sha256').update(await fs.readFile(ref.path)).digest('hex'),ref.sha256);}
 if(request.tool==='local-qwen-image-2.1'){
  const history=JSON.parse(await fs.readFile(request.historyPath,'utf8'))[request.promptId];
  const graph=JSON.parse(await fs.readFile(request.workflowPath,'utf8'));
  assert.equal(createHash('sha256').update(await fs.readFile(request.workflowPath)).digest('hex'),request.workflowSha256);
  assert(history?.status?.status_str==='success');
  assert.deepEqual(history.prompt[2],graph);
  assert.equal(graph['5'].inputs.prompt,request.prompt);
  assert.equal(graph['1'].inputs.unet_name,'qwen_image_2.1_int8_convrot.safetensors');
  assert.equal(graph['4'].inputs.image,request.comfyInput);
  assert.deepEqual(graph['5'].inputs['images.image_1'],['10',0]);
  assert.equal(graph['10'].inputs.width,1024);assert.equal(graph['10'].inputs.height,576);
  assert.equal(request.references.length,1);
  assert.equal(createHash('sha256').update(await fs.readFile(request.comfyInputPath)).digest('hex'),request.references[0].sha256);
  assert.equal(createHash('sha256').update(await fs.readFile(source)).digest('hex'),request.outputSha256);
  tool=request.tool;
 } else { assert(!request.tool||request.tool==='builtin-image_gen'); }
 entry={...original,prompt:request.prompt,references:request.references,followupRequest,originalRequestPreserved:true};
}
const bytes=await fs.readFile(source);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert(Math.abs(width/height-16/9)<0.01,'Require landscape 16:9');
await fs.mkdir(path.join(root,'generated'),{recursive:true});
const dest=path.join(root,'generated',id+'.json');try{await fs.access(dest);throw Error('Existing result; do not overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.copyFile(source,entry.output);
const record={...entry,tool,source,sha256:createHash('sha256').update(bytes).digest('hex'),width,height,generatedAt:new Date().toISOString(),status:'generated-awaiting-visual-review'};
await fs.writeFile(dest,JSON.stringify(record,null,2));console.log(JSON.stringify({id,width,height,sha256:record.sha256}));
