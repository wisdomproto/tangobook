/* =====================================================================
 * 탱고 보드 인식기 — 판 위 블록을 읽어 낱말로 돌려준다.
 *
 * 🔴 **이 파일이 유일한 원본이다.** tango-board-3d.html(실험실)과 앱의 실물 블록
 *    게임이 **같은 이 파일**을 부른다. 사본을 만들면 한쪽만 고치는 사고가 나고,
 *    실험실에서 잰 숫자가 배포본 숫자가 아니게 된다.
 *
 * 두 경로가 들어 있고 첫 프레임에 공짜로 갈린다(recognizeLegoDirect):
 *   획 블록  — 덩어리가 곧 글자다.
 *   스티커   — 덩어리는 **액자**고 글자는 그 안 잉크다(인쇄 카드를 붙인 4x4·2x4 블록).
 *
 * 🔴 절대 문턱을 두지 마라. 카메라·렌즈·화이트밸런스·조명이 바뀌면 절대값은 그냥 밀린다.
 *    기준은 **그 장면 자신에서** 뽑는다 — 판 색 중앙값에서의 거리 · 그 카드의 종이 색 ·
 *    칸 배수 · 화면 넓이 비율처럼 무차원으로. 「훑어서 창을 찾았다」는 정당화가 아니다.
 *
 * 입력은 RGBA 한 장뿐이다(detBuf). 어디서 왔는지는 안 본다 —
 * 실험실은 WebGL readPixels 로, 앱은 2D 캔버스 getImageData 로 채운다.
 * 🔴 그 둘은 **위아래가 반대**다. readPixels 는 아래부터 준다.
 *
 * 규율·이미 반증된 시도는 .claude/agents/board-vision.md 가 원본이다.
 * ===================================================================== */

var TangoReco = {
  /* 실험시 화면을 다시 그려야 할 때 부른다. 앱에서는 할 일이 없다. */
  onChange: function(){},
};

/* ─────────────────────────────────────────────────────────────────────
 * 판 종류 — 두 가지 판을 읽는다.
 *   tango : 지금 판. 로즈 테두리 + 파낸 놀이 영역 + 자음/모음이 **색으로** 갈린다.
 *   lego  : 레고형 판. 24x24 회색 판에 돌기, 블록은 흰·노랑·파랑·초록·빨강이 섞인다.
 *
 * 🔴 그래서 레고에서는 색으로 자음/모음을 못 가른다 — 색이 하는 일은
 *    「판이냐 블록이냐」까지고, 어느 자모인지는 **모양**이 정한다(reco.colorTrust=false).
 * 🔴 판을 찾는 길도 다르다. 로즈 테두리가 없으니 기댈 건 **돌기 격자** 하나다.
 *    다행히 그 길은 이미 있다(cvLatticeQuad) — 극성만 「밝은 점」으로 돌리면 된다.
 *    파이썬으로 같은 알고리즘을 돌려 재 봤다: 어두운 점 9개 vs 밝은 점 405개.
 * 🔴 그리고 문턱은 Otsu 가 아니라 **고정 5** 다. 노란 블록의 돌기가 회색 판의
 *    돌기보다 훨씬 또렷해서, Otsu 가 그 둘 사이에서 갈라 **판의 돌기를 통째로
 *    버린다**(격자점 84 → 고정 5 로 225).
 * ───────────────────────────────────────────────────────────────────── */
/* 🔴 `?board=sticker` = 스티커 판으로 **못 박는다**(하네스가 갈래를 고정할 때 쓴다).
      `?board=lego` 는 자동 — 카드가 보이면 카드로, 아니면 획 블록으로 간다. */
var BOARD_KIND = /(^|[?&])board=(lego|sticker)(&|$)/.test(location.search) ? 'lego' : 'tango';

var LEGO_URL = { pieces:'tango-lego.pieces.json', masks:'tango-lego.masks.json' };

var legoData = null;                       // { pieces, masks }

var legoTemplates = null;                  // initReco 가 늦게 돌 때를 위해 남겨 둔다

function isLego(){ return BOARD_KIND === 'lego'; }

/* ---------------------------------------------------------------- 한글 */
var CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

var JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];

var JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

var JUNG_SET = new Set(JUNG);

var COMPOUND = { 'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ' };

var PLUS_I   = { 'ㅏ':'ㅐ','ㅓ':'ㅔ','ㅑ':'ㅒ','ㅕ':'ㅖ','ㅘ':'ㅙ','ㅝ':'ㅞ' };

var DOUBLE   = { 'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ' };

var DOUBLE_JONG = { 'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ',
                    'ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ' };

function isVowel(ch){ return JUNG_SET.has(ch); }

function composeHangul(cho, jung, jong){
  var ci = CHO.indexOf(cho), ji = JUNG.indexOf(jung), ki = jong ? JONG.indexOf(jong) : 0;
  if (ci < 0 || ji < 0 || ki < 0) return null;
  return String.fromCharCode(0xAC00 + (ci * 21 + ji) * 28 + ki);
}

function mergeDoubles(items){
  var out = items.slice();
  for (var i = 0; i < out.length; i++){
    var a = out[i];
    if (!a || isVowel(a.ch) || !DOUBLE[a.ch]) continue;
    for (var j = 0; j < out.length; j++){
      var b = out[j];
      if (i === j || !b || b.ch !== a.ch) continue;
      if (Math.abs(b.x - (a.x + a.w)) <= 1 && Math.abs(b.y - a.y) <= 1){
        a.ch = DOUBLE[a.ch];
        a.w = (b.x + b.w) - a.x;
        out[j] = null;
        break;
      }
    }
  }
  return out.filter(Boolean);
}

/** 자유 배치 파서 — 2D 시뮬레이터에서 그대로 가져옴 (검증된 로직). */
/* 🔴 **음절은 세로로 딱 갈린다.** 사용자 규칙 = 모음이 옆 음절 영역을 침범하지
      않게 놓는다. 그러면 조합은 「이 음절 안에서만」 하면 되고, 오늘까지 나온
      조합 버그가 전부 한 부류였던 게 원리적으로 사라진다 —
        텹랏 → 텺라   (뒷 글자 받침을 앞 글자가 겹받침으로 데려감)
        압튜리 → 압티 (제 모음을 두고 다음 글자 모음을 빼앗음)
        탄리 → 나리   (받침이 모음을 먼저 채 감)
        럼톱비 → 럼툅 (비의 ㅣ 를 톱이 가져감)
      전부 「옆 음절 것을 건드렸다」이고, 나눠 놓으면 손이 닿지 않는다.
   🔴 상한이 7인 이유: 한 음절의 최대 폭이 7칸이다. 자음 3 + 합성모음(ㅗ+ㅏ) 4 = 7,
      겹받침(값·삶)도 6. 5로 잡으면 합성모음이 갈리고, 9면 텹랏이 안 갈린다.
      **끝 좌표**로 재야 한다 — 시작 좌표로 재면 과(ㅏ가 5칸째 시작)가 갈린다. */
var SYL_COLS = 7;

function splitSyllables(items){
  var by = items.slice().sort(function(a, b){ return (a.x - b.x) || (a.y - b.y); });
  var groups = [], cur = null;
  /* 🔴 레고는 **폭이 아니라 틈**으로 나눈다. 고정 폭(7칸)으로 자르면 받침 있는
        음절이 잘린다 — 실측 「간교」: ㄱ x0.5 · ㅏ x4.5 · ㄴ x2.8(폭 5) 이라 음절이
        7.3칸이고, 7칸에서 끊겨 ㄴ 이 떨어져 나가 「교」만 남았다(자모는 다 읽었는데).
        한 음절 안의 자모는 서로 겹쳐 놓이고 음절 사이에는 틈이 생기므로,
        **앞 무리의 오른쪽 끝을 넘어서면** 새 음절이다(같은 판에서 틈 0.6칸). */
  if (isLego()){
    var right = -1e9;
    by.forEach(function(it){
      if (cur && it.x <= right + TUNE.legoSylGap){
        cur.list.push(it);
      } else {
        cur = { x0: it.x, list: [it] };
        groups.push(cur);
        right = -1e9;
      }
      if (it.x + it.w > right) right = it.x + it.w;
    });
    /* 🔴 **음절 경계를 정하는 건 틈이 아니라 「조합이 되느냐」다.** 가로 간격은
          음절 안이든 밖이든 똑같이 벌어질 수 있어서 어떤 문턱을 골라도 못 가른다.
          위의 틈 나누기는 **초안**일 뿐이고, 여기서 **음절이 못 된 무리를 이웃에
          붙여 다시 세운다** — 붙여서 음절이 되면 그게 답이다.
       ⚠ 틈 문턱을 손보거나 잰 폭으로 끝을 내는 길은 둘 다 막다른 길이다
          (잰 폭은 열기 때문에 제 칸보다 작아 오히려 더 갈라진다 — 실측 3/6 → 1/6). */
    var gl = groups.map(function(g){ return g.list; });
    for (var pass = 0; pass < gl.length; pass++){
      var moved = false;
      for (var i = 0; i < gl.length; i++){
        if (parseGroup(gl[i].slice()).length) continue;      // 이미 음절이 된다
        var L = i > 0 ? gl[i-1] : null, R = i < gl.length-1 ? gl[i+1] : null;
        if (!L && !R) continue;
        /* 가까운 쪽부터 — 붙여서 음절이 되면 그쪽으로 */
        var dl = L ? gl[i][0].x - (L[L.length-1].x + L[L.length-1].w) : 1e9;
        var dr = R ? R[0].x - (gl[i][gl[i].length-1].x + gl[i][gl[i].length-1].w) : 1e9;
        var order = (dl <= dr) ? [L, R] : [R, L];
        for (var k = 0; k < 2; k++){
          var nb = order[k]; if (!nb) continue;
          if (!parseGroup(nb.concat(gl[i]).slice()).length) continue;
          Array.prototype.push.apply(nb, gl[i]);
          nb.sort(function(a, b){ return (a.x - b.x) || (a.y - b.y); });
          gl.splice(i, 1); moved = true; break;
        }
        if (moved) break;
      }
      if (!moved) break;
    }
    return gl;
  }
  by.forEach(function(it){
    if (cur && (it.x + it.w) - cur.x0 <= SYL_COLS){ cur.list.push(it); return; }
    cur = { x0: it.x, list: [it] };
    groups.push(cur);
  });
  return groups.map(function(g){ return g.list; });
}

function parseFree(items){
  var out = [], bad = 0;
  splitSyllables(mergeDoubles(items)).forEach(function(g){
    var r = parseGroup(g);
    if (!r.length) bad++;          // 블록은 있는데 음절이 안 됐다
    out = out.concat(r);
  });
  parseFree.bad = bad;
  return out;
}

function parseGroup(items){
  items.forEach(function(it){ it.cx = it.x + it.w/2; it.cy = it.y + it.h/2; });
  var cons = items.filter(function(i){ return !isVowel(i.ch); });
  var vows = items.filter(function(i){ return isVowel(i.ch); });
  cons.sort(function(a,b){ return (a.cx-b.cx) || (a.cy-b.cy); });
  var used = new Set(), out = [];

  function nearest(list, ok){
    var best = null, bd = 1e9;
    list.forEach(function(v){
      if (used.has(v)) return;
      var d = ok(v);
      if (d != null && d < bd){ bd = d; best = v; }
    });
    nearest.d = bd;                 // 얼마나 가까웠는지도 알아야 둘 중 고른다
    return best;
  }
  function hasOwnVowel(c){
    return vows.some(function(v){
      if (used.has(v)) return false;
      if (v.h > v.w) return v.cx-c.cx > 0 && v.cx-c.cx <= 7 && Math.abs(v.cy-c.cy) <= 2.5;
      return v.cy-c.cy > 0 && v.cy-c.cy <= 7 && Math.abs(v.cx-c.cx) <= 3.5;
    });
  }
  /* 🔴 c 가 **다음 글자의 받침**이면 겹받침으로 데려가면 안 된다.
        hasOwnVowel 은 「c 가 초성으로서 제 모음을 갖는가」를 묻는데, 받침은
        오른쪽에 모음이 없고 위에 글자가 있어서 그 질문으로는 안 걸린다.
        실측(「텹랏」): 두 글자가 6칸 이하로 붙으면 랏의 ㅅ 이 텹의 ㅂ 에 끌려가
        ㅄ 이 되어 「텺라」가 나왔다 — 인식은 6개 다 맞았는데 조합만 틀렸고,
        폰에서 ㅂ/ㅄ 은 눈으로 구별이 잘 안 돼 「텹라」로 보였다.
        그래서 「위에 제 초성이 있는가」를 따로 묻는다. */
  function isOthersJong(c, A, J){
    return cons.some(function(B){
      if (B === c || B === A || B === J || used.has(B)) return false;
      var dy = c.cy - B.cy;
      if (dy < 1.5 || dy > 7) return false;
      if (Math.abs(c.cx - B.cx) > 3.5) return false;
      return hasOwnVowel(B);
    });
  }

  cons.forEach(function(A){
    if (used.has(A)) return;
    var dH, dV;
    var Vh = nearest(vows, function(v){
      if (v.h <= v.w) return null;
      var dx = v.cx - A.cx;
      if (dx <= 0 || dx > 7) return null;
      var overlap = Math.min(A.y+A.h, v.y+v.h) - Math.max(A.y, v.y);
      if (overlap < -2) return null;
      /* 🔴 초성은 모음의 가운데 높이에 오고, 받침은 그보다 아래에 온다.
            예전엔 자음을 x 순서로만 훑어서, 같은 칸열에 있는 초성과 받침의
            x 가 한 칸도 안 되는 차이로 뒤집히면 **받침이 모음을 먼저 채 갔다**
            (실측: 「탄리」가 「나리」로 — ㅌ 은 0.89 로 멀쩡히 잡혀 있는데
            ㄴ+ㅏ 가 먼저 묶여 ㅌ 이 통째로 버려졌다).
            모음 중심보다 확실히 아래에 있는 자음은 초성 후보에서 뺀다. */
      if (A.cy - v.cy > 1.2) return null;
      return dx + Math.abs(v.cy - A.cy);
    });
    dH = nearest.d;
    /* 🔴 아래 모음 반경 7 → 10 (2026-09-10, 합성 120장) — 두 칸 띄운 ㅋ/ㅜ 가 옆벽 때문에 실측
          중심 거리 8~9 라 못 붙어 「쿠」가 ∅ 이 됐다. 받침 반경(9→10)과 같은 자. */
    var Vv = nearest(vows, function(v){
      if (v.w <= v.h) return null;
      var dy = v.cy - A.cy, dx = Math.abs(v.cx - A.cx);
      if (dy <= 0 || dy > 10 || dx > 3.5) return null;
      return dy + dx;
    });
    dV = nearest.d;

    var jung = null, parts = [], vertical = false;
    if (Vv && Vh && Vh.cx > Vv.cx && COMPOUND[Vv.ch + Vh.ch]){
      jung = COMPOUND[Vv.ch + Vh.ch]; parts = [Vv, Vh]; vertical = true;
    }
    /* 🔴 둘 다 있고 합성모음이 아니면 **가까운 쪽**을 고른다.
          예전엔 세로모음(Vh)을 조건 없이 먼저 썼는데, 그러면 바로 아래에
          제 모음을 두고도 **다음 글자의 모음을 빼앗는다** — 「압튜리」에서
          ㅅㅡ가 0칸 아래에 있는데 7칸 오른쪽 ㅣ 를 가져가 「압티」가 되고,
          ㅣ 를 잃은 ㄹ 은 모음이 없어 통째로 버려졌다. */
    else if (Vh && Vv){ 
      if (dV < dH){ jung = Vv.ch; parts = [Vv]; vertical = true; }
      else { jung = Vh.ch; parts = [Vh]; }
    }
    else if (Vh){ jung = Vh.ch; parts = [Vh]; }
    else if (Vv){ jung = Vv.ch; parts = [Vv]; vertical = true; }
    if (!jung) return;

    if (PLUS_I[jung]){
      var right = parts[parts.length-1];
      var Vi = nearest(vows, function(v){
        if (parts.indexOf(v) >= 0 || v.ch !== 'ㅣ') return null;
        var dx = v.cx - right.cx, dy = Math.abs(v.cy - right.cy);
        if (dx <= 0 || dx > 5 || dy > 2.5) return null;
        return dx + dy;
      });
      if (Vi){ jung = PLUS_I[jung]; parts.push(Vi); }
    }
    /* 🔴 H 글자(ㅐ/ㅒ)는 조각 조합이 여럿이다 — ㅏ+ㅣ · ㅣ+ㅓ · **ㅏ+ㅓ** … 붙은 H 를 자르면
          칼자리에 따라 ㅣ+ㅓ 도 되고 ㅏ+ㅓ 도 된다(12:21 프레임: ㅏ0.74+ㅓ0.74 → 폰 「첲」).
          기준은 조각 이름이 아니라 **획이 두 기둥 사이에 있는가**: 왼쪽이 ㅏ/ㅑ 이거나 오른쪽이
          ㅓ/ㅕ 면 H 다(ㅓ+ㅣ 는 획이 바깥이라 ㅔ — 아래 PLUS_I 가 한다). 이웃한 세로모음 하나만
          본다(중심 3칸 안). 어느 쪽이든 ㅑ/ㅕ 가 끼면 ㅒ. */
    if (parts.length === 1 && (jung === 'ㅏ' || jung === 'ㅑ' || jung === 'ㅓ' || jung === 'ㅕ' || jung === 'ㅣ')){
      var V0 = parts[0];
      var Nb = nearest(vows, function(v){
        if (v === V0 || v.h <= v.w) return null;
        var dx = v.cx - V0.cx, dy = Math.abs(v.cy - V0.cy);
        if (dx === 0 || Math.abs(dx) > 3 || dy > 2.5) return null;
        return Math.abs(dx) + dy;
      });
      if (Nb){
        var Lc = Nb.cx < V0.cx ? Nb.ch : V0.ch, Rc = Nb.cx < V0.cx ? V0.ch : Nb.ch;
        var isH = (Lc === 'ㅏ' || Lc === 'ㅑ') || (Rc === 'ㅓ' || Rc === 'ㅕ');
        if (isH){
          var two = (Lc === 'ㅑ' || Lc === 'ㅕ' || Rc === 'ㅑ' || Rc === 'ㅕ');
          jung = two ? 'ㅒ' : 'ㅐ'; parts.push(Nb);
        }
      }
    }

    used.add(A); parts.forEach(function(v){ used.add(v); });

    var floorY = vertical ? Vv.cy : A.cy;
    var xs = [A.cx].concat(parts.map(function(v){ return v.cx; }));
    var loL = Math.min.apply(null, xs) - 2.5, hiL = Math.max.apply(null, xs) + 2.5;
    /* 🔴 받침 반경은 9칸 — 7 이었을 때 「탸/턈」이 프레임마다 뒤바뀌었다(2026-09-07).
          아이가 ㅁ 을 ㅌ 아래 서너 줄 띄워 놓아 중심 거리가 7.8칸이었고, 칸이 38~40 으로
          흔들리니 6.9~7.8 을 오가며 경계에 걸렸다. ㅁ 은 0.83 으로 멀쩡히 잡혀 있었다.
          넓힌 만큼 아래 줄 글자의 초성을 훔칠 수 있으므로 **제 모음을 가진 자음은 받침이
          아니다**(hasOwnVowel) — 겹받침에서 이미 쓰던 가드를 홑받침에도 건다. */
    var J = nearest(cons, function(c){
      if (c === A) return null;
      var dy = c.cy - floorY;
      if (dy < 1.5 || dy > 10) return null;
      if (c.cx < loL || c.cx > hiL) return null;
      if (dy > 7 && hasOwnVowel(c)) return null;
      return dy + Math.abs(c.cx - A.cx);
    });
    var jongCh = null, J2 = null;
    if (J){
      used.add(J);
      jongCh = J.ch;
      J2 = nearest(cons, function(c){
        if (c === A || c === J) return null;
        var dx = c.cx - J.cx, dy = Math.abs(c.cy - J.cy);
        if (dx <= 0 || dx > 6 || dy > 2) return null;
        if (!DOUBLE_JONG[J.ch + c.ch]) return null;
        if (hasOwnVowel(c)) return null;
        if (isOthersJong(c, A, J)) return null;
        return dx + dy;
      });
      if (J2){ used.add(J2); jongCh = DOUBLE_JONG[J.ch + J2.ch]; }
    }

    var s = composeHangul(A.ch, jung, jongCh);
    if (s) out.push({ s:s, cx:A.cx, cy:A.cy });
    else {
      used.delete(A); parts.forEach(function(v){ used.delete(v); });
      if (J) used.delete(J);
      if (J2) used.delete(J2);
    }
  });

  out.sort(function(a,b){ return (a.cx-b.cx) || (a.cy-b.cy); });
  return out.map(function(x){ return x.s; });
}

/* =====================================================================
 * 카메라 시뮬레이션 — 폰을 거치대에 올려 판을 내려다본 화면을 만들고,
 * 판 네 모서리로 정사영으로 펴 본다. 인식기가 실제로 보게 될 두 장이다.
 *
 * 여기서 펴는 데 쓰는 네 점은 「정답」이다(모델 좌표를 투영해서 얻는다).
 * 진짜 인식기는 그 네 점을 화면에서 찾아야 하지만, 뒷단(색 분리·자모 분류)을
 * 먼저 검증하려고 앞단을 잠시 건너뛴 것이다. → spec §6
 * ===================================================================== */
/* =====================================================================
 * 인식기 — 펴진 판에서 블록을 읽어 낱말까지 간다.
 *
 *   warp 결과를 격자 좌표계 그대로 텍스처에 굽는다 (한 칸 = CELL px)
 *   → 색으로 블록만 떼어내고 (자음/모음 2색)
 *   → 이어진 덩어리로 나눈 뒤
 *   → 자모 템플릿과 IoU 로 맞히고
 *   → parseFree 에 넘긴다.
 *
 * 템플릿은 3D 블록을 만드는 그 획 좌표(CATALOG)를 위에서 본 2D 로 그린 것이다.
 * 블록 도면이 바뀌면 모델과 템플릿이 같이 바뀐다.
 * ===================================================================== */
var CELL = 24;                       /* 펌진 판에서 격자 한 칸 = 24px.
   🔴 16 이면 **펌면서 획 사이 홈을 버린다**. 받침 ㄹ 이 ㅅ 으로 읽힐 때 마스크를
      그려 보면 획 사이가 통째로 메워진 네모였고, MORPH_CLOSE 를 빼도 그대로였다 —
      색 분할 이전에 이미 없었다. 원본 화소엔 홈이 또렷하다: 검출 버퍼에선 그 블록이
      120px 이라 홈이 8px 인데, **펌진 버퍼에선 43px 이라 홈이 3px** 로 사라졌다.
      그러면 ㅅ·ㄹ·ㅍ 가 전부 같은 네모 덩어리가 된다.
      24 면 살아난다 — 실측 「옵텀머」 → 「옵턴머」, 「토」 는 그대로.
      대가는 색분할+판정 43 → 90ms. 32 도 되지만 232ms 라 과하다.
   🔴 형태소 커널(5px)은 절대값으로 둔다 — CELL 을 올리면 상대적으로 작아져
      덜 메우는데, 그게 바로 우리가 원하는 방향이다.
   🔴 예전에 24 로 올렸다 되돌린 적이 있다 — 그때는 빈 칸 차이로 글자를 뽑았고
      닫기 반지름 같은 절대 픽셀 상수가 같이 안 움직였다. 지금은 색 분할이라 그 상수를 안 쓴다. */

/* 실사 보정값 — 지금까지의 숫자는 전부 시뮬이 제 렌더를 읽은 것이라
   렌더에 맞춰 굳어 있다. 실제 카메라는 조명·화이트밸런스로 색상각이 통째로
   밀리므로(주황이 60°를 넘어가면 자음이 통째로 사라진다), 사진을 넣을 땐
   여기를 돌려 가며 맞춘다. 기본값 = 렌더에서 확정한 값. */
/* 🔴 실물 한 장을 재고 나서 고친 값들 (2026-08-29).
      재기 전 값은 렌더에서 나온 것이고, 실물은 이렇게 달랐다:

        연두 ㅏ(모음)  색상 156°  채도 0.10  밝기 0.74
        노랑 ㄷ(자음)  색상  45°  채도 0.13  밝기 0.80
        판 흰면        색상 216°  채도 0.20  밝기 0.80
        나무 바닥      색상  10°  채도 0.09  밝기 0.29

      🔴 「판은 무채색」이 틀렸다 — 조명 탓에 흰 판이 푸르게 떠서 화면에서
         **채도가 가장 높은 것이 판**이다. 블록은 파스텔이라 오히려 옅다.
      🔴 채도 문턱 0.10 은 연두 블록(0.102)과 겹쳐 있었다. 조명이 조금만
         흔들려도 붙었다 떨어졌다 해서, 그게 화면 깜빡임으로 보였다.
      🔴 전경/배경은 채도가 아니라 **밝기**로 갈린다(블록 0.78~0.83 vs 바닥 0.34).
      🔴 판(216°)은 두 색 밴드 밖이라 색상만으로 걸러진다 — 상한을 200 위로
         올리면 판 전체가 모음으로 들어온다. */
var TUNE = {
  colorBonus: 0.06,     // 색이 맞으면 이만큼 얇는다 — 비길 때만 갈린다
  /* 자음 무리와 모음 무리의 A 평균이 이만큼은 떨어져야 「두 색이 놓였다」고 본다.
     실측 사이 0.04~0.07 · 무리 안 퍼짐 0.03 이라 그 중간. */
  aGap: 0.035,
  colorDiff: false,     // 빈 판과의 차이를 색으로 잴지(true) 밝기 포함으로 잴지(false)
  difBlur: 0.10,        // 차이 지도를 흐리는 반지름(칸). 획 사이(약 0.6칸)보다 작아야 한다
  openR: 0,             // 점 지우기 열기 반지름(칸). 0 이면 끔 — 켜면 ㅇ 의 고리가 먼저 끊긴다
  closeR: 1,            // 끊어진 획을 잇는 닫기 반지름(px)
  plateRatio: 2.0,      // 받침판으로 인정할 색차 배수 — 이보다 작으면 안 깎는다
  stripPlate: true,     // 블록 받침판 걷어내기 — 이게 있어야 ㅌ 과 ㄷ 이 갈린다
  plateMinSide: 2.2,    // 짧은 변이 이보다 얇은 덩어리(=모음 막대)는 안 깎는다(칸)
  /* 테두리가 판보다 이만큼은 붉어야 한다 — Otsu 가 판 잡음을 가를 때의 바닥. */
  roseMin: 0.012,
  /* 🔴 점 격자로 인식부를 잡는 길 — 사각형까지는 맞는데(파이썬에서 다섯 장 전부
     확인) 마지막 배율이 몇 % 어긋나 ㅌ 이 ㄹ 로 읽힌다. 여유 손잡이를 -1~1 로
     흔들어도 결과가 안 변하는 걸 보면 사각형이 내가 아는 자리로 안 들어가고 있다.
     원인을 찾기 전까지는 끈다 — 켜면 지금 읽히는 ph1·ph3 까지 잃는다. */
  latRefindAfter: 12,   // 이만큼 연속으로 못 읽으면 격자를 다시 찾는다
  /* 🔴 껐다가 **다시 켰다**(2026-08-31). 「인식이 이상해졌다」는 신고에 이걸
        범인으로 짐작해 껐는데, 정작 그때 보고 계신 화면은 **이게 켜진 배포본**이었다
        (푸시만 하고 배포 전이었다). 즉 이 기능 탓이 아니었다.
        진짜 원인은 autoSpeak 이 win 의 소리 체인을 끊던 것이었다.
        🔴 「이상하다」는 말에 원인을 짐작해서 기능부터 끄지 말 것 — 어느 버전을
           보고 있는지부터 확인한다. 999 로 두면 끌 수 있다. */
  skewMax: 3,           // 펴진 글자가 이보다 기울면 호모그래피가 틀린 것 — 못 읽은 것으로 센다
                        // (실측 25%분위: 맞는 프레임 0.0~1.2° / 샐뚟한 프레임 5.5°·24.5°)
  grooveCut: 4,         // 국소 평균보다 이만큼 어두우면 획 사이 홈으로 보고 파낸다
  tieGap: 0.06,         // 1·2위가 이보다 가까우면 어긋난 자리로 다시 겨룬다
  tieMargin: 0.15,      // 상관이 **비율로** 이만큼 앞서야 뒤집는다 (간발의 차로는 안 뒤집는다)
  colorFirst: true,     // 빈 칸 차이 대신 색으로 바로 간다
  hueYellow: [20, 38],  // OpenCV H (0..179)
  hueGreen:  [38, 85],
  /* 🔴 격자 길은 끔다. 색으로 자모 영역이 이미 나오므로 격자가 하던 일은
        칸 크기 재기 하나뿐이었고, 그것 때문에 한 프레임 302ms 를 썼다.
        결정적으로 **실물 판에서는 점을 하나도 못 찾는다**(폰 프레임 진단 「점 0」) —
        새 판은 구멍 없이 돌기만 있어서 어둡게 보이는 점이 없다. 이미 폴백으로 돌고
        있었고, 그 경로가 잘 읽는다. 코드는 남겨 둔다 — 구멍 있는 판에선 동작한다. */
  useLattice: true,
  latMirror: false,      // 좌우 뒤집기(반사경)
  latFlip: true,       // 격자 경로에서 세로 뒤집기를 한 번 더 걸지
  latShiftI: 0,         // 격자 창을 가로로 칸 단위 이동
  latShiftJ: 0,         // 격자 창을 세로로 칸 단위 이동
  latPhase: 0,          // 칸 위상 — 점이 칸 가운데면 0.5, 모서리면 0
  latPad: 0,            // 격자 창을 칸 단위로 넓힘(+)/좁힘(-)
  latRot: 0,            // 격자 사각형의 시작 모서리 회전(0~3) — 실물로 재서 정했다(0 이면 90도 돌아 ㅌ이 ㅍ으로 읽힌다)
  ringRot: 0,
  cutRows: 2,           // 잘린 경로: 두 테두리 선 사이가 인식부 세로 + 이만큼(칸)
  cutWide: 1.0,         // 잘린 경로: 격자 주기로 잰 가로 배율 보정           // 테두리 사각형의 시작 모서리 회전(0~3) — 실물로 재서 정한다
  /* 🔴 테두리 안쪽 벽은 참 인식부보다 **한 칸 바깥**이다(테두리 띠 두께 +
     벽을 부풀린 만큼). 실측 폰 _ph1: 0 이면 「로」(ㄹ 0.78) · -1 이면 「토」(ㅌ 0.81). */
  ringPad: -1,          // 테두리로 잡은 사각형을 칸 단위로 넓힘(+)/좁힘(-)
  diffK: 1.2,           // 빈 칸과의 차이가 판 중앙값의 몇 배부터 블록인가
  diffCap: 4,           // Otsu 문턱의 상한(빈 판 중앙값의 배수)
  blockLum: 0.60,             // 판 밝기의 이 비율보다 어두우면 바닥·그림자
  hueSplitMin: 30,            // 전경 색상 폭이 이보다 좁으면 한 색만 올라온 것
  hueRot: 0,        // 색상 회전(°) — 화이트밸런스 밀림 보정
  blockK: 9.0,
  blockFloor: 0.12,  // 판이 균일해 MAD 가 0 일 때 쓰이는 바닥 (색 거리 p99 대비)     // 판 색 퍼짐(MAD)의 몇 배부터 블록으로 볼지
  sat: 0.05,        // 실측 연두 0.10 · 노랑 0.13 — 그 아래로 내려 여유를 둔다
  lit: 0.62,        // 실측 블록 최대채널 0.78~0.83 · 바닥 0.34 · 트레이 0.47
  choLo: 20,  choHi: 80,      // 노랑~주황 = 자음 (실측 45°)
  jungLo: 110, jungHi: 195,   // 연두~민트 = 모음 (실측 156°, 판 216° 는 제외)
  boardLuma: 0.40,            // 판 외곽 검출 밝기 하한
  /* 레고형 판 — 채도가 이만큼(0..255)은 있어야 블록으로 본다.
     Otsu 가 그보다 낮게 잡으면(=빈 판) 이 값을 쓴다. 실측 판 5~40 · 노랑 245~255. */
  legoMinSat: 90,
  /* 🔴 **여기서는 뒤집지 않는다**(9). 좌우는 `uploadPhotoFrame` 이 입구에서
     이미 되돌려 놓았고(`scale(-1,1)`), 세로는 readPixels 가 뒤집는데 그 둘이
     상쇄된다.
     🔴 **📤 보내기로 올라온 JPEG 으로 맞추면 안 된다** — 그 그림은 이미 한 번
        뒤집힌 `photo.cv` 라서, 앱에 도로 먹이면 입구에서 **두 번째** 뒤집힌다.
        그 이중 뒤집힌 그림에 맞춰 「좌우 한 번(1)」이라고 정했고, 그래서 폰에서는
        정확히 반대가 되어 「ㅡㅏㅠ」처럼 읽혔다.
        실측: 실시간과 같은 입력(미리 좌우 뒤집은 사본)에서 9=「가규」 · 1=「ㅓㄷㅠ」,
        올라온 JPEG 그대로에서는 그 반대.
     🔴 즉 **올라온 프레임으로 한 테스트는 실시간을 대신하지 못한다.** 그걸로
        재려면 먼저 좌우를 뒤집어 놓고 재야 한다. */
  periodPeak: 0.60,              // 최고점의 이 비율을 넘는 **가장 작은** 국소최고 = 기본 주기
  legoSylGap: 0.25,             // 앞 음절 오른쪽 끝에서 이만큼까지는 같은 음절(칸)
  /* ─── 🧾 스티커 블록 (인쇄 카드를 붙인 4x4·2x4 블록, 2026-09-16) ────────────────
     🔴 획 블록 경로와 **다른 물건**이다. 저기는 「덩어리 = 글자」지만 여기는
        「덩어리 = 액자, 글자는 액자 안 잉크」라 단계가 하나 더 있다.
     🔴 모드 선택 화면은 없다 — 카드가 있으면 카드로, 없으면 예전 경로로 간다.
        판정은 첫 프레임에서 공짜로 난다(카드는 채움 ≈1.0 의 네모, 획 블록은 자모 모양). */
  stickerOn: 1,                  // 0=끔 · 1=자동(카드가 보이면 카드 경로) · 2=강제 (?board=sticker)
  /* 🔴 가장자리에 걸린 카드도 **읽는다**(2026-09-16). 잘리는 건 폰 화각이고
     우리는 안 자른다(검출버퍼는 사진 비율 그대로 긴 변만 줄인다 — 레터박스 0).
     잘려도 **글자는 카드 가운데에 있어** 잉크가 다 보이는 일이 많다 — 실측은 아래 주석. */
  stickerEdge: 1,               // 1=읽는다 · 0=버린다(예전 동작)
  stickerMin: 2,                 // 카드가 이만큼은 보여야 카드 판으로 친다
  /* 흰 종이 · 검은 잉크를 **둘 다** 전경으로 잡는다 — 잉크까지 넣어야 카드가 속 빈 고리가 아니라
     꽉 찬 네모가 된다. 실측(올라온 두 프레임, Lab 중앙값): 초록 판 L116 a86 b149 ·
     흰 스티커 L212 a128 b126 · 주황 몸통 L138 a143 b178 · 검은 잉크 L28 a126.
     🔴 「초록이 아니면 전경」(a* Otsu)으로는 안 된다 — 몸통끼리 닿아 카드 열여덟 장이
        1115x707 덩어리 **하나**가 된다(채움 0.72). 갈라 주는 건 흰 종이다. */
  /* 흰 종이 문턱. 🔴 **일하는 건 색(a*·b*)이지 L 이 아니다** — 초록 판은 a* 86(|Δ|42) · 주황 몸통은
     b* 188(|Δ|60) 이라 색에서 이미 떨어진다. L 은 「어두운 중성색(탁자·그늘)을 뺀다」뿐이다.
     실측 훑기(두 프레임 × L 110~160): 밝은 프레임은 110~160 전부 18/18 로 무감각하고,
     **그늘진 프레임만** 140 에서 17장/16 · 150 에서 14장/14 · 130 에서 15 · 110 에서 13.
     그늘에서 흰 종이가 깨지면 잉크가 「둘러싸인 구멍」이 아니게 되어 카드가 통째로 빠진다.
     ⚠ 근거가 두 장이다. 어두운 판이 더 들어오면 다시 훑을 것. */
  stickerWhiteL: 140, stickerWhiteA: 12, stickerWhiteB: 20,
  /* 🔴 **잉크를 밝기로 잡지 않는다.** 처음엔 「흰 종이 **또는** 검은 잉크」로 뒀는데,
        ①검출버퍼에서 잉크는 검지 않다 — 원본 JPEG 에서 L28 이던 것이 여기서는 **L 110~150**
          이다(GL 텍스처 되읽기라 값이 다르다. 원본에서 잰 문턱을 그대로 가져온 내 실수).
        ②전역 밝기 문턱은 화면 아래 **검은 탁자**를 통째로 전경으로 만든다(808x472 덩어리).
        대신 **글자는 카드 테두리에 절대 안 닿는다**(시트 PAD 3.0mm) — 그러니 잉크는
        흰 마스크 안의 **구멍**이다. 구멍을 메우면 카드가 꽉 찬 네모가 되고, 카드끼리는
        절대 안 붙는다(구멍은 위상이라 이웃으로 새지 않는다).
        ⚠ 닫기 커널로 메우려던 길은 막혔다 — 획 굵기 13px > 카드 사이 틈 11px(칸 31 실측)라,
          획을 잇는 커널은 카드도 잇는다. */
  stickerHoleMax: 0.004,         // 화면 넓이의 이 비율보다 작은 구멍만 메운다(큰 영역 오염 방지)
  /* 🔴 **카드 안 잉크의 중성 한계(inkA·inkB)는 여기 없다 — 갈래 기록(kinds)이 들고 온다.**
     알파벳 시트만 글자 밑에 **색 밑줄**을 긋는다. 밝기만 보면 그 줄과 색 테두리가 잉크로 딸려 들어와
     히스토그램이 셋이 되고, Otsu 는 둘로 가르므로 **잉크가 적은 글자에서 「잉크+밑줄 vs 종이」로
     갈라진다**(실측 `i` 카드: 문턱 184 → 카드의 13.7% 가 잉크 → 글자 소실. 중성만 모으니 0.28 → 0.76).
     🔴 **한 상수로 두 집합을 덮으려다 한글을 깨뜨렸다**(2026-09-16). 훑기에서 「한글은 A 6·8·12 가
        끈 것과 같다」가 나와 전역 6 으로 뒀는데, **화이트밸런스가 틀어진 프레임이 오자 무너졌다** —
        그 프레임은 잉크 |a-128| 8~10 이고 **종이마저 3~6** 이라 「중성」이 절대값이 아니었다.
        한글 카드 점수가 **0.01~0.31** 로 떨어져 아무것도 안 읽혔다.
     → 한글은 **끈다**(inkA 0). 한글 시트엔 밑줄이 없고 글자가 카드를 크게 채워 원래 흔들리지 않는다.
     ⚠ 알파벳도 **절대 문턱이라 같은 색 치우침엔 약하다**. 그 프레임이 오면 값을 흔들지 말고
        **그 카드 자신의 종이 색을 기준**으로 재라(절대 128 이 아니라). */
  /* 구멍 메운 뒤 진짜 카드는 0.84~0.95(실측 36장) · 자모 획은 0.4~0.6 이라 사이가 넓다 */
  stickerFill: 0.80,             // 상자 채움이 이만큼은 돼야 카드(네모)다
  /* 🔴 카드 가로세로비 띠와 칸 배수는 **여기 없다** — 형판 JSON(`kinds`)이 들고 온다.
        집합마다 카드가 다르기 때문이다(한글 자음 정사각 · 한글 모음 0.45 · 알파벳 0.645).
        절대 크기로는 안 고른다(칸 추정이 깨져도 카드는 찾아야 한다 — 실측 칸 37.2 vs 137.9).
        오히려 **카드가 칸의 원본**이다 — 스티커 긴 변이 집합마다 고정이라(한글 29.1mm=3.64돌기 ·
        알파벳 45.1mm=5.64돌기) 카드 하나만 잡히면 px/돌기가 바로 나온다.
        🔴 찾는 건 **흰 스티커**이지 블록 발자국(31.6mm)이 아니다 — 발자국 값을 쓰면 칸이 8% 작다. */
  stickerCellTol: 0.40,          // 칸이 중앙값에서 이 비율 넘게 벗어난 카드는 카드가 아니다
  stickerMinIou: 0.42,           // 잉크가 형판과 이만큼은 닮아야 글자로 본다
  stickerTieGap: 0.10,           // 1·2위 차이가 이보다 작고 **재 본 짝**이면 자리 탐침으로 가른다
  legoFlip: 9,                   // 0=세로 1=좌우 -1=둘다 9=안함
  legoVMin: 60,                  // 이 밝기 아래는 채도를 못 믿는다
  legoMinArea: 0.0008,           // 화면 넓이의 이 비율보다 작으면 부스러기
  legoMinIou: 0.50,              // 형판과 이만큼은 닮아야 자모로 본다
  /* 🔴 게이트는 **좌우가 다르다.** 잉크는 늘 **불어나지 줄지 않는다**(닫기·그림자·옆벽).
        그런데 대칭으로 두면 제일 얇은 형판이 제일 먼저 죽는다 — ㅣ 는 1칸 폭이라
        덩어리 비가 0.36 만 넘어도 후보에서 빠지고(실측값이 0.26~0.28 로 코앞이다)
        그러면 남는 건 ㅓ 뿐이라 「깅」이 자동으로 「겅」이 된다. */
  legoArLo: 0.55,                // 덩어리가 형판보다 이보다 더 홀쭉하면 안 본다
  legoArHi: 2.6,                 // 덩어리가 형판보다 이보다 더 뚱뚱하면 안 본다
  /* 실측(칸=24, 꽉 찬 네모를 굵혀 가며):
       위 1.8 → ㅣ 는 1.6칸까지만 버티고 2.0칸에서 ㅑ, 2.6칸에서 ㄹ 로 넘어간다.
       위 2.6 → ㅣ 가 2.6칸까지 버티고 3.0칸부터 ㄹ. 넓혀도 3칸짜리는 안 샌다.
     아래쪽(0.55→0.40)은 넓히면 안 된다 — 열두 장 중 「가굥」을 잃는다(12/12 → 11/12). */
  legoMatchGrid: 40,             // 형판 맞추기 표본 격자 — 크기와 무관하게 이만큼만 잰다
  /* 🔴 **겹침이 주 지표**다. 상관을 주로 써 봤더니 6장 중 3장 → 2장으로 나빠졌다
     (가굗·가굥이 조각을 잃었다). 지금 판 주석의 결론이 이 판에서도 그대로다:
     겹침은 전체 모양에, 상관은 어긋난 획에 강하다 — 그래서 상관은 **동점일 때만**. */
  legoScore: 'iou',              // 'iou' = 넓이 겹침(주) · 'corr' = 상관
  legoTieGap: 0.06,              // 1·2위 겹침 차이가 이보다 작으면 상관으로 다시 겨룬다
  legoTieMargin: 0.05,           // 상관이 **비율로** 이만큼 앞서야 뒤집는다
  /* 🔴 **판이 초록이 되면서 축이 b\* 에서 a\* 로 바뀌었다**(2026-09-07).
     예전 판은 회색이라 「누런 기」밖에 기댈 게 없어 b\* 를 썼다. 지금 판은 초록이고
     블록은 노랑·흰색이라 **a\*(초록–빨강 축) 하나가 둘 다 판에서 떼어 낸다**.
       실측(손으로 고른 조각): 판 a\* −43 (밝은 데 −31 ~ 그늘 −50)
                              노랑 +3 · 흰 −2  →  여백 25 = 판 산포의 6.1배
     🔴 **b\* 로는 흰 블록이 원리상 안 보인다** — 흰색 b\* 는 −0.1 로 판과 같다.
        실측: 배포본이 흰 ㅏ 를 통째로 놓치고 노랑 ㄹ 마저 두 조각 내어 「ㅡㅛㅛ」로 읽었다.
        a\* 로 바꾸니 ㄹ 이 한 덩어리(113x121)로, ㅏ 도 (53x121) 로 잡힌다.
     🔴 **밝기로 나누지 말 것.** 판 a\* 가 밝기와 0.82 로 같이 움직이길래 a\* ÷ L ·
        g'=G/(R+G+B) · (G−R)/(G+R) · (G−R)/(R+G+B) 를 같은 조각으로 재 봤더니
        여백/판산포가 1.8 · −0.8 · 2.1 · 2.2 로 **전부 a\*(6.1)보다 나빴다**.
        어두운 화소에서 나눗셈이 L 자신의 잡음을 끌어들인다(그늘진 노랑 L=27).
        상관은 실재하지만 기울기가 작다 — L 55→69 에 판 a\* 는 5 움직이고 여백은 25 다.
     🔴 마스크로 자른 화소로 그 마스크의 문턱을 검증하지 말 것 — 순환논법이다.
        한 번 그렇게 재고 「여백 1.0」이라는 헛것을 얻었다. 축 비교는 손으로 고른 조각으로.
     ⚠ 파란 블록을 쓸 거면 여기서 또 축을 골라야 한다 — 그 색 실사부터 받을 것.
     ⚠ 색 무관으로 만들려고 `dist`(판 색에서의 |a*|+|b*| 거리)를 붙여 재 봤는데
        **더 나빴다** — 노랑 9장 기준 b* 9/9 vs dist 최고 7/9(MAD 배수 2·3·4·6·9 전부).
        이유: 절대값으로 접으면 **부호를 잃는다**. 이 판은 약간 파랗고(b*<128) 블록은
        누레서(b*>128) 그 **부호 차이가 곧 여유**인데, 거리로 바꾸면 그게 사라진다.
        🔴 이 dist 실험은 **회색 판 시절**의 것이다. 지금은 판이 초록이라 판 자신이
           a* 한쪽 끝에 몰려 있고, 그래서 부호가 살아 있는 a* 한 축이면 충분하다. */
  legoChroma: 'a',               // 'a' = Lab a*(**초록 판 기본**) · 'lab' = b*(회색 판 시절, 노랑 전용)
                                 // 'dist' = 판 색 거리(실험, 더 나쁨) · 'sat' = HSV 채도
  /* 🔴 자음(노랑)/모음(흰) 은 **채도**로 가른다. b* 로 하려다 한 번 틀렸다 —
     실측 b* 자음 55·57 / 모음 −1·**25** 라 문턱을 25 에 두면 바로 모음 최댓값 자리다.
     실제로 뒤집혔다: 옆 노랑이 반사된 흰 블록이 자음으로 분류돼 자음 형판만 보다 ㅂ0.46.
     채도는 자음 168·193 / 모음 18·71 로 사이가 97 비어 있고, **흰색이 저채도인 것은
     조명과 무관한 성질**이다(세 채널에 같은 밝기가 곱해져도 S 는 안 변한다).
     0 이면 이 갈래 제한을 끈다.
     🔴 **기본값 0 = 꺼 둔다.** 색 규칙(자음 노랑 · 모음 흰색)을 믿고 형판을 제한했다가
        **맞게 읽던 것을 틀리게 만들었다** — 사용자가 「러」를 놓은 프레임은 ㄹ 도 ㅓ 도
        노랑이었다(S 217 / 195). 모음이 자음으로 분류돼 자음 형판만 보게 된다.
     🔴 그리고 **필요하지도 않았다.** 갈래 제한 없이 「랴」 ㄹ0.81+ㅑ0.92, 「러」 ㄹ0.81+ㅓ0.96
        으로 둘 다 1위였다. 켜서 이득 본 건 흰 블록 한 장뿐인데 그건 문턱이 모음 최댓값에
        걸린 경우라 애초에 갈래로 풀 문제가 아니었다.
     ⚠ 켜려면 **색 규칙이 실제로 지켜지는지부터** 재라. 지금은 안 지켜진다. */
  legoVowelSat: 0,
  legoPlateMad: 3,               // 'dist' 일 때만 — 판 자신의 산포(MAD) 배수
  legoCloseRect: 1,              // 1 = 닫기 커널을 사각으로(분리 가능 → 훨씬 싸다)
  legoWallCut: 1,                // 1 = 덩어리마다 V 를 갈라 **옆벽**을 뗀다(0=끔)
  legoOpen: 0.15,                // 열기 커널(칸 배수). 예전엔 5px 로 박혀 있었다 — 칸 34 에서
                                 // 0.15칸이라 값은 그대로고, 칸이 다른 폰에서만 달라진다.
  legoShadowFill: 0.40,          // 돌기 그림자를 메우는 닫기 커널(칸 배수) — 0 이면 안 메운다
                                 // 🔴 0.20 은 모자란다(6장 중 4장) · 0.40 에서 6/6
  legoMaxBlob: 20,               // 이 칸수를 넘는 덩어리는 글자가 아니다(가구·다른 판)
  legoNeck: 0.75,                // 프로파일 평균의 이 아래로 내려가야 「목」이다
  legoSplitDepth: 2,             // 자르기 깊이 — 2면 조각 4개까지
  legoMaxCuts: 2,                // 한 축에서 볼 골짜기 수 — 늘리면 조합이 폭발한다
  /* 조각의 긴 변 하한(칸). 형판은 전부 5칸이고 마스크가 줄어드는 만큼 여유를 둔다.
     🔴 **4.2 는 붙은 블록을 통째로 막고 있었다.** 「러」를 붙여 놓고 재 보니 옳은 칼자리에서
        ㄹ0.90 + ㅓ0.93 으로 완벽히 갈리는데, 조각의 긴 변이 4.12칸 / **3.83칸** 이라
        여기 걸려 버려졌다 — 그러고는 통짜를 ㄹ0.68 하나로 읽었다. 펴고 옆벽 떼고 열기까지
        하면 잉크가 4.2칸보다 더 줄어든다.
        실측 훑기(「러」·「랴」 두 프레임 × 틈 +8/0/−6): 4.2·4.0 에서 전부 실패,
        **3.8 이하에서 전부 성공**. 낱개 블록은 3.0 까지 내려도 거짓 분할이 없다.
     ⚠ 예전에 「각」에서 **틀린** 세로 갈래가 3.8·4.4칸짜리를 만든 적이 있다. 그 3.8 과
        여기 3.83 은 0.03 차이라 **이 자로는 둘을 못 가른다** — 가르는 건 뒤의 점수 관문
        (자른 쪽이 통짜와 legoMinIou 를 둘 다 넘어야 한다)이다. 「각」류 오독이 다시
        보이면 이 값이 아니라 그 점수 관문을 볼 것. */
  legoMinLong: 3.6,
  legoSplitOk: 0.62,             // 이만큼 닮았으면 뭉친 게 아니다 — 안 자른다
  legoSplitGain: 0.03,           // 자른 쪽이 이만큼은 나아야 받아들인다
  legoSplitSlack: 0.05,          // 제 형판 없는 덩어리(narrow)는 조각이 통짜보다 이만큼 못해도 자른다
  legoPeelOn: 1,                 // 자르기로 안 풀린 큰 덩어리는 모서리에서 형판을 벗겨 읽는다
  legoPeelIou: 0.55,             // 모서리에 댄 형판이 이만큼은 닮아야 벗긴다(깎인 마스크라 통짜보다 낮게)
  legoPeelDepth: 4,              // 벗기기 재귀 깊이(조각 수)
  legoPeelTry: 3,                // 깊이 0 에서 형판이 다른 상위 후보 셋을 끝까지 벗겨 보고 설명한 잉크로 고른다
  legoPeelCorners: 0,            // 0 = 왼쪽 위 모서리만. 🔴 네 귀퉁이(1)는 실측에서 더 나빴다(캴→캼·복→뵥) — 귀퉁이가 늘수록 부분집합·이웃 삼킴 후보가 는다
  legoPeelPrec: 0,               // 벗길 상자의 정밀도 하한(0=끔). 🔴 0.8 로 켜면 깎인 막대 때문에 진짜 조각까지 떨어져 캴·복이 빈다(실측)
  legoSuperRecall: 0.4,  // 상위집합 형판만의 획이 이만큼 보이면 상위집합으로 읽는다(ㄱ→ㅋ·ㄴ→ㄷ)
  legoBotBar: 0.5,               // ㅂ 으로 읽힌 덩어리의 밑줄 채움이 이 아래면 H(ㅐ) — 실측 H ≤0.31 · ㅂ ≥0.77
  /* 편 그림에서 위·아래 주기가 이 배수 안으로 들어와야 「폈다」로 친다(배음은 접고).
     실측: 잘 읽힌 프레임 1.08·1.09 / 틀린 프레임 1.25·1.32. */
  legoWarpOk: 1.15,
  /* 🔴 **펴기는 기본이 꺼져 있다**(0). 네 프레임을 나란히 재 보니 안 펴는 쪽이
     전부 같거나 나았다:
       ru_p(러)  펴고 ㅡㅡㅡㄹㅓ(덤3)      · 안 펴고 ㄹㅓ 깨끗
       랴        펴고 ㅡㅡㅡㄹㅡㅑ(덤4)    · 안 펴고 ㅡㄹㅑㅑ(덤2)
       캴        펴고 ㅏㅕㅠㅡ 전부 틀림   · 안 펴고 ㅋ0.70 ㅑ0.80 ㄹ0.64 셋 다
       n2        양쪽 같음
     펴면 금속 레일이 늘어나 가짜 ㅡ 가 서너 개 생기고, 세로 원근이 덜 풀려 4x5칸짜리가
     4.1x4.6칸으로 남는다. 펴기의 명분이던 「칸이 같아야 붙은 자모를 자른다」도,
     캴은 **붙어 있는데 안 펴고 셋 다 읽혔다**.
     🔴 칸은 여전히 legoRectify 가 준다 — 안 펴도 위·아래 주기는 재고, 작은 쪽을 쓴다.
     ⚠ 근거가 네 장뿐이다. 붙은 조각이 많은 판에서 자르기가 나빠지면 1 로 되돌리고
        legoWarpOk 검사에 맡길 것. */
  legoRectifyOn: 0,
  legoPlateHull: 1,              // 1 = 초록 판 가장 큰 덩어리의 볼록껍질 안만 전경으로 본다
  legoPlateMin: 0.15,            // 그 덩어리가 화면의 이 비율은 돼야 판으로 믿는다
  legoWarpMax: 1600,             // 펴진 그림의 긴 변 상한
  legoSizeLo: 0.50,              // 자모의 긴 변이 중앙값의 이 배 미만이면 가짜
  legoSizeHi: 1.80,              // 이 배를 넘어도 가짜 (가구 모서리 등)
  legoFarAway: 3.0,              // 글자 무리에서 이만큼(긴 변 배수) 떨어지면 딴 판의 블록
  recoEveryMs: 250,           // 분석 간격 — 미리보기는 이것과 무관하게 매 프레임 그린다
  detW: 1440,   // 🔴 핀을 보려면 이 정도는 필요하다 — 672px 에선 핀이 2~3px 이라 모양 조건을 통과 못 한다                  // 🔴 판을 찾는 해상도 — 인식용 336px 버퍼를 빌려 쓰던 게 떨림의 주범
  gridLo: 0.45, gridHi: 0.668, // 격자 바닥 밝기 밴드 (무늬 모드를 끄면 이걸 쓴다)
  useLines: true,             // 🔴 인식부 틀 = 긴 직선 네 개 (기본)
  line: 0.10,                 // 직선으로 칠 기울기 세기
  pinFill: 0.04,              // 사각형 안이 이만큼은 핀이어야 인식부로 본다
  cellTol: 0.25,              // 칸수가 21×15 에서 이 이상 벗어나면 인식부가 아니다
  usePins: false,             // 핀 구름에 사각형 맞추기 (예비)
  pin: 0.06,                  // 주변보다 이만큼 어두우면 구멍
  pinShrink: 0.90,            // 점을 부풀린 만큼 도로 당긴다
  useShape: true,             // 색이 아니라 윤곽으로 판을 찾는다
  rect: 0.55,                 // 사각형 채움률 — 이보다 낮으면 판이 아니다
  edge: 0.10,                 // 윤곽 문턱 (자동을 끄면 이 값)
  autoBoard: true,            // 경계를 화면에서 뽑는다 (Otsu)
  boardSat: 0.34,             // 🔴 실측 판 채도 0.20 — 0.18 이면 판을 통째로 버린다
  /* 🔴 점무늬 검출은 아직 기본이 아니다 — 렌더에서 재 보니 점무늬와 테두리 선이
        이어져 판 전체를 한 덩어리로 잡았고(정답 x 51~285 ↔ 마스크 0~308) 모서리
        오차 1.0 으로 낱말이 통째로 안 읽혔다. 「덩어리를 못 찾는 것」보다
        「엉뚱한 덩어리를 찾는 것」이 나쁘다. 실험용으로만 남긴다. */
  useTexture: false,
  tex: 0.10,                  // 국소 대비 문턱 — 핀이 만드는 잔 대비
  texLit: 0.30,               // 그늘진 배경의 잡티를 뺀다
  texFill: 3                  // 점 사이를 메우는 반경
};

var reco = { on:false, fbo:null, tex:null, W:0, H:0, buf:null,
             templates:null, result:null, ms:0 };

/** 레고형 자모 템플릿 — 조각 19개 x 회전 = 24 글자.
 *
 *  🔴 획을 그리지 않는다. 이 판은 **칸이 곧 형상**이라 조각의 칸 발자국을
 *     그대로 칠하면 그게 위에서 본 모양이다(사용자가 실물 보고 고친 값).
 *  🔴 단 ㅅㅈㅊㅎㅇ 다섯은 대각선·고리라 칸으로 표현이 안 된다 — 그 다섯만
 *     1mm 마스크를 받아 CELL 배율로 늘려 쓴다. ㅁ 과 ㅇ 은 칸 발자국이
 *     **똑같아서**, 이 다섯을 칸으로 처리하면 두 글자가 영영 안 갈린다.
 */
/* 🔴 지금 맞추는 덩어리의 갈래(자음/모음). 자르기 재귀가 matchLegoShape 를 수백 번
      부르는데 그 사이에 끼울 인자가 세 함수(splitLego/Scored/Blob)를 타고 내려가야 해서,
      **한 덩어리를 처리하는 동안만** 세워 두는 값으로 뒀다. 동기 호출 사슬이라 안전하다.
      (ponytail: 인자로 바꾸려면 세 함수 시그니처를 다 고쳐야 한다 — 그럴 값어치가 생기면 그때) */
var legoKindNow = null;

function buildLegoTemplates(){
  if (!legoData) return [];
  var SHAPED = { 'ㅅ':1, 'ㅈ':1, 'ㅊ':1, 'ㅎ':1, 'ㅇ':1 };
  var out = [];
  Object.keys(legoData.pieces).forEach(function(name){
    if (name.charAt(0) === '_') return;
    var p = legoData.pieces[name];
    var mask0 = SHAPED[name] ? legoFromMask(name, p) : legoFromCells(p);
    if (!mask0) return;
    Object.keys(p.rots).forEach(function(rotKey){
      var rot = +rotKey, ch = p.rots[rotKey];
      /* 갈래(자음/모음)는 조각 데이터가 이미 들고 있다 — 형판에 그대로 얹는다 */
      var m = legoRotate(mask0, rot);
      var x0 = m.w, y0 = m.h, x1 = -1, y1 = -1, n = 0;
      for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++){
        if (!m.a[y*m.w + x]) continue;
        n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (!n) return;
      out.push({ kind:p.kind, ch:ch, base:name, rot:rot,
                 blockW:Math.round(m.w/CELL), blockH:Math.round(m.h/CELL),
                 mask:m.a, mw:m.w,
                 bx:x0, by:y0, sw:x1-x0+1, sh:y1-y0+1, area:n,
                 vowel:isVowel(ch) });
    });
  });
  return out;
}

/** 칸 발자국('####' 문자열)을 CELL 배율 마스크로. */
function legoFromCells(p){
  var W = p.w * CELL, H = p.h * CELL, a = new Uint8Array(W*H);
  for (var cy = 0; cy < p.h; cy++){
    var row = p.rows[cy];
    for (var cx = 0; cx < p.w; cx++){
      if (row.charAt(cx) !== '#') continue;
      for (var y = cy*CELL; y < (cy+1)*CELL; y++)
        for (var x = cx*CELL; x < (cx+1)*CELL; x++) a[y*W + x] = 1;
    }
  }
  return { a:a, w:W, h:H };
}

/** 1mm 마스크(base64, 비트 1개 = 1화소, LSB 먼저)를 CELL 배율로 늘린다. */
function legoFromMask(name, p){
  var rec = legoData.masks[p.kind] && legoData.masks[p.kind][name];
  if (!rec) return legoFromCells(p);
  var bin = atob(rec.b64), mw = rec.w, mh = rec.h;
  var W = p.w * CELL, H = p.h * CELL, a = new Uint8Array(W*H);
  for (var y = 0; y < H; y++){
    var sy = (y * mh / H) | 0;
    for (var x = 0; x < W; x++){
      var sx = (x * mw / W) | 0, k = sy*mw + sx;
      if ((bin.charCodeAt(k >> 3) >> (k & 7)) & 1) a[y*W + x] = 1;
    }
  }
  return { a:a, w:W, h:H };
}

/** 0/90/180/270 회전 — 3D 에서 블록을 놓을 때와 같은 방향. */
function legoRotate(m, rot){
  rot = ((rot % 360) + 360) % 360;
  if (rot === 0) return m;
  var W = m.w, H = m.h;
  var nw = (rot === 180) ? W : H, nh = (rot === 180) ? H : W;
  var a = new Uint8Array(nw*nh);
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++){
    if (!m.a[y*W + x]) continue;
    var nx, ny;
    if (rot === 90){ nx = H-1-y; ny = x; }
    else if (rot === 180){ nx = W-1-x; ny = H-1-y; }
    else { nx = y; ny = W-1-x; }
    a[ny*nw + nx] = 1;
  }
  return { a:a, w:nw, h:nh };
}

/* 🔴 판을 찾는 일과 판을 읽는 일은 필요한 해상도가 다르다.
      「펴진 판」 버퍼는 격자 한 칸 = 16px 로 잡은 336×224 인데, 판 검출까지
      그걸 빌려 쓰면 1920×1080 화면을 1/28 넓이로 줄여 놓고 테두리를 찾는 셈이다
      (판 가로 130px · 핀 간격 6px · 테두리는 두어 픽셀짜리 선). 그 위에서 네 변을
      회귀하면 프레임마다 흔들리는 게 당연하다. 검출은 따로, 크게 본다. */
var detBuf = { fbo:null, tex:null, W:0, H:0, buf:null };

/** 레고형 판을 **편다** — 위·아래 두 곳의 돌기 간격만으로.
 *
 *  🔴 판을 찾지 않는다. 돌기를 세지도 않는다. 필요한 건 「간격이 y 를 따라 얼마나
 *     줄어드는가」 하나뿐이고, 그건 띠 두 개의 자기상관으로 나온다.
 *     실측(거치대 프레임): 위 38px · 아래 28px → 펴고 나면 어디서나 24px.
 *  🔴 상관은 **배음에서 더 높이 솟는다** — 최고점을 쓰면 주기의 두세 배를 집는다
 *     (실측 국소최고 38·76·115 인데 최고는 76). 가장 작은 국소최고를 쓰고,
 *     그래도 두 값의 비가 1.4 를 넘으면 배수로 보고 반씩 나눈다.
 *  🔴 편 뒤에야 **칸 경계**가 생긴다 — 붙어 있는 자모를 자를 자리가 그것이다.
 *     펴기 전에는 스냅할 격자가 없어서 아무 데나 잘랐고 전부 엉뚱했다.
 */
function legoBandPitch(gray, W, H, y0, y1){
  var prof = new Float64Array(W), rows = 0, x, y;
  for (y = Math.max(0, y0); y < Math.min(H, y1); y++){
    rows++;
    for (x = 0; x < W; x++) prof[x] += gray[y*W + x];
  }
  if (rows < 4) return 0;
  for (x = 0; x < W; x++) prof[x] /= rows;
  var R = Math.max(8, Math.round(W*0.05)), hp = new Float64Array(W);
  for (x = 0; x < W; x++){
    var s = 0, n = 0;
    for (var d = -R; d <= R; d++){ var xx = x+d; if (xx >= 0 && xx < W){ s += prof[xx]; n++; } }
    hp[x] = prof[x] - s/n;
  }
  var lo = 8, hi = Math.min(Math.round(W*0.15), W-R*2-40), corr = [];
  for (var lag = lo; lag <= hi; lag++){
    var sum = 0, m = 0;
    for (x = R; x < W-R-lag; x++){ sum += hp[x]*hp[x+lag]; m++; }
    corr.push(m ? sum/m : 0);
  }
  if (!corr.length) return 0;
  var mx = 0;
  for (var i = 0; i < corr.length; i++) if (corr[i] > mx) mx = corr[i];
  if (mx <= 0) return 0;
  for (i = 1; i < corr.length-1; i++)
    if (corr[i] > corr[i-1] && corr[i] >= corr[i+1] && corr[i] >= mx*TUNE.periodPeak)
      return lo + i;
  var bi = 0;
  for (i = 0; i < corr.length; i++) if (corr[i] === mx) bi = i;
  return lo + bi;
}

/** 화면을 위에서 아래로 띠 열둘로 훑어 돌기 주기의 **중앙값**을 돌려준다(못 재면 0).
 *
 *  🔴 고정 띠 둘(28~36% · 60~68%)로 재던 것을 버렸다. 블록이 띠에 걸리면 그 띠의
 *     주기가 lag 하한(8)으로 무너지고, 배음 접기가 멀쩡한 쪽까지 그리로 끌어내려
 *     칸이 6 이 됐다 — 그러면 `legoMaxBlob`(20칸=120px) 가 글자를 전부 버려
 *     「후보 0」이 된다. 실측(2026-09-07 폰 프레임, 판이 화면 아래 70% 까지 차서
 *     아래 띠에 ㅈ·ㅁ 이 앉음): 위 48 / 아래 8 → 칸 6 → 아무것도 못 읽음.
 *     같은 원리로 예전 프레임 둘도 아래 띠가 8 이었는데 `min` 이 위 띠를 골라 운으로 살았다.
 *  🔴 배음은 중앙값 기준으로 접는다(1.4배 넘으면 반). 블록이 놓인 띠는 2배 주기가
 *     흔히 나오는데, 그게 곧 아래쪽 진짜 주기의 두 배라 접으면 맞아 들어간다.
 *  🔴 하한은 **폭 비율**(W×0.015)이다. 픽셀 절대값을 두면 카메라·검출 버퍼가 바뀔 때
 *     조용히 어긋난다. 검출 버퍼 긴 변 1440 에서 12px — 판이 화면 폭에 60칸 넘게
 *     들어올 일은 없으므로 그보다 작은 주기는 잡음이다.
 *  검증(7프레임): 옛 방식 8·28·38·8·34·34·6 → 훑기 42·58·39·42·49·49·53. */
function legoCellSweep(gd, W, H, y0, y1){
  var floor = W * 0.015, ps = [], i, p;
  /* 🔴 띠는 **판 안**에서만 센다(y0~y1 = 초록 판 덩어리의 세로 범위, 2026-09-09).
        판이 화면 아래 반만 차지한 프레임에서 바닥·의자 띠가 15~20px 짜리 그럴듯한
        주기를 내어 직선을 오염시켰고(칸 15), 그 칸으로 3칸짜리 H 가 8칸으로 보여
        세로로도 잘려 아무 형판에도 못 앉았다(「배」→후보 0). 판 밖 띠는 8 이하로
        떨어질 때만 걸러졌던 것이라 운에 기대고 있었다. */
  if (y0 == null){ y0 = 0; y1 = H; }
  for (i = 0; i < 12; i++){
    var ya = Math.round(H * i * 0.08), yb = Math.round(H * (i + 1) * 0.08);
    if ((ya + yb) / 2 < y0 || (ya + yb) / 2 > y1) continue;
    p = legoBandPitch(gd, W, H, ya, yb);
    if (p >= floor) ps.push(p);
  }
  if (!ps.length) return null;
  var ys = [];
  ps.sort(function(a, b){ return a - b; });
  /* 🔴 배음은 **정수배**다 — 블록이 앉은 띠는 기본 주기 봉우리가 죽고 2배·3배가 산다
        (11:49 프레임: 판 위 41~45 · 블록 띠 78·76·72(2배) · 101·96·105(3배)). 「중앙값의
        1.4배 넘으면 반」으로는 3배가 반만 접혀 직선이 끌려갔다(H 자리 칸 47, 실제 34).
        1차: 작은 쪽 사분위(p25)를 기준으로 정수배로 나눈다. 2차: 그 직선을 기준으로 다시. */
  var ref = ps[ps.length >> 2] || ps[0], raw = [], fd = [];
  for (i = 0; i < 12; i++){
    var ya = Math.round(H * i * 0.08), yb = Math.round(H * (i + 1) * 0.08);
    if ((ya + yb) / 2 < y0 || (ya + yb) / 2 > y1) continue;
    p = legoBandPitch(gd, W, H, ya, yb);
    if (p < floor) continue;
    raw.push(p); ys.push(H * (i + 0.5) * 0.08);
    fd.push(p / Math.max(1, Math.round(p / ref)));
  }
  if (!fd.length) return null;
  /* 🔴 칸은 숫자 하나가 아니라 **y 의 직선**이다. 원근 때문에 한 판 안에서도 아래 30 →
        위 53 으로 벌어지는데(실측 7프레임), 관문(legoMinLong 3.6칸·legoMaxBlob 20칸)과
        자르기(5칸)는 ±15% 만 어긋나도 글자를 통째로 버린다 — 「가」 프레임이 34~38 에서만
        읽히고 화면 중앙값 49 에서는 하나도 못 읽었다. 덩어리마다 제 y 의 칸을 쓴다.
        직선은 Theil–Sen(짝별 기울기 중앙값)으로 — 점이 12개뿐이고 이상점이 섞인다. */
  function fit(v){
    var n = v.length, slopes = [], ic = [], i2, j;
    for (i2 = 0; i2 < n; i2++) for (j = i2 + 1; j < n; j++)
      if (ys[j] !== ys[i2]) slopes.push((v[j] - v[i2]) / (ys[j] - ys[i2]));
    slopes.sort(function(p2, q){ return p2 - q; });
    var b2 = slopes.length ? slopes[slopes.length >> 1] : 0;
    for (i2 = 0; i2 < n; i2++) ic.push(v[i2] - b2 * ys[i2]);
    ic.sort(function(p2, q){ return p2 - q; });
    return { a: ic[ic.length >> 1], b: b2 };
  }
  /* 배음을 화면 중앙값으로 접으면 판 아래쪽(작은 칸)의 2배 주기가 안 접힌다 —
     직선을 한 번 맞춘 뒤 그 직선 기준으로 다시 접고 다시 맞춘다. */
  var L1 = fit(fd);
  for (i = 0; i < fd.length; i++){
    var ex1 = Math.max(floor, L1.a + L1.b * ys[i]);
    fd[i] = raw[i] / Math.max(1, Math.round(raw[i] / ex1));
  }
  /* 🔴 커널 칸(lo)은 **직선에 붙어 있는 띠들 중** 최솟값이다(2026-09-09). 날 최솟값은 띠 하나가
        헛짚으면 그대로 따라간다 — 11:32 프레임에서 판 안 띠 하나가 15 를 내어 커널이 7·3px 로
        쪼그라들었고, 마스크가 거칠어져 H 의 ㅓ 가 0.49 로 떨어져 아무것도 못 읽었다.
        ⚠ 그렇다고 직선의 낮은 끝을 쓰면 커널이 커져 **세 장이 퇴행**(려→펴·두폽→두·츙배→츙) —
        작은 커널이 안전하다는 사실은 그대로다. 직선에서 30% 넘게 벗어난 띠만 빼고 최솟값. */
  var L2 = fit(fd), a = L2.a, b = L2.b, lo = 1e9;
  for (i = 0; i < fd.length; i++){
    var ex = a + b * ys[i];
    if (Math.abs(fd[i] - ex) <= ex * 0.3 && fd[i] < lo) lo = fd[i];
  }
  if (lo === 1e9) lo = Math.max(floor, Math.min(a + b * y0, a + b * y1));
  return { a:a, b:b, lo:lo, mid:a + b * H / 2, at:function(y){ return Math.max(floor, a + b * y); } };
}

/** ■ 초록 판 = chroma 의 **낮은 쪽** 가장 큰 덩어리. 그 볼록껍질을 채운 마스크를
    돌려준다(못 찾으면 null = 안 자른다).
    🔴 **획 블록과 스티커가 같은 함수를 쓴다** — 두 벌로 두면 갈라진다.
    thrA > 0 이면 그 문턱을 쓰고(이미 Otsu 를 돌린 호출부), 아니면 여기서 Otsu.
    🔴 못 찾으면 **예전처럼 전부 볼 것** — 판 검출 실패가 인식 실패가 되면 안 된다. */
function legoPlateHullMask(M, chroma, thrA, W, H, N){
  var plate = M(new cv.Mat());
  if (thrA > 0) cv.threshold(chroma, plate, thrA, 255, cv.THRESH_BINARY_INV);
  else cv.threshold(chroma, plate, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
  var pl = M(new cv.Mat()), pst = M(new cv.Mat()), pce = M(new cv.Mat());
  var pn = cv.connectedComponentsWithStats(plate, pl, pst, pce, 8, cv.CV_32S);
  var bi = 0, bA = 0, pi;
  for (pi = 1; pi < pn; pi++){ var pa = pst.intAt(pi, 4); if (pa > bA){ bA = pa; bi = pi; } }
  reco.legoPlate = bi ? +(bA / N).toFixed(2) : 0;
  if (!bi || bA < N * TUNE.legoPlateMin) return null;
  var pld = pl.data32S, pmd = plate.data;
  for (pi = 0; pi < N; pi++) pmd[pi] = pld[pi] === bi ? 255 : 0;
  var cts = M(new cv.MatVector()), hier = M(new cv.Mat());
  cv.findContours(plate, cts, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  var hull = M(new cv.Mat());
  cv.convexHull(cts.get(0), hull, false, true);
  var hv = M(new cv.MatVector()); hv.push_back(hull);
  plate.setTo(new cv.Scalar(0));
  cv.fillPoly(plate, hv, new cv.Scalar(255));
  return plate;
}

/** 펴진 RGBA Mat 을 돌려준다(없으면 null). 부르는 쪽이 delete 한다. */
function legoRectify(){
  var W = detBuf.W, H = detBuf.H, mats = [];
  function M(m){ mats.push(m); return m; }
  function done(){ mats.forEach(function(m){ try { m.delete(); } catch(e){} }); }
  try {
    var raw = M(cv.matFromArray(H, W, cv.CV_8UC4, detBuf.buf));
    var gray = M(new cv.Mat()); cv.cvtColor(raw, gray, cv.COLOR_RGBA2GRAY);
    var gd = gray.data;
    /* 🔴 펴기가 꺼져 있으면 여기서 끝난다 — 필요한 건 칸 하나뿐이고, 그건 띠 훑기가 준다.
          (아래 두 띠 측정과 호모그래피는 펼 때만 쓴다.) */
    if (!TUNE.legoRectifyOn){
      /* 판의 세로 범위 — a* Otsu 의 초록 쪽 가장 큰 덩어리(껍질과 같은 정의). */
      var py0 = null, py1 = null;
      if (TUNE.legoPlateHull && TUNE.legoChroma === 'a'){
        var rgbP = M(new cv.Mat()); cv.cvtColor(raw, rgbP, cv.COLOR_RGBA2RGB);
        var labP = M(new cv.Mat()); cv.cvtColor(rgbP, labP, cv.COLOR_RGB2Lab);
        var chP = M(new cv.MatVector()); cv.split(labP, chP);
        var aP = M(chP.get(1)), plP = M(new cv.Mat());
        cv.threshold(aP, plP, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
        var lbP = M(new cv.Mat()), stP = M(new cv.Mat()), ceP = M(new cv.Mat());
        var nP = cv.connectedComponentsWithStats(plP, lbP, stP, ceP, 8, cv.CV_32S);
        var biP = 0, baP = 0;
        for (var ip = 1; ip < nP; ip++){ var ar2 = stP.intAt(ip, 4); if (ar2 > baP){ baP = ar2; biP = ip; } }
        if (biP && baP >= W * H * TUNE.legoPlateMin){ py0 = stP.intAt(biP, 1); py1 = py0 + stP.intAt(biP, 3); }
      }
      var cs = legoCellSweep(gd, W, H, py0, py1);
      reco.legoPlateY = py0 == null ? null : [py0, py1];
      reco.legoWarp = cs ? { 칸:[+cs.lo.toFixed(1), +cs.mid.toFixed(1)], 폄:'끔' } : { why:'간격 못 잼' };
      done();
      return cs ? { mat: null, cell: cs.mid, line: cs } : null;
    }
    var yA = Math.round(H*0.32), yB = Math.round(H*0.64);
    var pA = legoBandPitch(gd, W, H, Math.round(H*0.28), Math.round(H*0.36));
    var pB = legoBandPitch(gd, W, H, Math.round(H*0.60), Math.round(H*0.68));
    if (!pA || !pB){ reco.legoWarp = { why:'간격 못 잼' }; done(); return null; }
    for (var t = 0; t < 3; t++){
      if (pB > pA*1.4) pB = Math.round(pB/2);
      else if (pA > pB*1.4) pA = Math.round(pA/2);
      else break;
    }
    if (pA < 6 || pB < 6){ reco.legoWarp = { why:'간격 이상 ' + pA + '/' + pB }; done(); return null; }
    var N = W / pA;
    var rows = Math.abs(pA - pB) > 1e-6
      ? (yB - yA) * Math.log(pA/pB) / (pA - pB)
      : (yB - yA) / pA;
    if (!(rows > 1)){ reco.legoWarp = { why:'줄수 이상' }; done(); return null; }
    var cx = W/2, DW = N*CELL, DH = rows*CELL;
    var src = M(cv.matFromArray(4, 1, cv.CV_32FC2, [
      cx - N*pA/2, yA,  cx + N*pA/2, yA,  cx + N*pB/2, yB,  cx - N*pB/2, yB]));
    var dst = M(cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, DW, 0, DW, DH, 0, DH]));
    var Hm = M(cv.getPerspectiveTransform(src, dst));
    /* 화면 네 귀퉁이가 다 들어가게 바깥 상자를 잡고, 너무 커지면 줄인다. */
    var cor = M(cv.matFromArray(4, 1, cv.CV_32FC2, [0,0, W,0, W,H, 0,H]));
    var out4 = M(new cv.Mat());
    cv.perspectiveTransform(cor, out4, Hm);
    var f = out4.data32F;
    var x0 = Math.min(f[0], f[2], f[4], f[6]), x1 = Math.max(f[0], f[2], f[4], f[6]);
    var y0 = Math.min(f[1], f[3], f[5], f[7]), y1 = Math.max(f[1], f[3], f[5], f[7]);
    var k = Math.min(1, TUNE.legoWarpMax / Math.max(x1-x0, y1-y0));
    var A = M(cv.matFromArray(3, 3, cv.CV_64F, [k, 0, -x0*k, 0, k, -y0*k, 0, 0, 1]));
    var full = M(new cv.Mat()); cv.gemm(A, Hm, 1, new cv.Mat(), 0, full);
    var ow = Math.round((x1-x0)*k), oh = Math.round((y1-y0)*k);
    if (ow < 40 || oh < 40){ reco.legoWarp = { why:'결과 너무 작음' }; done(); return null; }
    var rect = new cv.Mat();
    cv.warpPerspective(raw, rect, full, new cv.Size(ow, oh),
                       cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0,0,0,255));
    /* 🔴 **폈는지 같은 자로 다시 잰다.** 이 함수의 일이 「위아래 돌기 간격을 같게
          만들기」이므로, 편 그림에서 두 띠를 다시 재서 같아졌나 보면 된다.
          `폄:1` 은 「예외가 안 났다」는 뜻일 뿐 잘 폈다는 뜻이 아니었다 —
          실측: 잘 읽힌 프레임 1.08·1.09 / 틀린 프레임 1.25·1.32 로 깨끗이 갈린다.
          어긋나면 편 그림을 버리고 **안 편 그림 + 작은 쪽 주기**로 읽는다.
          실측(캴): 편 그림 「ㅏㅕㅠㅡ」 · 안 편 그림 칸 34 에서 「ㅋ0.70 ㅑ0.80 ㄹ0.64」.
       🔴 좌우 폭·판 실루엣으로 검사하지 말 것 — 거치대에서 좌우는 잘릴 때가 있고
          위아래만 늘 다 보인다. 그래서 재는 것도 위아래 두 띠뿐이다. */
    var g2 = M(new cv.Mat()); cv.cvtColor(rect, g2, cv.COLOR_RGBA2GRAY);
    var g2d = g2.data;
    var qA = legoBandPitch(g2d, ow, oh, Math.round(oh*0.28), Math.round(oh*0.36));
    var qB = legoBandPitch(g2d, ow, oh, Math.round(oh*0.60), Math.round(oh*0.68));
    var okWarp = false;
    if (qA && qB){
      for (var f = 0; f < 3; f++){          // 배음은 접고 본다
        if (qB > qA*1.4) qB = Math.round(qB/2);
        else if (qA > qB*1.4) qA = Math.round(qA/2);
        else break;
      }
      okWarp = Math.max(qA, qB) / Math.max(Math.min(qA, qB), 1) <= TUNE.legoWarpOk;
    }
    reco.legoWarp = { 위:pA, 아래:pB, 칸:+(CELL*k).toFixed(1), 크기:[ow, oh],
                      편뒤:[qA, qB], 폄확인:okWarp };
    if (!okWarp){
      try { rect.delete(); } catch(e2){}
      done();
      return { mat: null, cell: Math.min(pA, pB) };
    }
    done();
    return { mat: rect, cell: CELL*k };
  } catch (e){
    done();
    reco.legoWarp = { why:(e && (e.message||e)) };
    if (window.console) console.warn('legoRectify', e);
    return null;
  }
}

/** 레고형 판 — **모핑 없이** 바로 읽는다.
 *
 *  🔴 판을 안 찾고, 격자도 안 세우고, 화면을 펴지도 않는다. 필요한 건 자모의
 *     **모양**과 **상대 위치** 둘뿐이기 때문이다. 판을 찾으려던 길에서 하루를
 *     썼는데(실루엣·네 변·24x24 창), 그 중 어느 것도 답에 필요하지 않았다.
 *  🔴 가짜(가구 모서리·옆 판에 붙은 블록)는 **칸 크기의 다수결**로 걸러진다 —
 *     진짜 자모는 저희끼리 같은 칸 크기를 말하고 가짜는 엉뚱한 크기를 말한다.
 *     실측(거치대 프레임): 자모 넷이 29.8~33.2px/칸으로 모이고, 가구 모서리는
 *     93.1px(+193%) · 옆 판의 블록은 21.9px(-31%) 이라 그대로 떨어졌다.
 *  🔴 detBuf 를 **먼저 바로 세운다** — readPixels 라 아래가 0 이다.
 */
function recognizeLegoDirect(){
  if (!cvReady || !detBuf.buf) return null;
  var t0 = performance.now();
  var mats = [];
  function M(m){ mats.push(m); return m; }
  try {
    /* 🔴 **먼저 편다.** 펴야 칸이 어디서나 같아지고, 그래야 붙은 자모를 칸 경계에서
          자를 수 있다. 못 펴면 편 적 없는 그림으로 그냥 읽는다(예전 동작). */
    var rc = legoRectify();
    /* rc.mat 이 null 이면 펴기가 검사에 걸린 것 — 안 편 그림으로 읽되 칸은 받아 쓴다 */
    var raw = (rc && rc.mat) ? M(rc.mat)
                             : M(cv.matFromArray(detBuf.H, detBuf.W, cv.CV_8UC4, detBuf.buf));
    var W = raw.cols, H = raw.rows, N = W*H;
    reco.legoCell = rc ? rc.cell : 0;   // 못 편 경우에도 칸은 온다
    var cellLine = rc && rc.line;        // y 마다 다른 칸(안 편 그림). 편 그림은 어디서나 같다.
    function cellAt(y){ return cellLine ? cellLine.at(y) : (reco.legoCell || CELL); }
    /* 🔴 detBuf 는 readPixels 라 **아래가 0** 이다. 그대로 두면 덩어리가 세로로
          거울이 되어 자모가 통째로 틀린다(실측: ㅏ 가 ㅓ 로, ㄱ 이 ㄷ 으로).
          여기서 한 번 바로 세우고, 그 뒤로는 사진과 같은 좌표로 다룬다. */
    var src = M(new cv.Mat());
    if (TUNE.legoFlip === 9) raw.copyTo(src); else cv.flip(raw, src, TUNE.legoFlip);
    /* 편 그림도 원본과 같은 방향이므로 뒤집기는 그대로 적용된다(지금은 9=안 함). */
    var rgb = M(new cv.Mat()); cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    var hsv = M(new cv.Mat()); cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
    var ch3 = M(new cv.MatVector()); cv.split(hsv, ch3);
    var sat = M(ch3.get(1)), val = M(ch3.get(2));
    var vd = val.data;                       // 옆벽 떼기에 쓴다
    var sd = sat.data;                       // 자음/모음 가르기에 쓴다
    /* 🔴 전경을 가르는 자는 **채도가 아니라 Lab 의 b\*(파랑–노랑 축)**다.
          조명이 강하게 닿은 조각은 **과다 노출로 색이 날아가** 채도가 판 수준까지
          떨어진다 — 실측: 날아간 ㄱ 의 채도가 회색 판과 같아서 Otsu 가 통째로 버렸고,
          그 ㄱ 이 실오라기만 남아 ㅠ 로 읽혔다.
          그래도 **누런 기는 남는다**: 판은 파르스름하고(B≥R) 날아간 노랑은 R>B 다.
          b* 는 정확히 그 축을 재므로 쨍한 노랑과 날아간 노랑을 **함께** 잡는다.
          (a* 나 색상 H 는 못 쓴다 — 흰빛에 가까워지면 각이 불안정하다.) */
    var chroma = sat, preThresholded = false;
    var labM = null, ch4 = null, labL = null, labB = null;
    if (TUNE.legoChroma !== 'sat'){
      labM = M(new cv.Mat()); cv.cvtColor(rgb, labM, cv.COLOR_RGB2Lab);
      ch4 = M(new cv.MatVector()); cv.split(labM, ch4);
      if (TUNE.legoChroma === 'a'){
        /* 🔴 a* — 128 이 무채색. 초록 판은 **아래로**(실측 85), 노랑·흰 블록은
              둘 다 가운데 근처(125~139). Otsu 가 그 빈 곳에 떨어진다.
              b* 와 달리 **블록 색을 안 가린다** — 초록이 아니기만 하면 된다. */
        chroma = M(ch4.get(1));
        /* 스티커 카드는 **흰 종이**로 가른다 — L·b 도 여기서 받아 둔다(split 은 이미 돌았다) */
        labL = M(ch4.get(0)); labB = M(ch4.get(2));
      } else if (TUNE.legoChroma === 'lab'){
        chroma = M(ch4.get(2));              // b* — 128 이 무채색. **노랑 전용**
      } else {
        /* 🔴 b* 하나만 보면 **노랑에서만** 듣는다 — 파란 블록은 b* 가 판보다 **낮아서**
              Otsu 가 통째로 배경으로 보낸다. 색을 안 가리려면 회색축이 아니라
              **판 자신의 색에서 얼마나 먼가**를 재야 한다.
           🔴 기준을 「무채색(128,128)」으로 두면 안 된다 — 이 판은 **약간 파랗다**.
              그러면 판 자신이 이미 색을 좀 가진 셈이라 파란 블록과의 거리가 줄어든다.
              판 색은 화면의 다수결로 얻는다(중앙값) — 판이 늘 화면의 대부분이다. */
        var aM = M(ch4.get(1)), bM = M(ch4.get(2));
        var ad = aM.data, bd2 = bM.data, NP = ad.length;
        var ha = new Int32Array(256), hb = new Int32Array(256), q;
        for (q = 0; q < NP; q++){ ha[ad[q]]++; hb[bd2[q]]++; }
        function med(h){ var half = NP >> 1, acc = 0;
          for (var v = 0; v < 256; v++){ acc += h[v]; if (acc >= half) return v; } return 128; }
        var a0 = med(ha), b0 = med(hb);
        var dist = M(new cv.Mat(rgb.rows, rgb.cols, cv.CV_8UC1));
        var dd = dist.data;
        for (q = 0; q < NP; q++){
          var da = ad[q] - a0, db = bd2[q] - b0;
          if (da < 0) da = -da; if (db < 0) db = -db;
          var v2 = da + db; dd[q] = v2 > 255 ? 255 : v2;
        }
        /* 🔴 여기서 Otsu 를 쓰면 안 된다 — Otsu 는 **두 무리**로 가르는데 화면엔
              판·글자·마루·책상이 있고, 빛에 날아간 글자는 **판 쪽에 붙어 있다**.
              실측(가굥): 판 무리 중앙값 4·MAD 3 · 날아간 노랑 ~16 · 쨍한 노랑 ~70 인데
              Otsu 가 33 을 잡아 날아간 글자를 통째로 배경으로 보냈다(9/9 → 7/9).
              대신 **판 자신의 산포 배수**로 자른다 — 절대값이 아니라 무차원 배수다. */
        var hdist = new Int32Array(512), q2;
        for (q2 = 0; q2 < NP; q2++) hdist[dd[q2] > 511 ? 511 : dd[q2]]++;
        function pct(h, frac){ var need = NP*frac, acc2 = 0;
          for (var v = 0; v < 512; v++){ acc2 += h[v]; if (acc2 >= need) return v; } return 511; }
        var dmed = pct(hdist, 0.5);
        var habs = new Int32Array(512);
        for (q2 = 0; q2 < NP; q2++){ var e = dd[q2] - dmed; habs[Math.min(511, e < 0 ? -e : e)]++; }
        var mad = Math.max(1, pct(habs, 0.5));
        var cut = dmed + TUNE.legoPlateMad*mad;
        for (q2 = 0; q2 < NP; q2++) dd[q2] = dd[q2] >= cut ? 255 : 0;
        reco.legoPlateAb = [a0, b0, dmed, mad, cut];
        chroma = dist;
        preThresholded = true;
      }
    }
    /* 🔴 **모드 선택 화면은 없다.** 카드가 보이면 카드 경로, 아니면 예전(획 블록) 경로다.
          판정은 공짜로 난다 — 카드는 채움 ≈1.0 의 네모고 자모 획은 0.4~0.6 이다.
          여기서(= a* Otsu·판 껍질·형태소 **앞**) 갈라지는 이유: 스티커 판에서 그 단계들은
          일을 잘못한다. 주황 몸통끼리 닿아 카드 열여덟 장이 한 덩어리(1115x707)가 되고,
          그걸 splitLego 가 자르느라 폰 한 프레임이 600ms 를 넘었다(실측 639·578ms). */
    if (TUNE.stickerOn && labL && labB && stickerTpl && stickerTpl.length){
      var sres = readSticker(M, labL, chroma, labB, W, H, N, t0);
      if (sres){ mats.forEach(function(m2){ try { m2.delete(); } catch(e3){} }); return sres; }
    }
    var bin = M(new cv.Mat()), thrA = 0;
    if (preThresholded) chroma.copyTo(bin);
    else thrA = cv.threshold(chroma, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    /* 어두운 데서는 채도가 못 믿을 값이 된다 — 밝기 바닥 하나. */
    var lit = M(new cv.Mat());
    cv.threshold(val, lit, TUNE.legoVMin, 255, cv.THRESH_BINARY);
    cv.bitwise_and(bin, lit, bin);
    /* 🔴 **판 밖은 애초에 안 본다** (2026-09-08). a* 는 「초록이 아니면 전경」이라 판 아래
          나무 탁자·손·컵이 통째로 전경이 된다. 판 끝에 놓인 ㄴ·ㅂ 이 탁자 덩어리에 삼켜져
          버려지고(「둔풉」이 「두포」), 탁자 조각이 형판에 걸려 칸 평균이 158 로 튀어 낱말이
          비었으며, 그 덩어리를 자르느라 폰 한 프레임이 393~699ms 였다.
          예전 「판을 찾지 않는다」는 판이 화면을 다 채우던 구도의 결론이고, 거치대에선
          판 아래 탁자가 늘 보인다. 여기서 찾는 건 판 사각형이 아니다 — **초록 쪽 가장 큰
          덩어리의 볼록껍질** 하나. 껍질이라 판 끝에 앉은 조각(초록에 파인 홈)도 안에 든다.
          판 덩어리가 화면의 legoPlateMin 비율에 못 미치면 안 건드린다(예전 동작). */
    if (TUNE.legoPlateHull && !preThresholded){
      var plate = legoPlateHullMask(M, chroma, thrA, W, H, N);
      if (plate) cv.bitwise_and(bin, plate, bin);
    }
    /* 🔴 **닫기를 열기보다 먼저.** 블록 윗면에 광택 줄이 얹히면 그 자리 채도가
          판 수준(17~32)까지 무너져 획이 세로로 갈린다 — 실측 「가규」의 둘째 ㄱ 이
          세로획을 잃고 막대가 되어 한 칸짜리 ㅡ 형판에 자리를 뺏겼다.
          칸의 0.2배 커널로 먼저 메우면 획이 이어진다. 순서를 뒤집으면 열기가
          이미 끊어 놓은 뒤라 메울 게 남지 않는다. */
    /* 커널은 **가장 작은 칸**으로 — 작은 커널은 글자를 안 뭉치지만 큰 커널은 옆 조각까지
       메운다(실측: 「가」가 커널 칸 49 에서 사라지고 34 에서 읽힘). */
    var cellNow0 = (cellLine ? cellLine.lo : 0) || reco.legoCell || CELL;
    /* 🔴 **옆벽을 먼저 뗀다** — 채도만 보면 블록 옆면까지 전경이라 ㄷ 의 입이 메워진다. */
    if (TUNE.legoWallCut) legoCutWalls(bin, val, cellNow0);
    /* 🔴 커널 모양이 곧 속도다 — 타원은 O(N·k²) 라 이 크기에서 160ms 를 쓴다.
          사각은 분리 가능해서 OpenCV 가 두 번의 1차원 훑기로 끝낸다. */
    var ckr = Math.max(3, (Math.round(cellNow0*TUNE.legoShadowFill) | 1));
    var kc = M(cv.getStructuringElement(TUNE.legoCloseRect ? cv.MORPH_RECT : cv.MORPH_ELLIPSE,
                                        new cv.Size(ckr, ckr)));
    if (TUNE.legoShadowFill > 0) cv.morphologyEx(bin, bin, cv.MORPH_CLOSE, kc);
    /* 🔴 **절대 픽셀을 쓰지 않는다.** 여기만 5x5 로 박혀 있었다 — 폰마다 해상도가
          다르고 판까지의 거리도 달라서 칸이 12~51px 로 흔들리는데, 5px 는 칸 34 에서
          0.15칸이지만 칸 12 에서는 0.4칸이라 획을 갉는다. 나머지 관문은 이미 상대값이다
          (legoMinArea=화면 넓이 비율 · legoMaxBlob·legoMinLong=칸수 · legoShadowFill=칸 배수). */
    var okr = Math.max(3, (Math.round(cellNow0*TUNE.legoOpen) | 1));
    var k = M(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(okr, okr)));
    cv.morphologyEx(bin, bin, cv.MORPH_OPEN, k);
    var lab = M(new cv.Mat()), st = M(new cv.Mat()), cen = M(new cv.Mat());
    var n = cv.connectedComponentsWithStats(bin, lab, st, cen, 8, cv.CV_32S);
    var ld = lab.data32S, minA = N * TUNE.legoMinArea;
    var cand = [];
    for (var i = 1; i < n; i++){
      var bx = st.intAt(i, 0), by = st.intAt(i, 1);
      var bw = st.intAt(i, 2), bh = st.intAt(i, 3), ba = st.intAt(i, 4);
      if (ba < minA) continue;
      /* 🔴 자르기에 넣기 전에 **말도 안 되게 큰 덩어리는 뺀다.** 가구 모서리가
            38칸짜리로 들어와 조각조각 잘리면서 가짜 후보를 여럿 만들어 냈고,
            그게 칸 크기 무리를 흔들어 멀쩡한 글자를 밀어냈다 — 실측 「간교」가
            그렇게 ㄱㅏㄱㅛㄴ(정확)에서 ㄱㅏㅜㅗㅛ 로 뒤집혔다.
            한 음절은 길어야 10칸이고 두 음절이 붙어도 그 두 배다. */
      var cellPre = cellAt(by + bh / 2);
      if (Math.max(bw, bh) > cellPre * TUNE.legoMaxBlob) continue;
      var blob = new Uint8Array(bw*bh), vs = [], ss = [];
      for (var y = 0; y < bh; y++)
        for (var x = 0; x < bw; x++)
          if (ld[(by+y)*W + bx+x] === i){
            blob[y*bw + x] = 1;
            vs.push(vd[(by+y)*W + bx+x]);
            ss.push(sd[(by+y)*W + bx+x]);
          }
      var cellNow = cellPre;
      /* 🔴 채도 중앙값으로 갈래를 정하고, **이 덩어리를 처리하는 동안만** 세워 둔다. */
      if (TUNE.legoVowelSat > 0 && ss.length){
        ss.sort(function(a2, b2){ return a2 - b2; });
        legoKindNow = ss[ss.length >> 1] > TUNE.legoVowelSat ? '자음' : '모음';
      } else legoKindNow = null;
      var parts = splitLego(blob, bw, bh, cellNow, 0);
      legoKindNow = null;
      parts.forEach(function(p){
        if (!p.m || p.m.iou < TUNE.legoMinIou) return;
        var ch = p.m.T.ch, iou = p.m.iou;
        /* 🔴 예전엔 여기서 「ㅁ/ㅇ 인데 한 변이 열려 있으면 ㄷ」이라는 손 규칙을 걸었다.
              **지웠다.** 그건 형판이 못 가르는 게 아니라 **마스크가 틀린** 것을 덧댄
              것이었다 — 옆벽이 ㄷ 의 입을 메워 덩어리가 통째로 사각형이 됐고, 그래서
              ㄷ 이 6위 밖으로 밀렸다(ㅇ 0.641 · ㅁ 0.625 · ㄷ 0.570). `legoCutWalls` 로
              옆벽을 떼고 나니 켜나 끄나 결과가 **여섯 장 모두 같다**.
           🔴 교훈: 짝마다 손 규칙을 붙이기 전에 **덩어리 그림부터 볼 것.**
              마스크가 틀렸으면 어떤 자로 재도 틀린 답이 나온다. */
        var qx0 = p.w, qy0 = p.h, qx1 = -1, qy1 = -1, yy, xx;
        for (yy = 0; yy < p.h; yy++) for (xx = 0; xx < p.w; xx++) if (p.blob[yy*p.w+xx]){
          if (xx < qx0) qx0 = xx; if (xx > qx1) qx1 = xx;
          if (yy < qy0) qy0 = yy; if (yy > qy1) qy1 = yy;
        }
        if (qx1 < qx0) return;
        var T = p.m.T;
        cand.push({ x:bx + p.dx + qx0, y:by + p.dy + qy0,
                    w:qx1-qx0+1, h:qy1-qy0+1, iou:iou,
                    T:(ch === T.ch) ? T : legoTemplateFor(ch) || T,
                    cell:((qx1-qx0+1)/Math.max(T.sw/CELL, 0.5) +
                          (qy1-qy0+1)/Math.max(T.sh/CELL, 0.5)) / 2 });
      });
    }
    mats.forEach(function(m2){ try { m2.delete(); } catch(e){} });
    if (!cand.length){ reco.legoInfo = { 후보:0 }; reco.ms = performance.now()-t0; return null; }

    /* 🔴 **칸 크기로 거르지 않는다.** 원근 때문에 같은 판 안에서도 칸이 37~48px 로
          벌어지고(가까운 쪽이 크다), 멀리 놓인 진짜 글자가 이상점이 되어 버려졌다 —
          「가굗」의 받침 ㄷ 이 그렇게 사라져 「가교」로 읽혔다.
          가짜를 가르는 건 칸 크기가 아니라 **덩치**다: 자모는 저희끼리 비슷하고
          가구 모서리는 몇 배 길다(실측 긴 변 561px vs 자모 120px).
          그리고 **자리** — 옆 판에 붙은 블록은 글자 무리에서 한참 떨어져 있다. */
    var L = cand.map(function(c){ return Math.max(c.w, c.h); }).sort(function(p, q){ return p - q; });
    var medL = L[L.length >> 1] || 1;
    var keep = cand.filter(function(c){
      var lg = Math.max(c.w, c.h);
      return lg >= medL*TUNE.legoSizeLo && lg <= medL*TUNE.legoSizeHi;
    });
    if (keep.length > 1){
      var cys = keep.map(function(c){ return c.y + c.h/2; }).sort(function(p, q){ return p - q; });
      var mcy = cys[cys.length >> 1];
      keep = keep.filter(function(c){ return Math.abs(c.y + c.h/2 - mcy) <= medL*TUNE.legoFarAway; });
    }
    /* 칸 크기는 이제 거르는 데 안 쓰고 **격자 좌표를 내는 데만** 쓴다. */
    var med = keep.length
      ? keep.reduce(function(s, c){ return s + c.cell; }, 0) / keep.length
      : medL / 3;
    /* 편 그림 좌표라 원본 화면에 못 겹친다 — 편 경우엔 상자를 안 그린다. */
    /* 🔴 `rc` 는 펴기를 꺼도 온다(칸만 실어서) — `rc.mat` 이 있을 때만 편 좌표다.
          `rc ?` 로 두면 상자가 영영 안 그려진다(2026-09-10 실측, 폰 인식 사각형이 안 보이던 이유). */
    reco.boxes = (rc && rc.mat) ? [] : cand.map(function(c){
      var ok = keep.indexOf(c) >= 0;
      return { x:c.x, y:H - c.y - c.h, w:c.w, h:c.h, ch: ok ? c.T.ch : '', color:0 };
    });
    var items = keep.map(function(c){
      return { ch:c.T.ch, x:c.x/med, y:c.y/med,
               w:c.T.blockW, h:c.T.blockH };
    });
    var word = parseFree(items).join('');
    reco.legoInfo = { 폄:(rc && rc.mat) ? 1 : 0, 칸:+med.toFixed(1), 후보:cand.length,
                      자모:keep.length, 버린것:cand.length - keep.length };
    reco.ms = performance.now() - t0;
    return { word:word, items:items, comps:cand.length,
             detail: cand.map(function(c){
               return { ch: keep.indexOf(c) >= 0 ? c.T.ch : '?', iou:+c.iou.toFixed(2),
                        x:c.x, 칸:+c.cell.toFixed(1) };
             }) };
  } catch (e){
    mats.forEach(function(m2){ try { m2.delete(); } catch(e2){} });
    reco.legoInfo = { 예외:(e && (e.message||e)) };
    if (window.console) console.warn('recognizeLegoDirect', e);
    return null;
  }
}

/** 노란 덩어리에서 **옆벽을 뗀다** — 블록이 8mm 높이라 위에서 봐도 옆면이 같이 찍힌다.
 *
 *  🔴 옆면도 노란색이라 채도로는 절대 안 걸린다. 갈라 주는 건 **명도**다 —
 *     실측 「가굗」의 받침 ㄷ: 윗면 V 144~203 · 옆벽 V 71~136. 그 옆벽이 입을
 *     아래에서 먹어, 입이 3칸이어야 하는데 1칸으로 잡혔고 ㄷ 이 12위로 밀렸다.
 *  🔴 문턱을 상수로 박으면 안 된다(조명이 프레임마다 다르다). 전역 Otsu 도 못 쓴다 —
 *     그 프레임의 노란 화소 17만 중 13만이 가구 띠라 히스토그램을 가구가 지배한다.
 *     **덩어리마다** 따로 가른다.
 *  ⚠ Otsu 의 무차원 분리도 η 로 「가를 만한 덩어리인가」를 가리려 했으나 쓸 수 없다 —
 *     실측 글자 0.74~0.77 · 가구 0.77 로 구분이 안 된다. 그래서 대신 **밝은 쪽이
 *     얼마나 남는지**로 가린다: 너무 조금 남으면 두 무리가 아니라 그늘진 덩어리
 *     하나를 억지로 쪼갠 것이다.
 */
function legoCutWalls(bin, val, cell){
  var lab = new cv.Mat(), st = new cv.Mat(), cen = new cv.Mat();
  var n = cv.connectedComponentsWithStats(bin, lab, st, cen, 8, cv.CV_32S);
  if (n >= 2){
    var ld = lab.data32S, vd = val.data, bd = bin.data, N = ld.length;
    /* 라벨별 히스토그램 — 한 번 훑어 다 모은다(성분마다 다시 훑으면 O(성분×화소)). */
    var hist = new Int32Array(n * 256);
    for (var p = 0; p < N; p++){ var L = ld[p]; if (L) hist[L*256 + vd[p]]++; }
    var thr = new Int32Array(n); thr.fill(-1);
    for (var L2 = 1; L2 < n; L2++){
      var base = L2*256, tot = 0, sum = 0, t;
      for (t = 0; t < 256; t++){ tot += hist[base+t]; sum += t*hist[base+t]; }
      if (tot < cell*cell) continue;                  // 한 칸도 안 되는 건 볼 것 없다
      /* 🔴 **블록일 수 없는 덩어리는 건드리지 않는다.** a* 로 축을 바꾸면서 마루·책상이
            전부 전경이 됐는데, 그 한 덩어리를 여기서 V Otsu 로 쪼개 놓으면 legoMaxBlob 에
            걸려 죽던 것이 조각조각 크기 게이트를 통과한다(실측 덩어리 4개 -> 7개).
            b* 시절엔 판 밖 세상이 애초에 전경이 아니라 안 드러나던 문제다. */
      if (Math.max(st.intAt(L2, 2), st.intAt(L2, 3)) > cell*TUNE.legoMaxBlob) continue;
      var sB = 0, wB = 0, best = -1, cut = 0, keep = 0;
      for (t = 0; t < 256; t++){
        wB += hist[base+t]; if (!wB) continue;
        var wF = tot - wB; if (!wF) break;
        sB += t*hist[base+t];
        var mB = sB/wB, mF = (sum - sB)/wF, v = (wB/tot)*(wF/tot)*(mB-mF)*(mB-mF);
        if (v > best){ best = v; cut = t; keep = wF/tot; }
      }
      if (keep >= 0.25) thr[L2] = cut;
    }
    for (var p2 = 0; p2 < N; p2++){
      var L3 = ld[p2]; if (!L3) continue;
      if (thr[L3] >= 0 && vd[p2] < thr[L3]) bd[p2] = 0;
    }
  }
  lab.delete(); st.delete(); cen.delete();
}

/** 조각의 긴 변(칸). 🔴 **형판의 긴 변은 전부 정확히 5칸**이다(전수 확인) —
 *  그보다 짧은 조각이 나오는 칼질은 조각을 만든 게 아니라 글자를 부순 것이다. */
function legoLongCells(blob, w, h, cell){
  var x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (blob[y*w+x]){
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < x0) return 0;
  return Math.max(x1-x0+1, y1-y0+1) / cell;
}

function legoSub(blob, w, h, x0, y0, w2, h2){
  var a = new Uint8Array(w2*h2);
  for (var y = 0; y < h2; y++)
    for (var x = 0; x < w2; x++) a[y*w2+x] = blob[(y0+y)*w + x0+x];
  return a;
}

/** 뭉친 덩어리를 자른다 — 지금 판의 trySplit 과 같은 생각(가장 얇은 목).
 *
 *  🔴 자를 축은 **끝까지 잘라 본 뒤**의 최악 조각으로 고른다. 한 번 자른 결과만 보면
 *     근시안이다 — 세 조각이 붙으면 첫 칼질 직후엔 어느 쪽도 온전한 글자가 아니라서
 *     정작 옳은 칼질이 더 나빠 보인다(실측 「각」).
 *  🔴 자리도 한 곳만 보지 않는다. 골짜기 몇 곳 + **끝에서 5칸** 되는 자리를 다 재 본다
 *     (조각의 긴 변이 언제나 5칸이므로 그게 유력한 칼자리다).
 */
function splitLego(blob, w, h, cell, depth){
  var res = splitLegoScored(blob, w, h, cell, depth || 0);
  return res.parts;
}

function splitLegoScored(blob, w, h, cell, depth){
  var own = matchLegoShape(blob, w, h);
  var ownIou = own ? own.iou : 0;
  var slack = cell*0.9, maxSide = 5*cell;
  /* 🔴 ㅐ·ㅔ·ㅒ·ㅖ 는 조각이 없다 — 세로모음 옆에 ㅣ 를 **붙여** 만든다(2026-09-09).
        붙으면 폭 3칸짜리 H 한 덩어리가 되는데, 자르기가 「5칸 넘는 것만」이라 시도조차
        안 하고 가장 닮은 ㅂ 0.57 로 읽었다(사용자 프레임 「배」). 형판을 통째로 견주는
        한 어떤 자로도 H 와 ㅂ 은 가깝다(아래 한 줄만 다르다) — 그래서 H 형판을 만드는
        길은 버렸다: ㅐ_대 가 ㅂ 과 한 행 차이라 멀쩡한 ㅂ·ㅕ 를 뒤집었다(16장 중 5장 퇴행).
        답은 **자르기**다 — 어느 형판과도 안 닮은(legoSplitOk 미만) 덩어리는 2칸 넘으면
        가로로 잘라 본다. 잘린 ㅓ+ㅣ 는 각자 제 형판에 0.8 로 앉고 PLUS_I 가 ㅔ 로 합친다.
        잘 닮은 덩어리(ㅂ 0.73~0.86)는 여기 안 들어오므로 비용도 안 는다. */
  var narrow = ownIou < TUNE.legoSplitOk, hOpen = false;
  /* 🔴 ㅂ 과 H(붙은 ㅣ+ㅓ / ㅏ+ㅣ = ㅐ) 는 **밑줄 한 줄** 차이다 — ㅂ 잉크 14칸 중 12칸이
        H 와 겹쳐 완벽한 H 도 ㅂ 형판에 0.86 이다. 통째로 견주는 어떤 자로도 못 가른다
        (ㄹ/ㅌ·ㅁ/ㅇ 과 같은 병). 도면에서 다른 곳은 아래 한 줄뿐이니 **그 줄만 잰다**:
        아래 20% 띠, 두 기둥 사이(폭 30~70%)의 채움. 실측 H 여섯 장 0.15~0.31 · 진짜 ㅂ 아홉 장
        0.77~0.92. 밑줄이 비었으면 ㅂ 이 아니라 두 조각이다 → 자르기로 보내고, 통짜 점수(가짜
        ㅂ)는 견줄 자에서 뺀다(2026-09-09, 12:09 프레임 ㅂ 0.69 로 「잘 닮은」 쪽에 들어가 안 갈렸다). */
  if (own && own.T.ch === 'ㅂ' && w <= maxSide + slack){
    var bn = 0, bk = 0, bx0 = Math.floor(w * 0.3), bx1 = Math.ceil(w * 0.7);
    for (var by2 = Math.floor(h * 0.8); by2 < h; by2++)
      for (var bx2 = bx0; bx2 < bx1; bx2++){ bn++; if (blob[by2*w + bx2]) bk++; }
    if (bn && bk / bn < TUNE.legoBotBar){ narrow = true; hOpen = true; }
  }
  var tall = h > maxSide + slack, wide = w > (narrow ? 2*cell : maxSide) + slack;
  var self = { parts:[{ blob:blob, w:w, h:h, dx:0, dy:0, m:own }], score:ownIou };
  if ((!tall && !wide) || depth >= TUNE.legoSplitDepth) return self;
  var best = null, ax, i;
  for (ax = 0; ax < 2; ax++){
    var vert = (ax === 0);
    if (vert && !tall) continue;
    if (!vert && !wide) continue;
    var L = vert ? h : w;
    var prof = new Float64Array(L);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++)
      if (blob[y*w+x]) prof[vert ? y : x]++;
    var lo = (L*0.25)|0, hi = (L*0.75)|0;
    if (hi <= lo) continue;
    /* 🔴 **진짜 목만 후보로 삼는다.** 평평한 데까지 다 재면 가지가 폭발한다 —
          한 프레임 1.7초가 그것이었다(깊이 3 x 축 2 x 골짜기 5). */
    var mean = 0;
    for (i = 0; i < L; i++) mean += prof[i];
    mean /= L || 1;
    var vals = [];
    for (i = lo+1; i < hi; i++)
      if (prof[i] <= prof[i-1] && prof[i] <= prof[i+1] && prof[i] < mean*TUNE.legoNeck)
        vals.push([prof[i], i]);
    vals.sort(function(p, q){ return p[0] - q[0]; });
    var cuts = vals.slice(0, TUNE.legoMaxCuts).map(function(v){ return v[1]; });
    var gk = lo, gv = 1e18;
    for (i = lo; i <= hi; i++) if (prof[i] < gv){ gv = prof[i]; gk = i; }
    if (cuts.indexOf(gk) < 0) cuts.push(gk);
    [Math.round(maxSide), L - Math.round(maxSide)].forEach(function(e){
      if (e > lo && e < hi && cuts.indexOf(e) < 0) cuts.push(e);
    });
    for (var ci = 0; ci < cuts.length; ci++){
      var k = cuts[ci];
      var aw = vert ? w : k, ah = vert ? k : h;
      var bw2 = vert ? w : w-k, bh2 = vert ? h-k : h;
      if (aw < 2 || ah < 2 || bw2 < 2 || bh2 < 2) continue;
      var A = legoSub(blob, w, h, 0, 0, aw, ah);
      var B = vert ? legoSub(blob, w, h, 0, k, bw2, bh2) : legoSub(blob, w, h, k, 0, bw2, bh2);
      if (Math.min(legoLongCells(A, aw, ah, cell), legoLongCells(B, bw2, bh2, cell)) < TUNE.legoMinLong)
        continue;
      var ra = splitLegoScored(A, aw, ah, cell, depth+1);
      var rb = splitLegoScored(B, bw2, bh2, cell, depth+1);
      var sc = Math.min(ra.score, rb.score);
      if (!best || sc > best.score){
        var ox = vert ? 0 : k, oy = vert ? k : 0;
        var parts = ra.parts.concat(rb.parts.map(function(p){
          return { blob:p.blob, w:p.w, h:p.h, dx:p.dx+ox, dy:p.dy+oy, m:p.m };
        }));
        best = { parts:parts, score:sc };
      }
    }
  }
  /* 🔴 통짜가 어느 형판과도 안 닮았으면(narrow) 통짜 점수는 견줄 자가 못 된다(2026-09-09).
        붙은 ㅣ+ㅓ 가 ㅂ 0.57 로 앉고 갈라진 ㅓ 가 0.56 — 한 끗 차이로 자르기가 거부돼 「배」가
        ㅂ 이 됐다. 그렇다고 통짜를 아예 무시하면 캴(붙은 셋)이 엉뚱하게 갈라졌다(가→∅).
        제 형판이 없는 덩어리는 조각이 통짜에서 legoSplitSlack 안이면 두 조각으로 본다. */
  var bar = hOpen ? TUNE.legoMinIou
          : narrow ? Math.max(TUNE.legoMinIou, ownIou - TUNE.legoSplitSlack)
                   : Math.max(ownIou, TUNE.legoMinIou);
  var res = (!best || best.score <= bar) ? self : best;
  /* 🔴 자르기로도 안 풀린 큰 덩어리(붙은 셋)는 모서리 벗기기로 한 번 더 (2026-09-09). */
  /* 조각 하나(5칸)보다 확실히 큰 덩어리만 — H(3×5) 같은 두 조각짜리는 자르기가 맡는다.
     벗기기를 거기까지 물리면 ㅡ 토막을 벗겨 내며 H 를 망친다(실측 3장 퇴행). */
  if (depth === 0 && TUNE.legoPeelOn && res.score < TUNE.legoSplitOk && Math.max(w, h) > 5.5 * cell){
    var pl = peelLego(blob, w, h, cell, 0);
    /* 🔴 자르기와 벗기기를 견주는 자도 **설명한 잉크 비율**이다 — 조각 최소 점수로 견주면 벗기기가
          ㅂ 옆 얇은 띠 하나(ㅏ 0.44)에 통째로 거부된다. 못 앉은 조각은 부르는 쪽이 어차피 버린다. */
    if (pl){
      var tot = 0, q3;
      for (q3 = 0; q3 < w*h; q3++) if (blob[q3]) tot++;
      if (pl.explained > legoExplained(res.parts, tot) && pl.explained > TUNE.legoMinIou) return pl;
    }
  }
  return res;
}

/** 붙은 덩어리를 **모서리에서 형판을 대어 벗겨** 읽는다 (2026-09-09).
 *
 *  🔴 투영 자르기는 **옆으로 붙은 기둥**을 못 본다 — 캴(ㅋ+ㅑ+ㄹ)은 ㅋ 의 오른쪽 기둥과 ㅑ 의
 *     기둥이 한 두께로 이어져 열 합에 골짜기가 없고, 열두 조합 전부 「ㅡ ㅓ ㅏ」 같은 헛조각만
 *     냈다. 골짜기가 없어도 **모서리는 있다**: 잉크의 왼쪽 위 모서리는 어느 한 조각의 것이다.
 *     거기에 33개 형판을 제 잉크 상자 크기(칸×cell)로 대어 가장 닮은 것을 떼어 내고, 남은
 *     잉크를 성분으로 나눠 같은 일을 되풀이한다. 성분이 5칸 남짓이면 통짜/자르기로 돌린다.
 *  🔴 벗겨낸 자리는 **상자 통째로** 지운다 — 형판 잉크만 지우면 마스크 잔여(돌기 그림자)가
 *     남아 다음 조각에 붙는다. 옆 조각은 상자 밖에서 시작하므로 통째로 지워도 안 다친다.
 *  결과는 splitLego 와 같은 parts 꼴. 부르는 쪽이 자르기 결과와 점수로 견줘 고른다. */
function legoInkBox(blob, w, h){
  var x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (blob[y*w+x]){
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < x0 ? null : { x0:x0, y0:y0, x1:x1, y1:y1 };
}

function legoComponents(blob, w, h){
  var seen = new Uint8Array(w*h), out = [], stack = [];
  for (var s0 = 0; s0 < w*h; s0++){
    if (!blob[s0] || seen[s0]) continue;
    var px = [], k;
    stack.push(s0); seen[s0] = 1;
    while (stack.length){
      k = stack.pop(); px.push(k);
      var kx = k % w, ky = (k / w) | 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++){
        var nx = kx + dx, ny = ky + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        var n = ny*w + nx;
        if (blob[n] && !seen[n]){ seen[n] = 1; stack.push(n); }
      }
    }
    out.push(px);
  }
  return out;
}

/** 조각 목록이 덩어리 잉크를 얼마나 설명하나 — Σ(IoU × 조각 잉크) / 덩어리 잉크. 못 앉은 조각은 0. */
function legoExplained(parts, totalInk){
  var sum = 0;
  for (var i = 0; i < parts.length; i++){
    var pp = parts[i];
    if (!pp.m || pp.m.iou < TUNE.legoMinIou) continue;
    var ink = 0;
    for (var q = 0; q < pp.w * pp.h; q++) if (pp.blob[q]) ink++;
    sum += pp.m.iou * ink;
  }
  return sum / Math.max(1, totalInk);
}

function peelLego(blob, w, h, cell, depth){
  if (depth >= TUNE.legoPeelDepth) return null;
  var tpls = legoTemplates || (legoData ? buildLegoTemplates() : null);
  if (!tpls || !tpls.length) return null;
  var box = legoInkBox(blob, w, h);
  if (!box) return null;
  var half = Math.max(2, Math.round(cell * 0.5));
  /* 모서리 후보 = **네 귀퉁이**(각 [x, y, 오른쪽귀?, 아래귀?]) + 왼쪽 위의 정밀 후보 둘(왼 기둥
     꼭대기 · 윗막대 왼끝). 🔴 왼쪽 위만 쓰면 세로로 붙은 짝(ㅜ 줄기 아래 ㄱ 윗막대)에서 ㅜ 상자
     안에 ㄱ 막대가 들어와 0.54 로 떨어진다 — 아래 귀퉁이에서 ㄱ 을 먼저 떼면 ㅜ 는 혼자 남는다. */
  var anchors = TUNE.legoPeelCorners ? [[box.x0, box.y0, 0, 0], [box.x1, box.y0, 1, 0], [box.x0, box.y1, 0, 1], [box.x1, box.y1, 1, 1]] : [[box.x0, box.y0, 0, 0]], yy, xx;
  for (yy = box.y0; yy <= box.y1; yy++){ var hit = false;
    for (xx = box.x0; xx < Math.min(w, box.x0 + half); xx++) if (blob[yy*w+xx]){ hit = true; break; }
    if (hit){ anchors.push([box.x0, yy, 0, 0]); break; } }
  for (xx = box.x0; xx <= box.x1; xx++){ var hit2 = false;
    for (yy = box.y0; yy < Math.min(h, box.y0 + half); yy++) if (blob[yy*w+xx]){ hit2 = true; break; }
    if (hit2){ anchors.push([xx, box.y0, 0, 0]); break; } }
  /* 🔴 고르는 자는 IoU 가 아니라 **설명한 잉크**(IoU × 형판 칸수)다 — 모서리에 ㅡ(5칸)를
        대면 ㅋ 의 윗막대 한 토막에 0.89 로 완벽히 앉는다. 그러면 ㅋ 이 조각조각 난다.
        큰 형판이 그런대로(≥ legoPeelIou) 맞으면 그쪽이 답이다.
     🔴 배율은 셋을 시도한다(0.85·1·1.15). 붙은 덩어리는 위아래로 7~8칸이라 원근으로
        끝과 끝의 칸이 15% 다르고, 마스크가 깎여 조각이 제 칸보다 작다(실측 ㅋ: 37.6 에서
        0.54, 33 에서 0.65). */
  /* 🔴 배율 1.3 까지 — 덩어리 위쪽 조각의 칸이 덩어리 중심 칸보다 20% 넘게 클 수 있다
        (10:39 프레임: 중심 36 · ㅂ 자리 44. 1.15 까지만 대면 ㅂ 상자가 33px 모자라 오른쪽 띠가
        남고 그 띠가 ㅏ 0.44 로 점수를 깎아 벗기기가 통째로 거부됐다). */
  var cands = [], seenKey = {}, scales = [0.85, 1, 1.15, 1.3];
  for (var t = 0; t < tpls.length; t++){
    var T = tpls[t];
    for (var si = 0; si < scales.length; si++){
      var sc = cell * scales[si];
      var bw = Math.round(T.sw / CELL * sc), bh = Math.round(T.sh / CELL * sc);
      if (bw < 2 || bh < 2) continue;
      for (var ai = 0; ai < anchors.length; ai++){
        var ax = anchors[ai][2] ? anchors[ai][0] - bw + 1 : anchors[ai][0];
        var ay = anchors[ai][3] ? anchors[ai][1] - bh + 1 : anchors[ai][1];
        if (ax < 0) ax = 0; if (ay < 0) ay = 0;
        var key = T.ch + ':' + T.base + ':' + si + ':' + ax + ':' + ay;
        if (seenKey[key]) continue; seenKey[key] = 1;
        var cw = Math.min(bw, w - ax), chh = Math.min(bh, h - ay);
        if (cw < bw * 0.6 || chh < bh * 0.6) continue;
        var sub = legoSub(blob, w, h, ax, ay, cw, chh);
        var m = matchLegoShape(sub, cw, chh, T.ch);
        if (!m || m.iou < TUNE.legoPeelIou) continue;
        /* 🔴 상자 안 잉크를 형판이 설명 못 하면(정밀도) 그 상자는 남의 조각까지 덮은 것이다 —
              ㅁ 상자가 ㄹ 을 덮으면 가운데 막대가 남고(캴→캼), 큰 배율 ㅂ 이 아래 ㅜ 를 삼킨다.
              (부분집합 형판은 이 자로 못 잡는다 — 그건 matchLegoShape 의 상위집합 규칙이 맡는다.) */
        if (TUNE.legoPeelPrec && m.prec < TUNE.legoPeelPrec) continue;
        cands.push({ T:m.T, iou:m.iou, gain:m.iou * (T.area / (CELL * CELL)), ax:ax, ay:ay, bw:cw, bh:chh, sub:sub, m:m });
      }
    }
  }
  if (!cands.length) return null;
  cands.sort(function(p2, q){ return q.gain - p2.gain; });
  /* 🔴 맨 위 후보 하나로 결정하지 않는다 — 설명한 잉크가 비슷한 후보(ㅜ·ㅗ·ㅛ 가 한 막대를 두고
        0.54~0.56)는 **벗긴 뒤 남는 것**으로 갈린다. 깊이 0 에서만 **형판이 서로 다른** 상위 셋을
        끝까지 벗겨 보고(같은 ㅂ 의 배율 셋을 고르면 헛수고) 고른다.
     🔴 고르는 자 = **설명한 잉크 비율**(Σ 조각 IoU × 조각 잉크 / 덩어리 잉크, 부스러기·실패는 0).
        조각 최소 점수로 고르면 ①큰 배율 ㅂ 이 아래 ㅜ 를 통째로 삼킨 뒤 0.64 로 「혼자」 남는 길과
        ②부분집합 형판(ㄴ⊂ㄷ)이 얇아진 윗막대를 부스러기로 버리고 0.85 로 이기는 길이 열린다.
        둘 다 남긴 잉크가 설명되지 않은 채라 이 자로는 진다(실측 10:39 ㅂ+ㅜ · 13:13 ㄷㅏㅂ). */
  var totalInk = 0;
  for (var q0 = 0; q0 < w*h; q0++) if (blob[q0]) totalInk++;
  var picks = [], seenCh = {};
  for (var ci0 = 0; ci0 < cands.length && picks.length < (depth === 0 ? TUNE.legoPeelTry : 1); ci0++){
    if (seenCh[cands[ci0].T.ch]) continue;
    seenCh[cands[ci0].T.ch] = 1; picks.push(cands[ci0]);
  }
  var bestRes = null;
  for (var ti = 0; ti < picks.length; ti++){
    var r0 = peelWith(picks[ti]);
    if (r0 && (!bestRes || r0.explained > bestRes.explained)) bestRes = r0;
  }
  if (bestRes) bestRes.explained /= Math.max(1, totalInk);
  return bestRes;
  function peelWith(best){
  /* 벗겨내고 남은 잉크 */
  var rest = new Uint8Array(blob), pieceInk = 0;
  for (yy = best.ay; yy < best.ay + best.bh; yy++)
    for (xx = best.ax; xx < best.ax + best.bw; xx++){ if (rest[yy*w + xx]) pieceInk++; rest[yy*w + xx] = 0; }
  var parts = [{ blob:best.sub, w:best.bw, h:best.bh, dx:best.ax, dy:best.ay, m:best.m }];
  var score = best.iou, explained = best.iou * pieceInk;
  var comps = legoComponents(rest, w, h), minPx = cell * cell * 1.5;
  for (var ci = 0; ci < comps.length; ci++){
    var px = comps[ci];
    if (px.length < minPx) continue;                   // 부스러기(반 칸 남짓)는 버린다
    var cb = new Uint8Array(w*h);
    for (var q = 0; q < px.length; q++) cb[px[q]] = 1;
    var ib = legoInkBox(cb, w, h);
    var cw2 = ib.x1 - ib.x0 + 1, ch2 = ib.y1 - ib.y0 + 1;
    var sub2 = legoSub(cb, w, h, ib.x0, ib.y0, cw2, ch2);
    var r = null;
    if (Math.max(cw2, ch2) > 5.5 * cell) r = peelLego(sub2, cw2, ch2, cell, depth + 1);
    if (!r) r = splitLegoScored(sub2, cw2, ch2, cell, 1);
    /* 🔴 벗긴 상자 옆에 남은 얇은 띠(마스크가 형판보다 굵어서)는 조각이 아니라 부스러기다 —
          어느 형판에도 안 앉고(< legoMinIou) 잉크가 벗긴 조각의 30% 미만이면 점수에서 뺀다. */
    if (r.score < TUNE.legoMinIou && px.length < pieceInk * 0.3) continue;
    for (var pi = 0; pi < r.parts.length; pi++){
      var pp = r.parts[pi];
      parts.push({ blob:pp.blob, w:pp.w, h:pp.h, dx:pp.dx + ib.x0, dy:pp.dy + ib.y0, m:pp.m });
      if (pp.m && pp.m.iou >= TUNE.legoMinIou){
        var ink2 = 0;
        for (var q2 = 0; q2 < pp.w * pp.h; q2++) if (pp.blob[q2]) ink2++;
        explained += pp.m.iou * ink2;
      }
    }
    if (r.score < score) score = r.score;
  }
  return { parts:parts, score:score, explained:explained };
  }
}

/** 덩어리 하나를 레고 형판 전부와 견줘 가장 닮은 것. 형판을 덩어리 상자에 맞춰 늘린다. */
function legoTemplateFor(ch){
  var tpls = legoTemplates || (legoData ? buildLegoTemplates() : null);
  if (!tpls) return null;
  for (var i = 0; i < tpls.length; i++) if (tpls[i].ch === ch) return tpls[i];
  return null;
}

function matchLegoShape(blob, bw, bh, onlyCh){
  var tpls = legoTemplates || (legoData ? buildLegoTemplates() : null);
  if (!tpls || !tpls.length) return null;
  var G = TUNE.legoMatchGrid, W32 = (G*G + 31) >> 5;
  /* 🔴 형판은 **한 번만** GxG 비트셋으로 구워 둔다. 자르기 재귀가 한 프레임에
        수백 번 맞춰 보는데, 그때마다 덩어리 크기대로 훑으면 7.2초가 나온다.
        같은 격자에 맞춰 놓으면 비교가 낱말 몇 개 AND/OR 로 끝난다. */
  if (!tpls._bits || tpls._bitsG !== G){
    tpls.forEach(function(T){
      var b2 = new Uint32Array(W32), n = 0;
      for (var y = 0; y < G; y++){
        var sy = T.by + (((y + 0.5) * T.sh / G) | 0);
        for (var x = 0; x < G; x++){
          var sx = T.bx + (((x + 0.5) * T.sw / G) | 0);
          if (T.mask[sy*T.mw + sx]){ var k = y*G + x; b2[k >> 5] |= (1 << (k & 31)); n++; }
        }
      }
      T.bits = b2; T.bitsN = n;
    });
    tpls._bits = true; tpls._bitsG = G;
  }
  var bb = new Uint32Array(W32), bn = 0;
  for (var y2 = 0; y2 < G; y2++){
    var by2 = ((y2 + 0.5) * bh / G) | 0;
    for (var x2 = 0; x2 < G; x2++){
      var bx2 = ((x2 + 0.5) * bw / G) | 0;
      if (blob[by2*bw + bx2]){ var k2 = y2*G + x2; bb[k2 >> 5] |= (1 << (k2 & 31)); bn++; }
    }
  }
  if (!bn) return null;
  function pop(v){
    v = v - ((v >> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    return (((v + (v >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
  }
  var best = null, second = null, probe = (window.__PROBE ? [] : null);
  var scored = matchLegoShape._buf || (matchLegoShape._buf = []), ns = 0;
  for (var t = 0; t < tpls.length; t++){
    var T = tpls[t];
    if (onlyCh && T.ch !== onlyCh) continue;
    /* 🔴 갈래가 정해졌으면 그 갈래 형판만 본다 — 후보가 반으로 준다.
          자모 19종 중 자음 14 · 모음 5 라, 모음일 때 특히 크게 준다. */
    if (legoKindNow && T.kind && T.kind !== legoKindNow) continue;
    /* 가로세로 비가 크게 다르면 볼 것도 없다 — 원근으로 눌려도 이만큼은 안 변한다. */
    var ar = (bw/bh) / (T.sw/T.sh);
    if (ar < TUNE.legoArLo || ar > TUNE.legoArHi) continue;
    var inter = 0;
    for (var w = 0; w < W32; w++) inter += pop(bb[w] & T.bits[w]);
    var iou = inter / (bn + T.bitsN - inter);
    var nAll = G*G;
    var cov = inter - (bn*T.bitsN)/nAll;
    var va = bn - (bn*bn)/nAll, vb = T.bitsN - (T.bitsN*T.bitsN)/nAll;
    var den = Math.sqrt(va*vb);
    var corr = den > 1e-9 ? cov/den : 0;
    var pick = (TUNE.legoScore === 'iou') ? iou : corr;
    if (probe) probe.push({ ch:T.ch, key:T.key, iou:iou, corr:corr, ar:ar });
    scored[ns++] = { pick:pick, iou:iou, corr:corr, prec:inter / Math.max(1, bn), T:T };
    if (!best || pick > best.pick) best = scored[ns-1];
  }
  /* 진단용 — window.__PROBE 가 배열일 때만 순위표를 남긴다(평소엔 null 이라 공짜). */
  if (probe){ probe.sort(function(a,b){ return b.iou - a.iou; });
    window.__PROBE.push({ w:bw, h:bh, only:onlyCh || null, top:probe.slice(0, 6) }); }
  if (!best) return null;
  /* 🔴 맞수는 **다른 글자 중 최고**여야 한다. 그냥 2위를 보면 안 된다 — ㅁ·ㅇ 은
        회전이 넷이라 상위 넷이 전부 같은 글자로 채워지고, 그러면 맞수가 없다고
        판단해 동점 뒤집기가 통째로 건너뛰어진다. */
  for (var t2 = 0; t2 < ns; t2++){
    var e = scored[t2];
    if (e.T.ch === best.T.ch) continue;
    if (!second || e.pick > second.pick) second = e;
  }
  /* 🔴 **겹침이 주 지표, 상관은 동점일 때만.** 둘은 잘하는 데가 다르다 — 겹침은
        전체 모양에, 상관은 어긋난 획에 강하다. 상관을 주 지표로 삼으면 안 된다
        (지금 판에서는 ㅎ 이 ㅌ 을 이겼고, 이 판에서도 6장 중 3장 → 2장으로 나빠졌다).
        대신 겹침이 사실상 동전던지기인 짝은 상관이 깨끗하게 가른다 —
        실측 「간교」의 받침: 겹침 ㅗ 0.665 / ㄴ 0.654 인데 상관은 0.50 / 0.59.
     🔴 상관은 이미 센 숫자로 공짜다 — 이진 두 장이면 교집합과 각자 넓이만으로
        TM_CCOEFF_NORMED 와 **같은 값**이 닫힌 식으로 나온다.
     🔴 이 블록이 한 번 통째로 사라진 적이 있다(주 지표를 바꿔 보다가). 그때 손으로
        붙인 짝 규칙들이 그 자리를 대신 메우고 있었다 — 지우기 전에 A/B 로 잴 것. */
  if (second && best.pick - second.pick < TUNE.legoTieGap){
    var rel = (best.corr - second.corr) / (Math.abs(best.corr) + Math.abs(second.corr) + 1e-6);
    if (rel < -TUNE.legoTieMargin) best = second;
  }
  /* 🔴 **부분집합 형판은 깎인 마스크에서 언제나 이긴다** — ㄱ⊂ㅋ · ㄴ⊂ㄷ · ㄷ⊂ㅁ · ㅏ⊂ㅑ.
        상위집합과 다른 건 획 하나뿐인데 그 획이 마스크에서 얇아지면 겹침이 부분집합 쪽으로
        기운다(실측: 얇아진 ㄷ 자리에서 ㄴ 0.85 / ㄷ 0.62 · ㅋ 자리에서 ㄱ 이 앞섬 → 「답」→「납」,
        「캴」→「걀」). 정밀도로도 못 잡는다(얇아진 획은 상자 잉크에서도 얇다).
        규칙: 같은 칸 상자의 상위집합 형판 S(best⊂S, 잉크 90% 이상 포함)가 있고 **S 만의 획이
        덩어리에 legoSuperRecall 이상 보이면** S 다 — 있는 획을 없다고 할 수는 없다.
        여럿이면 가장 큰 S. (ㅗ/ㅛ 처럼 상자 크기가 다른 짝은 여기 안 든다.) */
  var sup = null;
  for (var t3 = 0; t3 < ns; t3++){
    var S = scored[t3].T;
    if (S === best.T || S.bitsN <= best.T.bitsN) continue;
    if (Math.abs(S.sw - best.T.sw) > CELL * 0.5 || Math.abs(S.sh - best.T.sh) > CELL * 0.5) continue;
    var inBoth = 0, extraN = 0, extraHit = 0;
    for (var w3 = 0; w3 < W32; w3++){
      inBoth += pop(best.T.bits[w3] & S.bits[w3]);
      var ex = S.bits[w3] & ~best.T.bits[w3];
      extraN += pop(ex); extraHit += pop(ex & bb[w3]);
    }
    if (inBoth < best.T.bitsN * 0.9 || !extraN) continue;
    if (!TUNE.legoSuperRecall || extraHit / extraN < TUNE.legoSuperRecall) continue;
    if (!sup || S.bitsN > sup.T.bitsN) sup = scored[t3];
  }
  if (sup) best = sup;
  best.iou = best.pick;
  best.tie = second ? second.T.ch : null;
  return best;
}

/* ═══════════════════════════════════════════════════════════════════════════
   🧾 스티커 블록 경로 (2026-09-16)

   인쇄한 카드를 붙인 3D 프린팅 블록(한글 4x4·2x4 · 알파벳 4x6). 획 블록 경로와 **다른 물건**이라
   같은 파이프라인의 뒷단을 쓸 수 없다:

   🔴 「덩어리 = 글자」가 아니라 「덩어리 = 액자, 글자는 액자 안 잉크」다. 그래서
      splitLego · peelLego · legoCutWalls · legoMinLong · 상위집합 규칙이 **전부 할 일이 없다**
      (카드는 물리적으로 안 붙는다 — 몸통 사이 0.4mm 인데 스티커는 사방 1.25mm 안쪽이라
       카드끼리 2.9mm = 0.36칸 떨어진다).

   🔴 **닫기 커널을 잉크에 쓰면 안 된다.** legoShadowFill 0.40칸 = 칸 38px 에서 3.16mm 인데,
      인쇄 글자 안쪽 최소 틈(하위10%)이 ㅅ 0.86 · ㅎ 1.27 · ㅊ 1.76 · ㅈ 2.02 · ㅌ 2.20 ·
      ㄹ 2.37 · ㅋ 3.13mm 다 — ㅂ(3.56) 빼고 **전부 메워져** 같은 네모가 된다.
      여기서 닫기는 카드 찾기에만 쓰고(잔구멍), 잉크는 손대지 않는다.

   🔴 정규화 기준은 **카드**다(잉크 bbox 아님). 잉크 bbox 로 40x40 을 채우면 ㅣ(2.75x20mm 막대)가
      까만 정사각형이 되어 ㅂ 0.750 · ㅌ 0.745 · ㄹ 0.737 · ㅁ 0.725 로 붙는다(실측) —
      ㅖ_대 ≡ ㅕ_소 와 같은 병이다. 카드가 액자를 주므로 그 액자로 재면 없다.

   🔴 겹침이 주 지표. **상관으로 갈아타지 않는다** — 인쇄 글꼴에서도 헷갈리는 짝 전부에서
      상관이 IoU 보다 **높다**(=덜 가른다): ㄹ/ㅌ 0.902 vs 0.857 · ㅣ/ㅏ 0.893 vs 0.829 ·
      ㅁ/ㅇ 0.788 vs 0.694. matchTemplate 로 가는 길은 이 자로 막혔다.

   🔴 대신 **도면에서 다른 자리 하나만 잰다**(획 블록에서 두 번 증명된 자):
        모음 = 기둥 반대쪽 곁획 수 0/1/2 (실측 겹침 0) — **가르는 관문**
        ㅁ/ㅇ = 잉크 네 모서리 채움 (1.00 / 0.33)   — 동점일 때만
      🔴 **재 보지 않은 짝에는 안 건다. 그리고 「재 봤다」는 카메라로 재 봤다는 뜻이다** —
         ㄹ/ㅌ 위칸 탐침은 형판끼리 0.47 로 갈렸는데 실물에서 0.12 라 맞던 답을 틀리게 만들었다.

   🔴 **집합(set)은 데이터다.** 한글·알파벳·(나중에)숫자를 한 통에 넣고 최고점으로 고르면 안 된다 —
      `o`/`ㅇ` · `i`/`ㅣ` 는 같은 그림이고 카드 비율도 겹친다(영어 4x6 = 0.645 vs 한글 모음 2x4 =
      실측 0.48~0.63). 나중 숫자도 `0`/`o`/`ㅇ` · `1`/`l`/`i`/`ㅣ` · `2`/`z` · `5`/`s` 로 겹친다.
      어느 집합을 쓸지는 **화면(활동)이 링크로 정한다** — `?set=ko`(기본) · `?set=en` · `?set=en,num`.
      이 코드는 집합 이름을 모른다: 카드 갈래(`kinds`)도 동점 탐침(`tie`)도 JSON 이 싣고 온다.
      → 집합을 늘릴 때 여기 고칠 것은 **없다**.
   ═══════════════════════════════════════════════════════════════════════════ */
var STICKER_URL = 'tango-sticker-';        // + 집합이름 + '.json'

var stickerTpl = null;                     // [{ch, kind, bits, n, bar, corner, ticks}] — 켠 집합을 합친 것

var stickerKinds = null;                   // { 갈래: {bw, bh, ar:[lo,hi], studs, tick} }

var stickerTie = null;                     // [{probe, chars:{글자:1}}] — 동점일 때만 보는 자리 탐침

var STICKER_G = 40;

/* 곁획 한 줄로 치는 기준 — **굽는 쪽(sticker_templates.py)이 JSON 으로 실어 보낸다.**
   여기에 숫자를 따로 적지 않는 이유: 두 곳에 적으면 조용히 갈라진다. */
var STICKER_TICK_INK = 2, STICKER_TICK_RUN = 2;

/* 링크가 고르는 집합. `?set=` 없으면 한글 — 기존 링크가 안 깨지게. */
var STICKER_SETS = (function(){
  var m = /(^|[?&])set=([A-Za-z0-9_,]+)/.exec(location.search);
  return m ? m[2].split(',').filter(Boolean) : ['ko'];
})();

function popc32(v){
  v = v - ((v >> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return (((v + (v >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

/** GxG 격자(Uint8) -> 비트셋. 형판과 관찰이 **같은 함수**를 쓴다. */
function stickerPack(g, G){
  var bits = new Uint32Array((G*G + 31) >> 5), n = 0;
  for (var k = 0; k < G*G; k++) if (g[k]){ bits[k >> 5] |= (1 << (k & 31)); n++; }
  return { bits:bits, n:n };
}

/* ── 자리 탐침 셋. 🔴 파이썬 굽는 쪽(hardware/lrrh/sticker_templates.py)과 **같은 계산**이어야
      한다. 두 구현이 갈라지면 아무 데도 안 찍히므로, 형판을 읽을 때 되계산해서 대조한다. */
function stickerInkBox(g, G){
  var x0 = G, y0 = G, x1 = -1, y1 = -1;
  for (var y = 0; y < G; y++) for (var x = 0; x < G; x++) if (g[y*G + x]){
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < x0 ? null : [x0, y0, x1, y1];
}

function stickerBar(g, G){
  var b = stickerInkBox(g, G); if (!b) return 0;
  var bh = Math.max(1, ((b[3] - b[1] + 1) * 0.38) | 0);
  var y0 = b[1] + ((bh * 0.4) | 0), y1 = b[1] + bh;    // 위 띠의 아래 60% = 가로막대 말고 기둥 자리
  var w = b[2] - b[0] + 1, half = w >> 1;
  if (y1 <= y0 || half < 1) return 0;
  var L = 0, R = 0, nL = 0, nR = 0;
  for (var y = y0; y < y1; y++) for (var x = 0; x < w; x++){
    var v = g[y*G + b[0] + x] ? 1 : 0;
    if (x < half){ L += v; nL++; } else { R += v; nR++; }
  }
  return (nL ? L/nL : 0) - (nR ? R/nR : 0);
}

function stickerCorner(g, G){
  var b = stickerInkBox(g, G); if (!b) return 0;
  var h = b[3] - b[1] + 1, w = b[2] - b[0] + 1;
  var qh = Math.max(1, (h*0.25) | 0), qw = Math.max(1, (w*0.25) | 0), best = 1;
  for (var oy = 0; oy < 2; oy++) for (var ox = 0; ox < 2; ox++){
    var yy = b[1] + ((oy*h*0.75) | 0), xx = b[0] + ((ox*w*0.75) | 0), sum = 0;
    for (var y = 0; y < qh; y++) for (var x = 0; x < qw; x++) sum += g[(yy + y)*G + xx + x] ? 1 : 0;
    var f = sum/(qh*qw);
    if (f < best) best = f;
  }
  return best;
}

/** 기둥 반대쪽 절반의 곁획 덩어리 수 (모음 전용).
    🔴 어느 쪽이 기둥인지 **세어서** 정한다 — ㅓ 는 기둥이 오른쪽이다. 시트의 「왼쪽 정렬」을
       코드에 못 박으면 180도 돌린 카드를 통째로 놓친다.
    🔴 세로/가로는 **갈래 기록(k)**이 준다 — 격자는 늘 정사각이라 g 만 보고는 못 안다. */
function stickerTicks(g, G, k){
  if (!k || !k.tick) return -1;
  var half = G >> 1, port = k.bh > k.bw, a = 0, b = 0, x, y;
  for (y = 0; y < G; y++) for (x = 0; x < G; x++){
    var v = g[y*G + x] ? 1 : 0;
    if (port){ if (x < half) a += v; else b += v; }
    else { if (y < half) a += v; else b += v; }
  }
  var farLo = (a >= b) ? half : 0, farHi = (a >= b) ? G : half;
  /* 🔴 「잉크가 있는 줄」이 아니라 「잉크가 TICK_INK 칸 이상인 줄이 TICK_RUN 줄 이어진 것」을 센다.
        실측: 그냥 세면 진짜 ㅗ 카드가 JPEG 잡티 때문에 **곁획 4개**가 되어 관문에서 떨어졌다
        (겹침은 ㅗ 0.81 로 이미 맞게 골랐는데). 진짜 곁획은 격자 4칸 굵기라 여유가 크다. */
  var n = 0, run = 0;
  for (var i = 0; i < G; i++){
    var cnt = 0;
    for (var j = farLo; j < farHi; j++) cnt += (port ? g[i*G + j] : g[j*G + i]) ? 1 : 0;
    if (cnt >= STICKER_TICK_INK){ if (++run === STICKER_TICK_RUN) n++; }
    else run = 0;
  }
  return n;
}

/** 켠 집합들의 형판을 읽어 합친다.
    🔴 굽는 쪽이 적어 둔 탐침 값을 **되계산해 대조**한다(구현이 갈라지는 걸 여기서 잡는다). */
function loadSticker(){
  Promise.all(STICKER_SETS.map(function(name){
    return fetch(STICKER_URL + name + '.json').then(function(r){
      if (!r.ok) throw new Error(name + ' ' + r.status);
      return r.json();
    });
  })).then(function(list){
    var tpl = [], kinds = {}, tie = [], bad = 0;
    list.forEach(function(js){
      var G = STICKER_G = js.grid;
      if (js.tick){ STICKER_TICK_INK = js.tick.ink; STICKER_TICK_RUN = js.tick.run; }
      Object.keys(js.kinds).forEach(function(k){
        /* 같은 갈래 이름을 두 집합이 다르게 재면(en + num 처럼 같은 카드를 쓰는 짝) 조용히 틀린다 */
        if (kinds[k] && JSON.stringify(kinds[k]) !== JSON.stringify(js.kinds[k])){
          bad++;
          if (window.console) console.error('[sticker] 갈래 ' + k + ' 가 집합마다 다르다', kinds[k], js.kinds[k]);
        }
        kinds[k] = js.kinds[k];
      });
      (js.tie || []).forEach(function(t){
        var m = {};
        t.chars.forEach(function(c){ m[c] = 1; });
        tie.push({ probe:t.probe, chars:m });
      });
      js.glyphs.forEach(function(d){
        var bin = atob(d.bits), g = new Uint8Array(G*G);
        for (var k2 = 0; k2 < G*G; k2++) g[k2] = (bin.charCodeAt(k2 >> 3) >> (k2 & 7)) & 1;
        var p = stickerPack(g, G);
        var bar = stickerBar(g, G), cor = stickerCorner(g, G), tk = stickerTicks(g, G, js.kinds[d.kind]);
        if (Math.abs(bar - d.bar) > 0.02 || Math.abs(cor - d.corner) > 0.02 || tk !== d.ticks){
          bad++;
          if (window.console) console.error('[sticker] 탐침이 굽는 쪽과 다르다', d.ch,
            { bar:[bar, d.bar], corner:[cor, d.corner], ticks:[tk, d.ticks] });
        }
        tpl.push({ ch:d.ch, kind:d.kind, bits:p.bits, n:p.n, bar:bar, corner:cor, ticks:tk });
      });
    });
    /* 🔴 갈래는 **카드 비율**로 고른다 — 띠가 겹치면 어느 집합의 글자인지 비율로는 못 가른다.
          실제로 겹친다: 한글 모음 2x4 는 0.30~0.72, 알파벳 4x6 은 0.45~0.95 다. 그래서
          `set=ko,en` 은 쓰면 안 되고, 쓰면 여기서 소리를 낸다(링크 오타를 조용히 넘기지 않게).
          `set=en,num` 처럼 **카드가 같은** 집합끼리는 갈래 이름이 같아 위에서 대조된다. */
    var kn = Object.keys(kinds);
    for (var a = 0; a < kn.length; a++) for (var b2 = a + 1; b2 < kn.length; b2++){
      var A = kinds[kn[a]], B = kinds[kn[b2]];
      /* 맞닿는 건 겹치는 게 아니다 — 한 집합 안의 띠는 끝점을 나눠 쓴다(sq 0.72~ / port ~0.72) */
      if (Math.min(A.ar[1], B.ar[1]) - Math.max(A.ar[0], B.ar[0]) > 0 && window.console)
        console.error('[sticker] 갈래 ' + kn[a] + '·' + kn[b2] + ' 의 카드 비율이 겹친다 — ' +
                      '집합을 섞지 마라(set=' + STICKER_SETS.join(',') + ')', A.ar, B.ar);
    }
    stickerKinds = kinds; stickerTie = tie; stickerTpl = tpl;
    console.log('[tango-board-3d] 스티커 집합 [' + STICKER_SETS.join(',') + '] 형판 ' + tpl.length +
                ' 글자 · 갈래 ' + Object.keys(kinds).join(',') + (bad ? ' · 🔴 어긋남 ' + bad : ''));
    TangoReco.onChange();
  }).catch(function(e){
    if (window.console) console.warn('[tango-board-3d] 스티커 형판을 못 읽었다', e);
  });
}

/** 카드 한 장의 잉크 격자를 형판에 맞춘다.
 *
 *  🔴 갈래가 `shift` 를 달고 있으면 관찰 격자를 **가로·세로로 그만큼 밀어 보고** (밀기 × 형판)
 *     전체에서 최고를 고른다. 알파벳 소문자에서만 켠다 — x높이 잉크가 카드의 27% 뿐이라
 *     (한글은 59%) 손으로 오린 카드의 가장자리 오차가 상대적으로 훨씬 크게 먹는다.
 *     실측(올라온 프레임, 카드 13장):
 *        안 밀면        겹침 0.26~0.58 · 12장 틀림
 *        세로만(dy)     겹침 0.52~0.93 · 12/13 맞음 (q 가 o 로)
 *        가로+세로      겹침 0.64~0.96 · **13/13 맞음** (q 0.76 vs o 0.65)
 *     최고는 대개 dx −2~+1 · dy −3 에 모인다. dy 가 한쪽으로 쏠린 건 그 프레임의 카드가
 *     밑줄 커밋(397e5730) **이전에 뽑은** 인쇄물이라 글자가 지금 시트보다 3.4mm 아래여서다.
 *     다시 뽑으면 dy≈0 이 되지만 **손으로 오리는 한 dx 는 남는다** — 그래서 허용치를 둔다.
 *  🔴 맞수(second)는 **다른 글자 중 최고**여야 한다 — 밀기마다 같은 글자가 여러 번 들어오므로
 *     그냥 2위를 보면 맞수가 제 자신이 되어 동점 판정이 통째로 건너뛰어진다.
 */
function matchSticker(g, G, kind){
  if (!stickerTpl) return null;
  var k = stickerKinds[kind];
  if (!stickerPack(g, G).n) return null;
  var ticks = stickerTicks(g, G, k);
  var maxS = k.shift || 0, buf = maxS ? new Uint8Array(G*G) : null;
  var byCh = {}, bestG = g, bestIou = -1, t, w, y, x, dx, dy;
  for (dy = -maxS; dy <= maxS; dy++) for (dx = -maxS; dx <= maxS; dx++){
    var gg = g;
    if (dx || dy){
      buf.fill(0);
      for (y = 0; y < G; y++){
        var sy = y + dy;
        if (sy < 0 || sy >= G) continue;
        for (x = 0; x < G; x++){
          var sx = x + dx;
          if (sx >= 0 && sx < G) buf[sy*G + sx] = g[y*G + x];
        }
      }
      gg = buf;
    }
    var o = stickerPack(gg, G);
    if (!o.n) continue;
    for (t = 0; t < stickerTpl.length; t++){
      var T = stickerTpl[t];
      if (T.kind !== kind) continue;
      /* 🔴 모음은 겹침으로 못 가른다(카드 기준 ㅣ/ㅏ 0.829 · ㅣ/ㅑ 0.708) — 곁획 수가 가른다.
            동점 뒤집기가 아니라 **관문**인 이유: 실측 분리가 0/1/2 로 겹침이 0 이다.
            (곁획을 안 쓰는 갈래는 양쪽 다 -1 이라 그냥 통과한다.) */
      if (T.ticks !== ticks) continue;
      var inter = 0;
      for (w = 0; w < o.bits.length; w++) inter += popc32(o.bits[w] & T.bits[w]);
      var iou = inter / (o.n + T.n - inter);
      if (!byCh[T.ch] || iou > byCh[T.ch].iou) byCh[T.ch] = { ch:T.ch, iou:iou, T:T, dx:dx, dy:dy };
      if (iou > bestIou){ bestIou = iou; bestG = (dx || dy) ? buf.slice() : g; }
    }
  }
  var order = Object.keys(byCh).map(function(c){ return byCh[c]; })
                    .sort(function(a, b){ return b.iou - a.iou; });
  var best = order[0] || null, second = order[1] || null;
  if (!best) return null;
  g = bestG;                       // 아래 자리 탐침은 **이긴 밀기**의 그림에서 잰다
  if (second && best.iou - second.iou < TUNE.stickerTieGap){
    for (var ti = 0; ti < stickerTie.length; ti++){
      var rule = stickerTie[ti];
      if (!rule.chars[best.ch] || !rule.chars[second.ch]) continue;
      var obs = rule.probe === 'corner' ? stickerCorner(g, G) : stickerBar(g, G);
      best.probe = rule.probe;
      if (Math.abs(obs - second.T[rule.probe]) < Math.abs(obs - best.T[rule.probe])){
        var sw = best; best = second; second = sw; best.probe = rule.probe;
      }
      break;
    }
  }
  best.tie = second ? second.ch : null;
  best.gap = second ? best.iou - second.iou : 1;
  best.ticks = ticks;
  return best;
}

/** 카드 마스크 = **흰 종이**, 그 안의 구멍(=잉크)을 메운 것.
    🔴 「초록이 아니면 전경」(a* Otsu)으로는 안 된다 — 주황 몸통끼리 닿아 카드 열여덟 장이
       1115x707 덩어리 **하나**가 된다(실측 채움 0.72). 갈라 주는 건 흰 종이다. */
function stickerMask(M, Lm, Am, Bm, W, H, N){
  var ld = Lm.data, ad = Am.data, bd = Bm.data;
  var card = M(new cv.Mat(H, W, cv.CV_8UC1)), cd = card.data;
  var wL = TUNE.stickerWhiteL, wA = TUNE.stickerWhiteA, wB = TUNE.stickerWhiteB, i;
  for (i = 0; i < N; i++){
    var L = ld[i], da = ad[i] - 128, db = bd[i] - 128;
    if (da < 0) da = -da;
    if (db < 0) db = -db;
    cd[i] = (L > wL && da < wA && db < wB) ? 255 : 0;
  }
  /* 구멍 메우기 — 흰 마스크를 뒤집어 성분을 세고, **화면 테두리에 안 닿는** 작은 성분이 구멍이다.
     닫기 커널을 쓰지 않는 이유는 위 TUNE 주석에 있다(획 13px > 카드 틈 11px). */
  var inv = M(new cv.Mat());
  cv.bitwise_not(card, inv);
  var il = M(new cv.Mat()), ist = M(new cv.Mat()), ice = M(new cv.Mat());
  var inum = cv.connectedComponentsWithStats(inv, il, ist, ice, 4, cv.CV_32S);
  var idat = il.data32S, edge = new Uint8Array(inum), x, y;
  for (x = 0; x < W; x++){ edge[idat[x]] = 1; edge[idat[(H-1)*W + x]] = 1; }
  for (y = 0; y < H; y++){ edge[idat[y*W]] = 1; edge[idat[y*W + W-1]] = 1; }
  var cap = N*TUNE.stickerHoleMax, fill = new Uint8Array(inum);
  for (i = 1; i < inum; i++) fill[i] = (!edge[i] && ist.intAt(i, 4) <= cap) ? 1 : 0;
  for (i = 0; i < N; i++) if (fill[idat[i]]) cd[i] = 255;
  return card;
}

/** 프레임에서 스티커 카드를 찾아 읽는다. 카드가 stickerMin 장에 못 미치면 null(= 예전 경로로). */
function readSticker(M, Lm, Am, Bm, W, H, N, t0){
  var ld = Lm.data, ad = Am.data, bd = Bm.data, i;
  var card = stickerMask(M, Lm, Am, Bm, W, H, N);
  /* 🔴 **판 밖은 안 본다** — 획 블록 경로와 같은 껍질이다(2026-09-16).
        거치대 구도에선 판 아래 탁자·종이가 늘 보이고, 흰 종이 전경은 그것을 그대로 카드로
        집어 들인다 — 실측(p1789558765700): 채움 0.75·0.88 짜리 책상·종이 조각이 둘.
        껍질을 못 찾으면(판이 화면의 legoPlateMin 미만) 안 자른다. */
  var splate = TUNE.legoPlateHull ? legoPlateHullMask(M, Am, 0, W, H, N) : null;
  if (splate) cv.bitwise_and(card, splate, card);
  var lab = M(new cv.Mat()), st = M(new cv.Mat()), cen = M(new cv.Mat());
  var n = cv.connectedComponentsWithStats(card, lab, st, cen, 8, cv.CV_32S);
  var ldat = lab.data32S, minA = N*TUNE.legoMinArea, cards = [];
  var kindNames = Object.keys(stickerKinds);
  /* 🔴 **카드다움은 회전 사각형으로 재야 정직하다** (2026-09-16). 축 정렬 상자로 재면
        **비스듬히 놓인 카드가 벌점을 먹는다** — 실측: 7.8도 기울어진 ㅑ 카드가 채움 0.76 · 비율 0.60 이고
        같은 2x4 칸 카드가 똑바로 놓이면 0.93 · 0.53 이다. 그 벌점으로 「훞빔」의 ㅑ 가 통째로 버려져
        음절 하나가 사라졌다. 회전 사각형으로 재면 0.89 · 0.48 로 제 값이 된다.
        덩어리마다 윤곽을 따로 뜨지 않고 **한 번만** findContours 해서 라벨로 되돌린다
        (RETR_EXTERNAL 윤곽 하나 = 8이웃 성분 하나). */
  var rectW = {}, rectH = {};
  var cts0 = M(new cv.MatVector()), hier0 = M(new cv.Mat());
  cv.findContours(M(card.clone()), cts0, hier0, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  for (var ci = 0; ci < cts0.size(); ci++){
    var ct0 = cts0.get(ci), cpt = ct0.data32S;
    if (!cpt || cpt.length < 2) continue;
    var lb0 = ldat[cpt[1]*W + cpt[0]];
    if (!lb0 || rectW[lb0]) continue;
    var rr0 = cv.minAreaRect(ct0), rw0 = rr0.size.width, rh0 = rr0.size.height;
    /* 이미지 축에 더 가까운 변을 「가로」로 — 그래야 port/land 갈래 띄를 그대로 쓴다 */
    var th0 = rr0.angle*Math.PI/180;
    if (Math.abs(Math.cos(th0)) < Math.abs(Math.sin(th0))){ var tt0 = rw0; rw0 = rh0; rh0 = tt0; }
    rectW[lb0] = Math.max(1, rw0); rectH[lb0] = Math.max(1, rh0);
  }
  for (i = 1; i < n; i++){
    var bx = st.intAt(i, 0), by = st.intAt(i, 1);
    var bw = st.intAt(i, 2), bh = st.intAt(i, 3), ba = st.intAt(i, 4);
    if (ba < minA) continue;
    /* 🔴 화면 가장자리에 걸린 카드 — 예전엔 통째로 버렸고, 그래서 사용자가
          「마지막 글자를 못 읽는다」로 겪었다. 실측(잘린 카드 셋, 껍질을 씨운 뒤):
          `o` 0.85 · `f` 0.71 · ㅑ 0.46 — 앞 둘은 안 잘린 카드 띄(0.64~0.96) 안이다.
          잘리는 건 대개 주황 몸통이고 흰 종이는 남아 있어서다. 헛 카드는 13장에서 0장.
          ⚠ 절반이 나간 카드는 아직 재 보지 못했다 — 갈래띄·칸·`stickerMinIou` 셋이 막을 것으로
          보이나 그런 프레임이 오면 먼저 재 볼 것. */
    var onEdge = (bx <= 1 || by <= 1 || bx + bw >= W - 1 || by + bh >= H - 1);
    if (onEdge && !TUNE.stickerEdge) continue;
    var rw = rectW[i] || bw, rh = rectH[i] || bh;
    if (ba / (rw*rh) < TUNE.stickerFill) continue;
    /* 🔴 갈래는 **카드 비율**이 준다. 띠는 형판 JSON 이 들고 온다 — 집합마다 카드가 다르다
          (한글 정사각 1.0 · 한글 모음 0.45 · 알파벳 0.645). */
    var ar = rw / rh, kind = null, kk;
    for (var ki = 0; ki < kindNames.length; ki++){
      kk = stickerKinds[kindNames[ki]];
      if (ar >= kk.ar[0] && ar <= kk.ar[1]){ kind = kindNames[ki]; break; }
    }
    if (!kind) continue;
    /* 🔴 **카드가 칸의 원본이다.** 돌기 주기(legoCellSweep)는 카드가 판을 덮으면 무너진다 —
          실측: 같은 판 두 장에서 칸 37.2 vs 137.9. 스티커 긴 변은 집합마다 고정이다
          (한글 29.1mm = 3.64돌기 · 알파벳 45.1mm = 5.64돌기). */
    cards.push({ i:i, x:bx, y:by, w:bw, h:bh, kind:kind, edge:onEdge,
                 cell:Math.max(bw, bh)/stickerKinds[kind].studs });
  }
  if (cards.length < (TUNE.stickerOn === 2 ? 1 : TUNE.stickerMin)) return null;
  /* ③ 칸이 다른 무리에서 벗어난 것은 카드가 아니다 */
  var cs = cards.map(function(c){ return c.cell; }).sort(function(a, b){ return a - b; });
  var cell = cs[cs.length >> 1];
  cards = cards.filter(function(c){ return Math.abs(c.cell - cell)/cell <= TUNE.stickerCellTol; });
  if (!cards.length) return null;

  var G = STICKER_G, grid = new Uint8Array(G*G), hist = new Int32Array(256);
  var items = [], boxes = [], detail = [], good = 0;
  cards.forEach(function(c){
    /* ④ 카드 안 **중성 화소**로만 Otsu — 그래야 「흰 종이 vs 검은 잉크」 두 무리가 된다.
          🔴 색 밑줄·색 테두리를 빼지 않으면 무리가 셋이라 Otsu 가 엉뚱한 데를 자른다(위 TUNE 주석).
          🔴 고정 밝기 문턱도 안 된다 — 그늘진 카드가 통째로 잉크가 된다. */
    var x, y, p, v, tot = 0;
    var kk0 = stickerKinds[c.kind];
    var iA = kk0.inkA || 0, iB = kk0.inkB || 0;   // 0 = 중성 관문 끔(한글)
    hist.fill(0);
    for (y = 0; y < c.h; y++) for (x = 0; x < c.w; x++){
      p = (c.y + y)*W + c.x + x;
      if (ldat[p] !== c.i) continue;
      if (iA){
        var da = ad[p] - 128, db = bd[p] - 128;
        if (da < 0) da = -da;
        if (db < 0) db = -db;
        if (da > iA || db > iB) continue;
      }
      hist[ld[p]]++; tot++;
    }
    if (!tot) return;
    var sum = 0;
    for (v = 0; v < 256; v++) sum += v*hist[v];
    var sumB = 0, wB2 = 0, mx = -1, thr = 128;
    for (v = 0; v < 256; v++){
      wB2 += hist[v];
      if (!wB2) continue;
      var wF = tot - wB2;
      if (!wF) break;
      sumB += v*hist[v];
      var d = sumB/wB2 - (sum - sumB)/wF, bet = wB2*wF*d*d;
      if (bet > mx){ mx = bet; thr = v; }
    }
    /* ⑤ 카드 상자 기준으로 GxG 표본 — 굽는 쪽과 **같은 최근접 규칙**.
          잉크 판정도 ④ 와 같은 자다(어둡고 중성) — 굽는 쪽 `ink_of()` 가 색 테두리·밑줄을 빼는 것과 짝이다. */
    for (y = 0; y < G; y++){
      var sy = c.y + (((y + 0.5)*c.h/G) | 0);
      for (x = 0; x < G; x++){
        var sx = c.x + (((x + 0.5)*c.w/G) | 0);
        p = sy*W + sx;
        var ok2 = ldat[p] === c.i && ld[p] <= thr;
        if (ok2 && iA){
          var ga = ad[p] - 128, gb = bd[p] - 128;
          if (ga < 0) ga = -ga;
          if (gb < 0) gb = -gb;
          if (ga > iA || gb > iB) ok2 = false;
        }
        grid[y*G + x] = ok2 ? 1 : 0;
      }
    }
    var m = matchSticker(grid, G, c.kind);
    var kk2 = stickerKinds[c.kind];
    var cx = (c.x + c.w/2)/cell, cy = (c.y + c.h/2)/cell;
    var ok = !!(m && m.iou >= TUNE.stickerMinIou);
    if (ok){
      good++;
      /* 좌표는 **카드 가운데**에서 낸다 — 손으로 오려 붙여 가장자리가 들쭉날쭉해도
         가운데는 안 움직인다. parseGroup 이 어차피 cx = x + w/2 로 되돌린다. */
      items.push({ ch:m.ch, x:cx - kk2.bw/2, y:cy - kk2.bh/2, w:kk2.bw, h:kk2.bh });
    }
    boxes.push({ x:c.x, y:H - c.y - c.h, w:c.w, h:c.h, ch: ok ? m.ch : '', color:0 });
    /* x 를 같이 싣는다 — 진단 줄을 **읽기 순서**로 찍기 위해서다(아래 showCamDbg). */
    detail.push({ ch: ok ? m.ch : '?', iou:+((m ? m.iou : 0).toFixed(2)), x:c.x, 잘림:c.edge ? 1 : 0,
                  칸:+c.cell.toFixed(1), 갈래:c.kind, 곁획:m ? m.ticks : -1 });
  });
  reco.boxes = boxes;
  /* 🔴 낱말 조합(parseFree)은 **한글 자모일 때만** 뜻이 있다. 알파벳 카드는 모아쓰기가 아니라
        왼쪽에서 오른쪽으로 잇는다 — 낱말이 아니라 글자 줄이다. */
  var word = hasHangul(items) ? parseFree(items).join('') : stickerLine(items);
  reco.legoCell = cell;
  reco.legoInfo = { 스티커:STICKER_SETS.join(','), 칸:+cell.toFixed(1), 카드:cards.length,
                    자모:good, 버린것:cards.length - good,
                    판:splate ? (reco.legoPlate || 0) : 0 };
  reco.ms = performance.now() - t0;
  return { word:word, items:items, comps:cards.length, detail:detail };
}

function hasHangul(items){
  for (var i = 0; i < items.length; i++) if (items[i].ch.charCodeAt(0) >= 0x3131) return true;
  return false;
}

/** 한글이 아닌 카드는 줄 단위로 왼쪽→오른쪽으로 읽는다(모아쓰기가 아니다). */
function stickerLine(items){
  var rows = [];
  items.slice().sort(function(a, b){ return (a.y + a.h/2) - (b.y + b.h/2); }).forEach(function(it){
    var cy = it.y + it.h/2, r = rows[rows.length - 1];
    if (r && Math.abs(cy - r.cy) <= it.h*0.6) r.list.push(it);
    else rows.push({ cy:cy, list:[it] });
  });
  return rows.map(function(r){
    return r.list.sort(function(a, b){ return a.x - b.x; })
                 .map(function(it){ return it.ch; }).join('');
  }).join(' ');
}

/* =====================================================================
 * OpenCV.js — 격자 찾기는 이 위에서 돈다.
 *
 * \U0001f534 손으로 옮기다 같은 자리에서 두 번 틀렸다(역행렬 원소 뒤바꿈 → 번호가
 *    전부 (0,0) · 행/열 우선 뒤바꿈). 파이썬에서 다섯 장 전부 검증한 코드를
 *    거의 그대로 옮길 수 있으면 그 부류의 오류가 통째로 사라진다.
 *    대가는 10.5MB 한 번 받기 — 로딩 화면으로 덮는다.
 * ===================================================================== */
var cvReady = false, cvFailed = false;

function loadOpenCV(){
  if (window.cv && window.cv.Mat){ cvReady = true; return Promise.resolve(true); }
  if (loadOpenCV._p) return loadOpenCV._p;
  /* 진행률은 바깥이 그린다 — 실험실은 자기 덮개를, 앱은 GameLoadingGate 를 쓴다.
     frac === null 이면 「끝났다(또는 실패)」. */
  function cvProgress(frac){
    if (typeof TangoReco.onCvProgress === 'function') TangoReco.onCvProgress(frac);
  }

  /* 🔴 opencv.js 는 11MB 인데 docs.opencv.org 는 `max-age=86400` 만 준다 —
        하루 지나면 다시 받고, 폰 캐시에서 밀려나도 다시 받는다. 한 번 받은 건
        Cache Storage 에 넣어 두고 그 뒤로는 거기서만 꺼낸다(오프라인에서도 뜬다).
        같은 페이지 안 중복 호출은 loadOpenCV._p 가 막는다. */
  /* 🔴 docs.opencv.org 는 CORS 를 안 열어 줘서 fetch 가 막히고(스크립트 태그만 된다)
        받은 걸 캐시에 담을 수가 없다. 게다가 max-age 가 하루뿐이다.
        jsDelivr 는 `access-control-allow-origin: *` + `max-age=31536000, immutable` —
        브라우저 캐시만으로도 1년간 다시 안 받고, 캐시가 밀려도 아래 Cache Storage 가 받친다. */
  var CACHE = 'tango-cv-v1',
      URL_CV = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.11.0-release.1/dist/opencv.js';

  /* 🔴 **`content-length` 를 진행률의 분모로 쓰면 안 된다.** jsDelivr 는 brotli 로 보내므로
        그 머리값은 **압축 크기**(실측 3,479,188)인데 `getReader()` 가 주는 건 **풀린 바이트**다
        (실측 11,386,540). 그대로 나누면 진행률이 327% 까지 올라간다.
     🔴 그래서 분모는 **지난번에 실제로 받은 크기**를 기억해 쓴다 — 판이 올라가 파일이 커져도
        저절로 따라간다. 처음 한 번은 오늘 잰 값으로 시작하고, 그 뒤로는 자기가 잰 값을 쓴다. */
  var BYTES_KEY = 'tango-cv-bytes', BYTES_SEEN = 11386540;
  function expectedBytes(){
    try { return +localStorage.getItem(BYTES_KEY) || BYTES_SEEN; } catch (e){ return BYTES_SEEN; }
  }

  function run(text){
    return new Promise(function(res){
      var sc = document.createElement('script');
      sc.text = text;
      sc.onerror = function(){ res(false); };
      document.head.appendChild(sc);
      /* wasm 이 준비된 뒤에야 쓸 수 있다 — 실행 직후가 아니다.
         🔴 빌드마다 끌내는 방식이 다르다 — techstark 배포본은 `window.cv` 자리에
            **Promise** 를 놓고(키가 0개인 object 로 보인다) 그게 진짜 cv 로 풀린다. */
      var n = 0, tick = setInterval(function(){
        if (window.cv && typeof window.cv.then === 'function'){
          clearInterval(tick);
          window.cv.then(function(m){ window.cv = m; cvReady = !!(m && m.Mat); res(cvReady); },
                         function(){ res(false); });
          return;
        }
        if (window.cv && window.cv.Mat){ clearInterval(tick); cvReady = true; res(true); }
        else if (++n > 600){ clearInterval(tick); res(false); }
      }, 60);
    });
  }

  loadOpenCV._p = (async function(){
    var text = null, cached = false;
    try {
      if (window.caches){
        var c = await caches.open(CACHE);
        var hit = await c.match(URL_CV);
        if (hit){ text = await hit.text(); cached = true; }
      }
    } catch (e){ /* 사파리 프라이빗 등 — 그냥 받는다 */ }

    if (!cached) cvProgress(0);                 // 받을 때만 덮개를 띄운다
    try {
      if (!text){
        var r = await fetch(URL_CV, { cache:'force-cache' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        /* 바이트를 세면서 받는다 — 11MB 를 말없이 기다리게 두면 멈춘 것과 구별이 안 된다. */
        var reader = r.body && r.body.getReader ? r.body.getReader() : null;
        if (!reader) text = await r.text();
        else {
          var chunks = [], got = 0, want = expectedBytes();
          for (;;){
            var s2 = await reader.read();
            if (s2.done) break;
            chunks.push(s2.value); got += s2.value.length;
            /* 🔴 99% 에서 멈춰 둔다 — 분모는 지난번 크기라 조금 어긋나고, 100% 를 띄운 뒤에도
                  wasm 이 깨어나기를 기다려야 한다. 「다 됐다」는 진짜 다 됐을 때만 말한다. */
            cvProgress(Math.min(0.99, got / want));
          }
          text = await new Response(new Blob(chunks)).text();
          try { localStorage.setItem(BYTES_KEY, String(got)); } catch (e){}
        }
        try { if (window.caches) (await caches.open(CACHE)).put(URL_CV, new Response(text)); } catch (e){}
      }
      var ok = await run(text);
      if (!ok) cvFailed = true;
      cvProgress(null);
      return ok;
    } catch (e){
      cvFailed = true;
      cvProgress(null);
      return false;
    }
  })();
  return loadOpenCV._p;
}

/** 레고형 조각 발자국 + 1mm 마스크. 받고 나면 템플릿을 다시 만든다. */
function loadLego(){
  Promise.all([fetch(LEGO_URL.pieces), fetch(LEGO_URL.masks)])
    .then(function(rs){
      if (!rs[0].ok || !rs[1].ok) throw new Error('lego ' + rs[0].status + '/' + rs[1].status);
      return Promise.all([rs[0].json(), rs[1].json()]);
    })
    .then(function(js){
      legoData = { pieces:js[0], masks:js[1] };
      var tpl = buildLegoTemplates();
      if (reco.fbo) reco.templates = tpl;
      legoTemplates = tpl;
      console.log('[tango-board-3d] 레고 형판 ' + tpl.length + ' 글자');
      TangoReco.onChange();
    })
    .catch(function(e){
      console.error('[tango-board-3d] 레고 조각을 못 읽었다', e);
    });
}

/* ── 바깥 입구 ────────────────────────────────────────────────────────────
   실험실은 위 전역들을 예전처럼 그대로 쓰고, 앱은 이 입구만 쓴다. */
TangoReco.recognize = recognizeLegoDirect;
TangoReco.tune = TUNE;
if (typeof window !== 'undefined') window.TangoReco = TangoReco;

