// Prisma shim - now uses postgres.js
// This file provides backwards compatibility for files expecting Prisma
import { sql } from './db';
export const prisma = sql;
export default prisma;
