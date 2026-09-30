<?php
require_once __DIR__ . '/../auth/auth_check.php';
function handleFileUpload(array $file): string {
    $targetDir = __DIR__ . '/../../uploads/';
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'],
        'gif' => ['image/gif'], 'pdf' => ['application/pdf'], 'mp4' => ['video/mp4']];
    if (!isset($allowed[$extension]) || !is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('지원하지 않는 첨부파일입니다.');
    }
    if (filesize($file['tmp_name']) > 20 * 1024 * 1024) throw new RuntimeException('파일은 20MB 이하만 가능합니다.');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!in_array($mime, $allowed[$extension], true)) throw new RuntimeException('파일 형식이 확장자와 일치하지 않습니다.');
    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) throw new RuntimeException('업로드 폴더를 만들지 못했습니다.');
    $filename = bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $targetDir . $filename)) throw new RuntimeException('파일 저장에 실패했습니다.');
    return 'uploads/' . $filename;
}
function removeUploadedFile(string $path): void {
    // DB에 저장된 경로도 uploads 바로 아래 파일만 삭제할 수 있습니다.
    if (!preg_match('~^uploads/[a-zA-Z0-9_.-]+$~D', $path)) return;
    $fullPath = __DIR__ . '/../../' . $path;
    if (is_file($fullPath) && !unlink($fullPath)) error_log('Joyban attachment delete failed');
}
