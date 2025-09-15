'use client'

import React, { useState, useMemo } from 'react'
import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  variant?: 'error' | 'warning' | 'success' | 'info'
  title?: string
  message?: string
  closable?: boolean
  dismissible?: boolean
  retryable?: boolean
  persistent?: boolean
  className?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  onClose?: () => void
  onDismiss?: () => void
  onRetry?: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  variant = 'error',
  title,
  message,
  closable = false,
  dismissible = false,
  retryable = false,
  persistent = false,
  className,
  children,
  actions,
  onClose,
  onDismiss,
  onRetry
}) => {
  const [show, setShow] = useState(true)

  const iconComponent = useMemo(() => {
    switch (variant) {
      case 'error':
        return XCircleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'success':
        return CheckCircleIcon
      case 'info':
        return InformationCircleIcon
      default:
        return XCircleIcon
    }
  }, [variant])

  const alertClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return [
          'bg-danger-50 dark:bg-danger-900/20',
          'border border-danger-200 dark:border-danger-800'
        ]
      case 'warning':
        return [
          'bg-warning-50 dark:bg-warning-900/20',
          'border border-warning-200 dark:border-warning-800'
        ]
      case 'success':
        return [
          'bg-success-50 dark:bg-success-900/20',
          'border border-success-200 dark:border-success-800'
        ]
      case 'info':
        return [
          'bg-info-50 dark:bg-info-900/20',
          'border border-info-200 dark:border-info-800'
        ]
      default:
        return [
          'bg-danger-50 dark:bg-danger-900/20',
          'border border-danger-200 dark:border-danger-800'
        ]
    }
  }, [variant])

  const iconClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return 'text-danger-600 dark:text-danger-400'
      case 'warning':
        return 'text-warning-600 dark:text-warning-400'
      case 'success':
        return 'text-success-600 dark:text-success-400'
      case 'info':
        return 'text-info-600 dark:text-info-400'
      default:
        return 'text-danger-600 dark:text-danger-400'
    }
  }, [variant])

  const titleClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return 'text-danger-800 dark:text-danger-200'
      case 'warning':
        return 'text-warning-800 dark:text-warning-200'
      case 'success':
        return 'text-success-800 dark:text-success-200'
      case 'info':
        return 'text-info-800 dark:text-info-200'
      default:
        return 'text-danger-800 dark:text-danger-200'
    }
  }, [variant])

  const messageClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return 'text-danger-700 dark:text-danger-300'
      case 'warning':
        return 'text-warning-700 dark:text-warning-300'
      case 'success':
        return 'text-success-700 dark:text-success-300'
      case 'info':
        return 'text-info-700 dark:text-info-300'
      default:
        return 'text-danger-700 dark:text-danger-300'
    }
  }, [variant])

  const retryButtonClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return [
          'bg-danger-100 text-danger-800',
          'hover:bg-danger-200',
          'dark:bg-danger-800 dark:text-danger-200',
          'dark:hover:bg-danger-700'
        ]
      case 'warning':
        return [
          'bg-warning-100 text-warning-800',
          'hover:bg-warning-200',
          'dark:bg-warning-800 dark:text-warning-200',
          'dark:hover:bg-warning-700'
        ]
      case 'success':
        return [
          'bg-success-100 text-success-800',
          'hover:bg-success-200',
          'dark:bg-success-800 dark:text-success-200',
          'dark:hover:bg-success-700'
        ]
      case 'info':
        return [
          'bg-info-100 text-info-800',
          'hover:bg-info-200',
          'dark:bg-info-800 dark:text-info-200',
          'dark:hover:bg-info-700'
        ]
      default:
        return [
          'bg-danger-100 text-danger-800',
          'hover:bg-danger-200',
          'dark:bg-danger-800 dark:text-danger-200',
          'dark:hover:bg-danger-700'
        ]
    }
  }, [variant])

  const dismissButtonClasses = useMemo(() => {
    return [
      'bg-white text-gray-700',
      'hover:bg-gray-50',
      'dark:bg-gray-700 dark:text-gray-300',
      'dark:hover:bg-gray-600',
      'border border-gray-300 dark:border-gray-600'
    ]
  }, [])

  const closeButtonClasses = useMemo(() => {
    switch (variant) {
      case 'error':
        return [
          'text-danger-600 hover:bg-danger-100',
          'dark:text-danger-400 dark:hover:bg-danger-900/50'
        ]
      case 'warning':
        return [
          'text-warning-600 hover:bg-warning-100',
          'dark:text-warning-400 dark:hover:bg-warning-900/50'
        ]
      case 'success':
        return [
          'text-success-600 hover:bg-success-100',
          'dark:text-success-400 dark:hover:bg-success-900/50'
        ]
      case 'info':
        return [
          'text-info-600 hover:bg-info-100',
          'dark:text-info-400 dark:hover:bg-info-900/50'
        ]
      default:
        return [
          'text-danger-600 hover:bg-danger-100',
          'dark:text-danger-400 dark:hover:bg-danger-900/50'
        ]
    }
  }, [variant])

  const handleClose = () => {
    setShow(false)
    onClose?.()
  }

  const handleDismiss = () => {
    if (!persistent) {
      setShow(false)
    }
    onDismiss?.()
  }

  const handleRetry = () => {
    onRetry?.()
  }

  const IconComponent = iconComponent

  if (!show) return null

  return (
    <div 
      className={cn(
        'rounded-lg p-4 transition-all duration-300',
        alertClasses,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        {/* 아이콘 */}
        <div className="flex-shrink-0">
          <IconComponent 
            className={cn('w-5 h-5', iconClasses)}
          />
        </div>
        
        {/* 컨텐츠 */}
        <div className="ml-3 flex-1">
          {/* 제목 */}
          {title && (
            <h3 className={cn('text-sm font-medium', titleClasses)}>
              {title}
            </h3>
          )}
          
          {/* 메시지 */}
          <div 
            className={cn(
              'text-sm',
              messageClasses,
              title ? 'mt-1' : ''
            )}
          >
            {children || message}
          </div>
          
          {/* 액션 버튼들 */}
          {(actions || retryable || dismissible) && (
            <div className="mt-3 flex space-x-2">
              {actions || (
                <>
                  {retryable && (
                    <button
                      onClick={handleRetry}
                      className={cn(
                        'text-xs font-medium px-3 py-1 rounded-md',
                        'transition-colors duration-200',
                        retryButtonClasses
                      )}
                    >
                      다시 시도
                    </button>
                  )}
                  
                  {dismissible && (
                    <button
                      onClick={handleDismiss}
                      className={cn(
                        'text-xs font-medium px-3 py-1 rounded-md',
                        'transition-colors duration-200',
                        dismissButtonClasses
                      )}
                    >
                      닫기
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 닫기 버튼 */}
        {closable && (
          <div className="ml-auto pl-3">
            <button
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5',
                'transition-colors duration-200',
                closeButtonClasses
              )}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 특화된 메시지 컴포넌트들
export const ErrorAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="error" />
)

export const WarningAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="warning" />
)

export const SuccessAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="success" />
)

export const InfoAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="info" />
)