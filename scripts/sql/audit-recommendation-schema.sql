-- Read-only schema evidence. Run on the intended project before designing a migration.
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name, current_user AS database_role, now() AS inspected_at;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Hazards', 'Current_Measures', 'Advanced_Measures',
    'Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations',
    'hazard_measure_mappings', 'current_advanced_measure_mappings', 'case_studies')
ORDER BY table_name, ordinal_position;

SELECT n.nspname AS table_schema, c.relname AS table_name, con.conname AS constraint_name, con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE con.conrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
    AND relname IN ('Hazards', 'Current_Measures', 'Advanced_Measures', 'Hazards_Translations',
      'Current_Measures_Translations', 'Advanced_Measures_Translations', 'hazard_measure_mappings', 'current_advanced_measure_mappings'))
  OR con.confrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
    AND relname IN ('Hazards', 'Current_Measures', 'Advanced_Measures', 'Hazards_Translations',
      'Current_Measures_Translations', 'Advanced_Measures_Translations', 'hazard_measure_mappings', 'current_advanced_measure_mappings'))
ORDER BY c.relname, con.conname;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('Hazards', 'Current_Measures', 'Advanced_Measures', 'Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations',
    'hazard_measure_mappings', 'current_advanced_measure_mappings', 'case_studies')
ORDER BY tablename, policyname;

SELECT c.relname AS table_name, c.relrowsecurity AS row_security_enabled,
  c.relforcerowsecurity AS forced_row_security, pg_get_userbyid(c.relowner) AS owner
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('Hazards', 'Current_Measures', 'Advanced_Measures',
  'Hazards_Translations', 'Current_Measures_Translations', 'Advanced_Measures_Translations',
  'hazard_measure_mappings', 'current_advanced_measure_mappings', 'case_studies')
ORDER BY c.relname;

ROLLBACK;
