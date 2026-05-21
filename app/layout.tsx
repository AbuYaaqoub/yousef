import type { Metadata } from 'next';
import './globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Cairo } from 'next/font/google';

const cairo = Cairo({ subsets: ['arabic', 'latin'] });

export const metadata: Metadata = {
  title: 'نقيب | نظام التنقيب واستخراج البيانات الذكي',
  description: 'المنصة الاحترافية المتكاملة لتنقيب واستخلاص بيانات المتاجر الإلكترونية وقنوات التواصل بدقة متناهية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cairo.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
