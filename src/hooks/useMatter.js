/**
 * Matter.js自定义Hook
 * 用于初始化和管理物理引擎
 */

import { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { createItemBody } from '../utils/gameLogic';

// Matter.js 模块
const { Engine, Render, World, Bodies, Events, Mouse, Query } = Matter;

/**
 * 自定义Hook: useMatter
 * 管理Matter.js引擎、世界和物理体
 *
 * @param {React.RefObject} canvasRef Canvas元素的ref
 * @param {number} width Canvas宽度
 * @param {number} height Canvas高度
 * @param {Function} onItemDropped 当物品被放入分拣区的回调
 * @param {Function} getSortingZoneRect 获取分拣区矩形区域的函数
 * @param {Array} items 要添加到物理世界的物品数组
 * @returns {Object} Matter.js引擎、世界和操作函数
 */
const useMatter = (canvasRef, width, height, onItemDropped, getSortingZoneRect, items) => {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const [bodies, setBodies] = useState({});

  // 初始化物理引擎和渲染器
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('初始化Matter.js引擎，画布尺寸:', width, height);

    // 创建引擎
    const engine = Engine.create({
      gravity: { x: 0, y: 0 },
      // 降低物理引擎的更新频率，减少CPU使用
      positionIterations: 4, // 默认6
      velocityIterations: 3, // 默认4
      constraintIterations: 1, // 默认2
      enableSleeping: true, // 使静止物体进入休眠状态，减少计算
    });
    engineRef.current = engine;

    // 创建渲染器
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#f0f0f0',
        pixelRatio: 1, // 强制使用1的像素比，提高性能
        showSleeping: true, // 显示休眠状态的物体
      }
    });
    renderRef.current = render;

    // 创建物理世界边界
    const wallThickness = 50;
    const walls = [
      Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }), // 顶部
      Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }), // 底部
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }), // 左侧
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }), // 右侧
    ];

    // 添加墙壁到世界
    World.add(engine.world, walls);

    // 获取指定点位置的物理体
    function getBodyAtPoint(event) {
      const canvasRect = render.canvas.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
      const clientY = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

      if (!clientX && !clientY) {
        console.log("无法获取点击坐标", event);
        return null;
      }

      const x = clientX - canvasRect.left;
      const y = clientY - canvasRect.top;

      console.log("点击坐标:", x, y);
      console.log("当前物理世界中的物体数量:", engine.world.bodies.length);

      // 限制查询的物体数量
      const maxBodies = 10; // 只检查最靠近点击位置的物体
      let closestBodies = [];

      // 先进行简单的距离筛选，只保留靠近点击位置的物体
      for (let i = 0; i < engine.world.bodies.length; i++) {
        const body = engine.world.bodies[i];
        if (body.label.startsWith('item-')) {
          body.isDraggable = true; // 确保所有物品都是可拖动的

          const dx = body.position.x - x;
          const dy = body.position.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy); // 使用实际距离
          const radius = body.circleRadius || Math.max(body.bounds.max.x - body.bounds.min.x,
                                                    body.bounds.max.y - body.bounds.min.y) / 2;

          // 如果点击位置在物体半径的1.5倍范围内，就认为点击到了这个物体
          if (distance <= radius * 1.5) {
            console.log("找到物体:", body.label, "距离:", distance, "半径:", radius);
            return body;
          }

          if (closestBodies.length < maxBodies) {
            closestBodies.push({ body, distance });
            closestBodies.sort((a, b) => a.distance - b.distance);
          } else if (distance < closestBodies[closestBodies.length - 1].distance) {
            closestBodies[closestBodies.length - 1] = { body, distance };
            closestBodies.sort((a, b) => a.distance - b.distance);
          }
        }
      }

      // 如果没有找到精确匹配，就返回最近的物体
      if (closestBodies.length > 0 && closestBodies[0].distance < 50) {
        console.log("返回最近的物体:", closestBodies[0].body.label, "距离:", closestBodies[0].distance);
        return closestBodies[0].body;
      }

      console.log("没有找到物体");
      return null;
    }

    // 处理点击事件
    function handleClick(e) {
      const body = getBodyAtPoint(e);

      if (!body || !body.isDraggable) return;

      // 不再需要检查分拣区矩形，直接处理点击
      console.log("点击物品，body:", body.label);

      // 找到对应的物品数据
      const itemId = body.label;
      const itemData = Object.values(bodies).find(item => item.body.label === itemId);

      if (itemData) {
        console.log("找到物品数据:", itemData.data);

        // 从物理世界中移除物体
        World.remove(engine.world, body);

        // 从状态中移除
        setBodies(prevBodies => {
          const newBodies = { ...prevBodies };
          delete newBodies[itemId];
          return newBodies;
        });

        // 调用回调函数，只传递物品数据
        onItemDropped(itemData.data);
      } else {
        console.log("找不到物品数据，当前bodies:", bodies);
      }
    }

    // 添加点击事件监听
    render.canvas.addEventListener('click', handleClick);
    render.canvas.addEventListener('touchend', handleClick);
    console.log("已添加点击事件监听器");

    // 添加鼠标按下事件监听器
    // render.canvas.addEventListener('mousedown', (e) => {
    //   console.log('鼠标按下事件触发');
    // });

    // 启动引擎和渲染器，降低更新频率
    // Engine.run(engine); // 默认60fps，改用手动控制更新频率

    // 自定义运行循环，降低更新频率
    const fps = 30; // 将帧率从默认的60降低到30
    const timeStep = 1000 / fps;
    let lastTime = performance.now();
    let engineTimerId;

    const runEngine = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime > timeStep) {
        Engine.update(engine, deltaTime);
        lastTime = currentTime - (deltaTime % timeStep);
      }

      engineTimerId = requestAnimationFrame(runEngine);
    };

    runEngine();
    Render.run(render);

    // 清理函数
    return () => {
      cancelAnimationFrame(engineTimerId);
      Render.stop(render);
      Engine.clear(engine);

      render.canvas.removeEventListener('click', handleClick);
      render.canvas.removeEventListener('touchend', handleClick);

      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, [canvasRef, width, height, onItemDropped, getSortingZoneRect]);

  // 添加或更新物品到物理世界
  useEffect(() => {
    if (!engineRef.current) return;

    // 清理不再需要的物体
    const currentItemIds = items.map(item => item.id);
    Object.keys(bodies).forEach(bodyId => {
      if (!currentItemIds.includes(bodyId)) {
        World.remove(engineRef.current.world, bodies[bodyId].body);
      }
    });

    // 添加新物品
    const newBodies = { ...bodies };

    items.forEach(item => {
      // 如果物品已经存在于物理世界中，则跳过
      if (newBodies[item.id]) return;

      // 创建新的物理体
      const body = createItemBody(item);

      // 添加到物理世界
      World.add(engineRef.current.world, body);

      // 保存到状态中
      newBodies[item.id] = {
        body,
        data: item,
      };
    });

    setBodies(newBodies);
  }, [items, bodies]);

  return {
    engine: engineRef.current,
    bodies,
    isDraggingBody: false
  };
};

export default useMatter;