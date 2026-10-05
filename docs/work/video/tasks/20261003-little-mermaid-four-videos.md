# 인어공주 한국어·영어 롱폼·숏폼

- id: 20261003-video-little-mermaid-four-videos
- domain: video
- status: integrated
- updated: 2026-10-04
- branch: codex/editor2-video-library-push
- base: d4002c2c
- output: D:/tangobook-video/little-mermaid-20261003/
- delivery: 로컬 네 완성본 검수 완료, 후속 요청으로 Editor2/마케팅 등록 및 main 통합, 외부 채널 게시 없음

후속 사용자 승인에 따른 [2026-10-04 운영 등록·main 통합·임시 파일 정리](../../authoring/tasks/20261004-little-mermaid-video-registration.md)가 아래 제작 시점의 등록/push 미수행 상태를 갱신한다. 최종본·원본·검수 증거를 보존하면서 재생성 중간 파일 621개를 정리했고 12개 미디어/561개 ledger 검증을 다시 통과했다.

## 2026-10-04 최종 결과

한국어 롱폼162.208초/숏폼39.167초, 영어 롱폼149.125초/숏폼34.500초. 롱폼1920×1080/24fps, 숏폼1080×1920/30fps의 H.264/AAC faststart. 기존 승인 Voicebox KO/EN 나레이션과 large overlay 자막88/80px를 합성했다. 사용자가 승인한 움직이는 폭풍 v3/바위 왼쪽 바다 편 뒷모습 은신 v4, 같은 source 자동 미세 확대 분할 제거를 반영했다. 추가 검수에서 KO 숏폼의 단독 ‘있어!’와 EN 숏폼 ‘sea.’를 뜻 단위로 묶고 숏폼만 다시 출력했다.

선정27개 source 촘촘한 표본 전수 육안 승인, RealESRGAN x2 전27개 프레임 수/FPS/2배 해상도/원본·모델 SHA guard 통과, 전27개 첫·중간·끝 비교 sheet 직접 확인. 네 완성본 전체 decode/A-V/codec/faststart/black/loudness 검사 통과. 실제 자막61/62/18/18개와 비트 진입·종료 합279표본의 contact30장, 실제23/23/10/10 shots의 sheet12장 및 phone preview4장 모두 직접 확인했다. 재생 오류/검정 구간 없음, 인원·손·그림체/자막 가독성 표본 이상 없음. 증거는 각 `ko-long`, `en-long`, `ko-short`, `en-short`의 `qc/`, `final-review.json`에 최종 SHA로 연결한다. 자동 전체 검사와 표본 육안 검수이며 모든 프레임 시청/전체 수동 청취를 뜻하지 않는다.

파일: `D:/tangobook-video/little-mermaid-20261003/little-mermaid-{ko,en}-{long,short}.mp4`. 별도 SRT, 동일 언어 타임라인의 narration MP3/clean master, KO/EN YouTube 썸네일·게시 초안 및 해시 ledger는 `package.py`로 준비한다. clean master는 BGM/효과음만 포함하며 나레이션/자막을 다시 합칠 때 같은 언어 파일을 사용한다. `DELIVERY.md`, `delivery-provenance.json`, `delivery-validation.json` 참조. native576p H3를 프레임별 AI 향상한1080p 출력이며 시간 보간/반복/감속은 없다.

패키지 완료: `package.py` exit0, `validate_delivery.py`로 최종4MP4+clean4MP4+narration4MP3의 전체decode/길이 및 영상 해상도 통과, ledger561파일 SHA/크기 전수 일치. KO/EN1280×720 썸네일 두 장 실제 육안 확인으로 제목/부제/얼굴 잘림 없음. 네 최종본 freeze 후보0, 음량 KO-long -18.1LUFS/-4.2dBFS, EN-long -18.1/-2.6, KO-short -18.4/-5.6, EN-short -18.0/-3.0. 음원 생성/등록 상태와 영화 완성을 구분하며 위 파일과 증거가 이 작업의 완료 기준이다.

이 아래는 과거 진행 기록이다. 최종 제작 상태는 위 결과가 우선한다. 앱 코드/운영 책/R2/DB/마케팅 등록/외부 발행은 변경하지 않았다. 저장소 변경은 기억 문서뿐이며 현재 브랜치에서 로컬 커밋, main 통합/푸시 없음. 외부 등록은 별도 요청 범위다.

## 2026-10-04 사용자 편집·구도 수정

사용자가 수정 초반 시안을 보고 “완벽하다”로 편집/은신 구도를 승인했다. 이 선정본을 네 영상에 유지한다. 27개 RealESRGAN x2 향상 완료 후 프레임 수/FPS/원본 SHA/모델 SHA/2배 해상도 검증 통과, 전27개 실제 before/after 비교 sheet의 첫·중간·끝3표본을 직접 확인해 `enhanced/quality-review.json`에 승인 SHA를 기록했다. 현재 KO/EN 롱폼 최종 렌더 시작; 숏폼 렌더/완성본 QA/패키지는 다음 단계다.

사용자가 초반 한 장면 안에서 조금 확대되는 짧은 컷들이 중복처럼 느껴진다고 지적했다. 실제 원본 offset은 이어졌지만 비슷한 구도의 자동 punch-in이 반복 인상을 만들었다. 최종/시안 renderer에서 롱폼 55%, 세로 53% 위치의 자동 확대 분할을 제거했다. 컷은 실제 장소·행동·시점 변화에만 사용하며 같은 소스의 미세 확대를 편집 변화로 취급하지 않는다.

숨는 컷은 인어가 사람들이 오는 오른쪽에 노출되어 은신 논리가 어색하다는 반증을 수용. Qwen-Image-2.1로 바다 쪽 왼편에 인어, 인어와 오른쪽 접근자 사이에 불투명 바위, 바위 너머 열린 모래에 잠든 왕자가 보이는 새 구도를 요청했다. 인어는 카메라에 등을 보이고 얼굴이 전혀 보이지 않아야 한다. 기존 긴 바지/원본 페이퍼아트와 캐릭터는 유지한다. 후보 생성·검수 후 H3 재생성 및 초반 시안으로 확인한다. 기존 앵커/영상/검수 기록은 별도 revision에 보존한다. 현재 전체28 source 생성은 완료됐으나, 전체 검수·향상·네 완성본 조립은 아직 미완료다.

수정 완료: `assets/hide-backview-v4.png`는 새 구도 후보의 바지 길이를 한 번 더 교정한 선정본. 두 Qwen 후보를 직접 확인했고, 바지 금색 장식은 일부 단순화됐으나 크림색 셔츠/남색 긴 바지/샌들·원래 캐릭터는 유지했다. MiniMax H3 새 hide7.29초를 생성해 0.25초 간격31표본/4contact page 전부 확인: 얼굴 노출·고개 회전·바위 위로 올라옴 없이 뒷모습/보호 바위 위치를 유지, 파도/포말 이동도 보인다. `revisions/hide-backview-v4/accepted.json` 및 루트 motion proof에 실제 SHA 승인, 앞 구도는 `revisions/hide-front-v2/`에 보존했다.

한·영 롱폼 초반 시안을 다시 합성해 각20.708/18.500초, 3개 비트=3개 연속 source shot, 모든offset0/자동 확대 없음 확인. 두 언어 전체decode/A-V/음량/검정/정지후보 검사 통과, 각8자막+6비트 진입·종료14표본 contact2장 육안 확인. KO 작은 화면 시안도 확인. 새 파일 `little-mermaid-ko-long-opening-backview-v4-preview.mp4`, `little-mermaid-en-long-opening-backview-v4-preview.mp4`, 검수 `revisions/hide-backview-v4/opening-preview-review.json`. 이 시안은 native source를 확대 합성한 초반 일부이며 전체 AI 향상 완성본이 아니다.

이번 대기 중 남은 H3 source의 모든 생성 contact page도 직접 확인해, 최종 선정27개(미사용 가로release 제외) 각각 SHA 검수 완료. `enhanced/source-clips.json`에 승인된27개만 묶고 기존 RealESRGAN x2 영상 향상 시작. `production-status.json`의 낡은 승인1개/새참조0개 숫자를 실제 해시 기준 승인27개/새참조11개로 갱신했다. 현재 실제 worker는 `upscale_video.py`이며 최신 세션은 로컬 `current-workers.json` 참조. 향상 검수/최종 네 영상 렌더·완성본 검수·패키지는 여전히 남았다. 외부 등록/게시 없음.

## 요청과 제작 기준

사용자 “인어공주도 영상 만들자”. 앞서 승인한 MiniMax H3/Qwen-Image-2.1/Voicebox 흐름, 한국어·영어 가로 16:9 2~3분 및 세로 숏폼, 큰 영상용 자막 기준을 이어간다. 폭풍/왕자 구출을 첫 사건으로 배치하고 그림책 낭독 호흡을 피한다. 기존 책 1772181399388의 분홍 머리 페이퍼아트 캐릭터를 유지한다. 칼을 버림→물거품→하늘 친구들 결말을 유지하며 재회/키스를 추가하지 않는다. 운영 데이터·옛 영상은 보존한다.

## 확인과 진행

공통 handoff/작업 지도, video BRIEF/MEMORY, longform-video CLAUDE, video-producer, 기존 신데렐라/백설공주 제작 스크립트를 읽었다. `claude/little-mermaid-video-60fbcb` 기존 worktree도 확인했으며 오래된 미커밋 업로드 자료는 수정하지 않는다.

현재 운영 원본은 `https://www.tangobook.co.kr/api/storybooks/1772181399388`에서 읽기 전용 조회. 캐시를 최신 원본으로 갱신하고 14쪽 삽화/5개 캐릭터 시트/BGM을 내려받았다. 실제 11쪽은 삽화가 없고, 왕자님 항목도 참조가 없지만 별도 왕자(평상복) 참조가 있다. 원본 전수 contact sheet 4장을 육안 검토했다. 원본 2쪽은 달/별만 있어 배를 언급한 초안 대사를 수정했고, 7쪽은 변신 진행 중이라 두 다리를 얻은 별도 앵커가 필요하다.

한/영 롱폼22비트·숏폼8비트 대본과 STORYBOARD/BRIEF 작성. Voicebox 17493 기존 건강 상태/CUDA/1.7B 확인 후 승인된 KO/EN 프로필로 나레이션 생성 시작. ComfyUI8190 큐는 시작 시 비어 있었다. GPU 생성은 겹치지 않는다.

한/영 60개 최종 나레이션 준비 및 Whisper medium CPU int8 대본/해시 대조 전수 통과(최저 정규화 일치율 0.913). 원본 본문 재대조로 성 앞 발견 장소, 마법으로 두 다리 획득, 아픈 발걸음과 말 없는 춤을 반영했다. 열다섯/15, 일부 한국어 동음 인식 차이는 ASR 기록에 그대로 남긴다. 음원+기본 간격 기준 ko-long161.78s/en-long146.50s/ko-short38.48s/en-short33.84s이며 실제 renderer의 EN 간격·종료 간격·fps 정렬로 최종 길이는 달라진다. 교정 전 음원12개 보존. 음원 완료 후 Voicebox 정상 unload API로 모델만 해제했으며 프로필/파일/서버는 유지했다.

Qwen 새 앵커10장 순차 생성 중. legs/sisters/prince-rest는 실제 이미지와 원본 참조를 육안 대조해 승인 해시 기록. hide 첫 후보는 앞선 p04와 달리 왕자가 반바지를 입어 보류, 기존 두 그림을 참조한 긴 바지 수정 후보를 추가 요청했다. ComfyUI 단일 대기열로 직렬 처리하며 다른 작업을 취소하지 않는다. 숏폼의 storm/witch/silent/wedding/sisters/release 주요6장면은 별도 세로 앵커로 전체 얼굴이 들어오게 구성한다. H3 계획28컷. 런타임 공통 helper는 승인된 신데렐라에서 이 작품의 runtime 폴더에 보존했다.

원본 BGM79.9347초는 2초 crossfade로 연결해 이어붙이는 소리를 피하고, 첫 폭풍 장면에는 로컬 합성한 약한 천둥 효과를 사용한다. 최종 자막 크기는 long88px/short80px, 2줄 이하, 흰색·어두운 외곽선이며 화면 위 overlay를 유지한다. 백설공주 개선본의 RealESRGAN x2를 재사용할 준비를 했고, 실제 생성·업스케일 검증은 다음 단계다.

## 검증과 다음 행동

나레이션 완료 후 음성 SHA/실제 길이/Whisper 대본 대조. 2쪽 대사 수정 이전에 TTS가 로드한 초안은 해당 컷만 재생성한다. 필요한 Qwen 앵커를 생성하고 개별 육안 검수한 해시만 H3에 투입. 손/팔, 잠든 왕자의 눈, 사람 형태/꼬리, 반복/전환 그림체 오류를 첫·중간·끝 프레임으로 확인한다. 한/영 타임라인을 각각 맞추고 1080p 완성본/SRT/나레이션과 원본을 로컬 전달한다. 현재 영상 생성·완성본 검수는 아직 진행 전이다.

추가 검수: hide-pants-fixed는 원본과 같은 긴 남색 바지로 수정해 승인했다. sisters-portrait 첫 후보의 중복 공주를 제거한 sisters-portrait-fixed를 선정했으며 원본 후보는 보류 기록으로 남겼다. 폭풍/마녀/침묵/칼을 버리는 세로 앵커도 인원·손·의상·페이퍼아트 일관성을 실제 확인했다. 현재 새 선정 앵커10장 중9장 승인, wedding-portrait 마지막 후보 생성 중. 자막 실제 발화 타임스탬프 기반60음원/159개 캡션 사전 검사에서 모두2줄 이하 및 폭 한도 통과.

첫 H3 폭풍 후보에서1.25~5.5초 책장 넘김이 화면을 가리는 반증 발견. prompt의 금지 문장과 첫/끝 guide만으로 연속성이 보장되지 않는다. 후보/그래프/촘촘한 검수 sheets는 rejected/page-wipe-v1에 보존. 배치 제출 worker를 중단해 후속 낭비를 막았고 이미 계산 중인 rescue prompt는 공유 Comfy에 그대로 둔다. 백설공주 style-fix-48s에서 검증된 positive scene-only 문장과25/50/75% 중간 guide를 더한 dense-positive-v2로 폭풍 한 컷 재시험 중. LoRA가 원인이라고 단정하지 않는다. 현재 원본 H3 검수 통과 컷0개이며 완성 영상은 아직 없다.

구형 rescue가 실제 실행 중인 자기 prompt임을 queue로 재확인한 뒤 해당 계산만 interrupt했고 다른 큐는 유지했다. dense-positive-v2 폭풍은0.25초 간격33표본/4contact page 전수 육안 확인에서 책장/그림체 전환 없이 동일 장면·인원·손을 유지해 승인. 나머지27컷 생성 배치를 시작했다. 실제 사용한 새 앵커10장은 모두 승인 완료. 한/영 가로/세로 실제 ASS 크기 정지 시안4장을 확인해 얼굴·가장자리 겹침 없이 가독성을 확인했다.

진행 검수: storm/rescue/hide/palace 네 source clip이 직접 contact page 확인 후 SHA 승인. 초반 한국어 native-preview20.708초를 합성해 전체 decode/검정/정지 후보/A-V/음량 검사 통과(-18.4LUFS), 모든8자막/6비트 진입·종료14표본 및 작은 화면 시안 확인. 이 파일은 초반 편집 시안이며 최종 향상본이 아니다. CPU watch_motion_qc.py는 완성된 source에 검사 sheets만 생성하고 사람 승인 기록을 자동으로 만들지 않는다. 전체 H3 배치 worker와 별도로 release/release-portrait만 같은 Comfy FIFO에 먼저 제출해 칼 낙하 위험을 조기 검수한다; GPU 동시 계산은 없음, 본 배치는 일치하는 해시/설정의 완료 캐시를 건너뛴다.

사용자 초반 시안 반증: “우르릉 쾅 할 때 그냥 이미지 아냐? 조금이라도 움직이는 게 나을 것”. 중간 guide로 화면 오류는 막았지만 움직임이 거의 정지처럼 느껴진다는 지적을 수용했다. 초반 storm/세로 storm-portrait는 중간 guide를 제거하고 첫/끝만 유지, 파도 포말 이동·낙하 빗줄기·번개 펄스·작은 머리카락/수면 흔들림을 시간별로 명시한 opening-motion-v3 후보를 별도 생성한다. 기존 승인 컷을 바로 덮지 않고 실제 움직임/팔/얼굴 검수 후 교체한다. 로컬 Comfy server.py의 front 큐 옵션을 확인해 시험 컷을 대기열 앞으로 제출했으며 이미 실행 중인 다른 컷은 유지한다.

opening-motion-v3 가로 폭풍 후보 실제33표본/4contact page 확인에서 포말·파도 능선의 분명한 이동, 인물의 작은 수면 흔들림, 번개 밝기 변화가 나타났고 얼굴/팔/손/왕자 감은 눈·원본 그림체도 유지됐다. 이전 v2 source/초반 시안/검수 자료는 revisions/static-opening-v2에 보존하고 source storm을 v3로 교체, 한국어21초 시안을 다시 조립했다. 새 전체decode/A-V/검정/정지후보/음량/14표본 검사 통과. 세로 첫 컷 v3는 생성 대기 중. 본 배치에는 이 별도 승인 override 해시를 확인하는 guard를 추가하고 자기 pending remember만 재제출해 재개했다. 숏폼 첫 컷 source는 실제 사용3초에 맞춰 필요 길이를 산정한다(뒤부분은 구출 해변 close-up).

세로 opening-motion-v3도0.25초28표본/4contact page 확인: 앞 파도가 상승·하강하고 포말이 이동, 번개 밝기 변화, 머리카락·몸의 작은 움직임이 분명히 보이며 두 얼굴·손·감은 왕자 눈을 유지해 선정했다. 가로/세로 모두 첫 컷 수정본 source+SHA 검수 완료. release 롱폼은 칼이 창턱에 잘못 남는0.625초 이후를 제외하고 첫15프레임(0~0.625s) 낙하만 범위 승인, 나머지는 칼 없는 prince-rest의 더 가까운 반응 컷으로 전환한다. usableRanges를 향상본 검수 레코드로 전파하고 최종/시안 렌더 양쪽에서 이 범위 밖 사용을 차단했다. 이는 전체 release source 승인과 구분한다.

칼 컷 최종 선정: release-portrait는 칼이 약1.5초 안에 화면 아래로 사라져 끝까지 돌아오지 않으며 공주의 손/얼굴/드레스도 유지,0.25초 표본4장 육안 검수 통과. 롱폼에서도 이 영상의 첫1.5초를 가로 가까운 구도로 사용하기로 수정. 실제crop0.1/0.75/1.45초 확인에서 얼굴/손과 바다로 떨어지는 칼이 들어오며 칼은 아래로 나간다. 이후 칼 없는 prince-rest 반응 컷으로 전환한다. 앞선 가로 release0.625초 사용안은 대체되어 최종에서는 unused다. 한/영 숏폼 첫 자막은 문장 단위로 재분할하여 lone knew/그 사실 분리 문제 수정,60음원159캡션 preflight 재통과.
