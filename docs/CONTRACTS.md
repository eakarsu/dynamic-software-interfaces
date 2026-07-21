# External contracts

## Incremental connector

The configured base URL must expose `GET /v1/changes?cursor=<opaque>`. Production requires HTTPS and bearer authentication with the decrypted per-connector secret. The response is:

```json
{
  "nextCursor": "opaque-or-null",
  "hasMore": false,
  "changes": [{
    "sourceId": "stable-id",
    "version": "source-version",
    "title": "Document title",
    "content": "bounded text",
    "permissions": ["public", "group:engineering", "role:reviewer", "user:uuid"],
    "deleted": false,
    "updatedAt": "2026-07-20T00:00:00.000Z"
  }]
}
```

Every page is schema-validated and capped at 500 changes/2 MB/10 seconds. Cursor commits, content/ACL updates, and deletion tombstones are transactional. A sync caps pages and renews its lease. Replays are safe because `(connector_id, source_id)` is unique and versions overwrite deterministically.

## AI provider

The configured base URL must expose an OpenAI-compatible `POST /v1/chat/completions` endpoint supporting strict `response_format: json_schema`, usage counts, and an optional `X-Request-Id`. Temperature is zero. The only registered tool returns `{ title, rationale, components[], risks[] }`; component primitives are allowlisted and each component must cite a retrieved source ID.

Retrieved source content is explicitly treated as untrusted evidence. The worker rejects invalid JSON/schema, unsupported evidence, unsafe strings, stale/no visible sources, timeouts, and cost/latency budget violations. It stores model/request/token/source version/hash/freshness provenance, never provider credentials.
