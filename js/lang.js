// js/lang.js

// js/lang.js

// ===== 翻訳データ =====
const translations = {
  ja: {
    "index-title": "hinavi 災害情報マップ",
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
    "distance": "直線距離",
    "elevation": "標高",
    "hazard": "対象となる災害種別",
    "no_results": "指定範囲内に避難所は見つかりませんでした。",
    "fetch_error": "避難所データの取得中にエラーが発生しました。",
    "login_title": "ログインページ",
    "login_heading": "ログイン",
    "username": "ユーザー名",
    "password": "パスワード",
    "login_btn": "ログイン",
    "no_account": "アカウントをお持ちでない方は ",
    "register_link": "こちらから登録",
    "register_title": "アカウント登録",
    "register_heading": "アカウント登録",
    "email": "メールアドレス",
    "password（6文字以上）": "パスワード（6文字以上）",
    "have_account": "すでにアカウントをお持ちの方は ",
    "login_link": "ログイン",
    "mypage": "マイページ",
    "hinavi-icon": "hinaviとは",
    "hinavi-title": "hinaviとは？",
    "hinavi-subtitle": "もう迷わせない\nあなたの避難を．",
    "hinavi-description": "hinavi（ヒナビ）は「避難をナビする」ための防災コミュニティサービスです。あなたの現在地と災害状況に基づき、安全な避難ルートとリアルタイム情報を迅速に提供します。",
    "faq-title": "よくある質問",
    "faq-1-question": "Q. ログインは必須ですか？",
    "faq-2-question": "Q. 誤情報が投稿されたら？",
    "faq-3-question": "Q. 個人情報は安全ですか？",
    "faq-1": "A. いいえ．緊急時に初めて使用する方もいるので，誰でもすぐに使用できます。ログインすることで、コメントの信頼性が高まります。",
    "faq-2": "A. 信頼度システムと運営の確認で対処できます。多くのユーザーの報告や自治体の公式情報に基づき、情報の信頼性を制御しています。",
    "faq-3": "A. 位置情報などは暗号化して扱い、避難誘導など必要最小限の機能にのみ利用します。",
    "mission-title": "ミッション",
    "mission-1": "✅ 迷わせない避難を実現する分かりやすい情報提供",
    "mission-2": "🤝 地域の助け合いを促すコミュニティ形成",
    "mission-3": "🌏 多言語対応による誰一人取り残さない避難支援",
    "collaboration-title": "自治体・団体向け連携",
    "collaboration-description": "自治体や企業向けには、以下のカスタムソリューションを提供しています。防災データの一括登録、公式通知システム、API連携など、貴団体の防災計画に合わせた導入が可能です。詳細はお問い合わせください。",
    "hinavi-features": "主な機能",
    "hinavi-features-description": "hinaviが提供する、命を守るための主要な機能をご紹介します。",
    "hinavi-feature-1-title": "1. マップとルート案内",
    "hinavi-feature-1-description": "現在地から、危険箇所を避けた避難所までの最短・最安全ルートを自動でナビゲーション。初めての場所でも迷いません。",
    "hinavi-feature-2-title": "2. リアルタイム投稿",
    "hinavi-feature-2-description": "ユーザーや自治体からの「道が通れる/通れない」「段差」などの情報を地図上に即時反映。信頼性の高い情報で、状況を把握できます。",
    "hinavi-feature-3-title": "3. 言語切替",
    "hinavi-feature-3-description": "日本語、中国語など多言語に対応。国籍や言語に関わらず、すべての人が等しく安全に避難できるようサポートします。",
    "verifying": "認証処理中です。しばらくお待ちください...",
    "user": "ユーザ名: ",
    "trophies": "トロフィー: ",
    "mypages": "マイページ",
    "back": "戻る",
    "shelter_text": "近くの避難所はこちら",
    "help-title": "「もう迷わせない、\nあなたの避難を」",
    "help-description": "hinaviは、災害時に皆さんを「安心・安全」に避難所までナビするアプリです。避難に必要な情報をわかりやすく提供します。",
    "disasters-and-evacuation-centers-title": "最新の災害・避難所情報を\nすぐに確認",
    "disasters-and-evacuation-centers-description": "現在地周辺の災害状況を気象庁のAPIを用いて取得しています。また、避難所の詳細情報や避難所と現在地の高低差など避難に必要な情報をすぐに確認できます。",
    "evacuation-route-title": "近くの避難所までの\n最短ルートを案内",
    "evacuation-route-description": "GPSを活用し、現在地から避難所までのルートを表示・案内します。ワンタップで最短の避難所までのルートを示します！",
    "comment-title": "ローカル情報を共有し\n避難に活用",
    "comment-description": "地図上で実際は「通れる道」、工事などで「通れない道」「段差」などの情報を投稿・確認できます。これらの情報をもとに避難所までの最適なルートを選択できます。",
    "multilingual-support-title": "多言語対応で誰でも安心",
    "multilingual-support-description": "皆さんを避難所までナビするために、多言語（日・英・中）に対応しています。",
    "pre-btn": "戻る",
    "next-btn": "次へ",
    "help-html-title": "チュートリアル",
    "register_btn": "登録",
  },
  zh: {
    "index-title": "hinavi 灾害信息地图",
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
    "distance": "直线距离",
    "elevation": "海拔",
    "hazard": "适用灾害类型",
    "no_results": "指定范围内未找到避难所。",
    "fetch_error": "获取避难所数据时发生错误。",
    "login_title": "登录页面",
    "login_heading": "登录",
    "username": "用户名",
    "password": "密码",
    "login_btn": "登录",
    "no_account": "还没有账号？ ",
    "register_link": "在这里注册",
    "register_title": "注册账户",
    "register_heading": "注册账户",
    "email": "电子邮箱",
    "password（6位以上）": "密码（6位以上）",
    "have_account": "已经有账号？",
    "login_link": "登录",
    "mypage": "我的页面",
    "hinavi-icon": "关于 hinavi",
    "hinavi-title": "什么是 hinavi？",
    "hinavi-subtitle": "不再迷路\n引导您的避难．",
    "hinavi-description": "hinavi 是一款防灾社区服务，旨在“引导避难”。它根据您的当前位置和灾害状况，快速提供安全的避难路线和实时信息。",
    "faq-title": "常见问题",
    "faq-1-question": "问：必须登录吗？",
    "faq-2-question": "问：如果发布了错误信息怎么办？",
    "faq-3-question": "问：个人信息安全吗？",
    "faq-1": "答：不需要。考虑到有些人在紧急情况下首次使用该服务，任何人都可以立即使用。登录可以提高评论的可信度。",
    "faq-2": "答：我们通过可信度系统和运营审核来处理。我们根据大量用户报告和地方政府的官方信息来控制信息的可信度。",
    "faq-3": "答：我们对位置信息等进行加密处理，仅用于必要的功能，如避难引导。",
    "mission-title": "使命",
    "mission-1": "✅ 提供清晰的信息，实现不迷路的避难",
    "mission-2": "🤝 促进社区互助",
    "mission-3": "🌏 多语言支持，确保无人被遗忘的避难援助",
    "collaboration-title": "面向地方政府和团体的合作",
    "collaboration-description": "我们为地方政府和企业提供以下定制解决方案。可以根据贵团体的防灾计划，进行防灾数据批量注册、官方通知系统、API集成等。详情请联系我们。",
    "hinavi-features": "主要功能",
    "hinavi-features-description": "介绍 hinavi 提供的保护生命的主要功能。",
    "hinavi-feature-1-title": "1. 地图和路线导航",
    "hinavi-feature-1-description": "自动导航从当前位置到避开危险地点的避难所的最短和最安全路线。即使是第一次去的地方也不会迷路。",
    "hinavi-feature-2-title": "2. 实时发布",
    "hinavi-feature-2-description": "用户和地方政府发布的“道路可通行/不可通行”“台阶”等信息即时反映在地图上。通过高可信度的信息，您可以掌握情况。",
    "hinavi-feature-3-title": "3. 语言切换",
    "hinavi-feature-3-description": "支持日语、中文等多种语言。无论国籍或语言如何，我们都支持所有人平等安全地避难。",
    "verifying": "正在进行认证处理。请稍候...",
    "user": "用户名: ",
    "trophies": "奖杯: ",
    "mypages": "我的页面",
    "back": "返回",
    "shelter_text": "附近的避难所如下",
    "help-title": "“不再迷路，\n引导您的避难”",
    "help-description": "hinavi 是一款在灾害时提供易于理解信息的避难援助应用程序。",
    "disasters-and-evacuation-centers-title": "立即查看最新的灾害和避难所信息",
    "disasters-and-evacuation-centers-description": "当前地点周边的灾害状况和避难所信息可以立即查看。",
    "evacuation-route-title": "前往最近避难所的\n最短路线",
    "evacuation-route-description": "GPS可以帮助您找到从当前位置到避难所的最佳路线。",
    "comment-title": "共享受灾情况\n支持互助",
    "comment-description": "您可以在地图上发布和查看“不可通行的道路”“台阶”等信息。",
    "multilingual-support-title": "多语言支持，人人安心",
    "multilingual-support-description": "目前支持日语、英语和中文。",
    "pre-btn": "返回",
    "next-btn": "下一步",
    "help-html-title": "教程",
    "register_btn": "注册"
  },
  en: {
    "index-title": "hinavi Disaster Information Map",
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
    "distance": "Distance",
    "elevation": "Elevation",
    "hazard": "Applicable hazards",
    "no_results": "No shelters found within the specified range.",
    "fetch_error": "An error occurred while fetching shelter data.",
    "login_title": "Login Page",
    "login_heading": "Login",
    "username": "Username",
    "password": "Password",
    "login_btn": "Login",
    "no_account": "Don't have an account? ",
    "register_link": "Register here",
    "register_title": "Register Account",
    "register_heading": "Register Account",
    "email": "Email Address",
    "password (6 characters or more)": "Password (6 characters or more)",
    "have_account": "Already have an account?",
    "login_link": "Login",
    "mypage": "My Page",
    "hinavi-icon": "About hinavi",
    "hinavi-title": "What is hinavi?",
    "hinavi-subtitle": "Never get lost again\nYour guide to evacuation.",
    "hinavi-description": "hinavi is a disaster prevention community service that 'navigates evacuation.' It quickly provides safe evacuation routes and real-time information based on your current location and disaster situation.",
    "faq-title": "Frequently Asked Questions",
    "faq-1-question": "Q. Is login required?",
    "faq-2-question": "Q. What if false information is posted?",
    "faq-3-question": "Q. Is personal information safe?",
    "faq-1": "A. No. Since some people may be using the service for the first time in an emergency, anyone can use it immediately. Logging in increases the reliability of comments.",
    "faq-2": "A. We handle it through a credibility system and operational checks. We control the reliability of information based on reports from many users and official information from local governments.",
    "faq-3": "A. We handle location information and other data with encryption, and use it only for necessary functions such as evacuation guidance.",
    "mission-title": "Mission",
    "mission-1": "✅ Providing clear information for evacuation without getting lost",
    "mission-2": "🤝 Promoting community mutual aid",
    "mission-3": "🌏 Multilingual support to ensure no one is left behind in evacuation assistance",
    "collaboration-title": "Collaboration for Local Governments and Organizations",
    "collaboration-description": "We offer the following custom solutions for local governments and businesses. We can accommodate bulk registration of disaster prevention data, official notification systems, API integration, and more, tailored to your organization's disaster prevention plans. Please contact us for details.",
    "hinavi-features": "Main Features",
    "hinavi-features-description": "Introducing the main features provided by hinavi to protect lives.",
    "hinavi-feature-1-title": "1. Map and Route Navigation",
    "hinavi-feature-1-description": "Automatically navigate the shortest and safest route from your current location to shelters while avoiding dangerous areas. You won't get lost even in unfamiliar places.",
    "hinavi-feature-2-title": "2. Real-time Posting",
    "hinavi-feature-2-description": "Information such as 'road passable/not passable' and 'steps' posted by users and local governments is reflected on the map in real time. You can grasp the situation with highly reliable information.",
    "hinavi-feature-3-title": "3. Language Switching",
    "hinavi-feature-3-description": "Supports multiple languages such as Japanese and Chinese. We support everyone to evacuate safely regardless of their language.",
    "verifying": "Verifying... Please wait...",
    "user": "Username: ",
    "trophies": "Trophies: ",
    "mypages": "My Page",
    "back": "Back",
    "shelter_text": "Nearby shelters are as follows",
    "help-title": "Never get lost again,\nYour guide to evacuation.",
    "help-description": "hinavi is an evacuation support app that provides easy-to-understand information in times of disaster.",
    "disasters-and-evacuation-centers-title": "Check the latest disaster and shelter information immediately",
    "disasters-and-evacuation-centers-description": "You can immediately check the disaster situation and shelter information around your current location.",
    "evacuation-route-title": "Shortest route to the nearest shelter",
    "evacuation-route-description": "GPS helps you find the best route from your current location to the shelter.",
    "comment-title": "Share disaster situations\nSupport mutual aid",
    "comment-description": "You can post and view information such as 'impassable roads' and 'steps' on the map.",
    "multilingual-support-title": "Multilingual support for everyone's peace of mind",
    "multilingual-support-description": "Currently supports Japanese, English, and Chinese.",
    "pre-btn": "Back",
    "next-btn": "Next",
    "help-html-title": "Tutorial",
     "register_btn": "Register"
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
  // 必要に応じて再描画呼び出しは各側で行う
}

// 初期適用
document.addEventListener("DOMContentLoaded", () => {
  const lang = getSavedLang();
  applyTranslations(lang);

  const sel = document.getElementById("language-select");
  if (sel) {
    sel.value = lang;
    sel.addEventListener("change", e => changeLanguage(e.target.value));
  }
});

// グローバル公開
window.translations = translations;
window.t = t;
window.changeLanguage = changeLanguage;
window.applyTranslations = applyTranslations;
window.getCurrentLang = getCurrentLang;
