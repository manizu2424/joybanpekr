<?php
require_once __DIR__ . '/common.php';
requireMethod('GET');
$admin = !empty($_SESSION['admin_id']);
$where = []; $args = [];
if (!$admin) $where[] = "visibility = 'public' AND kind <> 'workspace'";
$category = $_GET['category'] ?? '';
if (!is_string($category) || ($category !== '' && !in_array($category, ['ai','web','python','automation','other'], true))) reply(['status'=>'error','message'=>'분야를 확인해주세요.'],400);
if ($category !== '') { $where[] = 'category = ?'; $args[] = $category; }
$view = $_GET['view'] ?? 'all';
if (!is_string($view) || !in_array($view, ['all','favorites','unread','site','article','workspace'], true)) reply(['status'=>'error','message'=>'필터를 확인해주세요.'],400);
if (in_array($view, ['unread','workspace'], true) && !$admin) reply(['status'=>'error','message'=>'로그인이 필요합니다.'],403);
if ($view === 'favorites') $where[] = 'is_favorite = 1';
if ($view === 'unread') $where[] = "kind = 'article' AND is_read = 0";
if (in_array($view, ['site','article','workspace'], true)) { $where[] = 'kind = ?'; $args[] = $view; }
$q = $_GET['q'] ?? ''; $tag = $_GET['tag'] ?? '';
if (!is_string($q) || !is_string($tag) || strlen($q) > 500 || strlen($tag) > 120) reply(['status'=>'error','message'=>'검색어를 확인해주세요.'],400);
if ($q !== '') {
    $like = '%' . strtr($q, ['!'=>'!!', '%'=>'!%', '_'=>'!_']) . '%';
    $where[] = "(title LIKE ? ESCAPE '!' OR description LIKE ? ESCAPE '!' OR tags LIKE ? ESCAPE '!')";
    array_push($args,$like,$like,$like);
}
if ($tag !== '') { $where[] = 'JSON_CONTAINS(tags, JSON_QUOTE(?))'; $args[] = $tag; }
$page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
if ($page === false || $page < 1 || $page > 100000) reply(['status'=>'error','message'=>'페이지를 확인해주세요.'],400);
$clause = $where ? ' WHERE ' . implode(' AND ', $where) : '';
require_once __DIR__ . '/../config/connect.php';
try {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM portal_links' . $clause);
    $stmt->execute($args); $total = (int)$stmt->fetchColumn();
    $stmt = $pdo->prepare('SELECT * FROM portal_links' . $clause . ' ORDER BY is_favorite DESC, sort_order ASC, id DESC LIMIT 30 OFFSET ' . (($page - 1) * 30));
    $stmt->execute($args);
    $rows = array_map(fn($row) => serializeLink($row, $admin), $stmt->fetchAll(PDO::FETCH_ASSOC));
    reply(['status'=>'success','data'=>$rows,'total'=>$total,'page'=>$page,'has_more'=>$page * 30 < $total]);
} catch (PDOException $e) {
    error_log('Joyban links: ' . $e->getMessage());
    reply(['status'=>'error','message'=>'자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'],500);
}
