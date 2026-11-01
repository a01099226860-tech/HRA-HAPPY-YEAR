(() => {
  const E = window.EVENT;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = { // sessionStorage가 막힌 환경에서도 동작하도록
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  const HOUSES = {
    g: { name: "그리핀도르", icon: "🦁", color: "#8b1e1e" },
    h: { name: "후플푸프", icon: "🦡", color: "#c9a227" },
    r: { name: "래번클로", icon: "🦅", color: "#1e3a6b" },
    s: { name: "슬리데린", icon: "🐍", color: "#1f5a3a" },
  };

  /* ================= 데이터 (구글 시트 or 브라우저) ================= */
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
  const inits = { home: initHome, rsvp: initRsvp, program: initProgram, letters: initLetters };

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
    inits[page] && inits[page](main);
  }

  let navigating = false;
  async function go(url, push = true) {
    if (navigating) return;
    navigating = true;
    const main = $("#page");
    try {
      const res = await fetch(url);
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

  /* ================= 배경음악 (유튜브 공식 플레이어) ================= */
  const music = (() => {
    const box = $("#music"), btn = $("#music-btn");
    const id = E.bgm && E.bgm.youtubeId;
    if (!id) { box.remove(); return { play() {} }; }
    $(".music-meta").innerHTML = `♪ <b>${E.bgm.title}</b> · ${E.bgm.artist}`;

    let player = null, ready = false, want = false, playing = false, hideTimer;
    const peek = (ms = 5000) => {
      box.classList.add("expanded");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => box.classList.remove("expanded"), ms);
    };

    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player("yt", {
        videoId: id,
        playerVars: { loop: 1, playlist: id, playsinline: 1, rel: 0, modestbranding: 1,
                      start: Math.floor(+store.get("bgm-time") || 0) },
        events: {
          onReady: () => { ready = true; player.setVolume(45); if (want) player.playVideo(); },
          onStateChange: e => {
            playing = e.data === YT.PlayerState.PLAYING;
            box.classList.toggle("playing", playing);
            if (e.data === YT.PlayerState.PLAYING) store.set("bgm", "on");
            if (e.data === YT.PlayerState.PAUSED) store.set("bgm", "off");
          },
        },
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);

    setInterval(() => { if (ready && playing) store.set("bgm-time", player.getCurrentTime()); }, 2000);

    function play() { want = true; if (ready) player.playVideo(); peek(); }
    btn.addEventListener("click", () => {
      if (playing) { player.pauseVideo(); want = false; peek(2500); }
      else play();
    });
    // 이전 페이지에서 듣고 있었다면 안내 (브라우저 정책상 자동재생은 불가)
    if (store.get("bgm") === "on") $(".music-label").textContent = "음악 이어듣기";
    box.addEventListener("mouseenter", () => { clearTimeout(hideTimer); box.classList.add("expanded"); });
    box.addEventListener("mouseleave", () => peek(1200));
    return { play };
  })();

  /* ================= 공통 도우미 ================= */
  function housePicker(container, onPick) {
    let value = "";
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
    $("#inv-cap", main).textContent = E.capacity ? `최대 ${E.capacity}명` : "";
    if (!E.capacity) { $("#inv-cap", main).previousElementSibling.remove(); $("#inv-cap", main).remove(); }
    if (E.mapUrl) $("#inv-map", main).href = E.mapUrl; else $("#inv-map", main).remove();

    const env = $("#envelope", main);
    const reveal = () => {
      env.classList.add("gone");
      $("#tap-hint", main).classList.add("gone");
      $("#letter", main).hidden = false;
      $("#doors", main).hidden = false;
    };
    if (store.get("opened")) { reveal(); return; }
    const open = () => {
      if (env.classList.contains("open")) return;
      music.play(); // 봉인을 누르는 순간 음악 시작
      env.classList.add("open");
      store.set("opened", "1");
      setTimeout(() => { reveal(); $("#letter", main).scrollIntoView({ behavior: "smooth", block: "start" }); }, 1100);
    };
    env.addEventListener("click", open);
    env.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  }

  /* ================= 대연회장: 참석 신청 ================= */
  function initRsvp(main) {
    const picker = housePicker($("#house-picker", main), () => ($("#hat-say", main).textContent = ""));
    const HAT = [
      k => `음... 어렵군, 아주 어려워... 좋아, ${HOUSES[k].name}!`,
      k => `용기와 재능이 보이는구나... ${HOUSES[k].name}!`,
      k => `너의 자리는 정해져 있었지. ${HOUSES[k].name}!`,
    ];
    $("#sort-hat", main).addEventListener("click", () => {
      const keys = Object.keys(HOUSES), say = $("#hat-say", main);
      let n = 0;
      const spin = setInterval(() => {
        picker.set(keys[n++ % 4]);
        say.textContent = "흐음" + ".".repeat(n % 4);
        if (n > 10) {
          clearInterval(spin);
          const k = keys[Math.floor(Math.random() * 4)];
          picker.set(k);
          say.textContent = "🎩 " + HAT[Math.floor(Math.random() * HAT.length)](k);
        }
      }, 120);
    });

    $("#rsvp-form", main).addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, msg = $("#rsvp-msg", main), btn = f.querySelector("[type=submit]");
      if (!picker.get()) { msg.textContent = "기숙사를 골라주세요 (모르겠으면 분류모자에게!)"; return; }
      const data = Object.fromEntries(new FormData(f));
      data.name = data.name.trim();
      data.house = picker.get();
      btn.disabled = true; msg.textContent = "부엉이가 날아가는 중...";
      try {
        // 정원 확인: 새로 '참석'하는 사람만 막고, 이미 참석으로 낸 사람의 수정은 허용
        if (E.capacity && data.attend === "참석") {
          const list = await api.list("rsvp");
          const already = list.some(r => r.name === data.name && r.attend === "참석");
          if (!already && list.filter(r => r.attend === "참석").length >= E.capacity) {
            msg.textContent = `⚠ 정원(${E.capacity}명)이 모두 찼어요. 준비위원회에 문의해주세요.`;
            return;
          }
        }
        await api.add("rsvp", data);
        flyLetter();
        msg.textContent = `✔ ${data.name}님의 회신이 도착했어요! 같은 이름으로 다시 보내면 수정됩니다.`;
        f.reset(); picker.set(""); $("#hat-say", main).textContent = "";
        loadRsvp(main);
      } catch {
        msg.textContent = "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      } finally { btn.disabled = false; }
    });
    loadRsvp(main);
  }

  async function loadRsvp(main) {
    let list;
    try { list = await api.list("rsvp"); }
    catch { $("#rsvp-stats", main).innerHTML = `<p class="empty">현황을 불러오지 못했어요.</p>`; return; }
    if (!main.isConnected) return;
    const yes = list.filter(r => r.attend === "참석");
    const siren = list.filter(r => r.siren === "참여" && r.attend !== "불참");
    const cap = E.capacity, full = cap && yes.length >= cap;
    $("#rsvp-stats", main).innerHTML = `
      <div class="stat${full ? " full" : ""}"><b>${yes.length}${cap ? `<small> / ${cap}</small>` : ""}</b><small>${full ? "정원 마감" : "참석"}</small></div>
      <div class="stat"><b>${list.length}</b><small>회신</small></div>
      <div class="stat"><b>${siren.length}</b><small>세이렌 참여</small></div>`;

    // 기숙사 깃발: 인원만큼 길게 내려옴
    const counts = Object.fromEntries(Object.keys(HOUSES).map(k => [k, yes.filter(r => r.house === k).length]));
    const max = Math.max(1, ...Object.values(counts));
    const wrap = $("#banners", main);
    wrap.innerHTML = "";
    for (const [k, h] of Object.entries(HOUSES)) {
      const b = document.createElement("div");
      b.className = "banner bg-" + k;
      b.style.height = "100px";
      b.innerHTML = `<span>${h.icon}</span><b>${counts[k]}</b><small>${h.name}</small>`;
      wrap.appendChild(b);
      requestAnimationFrame(() => requestAnimationFrame(() => (b.style.height = 100 + (counts[k] / max) * 120 + "px")));
    }

    const ul = $("#guest-list", main);
    ul.innerHTML = "";
    if (!list.length) { ul.innerHTML = `<li class="empty">아직 도착한 부엉이가 없어요.</li>`; return; }
    list.forEach(r => {
      const li = document.createElement("li");
      li.className = "bg-" + (HOUSES[r.house] ? r.house : "g") + (r.attend === "불참" ? " no" : "");
      li.textContent = `${HOUSES[r.house]?.icon || ""} ${r.name}${r.attend === "미정" ? " (미정)" : ""}`;
      ul.appendChild(li);
    });
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
      if (i === nowIdx) li.classList.add("now", "open");
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

  /* ================= 부엉이 탑: 롤링페이퍼 ================= */
  function initLetters(main) {
    const picker = housePicker($("#letter-house", main));
    picker.set("g");
    const ta = $("textarea", main);
    ta.addEventListener("input", () => ($("#msg-count", main).textContent = ta.value.length));

    $("#letter-form", main).addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, msg = $("#letter-msg", main), btn = f.querySelector("[type=submit]");
      const data = Object.fromEntries(new FormData(f));
      data.from = data.from.trim() || "익명의 마법사";
      data.message = data.message.trim();
      data.house = picker.get();
      if (!data.message) return;
      btn.disabled = true; msg.textContent = "부엉이가 편지를 물고 가는 중...";
      try {
        await api.add("letters", data);
        flyLetter();
        msg.textContent = "✔ 편지가 교수님 우편함에 도착했어요!";
        f.reset(); $("#msg-count", main).textContent = "0"; picker.set("g");
        loadLetters(main);
      } catch {
        msg.textContent = "⚠ 전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      } finally { btn.disabled = false; }
    });
    loadLetters(main);
  }

  async function loadLetters(main) {
    const wall = $("#letter-wall", main);
    let list;
    try { list = await api.list("letters"); }
    catch { wall.innerHTML = `<p class="empty">편지를 불러오지 못했어요.</p>`; return; }
    if (!main.isConnected) return;
    $("#letter-count", main).textContent = list.length ? `· ${list.length}통` : "";
    wall.innerHTML = "";
    if (!list.length) { wall.innerHTML = `<p class="empty center">첫 번째 편지를 남겨주세요 🦉</p>`; return; }
    list.slice().reverse().forEach(l => {
      const d = document.createElement("div");
      d.className = "note";
      d.style.setProperty("--band", HOUSES[l.house]?.color || "#7a1f24");
      d.innerHTML = `<span class="wax"></span>`;
      d.append(l.message);
      const s = document.createElement("span");
      s.className = "from";
      s.textContent = "— " + l.from;
      d.appendChild(s);
      wall.appendChild(d);
    });
  }

  startPage();
})();
