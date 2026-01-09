<?php
session_start();
session_unset();
session_destroy();
header("Content-Type: application/json; charset=UTF-8");

echo json_encode(["status" => "success", "message" => "로그아웃 되었습니다."]);
?>