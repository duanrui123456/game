/**
 * 烟花特效组件
 * 用于在关卡完成时显示烟花特效
 */

import React, { useEffect, useRef } from 'react';

const Fireworks = ({ show, duration = 2000 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // 烟花粒子类 - 性能优化版本
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 1.5 + 0.5; // 减小粒子尺寸

      // 使用更简单的速度计算
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2; // 减小速度范围
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;

      this.alpha = 1;
      this.decay = Math.random() * 0.02 + 0.01; // 加快衰减速度

      // 预先计算颜色，避免每次绘制时计算
      const hue = Math.floor(Math.random() * 360);
      this.color = `hsl(${hue}, 100%, 50%)`;
    }

    update() {
      this.vy += 0.03; // 减小重力效果
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
      return this.alpha > 0;
    }

    draw(ctx) {
      // 避免每次都设置globalAlpha，只在alpha变化较大时设置
      if (Math.abs(ctx.globalAlpha - this.alpha) > 0.05) {
        ctx.globalAlpha = this.alpha;
      }
      ctx.fillStyle = this.color;

      // 使用更高效的绘制方法
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 创建烟花爆炸效果 - 优化版本
  const createExplosion = (x, y, count = 40) => {
    // 预先创建粒子数组，然后一次性添加，减少数组操作
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push(new Particle(x, y));
    }
    particlesRef.current.push(...newParticles);
  };

  // 初始化烟花特效 - 性能优化版本
  useEffect(() => {
    if (!show) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // 禁用alpha通道提高性能
    if (!ctx) return;

    // 设置画布尺寸 - 降低分辨率以提高性能
    const scale = window.devicePixelRatio * 0.5; // 降低分辨率到设备像素比的一半
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(scale, scale);

    // 清空粒子数组
    particlesRef.current = [];

    // 创建多个烟花爆炸 - 减少粒子数量
    const createRandomExplosions = () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.5;
      // 减少粒子数量以提高性能
      createExplosion(x, y, 40); // 从80减少到40
    };

    // 初始创建几个烟花 - 减少初始烟花数量
    for (let i = 0; i < 2; i++) { // 从3减少到2
      createRandomExplosions();
    }

    // 定时创建新的烟花 - 降低创建频率
    const explosionInterval = setInterval(() => {
      createRandomExplosions();
    }, 500); // 从300ms增加到500ms

    // 使用节流技术限制动画帧率
    let lastFrameTime = 0;
    const targetFPS = 30; // 目标帧率
    const frameInterval = 1000 / targetFPS;

    // 动画循环
    const animate = (timestamp) => {
      // 帧率控制
      if (timestamp - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp;

      // 半透明清屏，形成拖尾效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 增加透明度以减少绘制次数
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // 批量处理粒子以减少循环次数
      const aliveParticles = [];

      // 更新和绘制所有粒子
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        const isAlive = particle.update();

        if (isAlive) {
          particle.draw(ctx);
          aliveParticles.push(particle);
        }
      }

      particlesRef.current = aliveParticles;

      // 继续动画循环
      animationRef.current = requestAnimationFrame(animate);
    };

    // 开始动画
    animationRef.current = requestAnimationFrame(animate);

    // 设置定时器，在指定时间后停止烟花特效
    const timer = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(explosionInterval);
    }, duration);

    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(explosionInterval);
      clearTimeout(timer);
    };
  }, [show, duration]);

  // 如果不显示，则不渲染
  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default Fireworks;
