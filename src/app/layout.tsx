import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';
import '../styles.css';
import {Geist} from 'next/font/google';
const geist = Geist({subsets: ['latin', 'vietnamese'], variable: '--font-geist', display: 'swap'});
export const metadata: Metadata = {
  title: 'Đạo Tràng Phật Hào · Cổng thông tin Đạo Tràng',
  description: 'Cổng thông tin Đạo Tràng Phật Hào — quản lý hồ sơ huynh đệ và đăng ký tu học.',
  icons: {icon: '/logo-ctn.png'},
};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#f5f7fa'};
export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="vi" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
