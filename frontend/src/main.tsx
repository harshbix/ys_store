import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AppErrorBoundary } from './components/feedback/AppErrorBoundary';
import { ToastProvider } from './components/feedback/ToastProvider';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
