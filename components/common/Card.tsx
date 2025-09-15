'use client';

import React, { ReactNode, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { CardProps } from '@/types';

interface ExtendedCardProps extends CardProps {
   footer?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, ExtendedCardProps>(
   (
      {
         title,
         variant = 'default',
         size = 'md',
         padding = 'md',
         footerPadding = 'md',
         hover = true,
         clickable = false,
         children,
         header,
         footer,
         backgroundColor,
         className,
         ...props
      },
      ref,
   ) => {
      const cardClasses = useMemo(() => {
         const classes = ['ai-card neon-hover flex flex-col justify-between'];

         // 변형별 스타일 (배경은 인라인 스타일로 처리하므로 배경색 클래스 제거)
         switch (variant) {
            case 'ai':
               classes.push('backdrop-blur-sm border border-ai-circuit/30', 'hover:border-ai-circuit/50 hover:shadow-ai-glow');
               break;
            case 'neural':
               classes.push('backdrop-blur-sm', 'border border-secondary-700/50 shadow-neural', 'hover:shadow-ai-glow hover:border-ai-circuit/50');
               break;
            case 'cyber':
               classes.push('border border-ai-cyber/30 shadow-cyber', 'hover:border-ai-cyber/50 hover:shadow-ai-glow');
               break;
            default:
               classes.push('backdrop-blur-sm', 'border border-secondary-700/50', 'hover:border-secondary-600');
               break;
         }

         // 사이즈별 스타일
         switch (size) {
            case 'sm':
               classes.push('text-sm');
               break;
            case 'lg':
               classes.push('text-lg');
               break;
         }

         // 클릭 가능 여부
         if (clickable) {
            classes.push('cursor-pointer');
         }

         return classes.join(' ');
      }, [variant, size, clickable]);

      const cardStyle = useMemo(() => {
         // 기본적으로 모든 카드에 0.8 투명도 적용
         const defaultStyle: React.CSSProperties = {
            backdropFilter: 'blur(4px)',
         };

         if (backgroundColor) {
            defaultStyle.backgroundColor =
               backgroundColor.includes('rgba') || backgroundColor === 'transparent' ? backgroundColor : `rgba(${backgroundColor}, 0.8)`;
         } else {
            // variant별 기본 배경색 설정
            switch (variant) {
               case 'ai':
                  defaultStyle.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(0, 255, 127, 0.1) 100%)';
                  break;
               case 'neural':
                  defaultStyle.backgroundColor = 'rgba(31, 41, 55, 0.8)';
                  break;
               case 'cyber':
                  defaultStyle.background = 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 255, 127, 0.1) 100%)';
                  break;
               default:
                  defaultStyle.backgroundColor = 'rgba(31, 41, 55, 0.8)';
                  break;
            }
         }

         return defaultStyle;
      }, [backgroundColor, variant]);

      const headerClasses = useMemo(() => {
         const classes = [];

         switch (padding) {
            case 'none':
               classes.push('!p-0');
               break;
            case 'sm':
               classes.push('!p-4');
               break;
            case 'lg':
               classes.push('!p-8');
               break;
            default:
               break;
         }

         return classes.join(' ');
      }, [padding]);

      const bodyClasses = useMemo(() => {
         const classes = [];

         switch (padding) {
            case 'none':
               classes.push('!p-0');
               break;
            case 'sm':
               classes.push('!p-4');
               break;
            case 'lg':
               classes.push('!p-8');
               break;
            default:
               break;
         }

         return classes.join(' ');
      }, [padding]);

      const footerClasses = useMemo(() => {
         const classes = [];
         const finalPadding = footerPadding || padding;

         switch (finalPadding) {
            case 'none':
               classes.push('!p-0');
               break;
            case 'sm':
               classes.push('!p-4');
               break;
            case 'lg':
               classes.push('!p-8');
               break;
            default:
               break;
         }

         return classes.join(' ');
      }, [footerPadding, padding]);

      return (
         <div ref={ref} className={cn(cardClasses, className)} style={cardStyle} {...props}>
            <div>
               {/* 헤더 영역 */}
               {(header || title) && (
                  <div className={cn('p-6 border-b border-default', headerClasses)}>
                     {header || (title && <h3 className="text-lg font-semibold text-primary">{title}</h3>)}
                  </div>
               )}

               {/* 바디 영역 */}
               <div className={cn('p-0', bodyClasses)}>{children}</div>
            </div>

            {/* 푸터 영역 */}
            {footer && (
               <div
                  className={cn(
                     'p-6',
                     footerClasses,
                     footerPadding !== 'none' ? 'border-t border-gray-200 dark:border-gray-700 bg-card-footer' : 'bg-transparent',
                  )}
               >
                  {footer}
               </div>
            )}
         </div>
      );
   },
);

Card.displayName = 'Card';

// 추가적인 Card 관련 컴포넌트들
export const CardHeader = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
   <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
   </div>
);

export const CardTitle = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
   <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-primary', className)} {...props}>
      {children}
   </h3>
);

export const CardDescription = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
   <p className={cn('text-sm text-muted', className)} {...props}>
      {children}
   </p>
);

export const CardContent = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
   <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
   </div>
);

export const CardFooter = ({ children, className, ...props }: { children: ReactNode; className?: string; [key: string]: any }) => (
   <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
   </div>
);

CardFooter.displayName = 'CardFooter';
