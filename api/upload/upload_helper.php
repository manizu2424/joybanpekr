<?php
header("Content-Type: application/json; charset=UTF-8");
require_once '../auth/auth_check.php';
checkAdminAuth(); // 관리자만 업로드 가능

/**
 * 파일 업로드 처리 함수
 * @param array $file $_FILES['name'] 형태의 배열
 * @return string|false 저장된 파일 경로 또는 실패 시 false
 */
function handleFileUpload($file) {
    $targetDir = "../../uploads/";
    
    // 디렉토리가 없으면 생성
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0777, true);
    }

    $fileType = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $newFileName = uniqid() . '_' . time() . '.' . $fileType;
    $targetFile = $targetDir . $newFileName;

    // 허용되는 확장자 체크
    $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4');
    if (in_array($fileType, $allowTypes)) {
        if (move_uploaded_file($file["tmp_name"], $targetFile)) {
            return "uploads/" . $newFileName; // public/ 기준 경로 반환
        }
    }
    return false;
}
?>