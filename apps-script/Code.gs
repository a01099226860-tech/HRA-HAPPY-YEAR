// HRA 2026 송년회 – 구글 시트 연결 스크립트
// 구글 시트 > 확장 프로그램 > Apps Script 에 이 내용을 그대로 붙여넣고 웹앱으로 배포하세요.
// 시트 탭 "참석자", "롤링페이퍼" 는 처음 저장할 때 자동으로 만들어집니다.
//
// ★ 붙여넣은 뒤 아래 ADMIN_KEY 를 운영단만 아는 비밀번호로 바꾸세요. (GitHub에는 올리지 마세요)
//   사이트의 '운영단' 페이지에서 이 비밀번호를 넣어야 참석자 명단과 롤링페이퍼가 보입니다.
const ADMIN_KEY = "여기에-운영단-비밀번호";
const CAPACITY = 50; // 최대 참석 인원

const SHEETS = {
  rsvp: { name: "참석자", cols: ["time", "name", "role", "attend", "siren", "house", "note"],
          head: ["제출시각", "이름", "구분", "참석", "세이렌", "기숙사", "한마디"] },
  letters: { name: "롤링페이퍼", cols: ["time", "from", "message", "house"],
          head: ["제출시각", "보낸사람", "내용", "편지지"] },
};
const HOUSE_KO = { g: "그리핀도르", h: "후플푸프", r: "래번클로", s: "슬리데린" };
const HOUSE_KEY = { 그리핀도르: "g", 후플푸프: "h", 래번클로: "r", 슬리데린: "s" };

function sheetFor(kind) {
  const def = SHEETS[kind];
  if (!def) throw new Error("unknown kind");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.appendRow(def.head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, def.head.length).setFontWeight("bold").setBackground("#e4cc96");
  }
  return sh;
}

function rowsOf(kind) {
  const def = SHEETS[kind];
  return sheetFor(kind).getDataRange().getValues().slice(1).map(r => {
    const o = {};
    def.cols.forEach((c, i) => { o[c] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    if (o.house) o.house = HOUSE_KEY[o.house] || o.house;
    return o;
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean(v, max) { return String(v == null ? "" : v).replace(/^[=+\-@]/, "'$&").slice(0, max); }

// 공개 조회: 이름·내용 없이 숫자만
function doGet(e) {
  const kind = e.parameter.kind;
  if (kind === "rsvp") {
    const rows = rowsOf("rsvp");
    return json({
      attend: rows.filter(r => r.attend === "참석").length,
      total: rows.length,
      siren: rows.filter(r => r.siren === "참여" && r.attend !== "불참").length,
      capacity: CAPACITY,
    });
  }
  if (kind === "letters") return json({ count: rowsOf("letters").length });
  return json({});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);

    // 운영단 조회: 비밀번호가 맞을 때만 전체 데이터
    if (d.kind === "admin") {
      if (ADMIN_KEY === "여기에-운영단-비밀번호" || String(d.key) !== ADMIN_KEY) {
        Utilities.sleep(1500); // 비밀번호 마구 넣어보기 방지
        return json({ ok: false, error: "비밀번호가 맞지 않아요" });
      }
      return json({ ok: true, rsvp: rowsOf("rsvp"), letters: rowsOf("letters"), capacity: CAPACITY });
    }

    const def = SHEETS[d.kind];
    if (!def) return json({ ok: false, error: "unknown kind" });
    const sh = sheetFor(d.kind);
    const row = def.cols.map(c => {
      if (c === "time") return new Date();
      if (c === "house") return HOUSE_KO[d.house] || "";
      return clean(d[c], c === "message" ? 400 : 60);
    });

    if (d.kind === "rsvp") {
      if (!row[1]) return json({ ok: false, error: "이름이 필요합니다" });
      const data = sh.getDataRange().getValues();
      const ni = def.cols.indexOf("name"), ai = def.cols.indexOf("attend"), hi = def.cols.indexOf("house");
      const idx = data.findIndex((r, i) => i > 0 && String(r[ni]) === row[ni]);
      // 정원: 새로 '참석'하는 사람만 막음 (이미 참석인 사람의 수정은 허용)
      if (row[ai] === "참석" && !(idx > 0 && data[idx][ai] === "참석")) {
        const count = data.slice(1).filter(r => r[ai] === "참석").length;
        if (count >= CAPACITY) return json({ ok: false, error: "full" });
      }
      if (idx > 0) {
        // 기숙사는 운영단이 시트에서 배정하므로, 회신을 수정해도 기존 값을 유지
        row[hi] = data[idx][hi] || row[hi];
        sh.getRange(idx + 1, 1, 1, row.length).setValues([row]);
        return json({ ok: true, updated: true });
      }
    } else if (!row[2]) {
      return json({ ok: false, error: "내용이 필요합니다" });
    }
    sh.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
