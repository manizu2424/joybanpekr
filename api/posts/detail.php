<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Post ID is required"]);
    exit;
}

try {
    // 게시글 상세 정보와 조회수 증가
    $pdo->prepare("UPDATE posts SET views = views + 1 WHERE id = ?")->execute([$id]);

    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    $post = $stmt->fetch();

    if ($post) {
        // 미디어(이미지 등) 정보 가져오기
        $mediaStmt = $pdo->prepare("SELECT * FROM media WHERE post_id = ? ORDER BY display_order ASC");
        $mediaStmt->execute([$id]);
        $post['media'] = $mediaStmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => $post
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Post not found"]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>