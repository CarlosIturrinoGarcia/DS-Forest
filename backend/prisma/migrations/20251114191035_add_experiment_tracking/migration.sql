-- AlterTable
ALTER TABLE "Node" ADD COLUMN "actualResult" TEXT;
ALTER TABLE "Node" ADD COLUMN "expectedOutcome" TEXT;
ALTER TABLE "Node" ADD COLUMN "experimentId" TEXT;
ALTER TABLE "Node" ADD COLUMN "hypothesis" TEXT;
ALTER TABLE "Node" ADD COLUMN "learnings" TEXT;
ALTER TABLE "Node" ADD COLUMN "metrics" TEXT;
ALTER TABLE "Node" ADD COLUMN "notebookLink" TEXT;
ALTER TABLE "Node" ADD COLUMN "parameters" TEXT;
