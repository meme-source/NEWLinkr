// Hardcoded demo user shown in the sidebar until a real auth/session layer
// exists. Phase 1+ will replace this with the current Supabase Auth user.

export type WorkspaceShellUser = {
  name: string;
  initial: string;
  email: string;
};

export const WORKSPACE_DEMO_USER: WorkspaceShellUser = {
  name: "李明",
  initial: "李",
  email: "liming@mybrand.com",
};
