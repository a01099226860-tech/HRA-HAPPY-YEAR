# HRA 2026 송년회 사이트

해리포터(호그와트) 테마의 20기 송년회 사이트입니다.

| 페이지 | 컨셉 | 내용 |
|---|---|---|
| `index.html` | 호그와트 성 | 봉인을 누르면 초대장이 열리고 배경음악 시작, 아래에 문 3개 |
| `rsvp.html` | 대연회장 (떠 있는 촛불) | 참석·세이렌 참여·기숙사 → 구글 시트 "참석자", 기숙사 깃발 현황 |
| `program.html` | 마법 지도 | "지도 펼치기"를 누르면 시간표가 잉크처럼 나타남. 당일엔 지금 순서 표시 |
| `letters.html` | 부엉이 탑 | 교수님께 편지 → 구글 시트 "롤링페이퍼", 봉인 편지 벽 |

페이지를 옮겨도 배경음악이 끊기지 않도록 본문만 바꿔 끼우는 방식입니다.

## 파일
- `index.html`, `rsvp.html`, `program.html`, `letters.html`, `style.css`, `app.js` – 사이트 본체
- `config.js` – **날짜·장소·정원·시간표·배경음악·구글 시트 주소는 여기서만 수정**
- `apps-script/Code.gs` – 구글 시트 연결 스크립트

> 사이트를 고친 뒤에는 각 html의 `?v=5` 숫자를 하나 올려야 방문자 브라우저에 바로 반영됩니다.

## 사진·음악
- 배경 사진: Unsplash 무료 이미지 (주소는 `style.css` 맨 위)
- 배경음악: 유튜브 공식 플레이어로 재생 (`config.js`의 `bgm.youtubeId`). 음원 파일을 직접 올리면 저작권 문제가 되므로 올리지 마세요.

## 1. 구글 시트 연결 (참석자·롤링페이퍼 저장)
1. 구글 드라이브에서 새 스프레드시트 생성 (예: `HRA 송년회`)
2. 메뉴 **확장 프로그램 → Apps Script** → 기존 코드를 지우고 `apps-script/Code.gs` 내용 붙여넣기 → 저장
3. 오른쪽 위 **배포 → 새 배포** → 유형 **웹 앱**
   - 실행 사용자: **나**
   - 액세스 권한: **모든 사용자**
4. 권한 승인 후 나오는 **웹 앱 URL**(`https://script.google.com/macros/s/.../exec`)을 복사
5. `config.js`의 `scriptUrl: ""` 따옴표 안에 붙여넣기

> 엑셀 파일이 필요하면 시트에서 **파일 → 다운로드 → Microsoft Excel(.xlsx)**.
> Code.gs를 고친 뒤에는 **배포 → 배포 관리 → 수정 → 새 버전**으로 다시 배포해야 반영됩니다.

`scriptUrl`이 비어 있으면 "체험 모드"로 동작하며 입력 내용은 각자 브라우저에만 저장됩니다.

## 2. 인터넷에 올리기 (GitHub Pages)
1. GitHub 저장소: https://github.com/a01099226860-tech/HRA-HAPPY-YEAR (Public)
2. 이 폴더의 파일을 업로드 (Add file → Upload files). `AI_활용_기록표.xlsx`는 올리지 마세요.
3. 저장소 **Settings → Pages → Branch: main / (root) → Save**
4. 1~2분 후 https://a01099226860-tech.github.io/HRA-HAPPY-YEAR/ 로 접속

탭 바로가기 링크: 주소 끝에 `#rsvp`, `#program`, `#letters`를 붙이면 해당 탭이 열립니다.
