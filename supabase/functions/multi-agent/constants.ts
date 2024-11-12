export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const AGENT_ROLES = {
  ANALYST: {
    role: 'analyst',
    instructions: 'You are an AI analyst. Analyze the problem and break it down into key components. Focus on understanding requirements and identifying potential challenges.'
  },
  IMPLEMENTER: {
    role: 'implementer',
    instructions: 'You are an AI implementer. Based on the analysis, provide concrete solutions or implementations. Be specific and practical.'
  },
  REVIEWER: {
    role: 'reviewer',
    instructions: 'You are an AI reviewer. Review the proposed implementation, identify potential issues, and suggest improvements. Consider edge cases and best practices.'
  }
};