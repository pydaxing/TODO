# TODO 任务管理系统

一个功能完善的个人任务管理应用，支持任务管理、进度追踪、标签分类、日历视图、灵感白板等功能。

---

## 技术架构

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| Vite | 5.x | 构建工具 |
| TanStack Query | 5.x | 数据请求与缓存 |
| Tailwind CSS | 3.x | 样式框架 |
| shadcn/ui | - | UI 组件库 |
| TipTap | 2.x | 富文本编辑器 |
| React Router | 6.x | 路由（HashRouter） |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| PHP | 7.4+ | 后端语言 |
| MySQL | 5.7+ | 数据库 |

---

## 功能特性

### 任务管理
- **创建/编辑/删除任务**：支持标题、详细描述（富文本）、截止时间
- **任务状态**：待办、进行中、已完成、暂停
- **进度追踪**：百分比进度条，可视化任务完成度
- **标签分类**：支持多标签，便于任务归类
- **附件支持**：可添加图片/文件附件（Base64 存储）
- **重复任务**：支持每日/每周/每月重复

### 任务日历
- 月历视图，直观展示任务分布
- 按截止日期聚合任务
- 不同状态用不同颜色标记
- 点击日期查看当天任务列表

### 标签管理
- 查看所有标签及使用次数
- 重命名标签（批量更新）
- 删除标签（从所有任务中移除）

### 灵感白板
- 富文本编辑器
- 支持多个白板卡片
- 自动保存

### 个人设置
- 自定义用户名
- 头像设置（支持上传图片或输入 URL）

---

## 数据模型

### tasks 表（任务）
```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'completed', 'paused') DEFAULT 'todo',
    progress INT DEFAULT 0,
    deadline DATETIME,
    tags JSON,
    attachments JSON,
    is_recurring TINYINT DEFAULT 0,
    recurrence_type VARCHAR(20),
    recurrence_end_date DATE,
    last_recurrence_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### whiteboards 表（白板）
```sql
CREATE TABLE whiteboards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### settings 表（设置）
```sql
CREATE TABLE settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 部署指南（阿里云 + 宝塔面板）

### 第一步：阿里云环境准备

1. 购买阿里云 ECS 服务器（1核2G 起步即可）
2. 在 ECS 控制台一键安装「宝塔面板」应用
3. 登录宝塔面板，首次会提示安装 LNMP 环境（Nginx + MySQL + PHP）

### 第二步：创建网站和数据库

1. 在宝塔「网站」→「添加站点」
2. 填写域名（如 `todo.你的域名.com`）
3. **重要**：勾选创建 MySQL 数据库，记录数据库名、用户名、密码
4. 在阿里云「云解析 DNS」添加 A 记录，指向服务器 IP

### 第三步：本地构建项目

```bash
pnpm install    # 安装依赖
pnpm build      # 构建，生成 dist/ 目录
```

### 第四步：配置数据库连接

编辑 `api/config.php`，填入宝塔创建的数据库信息：
```php
define('DB_NAME', 'todo_db');           // 数据库名
define('DB_USER', 'todo_db');           // 用户名
define('DB_PASS', '你的数据库密码');      // 密码
```

### 第五步：上传文件

通过宝塔「文件管理」上传到网站根目录：
- `dist/` 目录下所有文件
- `api/` 整个目录

### 第六步：初始化数据库

访问 `https://你的域名/api/init.php`，看到成功提示即可。

### 第七步：配置 HTTPS（可选）

在宝塔网站设置中申请 Let's Encrypt 免费证书。

---

## 常见问题

### Q1: 页面空白或报错
**检查步骤：**
1. 浏览器 F12 查看 Console 错误
2. 检查 `api/config.php` 数据库配置是否正确
3. 访问 `/api/init.php` 确认数据库初始化

### Q2: API 返回 500 错误
**解决方案：**
1. 检查 PHP 版本是否 7.4+
2. 确认 `pdo_mysql` 扩展已安装
3. 查看宝塔「网站日志」获取详细错误

### Q3: 头像上传失败
**原因：** 图片太大
**解决：** 图片限制 2MB 以内

### Q4: 跨域问题
**解决：** `api/config.php` 已包含 CORS 头配置，无需额外设置

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 8080）
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint
```

### 本地 API 开发
需要本地 PHP + MySQL 环境，推荐使用 MAMP/XAMPP。

---

## 项目结构

```
├── api/                    # PHP 后端 API
│   ├── config.php          # 数据库配置
│   ├── init.php            # 初始化数据库表
│   ├── tasks.php           # 任务 CRUD
│   ├── whiteboards.php     # 白板 CRUD
│   └── settings.php        # 设置 CRUD
├── src/
│   ├── components/         # React 组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   ├── TaskItem.jsx    # 任务卡片
│   │   ├── TaskDialog.jsx  # 任务编辑弹窗
│   │   ├── TaskCalendar.jsx# 任务日历
│   │   ├── TagManager.jsx  # 标签管理
│   │   └── Whiteboard.jsx  # 灵感白板
│   ├── contexts/
│   │   └── AppContext.jsx  # 应用上下文
│   ├── hooks/
│   │   ├── useTasks.js     # 任务操作 Hook
│   │   └── useWhiteboards.js
│   ├── lib/
│   │   ├── api.js          # API 请求封装
│   │   └── utils.js        # 工具函数
│   └── pages/
│       └── Index.jsx       # 主页面
├── dist/                   # 构建输出
└── public/                 # 静态资源
```

---

## 许可证

MIT License
