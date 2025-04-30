/**
 * 控制面板组件
 * 包含订单显示、分拣区和游戏控制按钮
 */

import React from 'react';
import OrderDisplay from './OrderDisplay';
import SortingZone from './SortingZone';
import TimerDisplay from './TimerDisplay';
import ScoreDisplay from './ScoreDisplay';
import LevelIndicator from './LevelIndicator';

const ControlPanel = ({ 
  order, 
  sortedItems, 
  onSortingZoneRectUpdate,
  onCheckOrder,
  currentLevel,
  totalScore,
  timeLeft,
  gameState,
}) => {
  return (
    <div className="h-full w-full flex flex-col bg-gray-50 p-4 rounded-lg overflow-hidden">
      {/* 游戏状态信息 */}
      <div className="flex justify-between items-center mb-4">
        <LevelIndicator level={currentLevel} />
        <ScoreDisplay score={totalScore} />
        <TimerDisplay timeLeft={timeLeft} />
      </div>
      
      {/* 订单和分拣区域的左右布局 */}
      <div className="flex-1 flex flex-row gap-4 overflow-hidden">
        {/* 分拣区 (左侧, 1/2宽度) */}
        <div className="w-1/2 bg-white rounded-lg shadow overflow-hidden">
          <SortingZone 
            items={sortedItems} 
            onRectUpdate={onSortingZoneRectUpdate} 
          />
        </div>
        
        {/* 订单显示区域 (右侧, 1/2宽度) */}
        <div className="w-1/2 bg-white rounded-lg shadow overflow-hidden">
          <OrderDisplay order={order} />
        </div>
      </div>
      
      {/* 按钮区域 */}
      <div className="mt-4">
        <button
          onClick={onCheckOrder}
          disabled={gameState !== 'playing'}
          className={`
            w-full py-3 rounded-lg font-bold text-white
            ${gameState === 'playing' 
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' 
              : 'bg-gray-400 cursor-not-allowed'}
            transition duration-200
          `}
        >
          核对订单
        </button>
      </div>
    </div>
  );
};

export default ControlPanel; 