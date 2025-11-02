// 未ログインならログインページに戻す
if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "html/login.html";
}

// ログアウトボタン押下時
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "../index.html";
});
