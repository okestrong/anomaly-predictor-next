import Colors from '@/utils/color';

export const networkFlowOption = (imgName?: string) => ({
   fullScreen: false,
   background: {
      color: 'transparent',
   },
   particles: {
      number: {
         value: 1000,
         density: {
            enable: false,
            area: 2000, // 적절한 밀도
         },
      },
      links: {
         enable: true,
         distance: 150,
         opacity: 0.2,
      },
   },
   polygon: {
      enable: true,
      type: 'inline',
      move: {
         radius: 10,
      },
      inline: {
         arrangement: 'random-point',
      },
      draw: {
         enable: false,
         stroke: {
            color: '#ffffff',
            width: 0.5,
         },
      },
      scale: 1.8,
      url: `/images/${imgName}` || '/images/brain-blue.svg',
      position: {
         x: 50,
         y: 50,
      },
   },
   emitters: {
      position: { x: 0, y: 50 },
      rate: {
         quantity: 2,
         delay: 0.1,
      },
      particles: {
         move: {
            speed: 10,
            direction: 'right',
            outModes: 'destroy',
         },
         life: {
            duration: { value: 2 },
         },
      },
   },
});

export const imageMaskOption = (imgName: string) => ({
   fullScreen: false,
   background: {
      color: 'transparent',
   },
   fpsLimit: 120,
   particles: {
      color: {
         value: ['#3b82f6', '#6366f1', '#8b5cf6', '#1d4ed8', '#4f46e5', '#a855f7'],
      },
      links: {
         enable: true,
         distance: 70,
         color: '#6366f1',
         opacity: 0.7,
         width: 0.8,
         triangles: {
            enable: false,
            color: '#ffffff',
            opacity: 0.1,
         },
         blink: false,
         consent: true,
         warp: false,
      },
      move: {
         enable: true,
         random: true,
         straight: false,
         speed: 0.7,
         direction: 'none',
         outModes: {
            default: 'bounce',
         },
      },
      number: {
         value: 800,
         density: {
            enable: false,
            area: 2000,
         },
      },
      opacity: {
         value: 0.5,
         animation: {
            enable: true,
            speed: 0.5,
            minimumValue: 0.1,
            sync: true,
         },
      },
      size: {
         value: 3,
         random: {
            enable: true,
            minimumValue: 1,
         },
         animation: {
            enable: true,
            speed: 3,
            sync: false,
         },
      },
      shape: {
         type: 'circle',
      },
   },
   polygon: {
      enable: true,
      type: 'inline',
      move: {
         radius: 10,
      },
      inline: {
         arrangement: 'random-point',
      },
      draw: {
         enable: false,
         stroke: {
            color: '#ffffff',
            width: 0.5,
         },
      },
      scale: 1.2,
      url: `/images/${imgName}` || '/images/brain-blue.svg',
      position: {
         x: 50,
         y: 50,
      },
   },
   emitters: [
      {
         position: {
            x: 25,
            y: 25,
         },
         rate: {
            delay: 10,
            quantity: 1,
         },
         particles: {
            number: {
               value: 1,
            },
            color: {
               value: Colors.indigo[300],
            },
            shape: {
               type: 'circle',
            },
            opacity: {
               value: 1,
               animation: {
                  enable: true,
                  speed: 0.5,
                  minimumValue: 0.3,
                  sync: false,
               },
            },
            size: {
               value: 4,
               animation: {
                  enable: true,
                  speed: 3,
                  minimumValue: 3,
                  sync: false,
               },
            },
            // ⭐ 중요: 움직임 설정
            move: {
               enable: true,
               direction: 'inside',
               speed: { min: 0.5, max: 1.5 },
               outModes: 'destroy',
               bounceOnBarrier: true,
               path: {
                  enable: true,
                  options: {
                     waveLength: { min: 3, max: 15 },
                     waveHeight: { min: 1, max: 15 },
                  },
                  generator: 'zigZagPathGenerator',
               },
            },
            // 수명 제한 (선택사항)
            life: {
               duration: {
                  value: 60, // 15초 후 소멸
               },
               count: 2,
            },
         },
      },
      {
         position: {
            x: 75,
            y: 25,
         },
         rate: {
            delay: 10,
            quantity: 1,
         },
         particles: {
            number: {
               value: 1,
            },
            color: {
               value: Colors.sky[500],
            },
            shape: {
               type: 'circle',
            },
            opacity: {
               value: 1,
               animation: {
                  enable: true,
                  speed: 0.5,
                  minimumValue: 0.3,
                  sync: false,
               },
            },
            size: {
               value: 4,
               animation: {
                  enable: true,
                  speed: 3,
                  minimumValue: 3,
                  sync: false,
               },
            },
            // ⭐ 중요: 움직임 설정
            move: {
               enable: true,
               direction: 'inside',
               speed: { min: 0.5, max: 2 },
               outModes: 'none',
               bounceOnBarrier: true,
               path: {
                  enable: true,
                  options: {
                     waveLength: { min: 3, max: 15 },
                     waveHeight: { min: 1, max: 15 },
                  },
                  generator: 'zigZagPathGenerator',
               },
            },
            // 수명 제한 (선택사항)
            life: {
               duration: {
                  value: 60, // 15초 후 소멸
               },
               count: 2,
            },
         },
      },
      {
         position: {
            x: 75,
            y: 75,
         },
         rate: {
            delay: 10,
            quantity: 1,
         },
         particles: {
            number: {
               value: 1,
            },
            color: {
               value: Colors.blue[300],
            },
            shape: {
               type: 'square',
            },
            opacity: {
               value: 1,
               animation: {
                  enable: true,
                  speed: 0.5,
                  minimumValue: 0.3,
                  sync: false,
               },
            },
            size: {
               value: 4,
               animation: {
                  enable: true,
                  speed: 3,
                  minimumValue: 3,
                  sync: false,
               },
            },
            // ⭐ 중요: 움직임 설정
            move: {
               enable: true,
               direction: 'inside',
               speed: { min: 0.5, max: 1.5 },
               outModes: 'destroy',
               bounceOnBarrier: true,
               path: {
                  enable: true,
                  options: {
                     waveLength: { min: 3, max: 15 },
                     waveHeight: { min: 1, max: 15 },
                  },
                  generator: 'zigZagPathGenerator',
               },
            },
            // 수명 제한 (선택사항)
            life: {
               duration: {
                  value: 60, // 15초 후 소멸
               },
               count: 2,
            },
         },
      },
   ],
   interactivity: {
      events: {
         onHover: {
            enable: true,
            mode: ['connect', 'bubble'],
            parallax: {
               enable: true,
               force: -60,
               smooth: 10,
            },
         },
         onClick: {
            enable: true,
            mode: ['push', 'grab'],
         },
      },
      modes: {
         bubble: {
            distance: 200,
            size: 10,
            duration: 2,
            opacity: 0.8,
         },
         connect: {
            distance: 300,
            links: {
               opacity: 1,
               width: 2,
            },
         },
         grab: {
            distance: 200,
            links: {
               opacity: 1,
               width: 3,
            },
         },
         push: {
            quantity: 4,
         },
      },
   },
   detectRetina: true,
});
