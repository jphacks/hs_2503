<?php
// ヘッダーとデバッグ設定
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . "/php/db_connect.php"; // 適切なパスに修正

// トークンをGETまたはPOSTで取得
$token = $_REQUEST["token"] ?? '';

if (!$token) {
    echo json_encode(['success' => false, 'message' => 'トークンが指定されていません。']);
    exit;
}

try {
    // 1. トークン一致 & 未認証ユーザを取得
    $sql = "SELECT id FROM users WHERE verification_token = :token AND is_verified = 0";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':token', $token, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. ユーザが見つからない場合
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'この認証リンクは無効、または既に認証済みです。']);
        exit;
    }

    // 3. 認証完了処理
    $update = $pdo->prepare("
        UPDATE users
        SET is_verified = 1, verification_token = NULL
        WHERE id = :id
    ");
    $update->bindValue(':id', $user["id"], PDO::PARAM_INT);
    $update->execute();

    // 4. 成功応答
    echo json_encode(['success' => true, 'message' => 'メール認証が完了しました。']);

} catch (Exception $e) {
    error_log("Verification API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'サーバーエラーが発生しました。']);
}
?>