<?php
require_once __DIR__ . '/common.php';
requireMethod('POST');
checkAdminAuth();
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) reply(['status'=>'error','message'=>'입력 내용을 확인해주세요.'],400);
$id = filter_var($input['id'] ?? 0, FILTER_VALIDATE_INT);
if ($id === false || $id < 0) reply(['status'=>'error','message'=>'자료 ID를 확인해주세요.'],400);
try { $values = normalizedLink($input); }
catch (InvalidArgumentException $e) { reply(['status'=>'error','message'=>$e->getMessage()],400); }
require_once __DIR__ . '/../config/connect.php';
try {
    if ($id) {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT id FROM portal_links WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        if (!$stmt->fetchColumn()) { $pdo->rollBack(); reply(['status'=>'error','message'=>'자료가 삭제되었거나 존재하지 않습니다.'],404); }
        $stmt = $pdo->prepare('UPDATE portal_links SET title=?, url=?, description=?, category=?, kind=?, tags=?, visibility=?, is_favorite=?, is_read=?, sort_order=? WHERE id=?');
        $stmt->execute([...$values,$id]);
        $pdo->commit();
    } else {
        $stmt = $pdo->prepare('INSERT INTO portal_links (title,url,description,category,kind,tags,visibility,is_favorite,is_read,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute($values); $id = (int)$pdo->lastInsertId();
    }
    reply(['status'=>'success','id'=>$id]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Joyban link save: ' . $e->getMessage());
    reply(['status'=>'error','message'=>'자료를 저장하지 못했습니다. 다시 시도해주세요.'],500);
}
