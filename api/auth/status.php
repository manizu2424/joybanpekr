<?php
require_once __DIR__ . '/session.php';
header('Content-Type: application/json; charset=UTF-8');
$loggedIn = !empty($_SESSION['admin_id']);
echo json_encode(['status' => 'success', 'isLoggedIn' => $loggedIn,
    'csrfToken' => $loggedIn ? csrfToken() : null]);
