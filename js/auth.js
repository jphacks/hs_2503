document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("ユーザー名とパスワードを入力してください。");
    return;
  }

  try {
    const response = await fetch("https://hinavi.sakura.ne.jp/php/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      alert("ログイン成功！");
      window.location.href = "../html/dashboard.html";
    } else {
      alert(data.message || "ログインに失敗しました。");
    }
  } catch (error) {
    console.error("通信エラー:", error);
    alert("サーバーとの通信に失敗しました。");
  }
});
