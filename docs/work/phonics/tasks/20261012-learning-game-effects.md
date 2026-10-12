# 한글·영어 파닉스 애니메이션·사운드·그림 자모

- id: 20261012-learning-game-effects
- domain: phonics
- status: ready
- updated: 2026-10-12
- base: e12a07a6a (origin/main 28a1ad62c, 기존 인쇄 시안 2커밋 보존)
- branch: codex/platform-ui-v2
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- remote: 이번 작업 push 요청 없음·미푸시·미배포

## 사용자 결정과 반증

한글 익히기·어휘 게임을 게임 수준의 비주얼/사운드로 강화하고 영어 파닉스도 포함한다. 이미지가 단순히 뜨는 방식보다 애니메이션을 요구했다. 기존 폭죽·콘페티·호리 반복은 제외한다. 웹 방식 논의에서 LoRA 오타를 Lottie로 정정했고, Phaser 실시간 반응+CSS/Framer 진행을 승인하되 **속도를 매우 중시**했다. 새 엔진 의존성 설치 없이 기존 Phaser를 재사용한다.

첫 금빛·크리스털의 움직임은 좋지만 RPG 아이템 뽑기처럼 보인다는 반증→간단한 반응으로 줄인 안도 너무 단순하고 네모 그림이 별로라는 반증→풍부한 움직임은 유지하면서 말랑한 꽃·거품·별·하트·음표·리본으로 변경. 후속으로 **같은 이펙트를 재사용하지 말고 여러 종류**를 요청하여 장면 경로/시간/소재를 분리했다.

한글 자음·모음 눌러 익히기/합성은 귀여운 그림, **쓰기부터 폰트**. 자음 그림을 귀엽다고 평가했고 모음 다른색 요청→살구 자음·민트 모음. ㅊ 윗획 재작화. 최신 반증은 합성된 글자의 외관: 정사각 원본을 좁은 칸에 fill해 표정이 눌렸으므로 alpha-aware 자연 종횡비 WebP+contain+자모 간격을 개선했다. **‘가’만 별도 완성 음절 삽화**를 생성했고 다른 음절은 그림 자모로 배치한다. 전체 음절을 개별 재작화했다고 보고하지 않는다.

## 구현

- 앱당 투명 Phaser canvas 하나, `LearningEffectsHost` 지연 import. 입력·판정·기록·교구/카메라 인식을 소유하지 않는다. 실제 학습 대상 data-learning-fx와 공통 sound/feedback hooks를 연결한다. 레이어 z80은 실제 ActivityShell/GamePlayerLayout z60 위, pointer-events:none.
- 12사건/14장면. 정답은 리본춤·꽃피기·하트물결 순환. 듣기 음표/파동, 발견 잎/꽃, 글자 밑줄/꽃, 단어 밑줄/구슬/하트, 합성 두색 리본, 짝찾기 두 하트 만남, 연속 세 꽃 리듬, 단원 완료 꽃·하트·별+둥근 완성 표식을 구분한다. 공통 회전 리본은 정답 첫 변형에만 사용한다.
- 한글/영어 알파벳·자음·모음·CVC/word family·듣고 고르기·복습, 공유 블록/선긋기/이야기 그림 게임의 대상/판정에 연결했다. FeedbackOverlay 호리/콘페티/전면 색막을 하단 상태 문구로, 결과는 둥근 완료 표식으로 변경. 점수·다시 하기·확인·만난 책을 보존한다.
- `ToyHangul`: 그림 자음14·모음10, 받침/복합모음/쌍자음 shared 분해 조합, role/aria-label과 폴백. 자음누르기/모음듣기/합성/모음음절듣기에 사용. 쓰기 선택·글자 폰트·기존 마스크/99% 판정은 유지했다. 그림 목록 진행 칩도 기존 폰트.
- original MP3 4종0.19/0.58/0.28/1.32초, 총24,955B. `scripts/generate-learning-sounds.mjs`가44.1kHz stereo 합성→FFmpeg libmp3lame 인코딩. peak.16–.32·PCM clipping 없음. 기본 UI 탭을 학습 탭으로 대체해 중복 소리 방지. 사용자/책별 음원 override·mute 유지. 발음→쉼→chime 실제 ended 체인 보존, 결과 효과음 실제 ended→해당 언어 칭찬, 공용 iOS 해금 audio 사용.

## 이미지 자산

imagegen 스킬 사용. 로컬8188/8190/8191 Qwen/ComfyUI 부재를 확인·안내 후 내장 도구. 외부 그림 복제 없음. 투명 atlas2장512px 총59,420B, 그림 자모24장234,874B+‘가’9,892B. 원본/셀 좌표/생성 명세는 [이펙트](../../../../packages/client/public/images/effects/README.md), [그림 자모](../../../../packages/client/public/images/phonics/jamo-toys-v1/README.md).

초기 RPG PNG는 런타임에서 제외하고 로컬 `output/learning-effects-20261012/rejected-rpg-atlas.png`로 보존했다. 같은 폴더의 **기존 correct-animation.gif·english-mobile.png·activity-shell-mobile.png는 초기 기각된 시안의 실행 증거**다. 최종안으로 인용하지 않는다.

## 속도·수명

45ms trace throttle·객체 수 제한·1.6초 idle sleep·6초 엔진 시작 상한·로딩 중 마지막 이벤트만500ms 보관. reduced-motion에서는 엔진/탄성/궤적을 생략하고 텍스트/완성 표식 유지. 이탈/resize/visibility/언마운트에서 큐·타이머·객체 정리. 잠든 Phaser도 deferred destroy를 마지막 step으로 실행, 탭 복귀 resume는 idle로 돌린다. 생성 그림 실패에도 자모/폰트 또는 간단한 texture 폴백으로 학습 계속.

Phaser4는 default export/`GameConfig.resolution`이 없어 namespace import로 수정했다. 학습 외 홈의 modulepreload에는 엔진이 포함되지 않는다. 빌드 엔진 청크1,665KB(raw)/약378KB(gzip)는 학습 때 로드하며, 느린 네트워크/실기기 첫 진입 시간은 후속 실측 필요. 이미 다운로드된 atlas/음원은 재사용한다.

## 검증 결과

- client typecheck 통과.
- 변경 소스 ESLint0오류/기존 unused·any7경고. sound generator node --check 통과.
- 관련30파일157테스트 통과: 이벤트 anchoring/중복/정답 변형/reduced-motion/keyboard/trace, 엔진 idle/resume/timeout/destroy, 소리 ended/mute/언어/override, 게임 재시작·결과 유지, 그림 자모 분해/전체가/실패 폴백, 기존 활동·쓰기 회귀.
- 기존 테스트 비동기 fixture 보완: preload fake timer를 act로 감싸6000ms/완료 주장을 유지; 쪽순서 결과 버튼은 Framer initial opacity가 끝날 때까지 waitFor 후 **visible** 검증. 제품 기대값을 낮추지 않았다. 기존 jsdom 미모킹 GET AggregateError stderr는 실패와 구분했다.
- client build 통과. 기존 lottie eval·동적/정적 import·큰 chunk 경고는 남는다.

## 브라우저 증거와 한계

Vite5186 `/learning-effects-preview.html`은 production route가 없는 local entry. 운영 TTS 생성/학습 기록/계정 요청 없이 실제 렌더러·LetterFillCanvas·FeedbackOverlay·ActivityShell·sound hooks를 실행한다. API_TARGET은 비실행 localhost5199, scheduler 옵션 지원 확인 후 DISABLE_PUBLISH_SCHEDULER=1. 로컬 브라우저 연결이 기존 탭에서 실패하여 같은 URL의 새 검수 탭으로 복구했다.

최종 사용자 반증 수정 후 자연 폭과375×812 실제 z60 ActivityShell에서 ‘ㄱ·ㅏ·가’ 정상 로드, 문서폭375, canvas1·idle 확인. ㅊ/기본 자모 전체, 대표14 합성 음절(세로·가로·받침·복합모음) 배치 확인. 최종 꽃피기·듣기 음표·두색 합성 리본·모바일 단원완성 꽃/하트/별은 실제 브라우저 연속 프레임에서 확인했다. 출력:

- `output/learning-effects-20261012/blend-ga-v2.png`
- `blend-ga-mobile-v2.png`, `flower-scene.png`, `listen-scene.png`, `blend-scene.png`, `complete-mobile-v2.png`
- `tests-final.txt`, `build-final.txt`

이전 쓰기 실제 드래그로64% 채움·99% 목표 유지 확인은 전체 채움 실기기 검증과 구분한다. 합성 레이아웃 표본과 API 없는 검수 화면은 모든 운영 활동의 전수 플레이가 아니다. 사운드 파형/실제 ended/mute·언어 선택은 자동 검증했으며 **물리 iPad 청취·오디오 해금·실물 교구·실터치60fps는 미검증**. 추가 음절 개별 삽화와 실제 기기 믹스는 사용자 피드백을 받아 이어갈 수 있다.

## 인계

코드·그림·효과음·생성 기록을 같은 로컬 커밋으로 보존한다. main 통합 후 상태/MEMORY를 갱신한다. 이번 작업 원격 push/배포는 요청받지 않았다.
