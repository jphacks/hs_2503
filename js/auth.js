// js/auth.js
// ログイン・ログアウト・状態取得をモジュールとして管理

// ログインフォーム用初期化
export function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("ユーザー名とパスワードを入力してください。");
      return;
    }

    try {
      const response = await fetch("/php/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "same-origin",
        body: new URLSearchParams({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("loggedInUser", data.username || username);
        alert("ログイン成功！");
        window.location.href = "/index.html";
      } else {
        alert(data.message || "ログインに失敗しました。");
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("サーバーとの通信に失敗しました。");
    }
  });
}

// ログアウト処理
export function logout() {
  fetch("/php/logout.php", {
    method: "POST",
    credentials: "same-origin",
  }).finally(() => {
    localStorage.removeItem("loggedInUser");
    window.location.reload();
  });
}

// 現在ログイン中のユーザーを取得
export function getLoggedInUser() {
  return localStorage.getItem("loggedInUser");
}
