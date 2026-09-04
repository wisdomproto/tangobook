/*
 * 도도네 물방앗간 — 회차 공용 스크립트.
 * 🔴 이 파일은 생성물이다. 고치지 말고 `scripts/_series-core.template.js` 를 고친 뒤
 *    `node packages/client/scripts/build-series-html.mjs` 로 여덟 시리즈를 다시 구워라.
 *    (시리즈 01~03 을 세 번 포크하며 같은 버그를 세 번 옮긴 뒤 생성 방식으로 바꿨다.)
 * 🔴 앵커는 `docs/art-direction/dodo-anchor.md` 에서 **빌드 때 통째로 주입**된다 —
 *    사본이 없으므로 「고칠 땐 문서와 core 양쪽을」이 없다. 문서만 고치고 다시 구우면 된다.
 * 전제 마크업: 각 쪽 = <div class="page-card" data-page="pN"> … <pre class="scene">SCENE</pre> </div>
 */
(function () {
  'use strict';

  var KEY = 'dodo';
  var ANCHOR = { slug: 'dodo-gouachemill', name: '앵커 dodo-gouachemill', text: "STYLE ANCHOR - dodo-gouachemill   (a duck family at a French watermill / gouache, the brush stops short)\n\nStyle: gouache on warm flour-cream paper, TWO colours that paint the world, ONE accent that touches\n  nothing but the two children's cloth, and CHALK, which is the paper colour in a tube and not a\n  colour at all, 4-6 year old picture book. Every area\n  is laid with a flat brush in visible strokes that STOP SHORT of the outline, so a rim of bare paper\n  is left around most shapes and THE PAPER DRAWS THE EDGE INSTEAD OF A LINE - there is no outline\n  anywhere in this book. The paint is opaque and matte and is never thinned to a wash. Where the two\n  colours overlap wet, a third darker colour appears - that is the only dark. Unpainted paper is not\n  white space, it is the sky, the flour and the light. SHADING IS ZERO - no modelling, no gradient,\n  no highlight. 🔴 EXCEPT a shadow LYING ON THE GROUND, which is not a darkness but a FLAT SHAPE:\n  ONE sweep of MILLPOND on the WHEAT ground, hard edged the whole way round, 0 interior, a\n  bare-paper rim between it and the feet that own it. Never on a body, never on a face, and only\n  where the script makes the shadow the event - the length of it - and nowhere else.\n\nRENDERING (finish hierarchy): an area is ONE sweep of ONE colour, never lighter or darker inside\n  itself; the only variation is where one brush stroke ends and the next begins. FINISHED THINGS PER\n  PAGE = 2, the duckling the page is about and the one thing that duckling touches; everything else\n  is a shape with no interior detail. Repeats are capped and the cap is the whole design: the water\n  wheel has at most 8 paddles · stepping stones at most 7 · trees at most 5 · reeds at most 7 strokes\n  · windows at most 8 · planks at most 6 · sacks at most 6 · flowers at most 9 · straw at most 11\n  strokes · steam at most 5 curls · a crowd at most 7 silhouettes with 0 faces and 0 hands · stars at\n  most 14 bare paper points. Nothing in a repeat is a mirrored copy of its neighbour.\n  DENSITY RATION = none.\n  🔴 CHALK - gouache can lay the paper colour back ON TOP of paint, and that is the one thing this\n  medium can do that no other can. CHALK IS NOT A FIFTH COLOUR, IT IS PAPER IN A TUBE. It is used\n  ONLY for what is thrown UP off a coloured field: splash, spray, flour dust, falling snow, mist over\n  water. At most 9 separate CHALK marks per page, each one single opaque stroke with a hard edge. It\n  is never a highlight on a form, never an outline, never blended, and never laid on bare paper.\n  🔴 EXTREME CLOSE - when one thing fills the frame the finish does NOT go up a step. The brush is\n  the same width, so a thing filling the frame is made of FEWER strokes, not more, and the bare\n  paper rim round it gets WIDER, never thinner. No interior appears that the thing does not have on\n  a wide page, and the caps above do not rise because the thing got bigger.\n\nPALETTE: PAPER FLOUR CREAM #F5EFDF, sky, flour, mist, light, everything not painted, and Mommy's\n  apron · COLOUR1 MILLPOND #4E7D77, the stream, the pond, reeds, willow, shutters, doors, anything\n  painted - the cool one · COLOUR2 WHEAT #B08A50, the wheel, timber, planks, sacks, straw, the field, the\n  ground, roofs, bills and webbed feet - the warm one · OVERLAP SILT #3D4A44, duck backs and heads,\n  iron, the inside of the mill, night sky, anything under water - overlap only, never a third tube ·\n  ACCENT RIBBON BLUE #2D62B8, 🔴 painted last, touching nothing but Dodo's head ribbon and Mumu's\n  neckerchief. 🔴 THE WATER IS NEVER BLUE - it is MILLPOND. No sky blue, no purple, no pink, no\n  green other than MILLPOND, and no white pigment that is not CHALK.\n\nSTAGE CLAUSES (the stage changes what the two colours do, never which two they are):\n  MILL - each surface is ONE repeated stroke: floor a plank stroke, wall a short dash, sacking a\n    zigzag. The stroke is the SAME shape every time and may run off an edge but is never redrawn.\n    Beams, sacks and the hopper are WHEAT; doors and shutters are MILLPOND. 🔴 THE OVEN\n    MOUTH AND THE WINDOW LIGHT ARE BARE PAPER and are the brightest thing on the page. Flour on the\n    air is CHALK; flour settled on a surface is bare paper left unpainted. A thing being looked for\n    is painted with its own clear silhouette while everything it hides among is the repeated stroke.\n  STREAM - water is ONE horizontal sweep of MILLPOND, 0 ripples, 0 glints, 0 foam lines. A thing IN\n    the water is OVERLAP lying inside that sweep, hard edge, never distorted. A thing ON the water\n    sits on top with its whole shape showing. 🔴 NOTHING IS EVER MIRRORED IN THE WATER - there are\n    no reflections in this book. Stones, logs and banks are WHEAT with the stroke running ALONG the\n    thing, not across it. The path is bare PAPER.\n  YARD - the ground is ONE sweep of WHEAT; the mill house, the wheel, the cart and the straw stack\n    are WHEAT too, and only shutters, door and washing line are MILLPOND. Depth between things is\n    made by putting them CLOSER TOGETHER, never darker.\n  FIELD - SEEN FROM OUTSIDE the field is ONE sweep of WHEAT running to a flat horizon, 0 furrows\n    picked out. Willow, hedge and berry bushes are MILLPOND, at most 5 of them. Sunflowers are WHEAT\n    discs on MILLPOND stems, at most 9. 🔴 SEEN FROM INSIDE IT IS NOT A SWEEP BUT ONE REPEATED\n    STROKE - one stroke is one stalk, the same stroke every time, running off every edge, ears above\n    an adult's head. Depth among them is SPACING (far stalks stand closer together), never a paler\n    or darker wheat.\n  🔴 MIST (any page the script calls mist or fog) - everything but the nearest thing is bare PAPER. Things enter the page by\n    appearing at FULL strength, never by fading, and there is no pale version of any colour.\n  🔴 NIGHT (any page the script sets after dark) - the sky is OVERLAP laid as one flat sweep. Stars, fireflies, the\n    moon and the moon lying on the pond are BARE PAPER points, each cut on its own, at most 14. A\n    lantern is bare paper and it carries the whole page.\n  🔴 SNOW (any page with snow on the ground) - the yard and the field are not painted at all, bare PAPER from edge to\n    edge, and the two colours paint ONLY what stands on it. A mound of snow gets at most 3 WHEAT\n    strokes along its lower lip and nothing else. Falling snow is CHALK, but only where it crosses a\n    painted area. Icicles are bare paper with one MILLPOND stroke down one side.\n\n  🔴 A THING ONLY IMAGINED - some volumes show what a duckling is picturing. There is no blur and no\n    border in this medium, so the page is told apart by ITS STAGE BEING GONE: the whole ground is\n    bare PAPER edge to edge and ONLY the imagined things are painted, standing on nothing. Every\n    real page has a painted stage, so that one difference carries it. No cloud frame, no outline,\n    no faded edge, no second colour. 🔴 THAT IS NOT A SNOW PAGE - on snow, a thing stands ON the\n    ground and gets its WHEAT strokes along the lower lip where it meets it; an imagined thing meets\n    no ground and gets no lower lip. 🔴 THE PAGE STILL CARRIES ITS STAGE TOKEN and that is correct -\n    the duckling is still sitting in that kitchen while it pictures the thing. The token says where\n    the body is; this clause says the stage is NOT PAINTED. Do not \"fix\" one to match the other.\n\nCHARACTER DESIGN LANGUAGE: ducks are built from the same flat sweeps as the world - two or three\n  shapes with limbs laid over. GRADE: bipedal, standing upright. 🔴 THEY HAVE WINGS, NOT ARMS - no\n  hands, no fingers, no sleeves, no cuffs. A duck holds a thing by pinching it between the edge of\n  one wing and its body, or carries it in both wings against its chest. 🔴 FEET ARE WEBBED DUCK\n  FEET, always bare, never in shoes. 🔴 THE ONLY CLOTH IN THIS WORLD IS FOUR THINGS: a head ribbon,\n  a neckerchief, an apron and a straw hat. Nobody wears anything else, ever. Backs and heads are\n  OVERLAP; chests and bellies are WHEAT; bills and webbed feet are WHEAT.\n  🔴 THE ANATOMY STAYS TRUE AND THE POSE DOES THE COMEDY. A duck is built the way a duck really is -\n  neck out of the front of the body, legs set far back under it, tail a stub, bill a flat blade\n  hinged at the skull - and not one of those is ever bent to make a figure cuter or more human.\n  🔴 BUT A DUCK IS NOT ONE SHAPE. A real yard holds a duck that stands with its neck straight up and\n  a duck whose body is wider than it is tall, and BOTH ARE CORRECT ANATOMY. THIS FAMILY IS FOUR\n  DIFFERENT BUILDS, NOT ONE BODY AT FOUR SIZES - they differ in how much neck shows, which way the\n  body is long, how far the legs carry the belly off the ground, and how long the wings are. The\n  laugh comes from putting that correct body into a posture a duck would never hold: hanging upside\n  down from a beam, sitting right back on the tail with both webbed feet in the air, lying out on its\n  front with the neck stretched along the ground. 🔴 NEVER DISTORT THE BODY TO GET A JOKE - change\n  only what it is doing.\n  🔴 THE EYES SIT ON THE SIDES OF THE HEAD, where a duck's are. In three-quarter view ONE eye is whole\n  and the far one is a sliver cut short by the curve of the skull; in profile there is ONE eye and no\n  second one. Each eye is a dark almond, not a dot. The mouth is the line where the bill closes, the\n  bill angle carries the feeling, and above each eye ONE short stroke. An eye opens or closes and\n  never changes size.\n  THE FOUR - 🔴 WHAT TELLS THEM APART AT THUMBNAIL SIZE IS THE BUILD, NOT THE CLOTH. The cloth is a\n  small mark that vanishes when the figure is small, so each one carries a build that survives being\n  filled in solid black: MUMU the younger brother, the smallest, NO NECK SHOWING at rest and the\n  biggest head, legs so short the belly nearly touches the ground, a BLUE neckerchief · DODO the\n  elder sister, half a head taller, LONG LEGS that leave open page under her belly and the longest\n  wings of the two children, chin up, a BLUE head ribbon with two long ends · MOMMY a full head\n  taller than Dodo, THE LONGEST NECK IN THE BOOK held straight up off a narrow upright body, an apron\n  of BARE UNPAINTED PAPER and flour dusted on her wing feathers, no blue · DADDY the tallest, NO NECK\n  SHOWING and a body WIDER THAN IT IS TALL on short wide-set legs, a straw hat whose brim is wider\n  than his shoulders, no blue. Adults never carry blue and never wear the other two children's cloth.\n  🔴 The full build of each is given on that character's own sheet, and the sheet governs.\n  🔴 DODO IS NEVER DRAWN MEAN. She is wrong in nearly every volume she appears in and she must be\n  lovable every time: when she is wrong her WHOLE BODY is the joke - feet up, wings flung wide, bill open,\n  eyes shut in her own laugh. Never a sneer, never a narrowed eye, never crossed wings, never a wing\n  pointed at Mumu, never standing over him. And 🔴 MUMU NEVER SMIRKS AT HER - when she fails he is\n  looking at the task, not at her.\n\nCANVAS: 16:9 double-page spread. 🔴 No lettering, numerals or signs anywhere - sacks and doors stay\n  blank. A height post carries SHORT HORIZONTAL SCRATCHES and nothing else: no name, no date, no\n  arrow, no tick. 🔴 WHAT IS FORBIDDEN IS LETTERING, NOT THE COUNT - a post may carry up to four\n  scratches, and the gaps between them are what a volume is measuring.\n\nNOT: no airbrush, gradient, glow, 3D render or soft feathered edge / no watercolour wash, bleed or\n  transparency / no outline of any kind / no hands, fingers or sleeves on a duck.", award: "Sebastian Meschenmoser · Gordon und Tapir" };
  var FIXED_CHARS = [
  {
    "key": "dodo",
    "name": "도도",
    "aliases": [
      "도도",
      "Dodo duck",
      "Dodo"
    ],
    "spec": "BUILD: the elder sister, half a head taller than Mumu. Head is 1/4 of her standing height.\n  🔴 SHE IS NOT A BIGGER MUMU. HER LEGS SHOW: there is a clear band of open page between her belly\n  and her feet, TWICE AS DEEP as the gap under Mumu, and it is there even standing still. The body\n  rides high on those legs and is tipped forward so the chest leads.\nNECK: always out, and CURVED BACK IN A SHALLOW S so the chin is lifted and the head sits BEHIND the\n  chest, never on top of it. The neck is medium - shorter than Mommy's, and it does not fold away.\nWINGS: THE LONGEST AGAINST THE BODY OF THE TWO CHILDREN - folded they reach past the tail, spread\n  they are a hand-span wider than Mumu's, and the tips come to a point. She works with ONE wing out\n  away from the body while the other stays down, so HERS IS THE ONLY OUTLINE THAT IS NOT THE SAME ON\n  BOTH SIDES.\nBILL: long and narrow, clearly longer than Mumu's.\nCLOTH: one BLUE ribbon over the crown, knotted at one side, with TWO LONG LOOSE ENDS that hang past\n  her cheek - long enough to lie back when she moves, flick up when she jumps and droop when wet.\n  She wears nothing else.\nSILHOUETTE: filled in solid she is a lopsided cross - a body up on two long legs, chin up, one wing\n  thrown out. Nobody else in the book is asymmetrical."
  },
  {
    "key": "mumu",
    "name": "무무",
    "aliases": [
      "무무",
      "Mumu duck",
      "Mumu"
    ],
    "spec": "BUILD: the younger brother, the smallest of the four. 🔴 HIS HEAD IS THE BIGGEST PART OF HIM - a\n  round ball that is 1/3 of his standing height and wider than his own shoulders.\n  🔴 HE IS NOT A SMALLER DODO. HIS LEGS ARE THE SHORTEST OF THE FOUR: the belly hangs so low that\n  the open page under him is no deeper than one webbed foot, and he reads as a body sitting on its\n  feet. Body a short upright egg.\nNECK: 🔴 FOLDED AWAY AT REST - the head sits straight down on the body and NO NECK SHOWS AT ALL. He\n  is the only one whose neck disappears. When he looks at a thing it comes OUT AS A THIN STALK AS\n  LONG AS HIS OWN BODY, the same thin width all the way, and it can point forward, up, down or bend\n  into an arch. That stretch is what he does on more pages than anything else.\nWINGS: the shortest and roundest at the tip, and they stay held against the body so they do NOT break\n  his outline. He holds a thing with BOTH wings cupped against his chest, and both wings move the\n  same way at the same time - he is symmetrical where Dodo is not.\nBILL: short and blunt.\nCLOTH: one BLUE square kerchief knotted at the throat, knot in front, two points hanging over his\n  chest. It can be untied and carried. He wears nothing else.\nSILHOUETTE: filled in solid he is a pebble - a big round head on a short egg, no legs and no neck -\n  and the only thing that ever leaves that pebble is one thin neck."
  },
  {
    "key": "mom",
    "name": "엄마",
    "aliases": [
      "엄마",
      "Mommy duck"
    ],
    "spec": "BUILD: the adult, a full head taller than Dodo. Head is 1/6 of her height, the smallest head against\n  the body in the book. The body is NARROW AND UPRIGHT, deeper front-to-back than it is wide, carried\n  high on LONG LEGS with the widest open page under her of anyone.\nNECK: 🔴 THE LONGEST NECK IN THE BOOK, as long as her body is deep, AND IT STANDS UP VERTICAL so that\n  a third of her whole height is neck. At work it BENDS OVER IN ONE SMOOTH ARCH from the shoulder,\n  the head coming down to whatever her wings are doing, and the arch is her working shape.\nWINGS: long, held close to the body, and dusted with flour - the flour is BARE UNPAINTED PAPER laid\n  along the top of the wing, never a white pigment.\nCLOTH: one APRON and it is BARE UNPAINTED PAPER, a plain panel from chest to knee with two straight\n  ties - 🔴 SHE IS THE ONLY CHARACTER WITH UNPAINTED PAPER ON HER BODY, and that pale panel is how\n  she is found on a crowded page. No pattern, no pocket detail, no other cloth. NO BLUE ANYWHERE.\nSILHOUETTE: filled in solid she is a ladle - a long standing neck rising off a narrow upright body on\n  long legs - with one pale rectangle cut out of her front."
  },
  {
    "key": "dad",
    "name": "아빠",
    "aliases": [
      "아빠",
      "Daddy duck"
    ],
    "spec": "BUILD: the adult, the tallest and by far the widest. 🔴 THE HEIGHT IS ALL BODY AND NO NECK. His body\n  is WIDER THAN IT IS TALL - the only figure in this book built as a lying oval instead of a standing\n  one - with a broad low chest and a back that runs nearly level. Head is 1/5 of his height.\nNECK: 🔴 NONE SHOWS. The head sits straight down onto the shoulders and stays there; he turns the\n  whole body to look at something. Where Mommy is a third neck, he is none.\nLEGS: short and SET WIDE APART, so he stands square and planted - the open page under him is wide but\n  very shallow, the opposite of Mommy's tall narrow gap.\nWINGS: THE WIDEST OF THE FOUR. He braces, presses down and carries with both of them at once.\nCLOTH: one straw hat, WHEAT, and 🔴 ITS BRIM IS WIDER THAN HIS SHOULDERS - one flat horizontal bar\n  laid across the top of him, sitting directly on the head with no neck under it. He wears nothing\n  else. NO BLUE ANYWHERE.\nSILHOUETTE: filled in solid he is a mushroom - a wide low mass with a flat bar across the top and\n  nothing between the two."
  }
];
  var FACE = {"dodo":"🦆","mumu":"🦆","mom":"🦆","dad":"🦆"};

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
      '.ep-art{flex:0 0 auto;font-size:11px;line-height:1;padding:2px 4px;border-radius:5px;color:#bbb;}',
      '.ep-art.part{color:#8a6d1f;background:#fdf6e0;}.ep-art.full{font-size:14px;color:inherit;background:transparent;}',
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
    try { var ri = await fetch('/' + KEY + '-index.json', { cache: 'no-store' }); idx = await ri.json(); } catch (e) {}
    var eps = idx.filter(function (e) { return e.file && e.file !== KEY + '-plan.html'; }).map(function (e) {
      var m = (e.label || '').match(/(\d+)/);
      return { file: e.file, docId: e.file.replace(/\.html$/, ''), num: m ? +m[1] : 0, title: e.title || e.label, pages: e.pages || 0 };
    }).sort(function (a, b) { return a.num - b.num; });

    // 🔴 삽화 수는 **한 번의 요청**으로 받는다 — 권마다 물으면 50번이 된다.
    var art = {};
    try {
      var ra = await fetch('/api/comic-assets/series/' + KEY);
      var ja = await ra.json(); art = (ja && ja.data) || {};
    } catch (e) {}

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
      var full = 0;
      eps.forEach(function (e) { if (e.pages && (art[e.docId] || 0) >= e.pages) full++; });
      summary.textContent = '✅ ' + d + ' · 🟡 ' + w + ' · 🖼 ' + full + ' / ' + eps.length;
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
      // 🖼 삽화 — 다 들어갔으면 ✔, 일부면 몇 장인지, 없으면 빈 자리(회색)
      var got = art[e.docId] || 0, need = e.pages || 0;
      var art_ = document.createElement('span');
      art_.className = 'ep-art' + (need && got >= need ? ' full' : got ? ' part' : '');
      art_.textContent = need && got >= need ? '🖼' : got ? got + '/' + need : '·';
      art_.title = need ? '삽화 ' + got + '/' + need + '쪽' : '삽화 ' + got + '장';
      row.appendChild(n); row.appendChild(a); row.appendChild(art_); row.appendChild(mbtn); row.appendChild(badge);
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
 * 🔴 SSOT 는 docs/changjak-books/dodo/*.md 이고 이것은 그 위에 얹는 오버레이다.
 *   즉 화면이 원고와 다를 수 있다 — 원고를 고칠 땐 이 오버레이부터 확인해야 한다. */
(function () {
  var KEY = 'dodo';
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
