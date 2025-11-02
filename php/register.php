<?php
require_once 'db_connect.php';
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// POSTデータ取得・トリム
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

// 入力チェック
if (!$username || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'すべての項目を入力してください。']);
    exit;
}

// メール形式チェック
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'メールアドレスの形式が正しくありません。']);
    exit;
}

// パスワードの長さチェック（例: 8文字以上）
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'パスワードは6文字以上で入力してください。']);
    exit;
}

try {
    // 同じメールアドレスが存在するか確認
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
    $checkStmt->bindValue(':email', $email, PDO::PARAM_STR);
    $checkStmt->execute();

    if ($checkStmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'このメールアドレスは既に登録されています。']);
        exit;
    }

    // パスワードを安全にハッシュ化
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // データ挿入
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (:username, :email, :password)");
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':password', $hashedPassword, PDO::PARAM_STR);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'アカウント登録が完了しました。']);
} catch (Exception $e) {
    // ログに詳細を残す（ユーザには安全なメッセージのみ）
    error_log("【REGISTER ERROR】" . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'サーバーエラーが発生しました。']);
    exit;
}
?>
