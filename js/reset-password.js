const params = new URLSearchParams(location.search);
const username = params.get('user');

document.getElementById('resetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const index = users.findIndex(u => u.username === username);

    if (index >= 0) {
        users[index].password = newPass;
        localStorage.setItem('users', JSON.stringify(users));
        alert('パスワードを変更しました！');
        location.href = '../html/login.html';
    } else {
        alert('ユーザーが見つかりません。');
    }
});