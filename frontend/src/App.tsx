import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { LazyMotion } from 'framer-motion';
import { useAuthSessionSync } from './hooks/useAuthSessionSync';
import { router } from './router';
import { useThemeStore } from './store/theme';

const loadFeatures = () => import('./lib/motion-features').then(res => res.default);

export default function App() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  useAuthSessionSync();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <LazyMotion features={loadFeatures} strict>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true
        }}
      />
    </LazyMotion>
  );
}
