# HRA 2026 송년회 사이트

해리포터(호그와트) 테마의 20기 송년회 사이트입니다.

| 탭 | 내용 |
|---|---|
| 🦉 초대장 | 봉인을 누르면 열리는 초대장 |
| 📜 참석 신청 | 이름·참석 여부·세이렌의 멜로디 참여·기숙사(분류모자) → 구글 시트 "참석자" 탭에 저장, 현황 표시 |
| ⏳ 프로그램 | 시간표 (항목 누르면 설명) |
| ✉️ 롤링페이퍼 | 교수님께 편지 → 구글 시트 "롤링페이퍼" 탭에 저장, 편지 벽 표시 |

## 파일
- `index.html`, `style.css`, `app.js` – 사이트 본체
- `config.js` – **날짜·장소·시간표·구글 시트 주소는 여기서만 수정**
- `apps-script/Code.gs` – 구글 시트 연결 스크립트

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
