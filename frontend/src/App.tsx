import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthSessionSync } from './hooks/useAuthSessionSync';
import { router } from './router';
import { useThemeStore } from './store/theme';

export default function App() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  useAuthSessionSync();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true
      }}
    />
  );
}
