<?php
header("Content-Type: application/json; charset=UTF-8");

// DB接続設定
$host = "mysql3111.db.sakura.ne.jp";
$dbname = "hinavi_report";
$user = "hinavi_report";
$pass = "hinavireport1";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

// データ取得
$sql = "SELECT id, lat, lng, status, comment, created_at FROM reports ORDER BY created_at DESC";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["success" => true, "reports" => $rows]);
?>
