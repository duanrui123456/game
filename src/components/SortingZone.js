/**
 * 分拣区组件
 * 显示已经分拣的物品
 */

import React, { useRef, useEffect, useState } from 'react';
import { ITEMS_INFO } from '../utils/gameConfig';

const SortingZone = ({ items, onRectUpdate }) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 更新分拣区矩形信息
  useEffect(() => {
    if (!containerRef.current) return;

    const updateRect = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      onRectUpdate({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    // 初始化时立即更新一次
    updateRect();
    
    // 100ms后再次更新，确保所有布局都已经完成
    setTimeout(updateRect, 100);
    
    // 添加DOM变化监听，当元素尺寸发生变化时更新
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        updateRect();
      });
      resizeObserver.observe(containerRef.current);
      
      // 清理函数
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      // 备用方案：使用窗口大小变化事件
      window.addEventListener('resize', updateRect);
      
      // 确保在滚动时也更新坐标
      window.addEventListener('scroll', updateRect);
      
      // 更频繁地检查DOM变化
      const checkInterval = setInterval(updateRect, 1000);
      
      return () => {
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect);
        clearInterval(checkInterval);
      };
    }
  }, [onRectUpdate]);

  // 按类型对物品进行分组
  const groupedItems = items.reduce((groups, item) => {
    if (!groups[item.type]) {
      groups[item.type] = [];
    }
    groups[item.type].push(item);
    return groups;
  }, {});

  // 处理悬浮状态
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full p-3 transition-all duration-200 ${
        isHovered 
          ? 'border-2 border-indigo-500 bg-indigo-50' 
          : 'border-2 border-dashed border-gray-300 bg-white'
      } rounded-lg overflow-y-auto`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        zIndex: 100  // 确保更高的z-index，使分拣区在上方
      }}
    >
      <h2 className="text-lg font-bold mb-3 text-center text-indigo-600 border-b pb-2">分拣区</h2>
      
      {/* 显示分拣物品 */}
      {Object.keys(groupedItems).length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(groupedItems).map(([type, typeItems]) => (
            <div key={type} className="bg-gray-100 p-2 rounded-lg">
              <div className="flex items-center mb-1">
                <div 
                  className="w-6 h-6 rounded-full mr-2"
                  style={{ backgroundColor: ITEMS_INFO[type].color }}
                />
                <span className="text-sm font-medium">{ITEMS_INFO[type].name}</span>
                <span className="ml-auto bg-white px-2 py-1 rounded text-xs font-bold">
                  {typeItems.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {typeItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ITEMS_INFO[type].color }}
                    title={`${ITEMS_INFO[type].name} #${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[80%] flex items-center justify-center">
          <p className="text-gray-500 text-sm">点击商品添加到分拣区</p>
        </div>
      )}
    </div>
  );
};

export default SortingZone; 