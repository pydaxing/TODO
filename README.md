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

以下是从零到一的完整部署流程。

### 第一步：准备阿里云服务器

#### 1.1 购买服务器
1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 选择 **云服务器 ECS**
3. 配置推荐：
   - 地域：选择离你近的（如华东1-杭州）
   - 规格：1核2G 内存起步即可
   - 系统：**CentOS 7.x** 或 **Ubuntu 20.04**
   - 带宽：1Mbps 起
   - 存储：40GB 系统盘

#### 1.2 配置安全组
在 ECS 实例的「安全组」中开放以下端口：
| 端口 | 用途 |
|------|------|
| 22 | SSH 远程连接 |
| 80 | HTTP 访问 |
| 443 | HTTPS 访问 |
| 8888 | 宝塔面板（安装后可关闭） |

### 第二步：安装宝塔面板

#### 2.1 SSH 连接服务器
```bash
ssh root@你的服务器IP
```

#### 2.2 安装宝塔面板
**CentOS 系统：**
```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

**Ubuntu 系统：**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

安装完成后会显示：
```
==================================================================
Congratulations! Installed successfully!
==================================================================
外网面板地址: http://你的IP:8888/xxxxxx
内网面板地址: http://内网IP:8888/xxxxxx
username: xxxxxxxx
password: xxxxxxxx
```

**请记录好这些信息！**

#### 2.3 登录宝塔面板
1. 浏览器访问：`http://你的IP:8888/xxxxxx`
2. 使用上面显示的用户名密码登录
3. 首次登录需要绑定宝塔账号（免费注册即可）

### 第三步：安装 LNMP 环境

#### 3.1 安装套件
首次登录会提示安装套件，选择 **LNMP**：
- **Nginx**：1.22+
- **MySQL**：5.7 或 8.0
- **PHP**：7.4 或 8.0

选择「极速安装」，等待 5-15 分钟完成。

#### 3.2 PHP 扩展配置
1. 进入「软件商店」→「已安装」→「PHP」→「设置」
2. 切换到「安装扩展」标签
3. 确保以下扩展已安装：
   - `pdo_mysql`
   - `mysqli`
   - `json`
   - `mbstring`

### 第四步：配置域名解析

#### 4.1 购买域名
在阿里云「域名注册」购买域名（如 `lengm.cn`）

#### 4.2 添加 DNS 解析
1. 进入「云解析 DNS」
2. 添加记录：
   | 记录类型 | 主机记录 | 记录值 |
   |----------|----------|--------|
   | A | todo | 你的服务器IP |
   | A | @ | 你的服务器IP |

3. 等待解析生效（通常 5-10 分钟）

#### 4.3 验证解析
```bash
ping todo.你的域名.com
```

### 第五步：创建网站

#### 5.1 在宝塔创建站点
1. 进入「网站」→「添加站点」
2. 填写信息：
   - **域名**：`todo.你的域名.com`
   - **根目录**：`/www/wwwroot/todo.你的域名.com`
   - **数据库**：MySQL，输入数据库名（如 `todo_db`）
   - **PHP版本**：选择已安装的版本

3. 点击「提交」

#### 5.2 记录数据库信息
创建完成后会显示数据库信息，**务必记录**：
```
数据库名：todo_db
用户名：todo_db
密码：xxxxxxxxx
```

### 第六步：本地构建项目

#### 6.1 环境准备
确保本地已安装：
- Node.js 18+
- pnpm（`npm install -g pnpm`）

#### 6.2 安装依赖
```bash
cd /path/to/TODO
pnpm install
```

#### 6.3 构建生产版本
```bash
pnpm build
```

构建完成后，`dist/` 目录包含所有前端文件。

### 第七步：配置后端 API

#### 7.1 修改数据库配置
编辑 `api/config.php`，填入宝塔创建的数据库信息：

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'todo_db');           // 替换为你的数据库名
define('DB_USER', 'todo_db');           // 替换为你的数据库用户名
define('DB_PASS', '你的数据库密码');      // 替换为你的数据库密码
define('DB_CHARSET', 'utf8mb4');
```

### 第八步：上传文件到服务器

#### 8.1 使用宝塔文件管理
1. 进入「文件」
2. 导航到 `/www/wwwroot/todo.你的域名.com`
3. 删除默认的 `index.html`（如有）

#### 8.2 上传文件
上传以下内容到网站根目录：

| 本地路径 | 上传到 |
|----------|--------|
| `dist/` 目录下所有文件 | `/www/wwwroot/todo.xxx.com/` |
| `api/` 整个目录 | `/www/wwwroot/todo.xxx.com/api/` |

**上传后的目录结构：**
```
/www/wwwroot/todo.你的域名.com/
├── index.html           # 前端入口
├── assets/              # 前端资源
│   ├── index-xxx.js
│   └── index-xxx.css
├── api/                 # 后端 API
│   ├── config.php
│   ├── init.php
│   ├── tasks.php
│   ├── whiteboards.php
│   └── settings.php
└── favicon.ico          # 图标（可选）
```

#### 8.3 设置文件权限
在宝塔文件管理中：
1. 右键 `api` 目录 → 权限 → 设置为 `755`
2. 所有 `.php` 文件权限设置为 `644`

### 第九步：初始化数据库

#### 9.1 访问初始化接口
浏览器访问：
```
https://todo.你的域名.com/api/init.php
```

如果看到类似以下响应，表示成功：
```json
{
  "success": true,
  "message": "数据库表初始化成功"
}
```

### 第十步：配置 HTTPS（可选但推荐）

#### 10.1 申请 SSL 证书
1. 在宝塔「网站」列表，点击你的站点
2. 切换到「SSL」标签
3. 选择「Let's Encrypt」
4. 勾选域名，点击「申请」

#### 10.2 开启强制 HTTPS
申请成功后，开启「强制HTTPS」

### 第十一步：验证部署

访问 `https://todo.你的域名.com`，应该能看到 TODO 应用界面。

#### 功能测试清单
- [ ] 创建新任务
- [ ] 编辑任务状态和进度
- [ ] 添加/删除标签
- [ ] 上传附件
- [ ] 创建白板
- [ ] 查看任务日历
- [ ] 设置头像和用户名

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
