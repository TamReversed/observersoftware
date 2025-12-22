// Three.js particle field background with cursor interaction and black hole effect
(function () {
  // Check for reduced motion preference
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return;
  }

  let scene, camera, renderer, particles, lines;
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const particleCount = 180;
  const particleData = [];
  
  // Black hole effect state
  let blackHoleActive = false;
  let blackHoleCenter = { x: 0, y: 0 };
  let blackHoleStartTime = 0;
  const BLACK_HOLE_DURATION = 5000; // 5 seconds in ms

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

    // Create ambient particles
    const geometry = new Three.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      sizes[i] = Math.random() * 2 + 1;

      particleData.push({
        baseX: positions[i * 3],
        baseY: positions[i * 3 + 1],
        baseZ: positions[i * 3 + 2],
        offsetX: 0,
        offsetY: 0,
        speed: Math.random() * 0.5 + 0.2,
        amplitude: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      });
    }

    geometry.setAttribute("position", new Three.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new Three.BufferAttribute(sizes, 1));

    const material = new Three.ShaderMaterial({
      uniforms: {
        color: { value: new Three.Color(0x4b6fb6) },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying float vOpacity;
        void main() {
          vOpacity = 0.15 + (size / 3.0) * 0.2;
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
          float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: Three.AdditiveBlending
    });

    particles = new Three.Points(geometry, material);
    scene.add(particles);

    // Connection lines
    const lineGeometry = new Three.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 6);
    lineGeometry.setAttribute("position", new Three.BufferAttribute(linePositions, 3));

    const lineMaterial = new Three.LineBasicMaterial({
      color: 0x4b6fb6,
      transparent: true,
      opacity: 0.06,
      blending: Three.AdditiveBlending
    });

    lines = new Three.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Create explosion effect overlay
    function createExplosion() {
      // Create a white flash overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at ${(blackHoleCenter.x + 1) * 50}% ${(1 - blackHoleCenter.y) * 50}%, #fff 0%, rgba(255,255,255,0) 0%);
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
      `;
      document.body.appendChild(overlay);

      // Animate the explosion outward
      let progress = 0;
      const explosionDuration = 600;
      const startTime = performance.now();

      function animateExplosion() {
        const elapsed = performance.now() - startTime;
        progress = Math.min(elapsed / explosionDuration, 1);
        
        // Easing for explosive feel
        const eased = 1 - Math.pow(1 - progress, 3);
        const size = eased * 200;
        
        overlay.style.background = `radial-gradient(circle at ${(blackHoleCenter.x + 1) * 50}% ${(1 - blackHoleCenter.y) * 50}%, #fff ${size}%, rgba(255,255,255,0.8) ${size + 20}%, rgba(255,255,255,0) ${size + 50}%)`;
        
        if (progress < 1) {
          requestAnimationFrame(animateExplosion);
        } else {
          // Full white screen
          overlay.style.background = '#fff';
          // Navigate to login page after a brief moment
          setTimeout(() => {
            window.location.href = '/admin/login.html';
          }, 100);
        }
      }

      requestAnimationFrame(animateExplosion);
    }

    // Start black hole effect
    function startBlackHole(x, y) {
      if (blackHoleActive) return;
      
      blackHoleActive = true;
      blackHoleCenter = { x, y };
      blackHoleStartTime = performance.now();
      
      // Store original positions for each particle
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        particleData[i].originalX = positions[i * 3];
        particleData[i].originalY = positions[i * 3 + 1];
        particleData[i].originalZ = positions[i * 3 + 2];
        // Add slight random orbital velocity for spiral effect
        const angle = Math.random() * Math.PI * 2;
        particleData[i].orbitalAngle = angle;
        particleData[i].orbitalSpeed = Math.random() * 2 + 1;
      }
    }

    // Click handler for black hole
    function handleClick(e) {
      // Ignore clicks on interactive elements
      const target = e.target;
      // Check if target is an Element (has closest method)
      if (target && target.closest) {
        const isInteractive = target.closest('a, button, input, textarea, select, [role="button"], .nav, .footer');
        if (isInteractive) return;
      }

      // If black hole already active, ignore
      if (blackHoleActive) return;

      // Convert screen coordinates to world coordinates
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Project to world space
      const vector = new Three.Vector3(x, y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));

      startBlackHole(worldPos.x, worldPos.y);
    }

    // Listen for clicks on the document
    document.addEventListener("click", handleClick);

    // Mouse tracking
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
      let lineIndex = 0;

      // Check if black hole effect is active
      if (blackHoleActive) {
        const elapsed = performance.now() - blackHoleStartTime;
        const progress = Math.min(elapsed / BLACK_HOLE_DURATION, 1);
        
        // Easing for dramatic pull - starts slow, accelerates
        const eased = Math.pow(progress, 2.5);
        
        // Update particles with black hole physics
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          
          // Calculate direction to black hole center
          const currentX = positions[i * 3];
          const currentY = positions[i * 3 + 1];
          const currentZ = positions[i * 3 + 2];
          
          const dx = blackHoleCenter.x - currentX;
          const dy = blackHoleCenter.y - currentY;
          const dz = -currentZ;
          
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Spiral effect - rotate around center as being pulled
          data.orbitalAngle += data.orbitalSpeed * 0.05 * (1 + eased * 3);
          const spiralRadius = dist * (1 - eased * 0.95);
          const spiralX = Math.cos(data.orbitalAngle) * spiralRadius * 0.1;
          const spiralY = Math.sin(data.orbitalAngle) * spiralRadius * 0.1;
          
          // Interpolate toward center with spiral offset
          const pullStrength = eased;
          positions[i * 3] = currentX + (dx * pullStrength * 0.08) + spiralX * (1 - pullStrength);
          positions[i * 3 + 1] = currentY + (dy * pullStrength * 0.08) + spiralY * (1 - pullStrength);
          positions[i * 3 + 2] = currentZ + (dz * pullStrength * 0.08);
          
          // Shrink particles as they get closer
          const shrinkFactor = Math.max(0.1, 1 - eased * 0.9);
          sizes[i] = (Math.random() * 2 + 1) * shrinkFactor;
        }
        
        // Fade connection lines
        lines.material.opacity = 0.06 * (1 - eased);
        
        // Trigger explosion at the end
        if (progress >= 1) {
          blackHoleActive = false;
          createExplosion();
        }
      } else {
        // Normal ambient animation
        for (let i = 0; i < particleCount; i++) {
          const data = particleData[i];
          const floatX = Math.sin(time * data.speed + data.phase) * data.amplitude;
          const floatY = Math.cos(time * data.speed * 0.8 + data.phase) * data.amplitude;

          const dx = (data.baseX + floatX) - mouseX * 50;
          const dy = (data.baseY + floatY) - mouseY * 50;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 25;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 8;
            data.offsetX += (dx / dist) * force * 0.1;
            data.offsetY += (dy / dist) * force * 0.1;
          }

          data.offsetX *= 0.95;
          data.offsetY *= 0.95;

          positions[i * 3] = data.baseX + floatX + data.offsetX;
          positions[i * 3 + 1] = data.baseY + floatY + data.offsetY;
          positions[i * 3 + 2] = data.baseZ + Math.sin(time * 0.5 + data.phase) * 2;
        }
      }

      // Update connection lines
      const connectionDistance = 15;
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

      // Subtle camera movement (disabled during black hole for stability)
      if (!blackHoleActive) {
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
      const color = isDark ? 0x86a3ff : 0x4b6fb6;
      particles.material.uniforms.color.value.setHex(color);
      lines.material.color.setHex(color);
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
