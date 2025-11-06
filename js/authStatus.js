// js/authStatus.js
// ページロード時にログイン状態を反映するモジュール

// 💡 【修正点】：getLoggedInUser を getAuthStatus に変更
import { logout, getAuthStatus } from './auth.js';

export async function initAuthStatus() { // 💡 【修正点】：async にする
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  // ページロード時の状態反映
  // 💡 【修正点】：非同期で認証状態を取得
  const authInfo = await getAuthStatus(); 

  if (authInfo && authInfo.isLoggedIn) {
    // ログイン済みの場合
    loginBtn.textContent = `ログアウト (${authInfo.username})`;
    loginBtn.classList.add("logged-in");
    
    // 💡 【新規】：グローバル変数として認証情報を保存 (report.js で利用するため)
    window.AUTH_INFO = authInfo;
  } else {
    // 未ログインの場合
    window.AUTH_INFO = null;
  }

  // ボタンクリックでログイン／ログアウト切替
  loginBtn.addEventListener("click", () => {
    if (loginBtn.classList.contains("logged-in")) {
      logout(); // ログアウト処理（サーバーとセッションCookieを無効化）
    } else {
      window.location.href = "html/login.html"; // ログインページへ
    }
  });
}