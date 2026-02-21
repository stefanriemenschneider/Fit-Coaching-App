(() => {
  const START_DATE = "2026-02-21";
  const elBg = document.getElementById("bg");
  const elDate = document.getElementById("dateText");
  const elCount = document.getElementById("countText");
  const elQuote = document.getElementById("quoteText");

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnShare = document.getElementById("btnShare");

  const dlg = document.getElementById("calendarDialog");
  const btnCalendar = document.getElementById("btnCalendar");
  const btnCloseCalendar = document.getElementById("btnCloseCalendar");
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

  let entries = [];
  let index = 0;

  function setIndex(newIndex) {
    index = clamp(newIndex, 0, entries.length - 1);
    render();
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

    // Update URL hash for shareable deep-link
    location.hash = `#day-${String(index + 1).padStart(3, "0")}`;
  }

  function buildCalendar() {
    list.innerHTML = "";
    entries.forEach((e, i) => {
      const row = document.createElement("div");
      row.className = "item";
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

      const left = document.createElement("div");
      left.innerHTML = `<div class="itemDate">${fmt.format(new Date(e.date + "T00:00:00"))}</div>`;
      const right = document.createElement("div");
      right.className = "itemQuote";
      right.textContent = e.quote;

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

  async function share() {
    const e = entries[index];
    const text = `${e.quote}\n\nFit Coaching • Daily Mindset (${fmt.format(new Date(e.date + "T00:00:00"))})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Fit Coaching — Daily Mindset", text });
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

  btnPrev.addEventListener("click", () => setIndex(index - 1));
  btnNext.addEventListener("click", () => setIndex(index + 1));
  btnShare.addEventListener("click", share);

  btnCalendar.addEventListener("click", () => dlg.showModal());
  btnCloseCalendar.addEventListener("click", () => dlg.close());

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
