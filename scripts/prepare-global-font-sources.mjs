// Local compatibility prototype inputs only. No font upload or book mutation.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='D:/ComfyUI-output/library-clean-covers-20261006/font-sources';await fs.mkdir(root,{recursive:true});
const base='https://raw.githubusercontent.com/notofonts';
const items=[
 ['NotoSansSC-VF.ttf',base+'/noto-cjk/main/Sans/Variable/TTF/Subset/NotoSansSC-VF.ttf'],
 ['NotoSansJP-VF.ttf',base+'/noto-cjk/main/Sans/Variable/TTF/Subset/NotoSansJP-VF.ttf'],
 ['NotoSans-Regular.ttf',base+'/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'],
 ['NotoSansThai-Regular.ttf',base+'/noto-fonts/main/hinted/ttf/NotoSansThai/NotoSansThai-Regular.ttf'],
 ['OFL-CJK.txt',base+'/noto-cjk/main/Sans/LICENSE'],
 ['OFL-Noto.txt',base+'/noto-fonts/main/LICENSE'],
];
const records=[];
for(const [name,url] of items){let bytes;try{bytes=await fs.readFile(root+'/'+name);}catch{const response=await fetch(url,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error(response.status+' '+url);bytes=Buffer.from(await response.arrayBuffer());await fs.writeFile(root+'/'+name,bytes);}records.push({name,url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});console.log(JSON.stringify({name,bytes:bytes.length}));}
await fs.writeFile(root+'/sources.json',JSON.stringify(records,null,2));
