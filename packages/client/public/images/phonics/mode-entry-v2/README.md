# 한영 모드 선택 그림 v2

2026-10-17. 한글·영어 공용. 모드 이름과 안내는 DOM으로 유지한다.

## 생성·출력

- imagegen 스킬 / 내장 image_gen 사용. 지정 ComfyUI 설치·서버가 없어 사용자에게 알리고 내장 도구로 생성했다.
- 원본1536×1024 PNG는 Codex generated_images에 보존. Pillow LANCZOS로960×640 축소, RGB WebP quality82/method6. 창작 내용 후처리 변경 없음.
- curriculum.webp: 96,040 bytes, 원본 exec-b5b57b58-86dd-488a-bd23-247e7418d3c7.png.
- free.webp: 107,068 bytes, 원본 exec-a1971bfc-8651-409a-869c-08da3395a07c.png.
- 기존v1 지도 파생 자산 보존. v2 경로로 캐시 구분.

## 프롬프트 세트

공통: Premium preschool educational website card, landscape3:2. Handcrafted storybook miniature diorama, soft rounded sculpted forms with subtle gouache texture. Warm ivory, peach-coral, sage, mint, buttery yellow; soft daylight, restrained edge foliage and tiny flowers. Large readable subjects, central crop-safe composition. No words, letters, numbers, labels, UI, wood planks, cloud buttons, people, mascot, treasure chests, RPG or gacha imagery.

Curriculum: One clear winding learning trail from lower left to upper right through a mint meadow. Exactly four LARGE sequential stepping-stone stations: coral speaker, mint colorful geometric blocks, golden chunky pencil and notebook, welcoming open storybook and tiny pennant. Path visibly connects stations in order. Front three-quarter view, progression readable to a four-year-old, no empty central lawn, tactile painterly art without plastic gloss.

Free: Four equally prominent free-choice areas in balanced2×2 on one meadow: chunky geometric blocks; open cream notebook and coral pencil; large colorful palette and brush; magnifier over flower-and-butterfly picture puzzle. Small pastel circular mats, no boxes/card borders. NO sequential route or connecting path. Large central subjects readable at small card size, quiet background, coherent storybook scene rather than collage/icon sheet.

## 표시

기본3:2 전체 그림. 짧은 가로/세로 휴대폰은 contain, 세로는 그림/문구 좌우 배열로 주요 오브젝트를 자르지 않는다. 실제 검수는 docs/work/phonics/tasks/20261017-mode-choice-illustrations.md.
