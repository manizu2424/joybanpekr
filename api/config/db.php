<?php
/**
 * Database Configuration
 */
$host = 'localhost'; // uws8-wpm-085
$db   = 'webddang';       // 기본database
$user = 'webddang';        // database id
$pass = 'domyung24!';      // database pw
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // 실제 운영 시에는 에러 메시지를 노출하지 않도록 주의해야 합니다.
     // throw new \PDOException($e->getMessage(), (int)$e->getCode());
     die("Database Connection Failed: " . $e->getMessage());
}
?>