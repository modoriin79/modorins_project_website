# modorin portfolio

설치나 빌드 없이 동작하는 개인 포트폴리오입니다.
주소: https://modoriin79.github.io/modorins_project_website/

## 내용 수정하는 법 (GitHub 웹사이트에서)

사이트의 모든 내용(프로젝트, 수상, 학습 기록)은 **`content.js` 파일 하나**에 있습니다.

1. 저장소에서 `content.js`를 열고 오른쪽 위 연필 아이콘(✏️ Edit)을 누릅니다.
2. 추가하고 싶은 목록(`projects`, `awards`, `studies`) 위에 있는 **복사용 예시**를 복사해서
   목록의 `[ ]` 안에 붙여넣고 값만 바꿉니다.
3. 오른쪽 위 **Commit changes**를 누르면 1분 안에 사이트에 반영됩니다.

자주 하는 실수
- 항목 `{ ... }` 끼리는 쉼표 `,`로 구분해야 합니다.
- 글자는 작은따옴표 `'...'` 안에 씁니다. 글 속에 `'`가 있으면 `\'`로 씁니다.
- 저장 후 사이트에서 해당 부분이 비어 보이면, 위 두 가지 중 하나가 빠진 경우가 대부분입니다.
  저장소의 **History**에서 이전 버전으로 되돌릴 수 있습니다.

### 사진 올리기
1. 저장소에서 `images` 폴더로 들어가 **Add file → Upload files**로 사진을 올립니다.
2. `content.js`의 `image` 칸에 `'./images/파일이름.png'`처럼 적습니다. (파일 이름은 영어·숫자 추천)

## Claude Code에게 맡기기
저장소에 `CLAUDE.md`(작업 설명서)가 있어서, 이 폴더에서 Claude Code를 열고 한 줄로 요청하면 됩니다.
- "프로젝트 추가: 이름 OO, 소개 OO, 링크 https://..., 사진 첨부"
- "수상 추가: 2026.11, OO 해커톤 우수상, 프로젝트 OO"
- "Wireless Communication에 학습 기록 추가: 제목 OO, 링크 OO"

## 파일 구성
- `content.js` — 사이트 내용 (여기만 수정하면 됨)
- `index.html` — 페이지 뼈대, 소개 문구, 상단 링크
- `style.css` — 디자인
- `script.js` — content.js를 화면에 그리는 코드
- `cursor.js`, `cursor*.svg` — 픽셀 커서와 빛 효과
- `images/` — 사진

## 배포 / 로컬 확인
- `main` 브랜치에 올리면 GitHub Actions가 자동으로 배포합니다. 새 파일을 추가해도 설정을 바꿀 필요가 없습니다.
- 로컬 확인: 저장소에서 `python -m http.server 8000` 실행 후 http://localhost:8000 접속.
- 방문자 카운터는 아직 통계 서비스와 연결되어 있지 않습니다 (GoatCounter 등 연결 시 실제 수치 표시 가능).
