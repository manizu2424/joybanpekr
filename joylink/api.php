<?php
header("Content-Type: application/json");
include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 모든 링크 조회
        $stmt = $pdo->prepare("SELECT * FROM links ORDER BY sort_order ASC, created_at DESC");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
        break;

    case 'PATCH':
        // 순서 변경 (Reorder)
        $data = json_decode(file_get_contents("php://input"), true);
        if (is_array($data)) {
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("UPDATE links SET sort_order = :sort_order WHERE id = :id");
                
                foreach ($data as $item) {
                    if (isset($item['id'], $item['sort_order'])) {
                        $stmt->execute([
                            ':sort_order' => $item['sort_order'],
                            ':id' => $item['id']
                        ]);
                    }
                }
                $pdo->commit();
                echo json_encode(["message" => "Order updated"]);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => "Failed to update order: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input"]);
        }
        break;

    case 'POST':
        // 링크 추가
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['title'], $data['url'], $data['category'])) {
            $stmt = $pdo->prepare("INSERT INTO links (title, url, category) VALUES (:title, :url, :category)");
            $stmt->execute([
                ':title' => $data['title'],
                ':url' => $data['url'],
                ':category' => $data['category']
            ]);
            echo json_encode(["message" => "Link added"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input"]);
        }
        break;

    case 'PUT':
        // 링크 수정
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id'], $data['title'], $data['url'], $data['category'])) {
            $stmt = $pdo->prepare("UPDATE links SET title = :title, url = :url, category = :category WHERE id = :id");
            $stmt->execute([
                ':title' => $data['title'],
                ':url' => $data['url'],
                ':category' => $data['category'],
                ':id' => $data['id']
            ]);
            echo json_encode(["message" => "Link updated"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid input"]);
        }
        break;

    case 'DELETE':
        // 링크 삭제
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data['id'])) {
            $stmt = $pdo->prepare("DELETE FROM links WHERE id = :id");
            $stmt->execute([':id' => $data['id']]);
            echo json_encode(["message" => "Link deleted"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid ID"]);
        }
        break;
}
?>
