// 💡 logout.js または 認証が必要なページのJSファイル

// 💡 【修正点】：auth.jsから機能を取得
import { logout, getAuthStatus } from './auth.js'; 

async function handleLogoutPage() {
    const authInfo = await getAuthStatus(); 

    // 💡 【修正点】：未ログインならログインページに戻す (localStorageではなくサーバー確認)
    if (!authInfo) {
      window.location.href = "html/login.html";
      return;
    }

    // ログアウトボタン押下時
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            // 💡 【修正点】：auth.jsのlogout関数を呼び出し
            logout(); 
            // ログアウト後のリロードは auth.js で行う
        });
    }
}

handleLogoutPage();