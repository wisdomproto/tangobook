/*
 * 룰루네 올리브 언덕 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/lulu-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'lulu';
  var ANCHOR = { slug: 'lulu-monotype', name: '앵커 lulu-monotype', text: "STYLE ANCHOR - lulu-monotype   (a donkey family on an Italian olive hill / monotype, one plate, one\n                                print, and the light is wiped out of it)\n\nStyle: monotype on warm white paper, exactly TWO inks plus one small accent, 4-6 year old picture\n  book. 🔴 THE INK IS ROLLED ONTO A PLATE, THE FORM IS WIPED OUT OF IT WITH A RAG AND A FINGER, AND\n  THE PLATE IS PRINTED ONCE. Light is made by TAKING INK AWAY, so every bright thing is bare paper\n  that the plate never touched - the Mediterranean sun, the dry road, the tablecloth, the wall.\n  Ink never lies perfectly even: it prints a little mottled, carries the roller's direction and shows\n  the pressure of the press. Where the two inks meet ON THE PLATE they mix into a third, darker\n  colour - that is the only dark, and it prints in the same single pass. SHADING IS ZERO - an area is\n  inked or it is wiped, never graded between. 🔴 NO WHITE INK, EVER.\n\nRENDERING (finish hierarchy): an area is ONE broad inked field, flat inside itself apart from the\n  mottle; a wiped shape inside it has a CLEAN HARD EDGE because a rag made it. 🔴 THE ONLY SOFT EDGE\n  IN THIS BOOK IS THE PLATE MARK, where the print runs out at the border of the plate - leave it on\n  every page. FINISHED THINGS PER PAGE = 2, Lulu and the one thing Lulu touches; everything else is a\n  wiped shape with no interior detail. Repeats are capped and the cap is the whole design: a heap of\n  olives is ONE mass and at most 12 olives are ever drawn as separate berries · plates at most 8 ·\n  flowers at most 8 · loaves or bread pieces at most 8 · sacks at most 5 · bottles at most 4 · the\n  armful of old things at most 6 objects · ribbons at most 5 on one cousin · figs at most 5 · grape\n  bunches at most 7 · vine posts at most 5 · olive trees at most 5 · jars at most 6 of one shape ·\n  planks at most 6 · a festival crowd is ONE wiped mass with at most 7 flat silhouettes at its near\n  edge, 0 faces and 0 hands · stars at most 14 wiped points, each taken out on its own. Nothing in a\n  repeat is a mirrored copy of its neighbour. DENSITY RATION = none.\n  🔴 DEPTH IS SPACING, NEVER DARKNESS - trees further down the hill stand CLOSER TOGETHER at the same\n  weight of ink. Nothing recedes by getting paler, bluer or softer.\n  🔴 THE CHILDREN ARE ALWAYS EXACTLY FIVE: LULU, THREE WALKING COUSINS AND ONE BABY. Never a fourth\n  walking cousin, never a second baby, never an extra child to fill a corner. THE THREE COUSINS MOVE\n  AS ONE BLOCK - they touch or overlap and share one silhouette, and the baby is always lying down or\n  being carried, never on its feet.\n\nPALETTE: PAPER WARM WHITE #F7F2E6, sun, the dry road, the tablecloth, whitewash, light, everything\n  wiped clean off the plate · INK1 OLIVE LEAF #8C9478, leaves, the hillside, vine leaves, shutters,\n  aprons, painted things - a dusty dried silver-green, the cool one · INK2 DRY EARTH #BC6E42, soil,\n  timber, sacks, baskets, roof tiles, the press stone, the cart, donkey chests and bellies - a warm\n  terracotta, the warm one · PLATE MIX OLIVE BLACK #3E3A2E, ripe olives, donkey backs and heads, the\n  inside of the barn, night sky, the grape stain - made where the two inks meet on the plate, never a\n  third tube · ACCENT MAJOLICA BLUE #1F7FA8, 🔴 dabbed onto the plate last with a small rag so it\n  prints in the same pass, touching NOTHING but Lulu's bell cord and its bell. No sky blue that is not\n  the accent, no purple anywhere, no pink, no red, no yellow, no white ink.\n\nSTAGE CLAUSES (the stage changes what the two inks do, never which two they are):\n  GROVE - the hillside is ONE broad field of OLIVE LEAF, 0 individual leaves. Trunks and the ground\n    beneath are DRY EARTH with the roller running ALONG the trunk, not across it. Ripe olives are\n    PLATE MIX. 🔴 THE SPREAD NET IS BARE PAPER, one clean wiped shape, and it is the brightest thing\n    on the page - the olives that fall onto it are the darkest, so the whole book's contrast lives on\n    that net.\n  YARD AND BARN - each surface is ONE repeated mark: floor a plank stroke, wall a short dash, sacking\n    a zigzag. The mark is the SAME shape every time and may run off an edge but is never redrawn.\n    Beams, the cart, sacks and the well are DRY EARTH; shutters, aprons and the vine canopy are OLIVE\n    LEAF. 🔴 THE OPEN DOORWAY AND THE SQUARE OF SUN ON THE BARN FLOOR ARE BARE PAPER, wiped clean with\n    a hard edge and no rays. A thing being looked for is wiped with its own clear silhouette while\n    everything it hides among is the repeated mark.\n  KITCHEN AND LONG TABLE - the tablecloth is ONE wiped shape of bare paper and it is the brightest\n    thing indoors; plates, bowls and jugs are wiped OUT of the DRY EARTH table, never drawn onto it.\n    Steam from a pot is bare paper, at most 5 curls. When the table is crowded the crowding is made by\n    the number of wiped shapes, never by adding a colour.\n  HILL ROAD - the road is ONE wiped strip of bare paper running through the OLIVE LEAF hillside, and\n    it stays bare however far it goes. Far farmhouses are at most 4 DRY EARTH silhouettes with 0\n    windows.\n  PIAZZA (volumes 09, 17, 23, 25) - the dancing ring is ONE wiped mass of PLATE MIX with the ground\n    bare paper inside and around it; only the 7 nearest figures have their own silhouette. Cloth\n    banners are single flat pulls of either ink. 🔴 The ribbons in volume 17 are OLIVE LEAF and DRY\n    EARTH only - a made thing never takes the accent.\n  🔴 PRESS AND VAT (volumes 18, 24) - the first oil running from the press is BARE PAPER, one clean\n    wiped line, and it carries the whole page. 🔴 THE GRAPE JUICE IS NOT PURPLE. It is the darkest\n    print of DRY EARTH - a deep saturated stain of the same warm ink - and \"purple feet\" and \"purple\n    bottom\" are made by HOW DARK THE STAIN IS, never by a new colour. The blue in volume 24 is on the\n    bell and nowhere else.\n  🔴 NIGHT (volume 14) - the sky is PLATE MIX laid as one flat field. The stars and the one shooting\n    star are BARE PAPER wiped out of it, each taken on its own, at most 14, with no trail longer than\n    a finger and no glow.\n  🔴 RAIN (volume 13) - the storm cloud is ONE flat mass of PLATE MIX entering from one side, with a\n    hard wiped edge against the bare sky. Raindrops are at most 11 short DRY EARTH strokes all leaning\n    the same way. Nothing gets paler as the sky darkens.\n\nCHARACTER DESIGN LANGUAGE: the donkeys are built from the same broad fields as the world - two or\n  three shapes with limbs laid over. GRADE: bipedal, standing upright, wearing simple farm cloth -\n  aprons, hats, waistcoats, skirts and sleeves - 🔴 AND BAREFOOT ALWAYS. NOBODY IN THIS WORLD WEARS\n  SHOES, so hooved feet are visible on every page and the grape treading in volume 24 works without\n  explanation. The forelimb is an ARM in a sleeve ending in a rounded blunt hand; it grasps, carries\n  and points as one shape, and when it must count or pinch it grows AT MOST THREE stubby fingers,\n  never five. Backs and heads are PLATE MIX, chests and bellies are DRY EARTH - 🔴 THAT IS THE ONLY\n  THING THE DONKEYS SHARE. The two inks sit in the same places on all of them; THEIR OUTLINES NEVER\n  REPEAT. Each one has a DIFFERENT WIDEST POINT on the body and is found in a shared mass by a\n  DIFFERENT PART sticking out of it.\n  🔴 A CHILD IS NOT AN ADULT AT A SMALLER SIZE. On a child the HEAD IS THE WIDEST PART OF THE BODY and\n  the EARS ARE LONGER THAN THE HEAD IS HIGH; on an adult neither is ever true - an adult's widest point\n  is on the torso (shoulders, chest, belly or hem) and the ears are shorter than the head. This holds\n  for the three cousins and the baby as well.\n  🔴 WHO IS TOUCHING WHOM IS THE SENTENCE OF THE PAGE. Bodies are pressed together so that two, three\n  or five of them share ONE outer silhouette, and a donkey inside that mass is read only by what\n  sticks out of it - an ear, an elbow, a hoof, a skirt hem. At least two bodies overlap on every\n  page, and the figure left alone inside its own outline is the one the page is about.\n  Eyes are LIFTED, not laid on: the ink is wiped off the plate with a rag end, so each eye is a pale\n  scoop in the dark head with a soft rag edge; a dark muzzle; the mouth is ONE curve; above each eye\n  ONE short wiped stroke. 🔴 THE PLATE PRINTS ONCE - no two faces in this book come out identical, the\n  scoops sit a little differently on every page and that drift is left in, never corrected. Feeling\n  is in the mouth curve, the two brow strokes and the two long ears.\n  THE CAST, separable at thumbnail size: LULU a young donkey, the smallest standing figure,\n  round-headed, two long ears, a BLUE CORD WITH ONE BLUE BELL at the throat and nothing else blue in\n  the world · MAMA a donkey, a full-grown adult two thirds taller than Lulu, a BIB APRON, no blue ·\n  NINO a donkey, THE TALLEST AND THE NARROWEST, chest thrown forward and head tipped back, a STRAW HAT\n  (volume 01 leaves it up a tree and it stays there to the last page), no blue · ROSA a donkey, the\n  roundest and SHORTEST adult, a SKIRT to the hooves and a WAIST APRON WITH A DEEP POCKET, always in\n  motion with the skirt swinging behind her, no blue · BEPPO a donkey, the heaviest and TWICE ANYONE\n  ELSE'S WIDTH though not the tallest, a WAISTCOAT and a CROOKED STICK, no blue · THE THREE\n  COUSINS one single regulation drawn three times - same build, same cloth, told apart only by a small\n  step in height - always touching or overlapping so they read as ONE shape, no blue · THE BABY COUSIN\n  the smallest of all, always lying, carried or on somebody's back, never standing, no blue.\n  🔴 NO ADULT AND NO COUSIN EVER CARRIES BLUE. In a family this size the accent is the only thing that\n  finds the child the page is about.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - festival banners,\n  market stalls and jars stay blank or carry a single wiped shape.\n\nNOT: no airbrush, gradient, glow or 3D render / no white ink or white paint - white is wiped / no\n  drawn outline / no second printing pass.", award: "Kate Milner · It's a No-Money Day" };
  var FIXED_CHARS = [
  {
    "key": "lulu",
    "name": "룰루",
    "aliases": [
      "룰루",
      "Lulu donkey",
      "Lulu"
    ],
    "spec": "BUILD: the smallest standing figure. On the family ladder LULU 1.00 / ROSA 1.55 / MAMA 1.65 /\n  BEPPO 1.85 / NINO 1.95 she is 1.00. Head is 1/3.4 of her height and 🔴 THE HEAD IS THE WIDEST PART\n  OF HER - wider than her shoulders and wider than her hips - so her outline is a big round head on a\n  short straight tube with no waist and short legs. No adult in this book is ever built that way.\nEARS: her two ears are LONGER THAN HER HEAD IS HIGH and narrow - the longest against the head of\n  anyone. 🔴 THEIR DIRECTION IS NOT FIXED: pages turn them up, sideways and back to carry feeling.\n  Only the LENGTH is fixed, so whichever way they lie they are the part of her that comes out of the\n  top of a shared mass.\nCLOTH: one plain sleeved suit in DRY EARTH. No apron, no hat, no pocket, no tool - 🔴 nothing about\n  her can be put down or left behind.\nBLUE: a BLUE cord with ONE BLUE BELL at the throat. It is the only blue in the world and she wears it\n  on every page."
  },
  {
    "key": "mama",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mama donkey"
    ],
    "spec": "BUILD: the RECTANGLE among curves. On the family ladder LULU 1.00 / ROSA 1.55 / MAMA 1.65 /\n  BEPPO 1.85 / NINO 1.95 she is 1.65 - a full-grown adult, not a big child. Head is 1/4.5 of her\n  height and never the widest part of her. 🔴 HER SHOULDERS ARE THE WIDEST PART AND THEY ARE A STRAIGHT\n  HORIZONTAL LINE - the only flat top in the family - and the body drops from them at THE SAME WIDTH\n  to the hem: no waist, no flare, no lean. Standing, she is plumb vertical.\nAPRON: a BIB APRON in OLIVE LEAF from the chest to below the knee as ONE FLAT PANEL with STRAIGHT\n  VERTICAL SIDES and NO POCKET, over sleeves and trousers in DRY EARTH. Her front edge is therefore a\n  straight line from chest to knee - 🔴 nobody else in this book has a straight edge on the body.\nWORKING: she is the one bent over the work. When she rolls, lifts, pours or cuts she bends AT THE\n  WAIST while her legs stay vertical, and her back becomes a FLAT HORIZONTAL SHELF at shoulder height.\n  🔴 Both forelimbs work freely in front of her - her arms are never held in a fixed pose.\nEARS: shorter than her head is high, set wide."
  },
  {
    "key": "nino",
    "name": "니노 삼촌",
    "aliases": [
      "니노",
      "Nino donkey",
      "Nino"
    ],
    "spec": "BUILD: THE TALLEST AND THE NARROWEST. On the family ladder LULU 1.00 / ROSA 1.55 / MAMA 1.65 /\n  BEPPO 1.85 / NINO 1.95 he is 1.95 - his head goes higher than anyone's. Head is 1/5 of his height,\n  and his widest point, THE CHEST, is only 1.1 of his own head widths, so the whole standing figure is\n  a tall thin band. 🔴 He is HALF the width of Beppo and clearly narrower than Mama.\nTHE BACKWARD LEAN: his chest is pushed FORWARD and his shoulders and head go BACK, so the line from\n  hoof to crown is a shallow BACKWARD C and his chin rides above everyone. In a pile of bodies HIS\n  HEAD IS THE HIGHEST THING AND IT IS TIPPED BACK - that is how he is found, hat or no hat.\nTHE TWO HOLES: his arms are held AWAY from his ribs - hands in pockets, thumbs in the waistcoat, or\n  hands on hips - leaving a WEDGE OF BARE PAPER between each arm and his body. 🔴 He is the only\n  figure in this book with holes wiped through the middle of his silhouette.\nHAT: a broad STRAW HAT in DRY EARTH. 🔴 IT COMES OFF - one volume leaves it in a tree for four spreads\n  and another drops it on the ground. It confirms him; it never identifies him.\nEARS: shorter than his head is high, narrow, and they follow the tilt of the head."
  },
  {
    "key": "rosa",
    "name": "로사 이모",
    "aliases": [
      "로사",
      "Rosa donkey",
      "Rosa"
    ],
    "spec": "BUILD: the roundest adult and the SHORTEST adult. On the family ladder LULU 1.00 / ROSA 1.55 /\n  MAMA 1.65 / BEPPO 1.85 / NINO 1.95 she is 1.55. Head is 1/4 of her height. 🔴 THE WIDEST PART OF HER\n  IS AT THE FLOOR: the skirt hem is 2.4 of her own head widths, wider than her shoulders, so her whole\n  outline is a TRIANGLE STANDING ON ITS BASE.\nNO GAP: the skirt reaches the hooves and 🔴 SHE IS THE ONLY FIGURE IN THE BOOK WITH NO OPEN PAPER\n  BETWEEN THE LEGS - every other donkey shows two legs and a gap; she never does.\nTHE SWINGING HEM: she is always mid-stride, and the hem swings out to one side and trails behind, so a\n  WEDGE OF SKIRT sticks out AT FLOOR LEVEL from any mass she is part of. 🔴 She is read at the bottom\n  of a pile, where nobody else is read.\nAPRON: a WAIST apron in OLIVE LEAF, from the waist down only, flaring with the skirt, with ONE DEEP\n  POCKET. It confirms her; it never identifies her.\nEARS: shorter than her head is high, set close together."
  },
  {
    "key": "beppo",
    "name": "베포 큰아버지",
    "aliases": [
      "베포",
      "큰아버지",
      "Beppo donkey",
      "Beppo"
    ],
    "spec": "BUILD: THE WIDEST THING IN THE BOOK. On the family ladder LULU 1.00 / ROSA 1.55 / MAMA 1.65 /\n  BEPPO 1.85 / NINO 1.95 he is 1.85 - 🔴 he is NOT the tallest, Nino's head goes higher, but he is the\n  biggest because he is TWICE ANYONE ELSE'S WIDTH. Head is 1/5.5 of his height, the smallest head\n  against the body of anyone, and it sits on top of the barrel looking small on it.\nTHE BARREL: shoulders, chest and belly are ONE UNBROKEN CURVE and the widest point is THE BELLY, at\n  the middle of his height, 2.6 of his own head widths. Legs are short and thick under it, with a gap\n  between them. From behind he is one round mass. 🔴 In a pile of bodies HE IS THE BULGE - the shared\n  silhouette swells out at waist height wherever he is, and that swelling is him.\nCLOTH: a WAISTCOAT in OLIVE LEAF that stops ABOVE the belly, so the DRY EARTH belly is the widest\n  thing showing, over sleeves and trousers.\nSTICK: a CROOKED STICK in DRY EARTH. 🔴 IT LEAVES HIS HAND - it rides on the sacks for half of one\n  volume and leans on a chair in another. It confirms him; it never identifies him.\nEARS: shorter than his head is high, thick, set wide."
  }
];
  var FACE = {"lulu":"🫏","mama":"🫏","nino":"🫏","rosa":"🫏","beppo":"🫏"};

  (function injectCss() {
    if (document.getElementById('sr-core-style')) return;
    var css = [
      '.batch-bar{background:#fff;border:1.5px solid var(--slope);border-radius:14px;padding:14px 18px;margin:16px 0 24px;}',
      '.batch-bar .bhead{font-size:14px;font-weight:900;margin-bottom:4px;}',
      '.batch-bar .bhint{font-size:12px;color:var(--ink-soft);margin-bottom:12px;line-height:1.6;}',
      '.batch-bar .brow{display:flex;gap:8px;flex-wrap:wrap;}',
      '.batch-btn{background:var(--slope);color:#fff;border:none;border-radius:999px;padding:9px 20px;font-weight:800;font-size:13px;cursor:pointer;}',
      '.batch-btn:hover{filter:brightness(1.15);}.batch-btn.done{background:var(--accent);}',
      '.anchor-chip{display:inline-block;background:var(--peach);border-radius:999px;padding:2px 11px;font-size:11.5px;font-weight:800;margin-left:6px;}',
      '.guest-section{background:#fff;border:1.5px solid var(--accent);border-radius:16px;padding:18px 20px;margin:16px 0 24px;}',
      '.guest-section h3{font-size:16px;font-weight:900;color:var(--accent);margin:0 0 6px;}',
      '.guest-section .ghint{font-size:12px;color:var(--ink-soft);line-height:1.6;margin-bottom:12px;}',
      '.guest-section .char-prompt{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0;background:var(--cream);}',
      '.guest-section .char-prompt .head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.guest-section pre{white-space:pre-wrap;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:12px;line-height:1.6;margin-top:6px;color:var(--ink-soft);}',
      '.ref-strip{display:flex;align-items:center;gap:7px;flex-wrap:wrap;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:8px 12px;margin:0 0 22px;}',
      '.ref-strip .ref-lab{font-size:11.5px;font-weight:800;color:var(--ink-soft);flex:0 0 auto;margin-right:2px;}',
      '.ref-chip{display:flex;align-items:center;gap:6px;background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:3px 11px 3px 3px;}',
      '.ref-chip img{width:30px;height:30px;border-radius:50%;object-fit:cover;background:#fff;flex:0 0 auto;}',
      '.ref-chip .ph{width:30px;height:30px;border-radius:50%;background:var(--peach);display:flex;align-items:center;justify-content:center;font-size:16px;flex:0 0 auto;}',
      '.ref-chip b{font-size:11.5px;font-weight:800;color:var(--ink);white-space:nowrap;}',
      '.ref-chip .im{color:var(--accent);font-weight:900;}.ref-chip.guest{border-color:var(--accent);}',
      '#doc-tabs{display:none;}',
      '#ep-toggle{position:fixed;top:10px;left:10px;z-index:1002;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '#ep-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;opacity:0;pointer-events:none;transition:opacity .25s;}',
      '#ep-side{position:fixed;top:0;left:0;height:100vh;width:300px;max-width:85vw;background:#fff;z-index:1001;box-shadow:2px 0 16px rgba(0,0,0,.18);transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}',
      'body.ep-open #ep-side{transform:translateX(0);}',
      '#ep-side .ep-head{padding:12px 14px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;}',
      '#ep-side .ep-head b{font-size:15px;flex:1;}#ep-summary{font-size:12px;color:var(--ink-soft);}',
      '#ep-close{border:0;background:transparent;font-size:16px;cursor:pointer;color:var(--ink-soft);padding:2px 4px;}',
      '.ep-plan{display:block;margin:10px 12px 6px;padding:10px 13px;border-radius:10px;background:var(--peach);color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;border:1px solid var(--line);}',
      '.ep-plan:hover,.ep-plan.active{background:var(--accent);color:#fff;border-color:var(--accent);}',
      '#ep-list{overflow-y:auto;padding:4px 0;flex:1;}',
      '.ep-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #f1f1f1;}',
      '.ep-item .n{flex:0 0 22px;text-align:right;color:var(--ink-soft);font-weight:800;font-size:12px;}',
      '.ep-item a{flex:1;color:var(--ink);text-decoration:none;font-size:13px;font-weight:600;line-height:1.3;word-break:keep-all;}',
      '.ep-item a:hover{color:var(--accent);text-decoration:underline;}.ep-item.active a{color:var(--accent);font-weight:800;}',
      '.ep-item.done a{text-decoration:line-through;color:var(--ink-soft);}',
      '.ep-badge,.ep-memo{flex:0 0 auto;cursor:pointer;border:0;background:transparent;line-height:1;padding:3px;border-radius:6px;}',
      '.ep-badge{font-size:15px;}.ep-memo{font-size:14px;opacity:.35;}.ep-memo.has{opacity:1;}',
      '.ep-badge:hover,.ep-memo:hover{background:#f1f1f1;}',
      '#ep-memo-modal{position:fixed;inset:0;z-index:1003;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;padding:16px;}',
      '#ep-memo-modal.on{display:flex;}',
      '#ep-memo-modal .box{background:#fff;border-radius:14px;width:min(480px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;}',
      '#ep-memo-modal .mhead{padding:14px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:15px;word-break:keep-all;}',
      '#ep-memo-modal textarea{border:0;outline:none;resize:none;padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.6;min-height:180px;flex:1;background:#fff;}',
      '#ep-memo-modal .mrow{display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid var(--line);}',
      '#ep-memo-modal button{border:0;border-radius:9px;padding:9px 18px;font-weight:800;font-size:13px;cursor:pointer;}',
      '#ep-memo-modal .save{background:var(--accent);color:#fff;}#ep-memo-modal .cancel{background:#eee;color:var(--ink-soft);}',
      'body.ep-open #ep-backdrop{opacity:1;pointer-events:auto;}',
      '@media(min-width:1024px){body.ep-open #ep-backdrop{opacity:0;pointer-events:none;}}',
    ].join('');
    var s = document.createElement('style');
    s.id = 'sr-core-style'; s.textContent = css;
    document.head.appendChild(s);
  })();

  var GUESTS = (window.SH_GUESTS || []).slice();
  var ALL = FIXED_CHARS.concat(GUESTS);
  var NF = FIXED_CHARS.length;
  ALL.forEach(function (c, i) { c.img = i < NF ? i + 1 : i - NF + 9; });
  var IS_GUEST = {}; GUESTS.forEach(function (g) { IS_GUEST[g.key] = true; });

  // 🔴 **긴 별칭부터 찾고, 찾은 자리는 지운다.** 인물마다 따로 부분문자열을 찾으면
  //    「타로 엄마가 …」 한 줄에서 **타로도 같이 걸린다**(타로 ⊂ 타로 엄마). 그러면 엄마만 나오는
  //    쪽의 [등장]에 아이가 붙어 화가가 없는 인물을 그린다. 이름을 바꿔서는 못 푼다 —
  //    「타로 엄마」에는 어차피 「타로」가 들어 있다. 빌더의 별칭 충돌 가드는 그대로 두되(설계 경고),
  //    감지는 여기서 정확해진다.
  function detectChars(sceneText) {
    var rest = String(sceneText || '').toLowerCase();
    var pairs = [];
    ALL.forEach(function (c) {
      (c.aliases || [c.name]).forEach(function (n) { pairs.push({ key: c.key, n: String(n).toLowerCase() }); });
    });
    pairs.sort(function (a, b) { return b.n.length - a.n.length; });
    var found = {};
    pairs.forEach(function (p) {
      if (!p.n) return;
      var at = rest.indexOf(p.n);
      while (at !== -1) {
        found[p.key] = true;
        // 지운 자리는 같은 길이의 공백으로 — 뒤 별칭의 위치가 안 밀린다
        rest = rest.slice(0, at) + new Array(p.n.length + 1).join(' ') + rest.slice(at + p.n.length);
        at = rest.indexOf(p.n);
      }
    });
    return found;
  }

  function sceneHasChar(sceneText, c) {
    return detectChars(sceneText)[c.key] === true;
  }

  // 🔴 이름만 적으면 시트를 안 붙였을 때 모델이 알아서 그린다 — 코코는 시트가 정확한데도 쪽마다
  //    몸 색이 갈색·파랑으로 갈렸다(2026-08-17 사용자). 손으로 쓴 코코·메이 프롬프트는 이 자리에
  //    인물 설명을 한 줄씩 달고 있었고, 생성기가 그걸 안 물려받았다. 규격 첫 줄을 같이 싣는다.
  function castLegend(pages) {
    return ALL.map(function (c) {
      var on = !pages || pages.some(function (p) { return sceneHasChar(p.scene, c); });
      var gist = String(c.spec || c.desc || '').replace(/^[-•\s]+/, '').split('\n')[0].slice(0, 110);
      return '@image' + c.img + ' = ' + c.name + (c.aliases[1] ? ' (' + c.aliases[1] + ')' : '') +
        (gist ? ': ' + gist : '') + (on ? '' : '  (이 화 미등장 — 첨부 불필요)');
    }).join('\n');
  }

  function composeBatchPrompt(pages) {
    var head = [
      ANCHOR.text,
      '',
      '[캐릭터 레퍼런스] 위 CHARACTER DESIGN LANGUAGE 는 이 세계 전체의 규격이고, 각 인물의 규격은 첨부한 시트다.',
      '아래 @imageN 순서대로 시트를 첨부하고,',
      '얼굴·비율·색은 시트와 100% 동일하게 유지한다. @image1~' + NF + ' = 고정 캐스트(항상 이 순서), @image9~ = 이 화 단역.',
      castLegend(pages),
      '※ 각 쪽 [등장]에 적힌 @imageN 만 그 컷에 그린다. 나머지는 넣지 않는다.',
      '',
      '[출력 규칙]',
      '- 아래 ' + pages.length + '개 장면을 각각 독립된 16:9 스프레드로 그린다 (총 ' + pages.length + '장, 쪽 순서대로).',
      '- 같은 인물의 얼굴·비율·색을 모든 장면에서 동일하게 유지한다.',
      '- 🔴 그림 안에 글자·숫자·문자를 절대 넣지 않는다.',
    ].join('\n');
    var body = pages.map(function (p) {
      var on = ALL.filter(function (c) { return sceneHasChar(p.scene, c); });
      var appear = on.map(function (c) { return '@image' + c.img + '(' + c.name + ')'; }).join(', ');
      return '━━━━━━━━━━ ' + p.label + ' ━━━━━━━━━━\n[등장] ' + (appear || '(배경/사물 컷)') + '\n' + p.scene.trim();
    }).join('\n\n');
    return head + '\n\n' + body;
  }

  /** 캐릭터 한 명 시트. 고정 캐스트·단역 공용 — 기획서 카드도 이걸 부른다(사본 금지). */
  function sheetPrompt(charOrKey) {
    var g = typeof charOrKey === 'string' ? ALL.find(function (c) { return c.key === charOrKey; }) : charOrKey;
    if (!g) return '';
    // 🔴 시트는 마젠타 배경에 인물 하나다 — 무대 조항(마을·비·물·밤)이 들어갈 자리가 없고,
    //    개체를 가르라는 지시를 그만큼 묽게 만든다. 컷 프롬프트(composeBatchPrompt)에서는 그대로 쓴다.
    var world = ANCHOR.text.replace(/\nSTAGE CLAUSES[\s\S]*?(?=\n[A-Z])/, '');
    return [
      world,
      '',
      // 🔴 매체는 글로 안 전해진다. 유키 시트는 아이가 부드러운 그러데이션 카툰, 할머니가 접힘을 다
      //    그린 사실화로 나왔다 — 앵커에 `SHADING IS ZERO`·`한 획을 두 번 덧긋지 않는다` 가 있는데도.
      //    단권 99권은 화면에 수상작 원본이 떠 있었고 시리즈는 글만 있었다. 그림 한 장이 그 자리를 메운다.
      ANCHOR.award ? '[매체 참조] 🔴 이 프롬프트와 함께 **앵커 원본 그림 한 장을 반드시 첨부**한다 — '
        + ANCHOR.award + '. 획·자국·결·가장자리는 아래 글이 아니라 그 그림이 정한다.' : null,
      '[출력] 정사각 1024x1024. 배경은 순수 마젠타 #FF00FF 단색, 인물을 가운데 두고 여백 8%.',
      '바닥 그림자 없음, 글자·라벨 없음, 다른 인물 없음.',
      '[인물] ' + g.name + (g.aliases[1] ? ' — ' + g.aliases[1] : '') + '. 위 CHARACTER DESIGN LANGUAGE 의 규격을 그대로 따른다.',
      // 🔴 이 줄이 없으면 한 시리즈의 넷이 **이름만 다른 같은 지시**를 받는다. 앵커는 그 세계 전체를
      //    말하지 한 사람을 말하지 않으므로, 개체를 가르는 것은 여기서 들어와야 한다.
      g.spec ? '[이 인물만의 규격 — 위 규격에 덧쓴다]\n' + g.spec : null,
      '[배치] 같은 인물을 한 장에 — 전신 정면, 3/4 걷는 모습, 뒷모습. 이 인물 하나만.',
    ].filter(function (l) { return l !== null; }).join('\n');
  }

  function collectPages() {
    return Array.prototype.map.call(document.querySelectorAll('.page-card[data-page]'), function (card) {
      var pre = card.querySelector('pre.scene');
      var headB = card.querySelector('.page-head b');
      var pnum = card.querySelector('.pnum');
      var label = ((pnum ? pnum.textContent.trim() + ' ' : '') + (headB ? headB.textContent.trim() : card.getAttribute('data-page'))).trim();
      return { card: card, page: card.getAttribute('data-page'), label: label, scene: pre ? pre.textContent : '' };
    });
  }

  function flash(btn, label, done) {
    var orig = btn.getAttribute('data-orig') || btn.textContent;
    btn.setAttribute('data-orig', orig);
    btn.textContent = label; if (done) btn.classList.add('done');
    setTimeout(function () { btn.textContent = orig; btn.classList.remove('done'); }, 1600);
  }
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); flash(btn, '복사됨 ✓', true); }
    catch (e) { window.prompt('복사가 막혔어요 — 직접 복사하세요:', text); }
  }

  function makePasteBox(assetApi, key, initialUrl) {
    var box = document.createElement('div'); box.className = 'paste-box'; box.tabIndex = 0;
    var hint = '🖼️ 클릭 후 Ctrl+V — 생성한 그림 붙여넣기';
    function reset() { box.classList.remove('has-img'); box.innerHTML = ''; box.textContent = hint; }
    function setImg(url) {
      box.classList.add('has-img');
      box.innerHTML = '<img src="' + url + '" alt="" /><button type="button" class="paste-del">✕</button>';
      box.querySelector('.paste-del').addEventListener('click', async function (e) {
        e.stopPropagation(); if (!confirm('이 이미지를 삭제할까요?')) return;
        try { await fetch(assetApi + '/' + key, { method: 'DELETE' }); reset(); } catch (err) { alert('삭제 실패 — 서버 확인'); }
      });
    }
    if (initialUrl) setImg(initialUrl + '?t=' + Date.now()); else box.textContent = hint;
    async function upload(file) {
      if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
      box.classList.add('busy'); var fr = new FileReader();
      fr.onload = async function () {
        try {
          var r = await fetch(assetApi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key, dataUrl: fr.result }) });
          var j = await r.json();
          if (j.success) setImg(j.data.url + '?t=' + Date.now()); else alert('저장 실패: ' + (j.error || ''));
        } catch (e) { alert('저장 실패 — 서버 확인'); }
        box.classList.remove('busy');
      };
      fr.readAsDataURL(file);
    }
    box.addEventListener('paste', function (e) {
      var its = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < its.length; i++) if (its[i].type && its[i].type.indexOf('image/') === 0) { e.preventDefault(); upload(its[i].getAsFile()); return; }
    });
    box.addEventListener('dragover', function (e) { e.preventDefault(); });
    box.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) upload(f); });
    box.addEventListener('click', function () { box.focus(); });
    return box;
  }

  async function mountPasteSlots(docId, root) {
    var api = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(api); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-paste]'), function (slot) {
      var k = slot.getAttribute('data-paste');
      slot.appendChild(makePasteBox(api, k, assets[k]));
    });
  }

  window.SERIES = { key: KEY, anchor: ANCHOR, cast: FIXED_CHARS, copyText: copyText, sheetPrompt: sheetPrompt, mountPasteSlots: mountPasteSlots };

  // ── 좌측 회차 사이드바 (상태·메모는 /api/saenghwal-* 공유, docId 가 달라 무충돌) ──
  (async function () {
    var toggle = document.createElement('button');
    toggle.id = 'ep-toggle'; toggle.type = 'button'; toggle.textContent = '☰ 회차';
    var backdrop = document.createElement('div'); backdrop.id = 'ep-backdrop';
    var side = document.createElement('aside'); side.id = 'ep-side';
    side.innerHTML = '<div class="ep-head"><b>회차 목록</b><span id="ep-summary"></span>' +
      '<button id="ep-close" type="button" aria-label="닫기">✕</button></div>' +
      '<a class="ep-plan" href="/' + KEY + '-plan.html">📘 기획서 · 캐스트 시트 · 앵커</a><div id="ep-list"></div>';
    document.body.appendChild(toggle); document.body.appendChild(backdrop); document.body.appendChild(side);
    var list = side.querySelector('#ep-list'), summary = side.querySelector('#ep-summary');
    function open(o) { document.body.classList.toggle('ep-open', o); }
    toggle.addEventListener('click', function () { open(!document.body.classList.contains('ep-open')); });
    backdrop.addEventListener('click', function () { open(false); });
    side.querySelector('#ep-close').addEventListener('click', function () { open(false); });

    var STATUS_API = '/api/saenghwal-status', MEMO_API = '/api/saenghwal-memo';
    var status = {}, memo = {};
    try { var rs = await fetch(STATUS_API); var js = await rs.json(); status = (js && js.data) || {}; } catch (e) {}
    try { var rm = await fetch(MEMO_API); var jm = await rm.json(); memo = (jm && jm.data) || {}; } catch (e) {}

    var modal = document.createElement('div'); modal.id = 'ep-memo-modal';
    modal.innerHTML = '<div class="box"><div class="mhead"></div><textarea placeholder="이 회차 메모…"></textarea>' +
      '<div class="mrow"><button class="cancel" type="button">취소</button><button class="save" type="button">저장</button></div></div>';
    document.body.appendChild(modal);
    var mHead = modal.querySelector('.mhead'), mTa = modal.querySelector('textarea'), cur = null;
    function closeModal() { modal.classList.remove('on'); cur = null; }
    function openMemo(docId, title, onSaved) {
      cur = { docId: docId, onSaved: onSaved }; mHead.textContent = title;
      mTa.value = memo[docId] || ''; modal.classList.add('on');
      setTimeout(function () { mTa.focus(); }, 30);
    }
    modal.querySelector('.cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelector('.save').addEventListener('click', async function () {
      if (!cur) return;
      var docId = cur.docId, onSaved = cur.onSaved, text = mTa.value, prev = memo[docId] || '';
      if (text.trim()) memo[docId] = text; else delete memo[docId];
      if (onSaved) onSaved(!!text.trim());
      closeModal();
      try {
        var r = await fetch(MEMO_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId: docId, memo: text }) });
        if (!r.ok) throw new Error('http');
      } catch (err) {
        if (prev) memo[docId] = prev; else delete memo[docId];
        if (onSaved) onSaved(!!prev);
        alert('메모 저장 실패 — 서버 확인');
      }
    });

    var idx = [];
    try { var ri = await fetch('/' + KEY + '-index.json'); idx = await ri.json(); } catch (e) {}
    var eps = idx.filter(function (e) { return e.file && e.file !== KEY + '-plan.html'; }).map(function (e) {
      var m = (e.label || '').match(/(\d+)/);
      return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || e.label };
    }).sort(function (a, b) { return a.num - b.num; });

    var here = location.pathname.split('/').pop() || '';
    if (here === KEY + '-plan.html' || here === '') {
      var pl = side.querySelector('.ep-plan'); if (pl) pl.classList.add('active');
    }
    var CYCLE = { '': 'wip', 'wip': 'done', 'done': '' };
    var ICON = { '': '⬜', 'wip': '🟡', 'done': '✅' };
    var LABEL = { '': '미정', 'wip': '진행 중', 'done': '완성' };
    function updateSummary() {
      var d = 0, w = 0;
      eps.forEach(function (e) { var s = status[e.docId] || ''; if (s === 'done') d++; else if (s === 'wip') w++; });
      summary.textContent = '✅ ' + d + ' · 🟡 ' + w + ' / ' + eps.length;
    }
    eps.forEach(function (e) {
      var s = status[e.docId] || '';
      var row = document.createElement('div');
      row.className = 'ep-item' + (e.file === here ? ' active' : '') + (s === 'done' ? ' done' : '');
      var n = document.createElement('span'); n.className = 'n'; n.textContent = e.num;
      var a = document.createElement('a'); a.href = e.file; a.textContent = e.title;
      var mbtn = document.createElement('button');
      mbtn.type = 'button'; mbtn.className = 'ep-memo' + (memo[e.docId] ? ' has' : ''); mbtn.textContent = '📝';
      mbtn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        openMemo(e.docId, e.title, function (has) { mbtn.classList.toggle('has', has); });
      });
      var badge = document.createElement('button');
      badge.type = 'button'; badge.className = 'ep-badge'; badge.textContent = ICON[s]; badge.title = LABEL[s] + ' (클릭하여 변경)';
      badge.addEventListener('click', async function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var prev = status[e.docId] || '', next = CYCLE[prev];
        if (next) status[e.docId] = next; else delete status[e.docId];
        badge.textContent = ICON[next]; badge.title = LABEL[next] + ' (클릭하여 변경)';
        row.classList.toggle('done', next === 'done'); updateSummary();
        try {
          var r = await fetch(STATUS_API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docId: e.docId, status: next }) });
          if (!r.ok) throw new Error('http');
        } catch (err) {
          if (prev) status[e.docId] = prev; else delete status[e.docId];
          badge.textContent = ICON[prev]; row.classList.toggle('done', prev === 'done'); updateSummary();
          alert('상태 저장 실패 — 서버 확인');
        }
      });
      row.appendChild(n); row.appendChild(a); row.appendChild(mbtn); row.appendChild(badge);
      list.appendChild(row);
    });
    updateSummary();
    if (window.innerWidth >= 1024) open(true);
  })();

  // ── 전체 묶음 프롬프트 + 쪽별 복사 + 붙여넣기 ──
  (async function () {
    var pages = collectPages();
    if (!pages.length) return;

    var hero = document.querySelector('header.hero');
    if (hero) {
      var bar = document.createElement('div');
      bar.className = 'batch-bar';
      bar.innerHTML =
        '<div class="bhead">🖼️ 전체 이미지 프롬프트 — GPT에 한 번에<span class="anchor-chip">' + ANCHOR.name + '</span></div>' +
        '<div class="bhint">버튼을 누르면 <b>앵커(1회) + 캐릭터 레퍼런스(@image1~' + NF + ') + ' + pages.length +
        '개 쪽 장면</b>이 하나로 복사됩니다. GPT에 <b>@image1부터 순서대로 캐스트 시트를 첨부</b>하세요. 각 쪽 [등장]이 그 컷에 넣을 인물을 지정합니다.</div>' +
        '<div class="brow"><button type="button" class="batch-btn" id="copy-all-scene">📋 전체 프롬프트 복사 (' + pages.length + '장)</button></div>';
      hero.parentNode.insertBefore(bar, hero.nextSibling);
      document.getElementById('copy-all-scene').addEventListener('click', function () {
        copyText(composeBatchPrompt(pages.map(function (p) { return { label: p.label, scene: p.scene }; })), this);
      });
    }

    pages.forEach(function (p) {
      var btn = p.card.querySelector('.copy-btn');
      if (!btn) return;
      var clone = btn.cloneNode(true); btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener('click', function () { copyText(composeBatchPrompt([{ label: p.label, scene: p.scene }]), clone); });
    });

    var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var ASSET_API = '/api/comic-assets/' + docId;
    var assets = {};
    try { var r = await fetch(ASSET_API); var j = await r.json(); assets = (j && j.data) || {}; } catch (e) {}

    (function () {
      var appearing = ALL.filter(function (c) { return pages.some(function (p) { return sceneHasChar(p.scene, c); }); });
      if (!appearing.length) return;
      var strip = document.createElement('div');
      strip.className = 'ref-strip';
      strip.innerHTML = '<span class="ref-lab">🎬 이 화 등장</span>' + appearing.map(function (c) {
        var url = IS_GUEST[c.key] ? assets[c.key] : null;
        var thumb = url ? '<img src="' + url + '?t=' + Date.now() + '" alt="" />' : '<span class="ph">' + (FACE[c.key] || '🎭') + '</span>';
        return '<div class="ref-chip' + (IS_GUEST[c.key] ? ' guest' : '') + '" data-key="' + c.key + '">' + thumb +
          '<b><span class="im">@image' + c.img + '</span> ' + c.name + '</b></div>';
      }).join('');
      var first = document.querySelector('.page-card');
      if (first) first.parentNode.insertBefore(strip, first);
      fetch('/api/comic-assets/' + KEY + '-plan').then(function (r) { return r.json(); }).then(function (j) {
        var plan = (j && j.data) || {};
        appearing.forEach(function (c) {
          if (IS_GUEST[c.key] || !plan[c.key]) return;
          var box = strip.querySelector('.ref-chip[data-key="' + c.key + '"]');
          var ph = box && box.querySelector('.ph');
          if (ph) ph.outerHTML = '<img src="' + plan[c.key] + '?t=' + Date.now() + '" alt="" />';
        });
      }).catch(function () {});
    })();

    pages.forEach(function (p) { p.card.appendChild(makePasteBox(ASSET_API, p.page, assets[p.page])); });

    if (GUESTS.length) {
      var sec = document.createElement('div');
      sec.className = 'guest-section';
      sec.innerHTML = '<h3>🎭 이 화 새 인물(단역) 레퍼런스</h3>' +
        '<div class="ghint">이 화에만 나오는 단역입니다(@image9~). ① [시트 프롬프트 복사] → GPT로 시트 생성 → ② 아래 박스에 붙여넣어 확정하세요. <b>@image1~' + NF + ' 고정 캐스트 시트는 📘 기획서에서.</b></div>' +
        GUESTS.map(function (g) {
          return '<div class="char-prompt" data-guest="' + g.key + '"><div class="head"><b>@image' + g.img + ' · ' + g.name + '</b>' +
            '<button type="button" class="copy-btn">📋 시트 프롬프트 복사</button></div>' +
            '<details><summary>프롬프트 보기</summary><pre></pre></details></div>';
        }).join('');
      var firstPage = document.querySelector('.page-card');
      if (firstPage) firstPage.parentNode.insertBefore(sec, firstPage);
      GUESTS.forEach(function (g) {
        var card = sec.querySelector('.char-prompt[data-guest="' + g.key + '"]');
        card.querySelector('pre').textContent = sheetPrompt(g);
        var btn = card.querySelector('.copy-btn');
        btn.addEventListener('click', function () { copyText(sheetPrompt(g), btn); });
        card.appendChild(makePasteBox(ASSET_API, g.key, assets[g.key]));
      });
    }
  })();
})();

/* 본문 인라인 편집 — 브라우저에서 고쳐 R2 에 저장한다.
 * 🔴 SSOT 는 docs/changjak-books/lulu/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'lulu';
  var docId = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (docId.indexOf(KEY + '-') !== 0 || !/\d+$/.test(docId)) return;
  var API = '/api/changjak-text/' + docId;

  var st = document.createElement('style');
  st.textContent =
    '.page-card p.ko{outline:none;border-radius:8px;margin:8px -6px 10px;padding:4px 6px;transition:background .12s}' +
    '.page-card p.ko:hover,.page-card p.ko:focus{background:#fff6ec}' +
    '.page-card p.ko:focus{box-shadow:0 0 0 2px var(--peach)}' +
    '.page-card{position:relative}' +
    '.ko-tag{position:absolute;top:14px;right:16px;font-size:10.5px;font-weight:800;opacity:0;transition:opacity .15s;pointer-events:none}' +
    '.ko-tag.on{opacity:1}.ko-tag.saving{color:var(--ink-soft)}.ko-tag.saved{color:var(--slope)}.ko-tag.err{color:var(--accent)}' +
    '.ko-edited{border-color:var(--accent)}' +
    '.edit-hint{background:#FDF3EC;border:1px solid var(--accent);border-radius:12px;padding:11px 15px;font-size:12.5px;margin:14px 0}';
  document.head.appendChild(st);

  var hint = document.createElement('div');
  hint.className = 'edit-hint';
  hint.innerHTML = '✏️ <b>본문을 눌러 바로 고칠 수 있습니다.</b> 고친 내용은 R2 에 저장되어 이 화면에만 얹힙니다 — <b>원고 파일(.md)은 안 바뀝니다.</b> 되돌리려면 내용을 비우고 화면을 벗어나세요.';

  var cards = Array.prototype.slice.call(document.querySelectorAll('.page-card[data-page]'));
  if (!cards.length) return;
  cards[0].parentNode.insertBefore(hint, cards[0]);

  var items = cards.map(function (card) {
    var ko = card.querySelector('p.ko');
    if (!ko) return null;
    var page = card.dataset.page, base = ko.innerText.replace(/\s+$/, '');
    var tag = document.createElement('span'); tag.className = 'ko-tag'; card.appendChild(tag);
    ko.contentEditable = 'plaintext-only';
    var timer = null, saved = base;
    function mark(cls, txt) {
      tag.className = 'ko-tag on ' + cls; tag.textContent = txt;
      if (cls !== 'saving') setTimeout(function () { tag.className = 'ko-tag'; }, 1600);
    }
    function save() {
      var text = ko.innerText.replace(/\s+$/, '');
      if (text === saved) return;
      mark('saving', '저장 중…');
      fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: page, text: text === base ? '' : text }) })
        .then(function (r) {
          if (!r.ok) throw new Error('http');
          saved = text; card.classList.toggle('ko-edited', text !== base);
          mark('saved', text === base ? '원본 복귀' : '저장됨');
        }).catch(function () { mark('err', '저장 실패 — 서버 확인'); });
    }
    ko.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(save, 900); });
    ko.addEventListener('blur', function () { clearTimeout(timer); save(); });
    return { page: page, apply: function (t) { ko.innerText = t; saved = t; card.classList.add('ko-edited'); } };
  }).filter(Boolean);

  fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    var d = (j && j.data) || {}, n = 0;
    items.forEach(function (it) { if (typeof d[it.page] === 'string' && d[it.page] !== '') { it.apply(d[it.page]); n++; } });
    if (n) hint.innerHTML = '✏️ <b>이 화면의 ' + n + '쪽은 여기서 고친 내용입니다</b> — 원고 파일(.md)과 다릅니다. 되돌리려면 그 쪽을 비우고 화면을 벗어나세요.';
  }).catch(function () {});
})();
