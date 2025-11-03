document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // ページリロード防止

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

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
});
