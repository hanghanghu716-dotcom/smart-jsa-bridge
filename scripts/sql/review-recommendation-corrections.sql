-- Evidence only. Run with the authorized management reader on the intended project.
-- No production corrections are executed. Keep returned row data in a restricted audit store.
-- This transaction is a consistent read, not a restorable backup or proof of unrestricted visibility.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

SELECT current_database() AS database_name, current_user AS database_role,
  current_setting('row_security') AS row_security_setting, transaction_timestamp() AS captured_at;

-- Distinguish hidden public master rows from genuine missing references.
SELECT 'Hazards_Translations' AS source_table, t.id::text AS translation_id,
  t.hazard_id::text AS master_id, t.locale, to_jsonb(t) AS original_row
FROM public."Hazards_Translations" t LEFT JOIN public."Hazards" m ON m.id = t.hazard_id
WHERE t.hazard_id IS NULL OR m.id IS NULL
UNION ALL
SELECT 'Current_Measures_Translations', t.id::text, t.measure_id::text, t.locale, to_jsonb(t)
FROM public."Current_Measures_Translations" t LEFT JOIN public."Current_Measures" m ON m.id = t.measure_id
WHERE t.measure_id IS NULL OR m.id IS NULL
UNION ALL
SELECT 'Advanced_Measures_Translations', t.id::text, t.advanced_measure_id::text, t.locale, to_jsonb(t)
FROM public."Advanced_Measures_Translations" t LEFT JOIN public."Advanced_Measures" m ON m.id = t.advanced_measure_id
WHERE t.advanced_measure_id IS NULL OR m.id IS NULL;

-- Preserve the exact problematic row, text and master relation for bilingual/source review.
-- The numeric locale does not identify the correct language.
SELECT to_jsonb(t) AS original_row
FROM public."Current_Measures_Translations" t
WHERE t.id = 7883 OR t.locale = '4036';

-- Do not delete by score, ctid or arbitrary row order. Full rows preserve metadata differences.
SELECT current_measure_translation_id, advanced_measure_translation_id,
  count(*) AS row_count,
  count(DISTINCT similarity_score) AS distinct_nonnull_scores,
  count(*) FILTER (WHERE similarity_score IS NULL) AS null_scores,
  jsonb_agg(to_jsonb(m)) AS original_rows
FROM public.current_advanced_measure_mappings m
GROUP BY current_measure_translation_id, advanced_measure_translation_id
HAVING count(*) > 1
ORDER BY current_measure_translation_id, advanced_measure_translation_id;

ROLLBACK;
