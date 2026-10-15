const fs = require('node:fs');
const path = require('node:path');
module.exports = function buildPigRevision(dir, oldSet) {
  const file = path.join(dir, 'pig-v2-generation.json');
  if (!fs.existsSync(file)) return { html: '', css: '', js: '', ready: false };
  const revision = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!revision.roles.every(r => r.status === 'generated' && r.candidates.length === 2)) return { html: '', css: '', js: '', ready: false };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const json = JSON.stringify({revision,oldSet}).replace(/</g, '\\u003c');
  const selected = revision.roles.find(r => r.role === 'climax').candidates[0].url.split('/').pop();
  return {
    ready: true,
    css: `.pig-revision{margin:28px 0 10px;padding:27px;border:1px solid #c5d6bf;background:#edf2e7;border-radius:18px}.pig-revision h2{margin-top:10px;font-size:27px}.pig-revision p{color:#657461;font-size:13px;line-height:1.7}.pig-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 16px}.pig-tabs button{border:1px solid #c9d7c2;background:#fafcf7;color:#58714e;padding:11px 17px;border-radius:10px;font-size:13px}.pig-tabs button[aria-selected=true]{background:#304f39;color:white;border-color:#304f39}.pig-notes{display:flex;align-items:center;gap:14px;margin:12px 0}.pig-notes strong{font-size:16px;min-width:120px}.pig-notes span{font-size:12px;color:#667762}.pig-embed{display:block;width:100%;height:240px;border:0;border-radius:12px;background:#101010}.pig-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0}.pig-controls button{font-size:12px;border:1px solid #c9d7c2;border-radius:20px;background:#f9fcf6;padding:8px 13px;color:#4c6b45}.pig-controls button[aria-pressed=true]{background:#d9e6d1;border-color:#86a37a}.pig-controls a{margin-left:auto;font-size:12px}.pig-archive{border-top:1px solid #cddac6;padding-top:13px;font-size:12px;color:#6c7a66}.pig-archive summary{cursor:pointer}.pig-archive button{border:1px solid #cad8c2;border-radius:18px;background:white;color:#617059;padding:8px 13px;margin:12px 5px 0 0;font-size:12px}@media(max-width:740px){.pig-revision{padding:18px;margin-top:22px}.pig-revision h2{font-size:23px}.pig-tabs{gap:6px}.pig-tabs button{padding:10px 9px;font-size:11px;flex:1}.pig-notes{display:block}.pig-notes span{display:block;margin-top:5px}.pig-controls a{margin-left:0}.pig-embed{height:240px}}`,
    html: `<section id="pig-revision" class="pig-revision" aria-label="아기돼지 새 버전 비교"><span class="badge" style="background:#dce8d4;color:#4d6a42">NEW · 아기돼지 v2</span><h2>경쾌하게, 긴장되게, 편안하게.</h2><p>세 곡의 리듬·빠르기·악기 편성을 새로 나눴습니다. 역할을 바꿔 가며 차이를 들어보세요.</p><div class="pig-tabs" role="tablist" aria-label="아기돼지 새 버전 역할">${revision.roles.map(r=>`<button type="button" role="tab" data-pig-role="${r.role}" aria-selected="${r.role==='climax'}">${esc(r.label)}</button>`).join('')}</div><div class="pig-notes"><strong id="pig-role-title">클라이맥스 · 긴장감 있게</strong><span id="pig-role-detail">빠른 반복 현악 · 낮은 타악 · 단조 · 압박감이 쌓이는 전개</span></div><iframe id="pig-frame" class="pig-embed" src="https://suno.com/embed/${selected}" title="아기돼지 v2 Suno 미리듣기" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><p id="pig-embed-hint" hidden>새 버전은 위의 역할 탭을 눌러 다시 들을 수 있습니다.</p><div class="pig-controls"><button type="button" data-pig-candidate="0" aria-pressed="true">후보 A</button><button type="button" data-pig-candidate="1" aria-pressed="false">후보 B</button><button type="button" id="pig-native">이 후보 MP3로 듣기</button><a id="pig-song-link" href="https://suno.com/song/${selected}" target="_blank" rel="noopener">Suno에서 열기 ↗</a></div><p>세 곡 모두 공식 Suno 플레이어로 들을 수 있습니다. 남은 1회 다운로드는 클라이맥스 A에 사용해 MP3 재생도 제공합니다.</p><details class="pig-archive"><summary>이전 아기돼지 v1과 비교</summary><p>이전 세 곡은 보관본입니다. 새 시안과 비교할 때만 재생해 주세요.</p>${['도입','클라이맥스','마지막'].map((label,i)=>`<button type="button" data-pig-old="${i}">v1 ${label}</button>`).join('')}</details></section><script id="pig-v2-data" type="application/json">${json}</script>`,
    js: `
const pigData=JSON.parse(document.getElementById('pig-v2-data').textContent);
let pigRole='climax',pigCandidate=0;
const pigFrame=document.getElementById('pig-frame');
const pigDetails={opening:'경쾌한 124 BPM 요청 · 짧게 뜯는 현악 · 실로폰 · 명확한 리듬',climax:'긴장하는 136 BPM 요청 · 빠른 반복 현악 · 낮은 타악 · 단조',ending:'편안한 58 BPM 요청 · 느린 피아노 · 긴 첼로 음 · 거의 없는 타악'};
function showPig(role,candidate=0){
  pigRole=role;pigCandidate=candidate;audio.pause();audio.removeAttribute('src');audio.load();queue=[];at=0;
  const r=pigData.revision.roles.find(r=>r.role===role),c=r.candidates[candidate];
  pigFrame.hidden=false;pigFrame.src='https://suno.com/embed/'+c.url.split('/').pop();
  document.getElementById('pig-embed-hint').hidden=true;
  document.getElementById('pig-role-title').textContent=r.label;
  document.getElementById('pig-role-detail').textContent=pigDetails[role];
  document.getElementById('pig-song-link').href=c.url;
  document.getElementById('pig-native').hidden=!(role==='climax'&&candidate===0&&r.audio?.url);
  document.querySelectorAll('[data-pig-role]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.pigRole===role)));
  document.querySelectorAll('[data-pig-candidate]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.pigCandidate===candidate)));
  document.getElementById('now').textContent='아기돼지 v2 · '+r.label+' · Suno';
  document.getElementById('status').textContent='위의 Suno 플레이어에서 재생해 주세요.';
  for(const id of ['prev','next','toggle'])document.getElementById(id).disabled=true;
}
document.querySelectorAll('[data-pig-role]').forEach(b=>b.addEventListener('click',()=>showPig(b.dataset.pigRole)));
document.querySelectorAll('[data-pig-candidate]').forEach(b=>b.addEventListener('click',()=>showPig(pigRole,+b.dataset.pigCandidate)));
document.getElementById('pig-native').addEventListener('click',()=>{const r=pigData.revision.roles.find(r=>r.role==='climax');queue=[{...r.audio,display:'아기돼지 v2 · 클라이맥스 · 늑대의 추격'}];at=0;start()});
if(!document.getElementById('pig-revision').hidden){document.getElementById('now').textContent='아기돼지 v2 · 클라이맥스 · Suno';document.getElementById('status').textContent='위의 Suno 플레이어에서 재생해 주세요.';}
document.querySelectorAll('[data-pig-old]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.pigOld;queue=[{...pigData.oldSet.tracks[i],display:'아기돼지 v1 보관본 · '+['도입','클라이맥스','마지막'][i]}];at=0;start()}));
`
  };
};
