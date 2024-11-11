import { useQuery } from '@tanstack/react-query';
import { validateProviderApiKey } from '../utils/apiValidation';

export const useProviderStatus = (provider: string, apiKey: string) => {
  return useQuery({
    queryKey: ['provider-status', provider, apiKey],
    queryFn: () => validateProviderApiKey(provider, apiKey),
    enabled: !!apiKey,
  });
};