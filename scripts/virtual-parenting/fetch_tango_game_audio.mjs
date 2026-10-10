// Read only existing game sounds; no remote writes or credentials in output.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../../packages/server/package.json',import.meta.url));
require('dotenv').config({path:'C:/projects/tangobook/packages/server/.env',quiet:true});
const {S3Client,GetObjectCommand,ListObjectsV2Command}=require('@aws-sdk/client-s3');
const client=new S3Client({region:'auto',endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY}});
const root='D:/ComfyUI-output/virtual-parenting-20261006/tango-sequence/audio/';mkdirSync(root,{recursive:true});
const bucket=process.env.R2_BUCKET_NAME,records=[];
async function get(key,file){const r=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));const b=await r.Body.transformToByteArray();writeFileSync(root+file,b);records.push({key,file,sha256:createHash('sha256').update(b).digest('hex')});}
await get('phonics-library/mod_korean/가.mp3','ga.mp3');
await get('phonics-library/mod_korean/구.mp3','gu.mp3');
const listed=await client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:'system-sounds/korean/correct/',MaxKeys:100}));
const choices=(listed.Contents??[]).map(x=>x.Key).filter(x=>x.endsWith('.mp3')).sort();
if(!choices.length)throw new Error('Existing Korean praise sound not found');
await get(choices.find(x=>x.includes('잘했'))??choices[0],'praise.mp3');
copyFileSync(new URL('../../packages/client/public/sounds/game/correct.mp3',import.meta.url),root+'correct.mp3');
writeFileSync(root+'sources.json',JSON.stringify({records,praiseChoices:choices,correct:'packages/client/public/sounds/game/correct.mp3',wordPolicy:'Existing ga + gu syllable audio concatenated with zero gap; no new TTS'},null,2));
console.log(JSON.stringify(records.map(x=>({file:x.file,key:x.key})),null,2));
