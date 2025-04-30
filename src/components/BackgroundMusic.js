/**
 * 背景音乐组件
 * 用于播放游戏背景音乐
 */

import React, { useEffect, useRef } from 'react';
import { GAME_STATES } from '../utils/gameConfig';

const BackgroundMusic = ({ gameState }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    // 创建音频元素
    audioRef.current = new Audio('/voice/playround.mp3');
    audioRef.current.loop = true; // 循环播放
    audioRef.current.volume = 0.5; // 设置音量为50%
    
    // 组件卸载时停止音频
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // 根据游戏状态控制音频播放
  useEffect(() => {
    if (!audioRef.current) return;

    if (gameState === GAME_STATES.PLAYING) {
      // 游戏开始时播放音乐
      audioRef.current.play().catch(error => {
        console.error('背景音乐播放失败:', error);
      });
    } else {
      // 游戏暂停或结束时暂停音乐
      audioRef.current.pause();
    }
  }, [gameState]);

  // 这个组件不需要渲染任何内容
  return null;
};

export default BackgroundMusic;
