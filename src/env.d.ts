interface ImportMetaEnv {
  /** `preview` (implicit) sau `production`. Vezi CLAUDE.md §7. */
  readonly SITE_MODE?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
