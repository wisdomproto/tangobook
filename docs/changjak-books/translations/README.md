# 창작동화 영어 원고

창작동화 01~19 시리즈 총850권/8,500쪽의 운영 한국어 본문을 직접 대조해 번역한 영어 제목과 쪽별 본문이다. 01~10은500권/5,000쪽,11~19는350권/3,500쪽이다. `en/{bookId}.json`에 저장했으며 정확한 대상 집합·원문 해시·10쪽 구성을 전수 확인했다. 번역 완료는 음원 제작이나 운영 등록 완료를 뜻하지 않는다. [01~10 작업 기록](../../work/content/tasks/20261004-changjak-01-10-voicebox-tts.md)과 [11~19 작업 기록](../../work/content/tasks/20261004-changjak-11-19-english.md)을 따른다.

`bookId`는 원본 책 ID, `sourceSha256`은 `scripts/changjak-voicebox-tts.py`의 `source_hash`로 만든 원문 식별 값이다. `pages[].pageNumber`는 원본 `page_number`와 대응한다. 한국어 원문 또는 장면 설명이 바뀌면 해시를 먼저 대조하고 번역도 다시 검토한다. `reviewed`는 원문 의미 대조 완료이며 음원 청취 검수나 운영 반영 상태가 아니다.

`scripts/changjak-translation-review.py --scope 01-10 --export`는 정확한 대상500권, `--scope 11-19 --root D:/tangobook-audio/changjak-series-11-19-20261004 --export`는 후속350권에서 원문 해시·제목·10쪽 번호·영어 본문이 확인된 번역만 내보낸다. 기본 scope는01~10이다. 로컬 원본/비교 화면은 D 드라이브의 해당 작업 폴더에 있으며, `--root`로 바꿀 수 있다. 이 도구는 운영 DB나 R2를 수정하지 않는다.

## 이름과 대명사

이름은 Pongi, Coco, Mei, Rudi, Ppino, Soso, Leo, Lupin, Dodo, Mumu, Nils, Grandpa Bruno, Riri, Lolo, Mio, Bobo, Lala, Gaga, Duri, Teacher Bau, Pipo, Nono, Gugu, Kiki, Lulu, Uncle Nino, Aunt Rosa, Uncle Beppo로 통일한다. 동물 어른 호칭은 원문의 종을 보존한다(Grandpa Goose, Grandpa Mole, Grandma Bear, Grandpa Sheep, Grandpa Badger, Mr. Pig, Mrs. Magpie, Mrs. Goose, Mr. Horse, Mrs. Badger).

원문 친족 호칭을 기준으로 퐁이는 she/her, 퐁이 동생은 little brother, 도도는 she/her, 무무는 he/him, 닐스·피포·노노·레오는 he/him, 리리는 she/her다. 성별이 원문에 확정되지 않은 인물은 이름이나 중성 they를 사용한다. 외모나 이름으로 성별을 추정하지 않는다.

11~19 이름은 Bung,Ddori,Dingding,Taro,Mumu,Yuki,Momo,Mina,Raju,Sonu,Kota,Moya,Kiki,Tumba,Nia,Bami,Nabi,Pipi,Dari,Kongal,Kkiruk로 통일한다. 타로49와 달이09/24의 친족 호칭에 따라 Taro/Dari는 he/him이며 다른 아이의 성별은 추정하지 않는다. 타로의 Mumu는 사슴,모야의 Kiki는 미어캣이다. 다른 시리즈의 같은 이름에서 종이나 성별을 가져오지 않는다. 단역 어른의 종과 원문 성별 호칭도 보존한다.

쪽을 합치거나 새 교훈을 덧붙이지 않는다. 대사, 수량, 부정 표현, 행동의 순서, 반복 구호를 보존하며, 다의어는 원본 장면 설명을 함께 확인한다. 기존 영문 음원이 있다면 번역 변경 후 해당 음원의 텍스트와 레시피를 다시 확인한다.
