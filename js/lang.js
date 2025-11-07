// js/lang.js

// 翻訳データ
// ===== 翻訳データ =====
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
    "footer": "© hinavi 2025",
    "home": "ホームに戻る",
    "login": "ログイン",
    "logout": "ログアウト",
    "Information provided by": "情報提供：",
    "Japan Meteorological Agency": "気象庁",
    "Disaster Information Portal": "防災情報ポータル",

    // 追加キー
    "distance": "直線距離",
    "elevation": "標高",
    "hazard": "対象となる災害種別",
    "no_results": "指定範囲内に避難所は見つかりませんでした。",
    "fetch_error": "避難所データの取得中にエラーが発生しました。"
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
    "footer": "© hinavi 2025",
    "home": "返回首页",
    "login": "登录",
    "logout": "登出",
    "Information provided by": "信息提供：",
    "Japan Meteorological Agency": "日本气象厅",
    "Disaster Information Portal": "防灾信息门户",

    // 追加キー
    "distance": "直线距离",
    "elevation": "海拔",
    "hazard": "适用灾害类型",
    "no_results": "指定范围内未找到避难所。",
    "fetch_error": "获取避难所数据时发生错误。"
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
    "footer": "© hinavi 2025",
    "home": "Back to Home",
    "login": "Login",
    "logout": "Logout",
    "Information provided by": "Source:",
    "Japan Meteorological Agency": "JMA",
    "Disaster Information Portal": "Disaster Information Portal",

    // 追加キー
    "distance": "Distance",
    "elevation": "Elevation",
    "hazard": "Applicable hazards",
    "no_results": "No shelters found within the specified range.",
    "fetch_error": "An error occurred while fetching shelter data."
  }
};

// ===== 言語の保存/取得 =====
function getSavedLang() {
  return localStorage.getItem("selectedLang") || "ja";
}
function saveLang(lang) {
  localStorage.setItem("selectedLang", lang);
}

// ===== 翻訳ヘルパー =====
function t(key, lang) {
  const dict = translations[lang] || translations.ja || {};
  // 言語 → en → ja → キー の順でフォールバック
  return dict[key]
    ?? (translations.en && translations.en[key])
    ?? (translations.ja && translations.ja[key])
    ?? key;
}

// 子要素がある要素でも“テキストノードだけ”置換するユーティリティ
function setOwnText(el, text) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.placeholder = text;
    return;
  }
  const textNode = Array.from(el.childNodes)
    .find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim() !== "");
  if (textNode) {
    textNode.nodeValue = text;
  } else if (el.childNodes.length === 0) {
    el.textContent = text;
  } else {
    el.prepend(document.createTextNode(text));
  }
}

// ===== 翻訳を適用 =====
function applyTranslations(lang) {
  document.documentElement.lang = lang;

  // data-i18n（通常テキスト）
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n").trim();
    const text = t(key, lang);
    setOwnText(el, text);
  });

  // data-i18n-placeholder（入力プレースホルダ）
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder").trim();
    const text = t(key, lang);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.placeholder = text;
    }
  });

  // 個別ボタン（必要に応じて）
  const homebtn = document.getElementById("back-to-home-btn");
  if (homebtn) setOwnText(homebtn, t("home", lang));
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) setOwnText(loginBtn, t("login", lang));
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) setOwnText(logoutBtn, t("logout", lang));
}

// ===== 現在の言語を一元取得 =====
function getCurrentLang() {
  return getSavedLang() || window.currentLang || "ja";
}

// ===== 公開API：言語変更 =====
function changeLanguage(lang) {
  saveLang(lang);
  applyTranslations(lang);
  window.currentLang = lang; // init.js と同期させる
  // 必要に応じて再描画を呼ぶ:
  // if (window.loadDisasterInfo) window.loadDisasterInfo();
  // if (window.loadGoogleMaps) window.loadGoogleMaps(lang);
}

// 初期適用
document.addEventListener("DOMContentLoaded", () => {
  const lang = getSavedLang();
  applyTranslations(lang);

  // もし言語セレクタがあれば初期値を反映＆変更を保存
  const sel = document.getElementById("language-select");
  if (sel) {
    sel.value = lang;
    sel.addEventListener("change", e => changeLanguage(e.target.value));
  }
});

// グローバルに公開（他ファイルから呼べるように）
window.translations = translations;
window.t = t;
window.changeLanguage = changeLanguage;
window.applyTranslations = applyTranslations;
window.getCurrentLang = getCurrentLang;


// // 言語変更処理
// function changeLanguage(lang) {
//   document.documentElement.lang = lang;
//   const t = translations[lang] || translations["ja"];

//   // 通常テキスト
//   document.querySelectorAll("[data-i18n]").forEach(el => {
//     const key = el.getAttribute("data-i18n");
//     if (t[key]) el.textContent = t[key];
//   });

//   // プレースホルダー
//   document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
//     const key = el.getAttribute("data-i18n-placeholder");
//     if (t[key]) el.placeholder = t[key];
//   });

//   // ボタン
//   const recenterBtn = document.getElementById("recenter-btn");
//   if (recenterBtn && t["recenter"]) recenterBtn.textContent = t["recenter"];

//   // フッター左側のみ更新
//   const footerLeft = document.getElementById("footer-left");
//   if (footerLeft && t["footer"]) footerLeft.textContent = t["footer"];
// }
