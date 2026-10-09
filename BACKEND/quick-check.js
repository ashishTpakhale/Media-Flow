const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Fix View Counts - Recalculate and update all view counts
 * Run this with: node fix-view-counts.js
 * 
 * This script will:
 * 1. Find all videos
 * 2. Count actual qualified viewers for each
 * 3. Update the view count if it's incorrect
 */

const MIN_VIEW_SECONDS = 20;
const MIN_VIEW_PERCENT = 0.3;

async function fixViewCounts() {
  console.log("\n======================================");
  console.log("FIX VIEW COUNTS");
  console.log("======================================\n");

  try {
    // Get all videos
    console.log("📹 Fetching all videos...");
    const videos = await prisma.video.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        duration: true,
        watchHistory: {
          select: {
            userId: true,
            watchDuration: true,
          },
        },
      },
    });

    console.log(`   Found ${videos.length} videos\n`);

    let fixedCount = 0;
    let correctCount = 0;

    // Process each video
    for (const video of videos) {
      // Calculate actual qualified viewers
      const qualifiedViewers = new Set();

      for (const watch of video.watchHistory) {
        const timeQualified = watch.watchDuration >= MIN_VIEW_SECONDS;
        const percentQualified = video.duration
          ? watch.watchDuration >= video.duration * MIN_VIEW_PERCENT
          : false;

        if (timeQualified || percentQualified) {
          qualifiedViewers.add(watch.userId);
        }
      }

      const actualViews = qualifiedViewers.size;
      const recordedViews = video.views;

      // Check if needs fixing
      if (actualViews !== recordedViews) {
        console.log(`📹 ${video.title}`);
        console.log(`   Recorded: ${recordedViews} views`);
        console.log(`   Actual: ${actualViews} views`);
        console.log(`   Difference: ${actualViews - recordedViews}`);

        // Update the video
        await prisma.video.update({
          where: { id: video.id },
          data: { views: actualViews },
        });

        console.log(`   ✅ Fixed! Updated to ${actualViews} views\n`);
        fixedCount++;
      } else {
        correctCount++;
      }
    }

    // Summary
    console.log("======================================");
    console.log("SUMMARY");
    console.log("======================================\n");
    console.log(`Total videos checked: ${videos.length}`);
    console.log(`✅ Already correct: ${correctCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);

    if (fixedCount === 0) {
      console.log("\n🎉 All view counts were already correct!");
    } else {
      console.log(`\n✅ Successfully fixed ${fixedCount} video(s)!`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n======================================\n");
}

// Run the fix
fixViewCounts();