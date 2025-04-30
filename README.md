
---

# Supermarket Sorter Game (超市分拣游戏)

一个基于 React.js, Matter.js 和 Tailwind CSS 构建的互动式网页游戏，模拟超市分拣员的工作流程。玩家需要在规定时间内，将物理模拟区域中的商品分拣到指定区域，以匹配订单需求。

## 项目描述

本项目旨在创建一个有趣的网页游戏，让用户体验超市分拣的乐趣。游戏界面分为物理模拟区（左侧）和控制区（右侧），控制区包含订单显示和分拣放置区。玩家通过拖动物品完成分拣，游戏根据时间和准确率进行评分，共设五个关卡，难度递增。

## 特性

*   **响应式布局:** 使用 Tailwind CSS 构建，确保在不同设备上都能良好显示。
*   **Matter.js 物理模拟:** 左侧区域使用 Matter.js 引擎创建逼真的物理环境，物品会受到重力影响并相互碰撞。
*   **随机物品生成:** 在物理区域中随机生成不同类型的商品（蔬菜、水果、肉类、鸡蛋等）。
*   **订单管理:** 右侧显示当前关卡的订单列表，列出需要分拣的商品及其数量。
*   **分拣区域:** 右侧下方区域作为分拣放置区，玩家需将物品拖动至此。
*   **拖放交互:** 玩家可以直接拖动物理区域中的物品。
*   **订单核对与验证:** 提供“完成分拣”按钮，核对分拣区域的物品是否与订单匹配。
*   **实时计时器:** 每个关卡有时间限制，游戏过程中显示剩余时间。
*   **评分系统:** 根据分拣时间和准确率计算得分。
*   **多关卡设计:** 共五个关卡，难度随关卡数增加（时间减少，物品增多，订单复杂）。
*   **游戏状态管理:** 管理游戏流程（开始、进行中、关卡完成、游戏结束）。

## 技术栈

*   **Frontend Framework:** React.js
*   **Physics Engine:** Matter.js
*   **Styling:** Tailwind CSS
*   **Language:** JavaScript 或 TypeScript (推荐使用 TypeScript)

## 项目架构

本项目采用组件化的 React 架构，结合 Matter.js 进行物理模拟，并通过 React Hooks 进行状态管理。

1.  **App 根组件 (`src/App.js` 或 `src/App.tsx`):**
    *   作为游戏的入口组件。
    *   负责整体布局，包含游戏区域和控制面板。
    *   使用 React Hooks (`useState`, `useReducer`) 管理全局游戏状态（当前关卡、总得分、游戏状态等）。
    *   协调子组件之间的交互和数据流。

2.  **组件 (`src/components/`):**
    *   **`Layout` (Optional but Recommended):** 提供基础页面结构，例如使用 Tailwind 进行响应式布局。
    *   **`GameArea`:** 包含 Matter.js 物理画布区域。负责 Matter.js 引擎的初始化、运行、以及在 canvas 上绘制物理世界中的物体。这是一个核心组件，需要与 React State 同步。
    *   **`ControlPanel`:** 右侧的控制区域容器，包含订单显示和分拣区。
    *   **`OrderDisplay`:** 显示当前关卡的订单列表，根据游戏状态标记已分拣或缺少的物品。
    *   **`SortingZone`:** 分拣物品放置的区域。它需要知道自己的 DOM 位置/尺寸，以便游戏逻辑判断物品是否进入此区域。
    *   **`Item`:** 抽象的商品概念。在物理画布上，它对应一个 Matter.js `Body`；在订单或分拣区，它可能是列表项或图标。需要一种方式将物理体与游戏中的逻辑物品关联起来。
    *   **`TimerDisplay`:** 显示倒计时。
    *   **`ScoreDisplay`:** 显示当前得分。
    *   **`LevelIndicator`:** 显示当前关卡。
    *   **`CheckButton`:** 触发分拣核对逻辑。
    *   **`GameStatusOverlay`:** 显示游戏开始、关卡完成、游戏结束、分数等信息的覆盖层。

3.  **Matter.js 集成 (`src/components/GameArea.js`, `src/hooks/useMatter.js`):**
    *   在 `GameArea` 组件中使用 `useEffect` Hook 初始化 Matter.js `Engine`, `World`。
    *   可以创建一个自定义 Hook `useMatter` 来封装 Matter.js 的初始化和清理逻辑，并在 `GameArea` 中使用。
    *   `useMatter` 或 `useEffect` 内部：
        *   创建 Matter.js `Engine`, `World` 实例。
        *   创建地面、边界等静态物理体。
        *   创建 `MouseConstraint` 实现物品拖动。
        *   需要手动在 canvas 上根据 Matter body 的位置和旋转绘制物品（推荐，性能比 DOM 同步好）。或者，如果使用 DOM，则需要监听 Matter 的 update 事件并同步 body 位置到 React state (性能可能受影响)。
        *   运行 `Engine.run()`。
        *   使用 `Events.on` 监听 Matter.js 事件，例如 `collisionStart` 或 `afterUpdate`，用于游戏逻辑（如判断物品是否进入分拣区）。
        *   `useEffect` 的 cleanup 函数中，销毁 Matter.js 实例，停止物理循环和事件监听。
    *   `GameArea` 组件接收游戏状态（如 `itemsInPhysics` 列表）作为 props，并在 canvas 上渲染它们。

4.  **状态管理 (React Hooks):**
    *   使用 `useState` 管理简单的状态，如 `gameState`, `timeLeft`, `totalScore`, `currentLevel`.
    *   使用 `useReducer` 管理更复杂的状态对象，例如包含物品列表、订单详情的状态：
        ```javascript
        const gameReducer = (state, action) => {
          switch (action.type) {
            case 'START_GAME': // ...
            case 'START_LEVEL': // ...
            case 'TICK_TIMER': // ...
            case 'ADD_ITEM_TO_PHYSICS': // ...
            case 'MOVE_ITEM_TO_SORTING': // ...
            case 'CHECK_ORDER': // ...
            case 'LEVEL_COMPLETE': // ...
            case 'GAME_OVER': // ...
            default:
              return state;
          }
        };

        // In App.js
        const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
        ```
    *   `App` 组件持有主要状态，并通过 props 将相关部分传递给子组件 (`GameArea`, `ControlPanel`)。子组件可能需要调用 `dispatch` 函数来触发状态更新。

5.  **游戏逻辑 (`src/utils/gameLogic.js`):**
    *   将游戏的核心逻辑函数抽象出来，不直接放在组件中，便于管理和测试。
    *   **物品生成:** 根据关卡配置，生成随机物品列表，创建 Matter.js body，并返回或通过 dispatch 更新状态。
    *   **订单生成:** 根据关卡配置生成订单列表，更新状态。
    *   **分拣区检测:** 一个函数，接收物品 body 的位置和分拣区的 DOM 矩形，判断是否重叠。
    *   **核对逻辑 (`checkOrder`):** 接收当前订单状态和分拣区物品列表，比较并返回核对结果（是否成功，缺少的物品，多余的物品）。
    *   **评分计算 (`calculateScore`):** 根据剩余时间和核对结果计算得分。
    *   **关卡配置 (`src/utils/gameConfig.js`):** 存储每个关卡的详细参数。

## 项目结构

```
/
├── node_modules/
├── public/             // 存放静态文件，例如商品图片
│   ├── images/
│   │   ├── apple.png
│   │   ├── broccoli.png
│   │   └── ...
│   └── index.html      // React 应用入口
├── src/
│   ├── App.js          // 或 App.tsx - 根组件，管理全局状态和布局
│   ├── index.js        // 或 index.tsx - React DOM 渲染入口
│   ├── components/
│   │   ├── GameArea.js        // 或 .tsx - Matter.js 画布和渲染
│   │   ├── ControlPanel.js    // 或 .tsx - 右侧面板容器
│   │   ├── OrderDisplay.js    // 或 .tsx - 订单列表
│   │   ├── SortingZone.js     // 或 .tsx - 分拣区域 (可能只是一个 div)
│   │   ├── TimerDisplay.js    // 或 .tsx
│   │   ├── ScoreDisplay.js    // 或 .tsx
│   │   ├── LevelIndicator.js  // 或 .tsx
│   │   ├── CheckButton.js     // 或 .tsx
│   │   └── GameStatusOverlay.js // 或 .tsx
│   ├── utils/
│   │   ├── gameConfig.js   // 或 .ts - 各关卡配置
│   │   ├── gameLogic.js    // 或 .ts - 游戏核心逻辑函数
│   │   └── matterUtils.js  // 或 .ts - Matter.js 相关的辅助函数
│   ├── hooks/
│   │   └── useMatter.js    // 或 .ts - Matter.js 自定义 hook
│   └── styles/
│       └── index.css     // 或 .css - TailwindCSS 入口
├── package.json
├── tsconfig.json       // 如果使用 TypeScript
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 编码细节与执行步骤

1.  **环境准备:**
    *   安装 Node.js 和 npm/yarn/pnpm。
    *   创建一个新的 React 项目（推荐使用 Vite: `npm create vite@latest my-game --template react-ts` 或 Create React App: `npx create-react-app my-game --template typescript`）。
    *   集成 Tailwind CSS (按照 Tailwind 官方文档的 Create React App 或 Vite 集成步骤)。
    *   安装 Matter.js: `npm install matter-js` 或 `yarn add matter-js`。

2.  **基础布局 (`src/App.js`, `src/styles/index.css`):**
    *   在 `src/index.js` 中渲染 `App` 组件到 root DOM 元素。
    *   在 `App.js` 中，使用 Tailwind CSS 的 flex 或 grid 布局创建左右两栏布局，左侧 3/4 (`w-3/4`), 右侧 1/4 (`w-1/4`)。确保高度占满视口 (`h-screen`)。
    *   右侧 1/4 区域内部再用 flex 或 grid 分为上下两部分，上方 1/3 订单区，下方 2/3 分拣区 (`h-1/3`, `h-2/3` 或者使用 flex grow)。
    *   确保布局在不同屏幕尺寸下响应式调整（例如，使用响应式前缀 `md:w-3/4`）。

3.  **Matter.js 集成 (`src/components/GameArea.js`, `src/hooks/useMatter.js`):**
    *   创建 `GameArea` 组件，包含一个 `canvas` 元素 (`ref`)。
    *   创建 `useMatter` 自定义 hook。
    *   hook 接收 canvas ref 作为参数。
    *   在 `useEffect` 中初始化 Matter.js Engine, World, MouseConstraint。创建地面、墙壁等静态 body。
    *   hook 应该返回 `engine`, `world` 实例，或者提供添加/移除 body 的方法。
    *   在 `GameArea` 中使用 `useMatter` hook。
    *   在 `GameArea` 的 `useEffect` 中，监听 Matter `afterUpdate` 事件，遍历 `world.bodies` 或特定的物品 bodies，在 canvas 上绘制对应的图形和图片。
    *   清理函数中销毁 Matter 实例，移除事件监听。

4.  **状态管理 (`src/App.js`, `src/utils/gameConfig.js`):**
    *   在 `src/utils/gameConfig.js` 中定义各关卡配置。
    *   在 `App.js` 中使用 `useReducer` 管理游戏状态 (`gameState`, `currentLevel`, `timeLeft`, `totalScore`, `currentOrder`, `itemsInPhysics` - 包含 Matter body 引用和物品类型, `itemsInSortingZone` - 只包含物品类型和ID)。
    *   定义 reducer logic 处理各种 actions (START_GAME, START_LEVEL, TICK_TIMER, ADD_ITEM, MOVE_ITEM, CHECK_ORDER, LEVEL_COMPLETE, GAME_OVER)。

5.  **物品生成与同步 (`src/App.js`, `src/utils/gameLogic.js`, `src/components/GameArea.js`):**
    *   在 `App.js` 的 `useEffect` 或某个函数中（例如，点击开始按钮），根据 `gameConfig` 和当前关卡调用 `gameLogic.js` 中的物品生成函数。
    *   生成函数创建 Matter body，并 dispatch `ADD_ITEM_TO_PHYSICS` action 更新 `itemsInPhysics` 状态。
    *   `GameArea` 组件接收 `itemsInPhysics` 状态作为 prop，并在其渲染循环中根据 body 位置绘制。

6.  **拖放与分拣区检测 (`src/components/GameArea.js`, `src/components/SortingZone.js`, `src/utils/gameLogic.js`, State Management):**
    *   Matter.js `MouseConstraint` 处理拖动本身。
    *   在 `GameArea` 组件的 Matter `afterUpdate` 或 MouseConstraint `end` 事件监听中，检查被拖动物品 body 的位置。
    *   获取 `SortingZone` 组件的 DOM 元素，并使用 `element.getBoundingClientRect()` 获取其位置和尺寸。
    *   在事件处理函数中，调用 `gameLogic.js` 中的分拣区检测函数，判断物品 body 位置是否在分拣区矩形内。
    *   如果物品进入分拣区并释放：
        *   从 Matter World 中移除该 body (`World.remove(world, body)`).
        *   Dispatch `MOVE_ITEM_TO_SORTING` action，从 `itemsInPhysics` 移除物品，添加到 `itemsInSortingZone`。
    *   `SortingZone` 组件根据 `itemsInSortingZone` 状态渲染已分拣物品的图标或列表。

7.  **订单显示 (`src/components/OrderDisplay.js`):**
    *   接收 `currentOrder` 状态作为 prop。
    *   渲染订单列表，显示物品名称、所需数量、已分拣数量。
    *   根据订单项的状态 (`status`) 使用 Tailwind 类添加样式（如红色表示缺少）。

8.  **计时器 (`src/components/TimerDisplay.js`, `src/App.js`):**
    *   在 `App.js` 中，使用 `useEffect` 和 `setInterval` 实现倒计时。
    *   每秒 dispatch `TICK_TIMER` action 更新 `timeLeft` 状态。
    *   `useEffect` 清理函数清除 `setInterval`。
    *   当 `timeLeft` 到 0 时，自动触发核对或游戏结束 logic。
    *   `TimerDisplay` 组件接收 `timeLeft` 作为 prop 并显示。

9.  **核对与验证 (`src/components/CheckButton.js`, `src/App.js`, `src/utils/gameLogic.js`):**
    *   `CheckButton` 组件监听点击事件， dispatch `CHECK_ORDER` action。
    *   在 `App.js` 的 reducer 或一个单独的函数中处理 `CHECK_ORDER`。
    *   调用 `gameLogic.js` 中的 `checkOrder` 函数，传入 `currentOrder` 和 `itemsInSortingZone`。
    *   `checkOrder` 返回核对结果（是否成功，更新后的订单状态）。
    *   根据核对结果更新 `currentOrder` 状态（例如，设置物品状态为 'sorted' 或 'missing'）并在订单显示中反映出来。

10. **评分与关卡晋级 (`src/App.js`, `src/utils/gameLogic.js`):**
    *   在核对成功或时间到时，调用 `gameLogic.js` 中的 `calculateScore` 函数，传入 `timeLeft` 和核对结果。
    *   Dispatch action 更新 `totalScore`。
    *   如果核对成功且不是最后一关，dispatch `LEVEL_COMPLETE` action。
    *   `LEVEL_COMPLETE` 逻辑：检查是否还有下一关。如果有，更新 `currentLevel`，清空 `itemsInPhysics`, `itemsInSortingZone`, `currentOrder`，重置 `timeLeft`，然后 dispatch `START_LEVEL` action。
    *   如果核对成功且是最后一关，或时间到核对失败，dispatch `GAME_OVER` action。

11. **游戏状态显示 (`src/components/GameStatusOverlay.js`):**
    *   接收 `gameState` prop。
    *   使用条件渲染根据 `gameState` ('idle', 'playing', 'level_complete', 'game_over') 显示不同的内容（开始按钮，关卡成功信息，游戏结束信息/总分数）。

12. **难度递增:**
    *   在 `gameConfig.js` 中定义每个关卡的时间限制、生成的物品种类和数量范围、订单中的物品种类和数量。在 `START_LEVEL` 逻辑中读取这些配置。

13. **细节完善:**
    *   将物品图片放置到 `public/images` 目录。
    *   优化 Matter.js 渲染，例如使用 `Matter.Render` 进行调试，但最终在 canvas 上手动绘制图片以提高性能。
    *   添加物品的唯一 ID，便于在物理世界、订单、分拣区之间追踪。
    *   处理边缘情况，例如快速拖动导致的物品丢失。
    *   添加简单的音效（可选）。

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
    (如果是 Vite 项目，可能是 `npm run dev`)
4.  在浏览器中打开 `http://localhost:3000` (或其他提示的地址)。

## 贡献

欢迎贡献！请提交 Pull Request。

## License

本项目使用 MIT License。

---