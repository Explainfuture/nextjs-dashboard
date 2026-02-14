import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { findAuthUserByEmail, upsertOAuthUser } from '@/app/lib/auth-db';

const githubClientId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET;
const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const oauthProviders = [];
if (githubClientId && githubClientSecret) {
  oauthProviders.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  );
}
if (googleClientId && googleClientSecret) {
  oauthProviders.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: authSecret,
  trustHost: true,
  debug: true,
  providers: [
    ...oauthProviders,
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await findAuthUserByEmail(email);
          if (!user) return null;
          if (!user.password_hash) return null;
          if (!user.email_verified) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password_hash);
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name ?? user.email,
              email: user.email,
              image: user.image_url,
            };
          }
        }
 
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') return true;
      if (!user.email) return false;

      try {
        await upsertOAuthUser({
          name: user.name,
          email: user.email,
          imageUrl: user.image,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          emailVerified: new Date(),
        });
        return true;
      } catch (error) {
        console.error('Failed to sync OAuth user:', error);
        return false;
      }
    },
  },
});
