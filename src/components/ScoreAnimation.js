/**
 * 得分动画组件
 * 用于在关卡完成时显示得分从零逐渐增加到最终得分的动画
 */

import React, { useState, useEffect, useRef, memo } from 'react';

// 使用memo优化组件，避免不必要的重渲染
const ScoreAnimation = memo(({ targetScore, duration = 2000, onComplete }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const targetScoreRef = useRef(targetScore);

  useEffect(() => {
    // 更新引用值，避免闭包问题
    targetScoreRef.current = targetScore;

    if (targetScore <= 0) {
      setCurrentScore(0);
      if (onComplete) onComplete();
      return;
    }

    // 重置当前分数
    setCurrentScore(0);

    // 优化的动画函数 - 使用节流控制更新频率
    const animateScore = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        lastUpdateTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const timeSinceLastUpdate = timestamp - lastUpdateTimeRef.current;

      // 限制更新频率，每50ms更新一次
      if (timeSinceLastUpdate >= 50 || elapsed >= duration) {
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数使动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const newScore = Math.floor(targetScoreRef.current * easeOutQuart);

        setCurrentScore(newScore);
        lastUpdateTimeRef.current = timestamp;

        // 如果已完成，确保显示最终分数
        if (progress >= 1) {
          setCurrentScore(targetScoreRef.current);
          if (onComplete) onComplete();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateScore);
    };

    // 开始动画
    animationFrameRef.current = requestAnimationFrame(animateScore);

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [targetScore, duration, onComplete]);

  // 使用CSS硬件加速
  return (
    <span
      className="font-bold text-blue-600"
      style={{
        transform: 'translateZ(0)',
        willChange: 'contents'
      }}
    >
      {currentScore}
    </span>
  );
});

export default ScoreAnimation;
