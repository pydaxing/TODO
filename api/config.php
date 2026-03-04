<?php
// 关闭 PHP 错误显示到页面（改为返回 JSON）
error_reporting(E_ALL);
ini_set('display_errors', 0);

// 数据库配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'todo_lengm_cn');
define('DB_USER', 'todo_lengm_cn');
define('DB_PASS', 'todo_lengm_cn');
define('DB_CHARSET', 'utf8mb4');

// 允许跨域
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 自定义错误处理
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Error',
        'message' => $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ], JSON_UNESCAPED_UNICODE);
    exit();
});

// 数据库连接
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => '数据库连接失败', 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    return $pdo;
}

// 获取请求体 JSON
function getRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

// 返回 JSON 响应
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}
