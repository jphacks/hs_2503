// 翻訳辞書（※ no_account は末尾にスペースを入れてリンクとの間を空ける）
const loginTranslations = {
  ja: {
    login_title: "ログインページ",
    login_heading: "ログイン",
    username: "ユーザー名",
    password: "パスワード",
    login_btn: "ログイン",
    no_account: "アカウントをお持ちでない方は ", // ← 末尾スペース
    register_link: "こちらから登録",
  },
  zh: {
    login_title: "登录页面",
    login_heading: "登录",
    username: "用户名",
    password: "密码",
    login_btn: "登录",
    no_account: "还没有账号？", // 中国語は句読点で自然に区切れるのでOK
    register_link: "点击这里注册",
  },
  en: {
    login_title: "Login Page",
    login_heading: "Login",
    username: "Username",
    password: "Password",
    login_btn: "Login",
    no_account: "Don't have an account? ", // ← 末尾スペース
    register_link: "Register here",
  },
};

// 既存の selectedLang を流用（無ければ ja）
const loginLang = localStorage.getItem("selectedLang") || "ja";

// テキストノードだけを置換（子の <a> は温存）
function setOwnText(el, text) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.placeholder = text;
    return;
  }
  const textNode = Array.from(el.childNodes)
    .find((n) => n.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.nodeValue = text;
  } else if (el.childNodes.length === 0) {
    el.textContent = text;
  } else {
    el.prepend(document.createTextNode(text));
  }
}

function applyLoginTranslations(lang) {
  const t = (k) =>
    (loginTranslations[lang] && loginTranslations[lang][k]) ||
    (loginTranslations.ja && loginTranslations.ja[k]) ||
    k;

  document.documentElement.lang = lang;

  // data-i18n（通常テキスト）
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n").trim();
    const val = t(key);
    // no_account は <p> の先頭テキストだけ変える（<a> を残す）
    if (key === "no_account") {
      setOwnText(el, val);
    } else {
      // aタグなどの葉要素も安全に差し替え（textノードのみ）
      if (el.tagName.toLowerCase() === "a") {
        el.textContent = val;
      } else {
        setOwnText(el, val);
      }
    }
  });

  // data-i18n-placeholder（入力系）
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder").trim();
    const val = t(key);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.placeholder = val;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyLoginTranslations(loginLang);
});

