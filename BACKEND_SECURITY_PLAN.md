# Backend Security Migration Plan

## Phase A — Foundation

### Angepasste Tabellen
- `Workspace` (neu)
- `WorkspaceMember` (neu)
- `Candidate`
- `Document`
- `ReferenceCheck`
- `AuditLog`
- `GdprConsent`
- `AddonOrder`
- `PasswordResetToken`

### RLS-Helper
```sql
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
```

### RLS-Policies (SQL)
```sql
CREATE POLICY "candidate_workspace_select" ON public."Candidate" FOR SELECT USING (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_insert" ON public."Candidate" FOR INSERT WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_update" ON public."Candidate" FOR UPDATE USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "candidate_workspace_delete" ON public."Candidate" FOR DELETE USING (public.is_workspace_member("workspaceId"));

CREATE POLICY "document_workspace_access" ON public."Document" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "reference_workspace_access" ON public."ReferenceCheck" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "audit_workspace_access" ON public."AuditLog" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "gdpr_workspace_access" ON public."GdprConsent" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "addon_workspace_access" ON public."AddonOrder" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
```
