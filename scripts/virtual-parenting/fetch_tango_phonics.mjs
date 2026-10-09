// Read one existing product asset. No writes to R2 and no credentials in output.
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../../packages/server/package.json',import.meta.url));
require('dotenv').config({path:'C:/projects/tangobook/packages/server/.env',quiet:true});
const {S3Client,GetObjectCommand}=require('@aws-sdk/client-s3');
const client=new S3Client({region:'auto',endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY}});
const key='phonics-word-cards/kr-h1-u02-gagu-18fdf742-w800.webp';
const response=await client.send(new GetObjectCommand({Bucket:process.env.R2_BUCKET_NAME,Key:key}),{abortSignal:AbortSignal.timeout(30000)});
const bytes=await response.Body.transformToByteArray();
const root='D:/ComfyUI-output/virtual-parenting-20261006/tango-v8/';
writeFileSync(root+'phonics-gagu.webp',bytes);
writeFileSync(root+'phonics-source.json',JSON.stringify({word:'가구',unitId:'kr-h1-u02',key,sourceIndex:'packages/client/public/activity-data/coloring.json',sha256:createHash('sha256').update(bytes).digest('hex')},null,2));
console.log('Existing phonics asset saved:',bytes.length,'bytes');
