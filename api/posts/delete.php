<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../auth/auth_check.php';
require_once __DIR__ . '/../upload/upload_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 가능합니다.']); exit;
}

checkAdminAuth();

$input = json_decode(file_get_contents("php://input"), true);
$id = isset($input['id']) ? (int)$input['id'] : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "삭제할 게시글 ID가 필요합니다."]);
    exit;
}

try {
    $pdo->beginTransaction();
    $lock = $pdo->prepare('SELECT id FROM posts WHERE id = ? FOR UPDATE');
    $lock->execute([$id]);
    // 1. 이미지 파일 삭제를 위해 미디어 정보 조회
    $stmt = $pdo->prepare("SELECT file_path FROM media WHERE post_id = ?");
    $stmt->execute([$id]);
    $mediaFiles = $stmt->fetchAll();

    // 2. DB 데이터 삭제 (ON DELETE CASCADE로 인해 media 테이블 데이터도 자동 삭제됨)
    $deleteStmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $deleteResult = $deleteStmt->execute([$id]);

    $removed = $deleteStmt->rowCount() > 0;
    $pdo->commit();
    if ($removed) {
        foreach ($mediaFiles as $file) removeUploadedFile($file['file_path']);
        echo json_encode(["status" => "success", "message" => "게시글과 관련 파일이 모두 삭제되었습니다."]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "삭제할 게시글을 찾을 수 없습니다."]);
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Joyban posts: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "삭제하지 못했습니다. 다시 시도해주세요."]);
}
?>
