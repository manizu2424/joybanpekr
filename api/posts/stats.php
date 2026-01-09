<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';

try {
    $stmt = $pdo->query("SELECT category, COUNT(*) as count FROM posts GROUP BY category");
    $stats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // ['ailand' => 10, 'works' => 5, ...]

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