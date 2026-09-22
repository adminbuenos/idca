/*
 * ----------------------------------------------------------
 * Club Logos Storage
 * ----------------------------------------------------------
 *
 * Club logos are intentionally PUBLIC because they are
 * displayed on the public IDCA website.
 *
 * Upload/update/delete operations will be performed by the
 * server-side club management action using the service-role
 * client after an explicit club.edit permission check.
 *
 * The public bucket does NOT mean that anonymous users can
 * upload files.
 * ----------------------------------------------------------
 */

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'club-logos',
  'club-logos',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;