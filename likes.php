<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$host = "mysql3111.db.sakura.ne.jp";
$dbname = "hinavi_report";
$user = "hinavi_report";
$pass = "hinavireport1";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
$id = $data["id"] ?? null;

if (!$id) {
    echo json_encode(["success" => false, "error" => "IDが指定されていません"]);
    exit;
}

$stmt = $pdo->prepare("UPDATE reports SET likes = likes + 1 WHERE id = :id");
$result = $stmt->execute([":id" => $id]);

if ($result) {
    // 新しい「いいね」数を返す
    $count = $pdo->query("SELECT likes FROM reports WHERE id = $id")->fetchColumn();
    echo json_encode(["success" => true, "likes" => $count]);
} else {
    echo json_encode(["success" => false]);
}
?>
