const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Synchronizes and backfills tsvector search vectors for Videos and Users.
 * Can be run manually or during startup.
 */
async function syncSearchVectors() {
  try {
    console.log("--> Starting search vector synchronization...");

    // Update Videos
    const videoCount = await prisma.$executeRawUnsafe(`
      UPDATE "Video"
      SET "searchVector" = setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                           setweight(to_tsvector('english', coalesce(description, '')), 'B')
      WHERE "searchVector" IS NULL OR "searchVector" = ''::tsvector;
    `);

    console.log(`--> Updated searchVector for ${videoCount} videos.`);

    // Update Users
    const userCount = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "searchVector" = setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
                           setweight(to_tsvector('english', coalesce("displayName", '')), 'A') ||
                           setweight(to_tsvector('english', coalesce(bio, '')), 'B')
      WHERE "searchVector" IS NULL OR "searchVector" = ''::tsvector;
    `);

    console.log(`--> Updated searchVector for ${userCount} users.`);
    return { success: true, videoCount, userCount };
  } catch (error) {
    console.error("Error syncing search vectors:", error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  syncSearchVectors().then(() => process.exit(0));
}

module.exports = { syncSearchVectors };
