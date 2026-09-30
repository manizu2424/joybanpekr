<?php
// 로컬 설정이 누락되거나 손상돼도 경로·비밀번호를 응답에 노출하지 않습니다.
try {
    if (!is_file(__DIR__ . '/db.php')) throw new RuntimeException('Missing api/config/db.php');
    require_once __DIR__ . '/db.php';
    if (!isset($pdo) || !($pdo instanceof PDO)) throw new RuntimeException('Invalid PDO configuration');
} catch (Throwable $e) {
    error_log('Joyban connection: ' . $e->getMessage());
    http_response_code(503);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['status'=>'error','message'=>'자료 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.']);
    exit;
}
