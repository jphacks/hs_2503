<?php
require_once 'db_connect.php';
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'ユーザー名とパスワードを入力してください。']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
    $stmt->bindValue(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        echo json_encode(['success' => true, 'message' => 'ログイン成功']);
    } else {
        echo json_encode(['success' => false, 'message' => 'ユーザー名またはパスワードが間違っています。']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'サーバーエラーが発生しました。']);
}
?>
