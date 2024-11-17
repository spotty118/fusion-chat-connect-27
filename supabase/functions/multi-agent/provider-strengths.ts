export const PROVIDER_KEYWORD_STRENGTHS: Record<string, Record<string, string[]>> = {
  openai: {
    code: ['function', 'algorithm', 'programming', 'debug', 'typescript', 'javascript'],
    technical: ['explain', 'how', 'what', 'analysis', 'compare'],
    creative: ['story', 'imagine', 'creative', 'design', 'generate'],
    general: ['help', 'can', 'would', 'should', 'opinion']
  },
  claude: {
    code: ['review', 'refactor', 'optimize', 'architecture', 'pattern'],
    technical: ['research', 'paper', 'academic', 'study', 'science'],
    creative: ['write', 'novel', 'poetry', 'artistic', 'narrative'],
    general: ['discuss', 'consider', 'think', 'evaluate', 'assess']
  },
  google: {
    code: ['implement', 'build', 'develop', 'test', 'structure'],
    technical: ['technical', 'system', 'process', 'method', 'theory'],
    creative: ['innovative', 'unique', 'original', 'brainstorm', 'conceptual'],
    general: ['summarize', 'explain', 'describe', 'outline', 'review']
  },
  openrouter: {
    code: ['code', 'program', 'script', 'syntax', 'compile'],
    technical: ['document', 'specification', 'requirement', 'standard', 'protocol'],
    creative: ['design', 'create', 'invent', 'compose', 'craft'],
    general: ['analyze', 'suggest', 'recommend', 'advise', 'guide']
  }
};

export const BASE_STRENGTHS: Record<string, Record<string, number>> = {
  openai: { code: 0.85, technical: 0.8, creative: 0.75, general: 0.8 },
  claude: { code: 0.75, technical: 0.85, creative: 0.9, general: 0.85 },
  google: { code: 0.8, technical: 0.85, creative: 0.75, general: 0.8 },
  openrouter: { code: 0.75, technical: 0.75, creative: 0.8, general: 0.85 }
};