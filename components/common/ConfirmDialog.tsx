'use client'

import React, { useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ConfirmDialogProps {
  show: boolean
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info' | 'question'
  title?: string
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  confirmLoadingText?: string
  loading?: boolean
  reverseButtons?: boolean
  persistent?: boolean
  className?: string
  children?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  onClose?: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  show,
  variant = 'default',
  title,
  message,
  icon: CustomIcon,
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  confirmLoadingText = '처리 중...',
  loading = false,
  reverseButtons = false,
  persistent = false,
  className,
  children,
  onConfirm,
  onCancel,
  onClose
}) => {
  const iconComponent = useMemo(() => {
    if (CustomIcon) return CustomIcon
    
    switch (variant) {
      case 'danger':
        return ExclamationTriangleIcon
      case 'warning':
        return ExclamationTriangleIcon
      case 'success':
        return CheckCircleIcon
      case 'info':
        return InformationCircleIcon
      case 'question':
        return QuestionMarkCircleIcon
      default:
        return null
    }
  }, [CustomIcon, variant])

  const dialogClasses = useMemo(() => {
    const classes = [
      'relative w-full max-w-md transform overflow-hidden',
      'rounded-lg bg-white dark:bg-gray-800',
      'shadow-xl transition-all'
    ]
    
    switch (variant) {
      case 'danger':
        classes.push('border-l-4 border-danger-500')
        break
      case 'warning':
        classes.push('border-l-4 border-warning-500')
        break
      case 'success':
        classes.push('border-l-4 border-success-500')
        break
      case 'info':
        classes.push('border-l-4 border-info-500')
        break
      case 'question':
        classes.push('border-l-4 border-primary-500')
        break
    }
    
    return classes
  }, [variant])

  const iconBgClasses = useMemo(() => {
    switch (variant) {
      case 'danger':
        return 'bg-danger-100 dark:bg-danger-900/20'
      case 'warning':
        return 'bg-warning-100 dark:bg-warning-900/20'
      case 'success':
        return 'bg-success-100 dark:bg-success-900/20'
      case 'info':
        return 'bg-info-100 dark:bg-info-900/20'
      case 'question':
        return 'bg-primary-100 dark:bg-primary-900/20'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }, [variant])

  const iconClasses = useMemo(() => {
    switch (variant) {
      case 'danger':
        return 'text-danger-600 dark:text-danger-400'
      case 'warning':
        return 'text-warning-600 dark:text-warning-400'
      case 'success':
        return 'text-success-600 dark:text-success-400'
      case 'info':
        return 'text-info-600 dark:text-info-400'
      case 'question':
        return 'text-primary-600 dark:text-primary-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }, [variant])

  const handleBackdropClick = () => {
    if (!persistent && !loading) {
      onCancel()
      onClose?.()
    }
  }

  const handleCancel = () => {
    onCancel()
    if (!persistent) {
      onClose?.()
    }
  }

  const handleConfirm = () => {
    onConfirm()
  }

  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show && !persistent && !loading) {
        handleCancel()
      }
    }

    if (show) {
      document.addEventListener('keydown', handleEscape)
      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [show, persistent, loading])

  const IconComponent = iconComponent

  if (!show) return null

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          {/* 백드롭 */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* 다이얼로그 컨테이너 */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(dialogClasses, className)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 아이콘 및 제목 */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center">
                  {/* 아이콘 */}
                  {(IconComponent || variant !== 'default') && (
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full',
                      iconBgClasses
                    )}>
                      {IconComponent && (
                        <IconComponent 
                          className={cn('h-6 w-6', iconClasses)}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* 제목 및 설명 */}
                  <div className={(IconComponent || variant !== 'default') ? 'ml-4' : ''}>
                    {title && (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h3>
                    )}
                    {message && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 커스텀 컨텐츠 */}
              {children && (
                <div className="px-6 pb-4">
                  {children}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4">
                <div className={cn(
                  'flex space-x-3',
                  reverseButtons ? 'flex-row-reverse space-x-reverse' : ''
                )}>
                  {/* 확인 버튼 */}
                  <Button
                    variant={confirmVariant}
                    loading={loading}
                    disabled={loading}
                    loadingText={confirmLoadingText}
                    onClick={handleConfirm}
                  >
                    {confirmText}
                  </Button>
                  
                  {/* 취소 버튼 */}
                  <Button
                    variant="secondary"
                    disabled={loading}
                    onClick={handleCancel}
                  >
                    {cancelText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// 특화된 다이얼로그들
export const DangerConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmVariant'>> = (props) => (
  <ConfirmDialog {...props} variant="danger" confirmVariant="danger" />
)

export const WarningConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmVariant'>> = (props) => (
  <ConfirmDialog {...props} variant="warning" confirmVariant="primary" />
)

export const SuccessConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmVariant'>> = (props) => (
  <ConfirmDialog {...props} variant="success" confirmVariant="primary" />
)

export const InfoConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmVariant'>> = (props) => (
  <ConfirmDialog {...props} variant="info" confirmVariant="primary" />
)

export const QuestionConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'variant' | 'confirmVariant'>> = (props) => (
  <ConfirmDialog {...props} variant="question" confirmVariant="primary" />
)