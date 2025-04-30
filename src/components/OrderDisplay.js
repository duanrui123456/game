/**
 * 订单显示组件
 * 显示当前关卡的订单
 */

import React from 'react';
import { ITEMS_INFO } from '../utils/gameConfig';

const OrderDisplay = ({ order }) => {
  if (!order || order.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-lg">暂无订单</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-3 overflow-y-auto">
      <h2 className="text-lg font-bold mb-3 text-center text-orange-600 border-b pb-2">订单清单</h2>
      <div className="space-y-2">
        {order.map((item, index) => (
          <div 
            key={`${item.type}-${index}`}
            className={`
              flex justify-between items-center p-2 rounded-lg
              ${item.status === 'sorted' ? 'bg-green-100' : 
                item.status === 'missing' ? 'bg-red-100' : 'bg-orange-50'}
              transition-colors duration-200
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