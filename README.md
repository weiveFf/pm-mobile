# Yessys 项目管理手机端（pm-mobile）

独立 UniApp（Vue3）工程，对接现有 Yessys WebApi 的售后/项目管理能力。与 `handheld/`（资产盘点）分离。

## 能力概览

- 登录（RSA 加密，与 PC / handheld 一致）
- 工作台（待处理 / 进行中 / 待关闭 / 已关闭）
- 项目列表与项目下反馈、添加反馈（含售后扩展字段）
- 反馈列表（待处理 / 我的 / 全部）
- 反馈详情：评论、操作记录、响应/处理/关闭/撤回/再处理
- 改处理人、改部门、延期申请/审批、客诉审核
- 简化数据统计

## 运行方式

推荐用 **HBuilderX** 打开本目录，运行到浏览器 / 手机。

接口地址策略：

- **生产（H5 + Nginx 反代）**：`config/index.js` 的 `baseURL` 为同源相对路径 `/api`，由 Nginx 把 `/api/` 转发到后端，**前端不写死后端地址**；
- **开发**：`baseURL` 用绝对地址直连后端（改 `config/index.js` 即可；**界面已不再提供地址配置入口**）。

Nginx 参考配置见文末《部署（H5 + Nginx）》。

主题色：`#0E5F3B`（森林绿，VITAL × FOREST 设计语言，米白暖底 `#FAF8F4`，铜色点缀 `#B8744A`）。设计 Token 统一在 `uni.scss` 的 `$pm-*` 命名空间。

## 设计还原说明（对照 `pm-mobile-design-final.html`）

依据三原则实施：适配所有手机尺寸 / 还原终版视觉细节 / 交互与多端表现一致。

### 已还原内容

| 范围 | 实现 |
| --- | --- |
| 设计 Token | `uni.scss` 集中定义 `$pm-*`：主色 `#0E5F3B`、暖底 `#FAF8F4`、铜色 `#B8744A`、`$pm-grad-hero` / `$pm-grad-brand`、6 个瓷贴渐变、`$pm-press-ease` 弹性曲线 |
| 工作台 | 问候栏（渐变头像 + 日期 + 问候语）、渐变 Hero 卡 + conic-gradient 完成率环 + 进行中/待关闭/已关闭统计、4 个彩色快捷瓷贴 |
| 我的 | 森林渐变 Hero 卡（头像首字 + 姓名 + 工号 + 两列统计）、功能瓷贴、胶囊退出按钮 |
| 反馈详情 | 评论改为聊天气泡（自己的消息品牌绿右侧，他人暖灰左侧、6rpx 非对称圆角）、底部操作 Dock 玻璃拟态 + `env(safe-area-inset-bottom)` |
| 项目/流程详情 | Hero 渐变卡 + 装饰光斑圆 + 弹性按压 CTA |
| 5 个流程表单 | 延期/再处理/改处理人/改部门/客诉审核统一为胶囊 `.value` 选择器 + 28rpx 圆角 `.textarea` + `$pm-surface` 白卡投影 |
| 全局交互 | `.pressable` 150ms 弹性按压（scale 0.97）、胶囊按钮 + 森林绿投影、状态芯片含铜色语义 |

### 多尺寸适配策略

- 工作台 / 项目列表 / 反馈列表由「内层 scroll-view + JS 硬算 scrollHeight」改为**页面级自然滚动 + `onReachBottom` 触底加载**，任何屏幕高度下都不会出现滚动区错位
- `page` 级 `overflow-x: hidden`；剩余 `scroll-view` 均为筛选 Tab 的合法横向滑动条
- `.pm-safe-bottom` 已含 `env(safe-area-inset-bottom)`，全面屏底部自动适配

### 与设计稿的差异（有意取舍 / 平台限制）

1. **暗色模式**：设计稿中的暗色章节未实现（需求明确为浅色单主题）
2. **消息页**：设计稿独立消息 Tab，实际产品中评论内嵌于反馈详情，未单独建页
3. **图标**：设计稿的精细 SVG 线性图标以色块瓷贴 + 文字简化替代，后续可接图标库
4. **字体**：设计稿 Inter 字体栈改为系统字体栈（避免小程序端字体加载成本）
5. **渐进降级**：`conic-gradient` 进度环与 `backdrop-filter` 玻璃拟态在低版本 webview（部分安卓小程序机型）会降级为纯色环 / 半透明底，不影响布局与交互

### 验证状态

- 全部页面使用的 `$pm-*` Token 均有定义（0 缺失）
- 旧主色残留（`#22C55E` / `#16A34A` / `#008A0E` 等）已清零
- 未执行 vite 构建（工程依赖未安装，按 HBuilderX 方式运行）；建议实机过一遍工作台 / 反馈详情 / 表单页

## 目录

```
pm-mobile/
  api/           # login / after-sales / system
  pages/         # 登录、工作台、项目、反馈、我的及子页
  components/    # 顶栏、反馈卡片、状态芯片
  utils/         # 请求、鉴权、工作流、紧急程度、售后扩展
  constants/     # 枚举
```

## 部署（H5 + Nginx）

1. HBuilderX「发行 → 网站 H5」，产物在 `unpackage/dist/build/h5`。
2. 生产环境 `config/index.js` 的 `baseURL = '/api'`（已内置）；前端**无需**配置任何后端地址。
3. 所有接口——含 `uni.request`、上传 `/Common/UploadFile`、图片 `/uploads/...`、公钥 `/login/public-key`——都会以 `/api/...` 前缀发出，Nginx 统一把 `/api/` 转发到后端即可。

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # H5 静态资源（指向 HBuilderX 的 h5 打包产物目录）
    root /data/www/pm-mobile;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;      # hash 路由，兜底回 index.html
    }

    # 后端 API 反代：/api/xxx  ->  http://后端:8187/xxx
    location /api/ {
        proxy_pass http://192.168.1.156:8187/; # 末尾 “/” 会剥离 /api 前缀
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20m;              # 上传预留
    }
}
```

- `proxy_pass` 末尾的 `/` 很关键：带它才会把 `/api/` 剥掉再转发，后端收到的仍是原始路径（如 `/system/user/list`）。若后端本身要求带 `/api` 前缀访问，则去掉末尾的 `/`。
- H5 路由为 hash 模式、`router.base` 为 `./`（相对），部署在根目录或子目录一般都不用改；如需固定子目录可在 `manifest.json` 的 `h5.router.base` 调整。
- 前端已移除所有「接口地址」配置入口（登录页与「我的」），后端地址完全由部署环境（Nginx）决定；如需临时改地址，改 `config/index.js` 的 `baseURL`。
