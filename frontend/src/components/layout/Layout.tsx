import type { PropsWithChildren } from 'react';
import { useGuestSession } from '../../hooks/useGuestSession';
import { ApiStatusBanner } from '../feedback/ApiStatusBanner';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { PageWrapper } from './PageWrapper';

export function Layout({ children }: PropsWithChildren) {
  useGuestSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primaryForeground">
        Skip to content
      </a>
      <Header />
      <MobileNav />
      <PageWrapper>
        <div className="mb-4">
          <ApiStatusBanner />
        </div>
        {children}
      </PageWrapper>
      <Footer />
    </div>
  );
}
