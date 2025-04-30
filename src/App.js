import React, { useReducer, useEffect, useCallback, useState } from 'react';
import './App.css';
import GameArea from './components/GameArea';
import ControlPanel from './components/ControlPanel';
import GameStatusOverlay from './components/GameStatusOverlay';
import SortingZone from './components/SortingZone';
import BackgroundMusic from './components/BackgroundMusic';
import SoundEffects from './components/SoundEffects';
import { GAME_STATES, LEVELS, ITEMS_INFO, ITEM_TYPES } from './utils/gameConfig';
import {
  generateItems,
  generateOrder,
  checkOrder,
  calculateScore,
  isItemTypeFullInSortingZone
} from './utils/gameLogic';

// 初始游戏状态
const initialGameState = {
  gameState: GAME_STATES.IDLE,
  currentLevel: 0,
  totalScore: 0,
  timeLeft: null,
  currentOrder: [],
  itemsInPhysics: [],
  itemsInSortingZone: [],
};

// 游戏状态reducer
function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialGameState,
        gameState: GAME_STATES.PLAYING,
        currentLevel: 1,
        timeLeft: LEVELS[0].timeLimit,
        currentOrder: action.payload.order,
        itemsInPhysics: action.payload.items,
      };

    case 'START_LEVEL':
      return {
        ...state,
        gameState: GAME_STATES.PLAYING,
        timeLeft: LEVELS[state.currentLevel - 1].timeLimit,
        currentOrder: action.payload.order,
        itemsInPhysics: action.payload.items,
        itemsInSortingZone: [],
      };

    case 'TICK_TIMER':
      if (state.timeLeft <= 0) {
        // 时间到，游戏结束
        return {
          ...state,
          gameState: GAME_STATES.GAME_OVER,
          timeLeft: 0,
        };
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
      };

    case 'MOVE_ITEM_TO_SORTING':
      // 检查此类型物品是否已达到订单要求数量
      const itemType = action.payload.item.type;
      const orderItem = state.currentOrder.find(item => item.type === itemType);

      if (!orderItem) {
        // 如果订单中没有该类型，则不添加到分拣区，也不从物理区域移除
        return state;
      }

      // 计算该类型已在分拣区的数量
      const collectedCount = state.itemsInSortingZone.filter(item => item.type === itemType).length;

      // 检查是否已达到或超过需求数量
      if (collectedCount >= orderItem.required) {
        // 如果已达到或超过需求数量，则不添加到分拣区，也不从物理区域移除
        return state;
      }

      // 如果未达到需求数量，则添加到分拣区并从物理区域移除
      return {
        ...state,
        itemsInSortingZone: [...state.itemsInSortingZone, action.payload.item],
        itemsInPhysics: state.itemsInPhysics.filter(item => item.id !== action.payload.item.id),
      };

    case 'REMOVE_ITEM_FROM_PHYSICS':
      return {
        ...state,
        itemsInPhysics: state.itemsInPhysics.filter(item => item.id !== action.payload.itemId),
      };

    case 'CHECK_ORDER':
      const checkResult = action.payload.checkResult;
      const levelConfig = LEVELS[state.currentLevel - 1];

      if (checkResult.success) {
        const score = calculateScore(state.timeLeft, checkResult, levelConfig);

        if (state.currentLevel >= LEVELS.length) {
          // 所有关卡完成
          return {
            ...state,
            gameState: GAME_STATES.GAME_OVER,
            totalScore: state.totalScore + score,
            currentOrder: checkResult.updatedOrder,
          };
        } else {
          // 进入下一关
          return {
            ...state,
            gameState: GAME_STATES.LEVEL_COMPLETE,
            totalScore: state.totalScore + score,
            currentOrder: checkResult.updatedOrder,
          };
        }
      } else {
        // 核对失败，更新订单状态但继续游戏
        return {
          ...state,
          currentOrder: checkResult.updatedOrder,
        };
      }

    case 'NEXT_LEVEL':
      return {
        ...state,
        currentLevel: state.currentLevel + 1,
        gameState: GAME_STATES.PLAYING,
        timeLeft: LEVELS[state.currentLevel].timeLimit,
        currentOrder: action.payload.order,
        itemsInPhysics: action.payload.items,
        itemsInSortingZone: [],
      };

    case 'RESTART_GAME':
      return {
        ...initialGameState,
        gameState: GAME_STATES.PLAYING,
        currentLevel: 1,
        timeLeft: LEVELS[0].timeLimit,
        currentOrder: action.payload.order,
        itemsInPhysics: action.payload.items,
      };

    default:
      return state;
  }
}

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [sortingZoneRect, setSortingZoneRect] = useState(null);
  const [notification, setNotification] = useState(null);

  // 将isItemTypeFullInSortingZone函数和itemsInSortingZone暴露给window对象，以便GameArea组件可以使用
  useEffect(() => {
    window.isItemTypeFullInSortingZone = isItemTypeFullInSortingZone;
    window.itemsInSortingZone = gameState.itemsInSortingZone;
  }, [gameState.itemsInSortingZone]);

  // 显示提示信息的函数
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });

    // 3秒后自动清除提示
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  useEffect(() => {
    // 添加拖放事件监听器到整个文档
    const handleDragStart = (e) => {
      // 防止默认的拖放行为，允许自定义处理
      e.preventDefault();
      return false;
    };

    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // 生成关卡物品和订单
  const generateLevelItems = useCallback((level) => {
    const levelConfig = LEVELS[level - 1];
    if (!levelConfig) return { items: [], order: [] };

    // 游戏区域的尺寸
    const areaWidth = 800;
    const areaHeight = 600;

    // 先生成订单
    const order = generateOrder(levelConfig);

    // 然后根据订单生成物品，确保物品数量和种类至少是订单的两倍
    const items = generateItems(levelConfig, areaWidth, areaHeight, order);

    return { items, order };
  }, []);

  // 开始游戏
  const handleStartGame = useCallback(() => {
    const { items, order } = generateLevelItems(1);
    dispatch({ type: 'START_GAME', payload: { items, order } });
  }, [generateLevelItems]);

  // 开始下一关
  const handleStartNextLevel = useCallback(() => {
    const nextLevel = gameState.currentLevel + 1;
    if (nextLevel <= LEVELS.length) {
      const { items, order } = generateLevelItems(nextLevel);
      dispatch({ type: 'NEXT_LEVEL', payload: { items, order } });
    }
  }, [gameState.currentLevel, generateLevelItems]);

  // 重新开始游戏
  const handleRestartGame = useCallback(() => {
    const { items, order } = generateLevelItems(1);
    dispatch({ type: 'RESTART_GAME', payload: { items, order } });
  }, [generateLevelItems]);

  // 物品被点击
  const handleItemDropped = useCallback((item) => {
    console.log("App.js: 物品被点击", item);

    // 检查物品是否在订单列表中
    const orderItem = gameState.currentOrder.find(orderItem => orderItem.type === item.type);

    // 检查此类型物品是否已达到订单要求数量
    const isItemTypeFull = isItemTypeFullInSortingZone(gameState.currentOrder, gameState.itemsInSortingZone, item.type);
    console.log("物品类型是否已满:", isItemTypeFull, "类型:", item.type);

    // 根据物品类型和数量显示不同的提示信息
    if (!orderItem) {
      // 如果物品不在订单列表中
      showNotification(`${ITEMS_INFO[item.type].name} 不在订单列表中，无需收集`, 'warning');
      return; // 不执行任何操作
    } else if (isItemTypeFull) {
      // 如果物品类型已达到订单要求数量
      showNotification(`${ITEMS_INFO[item.type].name}已达到订单需求数量，不能添加更多`, 'warning');
      return; // 不执行任何操作
    }

    // 只有当物品在订单列表中且未达到需求数量时，才将物品添加到分拣区
    dispatch({ type: 'MOVE_ITEM_TO_SORTING', payload: { item } });
  }, [gameState.currentOrder, gameState.itemsInSortingZone, showNotification]);

  // 核对订单
  const handleCheckOrder = useCallback(() => {
    const checkResult = checkOrder(gameState.currentOrder, gameState.itemsInSortingZone);

    // 根据核对结果播放相应的音效
    if (window.gameAudio) {
      if (checkResult.success) {
        // 如果分拣区和清单商品一致，播放correct音效
        window.gameAudio.playCorrectSound();
      } else {
        // 如果分拣区和清单商品不一致，播放alarm音效
        window.gameAudio.playAlarmSound();
      }
    }

    dispatch({ type: 'CHECK_ORDER', payload: { checkResult } });
  }, [gameState.currentOrder, gameState.itemsInSortingZone]);

  // 计时器
  useEffect(() => {
    if (gameState.gameState !== GAME_STATES.PLAYING || gameState.timeLeft === null) {
      return;
    }

    const timerId = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [gameState.gameState, gameState.timeLeft]);

  // 监听游戏状态变化，在关卡完成或游戏结束时播放烟花音效
  useEffect(() => {
    if (gameState.gameState === GAME_STATES.LEVEL_COMPLETE ||
        gameState.gameState === GAME_STATES.GAME_OVER) {
      // 播放烟花音效
      if (window.gameAudio && window.gameAudio.playFireworksSound) {
        window.gameAudio.playFireworksSound();
      }
    }
  }, [gameState.gameState]);

  // 更新分拣区矩形位置的回调函数
  const handleSortingZoneRectUpdate = useCallback((rect) => {
    console.log('App: 更新分拣区矩形', rect);
    setSortingZoneRect(rect);
  }, []);

  // 获取分拣区矩形位置的函数
  const getSortingZoneRect = useCallback(() => {
    return sortingZoneRect;
  }, [sortingZoneRect]);

  return (
    <div className="App min-h-screen bg-gray-900 p-4" style={{fontFamily: 'sans-serif'}}>
      <div className="container mx-auto h-screen flex flex-col">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-center text-white">超市分拣游戏</h1>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* 游戏物理区域 */}
          <div className="w-full md:w-2/3 h-[500px] md:h-full bg-gray-100 rounded-lg">
            <GameArea
              items={gameState.itemsInPhysics}
              onItemDropped={handleItemDropped}
              gameIsActive={gameState.gameState === GAME_STATES.PLAYING}
              currentLevel={gameState.currentLevel}
              currentOrder={gameState.currentOrder}
            />
          </div>

          {/* 控制面板 */}
          <div className="w-full md:w-1/3 h-[500px] md:h-full">
            <ControlPanel
              order={gameState.currentOrder}
              sortedItems={gameState.itemsInSortingZone}
              onSortingZoneRectUpdate={handleSortingZoneRectUpdate}
              onCheckOrder={handleCheckOrder}
              currentLevel={gameState.currentLevel}
              totalScore={gameState.totalScore}
              timeLeft={gameState.timeLeft}
              gameState={gameState.gameState}
            />
          </div>
        </main>
      </div>

      {/* 游戏状态覆盖层 */}
      <GameStatusOverlay
        gameState={gameState.gameState}
        currentLevel={gameState.currentLevel}
        totalScore={gameState.totalScore}
        onStartGame={handleStartGame}
        onStartNextLevel={handleStartNextLevel}
        onRestartGame={handleRestartGame}
      />

      {/* 提示信息 */}
      {notification && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300
          ${notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'}`}
        >
          {notification.message}
        </div>
      )}

      {/* 背景音乐 */}
      <BackgroundMusic gameState={gameState.gameState} />

      {/* 音效管理 */}
      <SoundEffects />
    </div>
  );
}

export default App;
