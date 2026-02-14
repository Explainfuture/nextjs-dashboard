'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import {
  createCredentialsUser,
  createEmailVerificationToken,
  createPasswordResetToken,
  findAuthUserByEmail,
  resetPasswordByToken,
} from './auth-db';
import { makeAbsoluteUrl, sendAuthEmail } from './auth-mail';


export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    throw new Error('Database Error: Failed to Delete Invoice.');
  }

  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = formData.get('email');
  if (typeof email === 'string') {
    const existingUser = await findAuthUserByEmail(email);
    if (existingUser?.password_hash && !existingUser.email_verified) {
      return 'Please verify your email before signing in.';
    }
  }

  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function registerWithEmail(
  prevState: string | undefined,
  formData: FormData,
) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Invalid registration data.';
  }

  const { name, email, password } = parsed.data;

  try {
    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      return 'This email is already registered.';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createCredentialsUser({
      name,
      email,
      passwordHash,
    });

    const token = await createEmailVerificationToken({
      userId: newUser.id,
      email: newUser.email,
    });
    const verifyLink = makeAbsoluteUrl(`/verify-email?token=${token}`);
    const sent = await sendAuthEmail({
      to: newUser.email,
      subject: 'Verify your email',
      html: `<p>Hi ${name},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      text: `Hi ${name}, verify your email: ${verifyLink}`,
    });
    if (!sent) {
      return 'Verification email could not be sent. Check RESEND_API_KEY/AUTH_EMAIL_FROM.';
    }
  } catch (error) {
    console.error('Registration failed:', error);
    return 'Failed to register user.';
  }

  return 'Account created. Please check your email to activate your account.';
}

export async function signInWithGitHub() {
  const enabled = Boolean(
    (process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID) &&
      (process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET),
  );
  if (!enabled) {
    redirect('/login?oauth=github_not_configured');
  }
  await signIn('github', { redirectTo: '/dashboard' });
}

export async function signInWithGoogle() {
  const enabled = Boolean(
    (process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID) &&
      (process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET),
  );
  if (!enabled) {
    redirect('/login?oauth=google_not_configured');
  }
  await signIn('google', { redirectTo: '/dashboard' });
}

const ForgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
});

export async function requestPasswordReset(
  prevState: string | undefined,
  formData: FormData,
) {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Invalid email.';
  }

  const user = await findAuthUserByEmail(parsed.data.email);
  if (user && user.password_hash) {
    const token = await createPasswordResetToken({
      userId: user.id,
      email: user.email,
    });
    const resetLink = makeAbsoluteUrl(`/reset-password?token=${token}`);
    const sent = await sendAuthEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Use the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      text: `Reset your password: ${resetLink}`,
    });
    if (!sent) {
      console.error('[auth] Password reset email was not sent.');
    }
  }

  return 'If this email exists, a reset link has been sent.';
}

const ResetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Invalid token.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export async function resetPassword(
  prevState: string | undefined,
  formData: FormData,
) {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Invalid password reset request.';
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const updated = await resetPasswordByToken({
    token: parsed.data.token,
    passwordHash,
  });
  if (!updated) {
    return 'This reset link is invalid or expired.';
  }

  return 'Password updated. You can now sign in.';
}
