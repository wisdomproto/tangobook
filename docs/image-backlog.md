# 만들어야 할 이미지 list

디자이너/AI 이미지 생성 backlog. 우선순위별로 정리. 작업 완료 시 ✅ + commit hash 표기.

---

## 🟡 도감 카테고리 일러스트 (6장) — 2026-05-04 추가

**컨텍스트**: `/collection` 페이지의 6 카테고리 카드 배경. 현재는 통일 그라데이션 + emoji 만 (CollectionPage.tsx:130~). 카테고리별 시각적 정체성을 위해 디자이너 일러스트 6장 필요.

**스타일 가이드**:
- 호리 톤 (Warm&Cozy + Playful, [memory/viewer-brand-tone.md](../memory/viewer-brand-tone.md))
- 1024×1366 (3:4 비율 — 카테고리 카드 aspect)
- 단색 배경에 일러스트 1~2 요소 (정신없지 않게)
- 텍스트 X (한글 표기는 코드 overlay)

**6장 list**:
| 카테고리 | emoji | 일러스트 컨셉 |
|---|---|---|
| 동물 (animal) | 🐅 | 호리(또는 다른 동물 친구) 한 마리, 풀밭 위 |
| 음식 (food) | 🍎 | 사과·빵·당근 잔치 식탁 위 단순 정물 |
| 마법 사물 (magic-object) | ✨ | 별이 흩날리는 마법 지팡이 또는 보물상자 |
| 사람·캐릭터 (people) | 🧑 | 호리가 친구들과 손잡는 따뜻한 장면 |
| 자연 (nature) | 🌿 | 나무·꽃·해 한가운데 평화로운 풍경 |
| 집·장소 (home) | 🏠 | 따뜻한 굴뚝 연기 나는 작은 집 |

**적용**: 생성 후 R2 `collection-categories/{id}.webp` 업로드 → CollectionPage.tsx 의 그라데이션을 image background 로 교체.

---

## (다른 이미지 작업 추가 시 여기 아래)
