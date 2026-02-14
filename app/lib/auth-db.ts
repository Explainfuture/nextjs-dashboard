import postgres from 'postgres';
import crypto from 'crypto';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  password_hash: string | null;
  image_url: string | null;
  auth_provider: string;
  provider_account_id: string | null;
  email_verified: string | null;
};

export async function ensureAuthUsersTable() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      image_url TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'credentials',
      provider_account_id TEXT,
      email_verified TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export async function findAuthUserByEmail(email: string) {
  await ensureAuthUsersTable();
  const users = await sql<AuthUser[]>`
    SELECT
      id,
      name,
      email,
      password_hash,
      image_url,
      auth_provider,
      provider_account_id,
      email_verified::text
    FROM auth_users
    WHERE email = ${email}
    LIMIT 1
  `;
  return users[0];
}

export async function createCredentialsUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  await ensureAuthUsersTable();
  const users = await sql<AuthUser[]>`
    INSERT INTO auth_users (name, email, password_hash, auth_provider, updated_at)
    VALUES (${input.name}, ${input.email}, ${input.passwordHash}, 'credentials', NOW())
    RETURNING
      id,
      name,
      email,
      password_hash,
      image_url,
      auth_provider,
      provider_account_id,
      email_verified::text
  `;
  return users[0];
}

export async function upsertOAuthUser(input: {
  name?: string | null;
  email: string;
  imageUrl?: string | null;
  provider: string;
  providerAccountId?: string | null;
  emailVerified?: Date | null;
}) {
  await ensureAuthUsersTable();
  const users = await sql<AuthUser[]>`
    INSERT INTO auth_users (
      name,
      email,
      image_url,
      auth_provider,
      provider_account_id,
      email_verified,
      updated_at,
      last_login_at
    )
    VALUES (
      ${input.name ?? null},
      ${input.email},
      ${input.imageUrl ?? null},
      ${input.provider},
      ${input.providerAccountId ?? null},
      ${input.emailVerified ?? null},
      NOW(),
      NOW()
    )
    ON CONFLICT (email)
    DO UPDATE SET
      name = COALESCE(EXCLUDED.name, auth_users.name),
      image_url = COALESCE(EXCLUDED.image_url, auth_users.image_url),
      auth_provider = EXCLUDED.auth_provider,
      provider_account_id = COALESCE(EXCLUDED.provider_account_id, auth_users.provider_account_id),
      email_verified = COALESCE(EXCLUDED.email_verified, auth_users.email_verified),
      updated_at = NOW(),
      last_login_at = NOW()
    RETURNING
      id,
      name,
      email,
      password_hash,
      image_url,
      auth_provider,
      provider_account_id,
      email_verified::text
  `;
  return users[0];
}

function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createEmailVerificationToken(input: {
  userId: string;
  email: string;
  expiresHours?: number;
}) {
  await ensureAuthUsersTable();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresHours = input.expiresHours ?? 24;
  await sql`
    INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at)
    VALUES (${input.userId}, ${input.email}, ${tokenHash}, NOW() + (${expiresHours} * INTERVAL '1 hour'))
  `;
  return rawToken;
}

export async function verifyEmailByToken(token: string) {
  await ensureAuthUsersTable();
  const tokenHash = hashToken(token);
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id
    FROM email_verification_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return false;

  await sql.begin(async (tx) => {
    await tx`
      UPDATE auth_users
      SET email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
      WHERE id = ${row.user_id}
    `;
    await tx`
      UPDATE email_verification_tokens
      SET used_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;
  });

  return true;
}

export async function createPasswordResetToken(input: {
  userId: string;
  email: string;
  expiresMinutes?: number;
}) {
  await ensureAuthUsersTable();
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresMinutes = input.expiresMinutes ?? 30;
  await sql`
    INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at)
    VALUES (${input.userId}, ${input.email}, ${tokenHash}, NOW() + (${expiresMinutes} * INTERVAL '1 minute'))
  `;
  return rawToken;
}

export async function resetPasswordByToken(input: {
  token: string;
  passwordHash: string;
}) {
  await ensureAuthUsersTable();
  const tokenHash = hashToken(input.token);
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return false;

  await sql.begin(async (tx) => {
    await tx`
      UPDATE auth_users
      SET password_hash = ${input.passwordHash}, updated_at = NOW()
      WHERE id = ${row.user_id}
    `;
    await tx`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE token_hash = ${tokenHash}
    `;
  });

  return true;
}
