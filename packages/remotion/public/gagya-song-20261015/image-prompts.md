# Image assets — built-in imagegen

2026-10-15. User explicitly requested image skill. All three new images use the built-in image_gen tool through ChatGPT/Codex. No Images API, API key, Qwen, or SVG substitute for the requested raster props. Generation parameters: stage transparent_background=false; engine and lips transparent_background=true. Original generated pixels and alpha preserved when copied to this folder.

## stage.png

Create a polished vertical 9:16 background illustration for a joyful Korean alphabet children's music video. A simple charming toy-theater stage, tactile matte clay / soft 3D picture-book finish, matching a puffy orange-coral Hangul character and a mint-green friend. Center is an expansive clean pale warm-yellow open field reserved for large animated letters, absolutely no text, letters, numbers or characters anywhere. Bottom quarter has a low rounded lavender stage floor and two subtle curved steps. Sparse oversized coral and teal toy arches at the far left and right edges, tiny playful stars in the upper outer corners. Sunny butter yellow, coral, mint, periwinkle. Straight-on orthographic front view, no dramatic perspective. Clean crisp forms, soft ambient shadows, vibrant and friendly, no visual clutter, no logos or watermark. Keep the central 70 percent of the frame open for live animated typography.

Source generated filename: exec-af9436ed-187d-45e6-b622-a61c3b784508.png. Actual output 941×1672 RGB, fitted to 1080×1920 in composition. The stage is slightly cropped to the output ratio.

## engine.png

A single adorable toy steam locomotive BODY ONLY, isolated on transparent background, clean side profile facing RIGHT. Children's Korean phonics music video prop, premium soft 3D clay illustration with plump rounded edges, matte tactile finish. Coral orange boiler, mint green driver cabin with large open dark window, lavender roof, butter yellow chimney, cheerful small white round headlight at right front. No face, no letters or numbers. Crucially NO WHEELS, NO TRACKS, NO SMOKE, NO GROUND, NO SHADOW ON GROUND: wheels and smoke will be separate animated vector parts. Flat horizontal undercarriage suitable for two animated wheels underneath. Complete uncropped body with generous transparent margins. Orthographic side view, absolutely no perspective or visible front end. Crisp beautiful toy design, large readable silhouette. Transparent PNG.

Source generated filename: exec-dbc47e62-57d1-46e9-a0da-ba109da0ac4d.png. Actual output 1536×1024 RGBA. Native Rive wheels, crank pins, connecting rod, suspension and steam added in build_assets.py. Generated raster is a side-view illustration, not an actual 3D mesh.

## lips.png

One playful cartoon pair of coral-pink lips shaped as a wide open singing mouth, front view, isolated on genuine transparent background. Children's phonics animation asset, friendly cheerful non-realistic toy clay style, matte soft 3D shading, smooth chunky rounded silhouette, small cupid's bow on upper lip and plump curved lower lip. The mouth opening MUST be fully transparent too, a large simple oval hole, because dark mouth cavity, white teeth and tongue will be separate animated parts behind this image. No teeth, no tongue, no dark fill inside the opening. Just the pink lip ring with transparent center. Width to height about 1.45:1. No face, nose, eyes, skin, hands, letters, text, shadow on ground, watermark or frame. Complete uncropped asset, large clean margins. Bright raspberry coral exterior with delicate soft highlights.

Source generated filename: exec-43591097-2b16-4e21-9e7f-087820be87d8.png. Actual output 1510×1042 RGBA. Center hole transparency confirmed; native Rive oral cavity/teeth/tongue composited behind the unchanged lip image. Scaling distinguishes open, rounded, spread apertures; no claim of anatomically validated speech therapy animation.

## Existing approved character

The orange ㄱ body is copied unchanged from ../hangul-sample-20261012/giyok-body.png, made with imagegen in the approved 2026-10-12 sample. Native Rive face and jointed limbs are retained, with a new beat dance. The body silhouette is raster; joints and timeline are real editable Rive objects.
