// js/authStatus.js
// ページロード時にログイン状態を反映するモジュール

import { logout, getLoggedInUser } from './auth.js';

export function initAuthStatus() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  // ページロード時の状態反映
  const username = getLoggedInUser();
  if (username) {
    loginBtn.textContent = `ログアウト (${username})`;
    loginBtn.classList.add("logged-in");
  }

  // ボタンクリックでログイン／ログアウト切替
  loginBtn.addEventListener("click", () => {
    if (loginBtn.classList.contains("logged-in")) {
      logout();
    } else {
      window.location.href = "html/login.html"; // ログインページへ
    }
  });
}
