import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkWindowAI } from '@/lib/window-ai';

export const CurrentModel = () => {
  const { data: currentModel, isLoading, error } = useQuery({
    queryKey: ['current-model'],
    queryFn: async () => {
      try {
        await checkWindowAI();
        const model = await window.ai.getCurrentModel();
        console.log('Current model:', model); // Debug log
        return model;
      } catch (error) {
        console.error('Error fetching current model:', error);
        throw error;
      }
    },
    refetchInterval: 2000, // Refresh every 2 seconds to keep model info updated
  });

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Loading model...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Error loading model</span>
      </div>
    );
  }

  // Extract provider and model name
  const [provider, modelName] = currentModel?.split('/') || ['Unknown', 'Unknown'];
  const displayProvider = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="text-sm text-gray-500 flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>Provider: {displayProvider}</span>
      <span>•</span>
      <span>Model: {modelName || 'Not selected'}</span>
    </div>
  );
};