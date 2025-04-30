/**
 * 游戏逻辑文件
 * 包含游戏的核心逻辑功能
 */

import Matter from 'matter-js';
import { ITEM_TYPES, ITEMS_INFO, LEVELS } from './gameConfig';

/**
 * 生成一个随机范围内的整数
 * @param {number} min 最小值（包含）
 * @param {number} max 最大值（包含）
 * @returns {number} 随机整数
 */
export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 生成一个随机物品类型
 * @param {Array<string>} availableTypes 可用的物品类型数组
 * @returns {string} 随机物品类型
 */
export const getRandomItemType = (availableTypes) => {
  const index = getRandomInt(0, availableTypes.length - 1);
  return availableTypes[index];
};

/**
 * 生成随机位置（在物理区域内）
 * @param {number} areaWidth 物理区域宽度
 * @param {number} areaHeight 物理区域高度
 * @param {number} itemRadius 物品半径（用于边界保护）
 * @returns {{x: number, y: number}} 随机位置坐标
 */
export const getRandomPosition = (areaWidth, areaHeight, itemRadius) => {
  // 确保物品不会生成在边界上或过于靠近边界
  const padding = itemRadius * 2;
  return {
    x: getRandomInt(padding, areaWidth - padding),
    y: getRandomInt(padding, areaHeight - padding),
  };
};

/**
 * 根据关卡配置生成物品
 * @param {Object} levelConfig 关卡配置
 * @param {number} physicsWidth 物理区域宽度
 * @param {number} physicsHeight 物理区域高度
 * @returns {Array<Object>} 生成的物品数组（不包含Matter.js物理体）
 */
export const generateItems = (levelConfig, physicsWidth, physicsHeight) => {
  const { itemTypesToGenerate, itemCount } = levelConfig;
  const count = getRandomInt(itemCount.min, itemCount.max);
  const items = [];

  for (let i = 0; i < count; i++) {
    const type = getRandomItemType(itemTypesToGenerate);
    const itemInfo = ITEMS_INFO[type];
    const id = `item-${Date.now()}-${i}`;
    const radius = itemInfo.shape === 'circle' ? itemInfo.radius : Math.max(itemInfo.width, itemInfo.height) / 2;
    const position = getRandomPosition(physicsWidth, physicsHeight, radius);

    items.push({
      id,
      type,
      position,
      level: levelConfig.level // 添加关卡信息
    });
  }

  return items;
};

/**
 * 根据物品类型和位置创建游戏物品
 * @param {Object} itemData 物品数据
 * @returns {Object} 游戏物品
 */
export const createGameItem = (itemData) => {
  const { id, type, position, level } = itemData;
  const itemInfo = ITEMS_INFO[type];

  return {
    id,
    type,
    x: position.x,
    y: position.y,
    level: level || 1,
    visible: true,
    animating: false
  };
};

/**
 * 生成随机订单
 * @param {Object} levelConfig 关卡配置
 * @returns {Array<Object>} 订单项数组
 */
export const generateOrder = (levelConfig) => {
  const { itemTypesToGenerate, orderComplexity, orderQuantity } = levelConfig;
  const order = [];
  const selectedTypes = [];

  // 随机选择订单中的物品类型
  while (selectedTypes.length < orderComplexity && selectedTypes.length < itemTypesToGenerate.length) {
    const type = getRandomItemType(itemTypesToGenerate);
    if (!selectedTypes.includes(type)) {
      selectedTypes.push(type);
    }
  }

  // 为每种选中的物品类型生成订单项
  selectedTypes.forEach(type => {
    const quantity = getRandomInt(orderQuantity.min, orderQuantity.max);
    order.push({
      type,
      name: ITEMS_INFO[type].name,
      required: quantity,
      collected: 0,
      status: 'pending', // 'pending', 'sorted', 'missing'
    });
  });

  return order;
};

/**
 * 检查一个坐标点是否在指定的矩形区域内
 * @param {Object} point 坐标点 {x, y}
 * @param {Object} rect 矩形区域 {x, y, width, height}
 * @returns {boolean} 是否在区域内
 */
export const isPointInRect = (point, rect) => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * 检查一个游戏物品是否在指定的矩形区域内
 * @param {Object} item 游戏物品
 * @param {Object} rect 矩形区域 {x, y, width, height}
 * @returns {boolean} 是否在区域内
 */
export const isItemInRect = (item, rect) => {
  const position = { x: item.x, y: item.y };
  return isPointInRect(position, rect);
};

/**
 * 核对分拣区的物品与订单是否匹配
 * @param {Array<Object>} order 订单数组
 * @param {Array<Object>} itemsInSortingZone 分拣区的物品数组
 * @returns {Object} 核对结果 {success, updatedOrder, missingItems, extraItems}
 */
export const checkOrder = (order, itemsInSortingZone) => {
  const updatedOrder = JSON.parse(JSON.stringify(order));
  const collectedCounts = {};
  let success = true;

  // 初始化已分拣物品计数
  updatedOrder.forEach(item => {
    collectedCounts[item.type] = 0;
  });

  // 统计已分拣物品数量
  itemsInSortingZone.forEach(item => {
    if (collectedCounts.hasOwnProperty(item.type)) {
      collectedCounts[item.type]++;
    }
  });

  // 更新订单状态
  updatedOrder.forEach(item => {
    item.collected = collectedCounts[item.type] || 0;

    if (item.collected >= item.required) {
      item.status = 'sorted';
    } else {
      item.status = 'missing';
      success = false;
    }
  });

  // 确定缺少的物品和多余的物品
  const missingItems = updatedOrder.filter(item => item.status === 'missing');
  const extraItems = [];

  itemsInSortingZone.forEach(item => {
    const orderItem = updatedOrder.find(oi => oi.type === item.type);
    if (!orderItem || collectedCounts[item.type] > orderItem.required) {
      extraItems.push(item);
    }
  });

  return {
    success,
    updatedOrder,
    missingItems,
    extraItems,
  };
};

/**
 * 计算游戏得分
 * @param {number} timeLeft 剩余时间
 * @param {Object} checkResult 核对结果
 * @param {Object} levelConfig 关卡配置
 * @returns {number} 得分
 */
export const calculateScore = (timeLeft, checkResult, levelConfig) => {
  if (!checkResult.success) {
    return 0;
  }

  // 基础分
  const baseScore = 100 * levelConfig.level;

  // 时间加成
  const timeBonus = Math.floor(timeLeft * 2);

  // 准确度加成
  const requiredItemCount = checkResult.updatedOrder.reduce((sum, item) => sum + item.required, 0);
  const sortedItemCount = checkResult.updatedOrder.reduce((sum, item) => sum + item.collected, 0);

  const extraItemsCount = checkResult.extraItems.length;

  // 多余物品会降低准确度
  const accuracy = requiredItemCount > 0
    ? Math.max(0, (requiredItemCount - extraItemsCount) / requiredItemCount)
    : 0;

  const accuracyBonus = Math.floor(accuracy * 100) * levelConfig.level;

  return baseScore + timeBonus + accuracyBonus;
};

/**
 * 检查特定类型的物品是否已经达到订单需求的数量
 * @param {Array<Object>} order 订单数组
 * @param {Array<Object>} itemsInSortingZone 分拣区的物品数组
 * @param {string} itemType 要检查的物品类型
 * @returns {boolean} 如果已经达到或超过需求数量则返回true，否则返回false
 */
export const isItemTypeFullInSortingZone = (order, itemsInSortingZone, itemType) => {
  // 查找订单中的该类型物品
  const orderItem = order.find(item => item.type === itemType);

  // 如果订单中没有该类型，则不允许添加
  if (!orderItem) {
    return true;
  }

  // 计算该类型已在分拣区的数量
  const collectedCount = itemsInSortingZone.filter(item => item.type === itemType).length;

  // 检查是否已达到或超过需求数量
  return collectedCount >= orderItem.required;
};

/**
 * 根据关卡等级获取动画持续时间
 * @param {number} level 当前关卡等级
 * @returns {number} 动画持续时间（秒）
 */
export const getAnimationDurationByLevel = (level) => {
  // 基础动画时间
  const baseDuration = 15; // 秒

  // 根据关卡调整动画速度
  switch (level) {
    case 1:
      // 第一关：较慢
      return baseDuration;

    case 2:
      // 第二关：稍快
      return baseDuration * 0.85;

    case 3:
      // 第三关：中速
      return baseDuration * 0.7;

    case 4:
      // 第四关：较快
      return baseDuration * 0.55;

    case 5:
    default:
      // 第五关及以上：快速
      return baseDuration * 0.4;
  }
};

/**
 * 获取物品生成间隔时间（毫秒）
 * @param {number} level 当前关卡
 * @returns {number} 生成间隔（毫秒）
 */
export const getItemGenerationInterval = (level) => {
  // 基础间隔时间
  const baseInterval = 10000; // 10秒

  // 随着关卡提高，间隔时间缩短
  switch(level) {
    case 1:
      return 0; // 第一关不自动生成新物品
    case 2:
      return baseInterval;
    case 3:
      return baseInterval * 0.7;
    case 4:
      return baseInterval * 0.5;
    case 5:
      return baseInterval * 0.3;
    default:
      return baseInterval * 0.3; // 高级关卡保持较短间隔
  }
};

/**
 * 生成一个随机物品，用于动态添加到游戏中
 * @param {Object} levelConfig 关卡配置
 * @param {number} areaWidth 游戏区域宽度
 * @param {number} areaHeight 游戏区域高度
 * @returns {Object} 生成的游戏物品
 */
export const generateRandomItem = (levelConfig, areaWidth, areaHeight) => {
  const { itemTypesToGenerate } = levelConfig;
  const type = getRandomItemType(itemTypesToGenerate);
  const itemInfo = ITEMS_INFO[type];
  const id = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const radius = itemInfo.shape === 'circle' ? itemInfo.radius : Math.max(itemInfo.width, itemInfo.height) / 2;
  const position = getRandomPosition(areaWidth, areaHeight, radius);
  const moveDuration = getAnimationDurationByLevel(levelConfig.level);

  return {
    id,
    type,
    x: position.x,
    y: position.y,
    level: levelConfig.level,
    visible: true,
    animating: false,
    moveAnimation: Math.random() > 0.5 ? 'move-circle' : 'move-zigzag',
    moveDuration
  };
};