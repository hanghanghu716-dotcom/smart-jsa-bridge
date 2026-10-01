create index discovery_audit_actor_idx on jsa_private.discovery_audit(actor,created_at);
create index publication_reviews_reviewer_idx on jsa_private.publication_reviews(reviewer);
