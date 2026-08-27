<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';

try {
    $categories = ['aiworld', 'works', 'vision', 'skillup'];
    $stats = [];

    foreach ($categories as $category) {
        $stats[$category] = [
            "count" => 0,
            "latest" => null
        ];
    }

    $countStmt = $pdo->query("SELECT category, COUNT(*) as count FROM posts GROUP BY category");
    while ($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
        if (isset($stats[$row['category']])) {
            $stats[$row['category']]['count'] = (int)$row['count'];
        }
    }

    $latestSql = "
        SELECT p.id, p.category, p.title, p.created_at
        FROM posts p
        INNER JOIN (
            SELECT category, MAX(created_at) AS latest_created_at
            FROM posts
            GROUP BY category
        ) latest
            ON latest.category = p.category
            AND latest.latest_created_at = p.created_at
        ORDER BY p.id DESC
    ";
    $latestStmt = $pdo->query($latestSql);
    while ($row = $latestStmt->fetch(PDO::FETCH_ASSOC)) {
        if (isset($stats[$row['category']]) && $stats[$row['category']]['latest'] === null) {
            $stats[$row['category']]['latest'] = [
                "id" => (int)$row['id'],
                "title" => $row['title'],
                "created_at" => $row['created_at']
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $stats
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
