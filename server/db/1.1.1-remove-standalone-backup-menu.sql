-- 1.1.1-remove-standalone-backup-menu.sql
-- The backup management feature has been integrated into the System Config page as a tab.
-- Therefore, the standalone menu is no longer needed. The permissions are kept for the API endpoints.

DELETE FROM sys_menu WHERE path = 'backup' AND component = 'system/backup/index';
