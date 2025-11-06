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
        credentials: "same-origin", // セッションCookieを送受信
        body: new URLSearchParams({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 💡 【修正点】：localStorageへの保存を削除
        // localStorage.setItem("loggedInUser", data.username || username); 
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
  // 💡 【修正点】：サーバー側のlogout.phpを呼び出し、セッションを破棄
  fetch("/php/logout.php", {
    method: "POST",
    credentials: "same-origin",
  }).finally(() => {
    // 💡 【修正点】：localStorageからの削除を削除
    // localStorage.removeItem("loggedInUser"); 
    // window.location.reload(); は authStatus.js で行うため、ここではリロードしないか、
    // またはログイン画面から戻った index.html で呼び出す側でリロードを制御する
    // 今回はシンプルにリロードを削除。
    window.location.reload(); // リロードは維持
  });
}

/**
 * 💡 【新規】：認証状態をサーバーに確認し、ユーザーIDとユーザー名を返す
 * @returns {Promise<object|null>} 認証情報 (userId, username) または null
 */
export async function getAuthStatus() {
  try {
    const response = await fetch("/php/checkAuth.php", {
      method: "GET",
      credentials: "same-origin",
    });

    const data = await response.json();

    if (data.is_logged_in) {
      return { 
        isLoggedIn: true,
        userId: data.user_id, // 報告紐づけに使うID
        username: data.username // 表示に使うユーザー名
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("認証状態の確認に失敗しました:", error);
    return null;
  }
}

// 💡 【修正点】：getLoggedInUser は廃止。今後は getAuthStatus を使用する。
// export function getLoggedInUser() {
//   return localStorage.getItem("loggedInUser");
// }