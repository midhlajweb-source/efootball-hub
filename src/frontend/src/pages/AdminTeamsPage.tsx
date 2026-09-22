import type { Team } from "@/backend";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingState } from "@/components/States";
import { TeamCrest } from "@/components/TeamCrest";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  useCreateTeam,
  useDeleteTeam,
  useTeams,
  useUpdateTeam,
} from "@/hooks/useTournament";
import { errorMessage } from "@/lib/api";
import { ExternalBlob } from "@caffeineai/object-storage";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface TeamDraft {
  name: string;
  shortCode: string;
  crestUrl: string;
}

const EMPTY_DRAFT: TeamDraft = { name: "", shortCode: "", crestUrl: "" };

export function AdminTeamsPage() {
  const { token, logout } = useAdminSession();
  const teamsQuery = useTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [draft, setDraft] = useState<TeamDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teams = teamsQuery.data ?? [];
  const isSaving = createTeam.isPending || updateTeam.isPending;

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (file: File) => {
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((pct) => setUploadProgress(pct));
      const url = blob.getDirectURL();
      setDraft((current) => ({ ...current, crestUrl: url }));
      toast.success("Crest uploaded. Save the team to apply it.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    const name = draft.name.trim();
    const shortCode = draft.shortCode.trim().toUpperCase();
    if (name === "" || shortCode === "") {
      toast.error("Team name and short code are required.");
      return;
    }
    const crestUrl =
      draft.crestUrl.trim() === "" ? null : draft.crestUrl.trim();

    if (editingId !== null) {
      updateTeam.mutate(
        { token, id: editingId, name, shortCode, crestUrl },
        {
          onSuccess: () => {
            toast.success(`${name} updated.`);
            resetForm();
          },
          onError: (error) => toast.error(errorMessage(error)),
        },
      );
      return;
    }

    createTeam.mutate(
      { token, name, shortCode, crestUrl },
      {
        onSuccess: () => {
          toast.success(`${name} added to the tournament.`);
          resetForm();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setDraft({
      name: team.name,
      shortCode: team.shortCode,
      crestUrl: team.crestUrl ?? "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (team: Team) => {
    if (!token) return;
    deleteTeam.mutate(
      { token, id: team.id },
      {
        onSuccess: () => {
          toast.success(`${team.name} removed.`);
          if (editingId === team.id) resetForm();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <AdminLayout username="Midhu" onLogout={() => void logout()}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Roster"
          title="Teams"
          description="Create every team in the tournament, set a short code, and upload a crest."
        />

        <form
          onSubmit={handleSubmit}
          data-ocid="admin.team_form"
          className="space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold uppercase tracking-[0.12em] text-foreground">
              {editingId !== null ? "Edit team" : "Add team"}
            </h2>
            {editingId !== null ? (
              <button
                type="button"
                data-ocid="admin.team_cancel_button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <label
                htmlFor="team-name"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Team name
              </label>
              <input
                id="team-name"
                data-ocid="admin.team_name_input"
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, name: event.target.value }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="e.g. Northside United"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="team-code"
                className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Short code
              </label>
              <input
                id="team-code"
                data-ocid="admin.team_code_input"
                type="text"
                maxLength={4}
                value={draft.shortCode}
                onChange={(event) =>
                  setDraft((c) => ({
                    ...c,
                    shortCode: event.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-sm uppercase text-foreground outline-none transition-smooth focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                placeholder="NSU"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Crest image
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <TeamCrest
                name={draft.name || "New team"}
                shortCode={draft.shortCode}
                crestUrl={draft.crestUrl || undefined}
                size="lg"
              />
              <label
                htmlFor="team-crest"
                data-ocid="admin.team_upload_button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-secondary-foreground transition-smooth hover:border-primary/50 hover:text-primary"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload crest
              </label>
              <input
                ref={fileInputRef}
                id="team-crest"
                data-ocid="admin.team_crest_input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              {draft.crestUrl ? (
                <button
                  type="button"
                  data-ocid="admin.team_crest_clear_button"
                  onClick={() => setDraft((c) => ({ ...c, crestUrl: "" }))}
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-smooth hover:text-destructive"
                >
                  Remove crest
                </button>
              ) : null}
            </div>
            {uploadProgress !== null ? (
              <div
                data-ocid="admin.team_upload_progress"
                className="flex items-center gap-3"
                aria-live="polite"
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-smooth"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] tabular text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            data-ocid="admin.team_submit_button"
            disabled={
              isSaving ||
              draft.name.trim() === "" ||
              draft.shortCode.trim() === ""
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isSaving
              ? "Saving…"
              : editingId !== null
                ? "Save team"
                : "Add team"}
          </button>
        </form>

        {teamsQuery.isLoading ? (
          <LoadingState label="Loading teams" />
        ) : teams.length === 0 ? (
          <EmptyState
            title="No teams registered"
            description="Add the first team above to start building the tournament roster."
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border bg-card">
            {teams.map((team, index) => (
              <li
                key={team.id.toString()}
                data-ocid={`admin.team_item.${index + 1}`}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <TeamCrest
                  name={team.name}
                  shortCode={team.shortCode}
                  crestUrl={team.crestUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {team.name}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {team.shortCode}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`admin.team_edit_button.${index + 1}`}
                  onClick={() => startEdit(team)}
                  aria-label={`Edit ${team.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-ocid={`admin.team_delete_button.${index + 1}`}
                  onClick={() => handleDelete(team)}
                  disabled={deleteTeam.isPending}
                  aria-label={`Delete ${team.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-smooth hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
