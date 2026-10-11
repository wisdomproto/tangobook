const fs=require('node:fs');
const path=require('node:path');
const tokens=require('./tokens.json');
const layouts={
 cover:{name:'서비스 개요',rule:'서비스 정의 + 상단 앱과 연결된 교구·콘텐츠',ids:['vision']},
 market:{name:'시장',rule:'국내/해외 범위·기간을 구분한 숫자와 그래프',ids:['education-market']},
 comparison:{name:'비교',rule:'같은 크기의 사진과 같은 순서의 장점·한계',ids:['media']},
 experience:{name:'학습 경험',rule:'앱→블록→쓰기→게임의 네 장면 + 통합 학습 기록',ids:['business','background','experience']},
 evidence:{name:'실행 근거',rule:'과거 제품·현재 화면·제작 기록을 구분한 3열',ids:['advantage']},
 portfolio:{name:'콘텐츠 기반',rule:'교육과정 구성 + 실제 콘텐츠, 집계 정의 표시',ids:['foundation']},
 product:{name:'판매 제품',rule:'제품 2열 + 구매 후 사용을 돕는 콘텐츠',ids:[]},
 roadmap:{name:'실행 계획',rule:'순서·목표·검증할 증거, 상세는 펼침',ids:['growth','validation','team']}
};
function layoutFor(id){return Object.entries(layouts).find(([,value])=>value.ids.includes(id))?.[0]||'evidence';}
function createCss(){
 const vars=Object.entries(tokens).filter(([group])=>group!=='version').flatMap(([group,values])=>Object.entries(values).map(([key,value])=>`--doc-${group}-${key}:${value};`)).join('');
 const font=fs.readFileSync(path.resolve(__dirname,'../../../packages/client/public/fonts/Pretendard-Regular.otf')).toString('base64');
 return `/* TangoBook Document System ${tokens.version} */\n@font-face{font-family:DocumentPretendard;src:url(data:font/otf;base64,${font}) format('opentype');font-weight:400;font-display:swap}:root{${vars}--paper:var(--doc-color-paper);--ink:var(--doc-color-ink);--muted:var(--doc-color-muted);--teal:var(--doc-color-teal);--accent:var(--doc-color-coral)}\n`+fs.readFileSync(path.join(__dirname,'styles.css'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'scan-layouts.css'),'utf8');
}
module.exports={tokens,layouts,layoutFor,createCss};
