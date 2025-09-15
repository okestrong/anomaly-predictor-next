'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  variant?: 'spinner' | 'neural' | 'cyber' | 'matrix' | 'dots'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'ai' | 'white' | 'current'
  text?: string
  fullscreen?: boolean
  overlay?: boolean
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  fullscreen = false,
  overlay = false,
  className
}) => {
  const containerClasses = useMemo(() => {
    const classes = ['flex items-center justify-center']
    
    if (fullscreen) {
      classes.push(
        'fixed inset-0 z-50',
        'min-h-screen w-full'
      )
    }
    
    if (overlay) {
      classes.push('bg-black/50 backdrop-blur-sm')
    }
    
    return classes
  }, [fullscreen, overlay])

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'xs':
        return 'w-4 h-4'
      case 'sm':
        return 'w-6 h-6'
      case 'md':
        return 'w-8 h-8'
      case 'lg':
        return 'w-12 h-12'
      case 'xl':
        return 'w-16 h-16'
      default:
        return 'w-8 h-8'
    }
  }, [size])

  const spinnerClasses = useMemo(() => {
    const classes = [sizeClasses, 'animate-spin rounded-full border-4']
    
    switch (color) {
      case 'primary':
        classes.push('border-primary-200 border-t-primary-600')
        break
      case 'secondary':
        classes.push('border-gray-200 border-t-gray-600')
        break
      case 'ai':
        classes.push('border-ai-circuit/20 border-t-ai-circuit')
        break
      case 'white':
        classes.push('border-white/20 border-t-white')
        break
      case 'current':
        classes.push('border-current/20 border-t-current')
        break
    }
    
    return classes
  }, [sizeClasses, color])

  const matrixClasses = useMemo(() => {
    switch (size) {
      case 'xs':
        return 'w-1 h-4'
      case 'sm':
        return 'w-1.5 h-6'
      case 'md':
        return 'w-2 h-8'
      case 'lg':
        return 'w-3 h-12'
      case 'xl':
        return 'w-4 h-16'
      default:
        return 'w-2 h-8'
    }
  }, [size])

  const textClasses = useMemo(() => {
    const classes = []
    
    switch (color) {
      case 'primary':
        classes.push('text-primary-600')
        break
      case 'secondary':
        classes.push('text-gray-600')
        break
      case 'ai':
        classes.push('text-ai-circuit')
        break
      case 'white':
        classes.push('text-white')
        break
      case 'current':
        classes.push('text-current')
        break
    }
    
    return classes
  }, [color])

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return <div className={cn(spinnerClasses)} />

      case 'neural':
        return (
          <div className="relative">
            <div className={cn(sizeClasses, 'bg-ai-circuit rounded-full animate-pulse')} />
            <div className={cn(
              'absolute inset-0', 
              sizeClasses, 
              'bg-ai-circuit rounded-full neural-pulse opacity-75'
            )} />
            <div className={cn(
              'absolute inset-0', 
              sizeClasses, 
              'bg-ai-glow rounded-full animate-ping opacity-25'
            )} />
          </div>
        )

      case 'cyber':
        return (
          <div className="relative">
            <div className={cn(
              sizeClasses, 
              'bg-gradient-to-r from-ai-cyber to-ai-glow rounded-lg animate-pulse'
            )} />
            <div className={cn(
              'absolute inset-0', 
              sizeClasses, 
              'bg-ai-cyber rounded-lg opacity-50 animate-glow'
            )} />
          </div>
        )

      case 'matrix':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  matrixClasses, 
                  'bg-ai-matrix rounded-full animate-bounce'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )

      case 'dots':
        return (
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-current rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )

      default:
        return <div className={cn(spinnerClasses)} />
    }
  }

  return (
    <div className={cn(containerClasses, className)}>
      {renderSpinner()}
      
      {text && (
        <div className={cn('ml-3 text-sm font-medium', textClasses)}>
          {text}
        </div>
      )}
    </div>
  )
}

// AI 테마 특화 로딩 스피너들
export const NeuralSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="neural" />
)

export const CyberSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="cyber" />
)

export const MatrixSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="matrix" />
)

// 전체 화면 로딩 오버레이
export const FullscreenLoader: React.FC<{
  text?: string
  variant?: LoadingSpinnerProps['variant']
}> = ({ text = 'Loading...', variant = 'neural' }) => (
  <LoadingSpinner
    variant={variant}
    size="lg"
    color="ai"
    text={text}
    fullscreen
    overlay
  />
)