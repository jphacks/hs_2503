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
  }
});
