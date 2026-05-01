// Database client (Prisma).
// Phase 0 placeholder: the real PrismaClient will live here once @prisma/client is installed.
//
// Any access to `db.<anything>` throws at runtime so callers cannot silently
// receive `undefined` and continue. Replace with a real PrismaClient in Phase 0.

const stubError = () => {
  throw new Error(
    "[stub] db not implemented — install @prisma/client and replace lib/data/db.ts in Phase 0",
  );
};

export const db: never = new Proxy({} as never, {
  get: stubError,
  apply: stubError,
});
