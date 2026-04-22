# Game Sound Effects

모두 **오리지널 합성(synthesized) CC0** — `scripts/synthesize-game-sfx.mjs`로 생성된 순수 사인파 기반 SFX. 저작권 귀속 없음, 상업 이용 가능.

## Files

| 파일            | 길이   | 크기   | 내용                                  |
| --------------- | ------ | ------ | ------------------------------------- |
| `correct.mp3`   | ~0.48s | ~6.6KB | C5→E5→G5 상승 차임 (정답)             |
| `incorrect.mp3` | ~0.36s | ~5.1KB | G4→D4 부드러운 하강 (오답)            |
| `clear.mp3`     | ~0.92s | ~12KB  | C 메이저 아르페지오 + 스파클 (클리어) |

사양: 44.1kHz mono MP3 96kbps, `loudnorm=I=-16:LRA=7:TP=-1.5`.

## 재생성

파형 수정이 필요하면 `scripts/synthesize-game-sfx.mjs`의 `synthCorrect/Incorrect/Clear`를 편집 후:

```bash
node scripts/synthesize-game-sfx.mjs
```

세 mp3가 여기로 덮어쓰기됨.

## 고퀄 실음원 교체 시

녹음·샘플 라이브러리 등으로 교체하려면 동일 파일명·동일 경로로 대체. 제약:

- 각 파일 <50KB (96kbps mono 1초 이내)
- kid-friendly — 공격적·놀라는 톤 금지
- 라이선스: CC0 또는 상업 이용 허용

교체 시 아래 표 갱신.

| 파일          | 출처                              | 저작자       | 라이선스 |
| ------------- | --------------------------------- | ------------ | -------- |
| correct.mp3   | `scripts/synthesize-game-sfx.mjs` | Tangobook AI | CC0      |
| incorrect.mp3 | `scripts/synthesize-game-sfx.mjs` | Tangobook AI | CC0      |
| clear.mp3     | `scripts/synthesize-game-sfx.mjs` | Tangobook AI | CC0      |
