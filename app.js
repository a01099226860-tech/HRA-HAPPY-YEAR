(() => {
  const E = window.EVENT;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = { // sessionStorage가 막힌 환경에서도 동작하도록
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  // 기숙사: 문장 색 (배경, 테두리, 물결 3겹, 동물)
  const HOUSES = {
    g: { name: "그리핀도르", en: "GRYFFINDOR", trait: "용기 · 대담함", desc: "망설임 없이 먼저 나서는 사람들. 위기에도 웃으며 앞장서는 용감한 마법사의 집.", color: "#8f3337",
         pal: ["#8f3337", "#f8c9a0", "#b23a3a", "#d4584c", "#ec8a6c", "#fde3c4"] },
    r: { name: "래번클로", en: "RAVENCLAW", trait: "지혜 · 재치", desc: "배움과 호기심을 사랑하는 사람들. 번뜩이는 아이디어로 길을 찾는 현명한 마법사의 집.", color: "#26246a",
         pal: ["#26246a", "#b3bcff", "#2f2f86", "#4350b8", "#6573dc", "#e3e6ff"] },
    h: { name: "후플푸프", en: "HUFFLEPUFF", trait: "성실 · 의리", desc: "묵묵히 끝까지 함께하는 사람들. 따뜻한 마음과 의리로 모두를 챙기는 마법사의 집.", color: "#8a6233",
         pal: ["#8a6233", "#f6dd92", "#9c733b", "#b88d45", "#d5ad5c", "#fff0bf"] },
    s: { name: "슬리데린", en: "SLYTHERIN", trait: "야망 · 지략", desc: "목표를 향해 영리하게 나아가는 사람들. 큰 꿈과 지략으로 판을 읽는 마법사의 집.", color: "#22646a",
         pal: ["#22646a", "#95ecd9", "#1f7a78", "#2a9c92", "#46c2b0", "#d6fff5"] },
  };

  // 아치형 기숙사 문장 (SVG)
  let crestId = 0;
  function crest(k) {
    const [bg, frame, l1, l2, l3, animal] = HOUSES[k].pal;
    const id = "cc" + crestId++;
    const star = (x, y, s = 1) =>
      `<path transform="translate(${x} ${y}) scale(${s})" d="M0-7L1.6-1.6 7 0 1.6 1.6 0 7-1.6 1.6-7 0-1.6-1.6Z" fill="${frame}"/>`;
    const pillar = x => `
      <rect x="${x - 6}" y="76" width="12" height="5" fill="${frame}"/>
      <rect x="${x - 3}" y="81" width="6" height="138" fill="none" stroke="${frame}" stroke-width="1.6"/>
      <rect x="${x - 6}" y="219" width="12" height="5" fill="${frame}"/>`;
    return `<svg class="crest-svg" viewBox="0 0 200 300" role="img" aria-label="${HOUSES[k].name} 문장">
      <defs><clipPath id="${id}"><rect x="44" y="24" width="112" height="252" rx="56"/></clipPath></defs>
      <rect width="200" height="300" fill="${bg}"/>
      <g clip-path="url(#${id})">
        <rect width="200" height="300" fill="${l1}"/>
        <circle cx="100" cy="66" r="24" fill="${frame}" opacity=".85"/>
        <path d="M0 150C40 118 70 172 110 140S172 116 200 146V300H0Z" fill="${l2}"/>
        <path d="M0 196C50 168 82 218 122 192S182 176 200 198V300H0Z" fill="${l3}"/>
        <path d="M0 238C40 222 92 256 132 236S182 228 200 240V300H0Z" fill="${l2}" opacity=".75"/>
        ${star(66, 110, .9)}${star(138, 104, 1.1)}${star(130, 70, .6)}${star(70, 180, .7)}${star(140, 220, .8)}
        <g transform="translate(38 100) scale(.24)"><path d="${window.CREST_PATHS[k]}" fill="${animal}"/></g>
        <path d="M66 252H134M78 260H122" stroke="${frame}" stroke-width="1.5" opacity=".7"/>
      </g>
      <rect x="44" y="24" width="112" height="252" rx="56" fill="none" stroke="${frame}" stroke-width="3"/>
      <rect x="36" y="16" width="128" height="268" rx="64" fill="none" stroke="${frame}" stroke-width="1.2" opacity=".6"/>
      <path d="M100 8V16M100 284V292" stroke="${frame}" stroke-width="1.5"/>
      ${pillar(36)}${pillar(164)}
    </svg>`;
  }

  // 문장 + 이름 카드 묶음 (data-crests 가 붙은 곳에 채움)
  function fillCrests(main) {
    $$("[data-crests]", main).forEach(box => {
      const big = box.dataset.crests === "big";
      box.innerHTML = Object.keys(HOUSES).map(k => {
        const h = HOUSES[k], [c0, c1, , , , c5] = h.pal;
        return `
        <figure class="crest-card">
          <button class="flip" type="button" aria-pressed="false" aria-label="${h.name} 설명 보기"
                  style="--c0:${c0};--c1:${c1};--c5:${c5}">
            <span class="flip-inner">
              <span class="face front">${crest(k)}</span>
              <span class="face back">
                <svg viewBox="0 0 512 512" class="back-animal" aria-hidden="true"><path d="${window.CREST_PATHS[k]}" fill="${c1}"/></svg>
                <b class="back-name">${h.name}</b>
                <span class="back-trait">${h.trait}</span>
                ${big ? `<span class="back-desc">${h.desc}</span>` : ""}
              </span>
            </span>
          </button>
          <figcaption><b>${h.en}</b><span>${h.name}</span>${big ? `<em class="flip-hint">눌러서 설명 보기 ↻</em>` : ""}</figcaption>
        </figure>`;
      }).join("");
      // 누르면 카드가 회전하며 뒷면(설명)이 보임
      $$(".flip", box).forEach(btn => btn.addEventListener("click", () => {
        const on = btn.classList.toggle("on");
        btn.setAttribute("aria-pressed", String(on));
      }));
    });
  }

  /* ================= 데이터 (구글 시트 or 브라우저) ================= */
  const demo = !E.scriptUrl;
  const api = {
    async list(kind) {
      if (demo) return JSON.parse(localStorage.getItem("hp-" + kind) || "[]");
      // 구글 Apps Script가 가끔 한 번씩 실패해서 최대 3번 시도
      for (let i = 0; ; i++) {
        try {
          const res = await fetch(`${E.scriptUrl}?kind=${kind}&t=${Date.now()}`);
          if (!res.ok) throw new Error("불러오기 실패");
          return await res.json();
        } catch (err) {
          if (i >= 2) throw err;
          await new Promise(r => setTimeout(r, 800 * (i + 1)));
        }
      }
    },
    async add(kind, data) {
      if (demo) {
        const list = JSON.parse(localStorage.getItem("hp-" + kind) || "[]");
        const row = { ...data, time: new Date().toISOString() };
        const i = kind === "rsvp" ? list.findIndex(r => r.name === data.name) : -1;
        i >= 0 ? (list[i] = row) : list.push(row);
        localStorage.setItem("hp-" + kind, JSON.stringify(list));
        return { ok: true };
      }
      // text/plain 으로 보내야 Apps Script에서 CORS 사전요청 없이 받을 수 있음
      const res = await fetch(E.scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ kind, ...data }),
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "저장 실패");
      return out;
    },
    // 공개용: 숫자만 (이름·편지 내용은 운영단 구글 시트에서만)
    async summary(kind) {
      const d = await api.list(kind);
      if (!Array.isArray(d)) return d;
      if (kind === "rsvp") return {
        attend: d.filter(r => r.attend === "참석").length,
        total: d.length,
        siren: d.filter(r => r.siren === "참여" && r.attend !== "불참").length,
      };
      return { count: d.length };
    },
    // 운영단용: 비밀번호 확인 후 전체 데이터
    async admin(key) {
      if (demo) return {
        ok: true,
        rsvp: JSON.parse(localStorage.getItem("hp-rsvp") || "[]"),
        letters: JSON.parse(localStorage.getItem("hp-letters") || "[]"),
      };
      const res = await fetch(E.scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ kind: "admin", key }),
      });
      return res.json();
    },
  };

  /* ================= 배경 효과 ================= */
  function buildFx(page) {
    const fx = $(".fx");
    fx.innerHTML = "";
    if (page === "rsvp") { // 대연회장: 떠 있는 촛불
      for (let i = 0; i < 22; i++) {
        const c = document.createElement("i");
        c.className = "candle";
        c.style.left = 3 + Math.random() * 94 + "%";
        c.style.top = 4 + Math.random() * 38 + "%";
        const s = 0.55 + Math.random() * 0.6;
        c.style.scale = s;
        c.style.opacity = 0.5 + s * 0.4;
        c.style.animationDelay = -Math.random() * 7 + "s";
        fx.appendChild(c);
      }
    } else { // 나머지: 반짝이는 마법 먼지
      for (let i = 0; i < 26; i++) {
        const s = document.createElement("i");
        s.className = "spark";
        s.style.left = Math.random() * 100 + "%";
        s.style.top = 20 + Math.random() * 80 + "%";
        s.style.animationDelay = Math.random() * 6 + "s";
        s.style.animationDuration = 5 + Math.random() * 5 + "s";
        fx.appendChild(s);
      }
    }
  }

  /* ================= 페이지 이동 (음악이 끊기지 않게 본문만 교체) ================= */
  const inits = { home: initHome, rsvp: initRsvp, program: initProgram, letters: initLetters, admin: initAdmin, floor: initFloor };

  function initFloor(main) {
    const g = main.querySelector("#tables");
    if (!g) return;
    const houses = [
      { name: "그리핀도르", color: "#8b1e1e", x: 145 },
      { name: "후플푸프", color: "#c9a227", x: 265 },
      { name: "래번클로", color: "#1e3a6b", x: 415 },
      { name: "슬리데린", color: "#1f5a3a", x: 535 },
    ];
    const add = (tag, attrs, text) => {
      const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text) n.textContent = text;
      g.appendChild(n);
    };
    const tableY = 200, len = 160, w = 30;
    for (const h of houses) {
      add("path", { d: `M${h.x - 42} 156H${h.x + 42}V182L${h.x} 188L${h.x - 42} 182Z`, fill: h.color });
      add("text", { x: h.x, y: 175, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: h.color === "#c9a227" ? "#2a1d08" : "#f4e6c3" }, h.name);
      for (let i = 0; i < 6; i++) {
        const y = tableY + 10 + i * 25;
        add("rect", { x: h.x - w / 2 - 14, y, width: 10, height: 14, rx: 2, fill: "#6b4a22", opacity: .55 });
        add("rect", { x: h.x + w / 2 + 4, y, width: 10, height: 14, rx: 2, fill: "#6b4a22", opacity: .55 });
      }
      add("rect", { x: h.x - w / 2, y: tableY, width: w, height: len, rx: 3, fill: h.color, stroke: "#3a2a17", "stroke-width": 1 });
    }
  }

  function setActive(page) {
    $$(".nav a").forEach(a => a.classList.toggle("active", a.dataset.key === page));
  }

  function startPage() {
    const main = $("#page");
    const page = main.dataset.page;
    document.body.dataset.page = page;
    setActive(page);
    buildFx(page);
    if (demo && page !== "home" && page !== "program") {
      main.insertAdjacentHTML("afterbegin",
        `<div class="demo-banner">지금은 <b>체험 모드</b>예요. 입력한 내용이 이 브라우저에만 저장됩니다.</div>`);
    }
    fillCrests(main);
    inits[page] && inits[page](main);
  }

  let navigating = false;
  async function go(url, push = true) {
    if (navigating) return;
    navigating = true;
    const main = $("#page");
    try {
      const res = await fetch(url, { cache: "no-cache" }); // 항상 최신 페이지 확인
      if (!res.ok) throw 0;
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const next = doc.querySelector("#page");
      if (!next) throw 0;
      const changeBg = next.dataset.page !== main.dataset.page;
      main.classList.add("leaving");
      if (changeBg) $(".bg").classList.add("swap");
      await new Promise(r => setTimeout(r, 350));
      main.replaceWith(next);
      document.title = next.dataset.title || doc.title;
      if (push) history.pushState(null, "", url);
      window.scrollTo({ top: 0, behavior: "instant" });
      next.classList.add("entering");
      setTimeout(() => next.classList.remove("entering"), 700);
      startPage();
      setTimeout(() => $(".bg").classList.remove("swap"), 60);
    } catch {
      location.href = url; // 실패하면 일반 이동
    } finally {
      navigating = false;
    }
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-nav]");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (a.href === location.href.split("#")[0]) return;
    go(a.href);
  });
  window.addEventListener("popstate", () => go(location.href, false));

  /* ================= 배경음악 (mp3, 켜기/끄기 버튼) ================= */
  const music = (() => {
    const box = $("#music"), btn = $("#music-btn"), audio = $("#bgm");
    if (!E.bgm || !E.bgm.src || !audio) { box && box.remove(); return { play() {} }; }
    audio.src = E.bgm.src;
    audio.volume = 0.45;
    btn.title = `${E.bgm.title}${E.bgm.artist ? " · " + E.bgm.artist : ""}`;

    // 새로고침·직접 접속 시 이어서 재생할 위치
    audio.addEventListener("loadedmetadata", () => {
      const t = +store.get("bgm-time") || 0;
      if (t && t < audio.duration) audio.currentTime = t;
    }, { once: true });
    audio.addEventListener("play", () => { box.classList.add("playing"); store.set("bgm", "on"); label("BGM 끄기"); });
    audio.addEventListener("pause", () => { box.classList.remove("playing"); label("BGM 켜기"); });
    setInterval(() => { if (!audio.paused) store.set("bgm-time", audio.currentTime); }, 2000);

    function label(t) { $(".music-label").textContent = t; }
    function play() { audio.play().catch(() => {}); }
    btn.addEventListener("click", () => {
      if (audio.paused) play();
      else { audio.pause(); store.set("bgm", "off"); }
    });
    // 이전 페이지에서 듣고 있었다면 안내 (브라우저 정책상 자동재생은 불가)
    label(store.get("bgm") === "on" ? "BGM 이어듣기" : "BGM 켜기");
    return { play };
  })();

  /* ================= 공통 도우미 ================= */
  function flyLetter() {
    const l = document.createElement("div");
    l.className = "fly-letter";
    document.body.appendChild(l);
    setTimeout(() => l.remove(), 1600);
  }

  /* ================= 홈: 초대장 ================= */
  function initHome(main) {
    $("#inv-date", main).textContent = E.date;
    $("#inv-place", main).textContent = E.place;
    $("#inv-cap", main).textContent = E.headcount || (E.capacity ? `최대 ${E.capacity}명` : "");
    if (!E.headcount && !E.capacity) { $("#inv-cap", main).previousElementSibling.remove(); $("#inv-cap", main).remove(); }
    if (E.mapUrl) $("#inv-map", main).href = E.mapUrl; else $("#inv-map", main).remove();

    // 펼친 책자: 왼쪽 장 초대장, 오른쪽 장 참석 회신
    const book = $("#letter", main);
    const wantRsvp = location.hash === "#rsvp"; // 예전 '참석 신청' 주소로 들어온 경우
    initRsvp(main);

    const env = $("#envelope", main);
    const reveal = () => {
      env.classList.add("gone");
      $("#tap-hint", main).classList.add("gone");
      book.hidden = false;
      $("#doors", main).hidden = false;
    };
    if (store.get("opened") || wantRsvp) {
      reveal();
      if (wantRsvp) setTimeout(() => $("#rsvp", main).scrollIntoView({ block: "start", behavior: "instant" }), 50);
      return;
    }
    const open = () => {
      if (env.classList.contains("open")) return;
      music.play(); // 봉인을 누르는 순간 음악 시작
      env.classList.add("open");
      store.set("opened", "1");
      // 덮개 열림 → 편지지 올라옴 → 봉투가 사라지고 초대장 등장
      setTimeout(() => env.classList.add("fade"), 1150);
      setTimeout(() => { reveal(); $("#letter", main).scrollIntoView({ behavior: "smooth", block: "start" }); }, 1500);
    };
    env.addEventListener("click", open);
    env.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  }

  /* ================= 대연회장: 참석 신청 (기숙사는 운영단이 랜덤 배정) ================= */
  function initRsvp(main) {
    $("#rsvp-form", main).addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, msg = $("#rsvp-msg", main), btn = f.querySelector("[type=submit]");
      const data = Object.fromEntries(new FormData(f));
      data.name = data.name.trim();
      btn.disabled = true; msg.textContent = "부엉이가 날아가는 중...";
      try {
        await api.add("rsvp", data); // 정원 확인은 시트 스크립트가 함
        flyLetter();
        msg.textContent = `✔ ${data.name}님의 회신이 도착했어요! 같은 이름으로 다시 보내면 수정됩니다.`;
        f.reset();
        loadRsvp(main);
      } catch (err) {
        msg.textContent = err.message === "full"
          ? `⚠ 정원(${E.capacity}명)이 모두 찼어요. 운영단에 문의해주세요.`
          : "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      } finally { btn.disabled = false; }
    });
    loadRsvp(main);
  }

  async function loadRsvp(main) {
    if (!$("#rsvp-stats", main)) return; // 현황 카드가 없는 페이지
    let s;
    try { s = await api.summary("rsvp"); }
    catch { $("#rsvp-stats", main).innerHTML = `<p class="empty">현황을 불러오지 못했어요.</p>`; return; }
    if (!main.isConnected) return;
    const cap = s.capacity || E.capacity, full = cap && s.attend >= cap;
    $("#rsvp-stats", main).innerHTML = `
      <div class="stat${full ? " full" : ""}"><b>${s.attend}${cap ? `<small> / ${cap}</small>` : ""}</b><small>${full ? "정원 마감" : "참석"}</small></div>
      <div class="stat"><b>${s.total}</b><small>회신</small></div>
      <div class="stat"><b>${s.siren}</b><small>세이렌 참여</small></div>`;
  }

  /* ================= 마법 지도: 프로그램 ================= */
  function initProgram(main) {
    const tl = $("#timeline", main), card = $("#map-card", main);
    const nowIdx = currentIndex();
    E.program.forEach((p, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.style.setProperty("--dot", p.house ? HOUSES[p.house].color : "#8a7a5a");
      if (p.rest) li.classList.add("rest");
      li.classList.add("open"); // 설명은 처음부터 펼쳐서 보여줌
      if (i === nowIdx) li.classList.add("now");
      li.innerHTML = `
        <button class="tl-btn" type="button"><span class="tl-time"></span><span class="tl-title"></span><span class="tl-arrow">›</span></button>
        <div class="tl-desc"></div>`;
      $(".tl-time", li).textContent = p.time;
      $(".tl-title", li).textContent = p.title;
      if (i === nowIdx) $(".tl-title", li).insertAdjacentHTML("beforeend", `<span class="now-tag">지금</span>`);
      $(".tl-desc", li).textContent = p.desc;
      $(".tl-btn", li).addEventListener("click", () => li.classList.toggle("open"));
      tl.appendChild(li);
    });
    const reveal = () => { card.classList.add("revealed"); store.set("map", "1"); };
    if (store.get("map")) reveal();
    $("#map-open", main).addEventListener("click", reveal);
  }

  // 행사 당일이면 지금 진행 중인 순서 번호
  function currentIndex() {
    if (!E.eventDay) return -1;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (today !== E.eventDay) return -1;
    const mins = now.getHours() * 60 + now.getMinutes();
    const toMin = t => { const [h, m] = t.trim().split(":").map(Number); return (h < 12 ? h + 12 : h) * 60 + m; };
    return E.program.findIndex(p => {
      const [a, b] = p.time.split(/[–-]/);
      return mins >= toMin(a) && mins < toMin(b);
    });
  }

  /* ================= 부엉이 탑: 롤링페이퍼 (내용은 운영단만 열람) ================= */
  // 편지 보기·수정 요청 (체험 모드는 브라우저 저장소에서 처리)
  async function letterCall(payload) {
    if (demo) {
      const list = JSON.parse(localStorage.getItem("hp-letters") || "[]");
      const from = (payload.from || "").trim() || "익명의 마법사";
      if (payload.kind === "myletters") {
        const mine = list.filter(l => l.from === from && l.pw === payload.pw);
        return mine.length ? { ok: true, letters: mine } : { ok: false, error: "보낸 사람 이름 또는 비밀번호가 맞지 않아요" };
      }
      const l = list.find(x => x.id === payload.id && x.pw === payload.pw);
      if (!l) return { ok: false, error: "비밀번호가 맞지 않아요" };
      l.message = payload.message;
      localStorage.setItem("hp-letters", JSON.stringify(list));
      return { ok: true };
    }
    const res = await fetch(E.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  function initLetters(main) {
    const ta = $("textarea", main);
    ta.addEventListener("input", () => ($("#msg-count", main).textContent = ta.value.length));

    $("#letter-form", main).addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, msg = $("#letter-msg", main), btn = f.querySelector("[type=submit]");
      const data = Object.fromEntries(new FormData(f));
      data.from = data.from.trim() || "익명의 마법사";
      data.message = data.message.trim();
      if (demo) data.id = Math.random().toString(36).slice(2, 10);
      if (!data.message) return;
      btn.disabled = true; msg.textContent = "부엉이가 편지를 물고 가는 중...";
      try {
        await api.add("letters", data);
        flyLetter();
        msg.innerHTML = "";
        msg.append("✔ 편지가 봉인되어 운영단에게 전달됐어요. 수정하려면 아래 ‘내가 쓴 편지’에서 ");
        const b = document.createElement("b");
        b.textContent = `보낸 사람(${data.from === "익명의 마법사" ? "비워두기" : data.from})과 비밀번호`;
        msg.append(b, "를 넣으면 돼요.");
        f.reset(); $("#msg-count", main).textContent = "0";
        loadLetters(main);
      } catch (err) {
        msg.textContent = err.message === "same"
          ? "⚠ 같은 이름으로 같은 비밀번호를 쓴 편지가 이미 있어요. 다른 비밀번호를 써주세요."
          : err.message.includes("비밀번호") ? "⚠ " + err.message
          : "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      } finally { btn.disabled = false; }
    });

    // 내가 쓴 편지 보기 · 수정
    const myForm = $("#my-form", main), myMsg = $("#my-msg", main), list = $("#my-list", main);
    let cred = null;
    myForm.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = myForm.querySelector("[type=submit]");
      cred = { from: myForm.from.value.trim(), pw: myForm.pw.value };
      btn.disabled = true; myMsg.textContent = "편지를 찾는 중..."; list.innerHTML = "";
      try {
        const r = await letterCall({ kind: "myletters", ...cred });
        if (!r.ok) { myMsg.textContent = "⚠ " + r.error; return; }
        myMsg.textContent = `편지 ${r.letters.length}통을 찾았어요. 고친 뒤 ‘수정 저장’을 눌러주세요.`;
        r.letters.forEach(l => list.appendChild(editCard(l)));
      } catch {
        myMsg.textContent = "⚠ 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
      } finally { btn.disabled = false; }
    });

    function editCard(l) {
      const card = document.createElement("div");
      card.className = "edit-card";
      const head = document.createElement("p");
      head.className = "edit-head";
      head.textContent = `— ${l.from}` + (l.time ? ` · ${new Date(l.time).toLocaleDateString("ko-KR")}` : "");
      const t = document.createElement("textarea");
      t.maxLength = 400; t.rows = 6; t.value = l.message;
      const row = document.createElement("div");
      row.className = "edit-row";
      const count = document.createElement("span");
      count.className = "count";
      count.textContent = `${t.value.length}/400`;
      t.addEventListener("input", () => (count.textContent = `${t.value.length}/400`));
      const save = document.createElement("button");
      save.className = "btn gold small"; save.type = "button"; save.textContent = "수정 저장";
      const note = document.createElement("p");
      note.className = "form-msg";
      save.addEventListener("click", async () => {
        if (!t.value.trim()) { note.textContent = "⚠ 내용을 비울 수는 없어요."; return; }
        save.disabled = true; note.textContent = "저장하는 중...";
        try {
          const r = await letterCall({ kind: "editletter", id: l.id, pw: cred.pw, message: t.value.trim() });
          note.textContent = r.ok ? "✔ 수정됐어요!" : "⚠ " + r.error;
        } catch {
          note.textContent = "⚠ 저장하지 못했어요. 잠시 후 다시 시도해주세요.";
        } finally { save.disabled = false; }
      });
      row.append(count, save);
      card.append(head, t, row, note);
      return card;
    }

    loadLetters(main);
  }

  async function loadLetters(main) {
    let s;
    try { s = await api.summary("letters"); } catch { return; }
    if (!main.isConnected) return;
    $("#letter-count", main).textContent = s.count;
  }

  /* ================= 운영단 페이지 (비밀번호 필요) ================= */
  function initAdmin(main) {
    const form = $("#admin-form", main), msg = $("#admin-msg", main);
    if (E.sheetUrl) $("#admin-sheet", main).href = E.sheetUrl; else $("#admin-sheet", main).remove();
    const show = d => {
      form.hidden = true;
      $("#admin-body", main).hidden = false;
      renderAdmin(main, d);
    };
    async function login(key) {
      msg.textContent = "확인하는 중...";
      try {
        const d = await api.admin(key);
        if (!d.ok) { msg.textContent = "⚠ " + (d.error || "비밀번호가 맞지 않아요"); store.set("admin-key", ""); return; }
        store.set("admin-key", key);
        msg.textContent = "";
        show(d);
      } catch {
        msg.textContent = "⚠ 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
      }
    }
    form.addEventListener("submit", e => { e.preventDefault(); login(form.key.value); });
    $("#admin-refresh", main).addEventListener("click", () => login(store.get("admin-key")));
    $("#admin-print", main).addEventListener("click", () => {
      if (!main._adminData) return;
      printLetters(main._adminData.letters || [], $("#print-style", main).value);
    });
    $("#admin-logout", main).addEventListener("click", () => {
      store.set("admin-key", "");
      form.hidden = false; form.reset();
      $("#admin-body", main).hidden = true;
    });
    if (demo) login("");
    else if (store.get("admin-key")) login(store.get("admin-key"));
  }

  function renderAdmin(main, d) {
    main._adminData = d;
    const rsvp = d.rsvp || [], letters = d.letters || [];
    const yes = rsvp.filter(r => r.attend === "참석");
    $("#admin-stats", main).innerHTML = `
      <div class="stat"><b>${yes.length}<small> / ${d.capacity || E.capacity}</small></b><small>참석</small></div>
      <div class="stat"><b>${rsvp.filter(r => r.attend === "불참").length}</b><small>불참</small></div>
      <div class="stat"><b>${rsvp.filter(r => r.siren === "참여" && r.attend !== "불참").length}</b><small>세이렌 참여</small></div>
      <div class="stat"><b>${letters.length}</b><small>편지</small></div>`;

    const tb = $("#admin-table tbody", main);
    tb.innerHTML = "";
    const order = { 참석: 0, 불참: 1 };
    rsvp.slice().sort((a, b) => (order[a.attend] ?? 2) - (order[b.attend] ?? 2)).forEach(r => {
      const tr = document.createElement("tr");
      [r.name, r.role, r.attend, r.phone, r.siren, HOUSES[r.house]?.name || "미배정", r.note].forEach(v => {
        const td = document.createElement("td");
        td.textContent = v || "";
        tr.appendChild(td);
      });
      if (HOUSES[r.house]) tr.children[5].style.color = HOUSES[r.house].pal[1];
      tb.appendChild(tr);
    });
    if (!rsvp.length) tb.innerHTML = `<tr><td colspan="7" class="empty">아직 회신이 없어요.</td></tr>`;

    const wall = $("#letter-wall", main);
    wall.innerHTML = "";
    if (!letters.length) { wall.innerHTML = `<p class="empty center">아직 도착한 편지가 없어요.</p>`; return; }
    letters.slice().reverse().forEach(l => {
      const n = document.createElement("div");
      n.className = "note";
      n.innerHTML = `<span class="wax"></span>`;
      n.append(l.message);
      const s = document.createElement("span");
      s.className = "from";
      s.textContent = "— " + l.from;
      n.appendChild(s);
      wall.appendChild(n);
    });
  }


  /* ================= 롤링페이퍼 인쇄 (A4, 표지 + 편지) ================= */
  function buildPrint(letters, style) {
    let area = $("#print-area");
    if (!area) { area = document.createElement("div"); area.id = "print-area"; document.body.appendChild(area); }
    const day = (E.date || "").split("(")[0].trim();
    area.className = style === "ink" ? "ink" : "";
    area.innerHTML = `
      <section class="p-cover">
        <div class="p-frame"></div>
        <div class="p-seal">H</div>
        <p class="p-eyebrow">HOGWARTS SCHOOL of HRA</p>
        <h1 class="p-title">교수님께</h1>
        <p class="p-sub">HRA 2026 송년회 · 부엉이 편지</p>
        <p class="p-meta">${day} · ${letters.length}통의 편지</p>
        <div class="p-crests">${Object.keys(HOUSES).map(k => crest(k)).join("")}</div>
        <p class="p-foot">Mischief Managed</p>
      </section>
      <section class="p-letters"></section>`;
    const box = $(".p-letters", area);
    letters.forEach(l => { // 도착한 순서대로
      const n = document.createElement("article");
      n.className = "p-note";
      const msg = document.createElement("p");
      msg.className = "p-msg";
      msg.textContent = l.message;
      const from = document.createElement("p");
      from.className = "p-from";
      from.textContent = "— " + (l.from || "익명의 마법사");
      n.append(msg, from);
      box.appendChild(n);
    });
    return area;
  }

  function printLetters(letters, style) {
    if (!letters.length) { alert("아직 인쇄할 편지가 없어요."); return; }
    buildPrint(letters, style);
    const root = document.documentElement;
    root.classList.add("printing");
    const done = () => { root.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(() => window.print(), 300); // 글꼴·그림이 그려질 시간
  }

  startPage();
})();
