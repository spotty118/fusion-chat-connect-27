import { Card } from "@/components/ui/card";
import { Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import React, { useEffect } from 'react';  // Added proper React import

export const AnalyticsTools = () => {
  const { toast } = useToast();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['chat-analytics'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase
        .from('chat_messages')
        .select('provider, model, created_at')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const providerStats = data.reduce((acc: Record<string, number>, msg) => {
        acc[msg.provider] = (acc[msg.provider] || 0) + 1;
        return acc;
      }, {});

      const modelStats = data.reduce((acc: Record<string, number>, msg) => {
        acc[msg.model] = (acc[msg.model] || 0) + 1;
        return acc;
      }, {});

      const totalMessages = data.length;
      const lastMessage = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        providerStats,
        modelStats,
        totalMessages,
        lastMessageDate: lastMessage?.created_at,
      };
    }
  });

  // Handle error with useEffect
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold">Chat Analytics</h2>
      </div>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading analytics...</p>
      ) : analytics ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Overview</h3>
            <p className="text-sm text-gray-600">
              Total Messages: {analytics.totalMessages}
            </p>
            {analytics.lastMessageDate && (
              <p className="text-sm text-gray-600">
                Last Message: {new Date(analytics.lastMessageDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Provider Usage</h3>
            <div className="space-y-1">
              {Object.entries(analytics.providerStats).map(([provider, count]) => (
                <div key={provider} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{provider}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Model Usage</h3>
            <div className="space-y-1">
              {Object.entries(analytics.modelStats).map(([model, count]) => (
                <div key={model} className="flex justify-between text-sm">
                  <span className="text-gray-600">{model}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};