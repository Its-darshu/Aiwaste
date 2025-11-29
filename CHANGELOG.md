# Changelog

## [Unreleased]

### Fixed
- Fixed "Unable to create new worker" bug in admin panel.
  - Root cause: Duplicate phone numbers (including empty strings) caused database integrity errors (500 Internal Server Error).
  - Fix: Added backend validation to check for existing phone numbers and return 400 Bad Request. Converted empty phone number strings to NULL to avoid unique constraint violations.
  - Added unit tests for worker creation flow.
  - Improved error messaging in Admin Dashboard.
