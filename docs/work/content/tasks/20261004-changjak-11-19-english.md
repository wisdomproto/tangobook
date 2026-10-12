# 창작동화 11~19 영어 번역

- id: 20261004-changjak-11-19-english
- domain: content
- status: complete
- updated: 2026-10-04
- base: 07ec9a5d
- branch: codex/content-changjak-01-10-tts
- worktree: C:/Users/101024/.codex/worktrees/changjak-01-10-tts/tangobook
- integration: 미통합
- delivery: 영어 번역 완료·로컬 커밋·운영 등록/main push 미요청

사용자 "좋아. 11-19도 번역 ㄱ"에 따라 앞서 완료한 01~10 영어 원고 작업을 같은 worktree에서 확장한다. 11~15(bung,dingding,taro,yuki,mina) 각50권,16~19(kota,moya,bami,dari) 각25권,총350권/3,500쪽. 영어 제목과 페이지 본문을 번역하며 기존 한국어·삽화·음원·운영 데이터는 보존한다. 새 TTS 생성이나 운영 등록/main push는 이번 요청에 포함하지 않는다.

현재 운영 GET으로 원문을 새로 읽어 D:/tangobook-audio/changjak-series-11-19-20261004/books-before에 백업한다. 과거 단어 삽화 작업의 백업으로 최근 교정 원문을 추정하지 않는다. 정확한 대상 ID 집합과 10쪽 번호를 검사하고,직접 원문/장면 설명을 대조해 번역한다. 앞선 4B 번역의 의미 반전 사례로 미검토 자동 번역은 채택하지 않는다. 위임 미승인으로 워커 실행 없이 직접 진행한다.

번역은 D 작업 폴더 translations에 저장한 뒤 `scripts/changjak-translation-review.py --scope 11-19 --root <D 작업 폴더> --export`로 sourceSha256·제목·쪽 번호·영어 완전성 검사와 한국어/영어 비교 화면을 만들고,검증한 책만 docs/changjak-books/translations/en에 내보낸다. 기존 01~10 500개는 보존한다. 진행 수량·검증 결과는 실제 파일로 갱신한다.

운영350권/3,500쪽 백업 및 연속쪽 번호 검사 완료,기존 영어 본문0쪽. 붕이·딩딩·타로·유키·미나01~50 및 코타·모야·밤이·달이01~25의350권/3,500쪽 직접 번역 및 원문 대조 완료,남은 책0권. `--scope 11-19 --export`는350권/3,500쪽의 정확한 ID 집합·원문 해시·제목·쪽 번호1~10·영어 본문 검사를 통과했고,기존01~10도500권/5,000쪽 검사 재통과. 총850권/8,500쪽 JSON을 보관한다. scope는 검토 도구에만 확장했으며 기존 TTS 생성기의01~10 범위는 그대로다. 01~10의 기존 영문 음원27개 텍스트 불일치는 앞선 번역 수정에 따른 재생성 대기로 그대로 보존한다.

이름은 Bung,Ddori,Dingding,Taro,Mumu,Yuki,Momo,Mina,Raju,Sonu,Kota,Moya,Kiki,Tumba,Nia,Bami,Nabi,Pipi,Dari,Kongal,Kkiruk 등 캐스트별 정본을 사용한다. 무무/키키는 다른 시리즈와 이름이 같아도 종·성별을 가져오지 않는다. 원문 친족 호칭 검색에서 타로49·달이09/24는 남자아이 근거가 있고,밤이의 사슴 누나/양 언니는 단역의 호칭이다. 붕이·또리 성별은 추정하지 않았다.

붕이38 p1의 "강물이 누렇게"는 기존 물 팔레트와 달라도 홍수 장면 원문 의미를 보존했다. 프롬프트/한국어 교정은 이번 범위가 아니다. 붕이03 p8은 돌아온 배의 과정이 원고에 없으므로 번역에서 새 회수 사건을 발명하지 않았다. 원문 건강 문장을 옮기되 새 효능이나 조언을 덧붙이지 않는다.

최종 대조에서 딩딩02 p8의 논 위칸 이동을 실내 upstairs 대신 higher rice field로 명확히 했고,밤이24의 제목/반복 구호를 "When the Train's in Sight, It's All Right!"로 원문과 일치시켰다. 코타 손님의 두루미/왜가리/하마 등 종,모야의 아는 친구 곁에서 기다리는 행동,밤이의 발로 손잡이를 잡는 의인화,달이의 아빠 동행 물놀이와 형아 호칭을 유지했다.

로컬 비교 화면: D:/tangobook-audio/changjak-series-11-19-20261004/english-review.html. 원문/번역/진행 파일은 같은 D 작업 폴더에 보관한다. JSON 내보내기 일치·기존01~10 자산 보존·비교 화면 스크립트 구문·문서 경로/diff 검사를 완료했다. 형식 검사는 의미 검토를 대신하지 않으며,음원 청취/운영 등록/main 통합은 수행하지 않았다.
