# modorin
설치나 빌드 없이 동작하는 개인 프로젝트 포트폴리오입니다. index.html을 브라우저로 열 수 있습니다.

## 내용 변경
- projects.js: 프로젝트 이름, 설명, 분류, 실제 배포 URL을 입력합니다. 빈 URL에는 링크 준비 중이 표시됩니다.
- index.html: 소개와 수상 기록을 수정합니다. 현재 수상 정보는 미입력 상태입니다.
- 방문 횟수는 localStorage에 저장하는 **이 브라우저의 세션별 방문 수**입니다. 전체 방문자 통계가 아닙니다. 전체 통계를 원하면 배포 도메인에 맞춰 Plausible 또는 GoatCounter 같은 분석 서비스를 연결해야 합니다.

## GitHub Pages 배포
파일을 main 브랜치에 올리고 저장소 Settings → Pages → Source에서 GitHub Actions를 선택합니다. 포함된 워크플로가 정적 파일을 배포합니다. 배포 성공 후 제공되는 주소로 누구나 설치 없이 접속할 수 있습니다.

## 로컬 확인
저장소에서 `python3 -m http.server 8000 --bind 127.0.0.1`을 실행해 HTTP로 확인할 수도 있습니다. 별도 패키지는 필요하지 않습니다.
