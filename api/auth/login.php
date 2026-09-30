<?php
require_once __DIR__ . '/session.php';
header('Content-Type: application/json; charset=UTF-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); header('Allow: POST');
    echo json_encode(['status' => 'error', 'message' => 'POST 요청만 가능합니다.']); exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';
if (!is_string($username) || !is_string($password) || !$username || !$password || strlen($username) > 50 || strlen($password) > 1024) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => '아이디와 비밀번호를 확인해주세요.']); exit;
}
require_once __DIR__ . '/../config/connect.php';
try {
    // 브라우저 세션을 새로 만들어도 우회할 수 없는 IP별 시도 제한.
    $ip = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM auth_login_attempts WHERE ip_hash = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
    $stmt->execute([$ip]);
    if ((int)$stmt->fetchColumn() >= 5) {
        http_response_code(429); header('Retry-After: 900');
        echo json_encode(['status' => 'error', 'message' => '로그인 시도가 많습니다. 15분 뒤 다시 시도해주세요.']); exit;
    }
    $pdo->prepare('INSERT INTO auth_login_attempts (ip_hash) VALUES (?)')->execute([$ip]);
    $pdo->exec('DELETE FROM auth_login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 1 DAY)');
    $stmt = $pdo->prepare('SELECT id, username, password FROM admins WHERE username = ?');
    $stmt->execute([$username]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    // 저장된 해시 자체를 비밀번호로 받아들이는 평문 비교를 금지합니다.
    if (!$admin || !password_verify($password, $admin['password'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => '아이디 또는 비밀번호가 일치하지 않습니다.']); exit;
    }
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_user'] = $admin['username'];
    unset($_SESSION['csrf_token']);
    $pdo->prepare('DELETE FROM auth_login_attempts WHERE ip_hash = ?')->execute([$ip]);
    echo json_encode(['status' => 'success', 'csrfToken' => csrfToken(), 'user' => ['username' => $admin['username']]]);
} catch (PDOException $e) {
    error_log('Joyban login: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => '로그인을 처리하지 못했습니다. 서버 설정을 확인해주세요.']);
}
