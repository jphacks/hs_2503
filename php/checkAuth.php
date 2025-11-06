<?php
// /php/checkAuth.php
session_start();
header('Content-Type: application/json; charset=utf-8');

// 💡 セッションに user_id が存在するか確認
if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    echo json_encode([
        'is_logged_in' => true,
        'user_id' => $_SESSION['user_id'], // 報告紐づけに使用
        'username' => $_SESSION['username'] // 表示に使用
    ]);
} else {
    echo json_encode([
        'is_logged_in' => false,
        'user_id' => null,
        'username' => null
    ]);
}
?>