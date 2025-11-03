<<<<<<< HEAD
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const foundUser = users.find(
    (u) => (u.username === username || u.email === username) && u.password === password
  );

  if (foundUser) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", foundUser.username);
    window.location.href = "../html/dashboard.html";
  } else {
    alert("ユーザー名またはパスワードが間違っています。");
=======
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
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c
  }
});
