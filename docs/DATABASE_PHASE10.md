# Phase 10 database extension

Phase 10 adds `ReturnInspection`, linked one-to-one with a `RentalAllocation` and linked to `RentalReturn`. It stores per-unit return condition, optional maintenance type, notes, and inspection timestamp. The unique allocation relation prevents duplicate inspection rows for one physical allocation.

No migration was applied because PostgreSQL is not configured in the current environment. Prisma validation and client generation were run against the PostgreSQL datasource definition.
