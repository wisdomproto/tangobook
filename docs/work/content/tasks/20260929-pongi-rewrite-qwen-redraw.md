# 퐁이네 수정 후보·우선 검토 원고 개작과 Qwen 재작화

- id: 20260929-pongi-rewrite-qwen-redraw
- domain: content
- status: complete_local
- updated: 2026-09-29
- branch: main
- scope: [50권 글 검토](20260929-changjak-all-series-text-review.md)에서 `수정 후보` 또는 `우선 검토`인 23권(02·03·07·09·14·15·17·18·19·20·25·28·29·34·35·36·37·39·40·43·46·49·50). `경미`, `군더더기 후보`, `통과`는 이번 원고 수정 대상이 아니다.
- delivery: 23권 본문·대응 SCENE 수정, Qwen 2.1로 재작화 후 개별 이미지 검수. 운영 연결·Git push는 별도 검증 뒤 판단.

## 사용자 결정

사용자는 `수정 후보`·`우선 검토` 원고를 다시 쓰고 그림을 다시 그리자고 했다. 이어 `경미는 냅두고`, `다시 그리는건 qwen 사용`, `바뀐 장면만 다시 그리기`로 범위와 모델을 확정했다.

## 진행과 검증 기준

2026-09-29 원고 23권을 대상으로 기존 50권 글 검토의 쪽별 반증을 기준으로 개작했다. 01~25권 보존을 권하는 옛 시리즈 지침은 이번 사용자의 명시적 개작 요청보다 우선하지 않는다. 기존 `output/`과 다른 작업 변경은 보존했다.

본문과 SCENE은 같은 쪽에서 인물·동선·소품·시간이 일치해야 한다. 그림을 새로 그리기 전에 두 원본을 맞춘다. Qwen 결과는 실제 PNG를 한 장씩 열어 본문, 캐릭터, 해부, 소품, 핵심 인원과 개수를 확인하고 현재 파일 해시로 기록한다. 생성만 된 컷을 검수 통과로 보지 않는다.

사용자 답변으로 **바뀐 장면만 재작화**를 확정했다. 23권 원고의 지적 사항을 수정했고, 그림 동작이 달라진 21권 **60쪽**의 SCENE을 갱신했다. 19·43권처럼 본문 표현만 고쳐 기존 그림이 맞는 쪽은 생성 목록에 넣지 않았다. 36권 p9의 손잡기 연속성, 37권 p2~p3의 구명조끼 위치 등을 재독해하며 바로잡아 59장에서 60장으로 늘었다. `parseBooks`로 전체 50권 각 10쪽 유지, `check-series-draft.mjs pongi` 실행(기존 포함 경고, 치명 오류 없음)을 확인했다. 생성 목록은 `D:/ComfyUI-output/pongi-qwen-revisions/source.json`에 본문·장면·캐스트와 함께 보관한다.

ComfyUI API `127.0.0.1:8189`는 확인 시 큐 0/0이었다. Qwen Image 2.1 INT8, VAE, Pruna 8-step LoRA 모델은 `D:/ComfyUI-models`에 있고, 01권 과거 시트·실험 PNG가 로컬에 있다. 미나용 `D:/ComfyUI-output/mina-series-qwen/run.py`는 코끼리 전용이므로 퐁이에 그대로 실행하지 않는다. 퐁이 캐릭터 기준은 `docs/art-direction/pongi-sheets/01-pongi-front.png` 및 별도 운영 시트를 대조해야 한다.

Qwen 25스텝으로 퐁이 참조와 아빠·엄마·동생 시트를 생성해 직접 열었다. 거위 1차 시트는 수달 얼굴로 나와 폐기하고 두 번째 흰 거위 시트를 검수했다. 37권 p3은 Qwen 재생성과 참조 편집으로 조끼가 물에 떠 있고 갈색이며 퐁이 목끈이 붉은 최종본을 얻어 직접 검수했다. 시험 원본·수정본/API/history는 D 작업 폴더에 보존한다.

전용 배치 러너 `D:/ComfyUI-output/pongi-qwen-revisions/run.py`로 60쪽의 1차 PNG 생성을 마쳤다. `reviews.json`에는 **직접 본 현재 PNG의 SHA-256**만 판정했다. 1차에서 14장 통과, 46장 재작업이었다. 상세 프롬프트 재생성과 Qwen 참조 편집으로 잘못된 인원·소품 개수, 제스처, 의상, 익힌 물고기 모양 등을 수정했다. 각 수정본도 한 장씩 직접 열어 보고 맞는 것만 `promote.py`로 이전 PNG를 보존한 뒤 최종본으로 승격했다.

최종 결과는 **21권 60장 생성·육안 검수 통과**다. 권별 수량·선정 PNG 경로·SHA-256·검수 메모는 [선정 manifest](20260929-pongi-qwen-selected.json)에 있다. `verify-selected.py`로 60장 모두 PNG 1280×720, 최종 파일 SHA-256 = `state.json` = `reviews.json`, 통과 상태를 대조했다. 19·43권은 문장만 수정되어 새 그림 0장이다. 원고 `parseBooks`의 60쪽 본문과 생성 `source.json`의 텍스트도 일치한다. 36권 p9는 최종 그림과 반복 대사의 손잡기 장면이 맞도록 “엄마 앞발 꼭 잡고 건너!”로 간결히 고쳤다.

`build-series-html.mjs pongi`로 50권·500컷을 다시 빌드하고 이번 23권 HTML만 남겼다. `check-series-draft.mjs pongi`, `check-scene-seam.mjs pongi`, `git diff --check` 모두 종료 코드 0이다. 검사 경고는 남아 있다. 예를 들어 SCENE 검사 17건 중 28권 p8은 인물에 거위가 명시돼 있으나 누락 경고가 떠서 검사 출력만으로 그림을 불합격시키지 않았다. 해당 60장 실제 그림은 별도로 검수했다.

## 남은 범위

선정 PNG는 로컬 `D:/ComfyUI-output/pongi-qwen-revisions`에 있다. 운영 DB/R2 반영과 Git push는 이번 요청 범위에 포함하지 않았고 실행하지 않았다. 로컬 원고·SCENE·HTML과 manifest를 관련 변경만 커밋한다.
