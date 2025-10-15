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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/90 backdrop-blur-sm">
      <div className="mx-auto grid h-20 max-w-lg grid-cols-7 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
