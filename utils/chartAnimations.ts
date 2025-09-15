// Chart animation configurations for smooth transitions

export const smoothMotionConfig = {
  mass: 1,
  tension: 170,
  friction: 26,
  clamp: false,
  precision: 0.01,
  velocity: 0
}

export const gentleMotionConfig = {
  mass: 1.2,
  tension: 120,
  friction: 20,
  clamp: false,
  precision: 0.01,
  velocity: 0
}

export const slowMotionConfig = {
  mass: 1.5,
  tension: 100,
  friction: 25,
  clamp: false,
  precision: 0.01,
  velocity: 0
}

// Animation presets for different chart types
export const lineChartAnimation = {
  animate: true,
  motionConfig: smoothMotionConfig,
  // Smooth line transitions
  enableSlices: 'x' as const,
  useMesh: true,
  enableCrosshair: false,
  isInteractive: true
}

export const barChartAnimation = {
  animate: true,
  motionConfig: 'gentle' as const,
  // Smooth bar transitions  
  enableGridY: true,
  enableGridX: false
}

export const pieChartAnimation = {
  animate: true,
  motionConfig: 'slow' as const,
  // Smooth arc transitions
  transitionMode: 'centerRadius' as const,
  innerRadius: 0.4,
  cornerRadius: 3
}

// Transition delays for staggered animations
export const staggerDelay = (index: number, baseDelay = 50) => index * baseDelay

// Easing functions for custom animations
export const easingFunctions = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)', 
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
}

// Data transition helper
export const createTransitionProps = (type: 'line' | 'bar' | 'pie') => {
  switch (type) {
    case 'line':
      return lineChartAnimation
    case 'bar':
      return barChartAnimation
    case 'pie':
      return pieChartAnimation
    default:
      return lineChartAnimation
  }
}