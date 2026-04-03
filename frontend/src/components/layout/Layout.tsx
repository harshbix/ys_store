import type { PropsWithChildren } from 'react';
import { useGuestSession } from '../../hooks/useGuestSession';
import { ApiStatusBanner } from '../feedback/ApiStatusBanner';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav.tsx';
import { MobileNav } from './MobileNav';

export function Layout({ children }: PropsWithChildren) {
  useGuestSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primaryForeground">
        Skip to content
      </a>
      <Header />
      <MobileNav />
      <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mb-4">
          <ApiStatusBanner />
        </div>
        {children}
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
