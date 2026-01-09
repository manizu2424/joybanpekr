<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require_once '../config/db.php';

// POST 데이터 가져오기 (JSON 방식 대응)
$input = json_decode(file_get_contents("php://input"), true);
$username = isset($input['username']) ? $input['username'] : '';
$password = isset($input['password']) ? $input['password'] : '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "아이디와 비밀번호를 입력해주세요."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin) {
        // 비밀번호 검증 (평문과 해시 모두 대응하도록 설계)
        // [주의] 개발 단계에서는 평문 허용, 실제 운영 시에는 password_verify만 사용 권장
        $is_valid = false;
        if (password_verify($password, $admin['password'])) {
            $is_valid = true;
        } else if ($password === $admin['password']) {
            // SQL에서 평문으로 넣은 경우를 위한 임시 처리
            $is_valid = true;
        }

        if ($is_valid) {
            // 세션에 로그인 정보 저장
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_user'] = $admin['username'];

            echo json_encode([
                "status" => "success",
                "message" => "로그인 성공",
                "user" => [
                    "username" => $admin['username']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "비밀번호가 일치하지 않습니다."]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "존재하지 않는 관리자 계정입니다."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "서버 오류가 발생했습니다."]);
}
?>