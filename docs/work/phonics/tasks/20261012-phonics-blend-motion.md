# 자모 합성 누르기 유도·만남 연출

- id: 20261012-phonics-blend-motion
- domain: phonics
- status: ready
- updated: 2026-10-12
- base: 6d1bb58f0
- branch: codex/phonics-blend-motion
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 미푸시·미배포

## 요청·반증

사용자: 눌러야 할 자음을 누르고 싶게 움직이고, 자모가 만났을 때 기존 이펙트가 어울리는지 실제 확인. ㄱ+ㅏ 두 라운드를 브라우저에서 실행, 기존 CSS가 pulse를 제거해 테두리만 강조되는 점과 공용 큰 리본이 그림 글자 위로 지나가는 점을 확인했다.

## 결정·구현

- 차례인 글자 하나만 두 번 말랑하게 뛰고 쉬는 CSS transform 애니메이션. 누르면 다음 차례로 넘겨 이전 유도 즉시 정지, 합성 중에는 모두 정지. 자음/모음/받침/복잡모음의 공용 활동에 동일 적용.
- 해당 활동의 공용 Phaser blend 호출을 로컬 SVG/CSS 연출로 교체: 완성 글자가 뽁 하고 등장·한 번 뛰며 살구/민트 빛·꽃잎/방울/반짝임이 글자 바깥에서 펼쳐지고 사라진다. 그림 정면을 덮는 리본 없음. 다른 활동의 효과 종류는 그대로 유지.
- 발음 ended→500ms 모임→완성→550ms 쉼→이어읽기/정답/다음 짝, 완료·기록·선택 잠금·자모 방향 보존. 새 이미지/엔진/의존성/추가 JS 프레임 루프 없음. reduced-motion에서는 유도/등장/주변 장식 모두 정지·생략하고 완성 음절을 유지.
- 시작 fetch: origin/main...HEAD 4/22. 원격 갈라진 이력은 건드리지 않고 기존 main/영상 작업 보존. 기존 ReviewWriteActivity.test.tsx의 hunk 없는 M 표시 보존.

## 검증

- 4파일24테스트 통과: 합성 차례/중간 선택 잠금/소리 체인·받침 완료, blend-pairs, ToyHangul, 공용 learning-effects.
- client typecheck/변경 ESLint0오류/client build45.54초 통과. 기존 Lottie eval/locale 동적·정적 import/큰 chunk 경고 유지.
- 실제 ㄱ+ㅏ→가·ㄱ+ㅗ→고·가+ㅇ 합성을 브라우저 조작. CSS DOM 확인으로 현재 차례 하나만 invite 애니메이션을 가지며 탭 뒤 자음 none/모음 invite로 이동함을 확인. 합성 잠금·완성→다음 짝 정상. 375×812 가로 넘침0, 812×375 받침 두 타일/목록 표시 확인.
- `C:/project/tangobook/output/phonics-blend-motion-20261012/`에 실제 화면 PNG 보관. 정지 PNG는 완성/배치 증거이고 전체 애니메이션/FPS를 보증하지 않는다. 실물 기기/FPS 측정은 별도. 임시 뷰포트는 해제.
