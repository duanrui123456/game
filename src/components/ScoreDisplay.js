/**
 * 得分显示组件
 */

import React from 'react';

const ScoreDisplay = ({ score }) => {
  // 格式化分数
  const formatScore = (score) => {
    if (score === null || score === undefined) return '0';
    return score.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-sm text-gray-600 mb-1">得分</span>
      <span className="text-xl font-bold text-blue-600">
        {formatScore(score)}
      </span>
    </div>
  );
};

export default ScoreDisplay; 