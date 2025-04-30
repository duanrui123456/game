/**
 * 订单显示组件
 * 显示当前关卡的订单
 * 包含一秒内自动下拉出现的动画效果
 */

import React, { useState, useEffect, useRef } from 'react';
import { ITEMS_INFO } from '../utils/gameConfig';
import './OrderDisplay.css';

const OrderDisplay = ({ order }) => {
  // 动画状态
  const [isVisible, setIsVisible] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const prevOrderRef = useRef(null);

  // 当订单变化时触发动画
  useEffect(() => {
    // 检查订单是否真的变化了（不仅仅是状态更新）
    const orderChanged = !prevOrderRef.current ||
                         prevOrderRef.current.length !== order?.length ||
                         JSON.stringify(prevOrderRef.current.map(i => i.type)) !==
                         JSON.stringify(order?.map(i => i.type));

    prevOrderRef.current = order;

    if (order && order.length > 0) {
      if (orderChanged) {
        // 重置动画状态
        setIsVisible(false);
        setOrderItems([]);

        // 延迟一帧后开始动画
        requestAnimationFrame(() => {
          setIsVisible(true);

          // 逐个添加订单项，创造下拉效果
          // 确保总时间不超过1秒，最后一个项目的动画在0.9秒内完成
          const maxDelay = 900; // 900毫秒，留出100毫秒的缓冲
          const itemDelay = Math.min(maxDelay / order.length, 100); // 每项最多100ms延迟

          order.forEach((item, index) => {
            setTimeout(() => {
              setOrderItems(prev => [...prev, item]);
            }, itemDelay * index);
          });
        });
      } else {
        // 如果只是状态更新（如已分拣数量变化），直接显示
        setIsVisible(true);
        setOrderItems(order);
      }
    }
  }, [order]);

  if (!order || order.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-lg">暂无订单</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-3 overflow-y-auto">
      <h2 className={`
        text-lg font-bold mb-3 text-center text-orange-600 border-b pb-2
        ${isVisible ? 'order-title-animation' : 'opacity-0'}
      `}>订单清单</h2>
      <div className="space-y-2">
        {orderItems.map((item, index) => (
          <div
            key={`${item.type}-${index}`}
            className={`
              flex justify-between items-center p-2 rounded-lg
              ${item.status === 'sorted' ? 'bg-green-100' :
                item.status === 'missing' ? 'bg-red-100' : 'bg-orange-50'}
              transition-all duration-300 ease-out
              transform origin-top
              animate-dropdown order-item-animation
            `}
          >
            <div className="flex items-center">
              <div
                className="w-7 h-7 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: ITEMS_INFO[item.type].color }}
              />
              <span className="font-medium text-sm">{item.name}</span>
            </div>
            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md shadow-sm">
              <span
                className={`
                  font-bold text-sm
                  ${item.status === 'sorted' ? 'text-green-600' :
                    item.status === 'missing' ? 'text-red-600' : 'text-gray-600'}
                `}
              >
                {item.collected}
              </span>
              <span className="text-gray-500 text-sm">/</span>
              <span className="text-gray-500 text-sm">{item.required}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderDisplay;