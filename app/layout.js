import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { LangProvider } from '@/lib/context/LangContext';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata = {
  title: 'SSST Internal Tool | Shri Shyam Sarnam Seva Trust',
  description: 'Internal management system for Shri Shyam Sarnam Seva Trust. Jai Shri Shyam.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <LangProvider>
            {children}
            <ToastContainer />
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
