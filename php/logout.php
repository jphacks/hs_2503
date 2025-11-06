<?php
// /php/logout.php
session_start();

// セッション変数を全て解除
$_SESSION = array();

// セッションを切断するにはセッションクッキーも解除する。
// Note: session_destroy() ではなく、こちらを使用。
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// セッションを破壊
session_destroy();

// ログアウト完了のJSONを返す
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true, 'message' => 'ログアウトしました']);
?>