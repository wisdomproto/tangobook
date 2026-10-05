# TangoBook Story Hand — Trial 0.1

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
