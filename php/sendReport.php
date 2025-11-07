<?php
// /php/sendReport.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- DB設定 --- (本番環境に合わせて修正してください)
$host = "mhogejp"; 
$dbname = "hhoget";
$user = "hhoget";
$pass = "hhoge1";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "DB接続失敗: " . $e->getMessage()]);
    exit;
}

// --- JSON受信 ---
$raw = file_get_contents("php://input");
$input = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    echo json_encode(["success" => false, "error" => "JSONデータが不正です"]);
    exit;
}

// --- パラメータ取得 ---
$lat = $input["lat"] ?? null;
$lng = $input["lng"] ?? null;
$status = $input["status"] ?? "";
$comment = $input["comment"] ?? "";
// 💡 【変更点】：クライアントから送られた user_id を取得
$user_id = $input["user_id"] ?? null; 

if (!$lat || !$lng) {
    echo json_encode(["success" => false, "error" => "座標が不足しています"]);
    exit;
}

$pdo->beginTransaction();

try {
    // 1. reports テーブルに報告を挿入
    $sql_report = "INSERT INTO reports (lat, lng, status, comment, created_at)
            VALUES (:lat, :lng, :status, :comment, NOW())";
    $stmt_report = $pdo->prepare($sql_report);
    $stmt_report->execute([
        ":lat" => $lat,
        ":lng" => $lng,
        ":status" => $status,
        ":comment" => $comment
    ]);

    $last_report_id = $pdo->lastInsertId();

    // 2. 💡 【変更点】：user_id が有効な場合、usersテーブルから username を取得し、report_users に挿入
    if ($user_id !== null && is_numeric($user_id)) {
        
        // user_id から username を取得（report_usersテーブルの仕様に合わせる）
        $sql_get_username = "SELECT username FROM users WHERE id = :user_id";
        $stmt_get_username = $pdo->prepare($sql_get_username);
        $stmt_get_username->execute([":user_id" => $user_id]);
        $user = $stmt_get_username->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $username = $user['username'];
            
            // report_users に report_id と user_name を挿入
            $sql_user = "INSERT INTO report_users (report_id, user_name, created_at) VALUES (:report_id, :user_name, NOW())";
            $stmt_user = $pdo->prepare($sql_user);
            $stmt_user->execute([
                ":report_id" => $last_report_id,
                ":user_name" => $username // 💡 user_name カラムに保存
            ]);
        }
    }

    // コミット
    $pdo->commit();

    echo json_encode(["success" => true, "report_id" => $last_report_id]);

} catch (PDOException $e) {
    // エラー時はロールバック
    $pdo->rollBack();
    error_log("Report Insertion Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => "SQL実行エラー: " . $e->getMessage()]);
    exit;
}
?>