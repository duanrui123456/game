/**
 * 游戏区域组件
 * 使用React直接渲染和管理商品
 */

import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { ITEMS_INFO } from '../utils/gameConfig';
import './GameArea.css';

// 移动动画类型
const MOVE_ANIMATIONS = ['move-right', 'move-left', 'move-up', 'move-down', 'move-circle', 'move-zigzag'];

// 获取随机移动动画类型
const getRandomMoveAnimation = () => {
  const randomIndex = Math.floor(Math.random() * MOVE_ANIMATIONS.length);
  return MOVE_ANIMATIONS[randomIndex];
};

// 优化的游戏物品组件，使用memo减少不必要的重渲染
const GameItem = memo(({ item, itemInfo, onClick }) => {
  // 计算物品尺寸和样式
  const itemStyle = useMemo(() => {
    let style = {
      backgroundColor: itemInfo.color,
      left: `${item.x}px`,
      top: `${item.y}px`,
    };

    // 如果有移动动画，设置动画持续时间
    if (item.moveAnimation && item.moveDuration) {
      style['--move-duration'] = `${item.moveDuration}s`;
    }

    // 根据物品形状设置不同的样式
    if (itemInfo.shape === 'circle') {
      style = {
        ...style,
        width: `${itemInfo.radius * 2}px`,
        height: `${itemInfo.radius * 2}px`,
        marginLeft: `-${itemInfo.radius}px`,
        marginTop: `-${itemInfo.radius}px`,
      };
    } else {
      style = {
        ...style,
        width: `${itemInfo.width}px`,
        height: `${itemInfo.height}px`,
        marginLeft: `-${itemInfo.width / 2}px`,
        marginTop: `-${itemInfo.height / 2}px`,
      };
    }

    return style;
  }, [item.x, item.y, item.moveAnimation, item.moveDuration, itemInfo]);

  // 添加动画类
  const appearClass = item.animating ? 'game-item-disappear' : 'game-item-appear';
  const moveClass = item.moveAnimation || '';

  return (
    <div
      key={item.id}
      className={`game-item ${itemInfo.shape} ${appearClass} ${moveClass}`}
      style={itemStyle}
      onClick={onClick}
    >
      {itemInfo.emoji || itemInfo.name.charAt(0)}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只有在这些属性变化时才重新渲染
  return (
    prevProps.item.x === nextProps.item.x &&
    prevProps.item.y === nextProps.item.y &&
    prevProps.item.animating === nextProps.item.animating &&
    prevProps.item.moveAnimation === nextProps.item.moveAnimation &&
    prevProps.item.moveDuration === nextProps.item.moveDuration
  );
});

const GameArea = ({
  items = [],
  onItemDropped,
  getSortingZoneRect,
  gameIsActive,
  currentLevel = 1,
  currentOrder = []
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [gameItems, setGameItems] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasInitializedItems, setHasInitializedItems] = useState(false);
  const prevLevelRef = useRef(currentLevel);

  // 获取容器尺寸和更新尺寸的函数
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });
  }, []);

  // 获取容器尺寸
  useEffect(() => {
    if (!containerRef.current) return;

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  // 处理关卡变化
  useEffect(() => {
    // 检测关卡变化
    if (currentLevel !== prevLevelRef.current) {
      console.log(`关卡变化: ${prevLevelRef.current} -> ${currentLevel}`);
      setHasInitializedItems(false);
      prevLevelRef.current = currentLevel;
    }
  }, [currentLevel]);

  // 处理物品数据 - 只在关卡开始时初始化一次 - 性能优化版本
  useEffect(() => {
    if (!gameIsActive || hasInitializedItems || dimensions.width === 0) {
      if (!gameIsActive) {
        setGameItems([]);
      }
      return;
    }

    // 计算动画持续时间 - 随着关卡增加，动画速度加快
    const baseDuration = 15; // 基础动画时间（秒）
    const speedFactor = Math.max(0.3, 1 - (currentLevel - 1) * 0.15); // 每关减少15%的时间
    const moveDuration = baseDuration * speedFactor;

    // 使用requestIdleCallback或setTimeout延迟生成物品，避免阻塞主线程
    const generateItems = () => {
      // 根据订单生成至少两倍数量的物品
      let itemsToGenerate = [];
      const timestamp = Date.now();

      // 如果有订单，确保每种类型的物品至少是订单所需的两倍
      if (currentOrder && currentOrder.length > 0) {
        // 创建订单物品类型和数量的映射
        const orderItemCounts = {};
        currentOrder.forEach(orderItem => {
          orderItemCounts[orderItem.type] = (orderItemCounts[orderItem.type] || 0) + orderItem.required;
        });

        // 为每种订单物品类型生成至少两倍的物品
        Object.entries(orderItemCounts).forEach(([type, count]) => {
          const doubleCount = count * 2;
          for (let i = 0; i < doubleCount; i++) {
            itemsToGenerate.push({
              id: `item-${timestamp}-${type}-${i}`,
              type: type,
              level: currentLevel
            });
          }
        });

        // 添加一些随机物品以增加多样性 - 减少额外物品数量以提高性能
        const extraItemCount = 3 + currentLevel; // 减少额外物品数量
        const availableTypes = Object.keys(ITEMS_INFO);

        for (let i = 0; i < extraItemCount; i++) {
          const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          itemsToGenerate.push({
            id: `item-${timestamp}-extra-${i}`,
            type: randomType,
            level: currentLevel
          });
        }
      } else {
        // 如果没有订单，使用传入的物品
        itemsToGenerate = [...items];
      }

      // 预先计算物品位置和动画，减少循环中的计算
      const moveAnimations = [];
      for (let i = 0; i < 10; i++) {
        moveAnimations.push(getRandomMoveAnimation());
      }

      // 将物品转换为游戏物品，添加随机位置和动画
      const newGameItems = itemsToGenerate.map((item, index) => {
        // 获取物品信息
        const itemInfo = ITEMS_INFO[item.type];

        // 计算物品在游戏区域的随机位置
        const padding = Math.max(itemInfo.radius || 0,
                                (itemInfo.width || 0) / 2,
                                (itemInfo.height || 0) / 2) + 20;

        const x = Math.random() * (dimensions.width - 2 * padding) + padding;
        const y = Math.random() * (dimensions.height - 2 * padding) + padding;

        // 使用预先计算的动画，减少随机数生成
        const moveAnimation = moveAnimations[index % moveAnimations.length];

        return {
          ...item,
          x,
          y,
          visible: true,
          animating: false,
          moveAnimation,
          moveDuration
        };
      });

      setGameItems(newGameItems);
      setHasInitializedItems(true);
    };

    // 使用requestIdleCallback或setTimeout延迟生成物品
    if (window.requestIdleCallback) {
      window.requestIdleCallback(generateItems);
    } else {
      setTimeout(generateItems, 0);
    }
  }, [items, dimensions, gameIsActive, hasInitializedItems, currentLevel, currentOrder]);

  // 处理物品点击
  const handleItemClick = useCallback((item) => {
    if (!gameIsActive || isAnimating) return;

    // 播放点击音效
    if (window.gameAudio && window.gameAudio.playTapSound) {
      window.gameAudio.playTapSound();
    }

    // 检查物品是否在订单列表中
    const isItemInOrder = currentOrder.some(orderItem => orderItem.type === item.type);

    if (!isItemInOrder) {
      // 如果物品不在订单列表中，不做任何处理
      console.log("物品不在订单列表中，不会消失:", item.type);
      return;
    }

    // 标记物品为动画状态
    setIsAnimating(true);

    // 更新物品状态为动画中
    setGameItems(prevItems =>
      prevItems.map(gameItem =>
        gameItem.id === item.id
          ? { ...gameItem, animating: true }
          : gameItem
      )
    );

    // 动画结束后移除物品并调用回调
    setTimeout(() => {
      // 移除物品
      setGameItems(prevItems =>
        prevItems.filter(gameItem => gameItem.id !== item.id)
      );

      // 调用回调函数
      onItemDropped(item);

      // 重置动画状态
      setIsAnimating(false);
    }, 300); // 动画持续时间
  }, [gameIsActive, isAnimating, onItemDropped, currentOrder]);

  // 渲染游戏物品 - 使用记忆化组件减少重渲染
  const renderGameItems = useCallback(() => {
    return gameItems.map(item => {
      const itemInfo = ITEMS_INFO[item.type];
      return (
        <GameItem
          key={item.id}
          item={item}
          itemInfo={itemInfo}
          onClick={() => handleItemClick(item)}
        />
      );
    });
  }, [gameItems, handleItemClick]);



  return (
    <div
      ref={containerRef}
      className="game-area"
      onClick={(e) => {
        // 播放点击音效
        if (window.gameAudio && window.gameAudio.playTapSound && e.target === e.currentTarget) {
          window.gameAudio.playTapSound();
        }
      }}
    >
      {/* 渲染游戏物品 */}
      {renderGameItems()}

      {/* 游戏提示信息 */}
      <div className="game-info">
        点击订单中的商品即可将其收集，不在订单中的商品点击无效
      </div>
    </div>
  );
};

export default GameArea;
