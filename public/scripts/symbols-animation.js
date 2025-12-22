// Three.js Seek, Learn, Integrate symbols with scroll-triggered line-drawing animation
(function () {
  // Check for reduced motion preference
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    // Show static symbols for reduced motion
    const labels = document.querySelectorAll('.symbols__label');
    labels.forEach(label => label.style.opacity = '1');
    return;
  }

  let scene, camera, renderer;
  let symbolGroups = [];
  let animationStarted = false;
  let animationProgress = 0;
  let isInView = false;

  // Symbol definitions based on the SVG
  // Triangle dimensions: roughly 150 units wide, 150 units tall
  const SYMBOL_SPACING = 180;
  const TRIANGLE_SIZE = 60;
  const CIRCLE_RADIUS = 12;

  function init() {
    const Three = window.THREE;
    if (!Three) {
      setTimeout(init, 100);
      return;
    }

    const container = document.getElementById("symbols-canvas");
    if (!container) {
      setTimeout(init, 100);
      return;
    }

    // Scene
    scene = new Three.Scene();

    // Camera - orthographic for 2D-like symbols
    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 300;
    camera = new Three.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.z = 100;

    // Renderer
    renderer = new Three.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Get colors based on theme
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const strokeColor = isDark ? 0xffffff : 0x111111;

    // Create line material for drawing effect
    function createLineMaterial(color) {
      return new Three.LineDashedMaterial({
        color: color,
        linewidth: 2,
        dashSize: 1000, // Will be animated
        gapSize: 0,
        transparent: true,
        opacity: 0
      });
    }

    // Create triangle geometry (upward pointing)
    function createTrianglePath(centerX, centerY, size, inverted = false) {
      const points = [];
      const height = size * Math.sqrt(3) / 2;
      
      if (inverted) {
        // Inverted triangle (pointing down)
        points.push(new Three.Vector3(centerX - size / 2, centerY + height / 2, 0)); // Top left
        points.push(new Three.Vector3(centerX + size / 2, centerY + height / 2, 0)); // Top right
        points.push(new Three.Vector3(centerX, centerY - height / 2, 0)); // Bottom
        points.push(new Three.Vector3(centerX - size / 2, centerY + height / 2, 0)); // Close
      } else {
        // Normal triangle (pointing up)
        points.push(new Three.Vector3(centerX, centerY + height / 2, 0)); // Top
        points.push(new Three.Vector3(centerX + size / 2, centerY - height / 2, 0)); // Bottom right
        points.push(new Three.Vector3(centerX - size / 2, centerY - height / 2, 0)); // Bottom left
        points.push(new Three.Vector3(centerX, centerY + height / 2, 0)); // Close
      }
      
      return points;
    }

    // Create circle geometry
    function createCirclePath(centerX, centerY, radius, segments = 64) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new Three.Vector3(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          0
        ));
      }
      return points;
    }

    // Create a drawable line from points with animation support
    function createDrawableLine(points, material) {
      const geometry = new Three.BufferGeometry().setFromPoints(points);
      const line = new Three.Line(geometry, material.clone());
      line.computeLineDistances();
      
      // Store total distance for animation
      const distances = line.geometry.attributes.lineDistance.array;
      line.userData.totalDistance = distances[distances.length - 1];
      line.userData.drawProgress = 0;
      
      return line;
    }

    // Symbol 1: SEEK - Upward triangle with circle at top
    const seekGroup = new Three.Group();
    const seekX = -SYMBOL_SPACING;
    
    // Triangle
    const seekTrianglePoints = createTrianglePath(0, -10, TRIANGLE_SIZE);
    const seekTriangle = createDrawableLine(seekTrianglePoints, createLineMaterial(strokeColor));
    seekGroup.add(seekTriangle);
    
    // Circle at top
    const seekCirclePoints = createCirclePath(0, TRIANGLE_SIZE * Math.sqrt(3) / 2 - 10 + CIRCLE_RADIUS + 8, CIRCLE_RADIUS);
    const seekCircle = createDrawableLine(seekCirclePoints, createLineMaterial(strokeColor));
    seekGroup.add(seekCircle);
    
    seekGroup.position.x = seekX;
    seekGroup.userData.name = 'seek';
    seekGroup.userData.elements = [seekTriangle, seekCircle];
    scene.add(seekGroup);
    symbolGroups.push(seekGroup);

    // Symbol 2: LEARN - Upward triangle with circle in center
    const learnGroup = new Three.Group();
    const learnX = 0;
    
    // Triangle
    const learnTrianglePoints = createTrianglePath(0, -10, TRIANGLE_SIZE);
    const learnTriangle = createDrawableLine(learnTrianglePoints, createLineMaterial(strokeColor));
    learnGroup.add(learnTriangle);
    
    // Circle in center (slightly below center)
    const learnCirclePoints = createCirclePath(0, -5, CIRCLE_RADIUS);
    const learnCircle = createDrawableLine(learnCirclePoints, createLineMaterial(strokeColor));
    learnGroup.add(learnCircle);
    
    learnGroup.position.x = learnX;
    learnGroup.userData.name = 'learn';
    learnGroup.userData.elements = [learnTriangle, learnCircle];
    scene.add(learnGroup);
    symbolGroups.push(learnGroup);

    // Symbol 3: INTEGRATE - Inverted triangle (no circle, or overlay of both previous)
    const integrateGroup = new Three.Group();
    const integrateX = SYMBOL_SPACING;
    
    // Inverted triangle
    const intTrianglePoints = createTrianglePath(0, 0, TRIANGLE_SIZE, true);
    const intTriangle = createDrawableLine(intTrianglePoints, createLineMaterial(strokeColor));
    integrateGroup.add(intTriangle);
    
    // Add a subtle upward triangle overlay for "integration" concept
    const intOverlayPoints = createTrianglePath(0, 0, TRIANGLE_SIZE * 0.6, false);
    const intOverlay = createDrawableLine(intOverlayPoints, createLineMaterial(strokeColor));
    integrateGroup.add(intOverlay);
    
    integrateGroup.position.x = integrateX;
    integrateGroup.userData.name = 'integrate';
    integrateGroup.userData.elements = [intTriangle, intOverlay];
    scene.add(integrateGroup);
    symbolGroups.push(integrateGroup);

    // Set up Intersection Observer for scroll trigger
    const section = document.querySelector('.symbols');
    if (section) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            isInView = true;
            if (!animationStarted) {
              animationStarted = true;
              startDrawAnimation();
            }
          }
        });
      }, {
        threshold: [0.3, 0.5, 0.7]
      });
      
      observer.observe(section);
    }

    // Animation for drawing lines
    function startDrawAnimation() {
      const labels = document.querySelectorAll('.symbols__label');
      let currentSymbolIndex = 0;
      const symbolDrawDuration = 1200; // ms per symbol
      const symbolDelay = 300; // delay between symbols
      const startTime = performance.now();
      
      function animateDrawing() {
        const elapsed = performance.now() - startTime;
        
        // Animate each symbol sequentially
        symbolGroups.forEach((group, index) => {
          const symbolStart = index * (symbolDrawDuration + symbolDelay);
          const symbolEnd = symbolStart + symbolDrawDuration;
          
          if (elapsed >= symbolStart) {
            const progress = Math.min((elapsed - symbolStart) / symbolDrawDuration, 1);
            const eased = easeOutCubic(progress);
            
            // Animate each element in the symbol
            group.userData.elements.forEach((element, elemIndex) => {
              // Stagger elements within symbol
              const elemDelay = elemIndex * 0.2;
              const elemProgress = Math.max(0, Math.min((eased - elemDelay) / (1 - elemDelay), 1));
              
              // Update dash offset to reveal line
              const totalDist = element.userData.totalDistance;
              element.material.dashSize = elemProgress * totalDist;
              element.material.gapSize = totalDist - (elemProgress * totalDist);
              element.material.opacity = Math.min(elemProgress * 2, 1);
            });
            
            // Show label when symbol is mostly drawn
            if (progress > 0.7) {
              const label = labels[index];
              if (label) {
                label.classList.add('visible');
              }
            }
          }
        });
        
        // Continue animation until all symbols are drawn
        const totalDuration = symbolGroups.length * (symbolDrawDuration + symbolDelay);
        if (elapsed < totalDuration) {
          requestAnimationFrame(animateDrawing);
        } else {
          // Ensure all are fully visible
          symbolGroups.forEach(group => {
            group.userData.elements.forEach(element => {
              element.material.dashSize = element.userData.totalDistance;
              element.material.gapSize = 0;
              element.material.opacity = 1;
            });
          });
          labels.forEach(label => label.classList.add('visible'));
        }
        
        renderer.render(scene, camera);
      }
      
      requestAnimationFrame(animateDrawing);
    }

    // Easing function
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    // Main render loop (for idle state subtle animation)
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      
      if (!animationStarted) {
        // Subtle idle state - symbols are hidden
        return;
      }
      
      time += 0.01;
      
      // Subtle floating effect after drawing is complete
      if (animationProgress >= 1) {
        symbolGroups.forEach((group, index) => {
          const offset = Math.sin(time + index * 0.5) * 2;
          group.position.y = offset;
        });
      }
      
      renderer.render(scene, camera);
    }
    
    animate();

    // Handle resize
    function handleResize() {
      const container = document.getElementById("symbols-canvas");
      if (!container) return;
      
      const aspect = container.clientWidth / container.clientHeight;
      const frustumSize = 300;
      
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener("resize", handleResize);

    // Handle dark mode changes
    function updateColors() {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const strokeColor = isDark ? 0xffffff : 0x111111;
      
      symbolGroups.forEach(group => {
        group.userData.elements.forEach(element => {
          element.material.color.setHex(strokeColor);
        });
      });
    }

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

