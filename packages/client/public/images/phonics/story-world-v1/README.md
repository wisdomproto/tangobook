# Story Village — curriculum map art v1

Created 2026-10-13 for the Korean/English curriculum map. Built-in `image_gen` via the imagegen skill; local Qwen was unavailable. Source PNGs remain under the generator's local output directory. These six WebP files are the deployable project assets. See `asset-manifest.json` for source/output hashes, alpha, dimensions, and byte counts.

## Visual concept and use

Meet letter friends, complete activities, and let the village bloom. Five regions follow each language's existing five books. A flower represents a completed unit, including its existing required activities and guided vowel listening game; it is not a grade or mastery rating. Background art contains no UI, learning letters, mascot, or reward economy.

| File               | Role                                                          |
| ------------------ | ------------------------------------------------------------- |
| story-meadow.webp  | Korean vowel garden; English alphabet garden and word village |
| story-forest.webp  | Korean letter forest; English sound forest                    |
| story-bridge.webp  | Korean final-sound bridge; English sound bridge               |
| story-hills.webp   | Korean twin hills; English story hills                        |
| story-rainbow.webp | Korean compound-vowel rainbow                                 |
| story-cottage.webp | Transparent storybook cottage in the next-activity panel      |

Backgrounds are 1440×960, quality86 WebP. Cottage is 480×480 RGBA WebP. Only the selected background is requested; switching regions reuses normal browser caching. The interactive path, buttons, state indicators, and region symbols are accessible DOM/CSS/SVG, not baked into the illustration. Six matching region/flower SVG symbols live in `JourneyWorldIcon.tsx`; their color meaning follows the shared coral/mint course theme.

## Final prompt set

### Meadow

Create a finished production background illustration for a preschool phonics adventure map called Story Village. NO TEXT, NO LETTERS, NO NUMBERS, NO UI, NO BUTTONS, NO paths that look like fixed stage slots. Landscape 1536x1024 composition. Premium charming handmade clay toy / soft rounded 3D children's picture book art with subtle papery matte texture, extremely warm and inviting, contemporary Korean preschool learning game. Top-down-ish gently elevated view of a mint green meadow island with pale cream winding footpath from left middle to right middle, a little shallow turquoise stream near bottom, tiny stepping stone bridge. Five whimsical landmarks around edges: left small peach-roof storybook cottage with open book-shaped roof, bottom left rounded leafy garden of flowers, upper right grove of plump mint green trees, far right soft peach hills, bottom right a friendly rounded storybook library cottage. Center 60 percent is open soft pale mint/cream grass, low detail clear negative space for overlaying readable round learning stage buttons. Small cream daisies, warm pale yellow flowers, tiny red strawberries only near edges. Sky offwhite light teal, saturated enough to feel a real polished children's game world but restrained cream, mint, apricot peach, soft coral color palette. Soft ambient occlusion and warm morning light, tactile volumes, nice dimensional foreground foliage, no big character mascot, no treasure chest, no fireworks, no RPG, no dark fantasy, no gears, no coins, no badges. This is environment art not a screenshot; fill entire canvas, beautiful crafted composition, clear centers for UI.

### Cottage

One single premium preschool game world landmark icon, isolated with true transparent background. A charming tiny story village cottage built from an open storybook: rounded soft cream pages form base, thick peach coral open book covers curl into a roof, little mint green arched door, two round yellow warm windows, one sprout and three cream daisies around base. A small lovely winding cream path leads to front door. Entire subject fully visible with comfortable margin, centered square, front three-quarter isometric elevated view. Handcrafted matte clay toy illustration with soft rounded volumes, subtle paper texture, polished 3D ambient occlusion and warm studio illumination, beautifully crafted charming Korean children's learning app art. Palette warm cream, apricot peach, mint green, coral, pale butter yellow. No letter, no word, no text, no label, no badge frame, no UI, no sky, no colored backdrop, no coins, no treasure, no tiger mascot, no humans. This is a large readable sculptural landmark asset for a phonics adventure world, transparent outside cottage and small ground patch. NOT a flat vector icon, NOT a screenshot.

### Four region variants

Reference image: original meadow PNG (manifest source hash). Each generation used this prefix, the specific scene below, then the suffix.

Prefix: Create a NEW production preschool phonics adventure map background in the EXACT beautiful tactile 3D handmade clay storybook art style, color palette, soft lighting and elevated camera view of the reference. This is a new environment scene, not an interface. Landscape 1536x1024.

- Forest: A lush friendly forest clearing. Big rounded mint green trees, tiny peach mushrooms and pale butter daisies only around the edges; little reading nook made of an open book in a tree trunk far left edge. Warm dappled sunlight, soft light green spacious empty center.
- Bridge: A friendly riverside meadow. Shallow turquoise stream runs along the bottom edge and right edge, two rounded peach stone bridges at the corners, reeds and pale cream daisies around edges. A small open-book cottage at far left edge. Keep central grass meadow broad and EMPTY.
- Hills: A warm peach rolling hill meadow with two rounded twin apricot hills in the upper far background, butter yellow flowers, gently leafy shrubs around corners, cozy open-book cottage far left edge. Pale green grass middle is broad EMPTY space.
- Rainbow: A delightful meadow under a very soft pastel rainbow in distant sky across the upper edge, tiny sunflowers and rounded mint trees around corners, small storybook cottage far right edge, little water stream at bottom edge. Center is broad EMPTY pale green grass.

Suffix: Keep the central 65% completely calm and low-detail grass, suitable for overlaying readable learning buttons. Landscapes and landmarks concentrated only at the outer edges. Charming but polished for small children. All full image artwork no frame. NO letters, NO writing, NO text, NO numbers, NO UI, NO buttons, NO stage markers, NO characters, NO mascot, NO treasury, NO coins, NO loot, NO fireworks. A faint winding cream footpath may run around OUTSIDE perimeter only. Visually coherent with the existing story village reference, warm cream/mint/apricot palette. Every building roof subtly resembles a curling storybook cover.

## Inspection

All six original images were viewed individually. Meadow and variants leave the center usable for stages; landmarks agree with each scene. Cottage has real transparent outside pixels, preserved by encoding. Files include no credentials or private session material.
