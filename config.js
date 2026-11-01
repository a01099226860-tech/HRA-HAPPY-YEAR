// 행사 정보는 여기만 고치면 사이트 전체에 반영됩니다.
window.EVENT = {
  date: "2026년 12월 26일 (토) 18:00 – 21:00",
  place: "제주오픈런 (제주시 중앙로 238, 4층)",
  mapUrl: "https://map.kakao.com/?q=" + encodeURIComponent("제주시 중앙로 238"),
  capacity: 50,   // 최대 수용 인원

  // 구글 Apps Script 웹앱 URL (README 참고). 비워두면 체험 모드(이 브라우저에만 저장).
  scriptUrl: "https://script.google.com/macros/s/AKfycbzb22fjmIl93rg7W-cFHu2DV2LxChaXsgjqWDxzGhbpg8wtzPa-YoP2SN-eBWDR0DKI/exec",

  program: [
    { time: "6:00 – 6:20", title: "입장 · 인사말", house: "g",
      desc: "대연회장 입장과 간단한 소개, 인사말로 송년회를 엽니다." },
    { time: "6:20 – 7:00", title: "만찬", house: "h",
      desc: "호그와트 연회처럼 함께 식사하며 이야기를 나눕니다." },
    { time: "7:00 – 7:35", title: "주인공이 20기 맞추기", house: "r",
      desc: "소개 영상(3분) 후, 20기와 교수님의 과거 사진을 보고 누구인지 맞혀요(30분). 옛날과자도 준비되어 있어요." },
    { time: "7:35 – 7:40", title: "쉬는 시간", house: "", rest: true,
      desc: "다음 순서를 준비하는 짧은 휴식." },
    { time: "7:40 – 8:30", title: "세이렌의 멜로디", house: "s",
      desc: "소개 영상(5분) 후 45분간 진행되는 메인 게임. 참석 신청에서 참여 여부를 알려주세요." },
    { time: "8:30 – 8:45", title: "교수님 롤링페이퍼", house: "r",
      desc: "소개 영상과 함께 모두가 쓴 부엉이 편지를 교수님께 전해드립니다." },
    { time: "8:45 – 9:00", title: "마무리", house: "g",
      desc: "단체 사진과 마무리 인사. Mischief Managed!" },
  ],
};
