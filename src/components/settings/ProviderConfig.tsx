import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelSelector } from '@/components/ModelSelector';
import { CheckCircle2, XCircle } from 'lucide-react';
import { UseQueryResult } from '@tanstack/react-query';

interface ProviderConfigProps {
  provider: string;
  label: string;
  bgColor: string;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  selectedModel: string;
  onModelSelect: (model: string) => void;
  statusQuery: UseQueryResult<boolean, unknown>;
}

const ProviderConfig = ({
  provider,
  label,
  bgColor,
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelSelect,
  statusQuery
}: ProviderConfigProps) => {
  const status = statusQuery.data;
  const isLoading = statusQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${provider}-key`} className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${bgColor}`} />
          <span>{label}</span>
        </Label>
        {apiKey && !isLoading && (
          status ? 
            <CheckCircle2 className="h-5 w-5 text-green-500" /> :
            <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <Input
        id={`${provider}-key`}
        type="password"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="Enter API key..."
        className="mb-2"
      />
      <ModelSelector
        provider={provider}
        apiKey={apiKey}
        onModelSelect={onModelSelect}
        selectedModel={selectedModel}
      />
    </div>
  );
};

export default ProviderConfig;