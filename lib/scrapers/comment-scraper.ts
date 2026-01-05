/**
 * Comment Scraper
 * 
 * Scrapes comments from high-performing videos and uses Claude to extract pain points.
 * Run: npm run comments
 */

import { ApifyClient } from 'apify-client';
import Anthropic from '@anthropic-ai/sdk';
import { supabase, logExecution } from './db.js';
import type { PainPoint, ApifyComment } from './types.js';
import 'dotenv/config';

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCH_SIZE = 10; // Videos to process per run

async function main() {
  console.log('💬 Starting comment scraper...');
  await logExecution('comment_scraper', 'started');

  try {
    // 1. Get unanalyzed videos with good engagement
    const { data: videos, error } = await supabase
      .from('competitor_videos')
      .select('video_id, video_url, account_handle, caption, views, comments')
      .eq('analyzed', false)
      .gte('comments', 3)
      .gte('views', 1000)
      .order('engagement_rate', { ascending: false })
      .limit(BATCH_SIZE);

    if (error) throw error;
    if (!videos?.length) {
      console.log('No unanalyzed videos found');
      return;
    }

    console.log(`Found ${videos.length} videos to analyze`);

    let totalInsights = 0;

    for (const video of videos) {
      console.log(`\nProcessing: ${video.video_url}`);

      // 2. Scrape comments via Apify
      const run = await apify.actor('apidojo/tiktok-comments-scraper').call({
        startUrls: [video.video_url],
        maxItems: 100,
      });

      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      const comments = items as ApifyComment[];

      if (!comments.length) {
        console.log('  No comments found, skipping');
        continue;
      }

      // 3. Sort by likes and take top 50
      const topComments = comments
        .map(c => ({
          text: c.text || c.comment || '',
          likes: c.diggCount || c.likes || 0,
        }))
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 50);

      const commentsText = topComments
        .map(c => `[${c.likes} likes] ${c.text}`)
        .join('\n');

      // 4. Extract insights with Claude
      console.log('  Analyzing with Claude...');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are analyzing TikTok comments on a video about photo management/storage to extract actionable insights for our app Swipe67.

Video context:
- Account: ${video.account_handle}
- Caption: ${video.caption}
- URL: ${video.video_url}

Comments (format: [likes] comment text):
${commentsText}

---

Analyze these comments and extract insights. For each insight, categorize it and provide a clean, actionable version.

Categories:
- pain_point: A frustration or problem users have with photo management
- objection: A reason someone might not use a photo cleaner app
- question: Something users want to know
- feature_request: A feature users wish existed
- complaint: A specific complaint about existing solutions

Respond with ONLY a JSON array of insights, no other text:

[
  {
    "category": "pain_point",
    "raw_comment": "original comment text",
    "extracted_insight": "Clean, actionable version of the insight",
    "sentiment": 0.0,
    "upvotes": 123,
    "keywords": ["relevant", "keywords"]
  }
]

Rules:
- Only include comments that reveal genuine user insights
- Skip generic comments like "lol" or "😂"
- Sentiment: -1 (very negative) to 1 (very positive)
- Keywords should be 2-5 relevant terms for matching
- Extract 5-15 insights maximum
- Make extracted_insight specific and actionable, not generic`
        }],
      });

      // 5. Parse Claude's response
      const content = response.content[0];
      if (content.type !== 'text') continue;

      let insights: any[] = [];
      try {
        // Handle markdown code blocks if present
        const jsonMatch = content.text.match(/```json\s*([\s\S]*?)```/) ||
                         content.text.match(/(\[[\s\S]*\])/);
        if (jsonMatch) {
          insights = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        console.log('  Failed to parse Claude response');
        continue;
      }

      // 6. Insert pain points
      const painPoints: PainPoint[] = insights.map(i => ({
        source_video_id: video.video_id,
        raw_comment: i.raw_comment,
        category: i.category,
        extracted_insight: i.extracted_insight,
        keywords: i.keywords || [],
        sentiment: i.sentiment || 0,
        upvotes: i.upvotes || 0,
        used_in_content: false,
      }));

      if (painPoints.length) {
        await supabase.from('pain_points').insert(painPoints);
        totalInsights += painPoints.length;
        console.log(`  Extracted ${painPoints.length} insights`);
      }

      // 7. Mark video as analyzed
      await supabase
        .from('competitor_videos')
        .update({ analyzed: true })
        .eq('video_id', video.video_id);
    }

    console.log(`\n✅ Extracted ${totalInsights} total insights from ${videos.length} videos`);
    await logExecution('comment_scraper', 'completed', videos.length, totalInsights);

  } catch (err) {
    console.error('❌ Error:', err);
    await logExecution('comment_scraper', 'failed', 0, 0, String(err));
    process.exit(1);
  }
}

main();
