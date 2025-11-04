const params = new URLSearchParams(location.search);
const username = params.get('user');
const email = params.get('email');
document.getElementById('output').innerHTML = `
    <p>メールアドレス: ${email}</p>
    <p>ユーザー名: <strong>${username}</strong></p>
`;