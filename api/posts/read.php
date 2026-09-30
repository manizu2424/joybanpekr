<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/connect.php';

// GET 파라미터 확인
$category = isset($_GET['category']) ? $_GET['category'] : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$limit = max(1, min(100, $limit)); $offset = max(0, $offset);
if (!is_string($category) || ($category !== '' && !in_array($category, ['aiworld','works','vision','skillup'], true))) {
    http_response_code(400); echo json_encode(['status'=>'error','message'=>'카테고리를 확인해주세요.']); exit;
}

try {
    if ($category) {
        // 전체 개수 조회
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE category = ?");
        $countStmt->execute([$category]);
        $totalCount = $countStmt->fetchColumn();

        // 특정 카테고리 게시글 조회 (썸네일 포함)
        $sql = "SELECT p.*,
                       (SELECT file_path FROM media m WHERE m.post_id = p.id AND LOWER(m.file_path) REGEXP '\\.(jpg|jpeg|png|gif)$' ORDER BY display_order ASC LIMIT 1) as thumbnail
                FROM posts p
                WHERE p.category = ?
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $category, PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        // 전체 개수 조회
        $countStmt = $pdo->query("SELECT COUNT(*) FROM posts");
        $totalCount = $countStmt->fetchColumn();

        // 전체 게시글 조회 (썸네일 포함)
        $sql = "SELECT p.*,
                       (SELECT file_path FROM media m WHERE m.post_id = p.id AND LOWER(m.file_path) REGEXP '\\.(jpg|jpeg|png|gif)$' ORDER BY display_order ASC LIMIT 1) as thumbnail
                FROM posts p
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
    }

    $posts = $stmt->fetchAll();

    // 결과 반환
    echo json_encode([
        "status" => "success",
        "data" => $posts,
        "total_count" => $totalCount
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log('Joyban posts: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "자료를 불러오지 못했습니다."
    ]);
}
?>
