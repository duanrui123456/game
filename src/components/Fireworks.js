/**
 * 烟花特效组件
 * 用于在关卡完成时显示烟花特效
 */

import React, { useEffect, useRef } from 'react';

const Fireworks = ({ show, duration = 2000 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  
  // 烟花粒子类
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 2 + 1;
      this.velocity = {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8
      };
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.015;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    
    update() {
      this.velocity.y += 0.05; // 重力效果
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      this.alpha -= this.decay;
      return this.alpha > 0;
    }
    
    draw(ctx) {
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 创建烟花爆炸效果
  const createExplosion = (x, y, count = 80) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(x, y));
    }
  };
  
  // 初始化烟花特效
  useEffect(() => {
    if (!show) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置画布尺寸为全屏
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 清空粒子数组
    particlesRef.current = [];
    
    // 创建多个烟花爆炸
    const createRandomExplosions = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      createExplosion(x, y);
    };
    
    // 初始创建几个烟花
    for (let i = 0; i < 3; i++) {
      createRandomExplosions();
    }
    
    // 定时创建新的烟花
    const explosionInterval = setInterval(() => {
      createRandomExplosions();
    }, 300);
    
    // 动画循环
    const animate = () => {
      // 半透明清屏，形成拖尾效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 更新和绘制所有粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        const isAlive = particle.update();
        if (isAlive) {
          particle.draw(ctx);
        }
        return isAlive;
      });
      
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
