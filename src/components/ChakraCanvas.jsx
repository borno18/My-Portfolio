import React, { useEffect, useRef } from 'react';

const ChakraCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let shouldAnimate = !reducedMotionQuery.matches;

    const handleReducedMotionChange = (e) => {
      shouldAnimate = !e.matches;
      if (!shouldAnimate) {
        cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        animate();
      }
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Track mouse
    const mouse = {
      x: null,
      y: null,
      radius: 200, // Pull radius
    };

    // Throttle helper
    const throttle = (fn, wait) => {
      let time = Date.now();
      return function() {
        if ((time + wait - Date.now()) < 0) {
          fn();
          time = Date.now();
        }
      }
    };

    // Resize canvas
    const handleResize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    
    handleResize();
    const throttledResize = throttle(handleResize, 150);
    window.addEventListener('resize', throttledResize);

    // Track mouse movements
    const handleMouseMove = (e) => {
      if (!shouldAnimate) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    // Disperse particles on click
    const handleMouseClick = (e) => {
      if (!shouldAnimate) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      particles.forEach((p) => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 10;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      });
    };

    if (canvas.parentElement) {
      canvas.parentElement.addEventListener('mousemove', handleMouseMove);
      canvas.parentElement.addEventListener('mouseleave', handleMouseLeave);
      canvas.parentElement.addEventListener('click', handleMouseClick);
    }

    // Color definitions
    const colors = [
      'rgba(255, 152, 0, 0.45)', // Orange Chakra
      'rgba(33, 150, 243, 0.45)', // Cyan Chakra
    ];

    // Particle class definition
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2.5 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.baseSpeedX = this.vx;
        this.baseSpeedY = this.vy;
      }

      update() {
        // Pull to mouse (chakra gravity)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Apply subtle acceleration towards mouse
            this.vx += (dx / dist) * force * 0.08;
            this.vy += (dy / dist) * force * 0.08;
          }
        }

        // Apply friction to prevent infinite acceleration
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Re-inject base drifting speed so they don't stop completely
        this.vx += this.baseSpeedX * 0.05;
        this.vy += this.baseSpeedY * 0.05;

        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.radius * 2;
        ctx.shadowColor = this.color.includes('255') ? '#FF9800' : '#2196F3';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }
    }

    // Initialize particles
    const particleCount = Math.min(45, Math.floor((canvas.width * canvas.height) / 25000));
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    const animate = () => {
      if (!shouldAnimate) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint connections between close particles (Chakra Network)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (100 - dist) / 100 * 0.05;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 152, 0, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    if (shouldAnimate) {
      animate();
    }

    // Cleanup listeners
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', throttledResize);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      if (canvas && canvas.parentElement) {
        canvas.parentElement.removeEventListener('mousemove', handleMouseMove);
        canvas.parentElement.removeEventListener('mouseleave', handleMouseLeave);
        canvas.parentElement.removeEventListener('click', handleMouseClick);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full block pointer-events-none" 
      style={{ zIndex: 1 }}
    />
  );
};

export default ChakraCanvas;
