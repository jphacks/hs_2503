/**
 * register.js
 * フォームの送信を処理し、サーバー（register.php）へデータを送信する
 */

// DOMからフォーム要素を取得
const registerForm = document.getElementById("registerForm");

// エラー回避のためのnullチェック
if (registerForm) {
    // フォームに 'submit' イベントリスナーを設定
    registerForm.addEventListener("submit", async (e) => {
        // ページリロードを防止
        e.preventDefault(); 

        // フォーム入力値を取得し、不要な空白を除去
        const username = document.getElementById("username") ? document.getElementById("username").value.trim() : '';
        const email = document.getElementById("email") ? document.getElementById("email").value.trim() : '';
        const password = document.getElementById("password") ? document.getElementById("password").value : '';

        // FormDataオブジェクトを作成し、データを追加
        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);

        try {
            // サーバーサイドのPHPスクリプトへ非同期でPOSTリクエストを送信
            const response = await fetch("../register.php", {
                method: "POST",
                body: formData
            });

            // レスポンスをJSONとして解析
            const result = await response.json();

            if (result.success) {
                // 登録成功時の処理
                alert("アカウント登録が完了しました！");
                // 登録後、ログイン画面へ遷移
                window.location.href = "login.html"; 
            } else {
                // 登録失敗時（バリデーションエラーなど）の処理
                alert(result.message);
            }
        } catch (error) {
            // ネットワークエラーなど、通信失敗時の処理
            console.error("Fetch Error:", error);
            alert("サーバーとの通信に失敗しました。時間をおいて再度お試しください。");
        }
    });
} else {
    // フォーム要素が見つからなかった場合のコンソール警告
    // このメッセージが出た場合、register.htmlのIDが間違っているか、スクリプトの実行順序が原因です
    console.error("致命的なエラー: ID 'registerForm' を持つ要素が見つかりませんでした。");
}