<?php
require_once __DIR__ . '/common.php';
requireMethod('POST'); checkAdminAuth();
$input = json_decode(file_get_contents('php://input'), true);
$id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
if (!is_array($input) || !$id || $id < 1) reply(['status'=>'error','message'=>'자료 ID를 확인해주세요.'],400);
$sets = []; $values = [];
foreach (['is_favorite','is_read'] as $field) {
    if (!array_key_exists($field,$input)) continue;
    if (!in_array($input[$field],[true,false,0,1],true)) reply(['status'=>'error','message'=>'상태 값을 확인해주세요.'],400);
    $sets[] = $field . ' = ?'; $values[] = (int)$input[$field];
}
if (!$sets) reply(['status'=>'error','message'=>'변경할 상태가 없습니다.'],400);
require_once __DIR__ . '/../config/connect.php';
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT id FROM portal_links WHERE id = ? FOR UPDATE'); $stmt->execute([$id]);
    if (!$stmt->fetchColumn()) { $pdo->rollBack(); reply(['status'=>'error','message'=>'자료가 존재하지 않습니다.'],404); }
    $stmt = $pdo->prepare('UPDATE portal_links SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute([...$values,$id]); $pdo->commit();
    reply(['status'=>'success']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Joyban link state: ' . $e->getMessage());
    reply(['status'=>'error','message'=>'자료 상태를 변경하지 못했습니다.'],500);
}
