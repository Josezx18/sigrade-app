import { config } from 'dotenv';
import { join } from 'path';

// Load the workspace-root .env so jest works regardless of the CWD Nx uses
// (apps/api). CI provides env vars directly; dotenv never overrides existing
// values. Loading a missing file is a no-op, which makes env-optional suites
// (RLS/MinIO) skip cleanly when they are not configured.
config({ path: join(__dirname, '..', '..', '..', '.env') });