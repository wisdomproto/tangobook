// User-authorized music connection. Default is a read-only plan; --apply writes exact targets.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const req=createRequire(path.join(root,'packages/server/package.json'));
req('dotenv').config({path:process.env.TANGO_ENV_PATH||'C:/projects/tangobook/packages/server/.env',quiet:true});
const {S3Client,GetObjectCommand,HeadObjectCommand,PutObjectCommand}=req('@aws-sdk/client-s3');
const s3=new S3Client({region:'auto',endpoint:'https://'+process.env.R2_ACCOUNT_ID+'.r2.cloudflarestorage.com',credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY},maxAttempts:2});
const Bucket=process.env.R2_BUCKET_NAME;
const base=(process.env.R2_CDN_URL||'https://assets.tangobook.co.kr').replace(/\/$/,'');
const apply=process.argv.includes('--apply');
const backup='D:/tangobook-video/classic-bgm-20261015/connection-backup';
const get=async Key=>{const r=await s3.send(new GetObjectCommand({Bucket,Key}));return {etag:r.ETag,data:JSON.parse(await r.Body.transformToString('utf8'))};};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const roles=[['opening',1,'시작'],['tension',6,'위기'],['climax',12,'클라이맥스'],['resolution',15,'해소']];
async function main(){
 const survey=JSON.parse(fs.readFileSync(path.join(root,'docs/audio/classic-bgm-20261015/survey.json'),'utf8'));
 const pig=survey.books.find(b=>b.title==='아기 돼지 삼형제');
 const library=await get('background-music.json');
 if(!Array.isArray(library.data))throw Error('Invalid existing music catalog; do not replace');
 const tracks=roles.map(([role,startPage,label])=>({id:'pig-20261015-'+role,startPage,role:label,title:'아기 돼지 삼형제 · '+label,url:base+'/background-music/three-pigs-20261015/'+role+'.mp3'}));
 const cues=[tracks[0],{...tracks[2],startPage:6},tracks[3]];
 const musicSets=[{id:'classic-pig-20261015-01',title:'명작 01 · 아기 돼지 작은 관현악',genre:'classic',cues}];
 const books=[];
 for(const id of pig.variantIds){
  const Key='storybook-'+id+'.json',r=await get(Key),b=r.data;
  if(!b.title.replace(/\s/g,'').startsWith('아기돼지삼형제')||b.pages.length!==15)throw Error('Unexpected book '+id);
  const bodyHash=hash(Buffer.from(JSON.stringify(b.pages.map(p=>p.text))));
  if(bodyHash!==pig.textSha256)throw Error('Story changed; review cue pages '+id);
  if(b.backgroundMusicSets?.length&&JSON.stringify(b.backgroundMusicSets)!==JSON.stringify(musicSets))throw Error('Preserve existing music sets '+id);
  if(b.backgroundMusicCues?.length&&![JSON.stringify(tracks),JSON.stringify(cues)].includes(JSON.stringify(b.backgroundMusicCues)))throw Error('Preserve existing scene cues '+id);
  books.push({Key,...r});
 }
 const plan={apply,tracks,cues,musicSets,books:books.map(b=>({id:b.data.id,title:b.data.title,existingMusicPreserved:b.data.backgroundMusicUrl})),existingLibraryCount:library.data.length};
 console.log(JSON.stringify(plan,null,2));
 if(!apply)return;
 fs.mkdirSync(backup,{recursive:true});
 // Record pre-images only once. Never overwrite an earlier backup with modified data.
 for(const r of [{Key:'background-music.json',...library},...books]){
  const target=path.join(backup,r.Key);if(!fs.existsSync(target))fs.writeFileSync(target,JSON.stringify(r.data,null,2));
 }
 for(const [role] of roles){
  const Key='background-music/three-pigs-20261015/'+role+'.mp3';
  const Body=fs.readFileSync(path.join(root,'packages/client/public/sounds/storybook/pig-20261015/'+role+'.mp3'));
  let exists=false;
  try{await s3.send(new HeadObjectCommand({Bucket,Key}));exists=true;}catch(e){if(e.$metadata?.httpStatusCode!==404)throw e;}
  if(exists){const r=await s3.send(new GetObjectCommand({Bucket,Key}));if(hash(Buffer.from(await r.Body.transformToByteArray()))!==hash(Body))throw Error('Preserve different existing object '+Key);}
  else await s3.send(new PutObjectCommand({Bucket,Key,Body,ContentType:'audio/mpeg',CacheControl:'public,max-age=31536000,immutable',IfNoneMatch:'*'}));
 }
 const entries=tracks.map(({id,title,url})=>({id,title,url,createdAt:new Date().toISOString()}));
 const merged=[...library.data];
 for(const e of entries)if(!merged.some(x=>x.url===e.url))merged.push(e);
 if(merged.length!==library.data.length)await s3.send(new PutObjectCommand({Bucket,Key:'background-music.json',Body:JSON.stringify(merged),ContentType:'application/json',CacheControl:'no-cache',IfMatch:library.etag}));
 for(const r of books){
  const updated={...r.data,backgroundMusicCues:cues,backgroundMusicSets:musicSets,updatedAt:new Date().toISOString()};
  await s3.send(new PutObjectCommand({Bucket,Key:r.Key,Body:JSON.stringify(updated),ContentType:'application/json',IfMatch:r.etag}));
  const actual=(await get(r.Key)).data;
  if(JSON.stringify(actual.backgroundMusicCues)!==JSON.stringify(cues)||JSON.stringify(actual.backgroundMusicSets)!==JSON.stringify(musicSets)||actual.backgroundMusicUrl!==r.data.backgroundMusicUrl)throw Error('Readback mismatch '+r.Key);
  const {backgroundMusicCues:a,backgroundMusicSets:aSets,updatedAt:b,...rest}=actual;
  const {backgroundMusicCues:c,backgroundMusicSets:cSets,updatedAt:d,...before}=r.data;
  if(JSON.stringify(rest)!==JSON.stringify(before))throw Error('Unrelated data changed '+r.Key);
 }
 const receipt={...plan,completedAt:new Date().toISOString(),libraryCountAfter:(await get('background-music.json')).data.length,verification:'3 books: exact three-cue/one-set readback, legacy music unchanged, all other fields identical; conditional writes; 4 immutable audio objects'};
 fs.writeFileSync(path.join(root,'docs/audio/classic-bgm-20261015/pig-connection.json'),JSON.stringify(receipt,null,2));
}
main().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1;});
