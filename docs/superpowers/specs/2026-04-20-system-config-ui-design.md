# System Configuration UI Restructure Design

## Purpose
The current "System Parameters Configuration" page exclusively uses a generic parameter card/list view, which is unintuitive for actual business operations like setting a website logo, choosing themes, or configuring storage. This design restructures the configuration page into a 5-tab layout using dedicated forms for common business settings, while preserving the raw parameter list (converted to an `el-table` for density) for advanced use cases.

## Architecture & Components

### 1. Database Migrations (`1.1.2-system-config-keys.sql`)
Insert the necessary default configuration keys into `sys_config` so the frontend forms have data to bind to:
- **System Config**: `sys.web.logo`, `sys.web.siteName`, `sys.web.title`, `sys.web.description`, `sys.web.primaryColor`.
- **Storage Config**: `sys.storage.type` (local/oss), `sys.storage.local.path`, `sys.storage.oss.endpoint`, `sys.storage.oss.accessKey`, `sys.storage.oss.secretKey`, `sys.storage.oss.bucket`.
- **Mail/SMS Config**: (Placeholder keys like `sys.mail.smtp`, `sys.sms.provider` for future expansion).

### 2. Frontend Structure (`admin/src/views/system/config/`)
We will split the UI into the following 5 distinct tabs, managed by `index.vue`:

#### Tab 1: System Settings (`SystemConfigForm.vue`)
- **UI**: A standard form layout.
- **Fields**:
  - Logo (`sys.web.logo`): Image uploader or text input.
  - Site Name (`sys.web.siteName`): Text input.
  - Site Title (`sys.web.title`): Text input.
  - Description (`sys.web.description`): Textarea.
  - Primary Color (`sys.web.primaryColor`): Color picker.
  - Skin (`sys.index.skinName`): Select dropdown (blue, green, purple, red, yellow).
  - Side Theme (`sys.index.sideTheme`): Select dropdown (dark, light).
- **Interaction**: A single "Save Settings" button that updates all fields at once via a batch `Promise.all` over the existing `updateConfig` API.

#### Tab 2: Mail & SMS (`MailSmsConfigForm.vue`)
- **UI**: Form with two distinct sections (cards/panels).
- **Fields**: Standard text inputs for SMTP and SMS gateway configurations.
- **Interaction**: Similar to Tab 1, with a "Save" button.

#### Tab 3: Object Storage (`StorageConfigForm.vue`)
- **UI**: Form with dynamic fields based on the selected storage provider.
- **Fields**:
  - Storage Type (`sys.storage.type`): Radio button or Select (Local Storage vs. OSS).
  - *If Local*: Storage Path input.
  - *If OSS*: Endpoint, Access Key, Secret Key, Bucket inputs.
- **Interaction**: "Save Settings" button.

#### Tab 4: Database Backup (`BackupModule.vue` - *Already Extracted*)
- **UI Upgrade**:
  - Top half: Backup Strategy Form (Cron, Limit, Path) -> reads/writes from `sys_config`.
  - Bottom half: Existing Backup List table.
- **Interaction**: "Save Strategy" for the form; "Backup Now" / "Restore" / "Delete" for the table.

#### Tab 5: Raw Parameters (`ConfigList.vue`)
- **UI**: Replaces the old "card grid" with a dense, professional `el-table`.
- **Interaction Rules**:
  - Default `pageSize: 20`.
  - Table wrapper has a `min-height: 600px` to prevent layout collapse when data is sparse.
  - Search bar on top.
  - Actions column: Edit (opens the `ConfigDialog`), Delete.

### 3. Backend Support
- The existing `getConfig` and `updateConfig` APIs in `micro-system` / `api-gateway` will be reused.
- Frontend forms will fetch all keys sequentially or in parallel on mount, bind them to a reactive form model, and save them sequentially or in parallel when the user clicks "Save".

## Design Aesthetics & Standards
- All tables must adhere to `pageSize: 20`.
- All tables must have a consistent empty state and a minimum height.
- Forms should use `label-position="top"` or a consistent right-aligned label approach for a clean, modern look.
- Save buttons should use the primary dark color (`#111827`) established in previous refactors.

## Trade-offs
- Using `Promise.all` to save multiple config keys from a form generates multiple HTTP requests to the backend. Given this is an infrequent administrative action, the simplicity of reusing the existing single-key `updateConfig` API outweighs the cost of building a new batch-update API.

## Testing Strategy
- Verify that saving the System Settings form updates the `sys_config` table correctly.
- Verify that toggling between Local and OSS in the Storage tab dynamically shows/hides the correct fields.
- Verify the raw parameter list correctly renders 20 items per page and does not visually collapse when filtering results down to 1 or 2 items.
