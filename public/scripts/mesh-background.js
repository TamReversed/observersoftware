// Three.js particle field background with cursor interaction and black hole effect
(function () {
  // Check for reduced motion preference
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return;
  }

  let scene, camera, renderer, particles, lines, trailParticles;
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const particleCount = 250; // Increased for more visual density
  const particleData = [];
  
  // Hold-to-activate state
  let isHolding = false;
  let holdStartTime = 0;
  let holdPosition = { clientX: 0, clientY: 0 };
  const HOLD_THRESHOLD = 500; // 0.5 seconds to activate
  
  // Black hole effect state
  let blackHoleState = 'idle'; // 'idle', 'charging', 'active', 'resetting'
  let blackHoleCenter = { x: 0, y: 0 };
  let blackHoleWorldPos = { x: 0, y: 0 };
  let blackHoleStartTime = 0;
  let resetStartTime = 0;
  const BLACK_HOLE_DURATION = 5000; // 5 seconds in ms
  const RESET_DURATION = 800; // 0.8 seconds to reset

  function init() {
    const Three = window.THREE;
    if (!Three) {
      setTimeout(init, 100);
      return;
    }

    const container = document.getElementById("mesh-background");
    if (!container) {
      setTimeout(init, 100);
      return;
    }

    // Scene
    scene = new Three.Scene();

    // Camera
    camera = new Three.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    // Renderer
    renderer = new Three.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Star colors - white, blue-white, yellow tints
    const starColors = [
      new Three.Color(0xffffff), // Pure white
      new Three.Color(0xcce5ff), // Blue-white
      new Three.Color(0xaaccff), // Bluer
      new Three.Color(0xfff4e6), // Warm white
      new Three.Color(0xffe4b5), // Yellow tint
      new Three.Color(0x99bbff), // Deep blue-white
    ];

    // Create star-like particles with enhanced visuals
    const geometry = new Three.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const brightness = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      
      // Larger, more visible sizes
      sizes[i] = Math.random() * 4 + 2;
      
      // Assign random star color
      const starColor = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
      
      // Random brightness for twinkling effect
      brightness[i] = Math.random() * 0.5 + 0.5;

      particleData.push({
        baseX: positions[i * 3],
        baseY: positions[i * 3 + 1],
        baseZ: positions[i * 3 + 2],
        baseSize: sizes[i],
        offsetX: 0,
        offsetY: 0,
        speed: Math.random() * 0.5 + 0.2,
        amplitude: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2,
        // For black hole effect
        originalX: 0,
        originalY: 0,
        originalZ: 0,
        orbitalAngle: 0,
        orbitalSpeed: 0,
        // For trails
        prevX: positions[i * 3],
        prevY: positions[i * 3 + 1],
        prevZ: positions[i * 3 + 2],
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0
      });
    }

    geometry.setAttribute("position", new Three.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new Three.BufferAttribute(sizes, 1));
    geometry.setAttribute("color", new Three.BufferAttribute(colors, 3));
    geometry.setAttribute("brightness", new Three.BufferAttribute(brightness, 1));

    // Enhanced shader for star-like glow
    const material = new Three.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        blackHoleProgress: { value: 0 },
        blackHoleCenter: { value: new Three.Vector2(0, 0) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float brightness;
        varying vec3 vColor;
        varying float vBrightness;
        varying float vSize;
        uniform float time;
        uniform float blackHoleProgress;
        
        void main() {
          vColor = color;
          vSize = size;
          
          // Twinkling effect
          float twinkle = sin(time * 2.0 + position.x * 0.1 + position.y * 0.1) * 0.3 + 0.7;
          vBrightness = brightness * twinkle;
          
          // Increase brightness as particles approach black hole center
          vBrightness *= 1.0 + blackHoleProgress * 2.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Larger point size with glow, grows during black hole effect
          float sizeMultiplier = 1.0 + blackHoleProgress * 0.5;
          gl_PointSize = size * sizeMultiplier * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vBrightness;
        varying float vSize;
        uniform float blackHoleProgress;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Multi-layer glow for star effect
          float core = smoothstep(0.5, 0.0, dist);
          float glow = smoothstep(0.5, 0.1, dist);
          float outerGlow = smoothstep(0.5, 0.3, dist) * 0.3;
          
          // Combine for bright core with soft glow
          float intensity = core * 0.8 + glow * 0.5 + outerGlow;
          intensity *= vBrightness;
          
          // Color shifts toward white/blue as particles accelerate
          vec3 finalColor = mix(vColor, vec3(0.8, 0.9, 1.0), blackHoleProgress * 0.5);
          
          gl_FragColor = vec4(finalColor * intensity, intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: Three.AdditiveBlending
    });

    particles = new Three.Points(geometry, material);
    scene.add(particles);

    // Create trail particles for streaking effect
    const trailCount = particleCount * 3;
    const trailGeometry = new Three.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailSizes = new Float32Array(trailCount);
    const trailOpacities = new Float32Array(trailCount);
    
    trailGeometry.setAttribute("position", new Three.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute("size", new Three.BufferAttribute(trailSizes, 1));
    trailGeometry.setAttribute("opacity", new Three.BufferAttribute(trailOpacities, 1));

    const trailMaterial = new Three.ShaderMaterial({
      uniforms: {
        color: { value: new Three.Color(0xaaccff) }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: Three.AdditiveBlending
    });

    trailParticles = new Three.Points(trailGeometry, trailMaterial);
    scene.add(trailParticles);

    // Connection lines (subtle)
    const lineGeometry = new Three.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 6);
    lineGeometry.setAttribute("position", new Three.BufferAttribute(linePositions, 3));

    const lineMaterial = new Three.LineBasicMaterial({
      color: 0x4b6fb6,
      transparent: true,
      opacity: 0.04,
      blending: Three.AdditiveBlending
    });

    lines = new Three.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Create supernova explosion effect
    function createSupernova() {
      const centerX = (blackHoleCenter.x + 1) * 50;
      const centerY = (1 - blackHoleCenter.y) * 50;
      
      // Create overlay container
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      `;
      document.body.appendChild(overlay);

      // Core flash element
      const coreFlash = document.createElement('div');
      coreFlash.style.cssText = `
        position: absolute;
        left: ${centerX}%;
        top: ${centerY}%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, #fff 0%, #ffffcc 30%, #ffaa00 60%, transparent 100%);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 100px 50px rgba(255, 200, 100, 0.8);
      `;
      overlay.appendChild(coreFlash);

      // Expanding ring element
      const ring = document.createElement('div');
      ring.style.cssText = `
        position: absolute;
        left: ${centerX}%;
        top: ${centerY}%;
        width: 0;
        height: 0;
        border-radius: 50%;
        border: 4px solid rgba(255, 200, 100, 0.8);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 30px 10px rgba(255, 150, 50, 0.5), inset 0 0 30px 10px rgba(255, 200, 100, 0.3);
      `;
      overlay.appendChild(ring);

      // White flash overlay
      const whiteFlash = document.createElement('div');
      whiteFlash.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        opacity: 0;
      `;
      overlay.appendChild(whiteFlash);

      const startTime = performance.now();
      const totalDuration = 1200;
      
      // Screen shake
      let shakeIntensity = 0;

      function animateSupernova() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Phase 1: Core flash (0-30%)
        if (progress < 0.3) {
          const phase = progress / 0.3;
          const eased = 1 - Math.pow(1 - phase, 3);
          const size = eased * 200;
          coreFlash.style.width = `${size}px`;
          coreFlash.style.height = `${size}px`;
          shakeIntensity = phase * 15;
        }
        
        // Phase 2: Ring expansion + core holds (30-70%)
        if (progress >= 0.3 && progress < 0.7) {
          const phase = (progress - 0.3) / 0.4;
          const eased = 1 - Math.pow(1 - phase, 2);
          const ringSize = eased * Math.max(window.innerWidth, window.innerHeight) * 2;
          ring.style.width = `${ringSize}px`;
          ring.style.height = `${ringSize}px`;
          ring.style.borderWidth = `${Math.max(2, 8 - phase * 6)}px`;
          ring.style.opacity = String(1 - phase * 0.5);
          
          // Core starts fading
          coreFlash.style.opacity = String(1 - phase * 0.3);
          shakeIntensity = 15 - phase * 10;
        }
        
        // Phase 3: White out (70-100%)
        if (progress >= 0.7) {
          const phase = (progress - 0.7) / 0.3;
          const eased = phase * phase;
          whiteFlash.style.opacity = String(eased);
          coreFlash.style.opacity = String(0.7 - phase * 0.7);
          ring.style.opacity = String(0.5 - phase * 0.5);
          shakeIntensity = 5 - phase * 5;
        }
        
        // Apply screen shake
        if (shakeIntensity > 0.5) {
          const shakeX = (Math.random() - 0.5) * shakeIntensity;
          const shakeY = (Math.random() - 0.5) * shakeIntensity;
          document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
          document.body.style.transform = '';
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateSupernova);
        } else {
          // Clean up and navigate
          document.body.style.transform = '';
          whiteFlash.style.opacity = '1';
          setTimeout(() => {
            window.location.href = '/admin/login.html';
          }, 150);
        }
      }

      requestAnimationFrame(animateSupernova);
    }

    // Start black hole effect
    function startBlackHole() {
      if (blackHoleState !== 'idle' && blackHoleState !== 'charging') return;
      
      blackHoleState = 'active';
      blackHoleStartTime = performance.now();
      
      // Store original positions and calculate initial distance for each particle
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        particleData[i].originalX = positions[i * 3];
        particleData[i].originalY = positions[i * 3 + 1];
        particleData[i].originalZ = positions[i * 3 + 2];
        
        // Calculate initial distance from black hole center
        const dx = positions[i * 3] - blackHoleWorldPos.x;
        const dy = positions[i * 3 + 1] - blackHoleWorldPos.y;
        particleData[i].initialDist = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate initial angle from center (for consistent spiral starting point)
        particleData[i].initialAngle = Math.atan2(dy, dx);
        
        // Orbital speed - particles further out rotate slower (like accretion disk)
        particleData[i].orbitalSpeed = (Math.random() * 1.5 + 1.5) * (60 / Math.max(particleData[i].initialDist, 10));
        
        // Reset velocity for trails
        particleData[i].velocityX = 0;
        particleData[i].velocityY = 0;
        particleData[i].velocityZ = 0;
        particleData[i].prevX = positions[i * 3];
        particleData[i].prevY = positions[i * 3 + 1];
        particleData[i].prevZ = positions[i * 3 + 2];
      }
    }

    // Cancel black hole and reset particles
    function cancelBlackHole() {
      if (blackHoleState !== 'active' && blackHoleState !== 'charging') return;
      
      blackHoleState = 'resetting';
      resetStartTime = performance.now();
      
      // Store current positions as reset starting point
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        particleData[i].resetStartX = positions[i * 3];
        particleData[i].resetStartY = positions[i * 3 + 1];
        particleData[i].resetStartZ = positions[i * 3 + 2];
      }
    }

    // Convert screen to world coordinates
    function screenToWorld(clientX, clientY) {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -(clientY / window.innerHeight) * 2 + 1;
      
      const vector = new Three.Vector3(x, y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      return { screenX: x, screenY: y, worldX: worldPos.x, worldY: worldPos.y };
    }

    // Mouse down handler
    function handleMouseDown(e) {
      const target = e.target;
      if (target && target.closest) {
        const isInteractive = target.closest('a, button, input, textarea, select, [role="button"], .nav, .footer');
        if (isInteractive) return;
      }
      
      if (blackHoleState !== 'idle') return;
      
      isHolding = true;
      holdStartTime = performance.now();
      holdPosition = { clientX: e.clientX, clientY: e.clientY };
      
      const coords = screenToWorld(e.clientX, e.clientY);
      blackHoleCenter = { x: coords.screenX, y: coords.screenY };
      blackHoleWorldPos = { x: coords.worldX, y: coords.worldY };
      
      blackHoleState = 'charging';
    }

    // Mouse up handler
    function handleMouseUp() {
      if (!isHolding) return;
      isHolding = false;
      
      if (blackHoleState === 'charging' || blackHoleState === 'active') {
        cancelBlackHole();
      }
    }

    // Mouse leave handler
    function handleMouseLeave() {
      if (isHolding) {
        handleMouseUp();
      }
    }

    // Listen for mouse events
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Mouse tracking for ambient effect
    function handleMouseMove(e) {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      time += 0.01;

      // Smooth mouse interpolation
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      const positions = particles.geometry.attributes.position.array;
      const sizes = particles.geometry.attributes.size.array;
      const linePositions = lines.geometry.attributes.position.array;
      const trailPositions = trailParticles.geometry.attributes.position.array;
      const trailSizes = trailParticles.geometry.attributes.size.array;
      const trailOpacities = trailParticles.geometry.attributes.opacity.array;
      let lineIndex = 0;

      // Check if we should transition from charging to active
      if (blackHoleState === 'charging' && isHolding) {
        const holdDuration = performance.now() - holdStartTime;
        if (holdDuration >= HOLD_THRESHOLD) {
          startBlackHole();
        }
      }

      // Calculate black hole progress
      let blackHoleProgress = 0;
      let chargingProgress = 0;
      
      if (blackHoleState === 'charging' && isHolding) {
        chargingProgress = Math.min((performance.now() - holdStartTime) / HOLD_THRESHOLD, 1);
      } else if (blackHoleState === 'active') {
        blackHoleProgress = Math.min((performance.now() - blackHoleStartTime) / BLACK_HOLE_DURATION, 1);
      }

      // Update shader uniforms
      particles.material.uniforms.time.value = time;
      particles.material.uniforms.blackHoleProgress.value = blackHoleProgress;
      particles.material.uniforms.blackHoleCenter.value.set(blackHoleCenter.x, blackHoleCenter.y);

      // Handle different states
      if (blackHoleState === 'active') {
        // Easing for gravity effect - accelerates over time
        const eased = Math.pow(blackHoleProgress, 1.5);
        
        // Gravity strength increases over time
        const gravityStrength = 0.8 + eased * 3;
        
        // Update particles with gravity-fall physics (like falling into a hole)
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          
          // Store previous position for trail calculation
          const prevX = positions[i * 3];
          const prevY = positions[i * 3 + 1];
          const prevZ = positions[i * 3 + 2];
          
          // Calculate direction to black hole center
          const dx = blackHoleWorldPos.x - prevX;
          const dy = blackHoleWorldPos.y - prevY;
          const dz = -prevZ; // Pull Z toward 0
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Avoid division by zero
          const safeDist = Math.max(dist, 2);
          
          // Normalize direction
          const dirX = dx / safeDist;
          const dirY = dy / safeDist;
          const dirZ = dz / (Math.abs(dz) + 1);
          
          // Gravity acceleration: stronger when closer (inverse relationship)
          // Particles accelerate as they fall toward the hole
          const acceleration = gravityStrength / (safeDist * 0.1 + 1);
          
          // Add slight random jitter for organic feel
          const jitterX = (Math.random() - 0.5) * 0.1;
          const jitterY = (Math.random() - 0.5) * 0.1;
          
          // Update velocity (accumulates for acceleration effect)
          data.velocityX = (data.velocityX || 0) * 0.95 + dirX * acceleration * 0.1 + jitterX;
          data.velocityY = (data.velocityY || 0) * 0.95 + dirY * acceleration * 0.1 + jitterY;
          data.velocityZ = (data.velocityZ || 0) * 0.95 + dirZ * 0.05;
          
          // Clamp velocity to prevent runaway speeds
          const maxVel = 4;
          const velMag = Math.sqrt(data.velocityX ** 2 + data.velocityY ** 2);
          if (velMag > maxVel) {
            data.velocityX = (data.velocityX / velMag) * maxVel;
            data.velocityY = (data.velocityY / velMag) * maxVel;
          }
          
          // Apply velocity to position
          const newX = prevX + data.velocityX;
          const newY = prevY + data.velocityY;
          const newZ = prevZ + data.velocityZ;
          
          positions[i * 3] = newX;
          positions[i * 3 + 1] = newY;
          positions[i * 3 + 2] = newZ;
          
          // Stars grow brighter as they approach, then shrink at the very end
          const proximityFactor = 1 - Math.min(dist / data.initialDist, 1);
          const brightnessMultiplier = 1 + proximityFactor * 1.5;
          const shrinkAtEnd = blackHoleProgress > 0.85 ? 1 - (blackHoleProgress - 0.85) / 0.15 : 1;
          sizes[i] = data.baseSize * brightnessMultiplier * shrinkAtEnd;
        }
        
        // Update trail particles
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          const velocity = Math.sqrt(data.velocityX ** 2 + data.velocityY ** 2 + data.velocityZ ** 2);
          
          // Create 3 trail points per particle
          for (let t = 0; t < 3; t++) {
            const trailIdx = i * 3 + t;
            const trailFactor = (t + 1) / 4;
            
            trailPositions[trailIdx * 3] = positions[i * 3] - data.velocityX * trailFactor * 8;
            trailPositions[trailIdx * 3 + 1] = positions[i * 3 + 1] - data.velocityY * trailFactor * 8;
            trailPositions[trailIdx * 3 + 2] = positions[i * 3 + 2] - data.velocityZ * trailFactor * 8;
            
            trailSizes[trailIdx] = data.baseSize * (1 - trailFactor * 0.7) * eased;
            trailOpacities[trailIdx] = Math.min(velocity * 15, 0.6) * (1 - trailFactor) * eased;
          }
        }
        
        // Fade connection lines
        lines.material.opacity = 0.04 * (1 - eased);
        
        // Trigger supernova at the end
        if (blackHoleProgress >= 1) {
          blackHoleState = 'idle';
          createSupernova();
        }
      } else if (blackHoleState === 'charging' && isHolding) {
        // Subtle drift toward cursor during charging phase
        const driftStrength = chargingProgress * 0.02;
        
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          const floatX = Math.sin(time * data.speed + data.phase) * data.amplitude;
          const floatY = Math.cos(time * data.speed * 0.8 + data.phase) * data.amplitude;
          
          const baseX = data.baseX + floatX + data.offsetX;
          const baseY = data.baseY + floatY + data.offsetY;
          
          // Subtle pull toward hold position
          const dx = blackHoleWorldPos.x - baseX;
          const dy = blackHoleWorldPos.y - baseY;
          
          positions[i * 3] = baseX + dx * driftStrength;
          positions[i * 3 + 1] = baseY + dy * driftStrength;
          positions[i * 3 + 2] = data.baseZ + Math.sin(time * 0.5 + data.phase) * 2;
          
          // Slight size increase during charging
          sizes[i] = data.baseSize * (1 + chargingProgress * 0.3);
        }
        
        // Clear trails during charging
        for (let i = 0; i < trailPositions.length; i++) {
          trailOpacities[Math.floor(i / 3)] = 0;
        }
      } else if (blackHoleState === 'resetting') {
        // Smooth reset animation
        const resetProgress = Math.min((performance.now() - resetStartTime) / RESET_DURATION, 1);
        const eased = 1 - Math.pow(1 - resetProgress, 3); // Ease out
        
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          const floatX = Math.sin(time * data.speed + data.phase) * data.amplitude;
          const floatY = Math.cos(time * data.speed * 0.8 + data.phase) * data.amplitude;
          
          const targetX = data.baseX + floatX + data.offsetX;
          const targetY = data.baseY + floatY + data.offsetY;
          const targetZ = data.baseZ + Math.sin(time * 0.5 + data.phase) * 2;
          
          positions[i * 3] = data.resetStartX + (targetX - data.resetStartX) * eased;
          positions[i * 3 + 1] = data.resetStartY + (targetY - data.resetStartY) * eased;
          positions[i * 3 + 2] = data.resetStartZ + (targetZ - data.resetStartZ) * eased;
          
          sizes[i] = data.baseSize;
        }
        
        // Fade out trails
        for (let i = 0; i < trailOpacities.length; i++) {
          trailOpacities[i] *= 0.9;
        }
        
        // Restore line opacity
        lines.material.opacity = 0.04 * eased;
        
        if (resetProgress >= 1) {
          blackHoleState = 'idle';
        }
      } else {
        // Normal ambient animation (idle state)
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          const floatX = Math.sin(time * data.speed + data.phase) * data.amplitude;
          const floatY = Math.cos(time * data.speed * 0.8 + data.phase) * data.amplitude;

          const dx = (data.baseX + floatX) - mouseX * 50;
          const dy = (data.baseY + floatY) - mouseY * 50;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 25;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 8;
            data.offsetX += (dx / dist) * force * 0.1;
            data.offsetY += (dy / dist) * force * 0.1;
          }

          data.offsetX *= 0.95;
          data.offsetY *= 0.95;

          positions[i * 3] = data.baseX + floatX + data.offsetX;
          positions[i * 3 + 1] = data.baseY + floatY + data.offsetY;
          positions[i * 3 + 2] = data.baseZ + Math.sin(time * 0.5 + data.phase) * 2;
          
          // Twinkling size variation
          const twinkle = Math.sin(time * data.twinkleSpeed + data.twinklePhase) * 0.3 + 1;
          sizes[i] = data.baseSize * twinkle;
        }
        
        // Clear trails in idle
        for (let i = 0; i < trailOpacities.length; i++) {
          trailOpacities[i] *= 0.85;
        }
      }

      // Update connection lines
      const connectionDistance = 12;
      lineIndex = 0;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDistance && lineIndex < linePositions.length - 6) {
            linePositions[lineIndex++] = positions[i * 3];
            linePositions[lineIndex++] = positions[i * 3 + 1];
            linePositions[lineIndex++] = positions[i * 3 + 2];
            linePositions[lineIndex++] = positions[j * 3];
            linePositions[lineIndex++] = positions[j * 3 + 1];
            linePositions[lineIndex++] = positions[j * 3 + 2];
          }
        }
      }

      for (let i = lineIndex; i < linePositions.length; i++) {
        linePositions[i] = 0;
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.size.needsUpdate = true;
      lines.geometry.attributes.position.needsUpdate = true;
      trailParticles.geometry.attributes.position.needsUpdate = true;
      trailParticles.geometry.attributes.size.needsUpdate = true;
      trailParticles.geometry.attributes.opacity.needsUpdate = true;

      // Subtle camera movement (disabled during black hole for stability)
      if (blackHoleState === 'idle') {
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 3 - camera.position.y) * 0.02;
      }
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", handleResize);

    // Handle dark mode changes
    function updateColors() {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const lineColor = isDark ? 0x86a3ff : 0x4b6fb6;
      lines.material.color.setHex(lineColor);
      trailParticles.material.uniforms.color.value.setHex(isDark ? 0xaaccff : 0x6688cc);
    }

    updateColors();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", updateColors);
  }

  // Initialize when ready
  function startInit() {
    if (document.readyState === "complete" && window.THREE) {
      init();
    } else {
      window.addEventListener("load", init);
    }
  }

  if (document.readyState === "complete") {
    startInit();
  } else {
    document.addEventListener("DOMContentLoaded", startInit);
  }
})();
