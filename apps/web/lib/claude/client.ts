import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export const MODEL = 'claude-sonnet-4-20250514';
