<?php
// 웹에서 실행할 수 없는 관리자 생성/비밀번호 교체 도구.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../api/config/db.php';
fwrite(STDOUT, "관리자 계정명 [admin]: ");
$username = trim(fgets(STDIN)) ?: 'admin';
if (!preg_match('/^[a-zA-Z0-9_.-]{1,50}$/', $username)) exit("계정명을 확인해주세요.\n");
$hidden = DIRECTORY_SEPARATOR === '/' && function_exists('shell_exec');
if ($hidden) shell_exec('stty -echo');
try {
    fwrite(STDOUT, "새 비밀번호 (12자 이상): ");
    $password = rtrim(fgets(STDIN), "\r\n");
    fwrite(STDOUT, "\n새 비밀번호 확인: ");
    $confirm = rtrim(fgets(STDIN), "\r\n");
} finally {
    if ($hidden) shell_exec('stty echo');
    fwrite(STDOUT, "\n");
}
if (strlen($password) < 12 || $password !== $confirm) exit("비밀번호 길이와 확인 값을 확인해주세요.\n");
$stmt = $pdo->prepare('INSERT INTO admins (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)');
$stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
echo "관리자 비밀번호가 저장되었습니다.\n";
