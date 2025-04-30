/**
 * 关卡指示器组件
 */

import React from 'react';

const LevelIndicator = ({ level }) => {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm text-gray-600 mb-1">关卡</span>
      <span className="text-xl font-bold text-purple-600">
        {level || '-'}
      </span>
    </div>
  );
};

export default LevelIndicator; 