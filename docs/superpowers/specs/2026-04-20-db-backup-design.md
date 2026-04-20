# Database Backup and Auto-Update System Design

## Purpose
Enhance the existing system with automated database backup capabilities, active restore/rollback functionality, and an auto-execution mechanism for new SQL files placed in `server/db/`. 

## Architecture & Components

### 1. Configuration (System Parameters)
Instead of creating a new configuration table, we will leverage the existing `sys_config` system. We will insert the following default keys into `sys_config`:
- `sys.backup.cron`: Cron expression for automated backups (e.g., `0 0 2 * * *` for daily at 2 AM).
- `sys.backup.limit`: Maximum number of backup files to retain (e.g., `30`).
- `sys.backup.path`: Storage path for backups (default: `../upload/backups`).

### 2. Backend Services (`micro-monitor` & `micro-system`)
**Backup/Restore Service:**
- Use `mysqldump` via Node.js `child_process.exec` to generate `.sql` backups.
- Provide APIs to:
  - Trigger an immediate manual backup.
  - List available backups (read from the backup directory).
  - Restore a backup using `mysql` CLI via `child_process.exec`.
  - Delete specific backup files.
- **Auto-cleanup**: After a backup completes, the system counts the `.sql` files in the backup directory. If the count exceeds `sys.backup.limit`, it deletes the oldest files based on file creation time.

**Auto-SQL Executor (DB Migration):**
- Create a new table: `sys_db_updates` (`id`, `filename`, `executed_at`, `status`, `error_msg`).
- Create a Cron Job (or startup task) in `micro-system` that scans `server/db/` for `.sql` files.
- For each file, check if it exists in `sys_db_updates` with a success status.
- If not, execute the file using raw TypeORM queries or `mysql` CLI. Record the execution result in `sys_db_updates`.

### 3. Frontend (Vue 3 Admin)
**New Menu & View: Database Backup Management**
- **Location**: Under "System Tools" or "System Monitor" (depending on existing menu structure).
- **Features**:
  - Table listing all available backup files (filename, size, creation date).
  - "Backup Now" button.
  - Action column: "Restore" and "Delete".
  - "Restore" will show a high-risk confirmation dialog before proceeding.
- **Config Management**: Users can adjust the cron schedule, limit, and path in the existing "System Parameters Configuration" page.

## Data Flow
1. **Automated Backup**: CronJob reads `sys.backup.cron` -> triggers `mysqldump` -> saves to disk -> checks limit -> deletes oldest if over limit.
2. **Manual Restore**: User clicks "Restore" -> API receives filename -> warns frontend -> `mysql` CLI imports the file -> returns success.
3. **Auto-Update**: App starts/polls -> reads `server/db/*.sql` -> compares with `sys_db_updates` -> runs `mysql` on new files -> logs success/failure.

## Trade-offs and Constraints
- **Dependency**: Requires `mysqldump` and `mysql` binaries to be accessible in the server environment running the Node.js application.
- **Performance**: Restoring large databases may take time and lock tables. The API should ideally be asynchronous or have a long timeout. We'll start with synchronous execution but return clear error messages if it fails.
- **Security**: The backup directory must be protected from direct web access. It should reside outside the public `serveRoot` or be denied access by Nginx/Express.

## Testing Strategy
- Create dummy `.sql` files in `server/db/` and verify they are executed and recorded in `sys_db_updates`.
- Run a manual backup, verify the `.sql` file is created.
- Adjust `sys.backup.limit` to `1` and run two backups to verify auto-cleanup works.
- Restore the database from a backup and verify data consistency.
