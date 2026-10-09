-- AlterTable
ALTER TABLE "User" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "searchVector" tsvector;
