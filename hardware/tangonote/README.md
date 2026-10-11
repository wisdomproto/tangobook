# 탱고노트 · 제안서용 3D 콘셉트

2026-10-11 사용자 설명과 정정이 원본 제안서보다 우선한다.

- 탱고블록판과 유사한 외형, 돌기가 없는 평평한 필기면.
- 종이 왼쪽 가장자리를 **테두리 안쪽의 숨은 홈**에 끼운다. 외부에 보이는 고정대·레일·클립을 추가하지 않는다.
- 종이에 펜으로 글씨·그림을 그리고, 필기 데이터와 학습지 정보를 블루투스로 태블릿에 전달하는 제품 구성.
- 학습지 디자인은 원본 PDF의 큰 글자·색상 영역·쓰기 칸을 참고한 독자적인 `가구` 예시다. 원본의 티니핑 캐릭터·브랜드는 복제하지 않았다.
- 최종 태블릿 화면은 사용자 요청대로 **가구 그림과 큰 ‘가구’ 글자**를 표시한다. 버튼·리포트·진행 UI는 넣지 않는다.

## 파일

- [Blender 원본](concept-v2/tangonote-connected-v2.blend): 조명·카메라·종이 텍스처를 포함한 편집 가능한 장면.
- [GLB 모델](concept-v2/tangonote-connected-v2.glb): 제품 구성만 내보낸 파일.
- [최종 제안서 이미지](../../docs/marketing/assets/investor-20261010/tangonote-product-v5.png).
- [학습지 SVG](../../docs/marketing/assets/investor-20261010/tangonote-worksheet-v2.svg): 편집 가능한 평면 원본.
- [Blender 생성 코드](../../docs/marketing/drafts/build-tangonote-scene-20261011.py).

기존 `tango-board-only.standalone.html`의 board·cradle·front feet·tablet 메시를 사용했다. 돌기 grid와 블록, 반사경은 가져오지 않았다. 평평한 내부 판과 왼쪽 테두리 내부 슬롯을 추가했다. 원본 탱고블록 모델은 변경하지 않았다.

현재 기준 외곽은 기존 판의 약 226 × 225.35 mm다. 내부 판, 종이 크기, 내부 슬롯 깊이·간격은 설명용 설계값이며 양산 도면이나 제작 공차가 아니다. BLE·학습지 식별은 요구 기능이며 이 3D 모델이 전자회로나 인식 성능을 검증하지 않는다. 과거 PDF의 가격·원가·기술 우위 주장을 현행 사업계획에 옮기지 않았다. 탱고노트 가격도 현재 블록 패키지에 합산하지 않았다.

## 재생성

1. `node docs/marketing/drafts/build-tangonote-worksheet-20261011.cjs`
2. `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" --background --python docs/marketing/drafts/build-tangonote-scene-20261011.py`
3. 렌더 형상 확인 후 imagegen 내장 도구로 제품 이미지를 정리했다. 최종 태블릿 화면은 가구 그림과 큰 ‘가구’ 글자만 남겼다. [이미지 제작 기록](../../docs/marketing/assets/investor-20261010/tangonote-image-notes.md).

거절된 돌출 고정대 v1과 중간 UI 이미지는 로컬 `tmp/tangonote-rejected-20261011/`에 보관하며 자료실에서 노출하지 않는다.
