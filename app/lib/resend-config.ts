export type ResendConfig = {
  apiKey: string | null;
  from: string | null;
  appBaseUrl: string;
};

export function getResendConfig(): ResendConfig {
  return {
    apiKey: process.env.RESEND_API_KEY ?? null,
    from: process.env.AUTH_EMAIL_FROM ?? null,
    appBaseUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000',
  };
}

export function hasResendConfig(config: ResendConfig) {
  return Boolean(config.apiKey && config.from);
}
