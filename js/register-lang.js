// ===== アカウント登録ページ用翻訳データ =====
const registerTranslations = {
  ja: {
    register_title: "アカウント登録",
    register_heading: "アカウント登録",
    username: "ユーザー名",
    email: "メールアドレス",
    password: "パスワード（6文字以上）",
    register_btn: "登録",
    have_account: "すでにアカウントをお持ちの方は ",
    login_link: "ログイン"
  },
  zh: {
    register_title: "注册账户",
    register_heading: "注册账户",
    username: "用户名",
    email: "电子邮箱",
    password: "密码（6位以上）",
    register_btn: "注册",
    have_account: "已经有账号？",
    login_link: "登录"
  },
  en: {
    register_title: "Register Account",
    register_heading: "Register Account",
    username: "Username",
    email: "Email Address",
    password: "Password (6+ characters)",
    register_btn: "Register",
    have_account: "Already have an account? ",
    login_link: "Login"
  }
};

// ===== 保存されている言語を取得（なければ日本語） =====
const regLang = localStorage.getItem("selectedLang") || "ja";

// ===== テキストノードだけ置き換える関数 =====
function setOwnText(el, text) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.placeholder = text;
    return;
  }
  const textNode = Array.from(el.childNodes)
    .find(n => n.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.nodeValue = text;
  } else if (el.childNodes.length === 0) {
    el.textContent = text;
  } else {
    el.prepend(document.createTextNode(text));
  }
}

// ===== 翻訳を適用 =====
function applyRegisterTranslations(lang) {
  const t = key =>
    (registerTranslations[lang] && registerTranslations[lang][key]) ||
    (registerTranslations.ja && registerTranslations.ja[key]) ||
    key;

  document.documentElement.lang = lang;

  // data-i18n属性を持つ要素を翻訳
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n").trim();
    const val = t(key);
    if (key === "have_account") {
      setOwnText(el, val); // 子の<a>を残す
    } else if (el.tagName.toLowerCase() === "a") {
      el.textContent = val;
    } else {
      setOwnText(el, val);
    }
  });

  // プレースホルダを翻訳
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder").trim();
    const val = t(key);
    el.placeholder = val;
  });
}

// ===== DOMロード後に適用 =====
document.addEventListener("DOMContentLoaded", () => {
  applyRegisterTranslations(regLang);
});
