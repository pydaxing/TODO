<?php
// 设置 API
require_once 'config.php';

try {
    $pdo = getDB();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // 获取所有设置
            $stmt = $pdo->query("SELECT `key`, `value` FROM settings");
            $rows = $stmt->fetchAll();

            // 转换为 key-value 对象
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['key']] = $row['value'];
            }

            jsonResponse($settings);
            break;

        case 'PUT':
            // 批量更新设置
            $data = getRequestBody();

            if (empty($data)) {
                jsonResponse(['error' => '没有要更新的设置'], 400);
            }

            // 使用 REPLACE INTO 来插入或更新
            $stmt = $pdo->prepare("REPLACE INTO settings (`key`, `value`) VALUES (?, ?)");

            foreach ($data as $key => $value) {
                $stmt->execute([$key, $value]);
            }

            jsonResponse(['success' => true]);
            break;

        case 'DELETE':
            // 删除指定设置
            $key = $_GET['key'] ?? null;

            if (!$key) {
                jsonResponse(['error' => '缺少设置 key'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM settings WHERE `key` = ?");
            $stmt->execute([$key]);

            jsonResponse(['success' => true]);
            break;

        default:
            jsonResponse(['error' => '不支持的方法'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => '服务器错误', 'message' => $e->getMessage()], 500);
}
