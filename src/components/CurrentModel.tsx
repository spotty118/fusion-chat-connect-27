import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database } from 'lucide-react';

export const CurrentModel = () => {
  const { data: currentModel, isLoading, error } = useQuery({
    queryKey: ['current-model'],
    queryFn: async () => {
      const fusionMode = localStorage.getItem('fusionMode') === 'true';
      
      if (fusionMode) {
        return 'fusion/multi-provider';
      }

      const manualApiKey = localStorage.getItem('manualApiKey');
      const manualModel = localStorage.getItem('manualModel');

      if (!manualApiKey || !manualModel) {
        throw new Error('No model configuration found');
      }

      return `openai/${manualModel}`;
    },
    refetchInterval: 2000,
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-white/80 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <Database className="h-4 w-4" />
        <span>Loading model...</span>
      </div>
    );
  }

  if (error || !currentModel) {
    return (
      <div className="text-sm text-white/80 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <Database className="h-4 w-4" />
        <span>No model configured</span>
      </div>
    );
  }

  const fusionMode = localStorage.getItem('fusionMode') === 'true';
  if (fusionMode) {
    return (
      <div className="text-sm text-white/80 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500" />
        <Database className="h-4 w-4" />
        <span>Fusion Mode</span>
        <span className="mx-1">•</span>
        <span>Multi-Provider</span>
      </div>
    );
  }

  const [provider, ...modelParts] = currentModel.split('/');
  const modelName = modelParts.join('/');
  const displayProvider = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="text-sm text-white/80 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <Database className="h-4 w-4" />
      <span>{displayProvider}</span>
      <span className="mx-1">•</span>
      <span>{modelName}</span>
    </div>
  );
};