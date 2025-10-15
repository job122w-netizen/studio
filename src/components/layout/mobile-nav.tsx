'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, BookOpenText, Dice5, Dumbbell, Store, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Estudio', icon: BookOpenText },
  { href: '/perfil', label: 'Perfil', icon: User },
  { href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { href: '/tienda', label: 'Tienda', icon: Store },
  { href: '/pasehv', label: 'Pase HV', icon: Award },
  { href: '/casino', label: 'Casino', icon: Dice5 },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-card/95 backdrop-blur-sm sm:h-auto">
      <nav className="mx-auto grid h-full max-w-lg grid-cols-7 items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary',
                isActive && 'text-primary bg-muted/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
