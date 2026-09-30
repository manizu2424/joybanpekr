<?php
// 이 파일을 db.php로 복사하고 Cafe24 DB 연결 정보를 입력하세요.
// 환경 변수를 사용할 수도 있습니다. db.php는 Git에서 제외됩니다.
$host = getenv('JOYBAN_DB_HOST') ?: 'localhost';
$db = getenv('JOYBAN_DB_NAME') ?: 'webmanizu';
$user = getenv('JOYBAN_DB_USER') ?: 'YOUR_DB_USER';
$pass = getenv('JOYBAN_DB_PASSWORD') ?: 'YOUR_DB_PASSWORD';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    error_log('Joyban DB: ' . $e->getMessage());
    http_response_code(503);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['status' => 'error', 'message' => '데이터베이스에 연결할 수 없습니다.']);
    exit;
}
