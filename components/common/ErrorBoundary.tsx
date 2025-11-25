'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
   children: ReactNode;
   fallback?: ReactNode;
}

interface State {
   hasError: boolean;
   error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
   }

   render() {
      if (this.state.hasError) {
         if (this.props.fallback) {
            return this.props.fallback;
         }

         return (
            <div
               style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #1a1f2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1f2e 100%)',
                  color: '#00ffff',
               }}
            >
               <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>WebGL Initialization Error</h2>
               <p style={{ color: '#888', marginBottom: '1rem' }}>Unable to initialize 3D visualization.</p>
               <p style={{ fontSize: '0.875rem', color: '#666' }}>Please refresh the page or try a different browser.</p>
               <button
                  onClick={() => window.location.reload()}
                  style={{
                     marginTop: '1.5rem',
                     padding: '0.75rem 1.5rem',
                     background: '#00ffff',
                     color: '#000',
                     border: 'none',
                     borderRadius: '0.25rem',
                     cursor: 'pointer',
                     fontWeight: 'bold',
                  }}
               >
                  Reload Page
               </button>
            </div>
         );
      }

      return this.props.children;
   }
}
