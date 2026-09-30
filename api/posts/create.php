<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/connect.php';
require_once __DIR__ . '/../auth/auth_check.php';
require_once __DIR__ . '/../upload/upload_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 가능합니다.']); exit;
}

checkAdminAuth(); // 관리자 인증 확인

// 폼 데이터 (multipart/form-data)
$category = isset($_POST['category']) ? $_POST['category'] : '';
$title = isset($_POST['title']) ? $_POST['title'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';

if (!is_string($category) || !in_array($category, ['aiworld','works','vision','skillup'], true) || !is_string($title) || !is_string($content) || !trim($title) || !trim($content) || strlen($title) > 765) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "카테고리, 제목, 내용을 모두 입력해주세요."]);
    exit;
}

$newUploads = [];
$pendingDeletes = [];
try {
    $pdo->beginTransaction();

    // 1. 게시글 데이터 삽입
    $stmt = $pdo->prepare("INSERT INTO posts (category, title, content) VALUES (?, ?, ?)");
    $stmt->execute([$category, $title, $content]);
    $postId = $pdo->lastInsertId();

    // 2. 다중 파일 업로드 처리
    if (isset($_FILES['files']) && count($_FILES['files']['name']) > 0) {
        $files = $_FILES['files'];
        if (count($files['name']) > 10) throw new RuntimeException('첨부파일은 한 번에 최대 10개까지 가능합니다.');
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
            if ($files['error'][$i] !== UPLOAD_ERR_OK) throw new RuntimeException('첨부파일 업로드에 실패했습니다. 파일 크기를 확인해주세요.');
            if ($files['error'][$i] === 0) {
                $fileArray = [
                    "name" => $files['name'][$i],
                    "tmp_name" => $files['tmp_name'][$i]
                ];

                $filePath = handleFileUpload($fileArray);
                $newUploads[] = $filePath;
                if ($filePath) {
                    $mediaStmt = $pdo->prepare("INSERT INTO media (post_id, file_path, original_name, display_order) VALUES (?, ?, ?, ?)");
                    $mediaStmt->execute([$postId, $filePath, $files['name'][$i], $i]);
                }
            }
        }
    }

    $pdo->commit();
    foreach ($pendingDeletes as $path) removeUploadedFile($path);

    echo json_encode([
        "status" => "success",
        "message" => "게시글이 성공적으로 등록되었습니다.",
        "post_id" => $postId
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    foreach ($newUploads as $path) removeUploadedFile($path);
    error_log('Joyban posts: ' . $e->getMessage());
    http_response_code($e instanceof RuntimeException && !($e instanceof PDOException) ? 400 : 500);
    echo json_encode(["status" => "error", "message" => $e instanceof RuntimeException && !($e instanceof PDOException) ? $e->getMessage() : "저장하지 못했습니다. 다시 시도해주세요."]);
}
?>
