/**
 * 得分动画组件
 * 用于在关卡完成时显示得分从零逐渐增加到最终得分的动画
 */

import React, { useState, useEffect, useRef } from 'react';

const ScoreAnimation = ({ targetScore, duration = 2000, onComplete }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  useEffect(() => {
    if (targetScore <= 0) {
      setCurrentScore(0);
      if (onComplete) onComplete();
      return;
    }
    
    // 重置当前分数
    setCurrentScore(0);
    
    // 动画函数
    const animateScore = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数使动画更自然
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newScore = Math.floor(targetScore * easeOutQuart);
      
      setCurrentScore(newScore);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateScore);
      } else {
        // 确保最终显示的是目标分数
        setCurrentScore(targetScore);
        if (onComplete) onComplete();
      }
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
  
  return (
    <span className="font-bold text-blue-600 transition-all">
      {currentScore}
    </span>
  );
};

export default ScoreAnimation;
