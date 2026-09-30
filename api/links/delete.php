<?php
require_once __DIR__ . '/common.php';
requireMethod('POST'); checkAdminAuth();
$input = json_decode(file_get_contents('php://input'), true);
$id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
if (!$id || $id < 1) reply(['status'=>'error','message'=>'자료 ID를 확인해주세요.'],400);
require_once __DIR__ . '/../config/connect.php';
try {
    $stmt = $pdo->prepare('DELETE FROM portal_links WHERE id=?'); $stmt->execute([$id]);
    if (!$stmt->rowCount()) reply(['status'=>'error','message'=>'자료가 존재하지 않습니다.'],404);
    reply(['status'=>'success']);
} catch (PDOException $e) {
    error_log('Joyban link delete: ' . $e->getMessage());
    reply(['status'=>'error','message'=>'자료를 삭제하지 못했습니다.'],500);
}
