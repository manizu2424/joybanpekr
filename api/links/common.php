<?php
require_once __DIR__ . '/../auth/auth_check.php';
header('Content-Type: application/json; charset=UTF-8');
function reply(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        header('Allow: ' . $method);
        reply(['status' => 'error', 'message' => '허용되지 않는 요청입니다.'], 405);
    }
}
function normalizedLink(array $input): array {
    $title = $input['title'] ?? '';
    $url = $input['url'] ?? '';
    $description = $input['description'] ?? '';
    if (!is_string($title) || !is_string($url) || !is_string($description)) throw new InvalidArgumentException('입력 형식을 확인해주세요.');
    $title = trim($title); $url = trim($url); $description = trim($description);
    if ($title === '' || preg_match_all('/./us', $title) > 180) throw new InvalidArgumentException('제목은 1~180자로 입력해주세요.');
    if (strlen($description) > 10000) throw new InvalidArgumentException('메모가 너무 깁니다.');
    $parts = parse_url($url);
    if (strlen($url) > 2048 || !filter_var($url, FILTER_VALIDATE_URL) || !$parts ||
        !in_array(strtolower($parts['scheme'] ?? ''), ['https', 'http'], true) ||
        isset($parts['user']) || isset($parts['pass'])) throw new InvalidArgumentException('http 또는 https 링크를 입력해주세요.');
    $category = $input['category'] ?? 'other';
    $kind = $input['kind'] ?? 'article';
    $visibility = $input['visibility'] ?? 'private';
    if (!in_array($category, ['ai', 'web', 'python', 'automation', 'other'], true) ||
        !in_array($kind, ['site', 'article', 'workspace'], true) ||
        !in_array($visibility, ['private', 'public'], true)) throw new InvalidArgumentException('분류를 확인해주세요.');
    if ($kind === 'workspace') $visibility = 'private';
    $tags = $input['tags'] ?? [];
    if (!is_array($tags) || count($tags) > 12) throw new InvalidArgumentException('태그는 최대 12개까지 입력해주세요.');
    $cleanTags = [];
    foreach ($tags as $tag) {
        if (!is_string($tag)) throw new InvalidArgumentException('태그 형식을 확인해주세요.');
        $tag = trim($tag);
        if (preg_match_all('/./us', $tag) > 30) throw new InvalidArgumentException('태그는 30자 이내로 입력해주세요.');
        if ($tag !== '') $cleanTags[] = $tag;
    }
    $sortOrder = filter_var($input['sort_order'] ?? 0, FILTER_VALIDATE_INT);
    if ($sortOrder === false || $sortOrder < 0 || $sortOrder > 99999) throw new InvalidArgumentException('정렬 순서는 0~99999로 입력해주세요.');
    foreach (['is_favorite', 'is_read'] as $field) {
        if (isset($input[$field]) && !in_array($input[$field], [true, false, 0, 1], true)) throw new InvalidArgumentException('상태 값을 확인해주세요.');
    }
    return [$title, $url, $description, $category, $kind,
        json_encode(array_values(array_unique($cleanTags)), JSON_UNESCAPED_UNICODE),
        $visibility, (int)($input['is_favorite'] ?? false), (int)($input['is_read'] ?? false), $sortOrder];
}
function serializeLink(array $row, bool $admin): array {
    $row['id'] = (int)$row['id'];
    $row['tags'] = json_decode($row['tags'], true) ?: [];
    $row['is_favorite'] = (bool)$row['is_favorite'];
    $row['sort_order'] = (int)$row['sort_order'];
    if ($admin) $row['is_read'] = (bool)$row['is_read'];
    else unset($row['is_read']);
    return $row;
}
