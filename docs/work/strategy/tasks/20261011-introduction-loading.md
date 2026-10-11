# 소개서 배포 로딩 최적화

- id: 20261011-strategy-introduction-loading
- domain: strategy
- status: integrated
- updated: 2026-10-11
- base: 8d906d7fb
- branch: main
- worktree: C:/project/tangobook
- delivery: fb73dfe87 main 푸시 및 Railway 배포 성공·운영 검증 완료

## 문제와 원인

사용자가 배포 HTML의 긴 로딩을 지적하고 이미지 분리·압축·중복 제거·지연 로딩 수정을 승인했다. 배포 HEAD 응답 55,665,018바이트, 로컬 승인본 55,666,291바이트. 로컬에는 이미지 data URL 82개(고유45개), 이미지 문자열만53,283,565바이트. 큰 PNG와 중첩 SVG에 사진이 포함되고 같은 그림이 반복 내장되어 있었다. 로컬 디자인 검수만으로 배포 전송 성능을 확인했다고 볼 수 없다.

## 변경

- 최종 생성기에 business-plan-web-assets.cjs 연결. 실제 사용된 이미지45개와 폰트1개를 business-plan-assets에 해시 파일명으로 저장. 재사용 이미지 동일 URL로 공유.
- 래스터 이미지 WebP 압축(최대1800px, 품질88, 원본보다 작을 때만). SVG 텍스트·벡터 보존, SVG 내부 사진도 압축해 내장. 브라우저의 SVG 이미지 외부 의존성 제한 때문에 내부 사진은 외부 URL로 바꾸지 않음.
- 표지 eager/high priority, 나머지 native lazy/async. 인쇄 버튼은 현재 탭 이미지를 로딩·디코딩 후 인쇄. PDF 생성기도 현재 장 이미지 로딩을 기다림.
- HTML290,483바이트, 고유 자산46개 합계5,628,235바이트. 첫 화면은 자산4개만 요청, 나머지는 필요할 때 로딩. HTML과 자산 폴더를 함께 배포해야 하며 단일 파일 공유는 기존 PDF 사용.

## 검증

- 새 check-business-plan-assets.cjs: HTML500KB/자산8MB 예산, 내장 이미지·폰트 없음, 모든 경로 존재, 첫 화면 지연 요청,22장 이미지 디코딩, 인쇄 이미지 준비, 마케팅 탭 전체 이미지 및 콘솔/HTTP 오류 검사 통과.
- 전체보기22장×4뷰포트·탐색/인쇄, 매출 시뮬레이션, 모바일 전체보기API mock 회귀 통과. 실기기 검증 아님.
- 전후22장 캡처 비교: 평균 채널차 최대0.359/255, 30이상 차이는 최대0.042%로 압축에 따른 미세 차이. 대표 개요/상품 장 육안 확인, 본문·레이아웃 유지.
- 기존 전달 PDF는 변경하지 않음. 출력 PDF와 기존 tmp는 미추적 보존.

## 원격 전달 확인

- GitHub 커밋 상태: tangobook - tangobook, Success - tangobook.co.kr (2026-10-11T15:02:56Z). 별도 courageous-caring 서버는 watched paths 대상 아님으로 스킵; 본 사이트 배포 성공과 구분.
- 운영 HEAD: Content-Length 289,202바이트(배포 과정 줄바꿈 정규화), HTTP200/no-cache. https://www.tangobook.co.kr/tangobook-business-plan.html 실제 브라우저에서 신규 자산/22장 디코딩/인쇄/마케팅 탭 검사 통과. 최초 자산 요청4개.
