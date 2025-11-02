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
    "footer": "© hinavi 2025 all rights reserved.",
    "recenter": "現在地に戻る",
    "login": "ログイン",
    "logout": "ログアウト",
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
    "login": "登录",
    "logout": "登出",
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
    "login": "Login",
    "logout": "Logout",
    "Information provided by": "Information provided by:",
    "Japan Meteorological Agency": "Japan Meteorological Agency",
    "Disaster Information Portal": "Disaster Information Portal"
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
  // 先頭の非空テキストノードを探す
  const textNode = Array.from(el.childNodes)
    .find(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim() !== "");
  if (textNode) {
    textNode.nodeValue = text;
  } else if (el.childNodes.length === 0) {
    // 純テキスト要素ならそのまま
    el.textContent = text;
  } else {
    // テキストノードがない場合は先頭に追加
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
  const recenterBtn = document.getElementById("recenter-btn");
  if (recenterBtn) setOwnText(recenterBtn, t("recenter", lang));
}

// ===== 公開API：言語変更 =====
function changeLanguage(lang) {
  saveLang(lang);
  applyTranslations(lang);
  // 他ファイルが必要ならここで再描画を呼ぶ：
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
window.changeLanguage = changeLanguage;
window.applyTranslations = applyTranslations;
