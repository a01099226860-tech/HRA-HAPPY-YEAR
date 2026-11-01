(() => {
  const E = window.EVENT;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const HOUSES = {
    g: { name: "그리핀도르", icon: "🦁", color: "#8b1e1e" },
    h: { name: "후플푸프", icon: "🦡", color: "#c9a227" },
    r: { name: "래번클로", icon: "🦅", color: "#1e3a6b" },
    s: { name: "슬리데린", icon: "🐍", color: "#1f5a3a" },
  };

  /* ---------- 데이터 저장소 (구글 시트 or 브라우저) ---------- */
  const demo = !E.scriptUrl;
  const api = {
    async list(kind) {
      if (demo) return JSON.parse(localStorage.getItem("hp-" + kind) || "[]");
      const res = await fetch(`${E.scriptUrl}?kind=${kind}&t=${Date.now()}`);
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
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
  };
  if (demo) $("#demo-banner").hidden = false;

  /* ---------- 공통 ---------- */
  // 별 배경
  const stars = $(".stars");
  for (let i = 0; i < 80; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 3 + "s";
    stars.appendChild(s);
  }

  // 탭
  function openTab(id) {
    $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === id));
    $$(".panel").forEach(p => p.classList.toggle("active", p.id === id));
    history.replaceState(null, "", "#" + id);
    if (id === "rsvp") loadRsvp();
    if (id === "letters") loadLetters();
  }
  $$(".tab").forEach(t => t.addEventListener("click", () => openTab(t.dataset.tab)));
  $$("[data-goto]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); openTab(b.dataset.goto); }));

  function flyOwl() {
    const o = $("#owl-fly");
    o.classList.remove("go"); void o.offsetWidth; o.classList.add("go");
    clearTimeout(flyOwl.t);
    flyOwl.t = setTimeout(() => o.classList.remove("go"), 1700);
  }

  function housePicker(container, onPick) {
    let value = "";
    container.innerHTML = "";
    const btns = Object.entries(HOUSES).map(([k, h]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "house-opt " + k;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span>${h.icon}</span>${h.name}`;
      b.addEventListener("click", () => set(k));
      container.appendChild(b);
      return [k, b];
    });
    function set(k) {
      value = k;
      btns.forEach(([key, b]) => b.setAttribute("aria-pressed", String(key === k)));
      onPick && onPick(k);
    }
    return { get: () => value, set };
  }

  /* ---------- 초대장 ---------- */
  $("#inv-date").textContent = E.date;
  $("#inv-place").textContent = E.place;
  const env = $("#envelope");
  const openEnv = () => {
    if (env.classList.contains("open")) return;
    env.classList.add("open");
    setTimeout(() => { env.classList.add("gone"); $("#letter").hidden = false; }, 1100);
  };
  env.addEventListener("click", openEnv);
  env.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnv(); } });

  /* ---------- 참석 신청 ---------- */
  const rsvpHouse = housePicker($("#house-picker"), () => ($("#hat-say").textContent = ""));
  const HAT_LINES = [
    k => `음... 어렵군, 아주 어려워... 좋아, ${HOUSES[k].name}!`,
    k => `용기와 재능이 보이는구나... ${HOUSES[k].name}!`,
    k => `너의 자리는 정해져 있었지. ${HOUSES[k].name}!`,
  ];
  $("#sort-hat").addEventListener("click", () => {
    const keys = Object.keys(HOUSES);
    const say = $("#hat-say");
    let n = 0;
    say.textContent = "흐음...";
    const spin = setInterval(() => {
      rsvpHouse.set(keys[n++ % 4]);
      say.textContent = "흐음" + ".".repeat(n % 4);
      if (n > 10) {
        clearInterval(spin);
        const k = keys[Math.floor(Math.random() * 4)];
        rsvpHouse.set(k);
        say.textContent = "🎩 " + HAT_LINES[Math.floor(Math.random() * HAT_LINES.length)](k);
      }
    }, 120);
  });

  $("#rsvp-form").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, msg = $("#rsvp-msg"), btn = f.querySelector("[type=submit]");
    if (!rsvpHouse.get()) { msg.textContent = "기숙사를 골라주세요 (모르겠으면 분류모자에게!)"; return; }
    const data = Object.fromEntries(new FormData(f));
    data.name = data.name.trim();
    data.house = rsvpHouse.get();
    btn.disabled = true; msg.textContent = "부엉이가 날아가는 중...";
    try {
      await api.add("rsvp", data);
      flyOwl();
      msg.textContent = `✔ ${data.name}님의 회신이 도착했어요! 같은 이름으로 다시 보내면 수정됩니다.`;
      f.reset(); rsvpHouse.set(""); $("#hat-say").textContent = "";
      loadRsvp();
    } catch (err) {
      msg.textContent = "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
    } finally { btn.disabled = false; }
  });

  async function loadRsvp() {
    let list;
    try { list = await api.list("rsvp"); } catch { $("#rsvp-stats").innerHTML = `<p class="empty">현황을 불러오지 못했어요.</p>`; return; }
    const yes = list.filter(r => r.attend === "참석");
    const siren = list.filter(r => r.siren === "참여" && r.attend !== "불참");
    $("#rsvp-stats").innerHTML = `
      <div class="stat"><b>${yes.length}</b><small>참석</small></div>
      <div class="stat"><b>${list.length}</b><small>회신</small></div>
      <div class="stat"><b>${siren.length}</b><small>세이렌 참여</small></div>`;
    const bars = $("#house-bars"); bars.innerHTML = "";
    const max = Math.max(1, ...Object.keys(HOUSES).map(k => yes.filter(r => r.house === k).length));
    for (const [k, h] of Object.entries(HOUSES)) {
      const c = yes.filter(r => r.house === k).length;
      bars.insertAdjacentHTML("beforeend",
        `<div class="hbar"><span>${h.icon} ${h.name}</span><div class="track"><div class="fill" style="width:${c / max * 100}%;background:${h.color}"></div></div><b>${c}</b></div>`);
    }
    const ul = $("#guest-list"); ul.innerHTML = "";
    if (!list.length) { ul.innerHTML = `<li class="empty">아직 도착한 부엉이가 없어요.</li>`; return; }
    list.forEach(r => {
      const li = document.createElement("li");
      li.className = "bg-" + (r.house || "g") + (r.attend === "불참" ? " no" : "");
      li.textContent = `${HOUSES[r.house]?.icon || ""} ${r.name}${r.attend === "미정" ? " (미정)" : ""}`;
      ul.appendChild(li);
    });
  }

  /* ---------- 프로그램 ---------- */
  const tl = $("#timeline");
  E.program.forEach(p => {
    const li = document.createElement("li");
    if (p.rest) li.classList.add("rest");
    li.style.setProperty("--dot", p.house ? HOUSES[p.house].color : "#a99f88");
    li.innerHTML = `
      <button class="tl-btn" type="button">
        <span class="tl-time"></span><span class="tl-title"></span><span class="tl-arrow">›</span>
      </button>
      <div class="tl-desc"></div>`;
    $(".tl-time", li).textContent = p.time;
    $(".tl-title", li).textContent = p.title;
    $(".tl-desc", li).textContent = p.desc;
    $(".tl-btn", li).addEventListener("click", () => li.classList.toggle("open"));
    tl.appendChild(li);
  });

  /* ---------- 롤링페이퍼 ---------- */
  const letterHouse = housePicker($("#letter-house"));
  letterHouse.set("g");
  const ta = $("#letter-form textarea");
  ta.addEventListener("input", () => ($("#msg-count").textContent = ta.value.length));

  $("#letter-form").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, msg = $("#letter-msg"), btn = f.querySelector("[type=submit]");
    const data = Object.fromEntries(new FormData(f));
    data.from = data.from.trim() || "익명의 마법사";
    data.message = data.message.trim();
    data.house = letterHouse.get();
    if (!data.message) return;
    btn.disabled = true; msg.textContent = "부엉이가 편지를 물고 가는 중...";
    try {
      await api.add("letters", data);
      flyOwl();
      msg.textContent = "✔ 편지가 교수님 우편함에 도착했어요!";
      f.reset(); $("#msg-count").textContent = "0"; letterHouse.set("g");
      loadLetters();
    } catch {
      msg.textContent = "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
    } finally { btn.disabled = false; }
  });

  async function loadLetters() {
    const wall = $("#letter-wall");
    let list;
    try { list = await api.list("letters"); } catch { wall.innerHTML = `<p class="empty">편지를 불러오지 못했어요.</p>`; return; }
    wall.innerHTML = "";
    if (!list.length) { wall.innerHTML = `<p class="empty">첫 번째 편지를 남겨주세요 🦉</p>`; return; }
    list.slice().reverse().forEach(l => {
      const d = document.createElement("div");
      d.className = "note";
      d.style.setProperty("--band", HOUSES[l.house]?.color || "#b8954f");
      d.textContent = l.message;
      const s = document.createElement("span");
      s.className = "from";
      s.textContent = "— " + l.from;
      d.appendChild(s);
      wall.appendChild(d);
    });
  }

  /* 주소 끝 #rsvp 처럼 들어오면 해당 탭 열기 */
  const start = location.hash.slice(1);
  openTab(["invite", "rsvp", "program", "letters"].includes(start) ? start : "invite");
})();
