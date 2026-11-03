// HRA 2026 송년회 – 구글 시트 연결 스크립트
// 구글 시트 > 확장 프로그램 > Apps Script 에 이 내용을 그대로 붙여넣고 웹앱으로 배포하세요.
// 시트 탭 "참석자", "롤링페이퍼" 는 처음 저장할 때 자동으로 만들어집니다.
// 공개 조회는 숫자만 돌려주고, 이름·편지 내용은 이 시트와 사이트의 운영단 페이지(비밀번호)에서만 볼 수 있습니다.
//
// ★ 붙여넣은 뒤 아래 ADMIN_KEY 따옴표 안을 운영단 비밀번호로 바꾸세요.
//   (GitHub의 이 파일에는 비밀번호를 적지 마세요. 저장소가 공개라서 누구나 볼 수 있어요)
const ADMIN_KEY = "여기에-운영단-비밀번호";
const CAPACITY = 50; // 최대 참석 인원
const ANON = "익명의 마법사";

const SHEETS = {
  rsvp: { name: "참석자", cols: ["time", "name", "role", "attend", "siren", "house", "note"],
          head: ["제출시각", "이름", "구분", "참석", "세이렌", "기숙사", "한마디"] },
  // 편지 비밀번호는 원문을 저장하지 않고 암호화(해시)해서 저장
  letters: { name: "롤링페이퍼", cols: ["time", "from", "message", "house", "id", "pwhash", "edited"],
          head: ["제출시각", "보낸사람", "내용", "편지지", "편지번호", "비번(암호화)", "수정시각"] },
};
const HIDDEN = ["pwhash"]; // 운영단 페이지에도 보내지 않는 열
const HOUSE_KO = { g: "그리핀도르", h: "후플푸프", r: "래번클로", s: "슬리데린" };
const HOUSE_KEY = { 그리핀도르: "g", 후플푸프: "h", 래번클로: "r", 슬리데린: "s" };

function sheetFor(kind) {
  const def = SHEETS[kind];
  if (!def) throw new Error("unknown kind");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.setFrozenRows(1);
  }
  // 머리글이 없거나 예전 버전(열이 적음)이면 채워 넣기
  if (sh.getLastColumn() < def.head.length || sh.getRange(1, 1).getValue() !== def.head[0]) {
    sh.getRange(1, 1, 1, def.head.length).setValues([def.head]).setFontWeight("bold").setBackground("#e4cc96");
  }
  return sh;
}

function rowsOf(kind) {
  const def = SHEETS[kind];
  return sheetFor(kind).getDataRange().getValues().slice(1).map(r => {
    const o = {};
    def.cols.forEach((c, i) => {
      if (HIDDEN.includes(c)) return;
      o[c] = r[i] instanceof Date ? r[i].toISOString() : r[i];
    });
    if (o.house) o.house = HOUSE_KEY[o.house] || o.house;
    return o;
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean(v, max) { return String(v == null ? "" : v).replace(/^[=+\-@]/, "'$&").slice(0, max); }

function hashPw(id, pw) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, id + ":" + pw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

// 비밀번호를 여러 번 틀리면 잠시 잠금 (name 별로 따로 셈)
function tooManyFails(name, limit) {
  return Number(CacheService.getScriptCache().get(name) || 0) >= limit;
}
function addFail(name) {
  const cache = CacheService.getScriptCache();
  cache.put(name, String(Number(cache.get(name) || 0) + 1), 600);
  Utilities.sleep(800);
}

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
      if (tooManyFails("admin-fails", 10)) return json({ ok: false, error: "비밀번호를 여러 번 틀려서 10분간 잠겼어요" });
      if (ADMIN_KEY === "여기에-운영단-비밀번호" || String(d.key) !== ADMIN_KEY) {
        addFail("admin-fails");
        return json({ ok: false, error: "비밀번호가 맞지 않아요" });
      }
      return json({ ok: true, rsvp: rowsOf("rsvp"), letters: rowsOf("letters"), capacity: CAPACITY });
    }

    // 내가 쓴 편지 보기 / 수정 (보낸 사람 + 편지 비밀번호)
    if (d.kind === "myletters" || d.kind === "editletter") return handleMyLetters(d);

    const def = SHEETS[d.kind];
    if (!def) return json({ ok: false, error: "unknown kind" });
    const sh = sheetFor(d.kind);

    if (d.kind === "letters") {
      const pw = String(d.pw || "");
      if (pw.length < 4 || pw.length > 30) return json({ ok: false, error: "편지 비밀번호는 4~30자로 정해주세요" });
      const from = clean(String(d.from || "").trim() || ANON, 60);
      const message = clean(d.message, 400);
      if (!String(d.message || "").trim()) return json({ ok: false, error: "내용이 필요합니다" });
      const C = def.cols, data = sh.getDataRange().getValues().slice(1);
      // 같은 이름 + 같은 비밀번호 편지가 이미 있으면 구분이 안 되므로 다른 비밀번호를 쓰게 함
      if (data.some(r => String(r[C.indexOf("from")]) === from && r[C.indexOf("id")] &&
                         r[C.indexOf("pwhash")] === hashPw(r[C.indexOf("id")], pw))) {
        return json({ ok: false, error: "same" });
      }
      const id = Utilities.getUuid().replace(/-/g, "").slice(0, 8);
      const row = { time: new Date(), from, message, house: HOUSE_KO[d.house] || "", id, pwhash: hashPw(id, pw), edited: "" };
      sh.appendRow(C.map(c => row[c]));
      return json({ ok: true, id });
    }

    // 참석 회신
    const row = def.cols.map(c => {
      if (c === "time") return new Date();
      if (c === "house") return HOUSE_KO[d.house] || "";
      return clean(d[c], 60);
    });
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
    sh.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function handleMyLetters(d) {
  if (tooManyFails("letter-fails", 20)) return json({ ok: false, error: "비밀번호를 여러 번 틀려서 10분간 잠겼어요" });
  const def = SHEETS.letters, C = def.cols, sh = sheetFor("letters");
  const data = sh.getDataRange().getValues();
  const pw = String(d.pw || "");
  const at = c => C.indexOf(c);

  if (d.kind === "myletters") {
    const from = String(d.from || "").trim() || ANON;
    const mine = [];
    data.forEach((r, i) => {
      if (i === 0 || String(r[at("from")]) !== from || !r[at("id")]) return;
      if (r[at("pwhash")] === hashPw(r[at("id")], pw)) {
        mine.push({ id: r[at("id")], from: r[at("from")], message: r[at("message")],
                    time: r[at("time")] instanceof Date ? r[at("time")].toISOString() : r[at("time")] });
      }
    });
    if (!mine.length) { addFail("letter-fails"); return json({ ok: false, error: "보낸 사람 이름 또는 비밀번호가 맞지 않아요" }); }
    return json({ ok: true, letters: mine });
  }

  // editletter
  const i = data.findIndex((r, k) => k > 0 && String(r[at("id")]) === String(d.id));
  if (i < 0 || data[i][at("pwhash")] !== hashPw(data[i][at("id")], pw)) {
    addFail("letter-fails");
    return json({ ok: false, error: "비밀번호가 맞지 않아요" });
  }
  if (!String(d.message || "").trim()) return json({ ok: false, error: "내용이 필요합니다" });
  sh.getRange(i + 1, at("message") + 1).setValue(clean(d.message, 400));
  sh.getRange(i + 1, at("edited") + 1).setValue(new Date());
  return json({ ok: true });
}
