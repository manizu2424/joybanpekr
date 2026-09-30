<?php
require_once __DIR__ . '/auth_check.php';
header('Content-Type: application/json; charset=UTF-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 가능합니다.']); exit;
}
checkAdminAuth();
$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', ['expires' => time() - 42000, 'path' => $params['path'],
    'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Lax']);
session_destroy();
echo json_encode(['status' => 'success', 'message' => '로그아웃 되었습니다.']);
