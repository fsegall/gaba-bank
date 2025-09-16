create unique index if not exists provider_events_payload_hash_uk
  on provider_events(payload_hash);
