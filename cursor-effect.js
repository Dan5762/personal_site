// Cursor effect that inverts colors in a circular area around the cursor
document.addEventListener('DOMContentLoaded', function() {
  // Configuration options
  const config = {
    size: 40,                   // Initial size of the inverter circle in pixels
    transitionSpeed: 0.2,       // Transition speed in seconds for size changes
    trailEffect: false,         // Whether to enable trail effect
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

  // Track mouse position
  document.addEventListener('mousemove', function(e) {
    // Update the cursor follower position
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
      cursorFollower.style.width = `${config.size}px`;
      cursorFollower.style.height = `${config.size}px`;
    }
    
    // Make inverter larger with '+' key
    if (e.key === '+' || e.key === '=') {
      const currentSize = parseInt(cursorFollower.style.width);
      const newSize = currentSize + 10;
      cursorFollower.style.width = `${newSize}px`;
      cursorFollower.style.height = `${newSize}px`;
    }
    
    // Make inverter smaller with '-' key
    if (e.key === '-' || e.key === '_') {
      const currentSize = parseInt(cursorFollower.style.width);
      if (currentSize > 20) {
        const newSize = currentSize - 10;
        cursorFollower.style.width = `${newSize}px`;
        cursorFollower.style.height = `${newSize}px`;
      }
    }
  });
});