-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "effort" INTEGER NOT NULL DEFAULT 5,
    "value" INTEGER NOT NULL DEFAULT 5,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "assignees" TEXT,
    "tags" TEXT,
    "dueDate" TEXT,
    "hypothesis" TEXT,
    "expectedOutcome" TEXT,
    "actualResult" TEXT,
    "learnings" TEXT,
    "experimentId" TEXT,
    "metrics" TEXT,
    "parameters" TEXT,
    "notebookLink" TEXT,
    "experimentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Node_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Node" ("actualResult", "assignees", "createdAt", "description", "dueDate", "effort", "expectedOutcome", "experimentId", "hypothesis", "id", "label", "learnings", "metrics", "notebookLink", "parameters", "priority", "projectId", "status", "tags", "type", "updatedAt", "value", "x", "y") SELECT "actualResult", "assignees", "createdAt", "description", "dueDate", "effort", "expectedOutcome", "experimentId", "hypothesis", "id", "label", "learnings", "metrics", "notebookLink", "parameters", "priority", "projectId", "status", "tags", "type", "updatedAt", "value", "x", "y" FROM "Node";
DROP TABLE "Node";
ALTER TABLE "new_Node" RENAME TO "Node";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
