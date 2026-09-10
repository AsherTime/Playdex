-- Allow service_role to resolve app_private functions used by character_builds triggers.
-- EXECUTE grants already exist on those functions; this only adds schema USAGE.
grant usage on schema app_private to service_role;
