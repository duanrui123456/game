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
 * 根据物品类型和位置创建Matter.js物理体
 * @param {Object} itemData 物品数据
 * @returns {Object} Matter.js 物理体
 */
export const createItemBody = (itemData) => {
  const { id, type, position, level } = itemData;
  const itemInfo = ITEMS_INFO[type];
  
  // 获取基于关卡的物理属性
  const levelProperties = getPhysicalPropertiesByLevel(level || 1);
  
  // 合并物理属性
  const options = {
    ...levelProperties,
    label: id,
    isDraggable: true,
  };

  let body;

  if (itemInfo.shape === 'circle') {
    body = Matter.Bodies.circle(
      position.x,
      position.y,
      itemInfo.radius,
      options
    );
  } else {
    body = Matter.Bodies.rectangle(
      position.x,
      position.y,
      itemInfo.width,
      itemInfo.height,
      options
    );
  }
  
  // 如果关卡大于1，给物体添加初始速度
  if (level > 1 && levelProperties.initialVelocity) {
    const initialVelocity = typeof levelProperties.initialVelocity === 'function' 
      ? levelProperties.initialVelocity(id.charCodeAt(id.length - 1) % 10) // 使用ID的最后一个字符作为索引
      : levelProperties.initialVelocity;
      
    Matter.Body.setVelocity(body, initialVelocity);
  }

  return body;
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
 * 检查一个Matter.js物理体是否在指定的矩形区域内
 * @param {Object} body Matter.js物理体
 * @param {Object} rect 矩形区域 {x, y, width, height}
 * @returns {boolean} 是否在区域内
 */
export const isBodyInRect = (body, rect) => {
  const position = body.position;
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
 * 根据关卡等级获取物体的物理属性
 * @param {number} level 当前关卡等级
 * @returns {Object} 物理属性对象
 */
export const getPhysicalPropertiesByLevel = (level) => {
  // 基础属性
  const baseProperties = {
    restitution: 0.2,  // 弹性系数
    friction: 0.1,     // 摩擦力
    frictionAir: 0.02, // 空气摩擦力
    density: 0.001,    // 密度
    sleepThreshold: 30, // 休眠阈值
    slop: 0.5          // 碰撞容差
  };
  
  // 根据关卡调整属性
  switch (level) {
    case 1:
      // 第一关：物体静止
      return {
        ...baseProperties,
        frictionAir: 0.2,    // 较高的空气摩擦力使物体更快停下
        isStatic: false,     // 物体不是静态的
        initialVelocity: { x: 0, y: 0 } // 初始速度为0
      };
    
    case 2:
      // 第二关：物体缓慢移动
      return {
        ...baseProperties,
        frictionAir: 0.1,    // 降低空气摩擦力
        isStatic: false,
        initialVelocity: (index) => {
          // 根据索引给物体一个小的随机速度
          return {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
          };
        }
      };
    
    case 3:
      // 第三关：物体中速移动
      return {
        ...baseProperties,
        frictionAir: 0.05,   // 更低的空气摩擦力
        restitution: 0.4,    // 更高的弹性
        initialVelocity: (index) => {
          return {
            x: (Math.random() - 0.5) * 1.0,
            y: (Math.random() - 0.5) * 1.0
          };
        }
      };
    
    case 4:
      // 第四关：物体较快移动
      return {
        ...baseProperties,
        frictionAir: 0.02,   // 低空气摩擦力
        restitution: 0.6,    // 高弹性
        friction: 0.05,      // 低摩擦力
        initialVelocity: (index) => {
          return {
            x: (Math.random() - 0.5) * 1.5,
            y: (Math.random() - 0.5) * 1.5
          };
        }
      };
    
    case 5:
    default:
      // 第五关及以上：物体快速移动
      return {
        ...baseProperties,
        frictionAir: 0.01,    // 极低空气摩擦力
        restitution: 0.8,     // 极高弹性
        friction: 0.02,       // 极低摩擦力
        initialVelocity: (index) => {
          return {
            x: (Math.random() - 0.5) * 2.0,
            y: (Math.random() - 0.5) * 2.0
          };
        }
      };
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
 * @param {number} physicsWidth 物理区域宽度
 * @param {number} physicsHeight 物理区域高度
 * @returns {Object} 生成的物品（不包含Matter.js物理体）
 */
export const generateRandomItem = (levelConfig, physicsWidth, physicsHeight) => {
  const { itemTypesToGenerate } = levelConfig;
  const type = getRandomItemType(itemTypesToGenerate);
  const itemInfo = ITEMS_INFO[type];
  const id = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const radius = itemInfo.shape === 'circle' ? itemInfo.radius : Math.max(itemInfo.width, itemInfo.height) / 2;
  const position = getRandomPosition(physicsWidth, physicsHeight, radius);

  return {
    id,
    type,
    position,
    level: levelConfig.level
  };
}; 