/**
 * 背景音乐组件
 * 用于播放游戏背景音乐
 */

import React, { useEffect, useRef, useState } from 'react';
import { GAME_STATES } from '../utils/gameConfig';

const BackgroundMusic = ({ gameState }) => {
  const audioRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('初始化背景音乐');
    // 创建音频元素
    const audio = new Audio('/voice/playround.mp3');
    audio.loop = true; // 循环播放
    audio.volume = 0.3; // 设置音量为30%

    // 监听加载事件
    audio.addEventListener('canplaythrough', () => {
      console.log('背景音乐加载完成');
      setIsLoaded(true);
    });

    // 监听错误事件
    audio.addEventListener('error', (e) => {
      console.error('背景音乐加载失败:', e);
      setError(e.message || '加载失败');
    });

    audioRef.current = audio;

    // 组件卸载时停止音频
    return () => {
      console.log('卸载背景音乐');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeEventListener('canplaythrough', () => {});
        audioRef.current.removeEventListener('error', () => {});
      }
    };
  }, []);

  // 根据游戏状态控制音频播放
  useEffect(() => {
    if (!audioRef.current || !isLoaded) return;

    console.log('游戏状态变化，当前状态:', gameState);

    if (gameState === GAME_STATES.PLAYING) {
      // 游戏开始时播放音乐
      console.log('开始播放背景音乐');
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('背景音乐播放失败:', error);

          // 尝试在用户交互后再次播放
          document.addEventListener('click', function playOnInteraction() {
            audioRef.current.play().catch(e => console.error('再次尝试播放失败:', e));
            document.removeEventListener('click', playOnInteraction);
          }, { once: true });
        });
      }
    } else {
      // 游戏暂停或结束时暂停音乐
      console.log('暂停背景音乐');
      audioRef.current.pause();
    }
  }, [gameState, isLoaded]);

  // 添加音乐控制按钮
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {error && <div className="text-red-500 text-xs">背景音乐加载失败: {error}</div>}

      <button
        onClick={toggleMute}
        className="bg-gray-800 text-white p-2 rounded-full opacity-70 hover:opacity-100 transition-opacity"
        title={isMuted ? "开启音乐" : "关闭音乐"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default BackgroundMusic;
