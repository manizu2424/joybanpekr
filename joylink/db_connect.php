<?php
$host = 'localhost'; // 데이터베이스 호스트
$dbname = 'webddang'; // 데이터베이스 이름 (수정 필요)
$username = 'webddang'; // 데이터베이스 사용자명 (수정 필요)
$password = 'domyung24!'; // 데이터베이스 비밀번호 (수정 필요)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("DB Connection failed: " . $e->getMessage());
}
?>
