'use client';

import { useEffect, useState } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { PT_Sans } from 'next/font/google';
import { doc } from 'firebase/firestore';
import { applyTheme, colorThemes, defaultTheme } from '@/lib/themes';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

// Metadata can't be dynamic in a client component, 
// but we can set the title dynamically in a useEffect.
// export const metadata: Metadata = {
//   title: 'Desafío HV',
//   description: 'Tu app de desarrollo personal.',
//   manifest: '/manifest.json',
// };

function AppThemeManager({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);
  
  useEffect(() => {
    document.title = 'Desafío HV';
    const selectedThemeId = userProfile?.selectedThemeId;
    const theme = colorThemes.find(t => t.id === selectedThemeId) || defaultTheme;
    applyTheme(theme.primary);
  }, [userProfile?.selectedThemeId]);

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false)
 
  useEffect(() => {
    setIsClient(true)
  }, [])

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
            <AppThemeManager>
              <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background shadow-2xl">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
                  {children}
                </main>
                <MobileNav />
              </div>
              {isClient && <Toaster />}
            </AppThemeManager>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
