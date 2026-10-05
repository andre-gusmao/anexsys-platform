# USER_CONTEXT_PREFERENCES_MIGRATION_FIX_V1

## 1. Executive Answer

The code can access `user_context_preferences` because the entity, repository, module registration, and login flow are already present in the application code.

The database does not contain that table because the migration that creates it was introduced in the codebase but was not applied to the database/schema currently used by the running backend.

This is a **database state mismatch** between code and runtime schema.

## 2. Exact Root Cause

### Root cause classification

- **Missing migration file?** No
- **Migration not registered?** No
- **Entity exists but migration missing?** No
- **Entity name mismatch?** No
- **Schema mismatch?** Possibly visible in the runtime error prefix, but the primary failure is that the active runtime schema does not have the table created by the migration

### Exact root cause

`user_context_preferences` was introduced correctly in code and in a TypeORM migration, but the active database/schema used by the backend does not contain the table because the SaaS identity context migration has not been executed there.

If the runtime error explicitly says:

- `relation "pub.user_context_preferences" does not exist`

then the backend is currently operating under schema `pub`, not the default `public`.

That means one of these two runtime conditions is true:

1. the migration was never run against the active database at all, or
2. the migration was run in a different database/schema than the one the backend is currently using

Given the inspection result that no `user_context_preferences` table exists, the practical root cause is:

- **the migration `AddSaasIdentityContext1760000011000` is not present in the active runtime database/schema**

## 3. Where `user_context_preferences` Was Introduced

### Entity
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-context-preference.entity.ts`

This file defines:
- `@Entity({ name: 'user_context_preferences' })`

### Repository
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/repositories/user-context-preference.repository.ts`

This repository performs reads/writes through TypeORM on that entity.

### Identity module registration
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/identity.module.ts`

This module registers:
- `UserContextPreferenceEntity`
- `UserContextPreferenceRepository`

### Login flow access point
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/identity/identity.service.ts`

The login flow calls:
- `identityService.getContextPreference(normalizedEmail)`

That triggers a query to `user_context_preferences` during login context resolution.

## 4. Exact Migration Required

Required migration:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000011000-add-saas-identity-context.ts`

Migration class:

- `AddSaasIdentityContext1760000011000`

This migration creates:
- `user_context_preferences`
- `first_access_tokens`
- SaaS community tables
- `context_data` and `login_email` columns on `user_sessions`

The exact table creation is inside this migration:

- `CREATE TABLE user_context_preferences (...)`

## 5. Migration Registration Status

The migration is registered correctly.

### Runtime TypeORM config
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/typeorm.config.ts`

Configured migrations:
- `dist/platform/database/typeorm/migrations/*.js`

### CLI data source
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/data-source.ts`

Configured migrations:
- `migrations: [join(__dirname, 'migrations', \`*.${migrationExtension}\`)]`

Therefore:
- the migration file exists
- the migration path is configured
- the problem is not missing registration in code

## 6. Why the Code Can Access the Table While the Database Does Not Contain It

Because TypeORM repositories are built from the registered entity metadata in application code, not from checking whether the table already exists at startup.

So the sequence is:

1. the app boots with `UserContextPreferenceEntity` registered
2. the repository is injectable and usable
3. login calls `getContextPreference(...)`
4. TypeORM generates SQL for `user_context_preferences`
5. PostgreSQL rejects the query because the table is missing in the active schema/database

In short:

- **code metadata says the table exists**
- **runtime database state says it does not**

## 7. Exact Files Involved

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-context-preference.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/repositories/user-context-preference.repository.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/identity.module.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/identity/identity.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000011000-add-saas-identity-context.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/typeorm.config.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/data-source.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/package.json`

## 8. Exact Command André Must Execute

From the repository root:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform && npm run migration:run
```

If the backend is actually running with `DB_SCHEMA=pub`, then André must run the migration using the same active environment variables used by the backend process before restarting it.

After migration:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform && npm run start:dev
```

## 9. Recommended Verification

After running the migration:

```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'user_context_preferences';
```

Expected result:
- one row for the schema used by the backend

And:

```sql
SELECT * FROM migrations ORDER BY id DESC;
```

Expected:
- `AddSaasIdentityContext1760000011000` present in migration history

## 10. Final Conclusion

The failure is not caused by a bad entity name, missing repository registration, or missing migration file in the codebase.

The failure happens because the backend is already using the new SaaS identity context code, but the active database/schema still has an older physical schema that does not include `user_context_preferences`.
