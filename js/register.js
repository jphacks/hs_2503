document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !email || !password) {
    alert("すべての項目を入力してください。");
    return;
  }

  if (password.length < 6) {
    alert("パスワードは6文字以上にしてください。");
    return;
  }

  // 既存ユーザー確認
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const exists = users.find((u) => u.email === email);

  if (exists) {
    alert("このメールアドレスはすでに登録されています。");
    return;
  }

  // 新規登録
  users.push({ username, email, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("アカウントを作成しました！ログインページに移動します。");
  window.location.href = "login.html";
});
