// Rebuild a local research report from a read-only, sanitized catalog snapshot.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = process.argv[2] || 'D:/tangobook-video/classic-bgm-20261015/books.json';
const output = path.join(root, 'docs/audio/classic-bgm-20261015');
fs.mkdirSync(output, { recursive: true });
const input = JSON.parse(fs.readFileSync(source, 'utf8'));
if (input.failures.length) throw Error('Incomplete source collection');
const families = [
 ['A','궁전과 마법','셀레스타·하프·작은 현악·목관','celesta, harp, chamber strings and warm woodwinds','D major / B minor',78],
 ['B','숲속의 긴장과 구출','피치카토·바순·클라리넷·낮은 현악','pizzicato strings, bassoon, clarinet and soft low strings','G major / E minor',84],
 ['C','신기한 세계의 모험','마림바·목관·현악·가벼운 타악','marimba, woodwinds, chamber strings and light percussion','C major / A minor',88],
 ['D','넓은 세상의 탐험','어쿠스틱 기타·목관·핸드 퍼커션','acoustic guitar, woodwinds, soft hand percussion and warm strings','F major / D minor',86],
 ['E','장난과 협동','피치카토·클라리넷·목금·가벼운 피아노','pizzicato strings, clarinet, wooden mallets and light piano','C major / A minor',92],
 ['F','집과 성장','펠트 피아노·기타·현악·목관','felt piano, acoustic guitar, chamber strings and gentle woodwinds','G major / E minor',72],
 ['G','꿈과 자연의 경이','하프·플루트·말렛·부드러운 패드','harp, flute, soft mallets and airy non-vocal pads','D major / B minor',72],
 ['H','이별과 따뜻한 여운','펠트 피아노·첼로·은은한 현악','felt piano, solo cello and restrained warm strings','F major / D minor',64],
].map(([id,name,instruments,palette,keys,bpm])=>({id,name,instruments,palette,keys,bpm}));
// Each row: actual TangoBook story, family, page selections for four musical roles.
// These are editorial recommendations, not automatically inferred or deployed cues.
const rows = [
 ['브레멘 음악대','E','1–4','5–8,12','9–10,13–14','11,15','협동의 성공은 두 번 반복됩니다. 도둑 재등장 때 위기곡을 재사용합니다.'],
 ['걸리버 여행기','D','1,4–5,7–9,11','2–3,10,12','6,13','14–15','두 나라 여행입니다. 폭풍·거대 동물 장면만 긴장곡을 사용합니다.'],
 ['백조 왕자','A','1,4–5,8','2–3,6–7,9–12','13–14','15','마법 해제 전까지 절제된 불안, 옷을 입고 돌아오는 순간만 고조합니다.'],
 ['개미와 베짱이','E','1–8','9–12','13–14','15','위기는 추위와 배고픔입니다. 전투 대신 수프를 나누는 따뜻한 전환입니다.'],
 ['금발 머리 소녀와 곰 세 마리','E','1–6,8–9','7,10–13','14','15','장난·들킴의 긴장입니다. 무서운 추격음 대신 짧고 우스운 놀람입니다.'],
 ['미운 아기 오리','F','1–2','3–9','10–13','14–15','소외에서 자기 발견으로 이어지는 감정적 고조입니다.'],
 ['거인의 정원','H','1','2–5','6–12','13–15','후반은 봄의 기쁨 뒤 평화로운 이별입니다. 마지막에 승리 팡파르를 넣지 않습니다.'],
 ['개구리 왕자','A','1,3–5','2,6–10','11–12','13–15','원책에는 벽 쪽으로 던짐 뒤 변신이 있습니다. 영화의 입맞춤 장면을 가정하지 않습니다.'],
 ['생강빵 아이','E','1–8','9–13','14','15','탱고북에서는 여우를 피해 할머니 집에 돌아옵니다. 원작의 잡아먹힘 결말로 처리하지 않습니다.'],
 ['구둣방 할아버지와 꼬마 요정','E','1–7','8–10','11–14','15','위기는 공포가 아니라 누가 돕는지 궁금한 밤입니다. 강도를 낮춥니다.'],
 ['빨간 구두','A','1–5','6–10','11–12','13–15','반성 후 구두가 벗겨지고 할머니에게 돌아가는 밝은 각색입니다.'],
 ['성냥팔이 소녀','H','1–3','4,6,8','5,7,9–12','13–15','성냥 속 환상은 잠깐 따뜻하게, 결말은 애도와 연민으로 유지합니다.'],
 ['백조의 호수','A','1–6','7–11','12–13','14–15','탱고북 결말은 마법 해제와 결혼입니다. 비극적 종결로 처리하지 않습니다.'],
 ['신데렐라','A','1–3,5–9','4,10–13','14','15','시작 테마를 마법·무도회에서 재사용하고 자정에 긴장곡으로 전환합니다.'],
 ['오즈의 마법사','C','2–8,10','1,9,11–12','13','14–17','첫 쪽부터 회오리입니다. 모든 책을 평온한 시작곡으로 강제하지 않습니다.'],
 ['아기 돼지 삼형제','B','1–5','6–11','12–14','15','첫 제작 추천. 집짓기→늑대→벽돌집 대결→안도가 명확합니다.'],
 ['인어 공주','G','1–2,5,7–9','3,6,10–11','4,12–14','15','물거품·천사·이별의 각색입니다. 12–15쪽은 H의 감정 고조·여운을 빌리고 결혼식 음악을 쓰지 않습니다.'],
 ['알라딘과 요술 램프','C','1–3,7–9','4,10–11','5,12','6,13–15','신비한 발견과 램프를 둘러싼 위험을 구분합니다. 자유를 주는 결말은 따뜻하게 마칩니다.'],
 ['정글북','D','1–4,9','5–8,10','11–12','13–15','원숭이 구출과 시어 칸 대결은 별도 긴장 파동입니다. 동물 소리를 BGM에 굽지 않습니다.'],
 ['엄지 아가씨','G','1–2,8–10','3–7,11','12–13','14–15','제비를 타고 떠나는 순간은 작고 밝은 비상입니다. 큰 전쟁 음악은 어울리지 않습니다.'],
 ['우당탕탕 염소 삼 형제','B','1–3','4–11','12–14','15','다리 위 발걸음 리듬을 살리되 원문 형제 호칭 혼동은 음악 작업에서 임의로 고치지 않습니다.'],
 ['이상한 나라의 앨리스','C','1–9','10–11','12–13','14–15','낯선 세계는 장난스럽게, 카드가 몰려올 때만 짧게 고조합니다.'],
 ['잠자는 숲속의 공주','A','1–2,5–6','3–4,7–10','11–13','14–15','원책은 손을 잡고 인사하자 깨어납니다. 잠든 구간은 긴장곡의 저밀도 버전이 맞습니다.'],
 ['커다란 순무','E','1–2','3–10','11–13','14–15','위기는 위험이 아니라 잘 뽑히지 않는 난관입니다. 영차의 반복과 합을 살립니다.'],
 ['피리 부는 사나이','B','1–4','8–12','5–7,13','14–15','쥐 퇴치는 1차 해결, 아이들이 사라진 뒤에는 반성의 여운입니다. 해소는 H 음악을 빌립니다.'],
 ['피터와 늑대','B','1–6','7–9','10–14','15','낭독 배경용 새 음악입니다. 기존 유명 관현악 테마나 녹음을 재현하지 않습니다.'],
 ['잭과 콩나무','C','1–6,8–10','7,11–13','14','15','하프가 울려 거인에게 들키는 사건을 기준으로 긴장을 올립니다.'],
 ['라푼젤','A','1–11','12–13','14','15','원책은 밧줄 탈출·말 타고 떠나기입니다. 다른 각색의 눈멂·치유 장면을 넣지 않습니다.'],
 ['피노키오','C','1–5','6–12','13–14','15','고래 속 재회·탈출을 정점으로 삼고 진짜 아이가 되는 마지막은 안도로 마칩니다.'],
 ['호두까기 인형','C','1–3','4–6','7–8','9–15','후반 사탕나라 춤은 해소 음악의 밝은 질감입니다. 유명 발레 선율 인용은 하지 않습니다.'],
 ['북풍과 태양','E','1–5','6–10','11–14','15','논쟁·도전의 강도입니다. 외투가 벗겨지는 결말까지 부드러운 전환을 씁니다.'],
 ['행복한 왕자','H','1–4','5–10','11–12','13–15','제비의 죽음과 왕자의 심장은 승리 장면이 아닙니다. 강도보다 여백을 높입니다.'],
 ['성냥갑 병정','C','1–3','4–11','12–13','14–15','탱고북은 집으로 돌아와 발레리나와 재회합니다. 불 속 죽음 결말로 만들지 않습니다.'],
 ['늑대와 일곱 마리 아기 염소','B','1–4','5–12','13–14','15','엄마의 구출을 정점으로 삼되 위협의 음량은 유아 낭독에 맞춥니다.'],
 ['토끼와 거북이','E','1–4','5–12','13–14','15','가벼운 경주 긴장입니다. 불길한 저음 대신 일정한 걸음 리듬을 씁니다.'],
 ['눈의 여왕','G','1,4–10','2–3,11–12','13–14','15','얼음이 녹는 감정의 정점입니다. 겨울 색감과 따뜻한 귀환을 구분합니다.'],
 ['플란다스의 개','F','1–5','6–9','10–13','14–15','탱고북에서는 마을의 사과·그림대회 우승·화가로의 성장이 있습니다. 비극 음악으로 끝내지 않습니다.'],
 ['어린 왕자','G','1–4,7–9','5–6,10','11–14','15','위기는 장미와의 관계·외로움입니다. 여우의 깨달음은 조용한 정점입니다.'],
 ['소공녀','F','1–3','4–8','9–13','14–15','추위와 상실은 부드러운 단조, 정체를 알아보는 장면에서 안도로 전환합니다.'],
 ['보물섬','D','1–5','6–9,12','10–11,13–14','15','보물 발견 뒤 해적 추격이 다시 있습니다. 발견과 탈출에 같은 정점곡을 재사용합니다.'],
 ['빨간머리 앤','F','1–4,7–8','5–6,9–12','13–14','15','귀속감과 성장입니다. 대회·화해의 기쁨도 작은 편성으로 처리합니다.'],
 ['키다리 아저씨','F','1–11','12','13–14','15','위기는 소식에 대한 걱정·궁금증 수준입니다. 이 작품만을 위해 센 위기곡을 만들 필요가 없습니다.'],
 ['하이디','F','1–5','6–10','11–14','15','귀향과 친구가 일어서는 장면을 따뜻한 고조로, 의료 효과를 음악 문구로 보장하지 않습니다.'],
 ['신밧드의 모험','D','1–4,10–11','5–9','12–14','15','고래·파도에서 거대한 새의 비상으로 이어지는 모험입니다.'],
 ['헨젤과 그레텔','B','1–4,6,9–10','5,7–8,11–12','13–14','15','달콤한 과자집을 행복한 결말로 오해하지 않도록 은은한 긴장을 남깁니다.'],
 ['파랑새','G','1–6','7–11','12–13','14–15','행복을 발견하는 조용한 정점입니다. 무리한 추격·승리 곡이 필요하지 않습니다.'],
 ['빨간모자','B','1–4','5–11','12–14','15','현재 책은 할머니가 옷장에 갇혔다가 구조됩니다. 다른 판본의 결말을 가정하지 않습니다.'],
 ['백설공주','A','1–2,4–7','3,8–11','12–13','14–15','원책은 사과 조각이 튀어나오며 깨어납니다. 잠든 장면을 과장된 공포로 만들지 않습니다.'],
];
const grouped = new Map();
for (const b of input.books) {
 const title=b.title.replace(/_그림체\d+$/,'');
 grouped.set(title,[...(grouped.get(title)||[]),b]);
}
if (grouped.size!==rows.length || input.books.length!==144) throw Error('Catalog changed; review mappings');
for(const row of rows){const seen=new Set();const total=grouped.get(row[0])[0].pages.length;for(const selection of row.slice(2,6))for(const part of selection.split(',')){const [a,b]=part.split('–').map(Number);for(let p=a;p<=(b||a);p++){if(seen.has(p)||p<1||p>total)throw Error('Overlapping/invalid stage '+row[0]+' p'+p);seen.add(p)}}if(seen.size!==total)throw Error('Unmapped page '+row[0]);}
const music = [...new Set(input.books.map(b=>b.backgroundMusicUrl))].sort();
const roleNames=['시작','위기','클라이맥스','해소'];
const cueText=[
 'Gentle establishing underscore, curious and intimate. Keep plenty of space for narration; a restrained short motif, no dramatic buildup.',
 'Controlled suspense or uncertainty, soft repeating low pulse, sparse unanswered phrases. No horror, no jump scares, no loud impacts. For comic stories use curiosity rather than fear.',
 'A brief decisive turning point, increased rhythmic motion and harmonic direction with small acoustic forces. Emotionally clear but restrained, not an action trailer. Let narration carry the event.',
 'Warm release and a settled ending, simplify the motif and let phrases breathe. Soft natural ending with a clean decay, no oversized celebration.',
];
for(const f of families){
 f.bookCount=rows.filter(r=>r[1]===f.id).length;
 f.cues=roleNames.map((role,i)=>({id:f.id+'-'+['opening','tension','climax','resolution'][i],role,
  editedSeconds:i===2?'25–45':i===3?'35–60':'45–75',
  prompt:`Instrumental underscore for a preschool narrated storybook, not a song. ${f.palette}. Around ${f.bpm} BPM; compatible ${f.keys} harmonic palette. Maintain a small original three-note motif and consistent acoustic room across this family. ${f.id==='H'&&i===2?'An intimate emotional peak of compassion and farewell; sustained cello, gentle harmonic tension, never triumphant.':f.id==='H'&&i===3?'Tender remembrance and acceptance, unresolved sadness allowed, warm but never a victory ending.':cueText[i]} Low-density arrangement, soft transients, understated melody, narration has priority. No vocals, lyrics, choir, humming, spoken words, sound effects or recognizable existing melodies. Consistent dynamics; avoid sudden drops, huge crescendos, busy solo lines and heavy drums. Provide stable phrases suitable for later editing and looping.`}));
}
const records=rows.map(([title,family,...rest])=>{
 const variants=grouped.get(title);if(!variants)throw Error(title);
 const b=variants.find(b=>b.title.endsWith('그림체2'))||variants[0];
 const textHashes=new Set(variants.map(b=>crypto.createHash('sha256').update(JSON.stringify(b.pages.map(p=>p.text))).digest('hex')));
 if(textHashes.size!==1)throw Error('Different texts across styles: '+title);
 const stages=rest.slice(0,4).map((pages,i)=>{
  const anchor=Number(pages.match(/\d+/)[0]);const p=b.pages.find(p=>p.pageNumber===anchor);if(!p)throw Error(title+anchor);
  return {role:roleNames[i],pages,anchorPage:anchor,evidence:p.text.trim().slice(0,100)};
 });
 return {title,family,representativeId:b.id,variantIds:variants.map(b=>b.id).sort(),pageCount:b.pages.length,
  currentMusic:'M'+String(music.indexOf(b.backgroundMusicUrl)+1).padStart(2,'0'),
  textSha256:[...textHashes][0],stages,note:rest[4],
  ...(title==='피리 부는 사나이'?{override:{climax:'B-tension (p13)',resolution:'H-resolution'}}:title==='인어 공주'?{override:{climax:'H-climax (p12–14)',resolution:'H-resolution'}}:{}),
  priority:['아기 돼지 삼형제','신데렐라','잭과 콩나무','하이디','인어 공주','성냥팔이 소녀','보물섬','브레멘 음악대'].indexOf(title)+1||null};
});
const report={date:'2026-10-15',fetchedAt:input.fetchedAt,catalogSnapshot:input.catalogSource,
 scope:'144 known world-classic records from the 2026-10-12 catalog, freshly fetched read-only; not a fresh full-bucket discovery.',
 counts:{records:input.books.length,stories:records.length,stylesPerStory:3,distinctBgmUrls:music.length,proposedFamilies:8,proposedCues:32},
 status:'Research and editorial proposal only. No Suno generation, music listening, production data writes or viewer implementation.',
 currentMusic:music.map((url,i)=>({id:'M'+String(i+1).padStart(2,'0'),url,recordCount:input.books.filter(b=>b.backgroundMusicUrl===url).length,storyCount:records.filter(r=>r.currentMusic==='M'+String(i+1).padStart(2,'0')).length})),families,books:records};
fs.writeFileSync(path.join(output,'survey.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(output,'suno-prompts.json'),JSON.stringify({status:'prompts only; no music generated',pilot:'아기 돼지 삼형제 / B',families:families.map(f=>({id:f.id,name:f.name,cues:f.cues}))},null,2));
console.log(JSON.stringify({output,counts:report.counts,familyCounts:families.map(f=>[f.id,f.bookCount])}));
