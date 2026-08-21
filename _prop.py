# -*- coding: utf-8 -*-
"""등신을 «잴 수 있는 하드 제약»으로 올린다.

관우 1권 시안이 레퍼런스보다 훌쩍 커져서 돌아왔다. 원인이 프롬프트에 둘 있다.
① 등신이 스타일 문장 «괄호 속»에 `(SD, ~2.5 heads)` 로 들어 있었다 — 힌트로 읽힌다.
② 파생 지시가 얼굴만 말하고 «키는 한 글자도 안 말했다». 시트를 붙여도 다시 늘려도 되는 상태였다.
🔴 수염을 머리로 세지 말라고 못 박는다 — 관우처럼 가슴까지 오는 수염이 있으면
   모델이 그걸 머리 길이에 넣고 몸을 늘린다.
"""
import io, sys

RED = '\U0001F534'
p = 'packages/client/scripts/build-samgukji.mjs'
s = io.open(p, encoding='utf-8').read()

OLD = ("  const STYLE_LINE =\n"
       "    'Art style: detailed painterly chibi (SD, ~2.5 heads) character, East Asian ink-wash + soft cel ' +\n"
       "    'shading, crisp readable silhouette, muted earth tones with gold/jade accents, clean even lighting, ' +\n"
       "    'NO baked ground shadow.';")
NEW = (
    "  // " + RED + " 등신을 스타일 문장 안 괄호에 넣으면 무시된다. 재는 법까지 적어 맨 앞 독립 줄로 둔다.\n"
    "  //   " + RED + " 수염을 머리로 세지 말라고 못 박아야 한다 — 관우처럼 가슴까지 오는 수염이 있으면\n"
    "  //   모델이 그것을 머리 길이에 넣고 몸을 통째로 늘린다(1권 시안이 그렇게 커져서 돌아왔다).\n"
    "  const PROPORTION_LINE =\n"
    "    'PROPORTION - MEASURE THIS FIRST, BEFORE STYLE: the head from crown to chin is EXACTLY 2/5 of " +
    "the ' +\n"
    "    'figure total height. Everything below the chin - torso and legs together - is only 1.5 " +
    "head-heights ' +\n"
    "    'tall. " + RED + " BEARD AND HAIR DO NOT COUNT AS HEAD: measure to the chin. Legs from hip to sole " +
    "are ' +\n"
    "    'SHORTER than the head is tall. Hands small and blunt, feet in heavy boots.';\n"
    "\n"
    "  const STYLE_LINE =\n"
    "    'Art style: detailed painterly chibi, East Asian ink-wash + soft cel shading, crisp readable ' +\n"
    "    'silhouette, muted earth tones with gold/jade accents, clean even lighting, NO baked ground " +
    "shadow.';")
if s.count(OLD) != 1:
    sys.exit('STYLE_LINE 을 못 찾았다')
s = s.replace(OLD, NEW)

# 시트 프롬프트에 비율 줄을 싣는다
A = "      '', PERIOD_LINE, '', STYLE_LINE, '',"
if s.count(A) != 1:
    sys.exit('시트 프롬프트 조립부를 못 찾았다')
s = s.replace(A, "      '', PERIOD_LINE, '', PROPORTION_LINE, '', STYLE_LINE, '',")

# 사물 카드에도 (물건은 등신이 없지만 «치비 세계의 물건»이라 손 크기 기준이 필요하다)
B = "      desc + '.',\n      '',\n      STYLE_LINE,"
if s.count(B) != 1:
    sys.exit('사물 프롬프트 조립부를 못 찾았다')
s = s.replace(B, "      desc + '.',\n      '',\n      'Scaled for a chibi world: this object is held by a "
                 "figure whose head is 2/5 of its height.',\n      '',\n      STYLE_LINE,")

# 파생 지시 — 얼굴만 말하고 키는 안 말했다
C = "'his face - draw that, even where it contradicts the attached picture.'"
if s.count(C) != 1:
    sys.exit('파생 지시를 못 찾았다')
s = s.replace(C, "'his face - draw that, even where it contradicts the attached picture.' +\n"
                 "          ' " + RED + " COPY THE PROPORTION EXACTLY: the same head-to-body ratio as the "
                 "attached sheet, ' +\n"
                 "          'the same short legs, the same overall height. Do NOT make him taller or "
                 "slimmer than the sheet.'")

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('proportion line + derived proportion clause')
