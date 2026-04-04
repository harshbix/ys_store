import type { PropsWithChildren } from 'react';

export function PageWrapper({ children }: PropsWithChildren) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 pb-12 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}
