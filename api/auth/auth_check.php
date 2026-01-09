<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * 관리자 로그인 여부를 확인합니다.
 * 로그인되지 않은 경우 JSON 응답을 보내고 프로세스를 종료합니다.
 */
function checkAdminAuth() {
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(403);
        echo json_encode([
            "status" => "error", 
            "message" => "접근 권한이 없습니다. 로그인이 필요합니다."
        ]);
        exit;
    }
}
?>