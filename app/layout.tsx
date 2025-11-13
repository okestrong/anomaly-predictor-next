import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/600.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/800.css';
import '@fontsource/orbitron/900.css';
import 'simplebar-react/dist/simplebar.min.css';
import { ReactNode } from 'react';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { TopologyProvider } from '@/providers/TopologyProvider';
import ToastProvider from '@/providers/ToastProvider';

const inter = Inter({
   variable: '--font-inter',
   subsets: ['latin'],
   weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
   title: 'Ceph AI Dashboard',
   description: 'AI-powered anomaly detection dashboard for Ceph clusters',
};

export default function RootLayout({
   children,
}: Readonly<{
   children: ReactNode;
}>) {
   return (
      <html lang="ko" className="dark">
         <body className={`${inter.variable} font-sans antialiased`}>
            <ToastProvider />
            <WebSocketProvider autoConnect={false}>
               <TopologyProvider autoInitialize={true}>{children}</TopologyProvider>
            </WebSocketProvider>
         </body>
      </html>
   );
}
