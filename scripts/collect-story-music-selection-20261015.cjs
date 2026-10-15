// Read-only inventory and source audio collection for user-authorized BGM assignment.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),r=createRequire(path.join(root,'packages/server/package.json'));
r('dotenv').config({path:process.env.TANGO_ENV_PATH||'C:/projects/tangobook/packages/server/.env',quiet:true});
const {S3Client,GetObjectCommand,ListObjectsV2Command}=r('@aws-sdk/client-s3');
const s3=new S3Client({region:'auto',endpoint:'https://'+process.env.R2_ACCOUNT_ID+'.r2.cloudflarestorage.com',credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY},maxAttempts:2}),Bucket=process.env.R2_BUCKET_NAME;
const out='D:/tangobook-video/classic-bgm-20261015/selection';fs.mkdirSync(path.join(out,'legacy'),{recursive:true});
const get=async Key=>{const q=await s3.send(new GetObjectCommand({Bucket,Key}));return {etag:q.ETag,body:Buffer.from(await q.Body.transformToByteArray())};};
async function main(){
 const audit=JSON.parse(fs.readFileSync(path.join(root,'packages/client/public/library-content-audit.json'))).rows;
 const known=new Map(audit.map(b=>['storybook-'+b.id+'.json',b]));let keys=[],token;
 do{const x=await s3.send(new ListObjectsV2Command({Bucket,Prefix:'storybook-',ContinuationToken:token}));keys.push(...(x.Contents||[]).map(o=>o.Key).filter(k=>/^storybook-[^/]+\.json$/.test(k)));token=x.IsTruncated?x.NextContinuationToken:undefined;}while(token);
 const target=k=>!known.has(k)||['세계명작','전래동화'].includes((known.get(k).category||'').replace(/\s/g,''));
 const pending=keys.filter(target),books=[],failures=[];
 for(let i=0;i<pending.length;i+=8)await Promise.all(pending.slice(i,i+8).map(async Key=>{try{const q=await get(Key),book=JSON.parse(q.body);if(['세계명작','전래동화'].includes((book.category||'').replace(/\s/g,'')))books.push({Key,etag:q.etag,book});}catch(e){failures.push({Key,error:e.name});}}));
 const library=JSON.parse((await get('background-music.json')).body);
 for(let i=0;i<library.length;i+=4)await Promise.all(library.slice(i,i+4).filter(t=>!t.id.startsWith('pig-')).map(async t=>{const file=path.join(out,'legacy',t.id+'.mp3');if(!fs.existsSync(file)){const q=await get(decodeURIComponent(new URL(t.url).pathname.slice(1)));fs.writeFileSync(file,q.body);}t.localFile=file;}));
 fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify({fetchedAt:new Date().toISOString(),sourceKeys:keys.length,requested:pending.length,books,failures,library},null,2));
 console.log(JSON.stringify({keys:keys.length,requested:pending.length,failures,books:books.length,categories:books.reduce((o,x)=>(o[x.book.category]=(o[x.book.category]||0)+1,o),{}),folktales:books.filter(x=>x.book.category.includes('전래')).map(x=>({id:x.book.id,title:x.book.title,pages:x.book.pages.length}))},null,2));
 if(failures.length)process.exitCode=1;
}main().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1;});
