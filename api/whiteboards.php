<?php
// 白板 API
require_once 'config.php';

// 转换日期格式
function formatDatetime($value) {
    if (empty($value)) {
        return null;
    }
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return null;
    }
    return date('Y-m-d H:i:s', $timestamp);
}

try {
    $pdo = getDB();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM whiteboards WHERE id = ?");
                $stmt->execute([$id]);
                $whiteboard = $stmt->fetch();
                if ($whiteboard) {
                    jsonResponse($whiteboard);
                } else {
                    jsonResponse(['error' => '白板不存在'], 404);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM whiteboards ORDER BY updated_at DESC");
                jsonResponse($stmt->fetchAll());
            }
            break;

        case 'POST':
            $data = getRequestBody();
            $id = $data['id'] ?? uniqid('wb_', true);

            // content 可能是字符串或对象
            $content = $data['content'] ?? '';
            if (is_array($content)) {
                $content = $content['html'] ?? json_encode($content, JSON_UNESCAPED_UNICODE);
            }

            $stmt = $pdo->prepare("
                INSERT INTO whiteboards (id, title, content, created_at)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $id,
                $data['title'] ?? '新白板',
                $content,
                formatDatetime($data['created_at'] ?? null) ?? date('Y-m-d H:i:s'),
            ]);

            jsonResponse(['success' => true, 'id' => $id], 201);
            break;

        case 'PUT':
            if (!$id) {
                jsonResponse(['error' => '缺少白板 ID'], 400);
            }

            $data = getRequestBody();
            $fields = [];
            $values = [];

            if (array_key_exists('title', $data)) {
                $fields[] = "title = ?";
                $values[] = $data['title'];
            }
            if (array_key_exists('content', $data)) {
                $fields[] = "content = ?";
                // content 可能是字符串或对象
                $content = $data['content'];
                if (is_array($content)) {
                    $content = $content['html'] ?? json_encode($content, JSON_UNESCAPED_UNICODE);
                }
                $values[] = $content;
            }

            if (empty($fields)) {
                jsonResponse(['error' => '没有要更新的字段'], 400);
            }

            $values[] = $id;
            $sql = "UPDATE whiteboards SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);

            jsonResponse(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                jsonResponse(['error' => '缺少白板 ID'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM whiteboards WHERE id = ?");
            $stmt->execute([$id]);

            jsonResponse(['success' => true]);
            break;

        default:
            jsonResponse(['error' => '不支持的方法'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => '服务器错误', 'message' => $e->getMessage()], 500);
}
