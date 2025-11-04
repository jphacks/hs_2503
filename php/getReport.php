<?php
// /php/getReport.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); 

// DB接続設定 (本番環境に合わせて修正してください)
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

// 💡 【修正点】：reports と report_users を LEFT JOIN して user_name を取得
// users テーブルとの結合は不要になりました。
$sql = "
    SELECT 
        r.id, r.lat, r.lng, r.status, r.comment, 
        r.likes_count, r.dislikes_count, r.created_at, 
        ru.user_name  /* report_users.user_name を取得 */
    FROM 
        reports r
    LEFT JOIN 
        report_users ru ON r.id = ru.report_id
    ORDER BY 
        r.created_at DESC
";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// データを処理
$processed_rows = array_map(function($row) {
    $row['likes_count'] = (int) ($row['likes_count'] ?? 0);
    $row['dislikes_count'] = (int) ($row['dislikes_count'] ?? 0);
    // 💡 user_name が NULL (LEFT JOINで紐づけなし、つまり匿名投稿) の場合は「匿名ユーザー」とする
    $row['user_name'] = $row['user_name'] ?? "匿名ユーザー"; 
    return $row;
}, $rows);

echo json_encode(["success" => true, "reports" => $processed_rows]);
?>