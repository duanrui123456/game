/**
 * 游戏物理区域组件
 * 使用Matter.js渲染物理引擎和商品
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Matter from 'matter-js';
import useMatter from '../hooks/useMatter';
import { ITEMS_INFO, LEVELS } from '../utils/gameConfig';
import { createItemBody, isBodyInRect, getItemGenerationInterval, generateRandomItem } from '../utils/gameLogic';

const GameArea = ({ 
  items = [], 
  onItemDropped, 
  getSortingZoneRect,
  gameIsActive 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const bodiesRef = useRef({});
  const constraintRef = useRef(null);
  const draggedBodyRef = useRef(null);
  const physicsAreaRef = useRef({ width: 0, height: 0 });
  const originalBodyPropertiesRef = useRef({});
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // 为自动生成物品添加状态
  const [currentLevel, setCurrentLevel] = useState(1);
  const itemGenerationTimerRef = useRef(null);

  // 获取容器尺寸和更新尺寸的函数
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });
    physicsAreaRef.current = { width, height };
    
    if (renderRef.current && renderRef.current.canvas) {
      renderRef.current.canvas.width = width;
      renderRef.current.canvas.height = height;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setCanvasOffset({ x: rect.left, y: rect.top });
    }
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

  // 确保在DOM更新后，分拣区坐标被更新
  useEffect(() => {
    const sortingZoneRect = getSortingZoneRect();
    console.log('GameArea: 当前分拣区坐标', sortingZoneRect);
  }, [getSortingZoneRect]);

  // 使用Matter.js物理引擎
  const { bodies, isDraggingBody } = useMatter(
    canvasRef,
    dimensions.width,
    dimensions.height,
    onItemDropped,
    getSortingZoneRect,
    gameIsActive ? items : []
  );

  // 更新拖动状态
  useEffect(() => {
    setIsDragging(isDraggingBody);
  }, [isDraggingBody]);

  // 手动渲染物品的图片
  useEffect(() => {
    if (!canvasRef.current || !bodies || Object.keys(bodies).length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // 创建图片缓存
    const imageCache = {};
    // 跟踪图片加载错误状态
    const imageErrors = {};
    
    // 绘制函数
    const drawItems = () => {
      if (!ctx || !canvasRef.current) return;
      
      // 清除画布
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // 绘制拖放提示
      if (isDragging) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        // 获取分拣区位置，绘制指向它的箭头
        const sortingZoneRect = getSortingZoneRect();
        if (sortingZoneRect && canvasRef.current) {
          try {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            
            // 计算分拣区在canvas坐标系中的位置
            const zoneDirection = {
              x: sortingZoneRect.x > canvasRect.right ? 1 : 
                 sortingZoneRect.x + sortingZoneRect.width < canvasRect.left ? -1 : 0,
              y: sortingZoneRect.y > canvasRect.bottom ? 1 : 
                 sortingZoneRect.y + sortingZoneRect.height < canvasRect.top ? -1 : 0
            };
            
            // 绘制箭头指向分拣区
            const arrowSize = 30;
            const arrowColor = 'rgba(59, 130, 246, 0.8)';
            
            // 右侧箭头
            if (zoneDirection.x > 0) {
              ctx.fillStyle = arrowColor;
              ctx.beginPath();
              ctx.moveTo(dimensions.width - arrowSize, dimensions.height / 2 - arrowSize);
              ctx.lineTo(dimensions.width, dimensions.height / 2);
              ctx.lineTo(dimensions.width - arrowSize, dimensions.height / 2 + arrowSize);
              ctx.closePath();
              ctx.fill();
              
              // 提示文字
              ctx.font = 'bold 16px Arial';
              ctx.fillStyle = '#3b82f6';
              ctx.textAlign = 'right';
              ctx.fillText('拖到分拣区 →', dimensions.width - arrowSize - 10, dimensions.height / 2 + 5);
            }
          } catch (error) {
            console.error('绘制分拣区指示器时出错:', error);
          }
        }
        
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(10, 10, dimensions.width - 20, dimensions.height - 20);
        ctx.setLineDash([]);
      }
      
      // 绘制每个物品
      Object.values(bodies).forEach(({ body, data }) => {
        const itemInfo = ITEMS_INFO[data.type];
        
        // 如果物体处于休眠状态且不处于拖动中，跳过复杂渲染，使用简单绘制
        const isBeingDragged = isDragging && body.isActive;
        const isSleeping = body.isSleeping && !isBeingDragged;
        
        // 如果物体在屏幕外，跳过渲染
        const isOffScreen = 
          body.position.x < -50 || 
          body.position.x > dimensions.width + 50 || 
          body.position.y < -50 || 
          body.position.y > dimensions.height + 50;
          
        if (isOffScreen) return;
        
        // 如果没有图片信息或图片加载出错，使用颜色填充
        if (!itemInfo.image || imageErrors[data.type]) {
          drawFallbackShape(ctx, body, itemInfo, isBeingDragged);
          return;
        }
        
        // 尝试从缓存获取图片，如果不存在则创建
        if (!imageCache[data.type]) {
          const img = new Image();
          img.src = `/images/${itemInfo.image}`;
          img.onerror = () => {
            console.log(`图片加载失败: ${itemInfo.image}`);
            imageErrors[data.type] = true;
          };
          imageCache[data.type] = img;
        }
        
        const img = imageCache[data.type];
        
        // 如果图片已加载且没有错误，则绘制
        if (img.complete && img.naturalWidth !== 0) {
          try {
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            
            // 如果物体正在被拖动，添加发光效果
            if (isBeingDragged) {
              // 减少阴影模糊半径，提高性能
              ctx.shadowColor = 'rgba(59, 130, 246, 0.7)';
              ctx.shadowBlur = 10; // 降低模糊程度
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              // 放大一点展示
              const scale = 1.2;
              if (itemInfo.shape === 'circle') {
                ctx.drawImage(
                  img, 
                  -itemInfo.radius * scale, 
                  -itemInfo.radius * scale, 
                  itemInfo.radius * 2 * scale, 
                  itemInfo.radius * 2 * scale
                );
              } else {
                ctx.drawImage(
                  img, 
                  -itemInfo.width / 2 * scale, 
                  -itemInfo.height / 2 * scale, 
                  itemInfo.width * scale, 
                  itemInfo.height * scale
                );
              }
            } else {
              // 正常绘制，没有特效
              if (itemInfo.shape === 'circle') {
                ctx.drawImage(img, -itemInfo.radius, -itemInfo.radius, itemInfo.radius * 2, itemInfo.radius * 2);
              } else {
                ctx.drawImage(img, -itemInfo.width / 2, -itemInfo.height / 2, itemInfo.width, itemInfo.height);
              }
            }
            
            ctx.restore();
          } catch (error) {
            // 如果绘制过程中发生错误，标记此图片为错误状态
            imageErrors[data.type] = true;
            // 绘制备用形状
            drawFallbackShape(ctx, body, itemInfo, isBeingDragged);
          }
        } else {
          // 如果图片尚未加载或加载失败，使用颜色占位
          drawFallbackShape(ctx, body, itemInfo, isBeingDragged);
        }
      });
    };
    
    // 绘制备用形状的函数
    const drawFallbackShape = (ctx, body, itemInfo, isBeingDragged) => {
      ctx.save();
      
      // 如果物体在屏幕外，跳过绘制
      if (
        body.position.x < -50 || 
        body.position.x > dimensions.width + 50 || 
        body.position.y < -50 || 
        body.position.y > dimensions.height + 50
      ) {
        ctx.restore();
        return;
      }
      
      // 如果物体正在被拖动，添加简化的视觉效果
      if (isBeingDragged) {
        ctx.fillStyle = itemInfo.color;
        
        // 小幅放大，但不添加阴影
        const scale = 1.1;
        
        if (itemInfo.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, itemInfo.radius * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          ctx.fillRect(
            -itemInfo.width / 2 * scale, 
            -itemInfo.height / 2 * scale, 
            itemInfo.width * scale, 
            itemInfo.height * scale
          );
        }
      } else {
        // 正常绘制，没有特效
        ctx.fillStyle = itemInfo.color;
        
        if (itemInfo.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, itemInfo.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          ctx.fillRect(-itemInfo.width / 2, -itemInfo.height / 2, itemInfo.width, itemInfo.height);
        }
      }
      
      ctx.restore();
    };
    
    // 创建动画循环
    let animationId;
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 30; // 限制渲染帧率为30fps
    
    const animate = (currentTime) => {
      // 计算时间差
      const elapsed = currentTime - lastRenderTime;

      // 如果时间差大于帧间隔，才进行绘制
      if (elapsed > fpsInterval) {
        // 调整最后渲染时间
        lastRenderTime = currentTime - (elapsed % fpsInterval);
        
        // 执行绘制
        drawItems();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    // 清理函数
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [bodies, dimensions, isDragging, getSortingZoneRect]);

  // 处理指针事件
  const handlePointerDown = useCallback((e) => {
    // 使canvas获得焦点，以便能捕获所有指针事件
    if (!canvasRef.current || !bodies || Object.keys(bodies).length === 0) return;
    
    canvasRef.current.focus();
    
    try {
      // 获取画布位置
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      
      console.log("GameArea 检测到点击，物品数量:", Object.keys(bodies).length);
      
      // 遍历所有物品，找到点击的物品
      for (const id in bodies) {
        const { body, data } = bodies[id];
        const radius = body.circleRadius || Math.max(body.bounds.max.x - body.bounds.min.x, 
                                                  body.bounds.max.y - body.bounds.min.y) / 2;
        
        // 简单检查点击位置是否在物品范围内
        const distance = Math.sqrt(
          Math.pow(body.position.x - x, 2) + 
          Math.pow(body.position.y - y, 2)
        );
        
        if (distance <= radius * 1.2) { // 稍微扩大点击范围
          console.log("找到点击的物品:", data);
          // 调用回调函数
          onItemDropped(data);
          break;
        }
      }
    } catch (error) {
      console.error('处理点击事件时出错:', error);
    }
  }, [bodies, onItemDropped]);

  // 初始化物理引擎
  useEffect(() => {
    // 获取当前关卡
    if (items.length > 0 && items[0].level) {
      setCurrentLevel(items[0].level);
    }

    // 等待DOM元素存在
    if (!containerRef.current || !canvasRef.current) {
      console.log("等待DOM元素加载完成...");
      return;
    }

    // 创建引擎
    const engine = Matter.Engine.create({
      enableSleeping: true,
    });
    engineRef.current = engine;

    // 创建渲染器
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    physicsAreaRef.current = { width, height };

    const render = Matter.Render.create({
      element: container,
      engine: engine,
      canvas: canvasRef.current,
      options: {
        width: width,
        height: height,
        background: 'transparent',
        wireframes: false
      }
    });
    renderRef.current = render;

    // 添加墙壁边界
    const wallOptions = { isStatic: true, render: { visible: false } };
    const walls = [
      Matter.Bodies.rectangle(width / 2, 0, width, 20, wallOptions), // 上
      Matter.Bodies.rectangle(width / 2, height, width, 20, wallOptions), // 下
      Matter.Bodies.rectangle(0, height / 2, 20, height, wallOptions), // 左
      Matter.Bodies.rectangle(width, height / 2, 20, height, wallOptions), // 右
    ];

    Matter.Composite.add(engine.world, walls);

    // 添加鼠标控制
    Matter.Render.run(render);

    // 创建物理运行器
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // 获取Canvas位置
    const rect = canvasRef.current.getBoundingClientRect();
    setCanvasOffset({ x: rect.left, y: rect.top });

    // 清理函数
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      
      // 清除物品生成定时器
      if (itemGenerationTimerRef.current) {
        clearInterval(itemGenerationTimerRef.current);
      }
    };
  }, []);

  // 处理项目变化
  useEffect(() => {
    if (!engineRef.current) return;

    // 清除现有的所有物体 (除了墙壁)
    const nonStaticBodies = Matter.Composite.allBodies(engineRef.current.world).filter(body => !body.isStatic);
    Matter.Composite.remove(engineRef.current.world, nonStaticBodies);
    bodiesRef.current = {};
    
    // 更新当前关卡（如果有物品并且它们带有关卡信息）
    if (items.length > 0 && items[0].level) {
      setCurrentLevel(items[0].level);
    }

    // 添加新的物体
    items.forEach(item => {
      const body = createItemBody(item);
      Matter.Composite.add(engineRef.current.world, body);
      bodiesRef.current[item.id] = body;
    });
  }, [items]);

  // 处理自动生成物品的功能
  useEffect(() => {
    // 检查引擎是否已初始化
    if (!engineRef.current) return;

    // 清除任何现有的生成定时器
    if (itemGenerationTimerRef.current) {
      clearInterval(itemGenerationTimerRef.current);
    }

    // 只有当游戏处于活动状态且当前关卡大于1时设置定时器
    if (gameIsActive && currentLevel > 1) {
      // 获取当前关卡的生成间隔
      const generationInterval = getItemGenerationInterval(currentLevel);
      
      // 如果间隔大于0（即需要生成物品）
      if (generationInterval > 0) {
        itemGenerationTimerRef.current = setInterval(() => {
          // 获取当前关卡配置
          const levelConfig = LEVELS[currentLevel - 1];
          
          if (levelConfig) {
            // 生成新物品
            const newItem = generateRandomItem(
              levelConfig,
              physicsAreaRef.current.width,
              physicsAreaRef.current.height
            );
            
            // 创建物理体
            const body = createItemBody(newItem);
            
            // 添加到物理引擎
            Matter.Composite.add(engineRef.current.world, body);
            bodiesRef.current[newItem.id] = body;

            console.log(`Generated new item: ${newItem.type} at level ${currentLevel}`);
          }
        }, generationInterval);
      }
    }

    return () => {
      if (itemGenerationTimerRef.current) {
        clearInterval(itemGenerationTimerRef.current);
      }
    };
  }, [gameIsActive, currentLevel]);

  // 处理拖拽开始事件 - 重命名为handleDragStart而不是handlePointerDown
  const handleDragStart = useCallback((e) => {
    if (e.button !== 0) return; // 只处理左键点击
    if (!engineRef.current || !canvasRef.current) return;

    e.preventDefault();
    
    // 获取点击位置（考虑canvas的偏移）
    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // 查找点击的物体
    const body = Matter.Query.point(
      Matter.Composite.allBodies(engineRef.current.world).filter(b => b.isDraggable),
      position
    )[0];
    
    if (body) {
      console.log('开始拖拽:', body.label);
      
      // 存储拖拽前的原始物理属性
      originalBodyPropertiesRef.current = {
        isStatic: body.isStatic,
        frictionAir: body.frictionAir,
        density: body.density,
        friction: body.friction,
        restitution: body.restitution
      };
      
      // 为拖拽设置物理属性
      Matter.Body.set(body, {
        isStatic: false,
        frictionAir: 0.2,  // 增加空气阻力，使其更容易控制
        density: 0.0001,   // 降低密度，使其更轻
        friction: 0,       // 无摩擦
        restitution: 0     // 无弹性
      });
      
      // 创建鼠标约束
      const mouseConstraint = Matter.Constraint.create({
        pointA: position,
        bodyB: body,
        stiffness: 0.2,
        length: 0
      });
      
      Matter.Composite.add(engineRef.current.world, mouseConstraint);
      
      // 记录正在拖拽的物体和约束
      draggedBodyRef.current = body;
      constraintRef.current = mouseConstraint;
    }
  }, []);
  
  const handlePointerMove = useCallback((e) => {
    if (!constraintRef.current || !draggedBodyRef.current) return;
    
    // 更新约束的位置
    const position = {
      x: e.clientX - canvasOffset.x,
      y: e.clientY - canvasOffset.y
    };
    
    Matter.Body.setPosition(draggedBodyRef.current, {
      x: position.x,
      y: position.y
    });
    
    constraintRef.current.pointA = position;
  }, [canvasOffset]);
  
  const handlePointerUp = useCallback((e) => {
    if (!draggedBodyRef.current || !constraintRef.current || !engineRef.current) return;
    
    const draggedBody = draggedBodyRef.current;
    
    // 恢复原始物理属性
    if (originalBodyPropertiesRef.current) {
      Matter.Body.set(draggedBody, originalBodyPropertiesRef.current);
    }
    
    // 检查拖放区域的矩形
    const sortingZoneRect = getSortingZoneRect();

    console.log('检查物品是否进入分拣区:', sortingZoneRect);
    
    if (sortingZoneRect && isBodyInRect(draggedBody, sortingZoneRect)) {
      console.log('物品已拖入分拣区:', draggedBody.label);
      
      // 查找物品ID对应的物品数据
      const itemId = draggedBody.label;
      const item = items.find(i => i.id === itemId);
      
      if (item) {
        // 通知父组件物品已被放入分拣区
        onItemDropped(item);
      }
    }
    
    // 移除约束
    Matter.Composite.remove(engineRef.current.world, constraintRef.current);
    constraintRef.current = null;
    draggedBodyRef.current = null;
    originalBodyPropertiesRef.current = {};
  }, [getSortingZoneRect, items, onItemDropped]);
  
  // 添加指针事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('pointerdown', handleDragStart);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      canvas.removeEventListener('pointerdown', handleDragStart);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleDragStart, handlePointerMove, handlePointerUp]);
  
  const renderObjects = useCallback(() => {
    if (!renderRef.current || !engineRef.current) return;
    
    Matter.Render.world(renderRef.current, engineRef.current.world, renderRef.current.options);
    
    const context = renderRef.current.canvas.getContext('2d');
    const bodies = Matter.Composite.allBodies(engineRef.current.world).filter(b => b.isDraggable);
    
    bodies.forEach(body => {
      const itemId = body.label;
      const item = items.find(i => i.id === itemId);
      
      if (item) {
        const itemInfo = ITEMS_INFO[item.type];
        context.save();
        context.translate(body.position.x, body.position.y);
        context.rotate(body.angle);
        
        if (itemInfo.shape === 'circle') {
          const radius = itemInfo.radius;
          context.beginPath();
          context.arc(0, 0, radius, 0, 2 * Math.PI);
          context.fillStyle = itemInfo.color;
          context.fill();
          
          // 添加文本
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = '#ffffff';
          context.font = '12px Arial';
          context.fillText(itemInfo.emoji || itemInfo.name, 0, 0);
        } else {
          // 矩形物体
          const width = itemInfo.width;
          const height = itemInfo.height;
          context.beginPath();
          context.rect(-width / 2, -height / 2, width, height);
          context.fillStyle = itemInfo.color;
          context.fill();
          
          // 添加文本
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = '#ffffff';
          context.font = '12px Arial';
          context.fillText(itemInfo.emoji || itemInfo.name, 0, 0);
        }
        
        context.restore();
      }
    });
  }, [items]);
  
  // 渲染动画
  useEffect(() => {
    if (!renderRef.current || !engineRef.current) return;
    
    let animationFrameId;
    
    const animate = () => {
      renderObjects();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderObjects]);

  return (
    <div 
      ref={containerRef} 
      className={`h-full w-full bg-gray-100 rounded-lg overflow-hidden transition duration-300 ${
        isDragging ? 'ring-2 ring-blue-400 shadow-lg' : ''
      }`}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className={`block w-full h-full cursor-pointer`}
          onClick={handlePointerDown}
          tabIndex={0} // 使canvas可聚焦
        />
      )}
      {gameIsActive && (
        <>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 bg-white bg-opacity-75 py-2 px-4 rounded-lg shadow-md">
            点击商品即可将其放入分拣区
          </div>
          {items.length > 0 && (
            <button 
              className="absolute top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600"
              onClick={(e) => {
                // 阻止事件冒泡，防止触发canvas的点击事件
                e.stopPropagation();
                
                // 随机选择一个物品放入分拣区
                const randomIndex = Math.floor(Math.random() * items.length);
                const randomItem = items[randomIndex];
                console.log("测试按钮: 将物品放入分拣区", randomItem);
                onItemDropped(randomItem);
              }}
            >
              测试: 放入物品
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GameArea; 