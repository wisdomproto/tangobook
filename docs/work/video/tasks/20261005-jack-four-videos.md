# 잭과 콩나무 네 영상 로컬 제작

- id: 20261005-video-jack-four-videos
- domain: video
- status: active
- updated: 2026-10-12
- base: d1af5ef2
- branch: codex/video-rapunzel
- output: D:/tangobook-video/jack-beanstalk-20261005/
- integration: 미통합
- delivery: 사용자 명시적 재개, 저장 음원9개 재사용·최종본0개

## 사용자 결정

2026-10-12 “로컬로 잭과 콩나무 제대로 만들자”로 중단을 해제하고 같은 네 편 제작을 재개했다. 기존 9개 음원 해시를 대조해 재사용한다. Kaggle 재개·운영 등록·main push는 요청되지 않았다. 다른 Comfy8189 서버는 유지하며 비어 있는 큐를 확인한 뒤 모델 메모리를 해제하고 Voicebox 누락 구간 생성부터 이어간다. 기존8190 제작 서버는 현재 없으므로 음성 단계 후 별도 실행한다. 생성 전 descend 롱폼 앵커를 실제 콩나무 추격12쪽으로 바로잡는다.

“KAGGLE 은 포기하고, 로컬로 잭과 콩나무 제대로 만들자.” Kaggle 시험 종료 상태를 유지하고 로컬 H3/BF16 제작으로 전환한다. 앞서 합의한 한국어/영어16:9 롱폼 약2~3분 +9:16 숏폼 네 편, 큰 영상 자막/Voicebox 기존 승인 프로필/기존 캐릭터 참조/필요한 신규 Qwen2.1 삽화/RealESRGAN 검수 파이프라인을 적용한다. 이번 제작은 이전 라푼젤 완성본 승인이나 삭제가 아니다. 완성본을 사용자에게 보여 컨펌 후 다음 책. 운영 등록/main push/외부 발행 요청은 이번에 없음.

## 각색·원본 확인

페이퍼아트 책1772510956605의 실제15쪽 원문·한영 번역과 전체 삽화/캐릭터26이미지를 다운로드·contact5장 전부 직접 확인했다. 원래 characters의 최신 paper sheet가 실제 페이지와 일치하며 과거 characterImages의 매끈한3D 캐릭터/파란 엄마 드레스/다른 하프는 제외한다. 잭 olive patch tunic/ivory sleeves/beige patched trousers/brown boots, 엄마 burgundy dress/ivory apron/brown shawl, 검은 덥수룩 머리·수염/녹색 종이 망토 거인, 흰색/황금 깃털 암탉, 파란 머리 얼굴 황금 하프 유지. 책 메타 설명보다 실제 페이지 참조를 우선한다.

13쪽 “엄마, 빨리 도끼를 주세요! 거인이 내려와요!”→12쪽 흔들리는 콩나무 추격→마법 콩 회상으로 시작한다. 롱폼24비트/숏폼8비트,64새 Voicebox 나레이션 구간. 암탉→금화→하프의 세 번 방문과14쪽 거인 도망 결말 유지(거인 죽음 추가 없음). 이야기에 없는 등장인물·하프 외형·프롤로그를 넣지 않는다. 도입은 제자리 이미지 확대 분할 대신 실제 몸·줄기/잎 움직임으로 검증한다.

## 현재 상태

script.json/STORYBOARD.md/BRIEF.md 생성, 기존 제작/검수 runtime·fonts를 독립 로컬 폴더에 복사. 기존 책/영상/운영 데이터 변경 없음. Comfy8190 큐가 비어 있는 것을 확인한 뒤 모델 메모리 해제, 승인한 ko/en Voicebox 프로필로64구간 생성 시작. 새 영상은 아직 없음. Kaggle시험 컷은 품질 증거로 보존하되 본편source는 실제 대사 길이에 맞춰 검수한다.

## 남은 단계

Voicebox 음성 ASR/대사·길이 확인→모델 unload→Qwen scene/portrait refs 생성·모든 이미지 직접 검사→로컬 H3 source 직렬 생성·동작 검수→RealESRGAN x2/전후 검사→KO/EN 네 최종본1080p·큰2줄 자막/전체 decode·음량·caption/shot/phone 표본 검사→SRT/MP3/clean master/표지 보존→사용자 컨펌.

## 사용자 중단 (2026-10-05)

“멈추자. 나중에 다시 하는걸로”에 따라 즉시 후속 stage worker65196과 Voicebox client worker58560만 종료했다. 두 Python process 부재 및 Comfy8190 running/pending0개 확인. 기존 Voicebox/Comfy 공유 서버와 다른 작업은 유지했다. /generate/stream는 active generation 목록에 등록되지 않는 API이며 이미 보낸 한 구간의 backend 계산을 별도 ID로 취소할 수 없으므로 공유 서버를 강제 종료하지 않았다. 후속 신규 요청은 없다.

현재 저장된 KO 롱폼WAV9개,64구간 각색·본책 JSON·원본26이미지·수정한 identity crop·16개 Qwen 후보 지시·H3/검수/render 스크립트를 보존. 새로운 Qwen candidate/H3 source/최종 영화0개. 로컬 production-status.json/PAUSED.md에 명시적 중단·worker/PID·9음원 SHA·다음 행동 기록. 자동 재개 없음.

재개는 생성된9구간을 재사용하고 누락 구간부터 Voicebox를 이어서 만들기→음원 ASR·caption preflight→모델별 unload 확인→Qwen16앵커 생성→전수 직접 육안 검사/승인→로컬 H331~32source(실제 음성 길이에 따라 연속 oven 컷 병합 가능)→동작/화질/네 편 검수 순서다. 아직 실제 H3 plan-only를 실행할 완전한64음성 기록이 없어 source 수·최종 길이는 예상이다. 참조crop1차에 다른 view 일부 포함/oldman얼굴 잘림을 실제 확인하여 한 캐릭터 front 중심으로 수정했다. 새 생성 이미지 검수 전 자동 approve하지 않는다.
