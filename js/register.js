<<<<<<< HEAD
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
=======
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // ページリロード防止
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

<<<<<<< HEAD
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
=======
  const formData = new FormData();
  formData.append("username", username);
  formData.append("email", email);
  formData.append("password", password);

  try {
    const response = await fetch("../php/register.php", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert("アカウント登録が完了しました！");
      window.location.href = "login.html"; // 登録後ログイン画面へ
    } else {
      alert(result.message);
    }
  } catch (error) {
    alert("サーバーとの通信に失敗しました。");
  }
>>>>>>> 1f75d9a3bfe9c173a2986486e4c02cfee86c043c
});
