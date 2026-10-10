const { PrismaClient } = require("@prisma/client");
const { s3 } = require("../config/s3");

const prisma = new PrismaClient();

async function cleanup() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

  const staleVideos = await prisma.video.findMany({
    where: {
      status: { in: ["UPLOADING", "PROCESSING"] },
      updatedAt: { lt: cutoff },
    },
  });

  for (const video of staleVideos) {
 

    await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "PROCESSING_FAILED",
        errorMessage: "Cleanup: video stuck for more than 1 hour",
        processingStage: video.processingStage,
        processingAttempts: { increment: 1 },
        lastProcessedAt: new Date(),
      },
    });
  }

  console.log(` Cleanup completed: ${staleVideos.length} videos`);
}

cleanup()
  .catch((err) => {
    console.error("Cleanup failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
