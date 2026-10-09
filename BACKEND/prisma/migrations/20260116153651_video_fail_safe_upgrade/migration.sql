-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "lastProcessedAt" TIMESTAMP(3),
ADD COLUMN     "processingAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processingStage" TEXT;
