# Game Sound Effects

현재 3개 모두 **Placeholder silent mp3** (0.2초, 96kbps mono).
사용자가 CC0 (Creative Commons Zero) 실음원으로 교체 예정.

## Files

- `correct.mp3` — Placeholder silent. 정답 시 재생 (ding/chime 예정)
- `incorrect.mp3` — Placeholder silent. 오답 시 재생 (soft "음?" 예정)
- `clear.mp3` — Placeholder silent. 게임 클리어 시 재생 (짧은 fanfare 예정)

## 교체 가이드

조건:

- 각 파일 <50KB (≈ 96kbps mono mp3 800ms 내외)
- 짧고 온화. 공격적·놀라는 톤 금지

후보 출처:

- freesound.org (CC0 필터)
- OpenGameArt.org (CC0 카테고리)
- pixabay.com/sound-effects (CC0/상용 혼재, 라이선스 확인)

편집 예시:

```bash
# 800ms로 잘라 -14 LUFS 정규화 후 96kbps mono mp3 출력
ffmpeg -i input.wav -t 0.8 -af "loudnorm=I=-14:LRA=7:TP=-1" -ac 1 -b:a 96k correct.mp3
```

교체 후 아래 표에 출처/저작자 기록:

| 파일          | 출처 URL | 저작자 | 라이선스 |
| ------------- | -------- | ------ | -------- |
| correct.mp3   | TBD      | TBD    | CC0      |
| incorrect.mp3 | TBD      | TBD    | CC0      |
| clear.mp3     | TBD      | TBD    | CC0      |
