/**
 * Report Loading Overlay Component
 * Displays loading animation over existing content
 */

import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
   isVisible: boolean;
   title: string;
   desc: string;
}

const ReportLoadingOverlay: FC<Props> = ({ isVisible, title, desc }) => {
   return (
      <AnimatePresence>
         {isVisible && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.3 }}
               className="fixed inset-0 z-50 flex items-center justify-center"
               style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            >
               <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-center"
               >
                  <video className="w-[640px] aspect-video mx-auto mb-4" autoPlay loop muted playsInline>
                     <source src="/videos/loading_cyber.mp4" type="video/mp4" />
                  </video>
                  <p className="text-lg text-white font-semibold">{title}</p>
                  <p className="text-sm text-slate-300 mt-2">{desc}</p>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default ReportLoadingOverlay;
