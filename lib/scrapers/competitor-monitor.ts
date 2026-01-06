/**
 * Competitor Monitor
 * 
 * Scrapes TikTok profiles of competitor accounts and stores high-performing videos.
 * Run: npm run competitor
 */

import { ApifyClient } from 'apify-client';
import { supabase, logExecution } from './db.js';
import type { CompetitorAccount, CompetitorVideo, ApifyTikTokVideo } from './types.js';
import convert from 'heic-convert';
import 'dotenv/config';

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
const MIN_VIEWS = 1_000;

/**
 * Download image from TikTok, convert to JPEG if needed, and upload to Supabase Storage
 */
async function downloadAndUploadImage(imageUrl: string, videoId: string, index: number): Promise<string | null> {
  try {
    // Download image from TikTok
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let uploadBuffer = inputBuffer;

    // Try to convert if it's HEIF/HEVC format
    try {
      const jpegBuffer = await convert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.85
      });
      uploadBuffer = Buffer.from(jpegBuffer);
    } catch (conversionError) {
      // If conversion fails, image might already be JPEG/PNG - upload as-is
      console.log(`  Skipping conversion for image ${index} (already in browser-compatible format)`);
    }

    // Upload to Supabase Storage
    const fileName = `${videoId}_${index}.jpg`;
    const { data, error } = await supabase.storage
      .from('tiktok-images')
      .upload(fileName, uploadBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`Supabase upload error:`, error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('tiktok-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error downloading/uploading image:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 Starting competitor monitor...');
  await logExecution('competitor_monitor', 'started');

  try {
    // 1. Get active competitor accounts
    const { data: competitors, error } = await supabase
      .from('competitor_accounts')
      .select('id, handle, category')
      .eq('is_active', true);

    if (error) throw error;
    if (!competitors?.length) {
      console.log('No active competitors found');
      return;
    }

    console.log(`Found ${competitors.length} competitors to scrape`);

    // 2. Build profile URLs
    const startUrls = competitors.map(c => `https://www.tiktok.com/@${c.handle}`);
    const handleToId = Object.fromEntries(
      competitors.map(c => [c.handle.toLowerCase(), c.id])
    );

    // 3. Run Apify scraper
    console.log('Running Apify TikTok Profile Scraper...');
    const run = await apify.actor('apidojo/tiktok-profile-scraper').call({
      startUrls,
      maxItems: 30 * competitors.length, // ~30 videos per profile
    });

    // 4. Get results from dataset
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    // Filter out "noResults" markers
    const realVideos = items.filter((item: any) => !item.noResults && item.id);
    console.log(`Got ${realVideos.length} videos from Apify`);

    // 5. Transform and filter videos
    const filteredVideos = (realVideos as ApifyTikTokVideo[]).filter(video => {
      const views = video.views || 0;
      return views >= MIN_VIEWS && video.id;
    });

    console.log(`Processing ${filteredVideos.length} videos...`);

    const videos: CompetitorVideo[] = [];
    for (const video of filteredVideos) {
      const handle = video.channel?.username || '';
      const views = video.views || 0;
      const likes = video.likes || 0;
      const comments = video.comments || 0;
      const shares = video.shares || 0;
      const hashtags = video.hashtags || [];

      // Detect post type (slideshow vs video)
      const isSlideshow = !!(video.imagePost || video.images);
      const postType = isSlideshow ? 'slideshow' : 'video';

      // Extract and upload slideshow images
      let uploadedImages: string[] = [];
      if (isSlideshow) {
        const rawImages = video.imagePost?.images || video.images || [];
        const imageUrls = rawImages.map((img: any) => {
          if (typeof img === 'string') return img;
          return img.imageURL || img.url || img.imageUrl || null;
        }).filter((url: string | null) => url !== null);

        if (imageUrls.length > 0) {
          console.log(`📸 Downloading ${imageUrls.length} images for slideshow ${video.id}...`);

          for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            const supabaseUrl = await downloadAndUploadImage(url, video.id, i);
            if (supabaseUrl) {
              uploadedImages.push(supabaseUrl);
            }
          }

          console.log(`✅ Uploaded ${uploadedImages.length}/${imageUrls.length} images for ${video.id}`);
        }
      }

      videos.push({
        account_id: handleToId[handle.toLowerCase()] || null,
        account_handle: handle,
        video_id: video.id,
        video_url: video.postPage || `https://www.tiktok.com/@${handle}/video/${video.id}`,
        caption: video.title || '',
        hashtags: hashtags.filter(tag => tag).map(tag => tag.toLowerCase()),
        sound_id: video.song?.id?.toString() || null,
        sound_name: video.song?.title || null,
        duration_seconds: video.video?.duration || null,
        post_type: postType,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        views,
        likes,
        comments,
        shares,
        engagement_rate: views > 0 ? (likes + comments + shares) / views : 0,
        discovered_at: new Date().toISOString(),
        analyzed: false,
      });
    }

    console.log(`${videos.length} videos passed filters`);

    // 6. Upsert to database (update existing records with new images)
    let inserted = 0;
    for (const video of videos) {
      const { error: insertError } = await supabase
        .from('competitor_videos')
        .upsert(video, { onConflict: 'video_id' });

      if (!insertError) inserted++;
    }

    console.log(`✅ Inserted ${inserted} new videos`);
    await logExecution('competitor_monitor', 'completed', videos.length, inserted);

  } catch (err) {
    console.error('❌ Error:', err);
    await logExecution('competitor_monitor', 'failed', 0, 0, String(err));
    process.exit(1);
  }
}

main();
