# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 项目概述

这是一个基于 React + Vite 的个人任务管理应用，后端使用 PHP + MySQL。

## 开发命令

```bash
# 开发服务器（端口 8080）
pnpm dev

# 构建
pnpm build

# ESLint 检查
pnpm lint
```

**重要**：使用 pnpm 进行包管理。

## 技术架构

### 核心技术栈
- React 18 + Vite
- TanStack Query（数据获取和缓存）
- PHP + MySQL（后端 API）
- Tailwind CSS + shadcn/ui（UI 组件）
- React Router（HashRouter 模式）
- TipTap（富文本编辑器）

### 路径别名
- `@/` → `src/`

### 项目结构
```
├── api/                    # PHP 后端 API
│   ├── config.php          # 数据库配置
│   ├── init.php            # 初始化数据库表
│   ├── tasks.php           # 任务 CRUD
│   ├── whiteboards.php     # 白板 CRUD
│   └── settings.php        # 设置 CRUD
├── src/
│   ├── components/         # 业务组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   ├── TaskItem.jsx    # 任务卡片
│   │   ├── TaskDialog.jsx  # 任务编辑弹窗
│   │   ├── TaskCalendar.jsx # 任务日历
│   │   ├── TagManager.jsx  # 标签管理
│   │   ├── Whiteboard.jsx  # 灵感白板
│   │   └── ...
│   ├── contexts/
│   │   └── AppContext.jsx  # 应用上下文（用户设置）
│   ├── hooks/
│   │   ├── useTasks.js     # 任务操作 Hook
│   │   └── useWhiteboards.js # 白板操作 Hook
│   ├── lib/
│   │   ├── api.js          # API 请求封装
│   │   ├── storage.js      # 本地存储封装
│   │   └── utils.js        # 工具函数
│   └── pages/
│       └── Index.jsx       # 主页面
├── dist/                   # 构建输出（部署用）
└── public/                 # 静态资源
```

### 数据模型（MySQL 表）
- `tasks` - 任务（支持重复任务、进度追踪、附件、标签）
- `whiteboards` - 白板
- `settings` - 用户设置（key-value 形式）

### 部署
项目部署在阿里云宝塔面板，域名：todo.lengm.cn
- 前端：静态文件部署
- 后端：PHP API
- 数据库：MySQL
