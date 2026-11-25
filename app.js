(function () {
  var N = 35;
  var history = [];
  var excluded = {};
  var busy = false;
  var current = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(id) { return document.getElementById(id); }
  var numEl = $("num"), statusEl = $("status"), goBtn = $("go");
  var gridEl = $("grid"), countEl = $("count"), histEl = $("history"), histEmpty = $("historyEmpty");
  var noRepeat = $("norepeat"), qBoard = $("boardQuestion");
  var nEl = $("nbEleves"), soundEl = $("sound");
  var activeProfile = "";
  var noteEl = $("note"), noteKey = "", confirmBar = $("confirmBar"), redrawBtn = $("absentRedraw"), exportBtn = $("exportCsv");
  var OPT_KEY = "wayground-board-options";
  try {
    var o = JSON.parse(localStorage.getItem(OPT_KEY) || "null");
    if (o) { noRepeat.checked = o.norepeat !== false; soundEl.checked = o.sound !== false; }
  } catch (e) {}
  function saveOpts() {
    try { localStorage.setItem(OPT_KEY, JSON.stringify({ norepeat: noRepeat.checked, sound: soundEl.checked })); } catch (e) {}
  }
  function setNote(k) { noteKey = k; noteEl.textContent = k ? t(k) : ""; }
  var T = {
    fr: {
      title: "Numéro au tableau",
      classPh: "Ex. 2AC-1",
      install: "Installer l'application",
      confirmYes: "Oui, effacer",
      confirmNo: "Annuler",
      absentRedraw: "Absent : tirer un autre",
      exportDone: "Fichier téléchargé.",
      exportNone: "Aucun passage à exporter.",
      exportFail: "Export impossible sur cet appareil.",
      confirmNew: "Commencer une nouvelle séance et effacer les passages ainsi que les absences ?",
      csvHeader: ["Ordre", "Numero", "Nom de l'élève"],
      csvFile: "participations-",
      classLabel: "Classe / Groupe",
      rosterTitle: "Liste des élèves",
      rosterHint: "Écrivez un nom par ligne, dans l'ordre des numéros. La liste est enregistrée sur cet appareil pour chaque classe.",
      rosterPh: "Nom et prénom du premier élève\nNom et prénom du deuxième élève\nNom et prénom du troisième élève",
      saveRoster: "Enregistrer la liste",
      exportCsv: "Exporter les passages (CSV)",
      newSession: "Nouvelle séance",
      full: "Plein écran",
      exitFull: "Quitter le plein écran",
      saved: "Liste enregistrée.",
      qLabel: "Question posée à la classe",
      qPh: "Écrivez la question ici, elle s'affiche sur le tableau",
      defQ: "Qui passe au tableau ?",
      eyebrow: "Élève n°",
      idle: "Appuyez sur le bouton pour tirer un numéro.",
      go: "Tirer au sort",
      going: "Tirage en cours…",
      nb: "Nombre d'élèves",
      reset: "Remettre à zéro",
      norepeat: "Ne pas répéter un numéro",
      sound: "Son pendant le tirage",
      hint: "Touchez un numéro pour l'exclure (élève absent). Touchez-le encore pour le remettre.",
      historyH: "Déjà passés",
      historyEmpty: "Aucun tirage pour l'instant.",
      options: "Options",
      absents: "Numéros absents",
      absentsPh: "Exemple : 3, 12, 27",
      other: "العربية",
      result: function (n, name) { return name ? "Élève n° " + n + " : " + name : "Élève n° " + n + ", venez au tableau !"; },
      allDone: "Tous les numéros sont passés. Remettez à zéro pour recommencer.",
      left: function (l, t) { return "Restants : " + l + " sur " + t; },
      inplay: function (t) { return t + " numéros en jeu"; },
      classOf: function (n) { return "Classe de " + n + " élèves. Appuyez sur le bouton pour tirer un numéro."; },
      cell: function (i, out, drawn) { return "Numéro " + i + (out ? ", exclu" : "") + (drawn ? ", déjà passé" : ""); }
    },
    ar: {
      title: "رقم التلميذ إلى السبورة",
      classPh: "مثال: 2AC-1",
      install: "تثبيت التطبيق",
      confirmYes: "نعم، امسح",
      confirmNo: "إلغاء",
      absentRedraw: "غائب: سحب رقم آخر",
      exportDone: "تم تنزيل الملف.",
      exportNone: "لا توجد مشاركات للتصدير.",
      exportFail: "التصدير غير متاح على هذا الجهاز.",
      confirmNew: "هل تريد بدء حصة جديدة ومسح سجل المشاركات والغياب؟",
      csvHeader: ["الترتيب", "الرقم", "اسم التلميذ"],
      csvFile: "participations-",
      classLabel: "القسم / المجموعة",
      rosterTitle: "لائحة التلاميذ",
      rosterHint: "اكتب اسم كل تلميذ في سطر، حسب ترتيب الأرقام. تُحفظ اللائحة على هذا الجهاز لكل قسم.",
      rosterPh: "اسم التلميذ الأول\nاسم التلميذ الثاني\nاسم التلميذ الثالث",
      saveRoster: "حفظ اللائحة",
      exportCsv: "تصدير سجل المشاركات (CSV)",
      newSession: "حصة جديدة",
      full: "ملء الشاشة",
      exitFull: "الخروج من ملء الشاشة",
      saved: "تم حفظ اللائحة.",
      qLabel: "السؤال المطروح على القسم",
      qPh: "اكتب السؤال هنا ليظهر على السبورة",
      defQ: "من يأتي إلى السبورة؟",
      eyebrow: "التلميذ رقم",
      idle: "اضغط على الزر لسحب رقم.",
      go: "سحب رقم",
      going: "جارٍ السحب…",
      nb: "عدد التلاميذ",
      reset: "إعادة التعيين",
      norepeat: "عدم تكرار الرقم",
      sound: "صوت أثناء السحب",
      hint: "المس رقمًا لاستبعاده (تلميذ غائب). المسه مرة أخرى لإعادته.",
      historyH: "الذين مرّوا",
      historyEmpty: "لا يوجد سحب بعد.",
      options: "خيارات",
      absents: "أرقام الغائبين",
      absentsPh: "مثال: 3، 12، 27",
      other: "Français",
      result: function (n, name) { return name ? "التلميذ رقم " + n + " : " + name : "التلميذ رقم " + n + "، تفضّل إلى السبورة!"; },
      allDone: "تم سحب جميع الأرقام. اضغط على «إعادة التعيين» للبدء من جديد.",
      left: function (l, t) { return "المتبقي: " + l + " من " + t; },
      inplay: function (t) { return t + " رقمًا في السحب"; },
      classOf: function (n) { return "قسم من " + n + " تلميذًا. اضغط على الزر لسحب رقم."; },
      cell: function (i, out, drawn) { return "الرقم " + i + (out ? "، مستبعد" : "") + (drawn ? "، سبق سحبه" : ""); }
    },
    en: {
      title: "Number at the Board",
      classPh: "e.g. 2AC-1",
      install: "Install the app",
      confirmYes: "Yes, clear",
      confirmNo: "Cancel",
      absentRedraw: "Absent: draw another",
      exportDone: "File downloaded.",
      exportNone: "No turns to export.",
      exportFail: "Export is not available on this device.",
      confirmNew: "Start a new session and clear the turns and absences?",
      csvHeader: ["Order", "Number", "Student name"],
      csvFile: "turns-",
      classLabel: "Class / Group",
      rosterTitle: "Student list",
      rosterHint: "Write one name per line, in the order of the numbers. The list is saved on this device for each class.",
      rosterPh: "First student's full name\nSecond student's full name\nThird student's full name",
      saveRoster: "Save the list",
      exportCsv: "Export turns (CSV)",
      newSession: "New session",
      full: "Full screen",
      exitFull: "Exit full screen",
      saved: "List saved.",
      qLabel: "Question for the class",
      qPh: "Write the question here, it shows on the board",
      defQ: "Who comes to the board?",
      eyebrow: "Student no.",
      idle: "Press the button to draw a number.",
      go: "Draw a number",
      going: "Drawing…",
      nb: "Number of students",
      reset: "Reset",
      norepeat: "Don't repeat a number",
      sound: "Sound while drawing",
      hint: "Tap a number to exclude it (absent student). Tap it again to put it back.",
      historyH: "Already called",
      historyEmpty: "No draw yet.",
      options: "Options",
      absents: "Absent numbers",
      absentsPh: "Example: 3, 12, 27",
      result: function (n, name) { return name ? "Student no. " + n + ": " + name : "Student no. " + n + ", come to the board!"; },
      allDone: "All numbers have been drawn. Reset to start again.",
      left: function (l, t) { return "Remaining: " + l + " of " + t; },
      inplay: function (t) { return t + " numbers in play"; },
      classOf: function (n) { return "Class of " + n + " students. Press the button to draw a number."; },
      cell: function (i, out, drawn) { return "Number " + i + (out ? ", excluded" : "") + (drawn ? ", already called" : ""); }
    }
  };
  var lang = "fr";
  try {
    var bl = (navigator.language || "fr").slice(0, 2);
    if (bl === "ar" || bl === "en") lang = bl;
  } catch (e) {}
  try { var saved = localStorage.getItem("lang"); if (saved === "ar" || saved === "fr" || saved === "en") lang = saved; } catch (e) {}
  function t(k) { return T[lang][k]; }
  var statusFn = function () { return t("idle"); };

  var audioCtx = null;

  function actx() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, type, vol, delay) {
    if (!soundEl.checked) return;
    var c = actx();
    if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  function fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, k) {
      tone(f, 0.5, "triangle", 0.22, k * 0.11);
    });
    tone(1046.5, 0.9, "sine", 0.18, 0.5);
  }

  function rand(max) {
    try {
      var a = new Uint32Array(1);
      var lim = Math.floor(4294967296 / max) * max;
      var x;
      do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim);
      return x % max;
    } catch (e) {
      return Math.floor(Math.random() * max);
    }
  }

  function studentName() { return ""; }
  function profileKey() { return "wayground-board-profile:default"; }
  function persistState() {
    try {
      localStorage.setItem(activeProfile || profileKey(), JSON.stringify({
        N:N, history:history, excluded:excluded,
        current:current
      }));
    } catch (e) { /* stockage local indisponible */ }
  }
  function loadProfile() {
    activeProfile = profileKey();
    try {
      var data = JSON.parse(localStorage.getItem(activeProfile) || "null");
      if (data) {
        N = Math.max(2, Math.min(200, parseInt(data.N, 10) || 35));
        nEl.value = N;
        history = Array.isArray(data.history) ? data.history.filter(function (x) { return x >= 1 && x <= N; }) : [];
        excluded = data.excluded || {};
        current = data.current || null;
        show(current || "?");
        var cur = current;
                statusFn = cur ? function () { return t("result")(cur, studentName(cur)); } : function () { return t("idle"); };
        statusEl.textContent = statusFn();
      } else {
        N = 35; nEl.value = N; history = []; excluded = {}; current = null;
        show("?"); statusFn = function () { return t("idle"); }; statusEl.textContent = statusFn();
      }
    } catch (e) { /* تجاهل بيانات محلية غير صالحة */ }
    updateQ(); render();
  }

  function drawnSet() {
    var s = {};
    if (noRepeat.checked) history.forEach(function (n) { s[n] = true; });
    return s;
  }

  function pool() {
    var d = drawnSet(), p = [];
    for (var i = 1; i <= N; i++) { if (!excluded[i] && !d[i]) p.push(i); }
    return p;
  }

  function render() {
    var d = drawnSet();
    gridEl.innerHTML = "";
    for (var i = 1; i <= N; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cell";
      b.textContent = i;
      b.title = studentName(i) || ("#" + i);
      b.dataset.n = i;
      if (d[i]) b.classList.add("is-drawn");
      if (excluded[i]) b.classList.add("is-out");
      if (current === i && !busy) b.classList.add("is-current");
      b.setAttribute("aria-pressed", excluded[i] ? "true" : "false");
      b.setAttribute("aria-label", t("cell")(i, excluded[i], d[i]));
      gridEl.appendChild(b);
    }
    var total = N - Object.keys(excluded).length;
    var left = pool().length;
    countEl.textContent = noRepeat.checked ? t("left")(left, total) : t("inplay")(total);

    histEl.innerHTML = "";
    history.slice().reverse().forEach(function (n) {
      var li = document.createElement("li");
      li.textContent = n + (studentName(n) ? " – " + studentName(n) : "");
      histEl.appendChild(li);
    });
    histEmpty.hidden = history.length > 0;
    redrawBtn.hidden = !(current && !busy);
    persistState();
  }

  function show(n) { numEl.textContent = n; }

  function finish(n) {
    busy = false;
    goBtn.disabled = false;
    goBtn.textContent = t("go");
    current = n;
    history.push(n);
    numEl.classList.remove("spinning");
    show(n);
    numEl.classList.remove("pop");
    void numEl.offsetWidth;
    numEl.classList.add("pop");
        statusFn = function () { return t("result")(n, studentName(n)); };
    statusEl.textContent = statusFn();
    fanfare();
    render();
  }

  function spin() {
    if (busy) return;
    var p = pool();
    if (!p.length) {
      statusFn = function () { return t("allDone"); };
      statusEl.textContent = statusFn();
      return;
    }
    var final = p[rand(p.length)];
    busy = true;
    goBtn.disabled = true;
    goBtn.textContent = t("going");
    statusFn = function () { return t("going"); };
    statusEl.textContent = statusFn();
    current = null;
    render();
    if (reduce) { finish(final); return; }
    numEl.classList.add("spinning");
    var steps = 34, i = 0;
    (function tick() {
      if (i >= steps) { setTimeout(function () { finish(final); }, 250); return; }
      show(p[rand(p.length)]);
      tone(260 + i * 16, 0.07, "square", 0.06);
      i++;
      setTimeout(tick, 45 + Math.pow(i / steps, 3) * 460);
    })();
  }

  goBtn.addEventListener("click", spin);

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !/^(INPUT|BUTTON|TEXTAREA)$/.test(e.target.tagName)) {
      e.preventDefault();
      spin();
    }
  });

  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest(".cell");
    if (!b || busy) return;
    var n = +b.dataset.n;
    if (excluded[n]) delete excluded[n]; else excluded[n] = true;
    render();
  });

  nEl.addEventListener("change", function () {
    if (busy) { nEl.value = N; return; }
    var v = parseInt(nEl.value, 10);
    if (!(v >= 2)) v = 2;
    if (v > 200) v = 200;
    nEl.value = v;
    N = v;
    history = [];
    excluded = {};
    current = null;
        show("?");
    statusFn = function () { return t("classOf")(N); };
    statusEl.textContent = statusFn();
    render();
  });

  noRepeat.addEventListener("change", function () { saveOpts(); render(); });
  soundEl.addEventListener("change", saveOpts);

  $("reset").addEventListener("click", function () {
    if (busy) return;
    history = [];
    current = null;
        numEl.classList.remove("pop");
    show("?");
    statusFn = function () { return t("idle"); };
    statusEl.textContent = statusFn();
    render();
  });

  function updateQ() { qBoard.textContent = t("defQ"); }


  function doNewSession() {
    history = []; excluded = {}; current = null; show("?");
    statusFn = function () { return t("idle"); }; statusEl.textContent = statusFn(); render();
  }
  $("newSession").addEventListener("click", function () {
    if (busy) return;
    confirmBar.hidden = false;
    $("confirmNo").focus();
  });
  $("confirmYes").addEventListener("click", function () { confirmBar.hidden = true; if (!busy) doNewSession(); });
  $("confirmNo").addEventListener("click", function () { confirmBar.hidden = true; });

  redrawBtn.addEventListener("click", function () {
    if (busy || !current) return;
    excluded[current] = true;
    if (history[history.length - 1] === current) history.pop();
    current = null;
        show("?");
    render();
    spin();
  });

  exportBtn.addEventListener("click", function () {
    if (!history.length) { setNote("exportNone"); return; }
    var rows = [t("csvHeader")];
    history.forEach(function (n, i) { rows.push([i + 1, n, studentName(n)]); });
    var csv = "\uFEFF" + rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");
    try {
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = t("csvFile") + "classe.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      setNote("exportDone");
    } catch (e) { setNote("exportFail"); }
  });

  $("fullscreen").addEventListener("click", function () {
    var board = $("drawBoard");
    if (!document.fullscreenElement) {
      if (board.requestFullscreen) { var pr = board.requestFullscreen(); if (pr && pr.catch) pr.catch(function () {}); }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });
  document.addEventListener("fullscreenchange", function () {
    $("fullscreen").textContent = document.fullscreenElement ? t("exitFull") : t("full");
  });

  function applyLang() {
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t("title");
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-ph]"), function (el) {
      el.placeholder = t(el.getAttribute("data-ph"));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".lg"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
    goBtn.textContent = busy ? t("going") : t("go");
    $("fullscreen").textContent = document.fullscreenElement ? t("exitFull") : t("full");
    statusEl.textContent = statusFn();
    noteEl.textContent = noteKey ? t(noteKey) : "";
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem("lang", l); } catch (e) {}
    applyLang();
    afterLang();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".lg"), function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  function afterLang() { updateQ(); render(); }
  applyLang();
  loadProfile();
})();
