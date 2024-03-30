import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { TURSO_TOKEN, TURSO_URI } from '$env/static/private';
import * as schema from './schema';

const client = createClient({ url: TURSO_URI, authToken: TURSO_TOKEN });

export const db = drizzle(client, { schema });
