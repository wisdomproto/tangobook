// Read-only preparation. Does not select music aesthetically or write to R2/books.
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../docs/audio/classic-bgm-20261015');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const catalog=read('music-catalog.json'),generated=read('library-generation.json'),revision=read('climax-v2-generation.json'),pig=read('pig-v2-generation.json');
const roles=['opening','climax','ending'];
const sources=[...generated.sets,...catalog.sets.filter(s=>s.kind==='legacy')];
const sets=sources.map(s=>{
 const active=catalog.sets.find(x=>x.id===s.id),r=revision.sets.find(x=>x.id===s.id);
 const tracks=roles.map((role,i)=>{
  if(role==='climax'){
   if(s.id==='classic-01')return {role,status:'file-available',url:'https://assets.tangobook.co.kr/background-music/three-pigs-v2-20261015/climax.mp3',candidates:pig.roles.find(t=>t.role===role).candidates,selectedCandidate:0,reason:'Previously downloaded pig v2 A; preserve existing opening/ending per current request.'};
   return {role,status:'download-blocked',selectedCandidate:null,candidates:r.candidates,review:'Compare tension, instrumental tone and narration compatibility after obtaining files; A/B order is not a ranking.'};
  }
  if(active)return {role,status:'file-available',...active.tracks[i]};
  return {role,status:'download-blocked',selectedCandidate:null,candidates:s.tracks.find(t=>t.role===role).candidates,review:'Retain original opening/ending generation; choose one candidate after file review.'};
 });
 return {id:s.id,name:s.name,genre:s.genre,priority:active?1:2,active:!!active,booksCurrentlyReferencing:catalog.assignments.filter(a=>a.setIds.includes(s.id)).map(a=>a.id),tracks};
});
const assignments=catalog.assignments.map(a=>({...a,selectionUnit:'one three-track set per reading session',policy:'Keep current genre-matching set pool and page boundaries when replacing climax URLs.'}));
for(const a of assignments){if(a.startPages.length!==3||a.startPages.some((n,i)=>n<1||n>a.pageCount||(i&&n<=a.startPages[i-1])))throw Error('Invalid boundary '+a.id);for(const id of a.setIds)if(sets.find(s=>s.id===id)?.genre!==a.genre)throw Error('Genre mismatch '+a.id);}
const downloads=sets.flatMap(s=>s.tracks.filter(t=>t.status==='download-blocked').map(t=>({setId:s.id,genre:s.genre,priority:s.priority,role:t.role,candidates:t.candidates})));
const plan={date:'2026-10-15',status:'waiting-for-official-downloads',authorization:'User authorized selecting candidates, keeping existing opening/ending, three-track sets and genre-separated book assignments. No new purchase or deployment authorization.',blocker:{provider:'Suno',remainingDownloads:0,refreshDate:'2026-11-15',evidence:'download-limit-20261015.png'},review:'No claim of auditory or aesthetic selection from metadata. Pending choices remain null.',counts:{sets:sets.length,activeSets:sets.filter(s=>s.active).length,books:assignments.length,downloadsForActiveSets:downloads.filter(t=>t.priority===1).length,downloadsForAllSets:downloads.length},sets,assignments,downloads,nextSteps:['Restore official download access.','Compare candidate audio and retain coherent instruments/mood per set.','Download selected official files; decode and normalize; check speech/silence/peaks without equating technical checks to aesthetic approval.','Use immutable R2 URLs and ETag-conditional book writes; preserve unrelated fields, current genre pools and page boundaries.','Verify all book readbacks and actual random-set/page-transition playback; update listening page native set playback.']};
fs.writeFileSync(path.join(dir,'v2-connection-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan.counts));
