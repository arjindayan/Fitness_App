import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '../state/SessionProvider';

type GlobalErrorHandler = (error: any, isFatal?: boolean) => void;

declare const ErrorUtils: {
  getGlobalHandler?: () => GlobalErrorHandler | undefined;
  setGlobalHandler?: (handler?: GlobalErrorHandler) => void;
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        retry: 1,
      },
    },
  });

type Props = {
  children?: ReactNode;
};

export function AppProvider({ children }: Props) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    const defaultHandler = ErrorUtils.getGlobalHandler?.();

    ErrorUtils.setGlobalHandler?.((error, isFatal) => {
      console.error('Global error caught:', error, error?.stack, error?.componentStack);
      if (defaultHandler) {
        defaultHandler(error, isFatal);
      }
    });

    return () => {
      if (defaultHandler) {
        ErrorUtils.setGlobalHandler?.(defaultHandler);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>{children ?? <Slot />}</QueryClientProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
