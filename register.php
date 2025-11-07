<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/php/db_connect.php'; 
require_once __DIR__ . '/vendor/autoload.php'; 

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// POSTデータ取得
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

// 入力チェック
if (!$username || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'すべての項目を入力してください。']);
    exit;
}

// メール形式チェック
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'メールアドレスの形式が正しくありません。']);
    exit;
}

// パスワード長チェック
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'パスワードは6文字以上で入力してください。']);
    exit;
}

try {
    // 既存メール確認
    $check = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = :email");
    $check->bindValue(':email', $email, PDO::PARAM_STR);
    $check->execute();

    if ($check->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'このメールアドレスは既に登録されています。']);
        exit;
    }

    // パスワードハッシュ化
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // 認証トークン生成
    $token = bin2hex(random_bytes(32));

    // 仮登録（is_verified = 0）
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password, is_verified, verification_token)
        VALUES (:username, :email, :password, 0, :token)
    ");
    $stmt->bindValue(':username', $username);
    $stmt->bindValue(':email', $email);
    $stmt->bindValue(':password', $hashedPassword);
    $stmt->bindValue(':token', $token);
    $stmt->execute();

    // 認証URL
    $verify_url = "https://hinavi.sakura.ne.jp/html/verify.html?token=" . $token;

    // PHPMailerでメール送信
    $mail = new PHPMailer(true);
    try {
        $mail->SMTPDebug = 0; // 本番は0に設定
        $mail->Debugoutput = 'error_log';

        $mail->isSMTP();
        $mail->Host       = 'hinavi.sakura.ne.jp';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'noreply@hinavi.sakura.ne.jp';
        $mail->Password   = 'aqoe12mdsaqwel'; // SMTP用パスワード
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->Timeout    = 10;
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'base64';

        $mail->setFrom('noreply@hinavi.sakura.ne.jp', 'hinavi');
        $mail->addAddress($email, $username);

        $mail->isHTML(false);
        $mail->Subject = '【hinavi】メール認証のお願い';
        $mail->Body    = "{$username} 様\n\nhinavi へのご登録ありがとうございます。\n\n以下のURLをクリックするとメール認証が完了します：\n{$verify_url}\n\nもし身に覚えがない場合は、このメールを破棄してください。\n\nhinavi 運営";

        $mail->send();

        echo json_encode(['success' => true, 'message' => '認証メールを送信しました。メールをご確認ください。']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => "メール送信に失敗しました: {$mail->ErrorInfo}"]);
    }

} catch (Exception $e) {
    error_log("【REGISTER ERROR】" . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'サーバーエラーが発生しました。']);
    exit;
}
