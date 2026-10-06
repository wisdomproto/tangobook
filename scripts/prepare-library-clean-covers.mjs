import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
try {await fs.access(path.join(root,'generation-plan.json'));throw Error('Frozen plan exists; do not duplicate');}catch(e){if(e.code!=='ENOENT')throw e;}
const books=JSON.parse(await fs.readFile(path.join(root,'books-before.json'),'utf8'));
const output=path.resolve('generated-images/library-clean-covers');
await fs.mkdir(output,{recursive:true});await fs.mkdir(path.join(root,'references'),{recursive:true});
const plan=Object.values(books).map(b=>{
 const page=b.pages.find(p=>p.illustrationUrl);if(!page)throw Error('No illustration '+b.id);
 const urls=[b.cleanCoverImage??b.coverImage,page.illustrationUrl].filter(Boolean);
 const title=b.title.replace(/_그림체\d+$/,'');
 return {id:b.id,title,category:b.category,aspectRatio:'16:9',output:path.join(output,b.id+'.png').replaceAll('\\','/'),references:urls.map((url,i)=>({url,path:path.join(root,'references',b.id+'-'+i+'.png').replaceAll('\\','/')})),status:'prepared',prompt:`Use case: illustration-story\nAsset type: text-free children's book cover, exact LANDSCAPE 16:9 (1536 x 864).\nBook identity: ${title}. Category: ${b.category}.\nReference image 1: existing cover artwork, a style/character/composition reference ONLY; do NOT reproduce its lettering. Reference image 2: existing interior scene, character/species/clothing/style reference.\nCreate a polished NEW wide cover illustration in this book's existing drawing medium and palette, keeping recognizable characters/species and the main story's setting. Preserve the actual illustrated character design and narrative. For photographic nature books preserve species and educational subject with friendly, clear presentation; do not add faces to plants, body organs or space.\nStory context: ${b.pages.slice(0,5).map(p=>p.text??'').join(' ')}\nComposition: horizontal edge-to-edge illustration, no cropping characters, no portrait inset, no stretching or letterboxing. Reserve calm natural negative space in the upper part for a later title overlay, integrated with scenery, not a blank banner.\nTEXT: ABSOLUTELY NONE. Remove all Korean/English/other letters, calligraphy, labels, numbers, logos, stamps, title panels, borders and watermarks. Do not copy text from the reference. Titles will be rendered by the application in all languages. No extra invented characters, no book mockup, no coloring-page line art. Opaque background.`};
});
let next=0;await Promise.all(Array.from({length:12},async()=>{while(next<plan.length){const entry=plan[next++];for(const ref of entry.references){let bytes;try{bytes=await fs.readFile(ref.path);}catch{const r=await fetch(ref.url,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error(entry.id+' reference '+r.status);bytes=Buffer.from(await r.arrayBuffer());await fs.writeFile(ref.path,bytes);}ref.sha256=sha(bytes);}}}));
await fs.writeFile(path.join(root,'generation-plan.json'),JSON.stringify(plan,null,2));
await fs.writeFile(path.join(output,'prompts.json'),JSON.stringify(plan,null,2));
console.log(JSON.stringify({total:plan.length,root,output}));
