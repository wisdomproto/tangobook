# 창작동화 2~10 최종 도안

9개 시리즈 각50권 두 장면, 총450권900장입니다. `changjak-*/lineart`는 최종 builtin imagegen 도안이며 각 시리즈의 `generation-requests.json`은 현재 원본/도안 SHA와 실제 생성 프롬프트입니다.

각 시리즈 `evidence/visual-review.json`은 현재 SHA에 연결된 전수 원본·선화·shared-engine-filled 비교 판정, `audit.json`은 정적 색칠 영역 검사입니다. `review.json`과 `evidence/local-game-evidence.json`은 시리즈별 대표 한 장의 실제 CUA 붓질·큰몸 색칠·정확한 원본쪽 리빌 증거입니다. 전900장 개별 브라우저 재생, 발화 전사나 native 자연종료 증거로 확대하지 않습니다.

원본이 제공되지 않은25장만 `source`와 `source-final-*.json`에 새 이야기 그림으로 구분했습니다. 기존 작품의 캐릭터와 쪽 본문을 참고한 신규 색 원본이며 원래 제공된 삽화가 아닙니다. `source-correction-*`는 그 신규 그림의 후속 수정입니다. `rejected`의 이전 선정 후보는 최종900장에 포함하지 않습니다.

루트의 실행/수정/생성 결과 JSON은 당시의 작업 이력입니다. 최종 상태는 시리즈별 현재 generation-requests와 review/evidence 파일을 기준으로 합니다. 미승인 중간 후보를 자동 게시하지 않았으며 원본 pixels 색 추출·영역 기준·전역 median은 변경하지 않았습니다.

게시 범위는 기존 승인된 `tests/classic-scene-coloring/20261001-review-1`뿐입니다. 운영 책 데이터 수정이나 main push는 포함하지 않습니다.

`published-asset-verification.json`은 게시본865권1730장 범위와 기존830장 SHA 보존, 새900장 원본·도안1800개 실제 플레이 버전URL 다운로드SHA가 모두 일치한 최종 증거입니다.
