<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';
require_once '../auth/auth_check.php';
require_once '../upload/upload_helper.php';

checkAdminAuth(); // 관리자 인증 확인

// 폼 데이터 (multipart/form-data)
$category = isset($_POST['category']) ? $_POST['category'] : '';
$title = isset($_POST['title']) ? $_POST['title'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';

if (!$category || !$title || !$content) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "카테고리, 제목, 내용을 모두 입력해주세요."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. 게시글 데이터 삽입
    $stmt = $pdo->prepare("INSERT INTO posts (category, title, content) VALUES (?, ?, ?)");
    $stmt->execute([$category, $title, $content]);
    $postId = $pdo->lastInsertId();

    // 2. 다중 파일 업로드 처리
    if (isset($_FILES['files']) && count($_FILES['files']['name']) > 0) {
        $files = $_FILES['files'];
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === 0) {
                $fileArray = [
                    "name" => $files['name'][$i],
                    "tmp_name" => $files['tmp_name'][$i]
                ];
                
                $filePath = handleFileUpload($fileArray);
                if ($filePath) {
                    $mediaStmt = $pdo->prepare("INSERT INTO media (post_id, file_path, original_name, display_order) VALUES (?, ?, ?, ?)");
                    $mediaStmt->execute([$postId, $filePath, $files['name'][$i], $i]);
                }
            }
        }
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "게시글이 성공적으로 등록되었습니다.",
        "post_id" => $postId
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "등록 중 오류 발생: " . $e->getMessage()]);
}
?>