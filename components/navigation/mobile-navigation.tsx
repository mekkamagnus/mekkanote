'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Notes', href: '/notes' },
    { name: 'Create Note', href: '/notes/create' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" style={{ color: 'var(--text-primary)' }}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[280px]"
        style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              style={{ color: 'var(--text-primary)' }}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="flex flex-col gap-2 py-4 flex-grow">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}