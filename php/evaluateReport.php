<?php
// 🚨 IMPORTANT: デバッグ時のみ有効にする
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 💡 NEW: JSONレスポンスとCORSのためのヘッダー設定
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// OPTIONSプリフライト対策
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- DB設定 ---
$host = "hoge";
$dbname = "hoge";
$user = "hoge";
$pass = "hoge";

// 💡 NEW: データベース接続処理の追加
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    // エラー発生時に例外を投げる設定
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
} catch (PDOException $e) {
    // 接続失敗時にここで終了し、JSONエラーを返す
    echo json_encode(["success" => false, "error" => "DB接続失敗: " . $e->getMessage()]);
    exit;
}

// --- JSON受信とUUID、評価タイプの取得 ---
$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

$report_id = $input["id"] ?? null;
$browser_uuid = $input["browser_uuid"] ?? null;
$evaluation_type = $input["evaluation_type"] ?? null; // 'good' or 'bad'

if (!$report_id || !$browser_uuid || !in_array($evaluation_type, ['good', 'bad'])) {
    echo json_encode(["success" => false, "error" => "データが不完全または不正です"]);
    exit;
}

// 💡 既存の try ブロックはそのまま使用
try {
    // 1. report_likes テーブルに記録 (重複は無視)
    // ... (以下略) ...
    $sql_insert = "INSERT IGNORE INTO report_likes (report_id, browser_uuid, evaluation_type)VALUES (:report_id, :browser_uuid, :evaluation_type)";
    $stmt_insert = $pdo->prepare($sql_insert);
    $stmt_insert->execute([
        ":report_id" => $report_id, 
        ":browser_uuid" => $browser_uuid,
        ":evaluation_type" => $evaluation_type
    ]);

    $is_new_evaluation = $stmt_insert->rowCount() > 0;

    if ($is_new_evaluation) {
        // 2. 新しい評価の場合のみ reports テーブルの対応するカウンタを +1
        $counter_col = ($evaluation_type === 'good') ? 'likes_count' : 'dislikes_count';
        
        $sql_update = "UPDATE reports SET $counter_col = $counter_col + 1 WHERE id = :id";
        $stmt_update = $pdo->prepare($sql_update);
        $stmt_update->execute([":id" => $report_id]);
    }

    // 3. 更新後の両方のカウンタを取得して返す
    $sql_fetch = "SELECT likes_count, dislikes_count FROM reports WHERE id = :id";
    $stmt_fetch = $pdo->prepare($sql_fetch);
    $stmt_fetch->execute([":id" => $report_id]);
    $counts = $stmt_fetch->fetch(PDO::FETCH_ASSOC);

    // 💡 カウントを強制的に整数型に変換して返す
    $new_likes = (int)($counts['likes_count'] ?? 0);
    $new_dislikes = (int)($counts['dislikes_count'] ?? 0);

    echo json_encode([
        "success" => true, 
        "new_likes_count" => $new_likes, 
        "new_dislikes_count" => $new_dislikes,
        "status" => $is_new_evaluation ? "newly_evaluated" : "evaluated"
    ]);

} catch (PDOException $e) {
    // SQL実行時のエラーを返す
    echo json_encode(["success" => false, "error" => "SQL実行エラー: " . $e->getMessage()]);
    exit;
}
?>