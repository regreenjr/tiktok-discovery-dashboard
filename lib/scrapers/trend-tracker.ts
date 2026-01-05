/**
 * Trend Tracker
 * 
 * Discovers trending sounds and hashtags in our niche by searching TikTok.
 * Run: npm run trends
 */

import { ApifyClient } from 'apify-client';
import { supabase, logExecution } from './db.js';
import type { TrendingAsset, ApifyTikTokVideo } from './types.js';
import 'dotenv/config';

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });

// Niche search terms
const SEARCH_QUERIES = [
  'photo cleaner',
  'storage full',
  'iphone storage',
  'camera roll cleanup',
  'delete photos',
  'phone storage hack',
];

// Niche hashtags to track
const HASHTAGS = [
  'photocleaner',
  'storagefull',
  'iphonehacks',
  'cameraroll',
  'phonestorage',
  'deletephotos',
  'iphoneTips',
];

async function main() {
  console.log('📈 Starting trend tracker...');
  await logExecution('trend_tracker', 'started');

  try {
    // 1. Search for niche videos to discover trending sounds
    console.log('Searching for niche videos...');

    // Use TikTok Hashtag Scraper (limit to 3 hashtags to save API costs)
    const hashtagsToSearch = HASHTAGS.slice(0, 3);

    const run = await apify.actor('clockworks/tiktok-hashtag-scraper').call({
      hashtags: hashtagsToSearch,
      resultsLimit: 100,
    });

    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    const videos = items as ApifyTikTokVideo[];
    console.log(`Got ${videos.length} videos from ${hashtagsToSearch.length} hashtags`);

    // 2. Extract trending sounds (Clockworks uses musicMeta structure)
    const soundMap = new Map<string, {
      tiktok_id: string;
      name: string;
      author: string;
      video_count: number;
      total_engagement: number;
    }>();

    for (const video of videos) {
      const videoData = video as any;
      const soundId = videoData.musicMeta?.musicId;
      if (!soundId) continue;

      const existing = soundMap.get(soundId);
      const engagement = (videoData.playCount || 0) +
                        (videoData.diggCount || 0) * 10 +
                        (videoData.commentCount || 0) * 20;

      if (existing) {
        existing.video_count++;
        existing.total_engagement += engagement;
      } else {
        soundMap.set(soundId, {
          tiktok_id: soundId,
          name: videoData.musicMeta?.musicName || 'Unknown',
          author: videoData.musicMeta?.musicAuthor || 'Unknown',
          video_count: 1,
          total_engagement: engagement,
        });
      }
    }

    // 3. Calculate virality scores and prepare for upsert
    const sounds: TrendingAsset[] = Array.from(soundMap.values())
      .map(sound => ({
        asset_type: 'sound' as const,
        tiktok_id: sound.tiktok_id,
        name: sound.name,
        author: sound.author,
        virality_score: Math.min(1,
          (sound.video_count / 20) * 0.3 +
          (Math.log10(sound.total_engagement + 1) / 10) * 0.7
        ),
        video_count: sound.video_count,
        niche_relevance: 0.9,
        is_active: true,
      }))
      .sort((a, b) => b.virality_score - a.virality_score)
      .slice(0, 30);

    console.log(`Found ${sounds.length} trending sounds`);

    // 4. Upsert sounds
    let soundsInserted = 0;
    for (const sound of sounds) {
      const { error } = await supabase
        .from('trending_assets')
        .upsert(sound, { onConflict: 'asset_type,tiktok_id' });
      if (!error) soundsInserted++;
    }

    // 5. Create hashtag assets
    const hashtags: TrendingAsset[] = HASHTAGS.map(tag => ({
      asset_type: 'hashtag' as const,
      tiktok_id: tag,
      name: `#${tag}`,
      author: null,
      virality_score: 0.5, // Default score for tracked hashtags
      video_count: 0,
      niche_relevance: 1.0,
      is_active: true,
    }));

    let hashtagsInserted = 0;
    for (const hashtag of hashtags) {
      const { error } = await supabase
        .from('trending_assets')
        .upsert(hashtag, { onConflict: 'asset_type,tiktok_id' });
      if (!error) hashtagsInserted++;
    }

    // 6. Expire old trends (not seen in 7 days)
    await supabase
      .from('trending_assets')
      .update({ is_active: false })
      .lt('last_checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true);

    console.log(`✅ Upserted ${soundsInserted} sounds, ${hashtagsInserted} hashtags`);
    await logExecution('trend_tracker', 'completed', videos.length, soundsInserted + hashtagsInserted);

  } catch (err) {
    console.error('❌ Error:', err);
    await logExecution('trend_tracker', 'failed', 0, 0, String(err));
    process.exit(1);
  }
}

main();
