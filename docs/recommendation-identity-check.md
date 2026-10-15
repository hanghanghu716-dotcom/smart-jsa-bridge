# Legacy recommendation identity checks

Legacy recommendation and manual-control search require a present, unique master and an intact parent chain. A control's hazard parent and an additional control's control/hazard ancestors are checked. Missing or duplicate identities are withheld even when a translation mapping has a high score. Existing hazard text and authored controls stay editable; unresolved identities are not guessed or rewritten.

The verifier requests exact counts in bounded batches. A truncated response that could hide a duplicate is an error. Ancestors are cached only within one lookup. Saved reference/master consistency is checked, and read failures reach the existing error state.

Remaining percentages are unchanged and retain their text-similarity label. Structural validity does not establish semantic relevance or regional approval. This code change neither repairs source correspondences nor activates a production release.

Synthetic guest and real local Supabase fixtures include missing masters, duplicate masters and broken ancestors with higher scores than the valid controls. The browser checks require only the valid control in each list. Unit tests also cover response truncation, lookup failure, stale references, batching and correction on a subsequent request.

Related checklist items: 08, 10, 11, 31, 34, 35, 39, 43, 47, 65, 66, 70. Source recovery, independent content review and production rollout retain their separate completion requirements.
