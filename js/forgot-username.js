document.getElementById('forgotUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email);

    if (user) {
        location.href = `show-username.html?user=${encodeURIComponent(user.username)}&email=${encodeURIComponent(user.email)}`;
    } else {
        alert('このメールアドレスは登録されていません。');
    }
});