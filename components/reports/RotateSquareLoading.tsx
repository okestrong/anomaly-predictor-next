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

const RotateSquareLoading: FC<Props> = ({ isVisible, title, desc }) => {
   return (
      <>
         <AnimatePresence>
            {isVisible && (
               <div className="space-tunnel fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="cube-frame"></div>
                  <div className="absolute top-1/2 translate-y-[100px] left-1/2 -translate-x-1/2">
                     <p className="text-lg text-white font-semibold">{title}</p>
                     <p className="text-sm text-slate-300 mt-2">{desc}</p>
                  </div>
               </div>
            )}
         </AnimatePresence>
         <style jsx global>{`
            .space-tunnel {
               position: absolute;
               left: 0;
               top: 0;
               width: 100vw;
               height: 100vh;
               background: #000;
            }
            .space-tunnel .cube-frame {
               position: absolute;
               width: 80px;
               height: 80px;
               top: calc(50% - 80px / 2);
               left: calc(50% - 80px / 2);
               border: 2px solid rgba(128, 255, 255, 0.6);
               box-shadow:
                  0 0 20px rgba(0, 255, 255, 0.3),
                  0 0 60px rgba(0, 128, 255, 0.2);
               mix-blend-mode: screen;
               filter: drop-shadow(2px 0 red) drop-shadow(-2px 0 blue);
               animation: fly 3s linear infinite;
            }

            .cube-frame:nth-child(1) {
               animation-delay: 0s;
            }

            .cube-frame:nth-child(2) {
               animation-delay: 0.375s;
            }

            .cube-frame:nth-child(3) {
               animation-delay: 0.75s;
            }

            .cube-frame:nth-child(4) {
               animation-delay: 1.125s;
            }

            .cube-frame:nth-child(5) {
               animation-delay: 1.5s;
            }

            .cube-frame:nth-child(6) {
               animation-delay: 1.875s;
            }

            .cube-frame:nth-child(7) {
               animation-delay: 2.25s;
            }

            .cube-frame:nth-child(8) {
               animation: none !important;
            }

            @keyframes fly {
               0% {
                  transform: translateZ(600px) scale(0.1) rotate(0deg);
                  opacity: 0;
               }
               25% {
                  opacity: 1;
               }
               100% {
                  transform: translateZ(-800px) scale(2.5) rotate(360deg);
                  opacity: 0;
               }
            }
            .description-container {
               position: absolute;
               top: 32px;
               left: 32px;
               text-align: left;
               letter-spacing: 3px;
            }
            .description-container .title {
               font-size: 19px;
               font-weight: 500;
               color: white;
               text-transform: uppercase;
            }
            .description-container .subtitle {
               margin-top: 6px;
               font-size: 26px;
               font-weight: 500;
               color: magenta;
               text-transform: uppercase;
            }

            .author-container {
               position: absolute;
               width: 50%;
               right: 21px;
               bottom: 21px;
               text-align: right;
            }
            .author-container .picture {
               position: absolute;
               right: 0;
               top: -42px;
               margin-top: -12px;
               width: 42px;
               height: 42px;
               background-size: 42px;
               background-position: center;
               background-repeat-style: 'no-repeat';
               background-image: url(https://assets.codepen.io/595576/internal/avatars/users/default.png?format=auto&version=1689877807&width=80&height=80);
            }
            .author-container .title {
               font-size: 16px;
               letter-spacing: 2px;
               color: white;
            }
         `}</style>
      </>
   );
};

export default RotateSquareLoading;
