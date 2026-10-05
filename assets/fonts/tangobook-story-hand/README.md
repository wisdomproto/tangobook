# TangoBook Story Hand

## 전체 지원0.4.0

최신 라이브러리는 **TangoBook Story Hand Global**을 사용합니다. 현대 한글11,172음절과 자모를 자체 조형으로 확장했고, 기존 전용 글자를 보존했습니다. 부족한 라틴/중국어/일본어/태국어 글리프는 출처가 명시된 Noto OFL 글리프를 통합했습니다. 모든 문자권을 독점 새 디자인한 서체라는 뜻은 아닙니다.

- 제품 웹자산: `packages/client/public/fonts/tangobook-story-hand/0.4.0/`. 정확한 전체 codepoints,93개 WOFF2 SHA,라이선스와 출처는 manifest와 OFL 파일에 있습니다. 제목에 쓰이는 글자만 지원하는 subset이 아닙니다.
- 자체 한글 빌드: `build_full_hangul.py --output dist-expanded-balanced`, `build_global_preview.py --custom-font dist-expanded-balanced/TangoBookStoryHand-Expanded-Regular.ttf`, `build_web_global.py` 순서로 글로벌 소스와 웹 묶음을 만듭니다. 이미 만들어 둔 호환 그룹을 재사용할 때만 글로벌 빌드에 `--reuse-compatible`을 지정합니다. 소스 준비는 `scripts/prepare-global-font-sources.mjs`이며 Noto 원본 SHA/라이선스를 보존합니다. Python fontTools/brotli와 검증용 uharfbuzz/Pillow가 필요하며 정확한 파일명/CLI는 각 스크립트 기준입니다.
- 검증: `proof_full_hangul.py`, `verify_global.py`. [실제 shaping 결과](verification-global/shaping-verification.json)에서11언어 표본과 현재 제목2,415개 notdef0. [브라우저 검증](verification-global/browser-review.json)은11언어38px/18px,현재 라이브러리 제공5언어 전환/긴 제목,HTTP93파일 SHA 일치를 기록합니다.
- 현재는 로컬 코드/브라우저 검증 완료이며 main push/운영 코드 배포 전입니다. 등록11언어 글꼴 범위와 앱이 실제 제공하는 제목 번역을 구분하며 없는 번역은 한국어로 돌아갑니다.

아래0.1/0.2는 이전 제작 과정을 보존한 기록입니다.

## 아시아 확장 시험판 0.2

사용자 요청으로 등록된 아시아 언어 전체(ko/ja/zh/vi/th/ms/id)와 영어의 제목 시험판을 추가했습니다. 기존 v0.1 파일은 그대로 보존합니다.

- `dist-asian/TangoBookStoryHand-AsianTrial-Regular.ttf`, `.woff2`: **TangoBook Story Hand Asian Trial**. Unicode 299개. 영문·말레이어·인도네시아어는 기존 라틴 글자, 베트남어는 대소문자 성조/모음 변형, 일본어·중국어·태국어는 인어공주/라푼젤 시험 제목에 필요한 글자만 지원합니다.
- `preview-asian.html`: 입력·색·테두리 조절 및 실제 cmap 기준 누락 글자 표시.
- `dist-asian/coverage.json`, `verification.json`: 정확한 지원 범위와 검증. **7개 아시아 언어 전체 글자를 완성한 폰트가 아닙니다.**
- `build_asian.py`, `verify_asian.py`, `render_asian.py`: 확장·정규화/기호 배치 검증·실제 TTF 표지 렌더. 원본은 `sources/ja-grid.png`, `zh-grid.png`, `th-grid.png`; 생성 프롬프트/도구는 `sources/asian-prompts.json`.

베트남어 기호는 자체 라틴 윤곽 위에 새 벡터로 구성합니다. Thai mark/mkmk를 사용해 샘플에 필요한 3종 기호를 zero advance/anchor로 배치합니다. 다른 폰트 윤곽을 가져오지 않았습니다. 색과 테두리는 계속 외부 표시 설정입니다.

재현: v0.1 빌드 후 `python build_asian.py`, `python verify_asian.py`. 실제 표지는 `python render_asian.py --art-root <기존 cover-type-studies 폴더> --output <출력 폴더>`로 생성합니다(ImageMagick RSVG 필요).

일본어·말레이어·인도네시아어 제목은 디자인 시험용 예시이며 등록된 번역으로 저장하지 않았습니다. 실제 catalog의 제목 번역은 en/zh/vi/th가 확인되었습니다. 시스템 등록 언어 11개(ko/en/ja/zh/es/fr/de/vi/th/ms/id)와 현재 책 번역 언어를 구분합니다. 네이티브 화자의 글자 조형/번역 검수, 전체 문자 확장, 제품 적용은 남아 있습니다. HTML은 정적 구문/지원 범위만 검사했으며 브라우저 UI 실행은 미검증입니다.

탱고북 표지용 손글씨체 B를 바탕으로 만든 첫 **실제 단색 벡터 폰트**입니다. 기존 서체의 윤곽을 복사하지 않고 승인 조형 시안 → 새 글리프 원본 → TrueType 이차 곡선으로 제작했습니다. 전체 한글 서체가 아닌 제한된 시험판입니다.

## 파일과 사용

- `dist/TangoBookStoryHand-Trial-Regular.ttf`: 설치용 폰트. Windows에서 파일을 열고 설치하면 이름은 **TangoBook Story Hand Trial**입니다. 이번 작업에서 OS에 자동 설치하지 않았습니다.
- `dist/TangoBookStoryHand-Trial-Regular.woff2`: 웹용 압축 파일. TTF와 같은 윤곽과 지원 글자를 담습니다.
- `preview.html`: 제목 입력·글자색·테두리색/두께·배경색·크기를 바꿀 수 있는 로컬 미리보기. 같은 폴더 구조를 유지한 채 브라우저로 열어 사용합니다.
- `dist/font-proof.png`: 실제 TTF를 FreeType로 렌더링한 검수판.
- `dist/coverage.json`, `dist/verification.json`: 지원 범위, 원본 해시와 검증 증거.

폰트는 글자 모양만 제공합니다. 색/테두리/그림자는 편집기의 텍스트 표시 설정으로 지정해야 합니다. 제품 편집기·기존 책 표지·학습용 글자 마스크에는 아직 적용하지 않았습니다.

## 지원 범위

한글 24자: **인 어 공 주 라 푼 젤 흥 부 와 놀 호 랑 나 비 코 끼 리 는 니 까 탱 고 북**.

영문 대문자 26자·소문자 26자, 숫자 10자, 기본 ASCII 기호/공백, NBSP, 가운데점, 긴 대시, 따옴표와 말줄임표를 포함해 Unicode 128개를 지원합니다. 비교한 여섯 표지의 KO/EN 제목과 탱고북 이름을 모두 출력할 수 있습니다.

지원 범위 밖 글자는 `.notdef` 빈 상자로 표시됩니다. '가'를 포함한 나머지 한글, 한자/중문, 태국어, 베트남어 악센트 글자는 미지원입니다. 미리보기는 누락 글자를 별도로 알려 줍니다. 다른 폰트의 글자를 섞어 지원하는 것처럼 보이게 하지 않습니다.

## 재현과 검증

Python 3.12 기준 별도 가상환경에 `requirements.txt`를 설치한 뒤 실행합니다.

```powershell
python -m pip install -r requirements.txt
python build.py
python verify.py
```

빌드 입력은 `sources/`의 검수한 글리프 PNG와 `build.py`입니다. 생성 프롬프트는 `sources/prompts.json`에 보관했습니다. `approved-concept.png`는 B를 선택한 원본 비교표입니다. 파일 시간과 글리프 순서를 고정해 빌드를 재현할 수 있습니다.

TTF/WOFF2의 cmap·윤곽·metrics 일치, 모든 글리프의 비어 있지 않은 윤곽/범위/side bearing, O/8/B/공의 내부 빈 공간, FreeType 로딩·출력, HarfBuzz의 영문 To 커닝과 여섯 표지의 한·영 출력, NFD/NFC 한글 정규화 출력을 검증했습니다. HTML 브라우저 UI와 Windows 설치 후 개별 디자인 프로그램 출력은 아직 검증하지 않았습니다.

`render_covers.py --art-root <기존 표지 시안 폴더> --output <출력 폴더>`는 실제 TTF를 HarfBuzz로 배치하고 윤곽을 SVG로 렌더링합니다. ImageMagick/Librsvg가 필요합니다. 전래/호리 표지에는 클린 원본이 없어 기존 제목 영역 위 단색 띠를 사용합니다. 그 부분은 최종 표지 디자인 승인이 아닙니다.

## 다음 단계와 권리 표기

이번 파일은 내부 평가용입니다. 배포/공개 라이선스와 독점 권리를 확정한 결과가 아닙니다. 영문 획 무게·한글 고정폭 자간·긴 제목의 줄바꿈은 실제 표지에서 더 다듬어야 합니다. 다음 제작 범위는 승인된 현재 책 제목의 한글부터 확대하며, 완성형 한글 전체 지원과 다른 문자권은 별도로 검수해야 합니다.

폰트와 재현 원본·기록만 로컬 커밋하며 main 통합·push·운영 적용은 하지 않습니다.
