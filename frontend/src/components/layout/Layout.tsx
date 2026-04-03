import type { PropsWithChildren } from 'react';
import { useGuestSession } from '../../hooks/useGuestSession';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Topbar } from './Topbar';

export function Layout({ children }: PropsWithChildren) {
  useGuestSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primaryForeground">
        Skip to content
      </a>
      <Topbar />
      <Header />
      <MobileNav />
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
