// Three.js particle field background with cursor interaction and supernova bursts
(function () {
  // Check for reduced motion preference
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return;
  }

  let scene, camera, renderer, particles;
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  const particleCount = 180;
  const particleData = [];
  const bursts = []; // Active supernova bursts

  // Vibrant supernova colors
  const burstColors = [
    0xff6b6b, // coral red
    0xfeca57, // golden yellow
    0xff9ff3, // pink
    0x54a0ff, // bright blue
    0x5f27cd, // purple
    0x00d2d3, // cyan
    0xff9f43, // orange
    0x10ac84, // emerald
  ];

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

    const lines = new Three.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Create smoke/mist effect
    function createBurst(x, y) {
      const burstParticleCount = 25;
      const burstGeometry = new Three.BufferGeometry();
      const burstPositions = new Float32Array(burstParticleCount * 3);
      const burstSizes = new Float32Array(burstParticleCount);

      const burstData = [];
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      for (let i = 0; i < burstParticleCount; i++) {
        // Slight random offset from click
        burstPositions[i * 3] = x + (Math.random() - 0.5) * 2;
        burstPositions[i * 3 + 1] = y + (Math.random() - 0.5) * 2;
        burstPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

        // Slow, drifting velocity - mostly upward like smoke
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.15 + 0.05;

        burstData.push({
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.sin(angle) * speed * 0.3 + 0.08, // Drift upward
          vz: (Math.random() - 0.5) * 0.05,
          life: 1.0,
          decay: Math.random() * 0.008 + 0.005, // Slower fade
          turbulence: Math.random() * Math.PI * 2
        });

        // Larger, softer particles
        burstSizes[i] = Math.random() * 6 + 4;
      }

      burstGeometry.setAttribute("position", new Three.BufferAttribute(burstPositions, 3));
      burstGeometry.setAttribute("size", new Three.BufferAttribute(burstSizes, 1));

      const smokeColor = isDark ? new Three.Color(0x8899aa) : new Three.Color(0x667788);

      const burstMaterial = new Three.ShaderMaterial({
        uniforms: {
          opacity: { value: 0.3 },
          color: { value: smokeColor }
        },
        vertexShader: `
          attribute float size;
          varying float vSize;
          void main() {
            vSize = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (500.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float opacity;
          uniform vec3 color;
          varying float vSize;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            // Soft, feathered edge for smoke effect
            float alpha = smoothstep(0.5, 0.1, dist) * opacity;
            alpha *= smoothstep(0.0, 0.2, dist); // Hollow center for wispy look

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: Three.NormalBlending
      });

      const burstPoints = new Three.Points(burstGeometry, burstMaterial);
      scene.add(burstPoints);

      bursts.push({
        points: burstPoints,
        data: burstData,
        geometry: burstGeometry,
        material: burstMaterial,
        age: 0
      });
    }

    // Click handler for supernova
    function handleClick(e) {
      // Ignore clicks on interactive elements
      const target = e.target;
      const isInteractive = target.closest('a, button, input, textarea, select, [role="button"], .nav, .footer');
      if (isInteractive) return;

      // Convert screen coordinates to world coordinates
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      // Project to world space
      const vector = new Three.Vector3(x, y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));

      createBurst(worldPos.x, worldPos.y);
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
      const linePositions = lines.geometry.attributes.position.array;
      let lineIndex = 0;

      // Update ambient particles
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
      lines.geometry.attributes.position.needsUpdate = true;

      // Update smoke/mist bursts
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        const burstPositions = burst.geometry.attributes.position.array;
        const burstSizes = burst.geometry.attributes.size.array;
        let allDead = true;
        burst.age += 0.016;

        for (let i = 0; i < burst.data.length; i++) {
          const p = burst.data[i];

          if (p.life > 0) {
            allDead = false;

            // Add gentle turbulence for organic movement
            p.turbulence += 0.03;
            const turbX = Math.sin(p.turbulence) * 0.02;
            const turbY = Math.cos(p.turbulence * 0.7) * 0.015;

            // Update position with turbulence
            burstPositions[i * 3] += p.vx + turbX;
            burstPositions[i * 3 + 1] += p.vy + turbY;
            burstPositions[i * 3 + 2] += p.vz;

            // Grow slightly as smoke disperses
            burstSizes[i] *= 1.008;

            // Very slow deceleration
            p.vx *= 0.995;
            p.vy *= 0.995;

            // Fade out
            p.life -= p.decay;
          }
        }

        burst.geometry.attributes.position.needsUpdate = true;
        burst.geometry.attributes.size.needsUpdate = true;

        // Smooth opacity fade
        const avgLife = burst.data.reduce((sum, p) => sum + Math.max(0, p.life), 0) / burst.data.length;
        burst.material.uniforms.opacity.value = avgLife * 0.3;

        // Remove dead bursts
        if (allDead || avgLife < 0.01) {
          scene.remove(burst.points);
          burst.geometry.dispose();
          burst.material.dispose();
          bursts.splice(b, 1);
        }
      }

      // Subtle camera movement
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 3 - camera.position.y) * 0.02;
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
