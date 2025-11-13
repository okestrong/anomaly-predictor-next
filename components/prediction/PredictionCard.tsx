'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import AIScanLoader from './AIScanLoader';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import regexifyString from 'regexify-string';
import parse from 'html-react-parser';

// Cyberpunk-style gradient backgrounds for cards
const gradientStyles = {
   critical: 'bg-gradient-to-br from-red-700/20 via-red-600/10 to-orange-700/5 border-red-200/30',
   high: 'bg-gradient-to-br from-orange-700/20 via-amber-600/10 to-yellow-700/5 border-orange-200/30',
   medium: 'bg-gradient-to-br from-blue-700/20 via-cyan-600/10 to-teal-700/5 border-blue-300/30',
   low: 'bg-gradient-to-br from-green-700/20 via-emerald-600/10 to-lime-700/5 border-green-200/30',
};

const severityColors = {
   critical: 'text-red-400',
   high: 'text-orange-400',
   medium: 'text-blue-400',
   low: 'text-green-400',
};

interface PredictionCardProps {
   prediction: any;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
   const [isHovered, setIsHovered] = useState(false);

   return (
      <motion.div
         className={cn(
            'relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300',
            gradientStyles[prediction.severity as keyof typeof gradientStyles],
            'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
         )}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         whileHover={{ scale: prediction.isLoading ? 1 : 1.02 }}
         onHoverStart={() => !prediction.isLoading && setIsHovered(true)}
         onHoverEnd={() => setIsHovered(false)}
      >
         {/* Holographic shimmer effect */}
         <motion.div
            className="absolute inset-0 rounded-xl opacity-0"
            animate={{ opacity: isHovered ? 0.1 : 0 }}
            style={{
               background: 'linear-gradient(105deg, transparent 40%, rgba(0, 212, 255, 0.3) 50%, transparent 60%)',
            }}
         />

         {/* Loading state with AI scan animation */}
         {prediction.isLoading && (
            <div className="absolute inset-0 z-20 rounded-xl overflow-hidden">
               <AIScanLoader height="h-full" />
            </div>
         )}

         {/* Content */}
         <div className={cn('relative z-10', prediction.isLoading && 'opacity-30')}>
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg bg-black/20', severityColors[prediction.severity as keyof typeof severityColors])}>
                     <ExclamationTriangleIcon className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-semibold text-white">{prediction.name}</h3>
                     <p className="text-xs text-gray-400 mt-1">{prediction.mlModel}</p>
                  </div>
               </div>

               {/* Trend indicator */}
               <div className="flex items-center space-x-1">
                  {prediction.trend === 'worsening' ? (
                     <ArrowTrendingUpIcon className="w-4 h-4 text-red-400" />
                  ) : prediction.trend === 'improving' ? (
                     <ArrowTrendingDownIcon className="w-4 h-4 text-green-400" />
                  ) : (
                     <div className="w-4 h-4 rounded-full bg-yellow-400/20" />
                  )}
                  <span className="text-xs text-gray-400">{prediction.trend}</span>
               </div>
            </div>

            {/* Probability bar */}
            <div className="mb-4">
               <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Probability</span>
                  <span className={severityColors[prediction.severity as keyof typeof severityColors]}>{(prediction.probability * 100).toFixed(1)}%</span>
               </div>
               <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                     className={cn('h-full rounded-full', {
                        'bg-gradient-to-r from-red-500 to-red-400': prediction.severity === 'critical',
                        'bg-gradient-to-r from-orange-500 to-orange-400': prediction.severity === 'high',
                        'bg-gradient-to-r from-blue-500 to-blue-400': prediction.severity === 'medium',
                        'bg-gradient-to-r from-green-500 to-green-400': prediction.severity === 'low',
                     })}
                     initial={{ width: 0 }}
                     animate={{ width: `${prediction.probability * 100}%` }}
                     transition={{ duration: 1, ease: 'easeOut' }}
                  />
               </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Confidence</div>
                  <div className="text-sm font-semibold text-ai-circuit">{(prediction.confidence * 100).toFixed(0)}%</div>
               </div>
               <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Time to Impact</div>
                  <div className="text-sm font-semibold text-orange-400">{prediction.timeToImpact}</div>
               </div>
            </div>

            {/* AI Analysis Summary */}
            {prediction.aiAnalysis && (
               <motion.div
                  className="mb-4 relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-900/10 via-blue-900/10 to-purple-900/10 border border-cyan-500/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
               >
                  {/* Animated circuit lines background */}
                  <div className="absolute inset-0 opacity-5">
                     <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                           <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                              <circle cx="20" cy="20" r="1" fill="currentColor" className="text-cyan-400" />
                              <path
                                 d="M 0 20 L 20 20 M 20 0 L 20 20 M 20 20 L 20 40 M 20 20 L 40 20"
                                 stroke="currentColor"
                                 strokeWidth="0.5"
                                 className="text-cyan-400"
                              />
                           </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#circuit)" />
                     </svg>
                  </div>

                  {/* Glowing corner indicators */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-400/50 rounded-br-full blur-sm" />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400/50 rounded-bl-full blur-sm" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-400/50 rounded-tr-full blur-sm" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-400/50 rounded-tl-full blur-sm" />

                  <div className="relative p-3">
                     <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center space-x-1">
                           <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                              animate={{
                                 opacity: [1, 0.3, 1],
                                 scale: [1, 0.8, 1],
                              }}
                              transition={{
                                 duration: 2,
                                 repeat: Infinity,
                                 ease: 'easeInOut',
                              }}
                           />
                           <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">AI ANALYSIS</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 via-transparent to-transparent" />
                     </div>

                     <motion.article
                        className="prose prose-gray max-w-none dark:prose-invert text-xs leading-relaxed !text-gray-100 pl-3 border-l-2 border-cyan-500/30 h-[220px] overflow-y-auto whitespace-pre-wrap break-words"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                     >
                        {/*<Markdown*/}
                        {/*   remarkPlugins={[remarkGfm]}*/}
                        {/*   components={{*/}
                        {/*      h1: props => <h1 className="text-2xl font-bold" {...props} />,*/}
                        {/*      h2: props => <h2 className="text-2xl font-medium" {...props} />,*/}
                        {/*      h3: props => <h3 className="text-xl font-semibold" {...props} />,*/}
                        {/*      table: props => <table className="w-full border-collapse border border-gray-300" {...props} />,*/}
                        {/*      thead: props => <thead className="bg-gray-50" {...props} />,*/}
                        {/*      th: props => <th className="border border-gray-300 px-3 py-2 text-left bg-neutral-400 text-black" {...props} />,*/}
                        {/*      td: props => <td className="border border-gray-300 px-3 py-2 align-top" {...props} />,*/}
                        {/*   }}*/}
                        {/*>*/}
                        {prediction.aiAnalysis.replace(/\\n/, '\n')}
                        {/*</Markdown>*/}
                     </motion.article>

                     {/* Data stream effect */}
                     <motion.div
                        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                        animate={{
                           x: ['-100%', '100%'],
                        }}
                        transition={{
                           duration: 3,
                           repeat: Infinity,
                           ease: 'linear',
                        }}
                     />
                  </div>
               </motion.div>
            )}

            {/* Affected components */}
            <div className="mb-3">
               <div className="text-xs text-gray-400 mb-2">Affected Components</div>
               <div className="flex flex-wrap gap-1">
                  {prediction.affectedComponents.map((comp: string, idx: number) => (
                     <span key={idx} className="text-xs px-2 py-1 bg-black/30 rounded-md text-cyan-400 border border-cyan-500/20">
                        {comp}
                     </span>
                  ))}
               </div>
            </div>

            {/* AI Recommendations */}
            {/*{isHovered && (*/}
            <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="max-h-[200px] overflow-y-auto mt-4 pt-4 border-t border-white/10"
            >
               <div className="text-xs text-gray-400 mb-2">AI Recommendations</div>
               <ul className="space-y-1">
                  {prediction.recommendedActions.map((action: string, idx: number) => {
                     const words = regexifyString({
                        pattern: /`+(.+?)`+/gim,
                        decorator: (match, index) =>
                           `<span class="inline-flex items-center bg-green-900">${match
                              .replace(/`/gim, '')
                              .replace(/<(.+?)>/gim, '$1')
                              .replace(/\\[.]/gim, '.')}</span>`,
                        input: action,
                     }).join('');
                     return (
                        <li key={idx} className="text-xs text-gray-300 flex items-start">
                           <div className="flex items-start">
                              <span className="text-ai-circuit mr-1">•</span>
                              <div className="pl-2 whitespace-pre-wrap break-words">
                                 {parse(
                                    regexifyString({
                                       pattern: /\*+(.+?)\*+/gim,
                                       decorator: (match, index, result) => `<strong>${match.replace(/^[*]+(.+?)[*]+$/gim, '$1')}</strong>`,
                                       input: words,
                                    }).join(''),
                                 )}
                              </div>
                           </div>
                        </li>
                     );
                  })}
               </ul>
            </motion.div>
            {/*)}*/}
         </div>
      </motion.div>
   );
}
