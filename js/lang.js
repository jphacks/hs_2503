// js/lang.js

// 翻訳データ
const translations = {
  ja: {
    "loading": "読み込み中...",
    "question": "この地点は？",
    "pass": "✅ 通れる",
    "blocked": "🚫 通れない",
    "step": "⚠️ 段差",
    "comment_label": "💬 コメント",
    "comment": "コメントを入力",
    "send": "送信",
    "footer": "© hinavi 2025 all rights reserved.",
    "recenter": "現在地に戻る",
    "Information provided by": "情報提供：",
    "Japan Meteorological Agency": "気象庁",
    "Disaster Information Portal": "防災情報ポータル"
  },
  zh: {
    "loading": "加载中...",
    "question": "这个地点情况如何？",
    "pass": "✅ 可通行",
    "blocked": "🚫 不可通行",
    "step": "⚠️ 台阶 / 路障",
    "comment_label": "💬 评论",
    "comment": "输入评论",
    "send": "发送",
    "footer": "© hinavi 2025 版权所有。",
    "recenter": "返回当前位置",
    "Information provided by": "信息提供：",
    "Japan Meteorological Agency": "日本气象厅",
    "Disaster Information Portal": "防灾信息门户"
  },
  en: {
    "loading": "Loading...",
    "question": "What is the situation at this location?",
    "pass": "✅ Passable",
    "blocked": "🚫 Blocked",
    "step": "⚠️ Step",
    "comment_label": "💬 Comment",
    "comment": "Enter your comment",
    "send": "Send",
    "footer": "© hinavi 2025 All rights reserved.",
    "recenter": "Recenter",
    "Information provided by": "Information provided by:",
    "Japan Meteorological Agency": "Japan Meteorological Agency",
    "Disaster Information Portal": "Disaster Information Portal"
  }
};

// 言語変更処理
function changeLanguage(lang) {
  document.documentElement.lang = lang;
  const t = translations[lang] || translations["ja"];

  // 通常テキスト
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  // プレースホルダー
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });

  // ボタン
  const recenterBtn = document.getElementById("recenter-btn");
  if (recenterBtn && t["recenter"]) recenterBtn.textContent = t["recenter"];

  // フッター左側のみ更新
  const footerLeft = document.getElementById("footer-left");
  if (footerLeft && t["footer"]) footerLeft.textContent = t["footer"];
}
