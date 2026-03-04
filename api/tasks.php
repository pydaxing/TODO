<?php
// 任务 API
require_once 'config.php';

// 转换 ISO 日期格式为 MySQL 格式
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

// 转换为整数，空值返回默认值
function toInt($value, $default = 0) {
    if ($value === '' || $value === null) {
        return $default;
    }
    return (int)$value;
}

// 转换为布尔整数 (0 或 1)
function toBoolInt($value) {
    if (empty($value) || $value === '0' || $value === 'false') {
        return 0;
    }
    return 1;
}

// 安全获取字符串，空字符串转为 null
function toStringOrNull($value) {
    if ($value === '' || $value === null) {
        return null;
    }
    return $value;
}

try {
    $pdo = getDB();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // 获取单个任务
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch();
                if ($task) {
                    $task['tags'] = json_decode($task['tags'], true) ?: [];
                    $task['progress_history'] = json_decode($task['progress_history'], true) ?: [];
                    $task['attachments'] = json_decode($task['attachments'], true) ?: [];
                    $task['recurring_type'] = $task['recurrence_type'];
                    $task['recurring_interval'] = $task['recurrence_interval'];
                    jsonResponse($task);
                } else {
                    jsonResponse(['error' => '任务不存在'], 404);
                }
            } else {
                // 获取所有任务
                $stmt = $pdo->query("SELECT * FROM tasks ORDER BY created_at DESC");
                $tasks = $stmt->fetchAll();
                foreach ($tasks as &$task) {
                    $task['tags'] = json_decode($task['tags'], true) ?: [];
                    $task['progress_history'] = json_decode($task['progress_history'], true) ?: [];
                    $task['attachments'] = json_decode($task['attachments'], true) ?: [];
                    $task['recurring_type'] = $task['recurrence_type'];
                    $task['recurring_interval'] = $task['recurrence_interval'];
                }
                jsonResponse($tasks);
            }
            break;

        case 'POST':
            // 创建任务
            $data = getRequestBody();
            $id = $data['id'] ?? uniqid('task_', true);

            $stmt = $pdo->prepare("
                INSERT INTO tasks (id, title, description, status, priority, deadline, tags,
                    progress_history, current_progress, attachments, is_recurring,
                    recurrence_type, recurrence_interval, parent_task_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $id,
                $data['title'] ?? '',
                toStringOrNull($data['description'] ?? null),
                $data['status'] ?? 'pending',
                $data['priority'] ?? 'medium',
                formatDatetime($data['deadline'] ?? null),
                json_encode($data['tags'] ?? [], JSON_UNESCAPED_UNICODE),
                json_encode($data['progress_history'] ?? [], JSON_UNESCAPED_UNICODE),
                toStringOrNull($data['current_progress'] ?? null),
                json_encode($data['attachments'] ?? [], JSON_UNESCAPED_UNICODE),
                toBoolInt($data['is_recurring'] ?? false),
                toStringOrNull($data['recurrence_type'] ?? $data['recurring_type'] ?? null),
                toInt($data['recurrence_interval'] ?? $data['recurring_interval'] ?? null, 1),
                toStringOrNull($data['parent_task_id'] ?? null),
                formatDatetime($data['created_at'] ?? null) ?? date('Y-m-d H:i:s'),
            ]);

            jsonResponse(['success' => true, 'id' => $id], 201);
            break;

        case 'PUT':
            if (!$id) {
                jsonResponse(['error' => '缺少任务 ID'], 400);
            }

            $data = getRequestBody();
            $fields = [];
            $values = [];

            // 普通字符串字段
            $stringFields = ['title', 'description', 'status', 'priority', 'current_progress', 'parent_task_id'];
            foreach ($stringFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $values[] = toStringOrNull($data[$field]);
                }
            }

            // 日期字段
            if (array_key_exists('deadline', $data)) {
                $fields[] = "deadline = ?";
                $values[] = formatDatetime($data['deadline']);
            }

            // 布尔整数字段
            if (array_key_exists('is_recurring', $data)) {
                $fields[] = "is_recurring = ?";
                $values[] = toBoolInt($data['is_recurring']);
            }

            // 重复类型字段（兼容两种字段名）
            if (array_key_exists('recurring_type', $data) || array_key_exists('recurrence_type', $data)) {
                $fields[] = "recurrence_type = ?";
                $values[] = toStringOrNull($data['recurrence_type'] ?? $data['recurring_type'] ?? null);
            }

            // 重复间隔字段（兼容两种字段名）
            if (array_key_exists('recurring_interval', $data) || array_key_exists('recurrence_interval', $data)) {
                $fields[] = "recurrence_interval = ?";
                $values[] = toInt($data['recurrence_interval'] ?? $data['recurring_interval'] ?? null, 1);
            }

            // JSON 字段
            $jsonFields = ['tags', 'progress_history', 'attachments'];
            foreach ($jsonFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $values[] = json_encode($data[$field] ?? [], JSON_UNESCAPED_UNICODE);
                }
            }

            if (empty($fields)) {
                jsonResponse(['error' => '没有要更新的字段'], 400);
            }

            $values[] = $id;
            $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);

            jsonResponse(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                jsonResponse(['error' => '缺少任务 ID'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);

            jsonResponse(['success' => true]);
            break;

        default:
            jsonResponse(['error' => '不支持的方法'], 405);
    }
} catch (Exception $e) {
    jsonResponse(['error' => '服务器错误', 'message' => $e->getMessage()], 500);
}
