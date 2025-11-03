<?php
// ========================================
// 📦 データベース接続設定（さくらサーバ用）
// ========================================

// データベース情報を設定（★あなたの環境に合わせて変更）
// DB接続設定
$db_host = "mysql3111.db.sakura.ne.jp";
$db_name = "hinavi_report";
$db_user = "hinavi_report";
$db_pass = "hinavireport1";

// DSN文字列（PDO用）
$dsn = "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4";

try {
    // PDOで接続
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,       // エラーを例外で投げる
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,  // 連想配列で取得
        PDO::ATTR_EMULATE_PREPARES => false,               // 実際のプリペアドステートメントを使用
    ]);

} catch (PDOException $e) {
    // 接続失敗時のエラー出力（開発中のみ）
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'データベース接続に失敗しました: ' . $e->getMessage()
    ]);
    exit;
}
?>
