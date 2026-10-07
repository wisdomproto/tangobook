"""Compose native render, previous AI trial, and the current 3D camera together."""
import re


def compose(html):
    html = html.replace('공부방 · 실제 3D 원본', '공부방 · 원본 / AI 사진 / 3D')
    html = html.replace('AI 보정 없는 원본 · 같은 모델의 카메라', '원본 렌더 · 이전 AI 사진 · 현재 3D 카메라')
    start = html.index('<main class="layout">')
    end = html.index('<section class="panel right">', start)
    html = html[:start] + '''<main class="layout">
<section class="panel left"><div class="head"><strong>① 원본 렌더</strong><span>CYCLES · V7</span></div>
<div class="photo-stage"><div class="photo-frame"><img id="guide" alt="현재 v7 모델의 실제 Blender 원본 렌더"></div></div>
<div class="panel-footer"><strong id="shot-title">장면 불러오는 중</strong><p>AI 보정 없음 · 아이 모델 없음</p><a id="image-link" class="download" download>원본 렌더 ↓</a></div></section>
<section class="panel ai"><div class="head"><strong>② AI 사진</strong><span>이전 V6 시험</span></div>
<div class="photo-stage"><div class="photo-frame"><img id="photo" alt="이전 v6 모델을 참조해 생성했던 AI 시험 사진"><div id="missing" hidden>AI 사진을 불러오지 못했습니다.</div></div></div>
<div class="panel-footer"><strong class="trial-label">이전 v6 생성 사진 · 구조 미승인</strong><p id="review"></p><a id="ai-link" class="download" download>AI 사진 ↓</a></div></section>
''' + html[end:]
    html = html.replace('</style>', '''
.layout{grid-template-columns:repeat(3,minmax(0,1fr))}.photo-stage{inset:62px 16px 110px}.panel-footer{position:absolute;bottom:13px;left:20px;right:20px;font-size:11px;line-height:1.55}.panel-footer strong{font-size:12px}.panel-footer p{margin:5px 0;color:#59624f}.trial-label{color:#9b5f2d}.head{left:20px;right:20px}.head span{letter-spacing:.8px}.camera-info{right:auto;max-width:calc(100% - 35px)}.view-hint{top:98px}.right .head .chip{font-size:9px;letter-spacing:0}.bottom .shot{min-width:185px}.ai .panel-footer p{font-size:11px}.photo-frame img{object-fit:contain}
@media(max-width:900px){header{padding:15px 20px}h1{font-size:20px}header p{max-width:350px}.camera-info{font-size:10px}.head strong{font-size:11px}.right .head{flex-wrap:wrap;gap:5px}.right-tools{left:10px;right:10px;gap:4px}.right-tools button{padding:9px 7px}}
@media(max-width:760px){.layout{grid-template-columns:1fr}.panel{height:580px}.panel.right{height:500px}.photo-stage{inset:60px 20px 110px}.bottom{flex-wrap:nowrap;height:94px}.shot{flex:0 0 185px}.panel-footer{bottom:15px}.camera-info{font-size:11px}}
</style>''')
    start = html.index("const guide=document.querySelector('#guide')")
    end = html.index('try{shots=', start)
    html = html[:start] + '''const guide=document.querySelector('#guide'),photo=document.querySelector('#photo'),missing=document.querySelector('#missing');let aiTrials=new Map();
photo.addEventListener('load',()=>{missing.hidden=true;});photo.addEventListener('error',()=>{missing.hidden=false;});
function selectShot(s){current=s;model.traverse(o=>{if(o.userData.activity_id)o.visible=o.userData.activity_id===s.activity;});guide.src=s.guide;document.querySelector('#image-link').href=s.guide;document.querySelector('#shot-title').textContent=s.title;const trial=aiTrials.get(s.id);photo.removeAttribute('src');missing.hidden=Boolean(trial);if(trial)photo.src=trial.image;document.querySelector('#ai-link').href=trial?.image||'';document.querySelector('#ai-link').hidden=!trial;document.querySelector('#review').textContent=trial?`현재 v7 원본에서 새로 만든 사진이 아닙니다. ${trial.review}`:'이 장면의 이전 AI 사진이 없습니다.';document.querySelector('#camera-info').textContent=`CAM ${String(s.number).padStart(2,'0')} · ${s.lens_mm} mm · 높이 ${s.position[1].toFixed(2)} m`;document.querySelectorAll('[data-shot]').forEach(b=>b.classList.toggle('active',b.dataset.shot===s.id));markShot();setMode(mode);window.currentHomeShot=s.id;}
''' + html[end:]
    html = html.replace("try{shots=", "try{const trialResponse=await fetch('./carousel-v6-shots.json');if(!trialResponse.ok)throw new Error('AI metadata unavailable');aiTrials=new Map((await trialResponse.json()).map(s=>[s.id,s]));shots=")
    html = html.replace("document.querySelector('#render-status').textContent='3D 집을 불러오지 못했습니다.'", "document.querySelector('#render-status').textContent='비교 자료를 불러오지 못했습니다.'")
    assert len(re.findall(r'<section class="panel ', html)) == 3
    return html
