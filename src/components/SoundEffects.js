/**
 * 音效管理组件
 * 用于管理游戏中的各种音效
 */

import React, { useEffect, useRef } from 'react';

const SoundEffects = () => {
  // 创建音效引用
  const tapSoundRef = useRef(null);
  const correctSoundRef = useRef(null);
  const alarmSoundRef = useRef(null);
  const fireworksSoundRef = useRef(null);

  // 初始化音效
  useEffect(() => {
    // 创建点击音效
    tapSoundRef.current = new Audio('/voice/tap.mp3');
    tapSoundRef.current.volume = 0.5; // 设置音量为50%

    // 创建正确音效
    correctSoundRef.current = new Audio('/voice/correct.mp3');
    correctSoundRef.current.volume = 0.6; // 设置音量为60%

    // 创建警报音效
    alarmSoundRef.current = new Audio('/voice/alarm.mp3');
    alarmSoundRef.current.volume = 0.6; // 设置音量为60%

    // 创建烟花音效 (使用correct音效作为烟花音效)
    fireworksSoundRef.current = new Audio('/voice/correct.mp3');
    fireworksSoundRef.current.volume = 0.7; // 设置音量为70%

    // 预加载音效
    tapSoundRef.current.load();
    correctSoundRef.current.load();
    alarmSoundRef.current.load();
    fireworksSoundRef.current.load();

    return () => {
      // 组件卸载时停止音效
      if (tapSoundRef.current) {
        tapSoundRef.current.pause();
        tapSoundRef.current.currentTime = 0;
      }
      if (correctSoundRef.current) {
        correctSoundRef.current.pause();
        correctSoundRef.current.currentTime = 0;
      }
      if (alarmSoundRef.current) {
        alarmSoundRef.current.pause();
        alarmSoundRef.current.currentTime = 0;
      }
      if (fireworksSoundRef.current) {
        fireworksSoundRef.current.pause();
        fireworksSoundRef.current.currentTime = 0;
      }
    };
  }, []);

  // 将播放音效的方法暴露给全局，以便其他组件可以调用
  useEffect(() => {
    // 创建全局音效对象
    window.gameAudio = {
      playTapSound: () => {
        if (tapSoundRef.current) {
          // 重置音频位置，确保每次点击都能播放
          tapSoundRef.current.currentTime = 0;
          tapSoundRef.current.play().catch(error => {
            console.error('点击音效播放失败:', error);
          });
        }
      },

      playCorrectSound: () => {
        if (correctSoundRef.current) {
          // 重置音频位置，确保每次都能播放
          correctSoundRef.current.currentTime = 0;
          correctSoundRef.current.play().catch(error => {
            console.error('正确音效播放失败:', error);
          });
        }
      },

      playAlarmSound: () => {
        if (alarmSoundRef.current) {
          // 重置音频位置，确保每次都能播放
          alarmSoundRef.current.currentTime = 0;
          alarmSoundRef.current.play().catch(error => {
            console.error('警报音效播放失败:', error);
          });
        }
      },

      playFireworksSound: () => {
        if (fireworksSoundRef.current) {
          // 重置音频位置，确保每次都能播放
          fireworksSoundRef.current.currentTime = 0;
          fireworksSoundRef.current.play().catch(error => {
            console.error('烟花音效播放失败:', error);
          });
        }
      }
    };

    // 清理函数
    return () => {
      delete window.gameAudio;
    };
  }, []);

  // 这个组件不需要渲染任何内容
  return null;
};

export default SoundEffects;
