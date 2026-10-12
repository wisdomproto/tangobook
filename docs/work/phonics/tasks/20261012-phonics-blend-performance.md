# 합성 화면 반응·연출 시간 점검

- id: 20261012-phonics-blend-performance
- domain: phonics
- status: integrated
- updated: 2026-10-12
- base: 84c773b48
- branch: codex/phonics-blend-performance
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- delivery: 미푸시·미배포
- integration: ff28cdc25 코드/회귀/기억을 로컬 main에 fast-forward 통합

## 요청·측정

사용자 합성 화면이 느리다는 반증. 실제 브라우저에 임시 DEV 전용 관측기를 연결해 pointer→DOM 상태 변경, 공용 audio playing/ended, rAF·longtask를 읽고 output/phonics-blend-performance-20261012/before.json에 저장했다. 진단 코드는 최종 제품에서 제거한다.

- 마지막 ㅏ 탭20542ms→완성21741ms:1199ms. ㅏ ended21225ms 뒤 이미 모인 카드에 다시500ms 대기, 완성 후550ms 쉼으로 이어읽기 playing22325ms(탭 뒤1783ms). 최초 ㄱ 탭→DOM107ms/음원playing253ms, 이후 탭→DOM30~45ms/음원98~125ms.
- rAF median7.8ms/p95138.8ms·longtasks1036/59/100ms로 불규칙. 이 내장 브라우저 측정·개발 번들·계측 overhead를 실제 iPad FPS/CPU 병목으로 단정하지 않는다. 캔버스/효과를 무작정 제거하지 않는다.

## 수정

마지막 낱글자 발음과380ms 이동을 병렬 진행하며 실제 ended와 이동이 모두 끝난 뒤 완성 표시. 이후 쉼220ms. gap 레이아웃 보간 대신 고정 공간 안의 translate 이동, 완성 탄성480/580ms. 음원 내용·이어서 읽기·정답 음원·완료/리포트/학습 순서 보존. 언마운트 후 늦은 발음 콜백이 reveal 타이머를 만들지 않도록 alive guard.

## 검증

동일 브라우저 after.json: 마지막 ㅏ 탭27718ms→완성28443ms=725ms(전1199ms, 약40% 단축), 이어읽기 playing28822ms=1104ms(전1783ms,679ms 단축). 실제 ㅏ ended28440ms 직후3ms 만에 완성하며 소리를 자르지 않는다. 다음 짝까지4104ms(전4789ms), 이어읽기2.193초/정답0.58초 음원 내용 유지. rAF p95는173.6ms로 개선을 입증하지 못했으므로 FPS 향상으로 보고하지 않는다.

4파일26회귀 통과. 신규 테스트는 음원이 이동보다 늦으면 ended까지 잠금, 먼저 끝나면380ms까지 기다림, 완성220ms 뒤 이어읽기 및 이탈 후 늦은 ended가 타이머/완료를 재생하지 않음을 검증한다. 임시 계측 코드는 제거했고 output JSON만 로컬 보존. client typecheck/변경 ESLint0오류/build36.30초 통과, 기존 경고 유지.

최종 브라우저375×812는 가로 넘침0, 두 타일 x63.81/221.45px·90.07px와 실제 가 완성 확인. 812×375 받침 두 타일 bottom245.41/358.01px, 실제 가+ㅇ→강과 완성 카드 확인. 같은 데이터/그림·방향 유지, 모바일/받침 PNG를 보관하고 뷰포트 override·진단 쿼리를 제거했다. 기본 학습 주소/Vite5186/API3500 서버 유지. 실기기 FPS 향상은 미확인, 대기 단축만 실측 결과로 보고한다.
