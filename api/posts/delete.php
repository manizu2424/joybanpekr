<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';
require_once '../auth/auth_check.php';

checkAdminAuth();

$input = json_decode(file_get_contents("php://input"), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "삭제할 게시글 ID가 필요합니다."]);
    exit;
}

try {
    // 1. 이미지 파일 삭제를 위해 미디어 정보 조회
    $stmt = $pdo->prepare("SELECT file_path FROM media WHERE post_id = ?");
    $stmt->execute([$id]);
    $mediaFiles = $stmt->fetchAll();

    foreach ($mediaFiles as $file) {
        $fullPath = "../../" . $file['file_path'];
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }

    // 2. DB 데이터 삭제 (ON DELETE CASCADE로 인해 media 테이블 데이터도 자동 삭제됨)
    $deleteStmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $deleteResult = $deleteStmt->execute([$id]);

    if ($deleteStmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "게시글과 관련 파일이 모두 삭제되었습니다."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "삭제할 게시글을 찾을 수 없습니다."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "데이터베이스 오류: " . $e->getMessage()]);
}
?>