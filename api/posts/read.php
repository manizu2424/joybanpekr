<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';

// GET 파라미터 확인
$category = isset($_GET['category']) ? $_GET['category'] : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

try {
    if ($category) {
        // 전체 개수 조회
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE category = ?");
        $countStmt->execute([$category]);
        $totalCount = $countStmt->fetchColumn();

        // 특정 카테고리 게시글 조회 (썸네일 포함)
        $sql = "SELECT p.*, 
                       (SELECT file_path FROM media m WHERE m.post_id = p.id ORDER BY display_order ASC LIMIT 1) as thumbnail 
                FROM posts p 
                WHERE p.category = ? 
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$category, $limit, $offset]);
    } else {
        // 전체 개수 조회
        $countStmt = $pdo->query("SELECT COUNT(*) FROM posts");
        $totalCount = $countStmt->fetchColumn();

        // 전체 게시글 조회 (썸네일 포함)
        $sql = "SELECT p.*, 
                       (SELECT file_path FROM media m WHERE m.post_id = p.id ORDER BY display_order ASC LIMIT 1) as thumbnail 
                FROM posts p 
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$limit, $offset]);
    }

    $posts = $stmt->fetchAll();

    // 결과 반환
    echo json_encode([
        "status" => "success",
        "data" => $posts,
        "total_count" => $totalCount
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>