import type {Metadata, Viewport} from 'next';
import {Inter, JetBrains_Mono, Space_Grotesk} from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap'});
const spaceGrotesk = Space_Grotesk({subsets: ['latin', 'latin-ext'], variable: '--font-space-grotesk', display: 'swap'});
const jetbrainsMono = JetBrains_Mono({subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-jetbrains-mono', display: 'swap'});

export const metadata: Metadata = {
  title: 'Admin — Jamshid Xamroyev',
  description: 'Portfolio boshqaruv paneli',
  icons: {icon: '/icons/icon-192.png', apple: '/icons/icon-192.png'},
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    {media: '(prefers-color-scheme: dark)', color: '#090D0B'},
    {media: '(prefers-color-scheme: light)', color: '#F6F8F6'},
  ],
};

/* Sahifa chizilishidan oldin saqlangan (yoki tizim) rejimini qo'llaydi — miltillashsiz */
const themeScript = `try{var t=localStorage.getItem('admin-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{__html: themeScript}} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
