<?php
require_once __DIR__ . '/session.php';
function checkAdminAuth(): void {
    if (empty($_SESSION['admin_id'])) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => '관리자 로그인이 필요합니다.']);
        exit;
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($token) || !hash_equals(csrfToken(), $token)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => '인증 정보가 만료되었습니다. 새로고침 후 다시 시도해주세요.']);
            exit;
        }
    }
}
