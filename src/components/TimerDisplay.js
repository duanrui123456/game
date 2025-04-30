/**
 * 计时器显示组件
 */

import React from 'react';

const TimerDisplay = ({ timeLeft }) => {
  // 格式化时间：将秒数转换为分:秒格式
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 根据剩余时间确定颜色
  const getColorClass = () => {
    if (timeLeft === null || timeLeft === undefined) return 'text-gray-500';
    if (timeLeft <= 10) return 'text-red-600'; // 少于10秒显示红色
    if (timeLeft <= 30) return 'text-yellow-600'; // 少于30秒显示黄色
    return 'text-green-600'; // 其他情况显示绿色
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-sm text-gray-600 mb-1">剩余时间</span>
      <span className={`text-xl font-bold ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default TimerDisplay; 