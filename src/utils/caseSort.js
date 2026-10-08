export function sortCases(rows, sort = 'latest') {
  return [...rows].sort((a,b) => (sort === 'views' ? (Number(b.view_count)||0)-(Number(a.view_count)||0) : 0)
    || new Date(b.created_at||0)-new Date(a.created_at||0)
    || String(a.post_group_id||a.id).localeCompare(String(b.post_group_id||b.id)));
}
