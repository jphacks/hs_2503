<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // 外部からも呼べるように
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// OPTIONSプリフライト対策
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- DB設定 ---
$host = "mysql3111.db.sakura.ne.jp"; // ← さくらのDBサーバー名
$dbname = "hinavi_report";
$user = "hinavi_report";
$pass = "hinavireport1";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "DB接続失敗: " . $e->getMessage()]);
    exit;
}

// --- JSON受信デバッグ ---
$raw = file_get_contents("php://input");

// 空ならフォールバックとして $_POST も見る
if (empty($raw)) {
    $raw = json_encode($_POST);
}

$input = json_decode($raw, true);

// JSONエラーチェック
if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    echo json_encode([
        "success" => false,
        "error" => "JSONデータが不正です",
        "raw" => $raw, // デバッグ用に受け取った内容を返す
    ]);
    exit;
}

// --- パラメータ取得 ---
$lat = $input["lat"] ?? null;
$lng = $input["lng"] ?? null;
$status = $input["status"] ?? "";
$comment = $input["comment"] ?? "";

if (!$lat || !$lng) {
    echo json_encode(["success" => false, "error" => "座標が不足しています"]);
    exit;
}

// --- SQL実行 ---
$sql = "INSERT INTO reports (lat, lng, status, comment, created_at)
        VALUES (:lat, :lng, :status, :comment, NOW())";
$stmt = $pdo->prepare($sql);
$result = $stmt->execute([
    ":lat" => $lat,
    ":lng" => $lng,
    ":status" => $status,
    ":comment" => $comment
]);

echo json_encode(["success" => $result, "input" => $input]);
