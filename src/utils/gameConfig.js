/**
 * 游戏配置文件
 * 定义各关卡的难度、时间限制、物品类型等
 */

// 定义所有可用的商品类型
export const ITEM_TYPES = {
  APPLE: 'apple',
  BANANA: 'banana',
  BROCCOLI: 'broccoli',
  CARROT: 'carrot',
  CHICKEN: 'chicken',
  EGGS: 'eggs',
  FISH: 'fish',
  MILK: 'milk',
  ORANGE: 'orange',
  TOMATO: 'tomato',
};

// 每种物品的图片、物理属性等信息
export const ITEMS_INFO = {
  [ITEM_TYPES.APPLE]: {
    name: '苹果',
    image: 'apple.png',
    shape: 'circle',
    radius: 20,
    density: 0.001,
    restitution: 0.4,
    friction: 0.1,
    color: '#ff0000',
  },
  [ITEM_TYPES.BANANA]: {
    name: '香蕉',
    image: 'banana.png', 
    shape: 'rectangle',
    width: 60,
    height: 20,
    density: 0.0008,
    restitution: 0.4,
    friction: 0.1,
    color: '#ffff00',
  },
  [ITEM_TYPES.BROCCOLI]: {
    name: '西兰花',
    image: 'broccoli.png',
    shape: 'circle',
    radius: 25,
    density: 0.0007,
    restitution: 0.3,
    friction: 0.2,
    color: '#00ff00',
  },
  [ITEM_TYPES.CARROT]: {
    name: '胡萝卜',
    image: 'carrot.png',
    shape: 'rectangle',
    width: 50,
    height: 15,
    density: 0.0009,
    restitution: 0.4,
    friction: 0.1,
    color: '#ff7800',
  },
  [ITEM_TYPES.CHICKEN]: {
    name: '鸡肉',
    image: 'chicken.png',
    shape: 'rectangle',
    width: 45,
    height: 30,
    density: 0.0012,
    restitution: 0.2,
    friction: 0.15,
    color: '#f4a460',
  },
  [ITEM_TYPES.EGGS]: {
    name: '鸡蛋',
    image: 'eggs.png',
    shape: 'circle',
    radius: 15,
    density: 0.0007,
    restitution: 0.5,
    friction: 0.05,
    color: '#f5f5dc',
  },
  [ITEM_TYPES.FISH]: {
    name: '鱼',
    image: 'fish.png',
    shape: 'rectangle',
    width: 55,
    height: 25,
    density: 0.001,
    restitution: 0.3,
    friction: 0.1,
    color: '#87ceeb',
  },
  [ITEM_TYPES.MILK]: {
    name: '牛奶',
    image: 'milk.png',
    shape: 'rectangle',
    width: 30,
    height: 50,
    density: 0.0015,
    restitution: 0.2,
    friction: 0.2,
    color: '#f0f8ff',
  },
  [ITEM_TYPES.ORANGE]: {
    name: '橙子',
    image: 'orange.png',
    shape: 'circle',
    radius: 20,
    density: 0.001,
    restitution: 0.4,
    friction: 0.1,
    color: '#ffa500',
  },
  [ITEM_TYPES.TOMATO]: {
    name: '番茄',
    image: 'tomato.png',
    shape: 'circle',
    radius: 18,
    density: 0.0009,
    restitution: 0.4,
    friction: 0.1,
    color: '#ff6347',
  },
};

// 游戏关卡配置
export const LEVELS = [
  {
    level: 1,
    timeLimit: 60, // 60秒
    itemTypesToGenerate: [
      ITEM_TYPES.APPLE,
      ITEM_TYPES.BANANA,
      ITEM_TYPES.CARROT,
    ],
    itemCount: { min: 8, max: 12 }, // 生成物品数量范围
    orderComplexity: 3, // 订单中的物品种类数
    orderQuantity: { min: 1, max: 2 }, // 每种物品需要的数量范围
  },
  {
    level: 2,
    timeLimit: 75,
    itemTypesToGenerate: [
      ITEM_TYPES.APPLE,
      ITEM_TYPES.BANANA,
      ITEM_TYPES.CARROT,
      ITEM_TYPES.TOMATO,
      ITEM_TYPES.ORANGE,
    ],
    itemCount: { min: 12, max: 16 },
    orderComplexity: 4,
    orderQuantity: { min: 1, max: 3 },
  },
  {
    level: 3,
    timeLimit: 90,
    itemTypesToGenerate: [
      ITEM_TYPES.APPLE,
      ITEM_TYPES.BANANA,
      ITEM_TYPES.CARROT,
      ITEM_TYPES.TOMATO,
      ITEM_TYPES.ORANGE,
      ITEM_TYPES.BROCCOLI,
      ITEM_TYPES.EGGS,
    ],
    itemCount: { min: 15, max: 20 },
    orderComplexity: 5,
    orderQuantity: { min: 2, max: 4 },
  },
  {
    level: 4,
    timeLimit: 100,
    itemTypesToGenerate: [
      ITEM_TYPES.APPLE,
      ITEM_TYPES.BANANA,
      ITEM_TYPES.CARROT,
      ITEM_TYPES.TOMATO,
      ITEM_TYPES.ORANGE,
      ITEM_TYPES.BROCCOLI,
      ITEM_TYPES.EGGS,
      ITEM_TYPES.CHICKEN,
      ITEM_TYPES.FISH,
    ],
    itemCount: { min: 20, max: 25 },
    orderComplexity: 6,
    orderQuantity: { min: 2, max: 5 },
  },
  {
    level: 5,
    timeLimit: 120,
    itemTypesToGenerate: Object.values(ITEM_TYPES),
    itemCount: { min: 25, max: 30 },
    orderComplexity: 8,
    orderQuantity: { min: 3, max: 6 },
  },
];

// 游戏状态常量
export const GAME_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
}; 