/**
 * 游戏状态覆盖层组件
 * 显示游戏开始、关卡完成和游戏结束状态
 */

import React, { useState, useEffect } from 'react';
import { GAME_STATES } from '../utils/gameConfig';
import Fireworks from './Fireworks';
import ScoreAnimation from './ScoreAnimation';

const GameStatusOverlay = ({
  gameState,
  currentLevel,
  totalScore,
  onStartGame,
  onStartNextLevel,
  onRestartGame
}) => {
  // 状态管理
  const [showFireworks, setShowFireworks] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [scoreToAnimate, setScoreToAnimate] = useState(0);

  // 当游戏状态变为关卡完成时，显示烟花特效
  useEffect(() => {
    if (gameState === GAME_STATES.LEVEL_COMPLETE || gameState === GAME_STATES.GAME_OVER) {
      // 计算需要动画的分数差值
      const scoreDifference = totalScore - previousScore;
      setScoreToAnimate(scoreDifference);

      // 显示烟花特效
      setShowFireworks(true);
      setAnimationComplete(false);

      // 2秒后隐藏烟花特效
      const timer = setTimeout(() => {
        setShowFireworks(false);
        setAnimationComplete(true);
        setPreviousScore(totalScore);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (gameState === GAME_STATES.PLAYING) {
      // 重置状态
      setShowFireworks(false);
      setAnimationComplete(true);
    }
  }, [gameState, totalScore, previousScore]);

  // 如果游戏正在进行中，不显示覆盖层
  if (gameState === GAME_STATES.PLAYING) {
    return null;
  }

  return (
    <>
      {/* 烟花特效 */}
      <Fireworks show={showFireworks} duration={2000} />

      {/* 游戏状态覆盖层 */}
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          {/* 游戏Logo */}
          <div className="flex justify-center mb-4">
            <img src="/game-favicon.svg" alt="游戏Logo" className="w-24 h-24" />
          </div>

          {gameState === GAME_STATES.IDLE && (
            <>
              <h1 className="text-3xl font-bold mb-6">超市分拣游戏</h1>
              <p className="text-gray-600 mb-8">
                在规定时间内，将物品分拣到指定区域，匹配订单需求。通过点击物品来完成分拣。
              </p>
              <button
                onClick={() => {
                  // 播放开场音效
                  if (window.gameAudio && window.gameAudio.playLabiSound) {
                    window.gameAudio.playLabiSound();
                  }
                  // 调用开始游戏函数
                  onStartGame();
                }}
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
                <p className="text-lg mb-2">
                  当前得分: {' '}
                  {showFireworks ? (
                    <ScoreAnimation
                      targetScore={scoreToAnimate}
                      duration={2000}
                      onComplete={() => setAnimationComplete(true)}
                    />
                  ) : (
                    <span className="font-bold text-blue-600">{totalScore}</span>
                  )}
                </p>
              </div>
              <button
                onClick={onStartNextLevel}
                disabled={!animationComplete}
                className={`
                  font-bold py-3 px-6 rounded-lg transition duration-200
                  ${animationComplete
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'}
                `}
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
                <p className="text-lg mb-2">
                  最终得分: {' '}
                  {showFireworks ? (
                    <ScoreAnimation
                      targetScore={scoreToAnimate}
                      duration={2000}
                      onComplete={() => setAnimationComplete(true)}
                    />
                  ) : (
                    <span className="font-bold text-blue-600">{totalScore}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  // 播放开场音效
                  if (window.gameAudio && window.gameAudio.playLabiSound) {
                    window.gameAudio.playLabiSound();
                  }
                  // 调用重新开始游戏函数
                  onRestartGame();
                }}
                disabled={!animationComplete}
                className={`
                  font-bold py-3 px-6 rounded-lg transition duration-200
                  ${animationComplete
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'}
                `}
              >
                再玩一次
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GameStatusOverlay;