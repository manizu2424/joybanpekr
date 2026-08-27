<?php
// 에러 메시지가 JSON 응답을 망치지 않도록 설정
error_reporting(0);
ini_set('display_errors', 0);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json; charset=UTF-8");

$isLoggedIn = isset($_SESSION['admin_id']);

echo json_encode([
    "status" => "success",
    "isLoggedIn" => $isLoggedIn
]);
?>