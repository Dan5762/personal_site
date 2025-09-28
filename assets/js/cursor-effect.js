// Cursor effect that inverts colors in a circular area around the cursor
document.addEventListener('DOMContentLoaded', function() {
  // Configuration options
  const config = {
    size: 30,                   // Initial size of the inverter circle in pixels
    transitionSpeed: 0.2,       // Transition speed in seconds for size changes
    trailEffect: false,         // Whether to enable trail effect
    bubbleSpeed: 2000,          // Speed of bubbling animation in milliseconds
    bubbleVariation: 0.3,       // How much the size varies (0.3 = 30%)
  };

  // Create the cursor follower element
  const cursorFollower = document.createElement('div');
  cursorFollower.id = 'cursor-inverter';
  document.body.appendChild(cursorFollower);
  
  // Set initial styles based on config
  cursorFollower.style.width = `${config.size}px`;
  cursorFollower.style.height = `${config.size}px`;
  cursorFollower.style.transform = "translate(-50%, -50%)";
  cursorFollower.style.transition = `width ${config.transitionSpeed}s ease-out, height ${config.transitionSpeed}s ease-out`;
  
  // Initially hide cursor until mouse moves
  cursorFollower.style.left = '-100px';
  cursorFollower.style.top = '-100px';
  cursorFollower.style.opacity = '0';

  // Track mouse position
  document.addEventListener('mousemove', function(e) {
    // Show cursor and update position
    cursorFollower.style.opacity = '1';
    cursorFollower.style.left = e.clientX + 'px';
    cursorFollower.style.top = e.clientY + 'px';
  });

  // Hide cursor when leaving the window
  document.addEventListener('mouseleave', function() {
    cursorFollower.style.opacity = '0';
  });

  // Show cursor when entering the window
  document.addEventListener('mouseenter', function() {
    cursorFollower.style.opacity = '1';
  });

  // Lava lamp droplet animation
  let animationStartTime = Date.now();
  function animateDroplet() {
    const elapsed = Date.now() - animationStartTime;
    const progress = (elapsed % config.bubbleSpeed) / config.bubbleSpeed;
    
    // Create multiple offset sine waves for organic shape deformation
    // Use wave frequencies that create smooth loops (whole number ratios)
    const wave1 = Math.sin(progress * Math.PI * 2);
    const wave2 = Math.sin(progress * Math.PI * 4 + Math.PI / 4);
    const wave3 = Math.cos(progress * Math.PI * 6 + Math.PI / 3);
    const wave4 = Math.sin(progress * Math.PI * 8 + Math.PI / 2);
    
    // Calculate dynamic border radius values for organic shape
    const baseRadius = 50;
    const variation = config.bubbleVariation * 20; // Scale for border-radius
    
    const topLeft = baseRadius + (wave1 * variation);
    const topRight = baseRadius + (wave2 * variation);
    const bottomRight = baseRadius + (wave3 * variation);
    const bottomLeft = baseRadius + (wave4 * variation);
    
    // Apply organic border radius to create droplet effect
    cursorFollower.style.borderRadius = `${topLeft}% ${topRight}% ${bottomRight}% ${bottomLeft}%`;
    
    requestAnimationFrame(animateDroplet);
  }
  
  // Start the droplet animation
  animateDroplet();
  
  // Add keyboard control to toggle the cursor effect
  document.addEventListener('keydown', function(e) {
    // Toggle effect on/off by pressing 'i' key
    if (e.key.toLowerCase() === 'i') {
      if (cursorFollower.style.display === 'none') {
        cursorFollower.style.display = 'block';
      } else {
        cursorFollower.style.display = 'none';
      }
    }
    
    // Reset to default size with 'r' key
    if (e.key.toLowerCase() === 'r') {
      config.size = 30;
    }
    
    // Make inverter larger with '+' key
    if (e.key === '+' || e.key === '=') {
      config.size += 10;
    }
    
    // Make inverter smaller with '-' key
    if (e.key === '-' || e.key === '_') {
      if (config.size > 20) {
        config.size -= 10;
      }
    }
  });
});