/**
 * 游戏状态覆盖层组件
 * 显示游戏开始、关卡完成和游戏结束状态
 */

import React from 'react';
import { GAME_STATES } from '../utils/gameConfig';

const GameStatusOverlay = ({ 
  gameState, 
  currentLevel, 
  totalScore, 
  onStartGame, 
  onStartNextLevel,
  onRestartGame
}) => {
  // 如果游戏正在进行中，不显示覆盖层
  if (gameState === GAME_STATES.PLAYING) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
        {gameState === GAME_STATES.IDLE && (
          <>
            <h1 className="text-3xl font-bold mb-6">超市分拣游戏</h1>
            <p className="text-gray-600 mb-8">
              在规定时间内，将物品分拣到指定区域，匹配订单需求。通过点击物品来完成分拣。
            </p>
            <button
              onClick={onStartGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              开始游戏
            </button>
          </>
        )}

        {gameState === GAME_STATES.LEVEL_COMPLETE && (
          <>
            <h2 className="text-2xl font-bold mb-4">关卡 {currentLevel} 完成!</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-lg mb-2">当前得分: <span className="font-bold text-blue-600">{totalScore}</span></p>
            </div>
            <button
              onClick={onStartNextLevel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              进入下一关
            </button>
          </>
        )}

        {gameState === GAME_STATES.GAME_OVER && (
          <>
            <h2 className="text-2xl font-bold mb-4">游戏结束!</h2>
            <p className="text-gray-600 mb-2">你已完成所有关卡</p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-lg mb-2">最终得分: <span className="font-bold text-blue-600">{totalScore}</span></p>
            </div>
            <button
              onClick={onRestartGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              再玩一次
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GameStatusOverlay; 