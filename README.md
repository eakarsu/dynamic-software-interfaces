# Dynamic UI Operations Platform

One supported workflow replaces the former overlapping demos: a tenant administrator connects an incremental knowledge source, a worker indexes permission-preserving changes and deletion tombstones, a member queues a typed grounded interface proposal, deterministic quality/budget gates run, and a different reviewer approves or rejects the result.

## Safe setup

1. Copy `.env.example` to `.env`. Generate independent values for `JWT_SECRET` and `CONNECTOR_ENCRYPTION_KEY`; the latter must decode to exactly 32 random bytes. Configure real connector and AI-provider contracts.
2. Install locked dependencies with `npm ci`.
3. Create an empty PostgreSQL database and run `./migrate.sh`. The migration runner refuses an unversioned legacy schema.
4. Set `BOOTSTRAP_*` only in the command environment, run `npm run account:create`, then remove the bootstrap password from that environment.
5. In separate terminals run `./start.sh api`, `./start.sh worker`, and `./start.sh frontend`. Startup never installs, migrates, seeds, resets a database, kills processes, or exposes demo credentials.

The production image serves the built frontend and API together. Put it behind HTTPS because production sessions are secure, HTTP-only, same-site cookies.

## Verification

```sh
npm run migrate
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

The integration suite uses a disposable PostgreSQL database and local HTTP contract servers. It covers tenant isolation, connector encryption/incremental sync/deletion, permission-aware retrieval, duplicate job submission, strict output validation, cost rejection, independent approval, evaluation gates, and immutable audit history.

See `docs/CONTRACTS.md` for external schemas and `docs/OPERATIONS.md` for queue recovery, source freshness, key rotation, legacy import, and launch gates.
