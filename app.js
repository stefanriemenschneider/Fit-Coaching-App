(() => {
  const START_DATE = "2026-02-21";

  const elBg = document.getElementById("bg");
  const elDate = document.getElementById("dateText");
  const elCount = document.getElementById("countText");
  const elQuote = document.getElementById("quoteText");
  const elCalendarTitle = document.getElementById("calendarTitle");

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnShare = document.getElementById("btnShare");
  const btnFav = document.getElementById("btnFav");

  const dlg = document.getElementById("calendarDialog");
  const btnCalendar = document.getElementById("btnCalendar");
  const btnHeaderFav = document.getElementById("btnHeaderFav");
  const btnCloseCalendar = document.getElementById("btnCloseCalendar");
  const btnToggleFavs = document.getElementById("btnToggleFavs");
  const list = document.getElementById("calendarList");

  const fmt = new Intl.DateTimeFormat("de-DE", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const daysBetween = (a, b) => {
    const ms = 24 * 60 * 60 * 1000;
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    return Math.floor((db - da) / ms);
  };

  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- Favorites (local, offline) ---
  const FAV_KEY = "fc_dm_favs_v1";
  const loadFavs = () => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = JSON.parse(raw || "[]");
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch (_) {
      return new Set();
    }
  };
  const saveFavs = (set) => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {
      // ignore
    }
  };

  let favs = loadFavs();
  let showOnlyFavs = false;

  let entries = [];
  let index = 0;

  function setIndex(newIndex) {
    index = clamp(newIndex, 0, entries.length - 1);
    render();
  }

  function updateFavButton() {
    const e = entries[index];
    const isFav = !!e && favs.has(e.date);
    btnFav.textContent = isFav ? "♥ Favorit" : "♡ Favorit";
    btnFav.classList.toggle("favOn", isFav);
    btnFav.setAttribute("aria-label", isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen");
  }

  function render() {
    const e = entries[index];
    if (!e) return;

    elBg.style.backgroundImage = `url('${e.image}')`;
    elDate.textContent = fmt.format(new Date(e.date + "T00:00:00"));
    elCount.textContent = `Tag ${index + 1}/${entries.length}`;
    elQuote.textContent = `„${e.quote}“`;

    btnPrev.disabled = index <= 0;
    btnNext.disabled = index >= entries.length - 1;
    btnPrev.style.opacity = btnPrev.disabled ? 0.55 : 1;
    btnNext.style.opacity = btnNext.disabled ? 0.55 : 1;

    updateFavButton();

    // Update URL hash for shareable deep-link
    location.hash = `#day-${String(index + 1).padStart(3, "0")}`;
  }

  function buildCalendar() {
    list.innerHTML = "";

    const rows = [];
    if (showOnlyFavs) {
      entries.forEach((e, i) => {
        if (favs.has(e.date)) rows.push({ e, i });
      });
    } else {
      entries.forEach((e, i) => rows.push({ e, i }));
    }

    const favCount = Array.from(favs).length;

    if (elCalendarTitle) {
      elCalendarTitle.textContent = showOnlyFavs ? `Favoriten (${rows.length})` : `Kalender (${entries.length} Tage)`;
    }
    if (btnToggleFavs) {
      btnToggleFavs.textContent = showOnlyFavs ? "Alle" : "Favoriten";
      btnToggleFavs.setAttribute("aria-label", showOnlyFavs ? "Alle Tage anzeigen" : "Nur Favoriten anzeigen");
      btnToggleFavs.style.opacity = favCount === 0 && !showOnlyFavs ? 0.75 : 1;
    }

    if (rows.length === 0) {
      const empty = document.createElement("div");
      empty.className = "item";
      empty.style.cursor = "default";
      empty.style.opacity = 0.85;
      empty.innerHTML = `<div class="itemDate">Noch keine Favoriten.</div><div class="itemQuote">Tippe auf „♡ Favorit“, um einen Spruch zu speichern.</div>`;
      list.appendChild(empty);
      return;
    }

    rows.forEach(({ e, i }) => {
      const row = document.createElement("div");
      row.className = "item" + (favs.has(e.date) ? " fav" : "");
      row.tabIndex = 0;
      row.role = "button";
      row.addEventListener("click", () => {
        dlg.close();
        setIndex(i);
      });
      row.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          dlg.close();
          setIndex(i);
        }
      });

      const mark = document.createElement("div");
      mark.className = "favMark";
      mark.textContent = favs.has(e.date) ? "♥" : " ";

      const left = document.createElement("div");
      left.innerHTML = `<div class="itemDate">${fmt.format(new Date(e.date + "T00:00:00"))}</div>`;

      const right = document.createElement("div");
      right.className = "itemQuote";
      right.textContent = e.quote;

      row.appendChild(mark);
      row.appendChild(left);
      row.appendChild(right);
      list.appendChild(row);
    });
  }

  function indexFromHash() {
    const m = (location.hash || "").match(/day-(\d{1,3})/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (Number.isNaN(n)) return null;
    return clamp(n - 1, 0, entries.length - 1);
  }

  // --- Share as image (for WhatsApp/Instagram story) ---
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawCover = (ctx, img, w, h) => {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  const wrapLines = (ctx, text, maxWidth) => {
    const words = (text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = w;
      }
    });
    if (line) lines.push(line);
    return lines;
  };

  async function makeShareFile(entry) {
    const W = 1080, H = 1920; // story format
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background
    const bg = await loadImage(entry.image);
    drawCover(ctx, bg, W, H);

    // Gentle contrast for readability (keeps photo bright)
    ctx.fillStyle = "rgba(0,0,0,0.10)";
    ctx.fillRect(0, 0, W, H);

    // Header date
    const dateLabel = fmt.format(new Date(entry.date + "T00:00:00"));
    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.font = "700 38px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(dateLabel, W / 2, 140);

    // Quote panel
    const rawQuote = `„${entry.quote}“`;
    const len = (entry.quote || "").length;
    let fontSize = 72;
    if (len > 140) fontSize = 60;
    if (len > 190) fontSize = 54;
    if (len > 240) fontSize = 48;

    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    const maxTextWidth = 900;
    const lines = wrapLines(ctx, rawQuote, maxTextWidth);

    const lineH = Math.round(fontSize * 1.18);
    const textH = lines.length * lineH;
    const padX = 70, padY = 60;
    const boxW = 960;
    const boxH = textH + padY * 2;
    const boxX = (W - boxW) / 2;
    const boxY = Math.round((H - boxH) / 2);

    // Panel background
    ctx.save();
    roundRect(ctx, boxX, boxY, boxW, boxH, 44);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fill();
    ctx.restore();

    // Text
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let y = boxY + padY;
    lines.forEach((ln) => {
      ctx.fillText(ln, W / 2, y);
      y += lineH;
    });

    // Branding (small)
    const logo = await loadImage("assets/logo.png");
    const targetH = 90;
    const scale = targetH / (logo.naturalHeight || logo.height);
    const lw = (logo.naturalWidth || logo.width) * scale;
    const lh = targetH;
    const lx = (W - lw) / 2;
    const ly = H - 260;

    ctx.globalAlpha = 0.92;
    ctx.drawImage(logo, lx, ly, lw, lh);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.font = "650 34px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Fit Coaching • Daily Mindset", W / 2, H - 150);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
    return new File([blob], `FitCoaching_DailyMindset_${entry.date}.png`, { type: "image/png" });
  }

  async function share() {
    const e = entries[index];
    const dateLabel = fmt.format(new Date(e.date + "T00:00:00"));
    const title = "Fit Coaching — Daily Mindset";

    btnShare.disabled = true;
    const oldLabel = btnShare.textContent;
    btnShare.textContent = "Erstelle Bild…";

    // Try: share as image file
    try {
      const file = await makeShareFile(e);
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text: e.quote, files: [file] });
        return;
      }

      // Fallback: open image in new tab so user can save/share manually
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      return;
    } catch (_) {
      // ignore and fallback to text
    } finally {
      btnShare.disabled = false;
      btnShare.textContent = oldLabel;
    }

    // Text fallback
    const text = `${e.quote}\n\n${dateLabel}\nFit Coaching • Daily Mindset`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        btnShare.textContent = "Kopiert ✓";
        setTimeout(() => (btnShare.textContent = "Teilen"), 1100);
      }
    } catch (_) {
      // ignore
    }
  }

  function initIndex() {
    // If deep-link hash exists, prefer it
    const hashIndex = indexFromHash();
    if (hashIndex !== null) return hashIndex;

    // Prefer exact date match (robust even if start date changes)
    const t = todayISO();
    const byDate = entries.findIndex((e) => e.date === t);
    if (byDate >= 0) return byDate;

    // Fallback: show today's day based on start date
    const diff = daysBetween(START_DATE, t);
    return clamp(diff, 0, entries.length - 1);
  }

  function toggleFavorite() {
    const e = entries[index];
    if (!e) return;

    if (favs.has(e.date)) {
      favs.delete(e.date);
    } else {
      favs.add(e.date);
    }
    saveFavs(favs);
    updateFavButton();
    // Update calendar view (hearts + possible filtering)
    buildCalendar();
  }

  btnPrev.addEventListener("click", () => setIndex(index - 1));
  btnNext.addEventListener("click", () => setIndex(index + 1));
  btnShare.addEventListener("click", share);
  btnFav.addEventListener("click", toggleFavorite);

  btnCalendar.addEventListener("click", () => dlg.showModal());
  if (btnHeaderFav) {
    btnHeaderFav.addEventListener("click", () => {
      showOnlyFavs = true;
      buildCalendar();
      dlg.showModal();
    });
  }
  btnCloseCalendar.addEventListener("click", () => dlg.close());
  btnToggleFavs.addEventListener("click", () => {
    showOnlyFavs = !showOnlyFavs;
    buildCalendar();
  });

  // Load data
  fetch("data/entries.json")
    .then((r) => r.json())
    .then((data) => {
      entries = Array.isArray(data) ? data : [];
      buildCalendar();
      setIndex(initIndex());
    })
    .catch(() => {
      elQuote.textContent = "Daten konnten nicht geladen werden.";
    });

  // Register service worker (offline)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
