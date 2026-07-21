# Operations and recovery

## Queues

Workers claim jobs with `FOR UPDATE SKIP LOCKED`, increment attempts, and set a lease. Expired leases are returned to the queue until `max_attempts`, then fail closed. Errors, codes, attempts, budgets, input, and any validated output remain persisted. Provider requests and connector syncs are retry-safe through stable job/idempotency keys and source identifiers.

Run the API and worker as separate non-root processes. Alert on pending age, expired leases, connector `error`, source freshness, generation failure codes, evaluation gate failure, p95 latency, and cost accumulation.

## Connector incidents

Disable a compromised connector to erase its encrypted credential and tombstone its indexed documents. Rotate secrets through `PATCH /api/connectors/{id}/secret`; rotation is audited and requires a new sync. Never log plaintext connector or AI keys. Reconcile source counts, ACLs, versions, tombstones, and cursor after recovery.

## Human approval and releases

Validated generation stops at `awaiting_approval`. The creator cannot approve their own result. A reviewer must inspect cited source versions, risks, accessibility implications, and trace/budget evidence. Model, prompt/tool schema, connector, or retrieval changes must pass the tenant evaluation dataset before release.

## Legacy data and restore

The migration runner refuses the old unversioned demo schema. Keep it read-only, export it, map tenant ownership and ACLs, import into a disposable migrated database, run deletion/freshness reconciliation and evaluation gates, then approve cutover. Backups refuse overwrite; restore requires an explicit empty-database confirmation and must be exercised outside production.

## External launch gates

Production still requires real connector and AI-provider certification, tenant/ACL mapping, credential rotation, data-processing/privacy approval, prompt-injection red-team results, load/failover tests, restore evidence, accessibility/security review, cost ownership, and named incident/reviewer owners.
