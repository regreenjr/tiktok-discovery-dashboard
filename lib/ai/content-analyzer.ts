/**
 * AI Content Pattern Analyzer
 * Uses Claude 3.5 Sonnet to analyze TikTok video captions and identify patterns
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ContentAnalysis {
  hook_type: string;
  content_format: string;
  emotional_trigger: string;
  cta_type: string;
  summary: string;
}

const ANALYSIS_PROMPT = `Analyze this TikTok video caption and identify content patterns:

Caption: "{caption}"
Views: {views}
Engagement Rate: {engagement}%

Identify:
1. **Hook Type** (first 3 seconds attention grabber):
   - Question, Shock, Tutorial, Story, Stat, or Problem

2. **Content Format** (overall structure):
   - Tutorial, BeforeAfter, Meme, ProductDemo, Storytime, or Listicle

3. **Emotional Trigger** (primary emotion):
   - PainPoint, Aspiration, Curiosity, Humor, FOMO, or Relief

4. **CTA Type** (call-to-action):
   - Comment, Share, Follow, ClickLink, Save, or None

5. **Summary** (1 sentence why this performed well)

Respond ONLY with valid JSON:
{
  "hook_type": "Question",
  "content_format": "Tutorial",
  "emotional_trigger": "PainPoint",
  "cta_type": "Comment",
  "summary": "Uses question hook to address common iPhone storage problem, prompting saves and shares."
}`;

/**
 * Analyzes a single video caption using Claude API
 */
export async function analyzeVideo(
  caption: string,
  views: number,
  engagementRate: number
): Promise<ContentAnalysis> {
  const prompt = ANALYSIS_PROMPT
    .replace('{caption}', caption)
    .replace('{views}', views.toLocaleString())
    .replace('{engagement}', (engagementRate * 100).toFixed(2));

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Parse JSON response
  try {
    const analysis = JSON.parse(responseText);
    return {
      hook_type: analysis.hook_type || 'Unknown',
      content_format: analysis.content_format || 'Unknown',
      emotional_trigger: analysis.emotional_trigger || 'Unknown',
      cta_type: analysis.cta_type || 'None',
      summary: analysis.summary || '',
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    throw new Error('Invalid AI response format');
  }
}

/**
 * Analyzes multiple videos with rate limiting
 */
export async function analyzeVideoBatch(
  videos: Array<{
    video_id: string;
    caption: string;
    views: number;
    engagement_rate: number;
  }>
): Promise<Map<string, ContentAnalysis>> {
  const results = new Map<string, ContentAnalysis>();

  for (const video of videos) {
    try {
      const analysis = await analyzeVideo(
        video.caption,
        video.views,
        video.engagement_rate
      );
      results.set(video.video_id, analysis);

      // Rate limiting: 500ms delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to analyze video ${video.video_id}:`, error);
    }
  }

  return results;
}
