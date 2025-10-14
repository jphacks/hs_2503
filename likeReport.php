<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- DB設定 (sendReport.phpと同じ) ---
$host = "mysql3111.db.sakura.ne.jp";
$dbname = "hinavi_report";
$user = "hinavi_report";
$pass = "hinavireport1";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "DB接続失敗: " . $e->getMessage()]);
    exit;
}

// --- JSON受信 ---
$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

$report_id = $input["id"] ?? null;

if (!$report_id) {
    echo json_encode(["success" => false, "error" => "レポートIDが不足しています"]);
    exit;
}

// --- SQL実行: likes_count を +1 ---
$sql = "UPDATE reports SET likes_count = likes_count + 1 WHERE id = :id";
$stmt = $pdo->prepare($sql);
$result = $stmt->execute([":id" => $report_id]);

// 更新後のいいね数を取得して返す (オプショナルだがUX向上に役立つ)
if ($result) {
    $sql_fetch = "SELECT likes_count FROM reports WHERE id = :id";
    $stmt_fetch = $pdo->prepare($sql_fetch);
    $stmt_fetch->execute([":id" => $report_id]);
    $new_count = $stmt_fetch->fetch(PDO::FETCH_COLUMN);

    echo json_encode(["success" => true, "new_likes_count" => (int)$new_count]);
} else {
    echo json_encode(["success" => false, "error" => "DB更新に失敗しました"]);
}
?>