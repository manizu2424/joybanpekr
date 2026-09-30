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

// _POST, _FILES 사용 (multipart/form-data)
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$category = isset($_POST['category']) ? $_POST['category'] : '';
$title = isset($_POST['title']) ? $_POST['title'] : '';
$content = isset($_POST['content']) ? $_POST['content'] : '';

if ($id < 1 || !is_string($category) || !in_array($category, ['aiworld','works','vision','skillup'], true) || !is_string($title) || !is_string($content) || !trim($title) || !trim($content) || strlen($title) > 765) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "필수 정보(ID, 카테고리, 제목, 내용)가 누락되었습니다."]);
    exit;
}

$newUploads = [];
$pendingDeletes = [];
try {
    $pdo->beginTransaction();

    $exists = $pdo->prepare('SELECT id FROM posts WHERE id = ? FOR UPDATE');
    $exists->execute([$id]);
    if (!$exists->fetchColumn()) {
        $pdo->rollBack(); http_response_code(404);
        echo json_encode(['status'=>'error','message'=>'게시글이 존재하지 않습니다.']); exit;
    }
    // 1. 게시글 정보 업데이트
    $stmt = $pdo->prepare("UPDATE posts SET category = ?, title = ?, content = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$category, $title, $content, $id]);

    // 2. 기존 파일 삭제 처리 (delete_files[] 배열)
    if (isset($_POST['delete_files']) && is_array($_POST['delete_files'])) {
        foreach ($_POST['delete_files'] as $mediaId) {
            $mediaId = (int)$mediaId;
            if ($mediaId > 0) {
                // 파일 경로 조회
                $pathStmt = $pdo->prepare("SELECT file_path FROM media WHERE id = ? AND post_id = ?");
                $pathStmt->execute([$mediaId, $id]);
                $row = $pathStmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    $pendingDeletes[] = $row['file_path'];
                    // DB에서 미디어 레코드 삭제
                    $delStmt = $pdo->prepare("DELETE FROM media WHERE id = ? AND post_id = ?");
                    $delStmt->execute([$mediaId, $id]);
                }
            }
        }
    }

    // 3. 새 파일 업로드 처리
    if (isset($_FILES['files']) && count($_FILES['files']['name']) > 0) {
        $files = $_FILES['files'];
        if (count($files['name']) > 10) throw new RuntimeException('첨부파일은 한 번에 최대 10개까지 가능합니다.');
        // 기존 미디어의 최대 순서 가져오기
        $orderStmt = $pdo->prepare("SELECT MAX(display_order) FROM media WHERE post_id = ?");
        $orderStmt->execute([$id]);
        $maxOrder = $orderStmt->fetchColumn();
        $startOrder = ($maxOrder !== null && $maxOrder !== false) ? (int)$maxOrder + 1 : 0;

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
                    $mediaStmt->execute([$id, $filePath, $files['name'][$i], $startOrder + $i]);
                }
            }
        }
    }

    $pdo->commit();
    foreach ($pendingDeletes as $path) removeUploadedFile($path);

    echo json_encode([
        "status" => "success",
        "message" => "게시글이 성공적으로 수정되었습니다.",
        "post_id" => $id
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    foreach ($newUploads as $path) removeUploadedFile($path);
    error_log('Joyban posts: ' . $e->getMessage());
    http_response_code($e instanceof RuntimeException && !($e instanceof PDOException) ? 400 : 500);
    echo json_encode(["status" => "error", "message" => $e instanceof RuntimeException && !($e instanceof PDOException) ? $e->getMessage() : "저장하지 못했습니다. 다시 시도해주세요."]);
}
?>
