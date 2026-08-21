# -*- coding: utf-8 -*-
"""화타를 넣는다 — 이름으로.

앞서 「관우가 주인공이니 의원은 익명이 낫다」고 판단해 뺐는데 틀렸다.
화타는 소품이 아니라 그 자체로 아이가 아는 이름이고, 게다가 «두 번» 나온다:
관우의 팔을 열고, 조조의 머리를 열자고 했다가 갇힌다. 두 번째가 조조의 죽음에 인과를 준다.
"""
import io, re, sys

B = 'packages/client/scripts/build-samgukji.mjs'
C = 'docs/art-direction/samgukji-cast.md'
V = 'docs/samgukji/vol-20.md'

# ── ① 괄골요독 쪽에 이름을 준다 ────────────────────────────────────────
s = io.open(V, encoding='utf-8').read()
R = [
    ('그 싸움에서 관우는 오른팔에 화살을 맞았어요. 살에 든 독이 뼈까지 스며 의원이 팔을 째야 한다고 했지요. '
     '관우는 왼손으로 바둑돌을 집으며 말했답니다. "하시오. 나는 이쪽을 두고 있겠소."',
     '그 싸움에서 관우는 오른팔에 화살을 맞았어요. 살에 든 독이 뼈까지 스미자 \'화타\'라는 이름난 의원이 '
     '불려 왔지요. 팔을 째고 뼈를 긁어야 한다는 말에, 관우는 왼손으로 바둑돌을 집으며 말했답니다. '
     '"하시오. 나는 이쪽을 두고 있겠소."'),
    ('오른팔은 화면 밖으로 나가 있고, 그쪽 가장자리에 의원의 어깨만 걸린다.',
     '오른팔은 화면 밖으로 나가 있고, 그쪽 가장자리에 Huatuo(화타)의 어깨와 소매만 걸린다 — 🔴 얼굴도 손에 든 것도 화면 밖이다.'),
]
bad = [o[:40] for o, _ in R if s.count(o) != 1]
if bad:
    sys.exit('안 맞음: ' + ' | '.join(bad))
for o, n in R:
    s = s.replace(o, n)

# ── ② 조조와 화타 — 새 쪽 ────────────────────────────────────────────
NEW = '''### pX · 머리를 열어야 낫습니다

그 화타가 이번에는 조조에게 불려 왔어요. 머리를 열어야 낫는다는 말에 조조는 자기를 해치려는 것이라 여겼지요. 화타는 그날로 갇혀 다시 나오지 못했고, 조조의 머리는 그 뒤로 더 아팠답니다.

```scene
컷 중형, 아이레벨 — 상을 사이에 두고 마주 앉은 둘.
장소·시간 낙양의 방, 밤.
인물 Huatuo(화타)가 두 손을 무릎에 얹은 채 조조의 이마 쪽을 본다 — 🔴 이 책에서 조조 앞에서 눈을 안 내리는 몇 안 되는 사람이다. Caocao(조조)는 몸을 뒤로 물리며 한 손을 들어 막는다 — 흰 수염, 얼굴에 병색.
배경·소품 상 하나, 등잔, 나무 약함 하나. 🔴 칼붙이는 한 점도 그리지 않는다.
톤 등잔 빛. 🔴 고칠 수 있는 사람을 스스로 밀어내는 쪽이다.
```'''

m = re.search(r'^### p\d+ · 잠 못 이루는 사람$', s, re.M)
if not m:
    sys.exit('「잠 못 이루는 사람」 쪽을 못 찾았다')
nxt = re.search(r'^(### p\d+ · |## |---\s*$)', s[m.end():], re.M)
at = m.end() + nxt.start()
s = s[:at] + NEW + '\n\n' + s[at:]

n = [0]
def bump(mm):
    n[0] += 1
    return '### p%d · %s' % (n[0], mm.group(2))
s = re.sub(r'^### p(\d+|X) · (.+)$', bump, s, flags=re.M)

line = re.search(r'^- cast: (.+)$', s, re.M)
keys = [k.strip() for k in line.group(1).split(',')]
if 'huatuo' not in keys:
    keys.append('huatuo')
s = s[:line.start()] + '- cast: ' + ', '.join(keys) + s[line.end():]
io.open(V, 'w', encoding='utf-8', newline='\n').write(s)

nums = [int(x) for x in re.findall(r'^### p(\d+) · ', io.open(V, encoding='utf-8').read(), re.M)]
if nums != list(range(1, len(nums) + 1)):
    sys.exit('20권 번호가 안 이어진다: %s' % nums)
print('20권 → %d쪽' % len(nums))

# ── ③ 등록 ───────────────────────────────────────────────────────────
b = io.open(B, encoding='utf-8').read()
A = "  pangde: { token: 'Pangde',"
assert b.count(A) == 1
b = b.replace(A, "  huatuo: { token: 'Huatuo', name: '화타', desc: '이름난 의원 · 흰 머리를 뒤로 묶었다 · "
                 "🔴 무기 대신 늘 나무 약함을 든다 · 조조 앞에서도 눈을 안 내리는 얼굴.', aliases: ['Huatuo', '화타'] },\n" + A)
A2 = "  pangde: 'PANG DE —"
assert b.count(A2) == 1
b = b.replace(A2, "  huatuo: 'HUA TUO — the physician of the story, white hair drawn back and tied, a small "
                  "wooden medicine case always in one hand and never a weapon, steady-eyed',\n" + A2)
io.open(B, 'w', encoding='utf-8', newline='\n').write(b)

t = io.open(C, encoding='utf-8').read()
MARK = '## Pangde'
assert t.count(MARK) == 1
SHEET = '''## Huatuo

```
HUATUO - the physician. He opens one man's arm and asks to open another man's head.
SHOULDERS = 1.5 head-widths.
FACE: bare and lined, white hair drawn back and tied at the nape, a short white beard.
🔴 THE EYES DO NOT DROP. He is one of the very few in this book who does not lower his gaze in
  front of Cao Cao, and that is drawn in the eyeline, not in the posture.
🔴 HANDS: ALWAYS HOLDING SOMETHING AND NEVER A WEAPON - a small wooden medicine case.
  🔴 DO NOT DRAW A BLADE IN HIS HAND ON ANY PAGE OF THIS BOOK, including the page where he treats
  an arm. What he works with stays outside the frame.
COSTUME: an undyed hemp robe and a cord belt, 0 marks of rank anywhere on him.
🔴 SILHOUETTE: a plain narrow figure with a box at the end of one arm.
🔴 ACCENT: none.
```

'''
t = t.replace(MARK, SHEET + MARK)
io.open(C, 'w', encoding='utf-8', newline='\n').write(t)
print('화타 등록 — CAST · EN · 시트')
