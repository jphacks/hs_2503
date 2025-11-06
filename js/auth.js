document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("ユーザー名とパスワードを入力してください。");
    return;
  }

  if (foundUser) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", foundUser.username);
    window.location.href = "../dashboard.html";
  } else {
    alert("ユーザー名またはパスワードが間違っています。");
  }
});
