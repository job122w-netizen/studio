import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { PT_Sans } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Desafío HV',
  description: 'Tu app de desarrollo personal.',
  manifest: '/manifest.json',
};

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className={cn(ptSans.variable, 'font-body antialiased h-full bg-muted/40')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background shadow-2xl">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                {children}
              </main>
              <MobileNav />
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
