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
        console.log('Current model:', model);
        return model;
      } catch (error) {
        console.error('Error fetching current model:', error);
        throw error;
      }
    },
    refetchInterval: 2000,
    retry: 3,
    retryDelay: 1000,
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
    console.error('Error in CurrentModel component:', error);
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Error loading model</span>
      </div>
    );
  }

  if (!currentModel) {
    return (
      <div className="text-sm text-gray-500 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <span>No model selected</span>
      </div>
    );
  }

  // Extract provider and model name
  const [provider, ...modelParts] = currentModel.split('/');
  const modelName = modelParts.join('/');
  const displayProvider = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="text-sm text-gray-500 flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>{currentModel}</span>
    </div>
  );
};