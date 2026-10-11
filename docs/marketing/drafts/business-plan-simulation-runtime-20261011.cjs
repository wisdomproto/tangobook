module.exports=function runtime(plan){
 const root=document.getElementById('simulation-panel'),get=id=>root.querySelector('#sim-'+id);
 const key='tangobook-wholesale-simulation-v4-2027-2028';
 const fields=['price','cost','platform','notePrice','noteCost','notePlatform','krRate','worldRate','krExtra','worldExtra','service','fixed'];
 const zero=()=>({kr:0,krNote:0,world:0,worldNote:0});
 const defaults=()=>({version:4,price:plan.price,cost:plan.cost,platform:plan.platform,notePrice:100000,noteCost:20000,notePlatform:0,krRate:50,worldRate:50,krExtra:'',worldExtra:'',service:'',fixed:'',years:{2027:plan.months.map(m=>({...zero(),...m})),2028:Array.from({length:12},zero)}});
 const fmt=n=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2}).format(n);
 const money=n=>Math.abs(n)>=1e8?fmt(n/1e8)+'억원':fmt(n/1e4)+'만원';
 const cell=n=>'<td>'+fmt(n)+'</td>';
 const allowed=(year,i,k)=>!(year===2027&&(k.startsWith('world')||(k==='krNote'&&i<6)));
 const validState=s=>s&&fields.every(k=>{const v=s[k],max=k==='fixed'?1e11:k.endsWith('Rate')?100:1e7;return (v===''&&['krExtra','worldExtra','service','fixed'].includes(k))||(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max&&(k.endsWith('Rate')?Math.abs(v*10-Math.round(v*10))<1e-7:Number.isInteger(v)));})&&[2027,2028].every(y=>Array.isArray(s.years?.[y])&&s.years[y].length===12&&s.years[y].every((m,i)=>['kr','krNote','world','worldNote'].every(k=>Number.isInteger(m?.[k])&&m[k]>=0&&m[k]<=1e6&&(allowed(y,i,k)||m[k]===0))));
 let state=defaults(),year=2027;
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===4&&[2027,2028].every(y=>saved.years?.[y]?.length===12))state={...state,...saved};else{
 const old=JSON.parse(localStorage.getItem('tangobook-wholesale-simulation-v3-2027'));
 if(old?.version===3&&old.months?.length===12){fields.filter(k=>k in old).forEach(k=>state[k]=old[k]);state.years[2027]=old.months.map(m=>({...zero(),kr:m.kr}));}
 }}catch{}
 if(!validState(state))state=defaults();
 function normalizeEntered(){const saved=state.entered;state.entered=Object.fromEntries([2027,2028].map(y=>[y,Array.from({length:12},(_,i)=>Object.fromEntries(['kr','krNote','world','worldNote'].map(k=>[k,saved?.[y]?.[i]?.[k]===true])))]));}
 normalizeEntered();
 function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
 function populate(){fields.forEach(k=>get(k).value=state[k]);get('months').innerHTML=state.years[year].map((m,i)=>'<tr><th scope="row">'+year+'.'+String(i+1).padStart(2,'0')+'</th>'+['kr','krNote','world','worldNote'].map(k=>'<td><input data-month="'+i+'" data-region="'+k+'" type="number" min="0" max="1000000" step="1" required '+(allowed(year,i,k)?'':'disabled')+' aria-label="'+year+'년 '+(i+1)+'월 '+({kr:'한국 블록',krNote:'한국 탱고노트',world:'해외 블록',worldNote:'해외 탱고노트'}[k])+' 유통사 공급 대수" value="'+Number(m[k])+'"></td>').join('')+['supply','cost','platform','grossProfit'].map(k=>'<td data-out="'+k+'"></td>').join('')+'</tr>').join('');}
 function read(){
 if([...root.querySelectorAll('input')].filter(e=>!e.id.startsWith('sim-fill-')).some(e=>!e.checkValidity()))return false;
 fields.forEach(k=>state[k]=get(k).value===''?'':Number(get(k).value));
 root.querySelectorAll('[data-month]').forEach(e=>state.years[year][+e.dataset.month][e.dataset.region]=e.disabled?0:Number(e.value));return true;
 }
 function calculate(){
 const all=[];for(const y of [2027,2028])for(let i=0;i<12;i++){
 const m=state.years[y][i],blocks=m.kr+m.world,notes=m.krNote+m.worldNote;
 const krSupply=(m.kr*state.price+m.krNote*state.notePrice)*state.krRate/100;
 const worldSupply=(m.world*state.price+m.worldNote*state.notePrice)*state.worldRate/100;
 const supply=krSupply+worldSupply,cost=blocks*state.cost+notes*state.noteCost,platform=blocks*state.platform+notes*state.notePlatform;
 const active=blocks+all.slice(-11).reduce((n,r)=>n+r.blocks,0);
 const service=active*Number(state.service),extra=(m.kr+m.krNote)*Number(state.krExtra)+(m.world+m.worldNote)*Number(state.worldExtra)+Number(state.fixed);
 const entered=state.entered[y][i];
 all.push({...m,year:y,month:i,blocks,notes,blockKnown:y===2027||blocks>0||entered.kr||entered.world,noteKnown:notes>0||entered.krNote||entered.worldNote,noteAvailable:y===2028||i>=6,krSupply,worldSupply,supply,cost,platform,grossProfit:supply-cost-platform,active,service,extra,balance:supply-cost-platform-service-extra});
 }return all;
 }
 const sum=rows=>rows.reduce((a,r)=>{for(const k of ['kr','krNote','world','worldNote','blocks','notes','blockKnown','noteKnown','noteAvailable','krSupply','worldSupply','supply','cost','platform','grossProfit','service','extra','balance'])a[k]=(a[k]||0)+Number(r[k]);return a;},{});
 function chart(all){
 const quarters=Array.from({length:8},(_,q)=>sum(all.slice(q*3,q*3+3))),shown=quarters.slice(0,4),annual=[sum(all.slice(0,12)),sum(all.slice(12))];
 const max=Math.max(...shown.flatMap(q=>[q.supply,q.grossProfit]),1e8),min=Math.min(0,...shown.map(q=>q.grossProfit));
 const step=10**Math.floor(Math.log10((max-min)/4)),tick=Math.ceil((max-min)/4/step)*step,ceiling=Math.ceil(max/tick)*tick,floor=Math.floor(min/tick)*tick;
 const W=850,H=480,L=112,R=18,T=38,B=215,slot=(W-L-R)/4,center=i=>L+(i+.5)*slot,y=v=>B-(v-floor)/(ceiling-floor)*(B-T);
 const tx=(x,y,text,size=17,color='#173e36',weight=400,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'">'+text+'</text>';
 let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="2027년 분기별 예상 매출 및 매출총이익">'+tx(12,22,'억원',13,'#637770',400,'start');
 for(let v=floor;v<=ceiling+1;v+=tick){const yy=y(v);svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#dbe5df"/>'+tx(L-14,yy+5,fmt(v/1e8),14,'#637770',400,'end');}
 [['supply','#238f88'],['grossProfit','#d77349']].forEach(([key,color])=>{svg+='<polyline data-series="'+key+'" points="'+shown.map((q,i)=>center(i)+','+y(q[key])).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="3.5" stroke-linejoin="round"/>';});
 shown.forEach((q,i)=>{const x=center(i);svg+='<g><title>2027년 '+(i+1)+'분기 매출 '+fmt(q.supply)+'원, 매출총이익 '+fmt(q.grossProfit)+'원</title>';[['supply','#238f88'],['grossProfit','#d77349']].forEach(([key,color])=>{const yy=y(q[key]);svg+='<circle data-metric="'+key+'" data-quarter="'+(i+1)+'" cx="'+x+'" cy="'+yy+'" r="5" fill="white" stroke="'+color+'" stroke-width="3"/>'+tx(x,key==='supply'?yy-13:yy+24,fmt(q[key]/1e8),18,color,700);});svg+=tx(x,263,(i+1)+'분기',18,'#173e36',700)+'</g>';});
 svg+='<line x1="'+center(0)+'" x2="'+center(3)+'" y1="285" y2="285" stroke="#bbd3c9" stroke-width="2"/>';
 [[0,'한국 런칭','탱고북 v1.0','한글·영어 블록'],[2,'탱고노트 출시','종이 쓰기','학습 연동']].forEach(([i,title,line1,line2])=>{const x=center(i);svg+='<circle cx="'+x+'" cy="285" r="5" fill="#238f88"/>'+tx(x,319,title,20,'#173e36',700)+tx(x,345,line1,15,'#637770')+tx(x,367,line2,15,'#637770');});
 svg+='<line x1="12" x2="'+(W-R)+'" y1="393" y2="393" stroke="#dbe5df"/>'+tx(12,425,'블록(세트)',14,'#173e36',700,'start')+tx(12,458,'탱고노트(대)',14,'#637770',400,'start');
 shown.forEach((q,i)=>{svg+=tx(center(i),425,q.blockKnown?fmt(q.blocks):'미정',18,'#173e36',700)+tx(center(i),458,!q.noteAvailable?'출시 전':q.noteKnown?fmt(q.notes):'미정',16,'#637770');});
 document.getElementById('milestone-chart').innerHTML=svg+'</svg>';
 const a=annual[0],future=annual[1];
 document.getElementById('milestone-totals').innerHTML='<div><span>2027 예상 매출</span><strong>'+money(a.supply)+'</strong><small>유통사 공급액 기준</small></div><div><span>2027 예상 매출총이익</span><strong>'+money(a.grossProfit)+'</strong><small>교구 원가 · 플랫폼 비용 차감</small></div>';
 document.getElementById('milestone-future-totals').innerHTML=future.blockKnown||future.noteKnown?'<span>시뮬레이션 입력 기준</span><span>예상 매출</span><b>'+money(future.supply)+'</b><span>예상 매출총이익</span><b>'+money(future.grossProfit)+'</b>':'<b>판매 계획 수립 중</b><span>출시 분기 · 공급량 미정</span>';
 document.getElementById('milestone-status').textContent='유통사 공급 계획 · 블록 '+fmt(a.blocks)+'세트 · 탱고노트 '+(a.noteKnown?fmt(a.notes)+'대':'공급량 미정')+' / 시뮬레이션 연동 · 매출총이익은 순이익과 구분';
 document.getElementById('milestone-chart').dataset.calculation=JSON.stringify({quarters,annual});
 }
 function render(persist=false){
 if(!read()){get('error').hidden=false;get('error').textContent='대수·금액은 0 이상의 정수, 공급률은 0~100%로 입력해 주세요. 결과는 마지막 유효 입력 기준입니다.';return false;}
 get('error').hidden=true;const all=calculate(),rows=all.filter(r=>r.year===year),totals=sum(rows);
 get('plan-status').textContent=year+'년 유통사 공급량 기준 · 투자자용 마일스톤 자동 반영';
 rows.forEach((r,i)=>{for(const k of ['supply','cost','platform','grossProfit'])get('months').children[i].querySelector('[data-out="'+k+'"]').textContent=fmt(r[k]/1e4);});
 get('unit-prices').textContent='공급가: 한국 블록 '+fmt(state.price*state.krRate/100)+'원 · 노트 '+fmt(state.notePrice*state.krRate/100)+'원 / 해외 블록 '+fmt(state.price*state.worldRate/100)+'원 · 노트 '+fmt(state.notePrice*state.worldRate/100)+'원';
 get('annual-supply').textContent=money(totals.supply);get('annual-cost').textContent=money(totals.cost+totals.platform);get('cost-detail').textContent='교구 '+money(totals.cost)+' + 플랫폼 '+money(totals.platform);get('annual-balance').textContent=money(totals.grossProfit);get('margin').textContent='매출총이익률 '+(totals.supply?fmt(totals.grossProfit/totals.supply*100)+'%':'—');
 get('totals').innerHTML='<tr><th>연간 합계</th>'+['kr','krNote','world','worldNote'].map(k=>cell(totals[k])).join('')+['supply','cost','platform','grossProfit'].map(k=>cell(totals[k]/1e4)).join('')+'</tr>';
 get('regions').innerHTML=[['한국',totals.kr,totals.krNote,totals.krSupply],['해외 3개국',totals.world,totals.worldNote,totals.worldSupply],['합계',totals.blocks,totals.notes,totals.supply]].map(([name,b,n,v])=>{const c=b*state.cost+n*state.noteCost,p=b*state.platform+n*state.notePlatform;return '<tr><th>'+name+'</th>'+cell(b)+cell(n)+cell(v/1e4)+cell(c/1e4)+cell(p/1e4)+cell((v-c-p)/1e4)+'</tr>';}).join('');
 get('service-months').innerHTML=rows.map(r=>'<tr><th>'+year+'.'+String(r.month+1).padStart(2,'0')+'</th>'+cell(r.active)+cell(r.service/1e4)+cell(r.extra/1e4)+'</tr>').join('');
 const future=rows.reduce((n,r)=>n+r.blocks*r.month,0);
 get('service-summary').textContent='추가 비용 반영 후 차액 '+money(totals.balance)+' (순이익 아님) · 추가 서비스비 '+money(totals.service)+' · 기타 비용 '+money(totals.extra)+' · 당해 판매 이용권의 연말 이후 잔여분 '+fmt(future)+' 이용권·월. 2028년 활성 이용권에는 2027년 판매분의 잔여 기간을 포함합니다.';
 root.dataset.calculation=JSON.stringify({...totals,year});chart(all);if(persist)save();return true;
 }
 populate();if(!render()){state=defaults();normalizeEntered();populate();render();}
 root.addEventListener('input',e=>{if(e.target.matches('input')&&!e.target.id.startsWith('sim-fill-')){if(e.target.dataset.month!==undefined&&e.target.checkValidity())state.entered[year][+e.target.dataset.month][e.target.dataset.region]=true;render(true);}});
 get('year').onchange=()=>{if(!render(true)){get('year').value=year;return;}year=+get('year').value;populate();render();};
 get('apply').onclick=()=>{if(!get('fill-kr').reportValidity()||!get('fill-world').reportValidity()||!read())return;const suffix=get('fill-product').value==='note'?'Note':'';state.years[year].forEach((m,i)=>{for(const r of ['kr','world']){const enabled=allowed(year,i,r+suffix);m[r+suffix]=enabled?+get('fill-'+r).value:0;state.entered[year][i][r+suffix]=enabled;}});populate();render(true);};
 get('reset').onclick=()=>{state=defaults();normalizeEntered();year=2027;get('year').value=2027;populate();render(true);};
};
