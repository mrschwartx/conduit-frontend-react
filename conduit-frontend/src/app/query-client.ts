import { QueryClient } from '@tanstack/react-query'
import { isTransportError, toAppError } from '@/api/errors'

/** 4xx answers are final; network failures and 5xx get one retry. */
export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: retry ? (count, error) => count < 1 && isTransportError(toAppError(error)) : false,
      },
      mutations: { retry: false },
    },
  })
}
