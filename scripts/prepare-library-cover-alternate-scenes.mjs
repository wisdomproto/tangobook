import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='D:/ComfyUI-output/library-clean-covers-20261006';
const plan=JSON.parse(await fs.readFile(root+'/generation-plan.json','utf8'));
const runner=JSON.parse(await fs.readFile(root+'/runner.json','utf8'));
assert.equal(runner.status,'generation-finished-awaiting-review');
const scenes={
 '1772108468177':['Bright rounded 3D storybook illustration','A gleaming ornate oil lamp resting on a colorful market stall, with a grand domed Arabian palace and peaceful bustling market in the distance. Magical golden sparkles and warm sunlight.'],
 '1772197180029':['Bright rounded 3D storybook illustration','A friendly brown bear, elegant black panther, and gray wolf family exploring a lush Indian jungle clearing. Animal-only composition with fern trees, river and soft golden light.'],
 '1777266835789':['Bright rounded 3D storybook illustration','A cheerful carved wooden puppet boy with a long wooden nose, fully dressed in a cream shirt, brown vest, green trousers and shoes, standing on a tidy woodcarver workshop bench beside craft tools and a warm window.'],
 '1777272102062':['Bright rounded 3D storybook illustration','A stone tower rising in a flower-filled forest, with a very long golden braid cascading from its high window. Peaceful garden, lilac flowers and a welcoming winding path. Environment-centered composition.'],
 '1778555233699':['Layered colorful cut-paper craft illustration','A peaceful cottage garden with a fully dressed princess with short black hair, blue bodice and long yellow skirt, surrounded by seven friendly small bearded woodland companions in colorful tunics and hats.'],
 '1789350946295':['Colorful textured collage with hand-cut paper shapes','A peaceful woodland cottage and flower-filled garden, a fully dressed princess with black hair and a long blue-and-yellow dress, and seven friendly small bearded companions in tunics and hats.'],
 '1789350946326':['Luminous painterly watercolor storybook illustration','A tall stone tower in an enchanting forest, a long golden braid cascading from its high window, purple wildflowers, sunlit path and distant castle. Environment-centered composition.'],
 '1789350946328':['Textured hand-cut paper collage with vibrant paint marks','A cheerful wooden puppet with a long wooden nose, fully dressed in a white shirt, red waistcoat, green trousers, hat and shoes, in a charming workshop with a kind elderly woodcarver, wooden toys and a warm window.'],
 '1789350946329':['Luminous detailed painterly watercolor storybook illustration','A cheerful wooden puppet with a long wooden nose, fully dressed in a shirt, colorful waistcoat, trousers and shoes, beside a kind elderly fully clothed woodcarver in a warm workshop. Craft tools, wooden toys and golden lamplight.'],
 '1789350946343':['Textured hand-cut paper collage with vibrant paint marks','A friendly brown bear and elegant black panther beside a gray wolf family in a lush jungle, river, broad green leaves and a sunlit clearing. Animal-only scene.'],
 '1789350946347':['Colorful layered cut-paper collage with patterned paper','A fully clothed curious girl in a long purple patterned dress and white apron, beside a white rabbit in a waistcoat at a whimsical tea garden. Clock, teapot, flowers and distant castle.']
};
await fs.mkdir(root+'/alternate-requests',{recursive:true});
const requests=[];
for(const [id,[style,scene]] of Object.entries(scenes)){
 const original=plan.find(p=>p.id===id);assert(original);
 await fs.access(root+'/failures/'+id+'.json');
 try{await fs.access(root+'/generated/'+id+'.json');throw Error('Existing output '+id);}catch(e){if(e.code!=='ENOENT')throw e;}
 const file=root+'/alternate-requests/'+id+'.json';
 const request={id,kind:'alternate-representative-scene',output:original.output,title:original.title,references:[],originalReferences:original.references,originalRequest:root+'/requests/'+id+'.json',originalOutcome:'completed producer; failed-or-uncertain ledger; no saved generated output',style,scene,prompt:`Create a new text-free children's book cover for ${original.title}. LANDSCAPE 16:9, edge-to-edge wide composition, opaque background. Medium: ${style}. Scene: ${scene} This is a new representative scene, not a reconstruction of a prior failed request. Warm, welcoming mood, polished coherent illustration, clear composition. Leave calm natural scenery near the top for an application-rendered title. Absolutely no letters, words, numbers, title panels, logos, watermarks or book mockups. Do not add characters outside the described scene.`,status:'prepared',preparedAt:new Date().toISOString()};
 try{await fs.access(file);throw Error('Frozen alternate request exists '+id);}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.writeFile(file,JSON.stringify(request,null,2));requests.push(request);
}
await fs.writeFile(root+'/alternate-scenes-plan.json',JSON.stringify(requests,null,2));
console.log(JSON.stringify(requests));
