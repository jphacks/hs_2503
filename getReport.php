<?php
header("Content-Type: application/json; charset=UTF-8");

// DB接続設定
$host = "mysql3111.db.sakura.ne.jp";
$dbname = "hinavi_report";
$user = "hinavi_report";
$pass = "hinavireport1";

try {
    // 💡 データベース接続時の文字コードは 'utf8mb4' を推奨します
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    // 💡 PDO::ATTR_EMULATE_PREPARES を false にすると、数値型がそのまま返されることが多くなりますが、ここでは手動キャストを優先します
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

// データ取得
$sql = "SELECT id, lat, lng, status, comment, likes_count, created_at FROM reports ORDER BY created_at DESC";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 💡 NEW: likes_count を確実に数値型に変換する処理
$processed_rows = array_map(function($row) {
    // データベースから取得した likes_count を整数型に強制キャスト
    // これにより、JSONに "likes_count": 1 のように数値として出力されます
    $row['likes_count'] = (int) $row['likes_count'];
    return $row;
}, $rows);

// 💡 修正: 処理済みの配列をエンコード
echo json_encode(["success" => true, "reports" => $processed_rows]);
?>