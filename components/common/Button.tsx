'use client';

import React, { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/types';

interface ExtendedButtonProps extends ButtonProps {
   loadingText?: string;
   block?: boolean;
   outline?: boolean;
   rounded?: boolean;
   iconLeft?: React.ComponentType<{ className?: string }>;
   iconRight?: React.ComponentType<{ className?: string }>;
   children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
   (
      {
         variant = 'default',
         size = 'md',
         type = 'button',
         disabled = false,
         loading = false,
         loadingText = 'Loading...',
         block = false,
         outline = false,
         rounded = false,
         iconLeft: IconLeft,
         iconRight: IconRight,
         className,
         children,
         onClick,
         ...props
      },
      ref,
   ) => {
      const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
         if (!disabled && !loading && onClick) {
            onClick();
         }
      };

      const buttonClasses = useMemo(() => {
         const classes = [
            // 기본 클래스
            'inline-flex items-center justify-center',
            'font-medium transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
         ];

         // 블록 여부
         if (block) {
            classes.push('w-full');
         }

         // 사이즈
         switch (size) {
            case 'xs':
               classes.push('px-1.5 py-0.5 text-xs');
               if (!rounded) classes.push('rounded');
               break;
            case 'sm':
               classes.push('px-2 py-1 text-xs');
               if (!rounded) classes.push('rounded');
               break;
            case 'md':
               classes.push('px-4 py-2 text-base');
               if (!rounded) classes.push('rounded-md');
               break;
            case 'lg':
               classes.push('px-6 py-3 text-lg');
               if (!rounded) classes.push('rounded-lg');
               break;
            default:
               classes.push('px-4 py-2 text-base');
               if (!rounded) classes.push('rounded-md');
               break;
         }

         // 둥근 모서리
         if (rounded) {
            classes.push('rounded-full');
         }

         // 변형별 스타일
         if (outline) {
            // 아웃라인 스타일
            classes.push('border-2 bg-transparent');

            switch (variant) {
               case 'primary':
                  classes.push('border-primary-600 text-primary-600', 'hover:bg-primary-600 hover:text-white', 'focus:ring-primary-500');
                  break;
               case 'secondary':
                  classes.push('border-gray-300 text-gray-700', 'hover:bg-gray-50', 'focus:ring-gray-500');
                  break;
               case 'danger':
                  classes.push('border-danger text-danger', 'hover:bg-danger hover:text-white', 'focus:ring-danger');
                  break;
               case 'ghost':
                  classes.push('border-transparent text-gray-600', 'hover:bg-gray-100 hover:text-gray-900', 'focus:ring-gray-500');
                  break;
               case 'ai':
                  classes.push('border-ai-circuit text-ai-circuit', 'hover:bg-ai-circuit hover:text-white', 'focus:ring-ai-circuit');
                  break;
               case 'cyber':
                  classes.push('border-ai-cyber text-ai-cyber', 'hover:bg-ai-cyber hover:text-white', 'focus:ring-ai-cyber');
                  break;
               default:
                  classes.push('border-gray-300 text-gray-700', 'hover:bg-gray-50', 'focus:ring-gray-500');
                  break;
            }
         } else {
            // 채워진 스타일
            classes.push('border border-transparent');

            switch (variant) {
               case 'primary':
                  classes.push('bg-primary-600 text-white', 'hover:bg-primary-700', 'focus:ring-primary-500');
                  break;
               case 'secondary':
                  classes.push('bg-gray-200 text-gray-900', 'hover:bg-gray-300', 'focus:ring-gray-500');
                  break;
               case 'danger':
                  classes.push('bg-danger text-white', 'hover:bg-red-700', 'focus:ring-danger');
                  break;
               case 'ghost':
                  classes.push('bg-transparent text-gray-600', 'hover:bg-gray-100 hover:text-gray-900', 'focus:ring-gray-500');
                  break;
               case 'ai':
                  classes.push(
                     'bg-gradient-to-r from-ai-circuit to-ai-cyber text-white',
                     'hover:from-ai-circuit/90 hover:to-ai-cyber/90',
                     'focus:ring-ai-circuit shadow-ai-glow',
                  );
                  break;
               case 'cyber':
                  classes.push(
                     'bg-gradient-to-r from-ai-cyber to-violet-600 text-white',
                     'hover:from-violet-600 hover:to-ai-cyber',
                     'focus:ring-ai-cyber shadow-ai-cyber',
                  );
                  break;
               default:
                  classes.push('bg-gray-200 text-gray-900', 'hover:bg-gray-300', 'focus:ring-gray-500');
                  break;
            }
         }

         return classes;
      }, [variant, size, block, outline, rounded]);

      return (
         <button ref={ref} type={type} disabled={disabled || loading} className={cn(buttonClasses, className)} onClick={handleClick} {...props}>
            {/* 로딩 스피너 */}
            {loading && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />}

            {/* 아이콘 (왼쪽) */}
            {IconLeft && !loading && <IconLeft className="w-4 h-4 mr-2" />}

            {/* 텍스트 */}
            <span>{loading ? loadingText : children}</span>

            {/* 아이콘 (오른쪽) */}
            {IconRight && !loading && <IconRight className="w-4 h-4 ml-2" />}
         </button>
      );
   },
);

Button.displayName = 'Button';

// AI 테마 버튼들
export const AIButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>((props, ref) => (
   <Button
      {...props}
      ref={ref}
      className={cn(
         'bg-gradient-to-r from-ai-circuit to-ai-cyber text-white',
         'hover:shadow-ai-glow hover:scale-105',
         'focus:ring-ai-circuit',
         props.className,
      )}
   />
));

export const NeuralButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>((props, ref) => (
   <Button
      {...props}
      ref={ref}
      className={cn('bg-gradient-to-r from-ai-cyber to-ai-glow text-white', 'hover:shadow-neural hover:scale-105', 'focus:ring-ai-cyber', props.className)}
   />
));

export const CyberButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>((props, ref) => (
   <Button
      {...props}
      ref={ref}
      className={cn('bg-gradient-to-r from-ai-glow to-ai-neon text-white', 'hover:shadow-cyber hover:scale-105', 'focus:ring-ai-glow', props.className)}
   />
));

AIButton.displayName = 'AIButton';
NeuralButton.displayName = 'NeuralButton';
CyberButton.displayName = 'CyberButton';
