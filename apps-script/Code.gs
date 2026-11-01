// HRA 2026 송년회 – 구글 시트 연결 스크립트
// 구글 시트 > 확장 프로그램 > Apps Script 에 이 내용을 그대로 붙여넣고 웹앱으로 배포하세요.
// 시트 탭 "참석자", "롤링페이퍼" 는 처음 저장할 때 자동으로 만들어집니다.
const SHEETS = {
  rsvp: { name: "참석자", cols: ["time", "name", "role", "attend", "siren", "house", "note"],
          head: ["제출시각", "이름", "구분", "참석", "세이렌", "기숙사", "한마디"] },
  letters: { name: "롤링페이퍼", cols: ["time", "from", "message", "house"],
          head: ["제출시각", "보낸사람", "내용", "편지지"] },
};
// 사이트에 공개할 열 (연락처 같은 개인정보를 추가해도 여기 없으면 사이트에 안 보임)
const PUBLIC = { rsvp: ["name", "attend", "siren", "house"], letters: ["from", "message", "house"] };
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

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean(v, max) { return String(v == null ? "" : v).replace(/^[=+\-@]/, "'$&").slice(0, max); }

function doGet(e) {
  const kind = e.parameter.kind;
  const def = SHEETS[kind];
  if (!def) return json([]);
  const rows = sheetFor(kind).getDataRange().getValues().slice(1);
  const out = rows.map(r => {
    const o = {};
    def.cols.forEach((c, i) => { if (PUBLIC[kind].includes(c)) o[c] = r[i]; });
    if (o.house) o.house = HOUSE_KEY[o.house] || o.house;
    return o;
  });
  return json(out);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
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
      // 같은 이름이 있으면 덮어쓰기 (회신 수정)
      const names = sh.getRange(1, 2, sh.getLastRow(), 1).getValues().map(r => String(r[0]));
      const idx = names.indexOf(row[1]);
      if (idx > 0) {
        // 기숙사는 준비위원회가 시트에서 배정하므로, 회신을 수정해도 기존 값을 유지
        const hi = def.cols.indexOf("house");
        row[hi] = sh.getRange(idx + 1, hi + 1).getValue() || row[hi];
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
