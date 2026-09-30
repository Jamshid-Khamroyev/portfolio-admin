import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Admin — Jamshid Xamroyev',
  description: 'Portfolio boshqaruv paneli',
};

/* Sahifa chizilishidan oldin saqlangan (yoki tizim) rejimini qo'llaydi — miltillashsiz */
const themeScript = `try{var t=localStorage.getItem('admin-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: themeScript}} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
