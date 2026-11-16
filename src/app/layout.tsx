import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';
import '../styles.css';
import localFont from 'next/font/local';
import InterfaceMotion from '../components/ui/InterfaceMotion';
const manrope = localFont({src: './fonts/Manrope-Variable.ttf', weight: '200 800', style: 'normal', variable: '--font-manrope', display: 'swap', preload: true, adjustFontFallback: 'Arial'});
export const metadata: Metadata = {
  title: 'Đạo tràng Phật Hào – Biên Hòa',
  description: 'Cổng thông tin Đạo Tràng Phật Hào — quản lý hồ sơ huynh đệ và đăng ký tu học.',
  icons: {icon: '/logo-ctn.png'},
};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#f5f7fa'};
export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="vi" className={manrope.variable}>
      <body><InterfaceMotion />{children}</body>
    </html>
  );
}
