<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';
require_once '../auth/auth_check.php';
require_once '../upload/upload_helper.php';

checkAdminAuth();

// _POST, _FILES 사용 (multipart/form-data)
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$category = isset($_POST['category']) ? $_POST['category'] : '';
$title = isset($_POST['title']) ? $_POST['title'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';

if (!$id || !$category || !$title || !$content) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "필수 정보(ID, 카테고리, 제목, 내용)가 누락되었습니다."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. 게시글 정보 업데이트
    $stmt = $pdo->prepare("UPDATE posts SET category = ?, title = ?, content = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$category, $title, $content, $id]);

    // 2. 새 파일 업로드 처리
    if (isset($_FILES['files']) && count($_FILES['files']['name']) > 0) {
        $files = $_FILES['files'];
        // 기존 미디어의 최대 순서 가져오기
        $orderStmt = $pdo->prepare("SELECT MAX(display_order) FROM media WHERE post_id = ?");
        $orderStmt->execute([$id]);
        $maxOrder = $orderStmt->fetchColumn();
        $startOrder = ($maxOrder !== false) ? $maxOrder + 1 : 0;

        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === 0) {
                $fileArray = [
                    "name" => $files['name'][$i],
                    "tmp_name" => $files['tmp_name'][$i]
                ];
                
                $filePath = handleFileUpload($fileArray);
                if ($filePath) {
                    $mediaStmt = $pdo->prepare("INSERT INTO media (post_id, file_path, original_name, display_order) VALUES (?, ?, ?, ?)");
                    $mediaStmt->execute([$id, $filePath, $files['name'][$i], $startOrder + $i]);
                }
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success", 
        "message" => "게시글이 성공적으로 수정되었습니다.",
        "post_id" => $id
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "수정 중 오류 발생: " . $e->getMessage()]);
}
?>