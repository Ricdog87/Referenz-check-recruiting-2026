-- Phase A: Workspace foundation with RLS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "Workspace" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "WorkspaceMember" (
  "userId" TEXT NOT NULL,
  "workspaceId" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("userId", "workspaceId"),
  CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE
);

CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

ALTER TABLE "Candidate" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "Document" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "ReferenceCheck" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "AuditLog" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "GdprConsent" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "AddonOrder" ADD COLUMN "workspaceId" UUID;
ALTER TABLE "PasswordResetToken" ADD COLUMN "workspaceId" UUID;

UPDATE "Candidate" c
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE w.name = 'legacy-' || c."userId";

INSERT INTO "Workspace" ("id", "name")
SELECT gen_random_uuid(), 'legacy-' || u.id
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "Workspace" w WHERE w.name = 'legacy-' || u.id
);

UPDATE "Candidate" c
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE w.name = 'legacy-' || c."userId";

UPDATE "Document" d
SET "workspaceId" = c."workspaceId"
FROM "Candidate" c
WHERE c.id = d."candidateId";

UPDATE "ReferenceCheck" r
SET "workspaceId" = c."workspaceId"
FROM "Candidate" c
WHERE c.id = r."candidateId";

UPDATE "AuditLog" a
SET "workspaceId" = c."workspaceId"
FROM "Candidate" c
WHERE a."entity" = 'candidate' AND a."entityId" = c.id;

UPDATE "GdprConsent" g
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE w.name = 'legacy-' || g."userId";

UPDATE "AddonOrder" ao
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE w.name = 'legacy-' || ao."userId";

UPDATE "PasswordResetToken" prt
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE w.name = 'legacy-' || prt."userId";

ALTER TABLE "Candidate" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "ReferenceCheck" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "GdprConsent" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AddonOrder" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "PasswordResetToken" ALTER COLUMN "workspaceId" SET NOT NULL;

ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "ReferenceCheck" ADD CONSTRAINT "ReferenceCheck_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "GdprConsent" ADD CONSTRAINT "GdprConsent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "AddonOrder" ADD CONSTRAINT "AddonOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;

CREATE INDEX "Candidate_workspaceId_idx" ON "Candidate"("workspaceId");
CREATE INDEX "Document_workspaceId_idx" ON "Document"("workspaceId");
CREATE INDEX "ReferenceCheck_workspaceId_idx" ON "ReferenceCheck"("workspaceId");
CREATE INDEX "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");
CREATE INDEX "GdprConsent_workspaceId_idx" ON "GdprConsent"("workspaceId");
CREATE INDEX "AddonOrder_workspaceId_idx" ON "AddonOrder"("workspaceId");

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."WorkspaceMember" wm
    JOIN public."User" u ON u.id = wm."userId"
    WHERE wm."workspaceId" = target_workspace_id
      AND lower(u.email) = lower(auth.jwt()->>'email')
  );
$$;

ALTER TABLE public."Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReferenceCheck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GdprConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AddonOrder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_workspace_select" ON public."Candidate" FOR SELECT USING (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_insert" ON public."Candidate" FOR INSERT WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_update" ON public."Candidate" FOR UPDATE USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_delete" ON public."Candidate" FOR DELETE USING (public.is_workspace_member("workspaceId"));

CREATE POLICY "document_workspace_access" ON public."Document" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "reference_workspace_access" ON public."ReferenceCheck" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "audit_workspace_access" ON public."AuditLog" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "gdpr_workspace_access" ON public."GdprConsent" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "addon_workspace_access" ON public."AddonOrder" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
