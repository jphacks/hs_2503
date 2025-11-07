<?php
session_start();
require_once 'db_connect.php';
header('Content-Type: application/json; charset=utf-8');

// POSTデータ取得
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'ユーザー名とパスワードを入力してください。']);
    exit;
}

try {
    // ユーザー取得
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->bindValue(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'ユーザー名またはパスワードが間違っています。']);
        exit;
    }

    // パスワード一致チェック
    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'ユーザー名またはパスワードが間違っています。']);
        exit;
    }

    // ✅ メール認証チェック
    if ((int)$user['is_verified'] !== 1) {
        echo json_encode([
            'success' => false,
            'message' => 'メール認証が完了していません。メール内のリンクをクリックして認証を完了してください。',
            'not_verified' => true
        ]);
        exit;
    }

    // ✅ 認証済み → ログイン成功
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];

    echo json_encode([
        'success' => true,
        'message' => 'ログイン成功',
        'username' => $user['username']
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'サーバーエラーが発生しました。'
    ]);
}
