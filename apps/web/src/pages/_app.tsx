import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import type { AppProps } from 'next/app';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { theme } from '@/theme';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <style jsx global>{`
          .chatSent {
            background: #eaf7ff;
            color: #0f172a;
            padding: 10px 14px;
            border-radius: 18px;
            max-width: 80%;
            word-break: break-word;
            align-self: flex-end;
            margin-left: auto;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }

          .chatReceived {
            background: #f8fafc;
            color: #0f172a;
            padding: 10px 14px;
            border-radius: 18px;
            max-width: 80%;
            word-break: break-word;
            align-self: flex-start;
            margin-right: auto;
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          }
        `}</style>
        <Notifications position="top-right" />
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
