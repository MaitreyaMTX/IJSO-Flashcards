/**
 * IJSO Master Flashcards — app logic
 * Expects a global `flashcards` array (loaded from flashcards.js) of
 * objects shaped like: { id, subject, topic, question, answer, difficulty }
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ijso-flashcards-progress-v1";
  var SUBJECTS = ["All", "Biology", "Chemistry", "Physics", "General Science"];

  var deck = Array.isArray(window.flashcards) ? window.flashcards.slice() : [];
  var progress = loadProgress(); // { [id]: "known" | "unknown" }

  var state = {
    subject: "All",
    query: "",
    order: deck.map(function (c) { return c.id; }), // current shuffled/ordered id sequence
    pos: 0
  };

  // ---- DOM refs ----
  var el = {
    strip: document.getElementById("subjectStrip"),
    search: document.getElementById("search"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    installBtn: document.getElementById("installBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    card: document.getElementById("flashcard"),
    cardInner: document.getElementById("cardInner"),
    cardIdFront: document.getElementById("cardIdFront"),
    cardIdBack: document.getElementById("cardIdBack"),
    cardSubjectFront: document.getElementById("cardSubjectFront"),
    cardDifficulty: document.getElementById("cardDifficulty"),
    cardQuestion: document.getElementById("cardQuestion"),
    cardAnswer: document.getElementById("cardAnswer"),
    deckPosition: document.getElementById("deckPosition"),
    progressFill: document.getElementById("progressFill"),
    masteredCount: document.getElementById("masteredCount"),
    totalCount: document.getElementById("totalCount"),
    emptyState: document.getElementById("emptyState"),
    emptyQuery: document.getElementById("emptyQuery"),
    cardWrap: document.querySelector(".card-wrap")
  };

  // =====================================================================
  // Persistence
  // =====================================================================
  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* storage unavailable — fail silently */ }
  }

  // =====================================================================
  // Filtering
  // =====================================================================
  function currentList() {
    var q = state.query.trim().toLowerCase();
    return state.order
      .map(function (id) { return deck.find(function (c) { return c.id === id; }); })
      .filter(Boolean)
      .filter(function (c) {
        if (state.subject !== "All" && c.subject !== state.subject) return false;
        if (!q) return true;
        return (
          c.question.toLowerCase().indexOf(q) !== -1 ||
          c.answer.toLowerCase().indexOf(q) !== -1 ||
          c.topic.toLowerCase().indexOf(q) !== -1
        );
      });
  }

  // =====================================================================
  // Rendering
  // =====================================================================
  function buildSubjectStrip() {
    el.strip.innerHTML = "";
    SUBJECTS.forEach(function (subj) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subject-chip";
      btn.dataset.subject = subj;
      btn.setAttribute("aria-pressed", subj === state.subject ? "true" : "false");
      var count = subj === "All" ? deck.length : deck.filter(function (c) { return c.subject === subj; }).length;
      btn.innerHTML = '<span class="dot"></span>' + subj + ' <span style="opacity:.6">(' + count + ')</span>';
      btn.addEventListener("click", function () {
        state.subject = subj;
        state.pos = 0;
        el.card.classList.remove("is-flipped");
        buildSubjectStrip();
        render();
      });
      el.strip.appendChild(btn);
    });
  }

  function render() {
    var list = currentList();
    var total = deck.length;
    var masteredTotal = Object.keys(progress).filter(function (id) { return progress[id] === "known"; }).length;

    el.masteredCount.textContent = masteredTotal;
    el.totalCount.textContent = total;
    el.progressFill.style.width = total ? Math.round((masteredTotal / total) * 100) + "%" : "0%";

    if (!list.length) {
      el.emptyState.hidden = false;
      el.emptyQuery.textContent = state.query || "(no results)";
      el.cardWrap.style.display = "none";
      el.deckPosition.textContent = "0 of 0";
      return;
    }

    el.emptyState.hidden = true;
    el.cardWrap.style.display = "";

    if (state.pos >= list.length) state.pos = 0;
    if (state.pos < 0) state.pos = list.length - 1;

    var card = list[state.pos];
    el.deckPosition.textContent = "Card " + (state.pos + 1) + " of " + list.length;

    el.card.dataset.subject = card.subject;
    var idStr = "#" + String(card.id).padStart(4, "0");
    el.cardIdFront.textContent = idStr;
    el.cardIdBack.textContent = idStr;
    el.cardSubjectFront.textContent = card.subject + " \u00B7 " + card.topic;
    el.cardDifficulty.textContent = card.difficulty;
    el.cardQuestion.textContent = card.question;
    el.cardAnswer.textContent = card.answer;

    var markState = progress[card.id];
    el.card.classList.toggle("is-known", markState === "known");

    el.prevBtn.disabled = list.length <= 1;
    el.nextBtn.disabled = list.length <= 1;
  }

  // =====================================================================
  // Interactions
  // =====================================================================
  function flip() {
    el.card.classList.toggle("is-flipped");
    el.card.setAttribute("aria-pressed", el.card.classList.contains("is-flipped") ? "true" : "false");
  }

  function go(delta) {
    var list = currentList();
    if (!list.length) return;
    state.pos = (state.pos + delta + list.length) % list.length;
    el.card.classList.remove("is-flipped");
    render();
  }

  function mark(kind) {
    var list = currentList();
    if (!list.length) return;
    var card = list[state.pos];
    progress[card.id] = kind;
    saveProgress();
    render();
  }

  function shuffle() {
    for (var i = state.order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = state.order[i];
      state.order[i] = state.order[j];
      state.order[j] = tmp;
    }
    state.pos = 0;
    el.card.classList.remove("is-flipped");
    render();
  }

  // ---- wire up events ----
  el.card.addEventListener("click", flip);
  el.card.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
  });

  document.querySelectorAll(".know-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      mark(btn.dataset.mark);
    });
  });

  el.prevBtn.addEventListener("click", function () { go(-1); });
  el.nextBtn.addEventListener("click", function () { go(1); });
  el.shuffleBtn.addEventListener("click", shuffle);

  el.search.addEventListener("input", function () {
    state.query = el.search.value;
    state.pos = 0;
    el.card.classList.remove("is-flipped");
    render();
  });

  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT") {
      if (e.key === "Escape") document.activeElement.blur();
      return;
    }
    switch (e.key) {
      case "/":
        e.preventDefault();
        el.search.focus();
        break;
      case "ArrowRight":
        go(1);
        break;
      case "ArrowLeft":
        go(-1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        flip();
        break;
      case "1":
        mark("unknown");
        break;
      case "2":
        mark("known");
        break;
      case "s":
      case "S":
        shuffle();
        break;
    }
  });

  // =====================================================================
  // PWA install prompt
  // =====================================================================
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    el.installBtn.hidden = false;
  });
  el.installBtn.addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.finally && deferredPrompt.finally(function () { deferredPrompt = null; });
    el.installBtn.hidden = true;
  });

  // =====================================================================
  // Service worker registration (offline support)
  // =====================================================================
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-workers.js").catch(function () {
        /* offline support degrades gracefully if registration fails */
      });
    });
  }

  // =====================================================================
  // Diagnostics — surface failures on-page instead of a silent stuck state
  // =====================================================================
  function showFatal(message) {
    el.cardQuestion.textContent = message;
    el.cardAnswer.textContent = "";
    el.cardWrap.querySelectorAll(".nav-arrow").forEach(function (b) { b.disabled = true; });
    var footBtns = document.querySelectorAll(".know-btn");
    footBtns.forEach(function (b) { b.disabled = true; });
  }

  window.addEventListener("error", function (e) {
    showFatal("Something went wrong loading the deck: " + (e.message || "unknown error") + ". Check the browser console for details.");
  });

  // =====================================================================
  // Boot
  // =====================================================================
  function boot() {
    if (!deck.length) {
      showFatal("No flashcards loaded — make sure flashcards.js is in the same folder as index.html and is included before app.js.");
      return;
    }
    shuffleArrayInPlace(state.order);
    buildSubjectStrip();
    render();
  }

  function shuffleArrayInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  try {
    boot();
  } catch (err) {
    showFatal("Startup error: " + err.message + ". Check the browser console for details.");
    if (window.console && console.error) console.error(err);
  }
})();
