import type { Metadata } from 'next';
import './globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Readex_Pro } from 'next/font/google';
const readex_pro = Readex_Pro({ subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'SallaHunter Pro',
  description: 'البحث والاستخراج التلقائي لمتاجر سلة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={readex_pro.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={readex_pro.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
