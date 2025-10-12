// js/lang.js

// 翻訳データ
const translations = {
  ja: {
    "loading": "読み込み中...",
    "question": "この地点は？",
    "pass": "✅ 通れる",
    "blocked": "🚫 通れない",
    "comment": "補足コメント...",
    "footer": "© hinavi 2025 all rights reserved.",
    "recenter": "現在地に戻る",
  },
  // en: {
  //   "loading": "Loading...",
  //   "question": "What's the condition here?",
  //   "pass": "✅ Passable",
  //   "blocked": "🚫 Not passable",
  //   "comment": "Additional comments...",
  //   "footer": "© hinavi 2025 all rights reserved.",
  //   "recenter": "Recenter Map"
  // },
  zh: {
    "loading": "加载中...",
    "question": "这个地点情况如何？",
    "pass": "✅ 可通行",
    "blocked": "🚫 不可通行",
    "comment": "补充说明...",
    "footer": "© hinavi 2025 版权所有。",
    "recenter": "返回当前位置"
  },
  // es: {
  //   "loading": "Cargando...",
  //   "question": "¿Cuál es la condición aquí?",
  //   "pass": "✅ Transitable",
  //   "blocked": "🚫 No transitable",
  //   "comment": "Comentarios adicionales...",
  //   "footer": "© hinavi 2025 todos los derechos reservados.",
  //   "recenter": "Volver a ubicación actual"
  // }
};


// 言語変更処理
function changeLanguage(lang) {
  document.documentElement.lang = lang;
  const t = translations[lang];

  // 通常テキスト
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t[key];
  });

  // プレースホルダー
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t[key];
  });

  // ボタンの文言
  const recenterBtn = document.getElementById("recenter-btn");
  if (recenterBtn) recenterBtn.textContent = t["recenter"];
}
