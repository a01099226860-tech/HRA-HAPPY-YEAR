// 행사 정보는 여기만 고치면 사이트 전체에 반영됩니다.
window.EVENT = {
  date: "2026년 12월 26일 (토) 18:00 – 21:00",
  place: "더블랭크 (제주시 도남서길 22)",
  mapUrl: "https://place.map.kakao.com/404035026",
  capacity: 50,   // 최대 수용 인원 (참석 신청 마감 기준)
  headcount: "40~50명",  // 초대장에 보이는 인원
  eventDay: "2026-12-26",  // 당일에는 프로그램 페이지에서 지금 순서를 표시

  // 배경음악 파일 (assets 폴더)
  bgm: { src: "assets/bgm.mp3", title: "해리포터 BGM" },

  // 운영단 전용: 구글 시트 (공유된 사람만 열 수 있음)
  sheetUrl: "https://docs.google.com/spreadsheets/d/19R82lNCL_yarcXprEpWWMctzDi5BW3yyq1pB-lmpy3M/edit?gid=1851740133#gid=1851740133", // 참석자
  letterSheetUrl: "https://docs.google.com/spreadsheets/d/19R82lNCL_yarcXprEpWWMctzDi5BW3yyq1pB-lmpy3M/edit?gid=523385600#gid=523385600", // 롤링페이퍼

  // 구글 Apps Script 웹앱 URL (README 참고). 비워두면 체험 모드(이 브라우저에만 저장).
  scriptUrl: "https://script.google.com/macros/s/AKfycbzS5THGLQ4PDAvH_3PEVCpxnoWR3oDALgQEy1mKEStqMXOLBZFXREVKmdKvW9-kX8Xw/exec",

  program: [
    { time: "6:00 – 6:20", title: "입장 · 인사말", house: "g",
      desc: "대연회장 입장과 간단한 소개, 인사말로 송년회를 엽니다." },
    { time: "6:20 – 7:00", title: "만찬", house: "h",
      desc: "호그와트 연회처럼 함께 식사하며 이야기를 나눕니다." },
    { time: "7:00 – 7:35", title: "HRA 주인공 맞추기", house: "r",
      desc: "소개 영상(3분) 후, HRA 멤버와 교수님의 과거 사진을 보고 누구인지 맞혀요(30분)." },
    { time: "7:35 – 7:40", title: "쉬는 시간", house: "", rest: true,
      desc: "다음 순서를 준비하는 짧은 휴식." },
    { time: "7:40 – 8:30", title: "세이렌의 멜로디", house: "s",
      desc: "음악 세션으로 개별 공연, 교수님과 학생들의 합주 무대 등이 이루어집니다." },
    { time: "8:30 – 8:45", title: "교수님 롤링페이퍼", house: "r",
      desc: "소개 영상과 함께 모두가 쓴 부엉이 편지를 교수님께 전해드립니다." },
    { time: "8:45 – 9:00", title: "마무리", house: "g",
      desc: "단체 사진과 마무리 인사. Mischief Managed!" },
  ],
};
