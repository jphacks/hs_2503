document.getElementById('forgotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.email === email);

    if (user) {
        // メール送信を省略して直接遷移
        location.href = `reset-password.html?user=${encodeURIComponent(username)}`;
    } else {
        alert('該当するユーザーが見つかりません。');
    }
});