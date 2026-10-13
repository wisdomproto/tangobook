# 한글·영어 낱자 쓰기와 획순 안내

- id: 20261013-all-stroke-guides
- domain: phonics
- status: integrated
- updated: 2026-10-13
- base: faf309abb
- branch: codex/phonics-all-stroke-guides
- worktree: C:/Users/kil21/.codex/worktrees/platform-ui-v2/tangobook
- integration: 537c71585 로컬 main fast-forward 포함 확인
- delivery: 미푸시·미배포

## 사용자 결정

모음 승인 후 전체 확장 요청. 후속 정정으로 한영 음소 낱자만 안내(쌍자음·복합 모음 포함), 블렌딩·받침·음절·단어 안내 제외. 현재 한글 쓰기가 합성 구조여서 배우는 칸만 안내하는 선택을 받았으나, 최종 사용자 ‘아니 ㄱ 배울때 처음 ㄱ 눌러보고 ㄱ만 써보기 하는걸 만들고 거기에서 획순’이 우선한다.

## 구현

- 기본19자음(쌍자음 포함)은 기존 consonant-tap→새 필수 letter-write→기존 blend-listen/consonant-write. 기존 합성 쓰기 제목은 음절 쓰기로 분리.
- 복합 모음은 각 모음별 새 letter-listen→letter-write 후 기존 listen-1/write-1 합성. 받침 과정은 낱자 활동을 추가하지 않는다. 기존 key/완료 기록 보존, 새 필수 단계는 실제 완료가 필요하다.
- VowelWriteActivity 재사용: 한글 낱자3회 시범→힌트→독립, 발음 종료 뒤 새 종이/마지막 칭찬 종료 후 완료. 새 활동이 모음 kind를 쓰는 것은 공용 UI 재사용이며 글자/음원은 각각 실제 자음·모음이다.
- LetterFillCanvas: 한글40낱자·영어52대소문자, 실제700폰트 마스크에 꺾임/곡선/순서 번호·방향·SVG 연필. 영어 두 칸은 종이 안44px 다시 보기. 입력 시 시범 중단, reduced-motion 정적 안내, 시범은 채점하지 않음.
- ConsonantWrite(합성/받침), CvcPatternWrite는 guidance=none. WordFillCanvas 변경은 취소하고 원본 유지. 한글 합성 음절·겹받침·단어·다른 문자권은 가이드 대상에서 제외.
- 짧은 가로 영어 쓰기: 568×320/812×375 두 판 나란히, 기존 단일 열로 인한 스크롤 보완. 완료/음원/그림·대소문자 순서는 유지.
- R2 자모40개 읽기 스냅샷, 영어52곡선 템플릿은 로컬 코드. 원격 데이터 수정/외부 이미지 생성/추가 런타임 없음. 마스크 분석은 종이 초기화 때만, bounded128 캐시. 기본99% 유지, 순서·방향을 강제 채점하지 않는다.

## 반증과 정리

처음 전체 음절/단어까지 확장하려 했으나 실제 글꼴에서 자모가 붙어 분해가 실패했다(어/호 등). 사용자 정정에 따라 음절 분해·단어 안내를 전부 제거했으며 이 중간 접근을 완료라고 보고하지 않는다. native ImageData 속성은 prototype getter여서 spread로 사라짐을 재현/수정. 실제 M 꼭대기/영어 i·j 점/t 가로획 끝을 보완했고 A 횡획은 축 고정으로 다리로 휘지 않게 한다.

## 검증

- 관련12파일104회귀 통과, 이후 진도 보존/새 낱자 필수 활동1개 추가 후 learning-journey8테스트 재통과(고유105개). 99%/시범 미채점/입력 중단/음원 ended/중복콜백/다른문자권/구경만으로 완료 없음/합성·받침 안내 제외 포함.
- client 타입·수정TS/TSX ESLint·production build 통과. 최종 스타일 추가 후 재검증 결과는 아래.
- 별도 localhost origin의 실제 ㄱ 낱자 쓰기 native drag3회 각100%·시범/힌트/독립·발음 종료 후 다음 종이·완료 후 자유 단원 복귀 및 letter-write 완료 배지 확인. 사용자127.0.0.1 탭/진도는 건드리지 않음.
- 실제 한글700/영어system-ui92낱자 검수판: 모든 글자 경로 존재, 경로 표본 ink>=99.8%, LINE_WIDTH60 synthetic sweep>=99%. 이는 저장된 가이드/마스크 검수이며92자 전체 실사용 입력/FPS 검증은 아니다. 첫 가이드 연산 max24.7ms 관측, 실기기FPS는 미측정.
- ㄱ 큰 화면, ㅐ 가로812×375/568×320, 합성 쓰기 overlay/replay0, 영어 Aa 가로2크기/다시 보기 demo와 hint 동시 확인. viewport 복구/검수 탭 닫음.
- 화면 증거: C:/Users/kil21/.codex/visualizations/2026/10/11/01a12b90-4491-7c02-b97d-b867f6ec4b02/tangobook-standalone-letter-writing.png. 검수판은 output/writing-strokes-20261013/guide-preview.html(로컬 검수용·미커밋).
- 보존: 기존 ReviewWriteActivity.test.tsx 줄바꿈 변경, 다른 worktree·루트 output/tmp. 이번 작업 push 승인 없음.

## 읽은 지침

handoff/작업 지도·phonics BRIEF/MEMORY/모음 획순 task·루트/phonics/learner CLAUDE·PLATFORM/design-system. 공용 쓰기 검토 시 games BRIEF/CLAUDE도 확인. PLATFORM/STRATEGY에는 최종 낱자 우선 순서와 이유 기록.

최종 스타일 보완 후 client tsc/추가 TSX ESLint/production build 재통과. 기존 Browserslist·Lottie eval·큰 chunk 경고만 있으며 새 런타임 의존성은 없다.
