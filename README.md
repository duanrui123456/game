# Supermarket Sorter Game (超市分拣游戏)

一个基于 React.js 和 Tailwind CSS 构建的互动式网页游戏，模拟超市分拣员的工作流程。玩家需要在规定时间内，将游戏区域中的商品分拣到指定区域，以匹配订单需求。

## 项目描述

本项目旨在创建一个有趣的网页游戏，让用户体验超市分拣的乐趣。游戏界面分为游戏区域（左侧）和控制区（右侧），控制区包含订单显示和分拣放置区。玩家通过点击物品完成分拣，游戏根据时间和准确率进行评分，共设五个关卡，难度递增。

## 特性

*   **响应式布局:** 使用 Tailwind CSS 构建，确保在不同设备上都能良好显示。
*   **动画效果:** 物品具有随机移动动画，随着关卡增加动画速度加快。
*   **随机物品生成:** 在游戏区域中随机生成不同类型的商品（蔬菜、水果、肉类、鸡蛋等）。
*   **订单管理:** 右侧显示当前关卡的订单列表，列出需要分拣的商品及其数量。
*   **分拣区域:** 右侧下方区域作为分拣放置区，玩家点击符合订单的物品将其收集。
*   **点击交互:** 玩家可以直接点击游戏区域中的物品进行收集。
*   **订单核对与验证:** 提供"完成分拣"按钮，核对分拣区域的物品是否与订单匹配。
*   **实时计时器:** 每个关卡有时间限制，游戏过程中显示剩余时间。
*   **评分系统:** 根据分拣时间和准确率计算得分。
*   **多关卡设计:** 共五个关卡，难度随关卡数增加（时间减少，物品增多，订单复杂）。
*   **游戏状态管理:** 管理游戏流程（开始、进行中、关卡完成、游戏结束）。
*   **音效系统:** 包含点击音效、正确/错误音效和烟花特效音效。
*   **视觉反馈:** 包含分数动画和烟花特效。

## 技术栈

*   **Frontend Framework:** React.js
*   **Styling:** Tailwind CSS
*   **Language:** JavaScript

## 项目架构

本项目采用组件化的 React 架构，并通过 React Hooks 进行状态管理。

1.  **App 根组件 (`src/App.js`):**
    *   作为游戏的入口组件。
    *   负责整体布局，包含游戏区域和控制面板。
    *   使用 React Hooks (`useState`, `useReducer`) 管理全局游戏状态（当前关卡、总得分、游戏状态等）。
    *   协调子组件之间的交互和数据流。

2.  **组件 (`src/components/`):**
    *   **`GameArea`:** 游戏主区域，负责渲染和管理游戏物品。
    *   **`ControlPanel`:** 右侧的控制区域容器，包含订单显示和分拣区。
    *   **`OrderDisplay`:** 显示当前关卡的订单列表，根据游戏状态标记已分拣或缺少的物品。
    *   **`SortingZone`:** 分拣物品放置的区域。
    *   **`TimerDisplay`:** 显示倒计时。
    *   **`ScoreDisplay`:** 显示当前得分。
    *   **`LevelIndicator`:** 显示当前关卡。
    *   **`CheckButton`:** 触发分拣核对逻辑。
    *   **`GameStatusOverlay`:** 显示游戏开始、关卡完成、游戏结束、分数等信息的覆盖层。
    *   **`Fireworks`:** 烟花特效组件。
    *   **`ScoreAnimation`:** 分数动画组件。
    *   **`SoundEffects`:** 音效管理组件。
    *   **`BackgroundMusic`:** 背景音乐组件。

3.  **状态管理 (React Hooks):**
    *   使用 `useState` 管理简单的状态，如 `gameState`, `timeLeft`, `totalScore`, `currentLevel`.
    *   使用 `useReducer` 管理更复杂的状态对象，例如包含物品列表、订单详情的状态。
    *   `App` 组件持有主要状态，并通过 props 将相关部分传递给子组件。

4.  **游戏逻辑 (`src/utils/gameLogic.js`):**
    *   将游戏的核心逻辑函数抽象出来，不直接放在组件中，便于管理和测试。
    *   **物品生成:** 根据关卡配置，生成随机物品列表。
    *   **订单生成:** 根据关卡配置生成订单列表，更新状态。
    *   **核对逻辑 (`checkOrder`):** 接收当前订单状态和分拣区物品列表，比较并返回核对结果（是否成功，缺少的物品，多余的物品）。
    *   **评分计算 (`calculateScore`):** 根据剩余时间和核对结果计算得分。
    *   **关卡配置 (`src/utils/gameConfig.js`):** 存储每个关卡的详细参数。

## 项目结构

```
/
├── node_modules/
├── public/             // 存放静态文件，例如商品图片和音效
│   ├── images/
│   │   └── ...
│   ├── voice/
│   │   └── ...
│   └── index.html      // React 应用入口
├── src/
│   ├── App.js          // 根组件，管理全局状态和布局
│   ├── index.js        // React DOM 渲染入口
│   ├── components/
│   │   ├── GameArea.js        // 游戏区域组件
│   │   ├── ControlPanel.js    // 右侧面板容器
│   │   ├── OrderDisplay.js    // 订单列表
│   │   ├── SortingZone.js     // 分拣区域
│   │   ├── TimerDisplay.js    // 计时器显示
│   │   ├── ScoreDisplay.js    // 分数显示
│   │   ├── LevelIndicator.js  // 关卡指示器
│   │   ├── CheckButton.js     // 核对按钮
│   │   ├── GameStatusOverlay.js // 游戏状态覆盖层
│   │   ├── Fireworks.js       // 烟花特效
│   │   ├── ScoreAnimation.js  // 分数动画
│   │   ├── SoundEffects.js    // 音效管理
│   │   └── BackgroundMusic.js // 背景音乐
│   ├── utils/
│   │   ├── gameConfig.js   // 各关卡配置
│   │   └── gameLogic.js    // 游戏核心逻辑函数
│   └── styles/
│       └── index.css     // TailwindCSS 入口
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 如何运行项目

1.  克隆仓库:
    ```bash
    git clone <你的仓库地址>
    cd supermarket-sorter-game
    ```
2.  安装依赖:
    ```bash
    npm install
    # 或者 yarn install
    # 或者 pnpm install
    ```
3.  启动开发服务器:
    ```bash
    npm start
    # 或者 yarn start
    # 或者 pnpm start
    ```
4.  在浏览器中打开 `http://localhost:3000` (或其他提示的地址)。

## 贡献

欢迎贡献！请提交 Pull Request。

## License

本项目使用 MIT License。

---
