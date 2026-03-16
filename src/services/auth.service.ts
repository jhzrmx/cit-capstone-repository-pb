import { ClientResponseError } from 'pocketbase';
import { pb, getAuthUser } from './pocketbase';
import type { User } from '../types';
import type { UserCreateInput, UserUpdateInput } from '../types';

/** PocketBase SDK often surfaces failures as "Something went wrong." — expand for debugging. */
export const formatOAuthError = (err: unknown): string => {
  if (err instanceof ClientResponseError) {
    const status = err.status;
    const data = err.response as Record<string, unknown> | undefined;
    const apiMsg =
      (typeof data?.message === 'string' && data.message) ||
      (typeof err.message === 'string' && err.message && err.message !== 'Something went wrong.'
        ? err.message
        : '');
    const orig = err.originalError;
    const origMsg =
      orig instanceof Error
        ? orig.message
        : typeof orig === 'object' && orig && 'message' in orig
          ? String((orig as { message: unknown }).message)
          : '';

    const parts: string[] = [];
    if (apiMsg) parts.push(apiMsg);
    else if (origMsg && origMsg !== 'Something went wrong.') parts.push(origMsg);

    if (status) parts.push(`(HTTP ${status})`);

    const hint: string[] = [];
    if (origMsg?.includes('realtime') || origMsg?.includes('EventSource')) {
      hint.push(
        'Realtime to PocketBase failed. Keep the PocketBase server running, allow WebSocket/EventSource to your PB URL, and use the same host in VITE_POCKETBASE_URL as in the browser (try http://127.0.0.1:8090).'
      );
    }
    if (origMsg?.includes('ECONNREFUSED') || origMsg?.includes('Failed to fetch')) {
      hint.push('Cannot reach PocketBase. Check VITE_POCKETBASE_URL and that the server is up.');
    }
    if (apiMsg?.includes('provider') || apiMsg?.includes('Missing or invalid provider')) {
      hint.push(
        `Set VITE_OAUTH_PROVIDER to the exact provider name in PocketBase → Collections → users → OAuth2 (often "google").`
      );
    }
    if (status === 400 && data?.data && typeof data.data === 'object') {
      const fieldErrors = Object.entries(data.data as Record<string, { message?: string }>)
        .map(([k, v]) => `${k}: ${v?.message ?? JSON.stringify(v)}`)
        .join('; ');
      if (fieldErrors) parts.push(fieldErrors);
    }

    if (parts.length === 0 && hint.length === 0) {
      return (
        'Google sign-in failed (no detail from server). ' +
        'Confirm OAuth2 is enabled on users, redirect URI in Google matches {PocketBase URL}/api/oauth2-redirect, ' +
        'and VITE_OAUTH_PROVIDER matches the provider name in PocketBase.'
      );
    }
    return [...parts, ...hint].filter(Boolean).join(' ');
  }
  if (err instanceof Error) return err.message;
  return 'OAuth sign-in failed.';
};

/** Only these emails may use OAuth sign-in (CBSUA institutional accounts). */
export const OAUTH_ALLOWED_EMAIL_DOMAIN = '@cbsua.edu.ph';

export const isAllowedOAuthEmail = (email: string | undefined | null): boolean => {
  const e = (email ?? '').trim().toLowerCase();
  return e.endsWith(OAUTH_ALLOWED_EMAIL_DOMAIN);
};

/** Shown when password auth succeeds but verified === false */
export const LOGIN_EMAIL_NOT_VERIFIED =
  'This account is not verified yet. Confirm the code we emailed you, or use “Email not verified?” below to get a new code. You can also sign in with Google.';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await pb.collection('users').authWithPassword(email, password);
    const record = pb.authStore.record as { verified?: boolean } | null;
    if (record && record.verified === false) {
      pb.authStore.clear();
      throw new Error(LOGIN_EMAIL_NOT_VERIFIED);
    }
    return getAuthUser()!;
  },

  /**
   * OAuth2 (e.g. Google). Enable OAuth in PocketBase → Collections → users → OAuth2.
   * New users get role student; only @cbsua.edu.ph emails are allowed.
   * needsDepartment: true when student has no department yet (prompt after first Google sign-in).
   */
  async loginWithOAuth(provider: string): Promise<{ user: User; needsDepartment: boolean }> {
    let authData;
    try {
      authData = await pb.collection('users').authWithOAuth2({
        provider,
        createData: { role: 'student' },
      });
    } catch (e) {
      throw new Error(formatOAuthError(e));
    }
    const record = authData.record as unknown as User;
    const email = record.email;
    if (!isAllowedOAuthEmail(email)) {
      try {
        await pb.collection('users').delete(record.id);
      } catch {
        /* ignore delete failure */
      }
      pb.authStore.clear();
      throw new Error(
        `Only CBSUA accounts (${OAUTH_ALLOWED_EMAIL_DOMAIN}) can sign in with Google. This account was not registered.`
      );
    }
    const user = getAuthUser()!;
    /* Google (and other OAuth) proves email ownership — mark verified so password login works later */
    if (user.verified === false) {
      try {
        const updated = await pb.collection('users').update(user.id, { verified: true });
        pb.authStore.save(pb.authStore.token, updated as Parameters<typeof pb.authStore.save>[1]);
      } catch {
        /* PB may restrict verified; OAuth sign-in still allowed this session */
      }
    }
    const u = getAuthUser()!;
    const needsDepartment =
      u.role === 'student' && !(u.department && String(u.department).trim());
    return { user: u, needsDepartment };
  },

  logout(): void {
    pb.authStore.clear();
  },

  /**
   * Student self-registration: create account only (no session).
   * Call {@link requestRegistrationOTP} then {@link completeRegistrationWithOTP} so the inbox proves email ownership.
   */
  async registerCreateOnly(
    email: string,
    password: string,
    name: string,
    departmentId: string
  ): Promise<void> {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
      role: 'student',
      department: departmentId,
    });
    pb.authStore.clear();
  },

  /** Sends OTP to email (requires PocketBase SMTP + OTP enabled on users). Returns otpId for {@link completeRegistrationWithOTP}. */
  async requestRegistrationOTP(email: string): Promise<{ otpId: string }> {
    const result = await pb.collection('users').requestOTP(email.trim());
    return { otpId: (result as { otpId: string }).otpId };
  },

  /** Finish registration: validates OTP from email and opens session (email marked verified when successful). */
  async completeRegistrationWithOTP(otpId: string, otpCode: string): Promise<User> {
    await pb.collection('users').authWithOTP(otpId, otpCode.trim());
    return getAuthUser()!;
  },

  /**
   * @deprecated Creates account only; password login requires verified — use registerCreateOnly + OTP instead.
   */
  async register(email: string, password: string, name: string, departmentId: string): Promise<User> {
    await this.registerCreateOnly(email, password, name, departmentId);
    await this.requestRegistrationOTP(email);
    throw new Error('Check your email for a code, then finish sign-up on Register or Log in → Email not verified.');
  },

  getCurrentUser(): User | null {
    return getAuthUser();
  },

  isAuth(): boolean {
    return pb.authStore.isValid;
  },

  /** Sends PocketBase's password-reset email to the given address (SMTP must be configured). */
  async requestPasswordReset(email: string): Promise<void> {
    await pb.collection('users').requestPasswordReset(email.trim());
  },

  // Admin: create user (no auto-login)
  async createUser(input: UserCreateInput): Promise<User> {
    const body: Record<string, unknown> = {
      email: input.email,
      password: input.password,
      passwordConfirm: input.password,
      name: input.name,
      role: input.role,
      verified: true,
    };
    if (input.department) body.department = input.department;
    const record = await pb.collection('users').create(body);
    return record as unknown as User;
  },

  async updateUser(id: string, input: UserUpdateInput): Promise<User> {
    const record = await pb.collection('users').update(id, input);
    return record as unknown as User;
  },

  async deleteUser(id: string): Promise<void> {
    await pb.collection('users').delete(id);
  },

  async getUsersList(page = 1, perPage = 50, query?: string): Promise<{ items: User[]; total: number }> {
    const q = (query ?? '').trim();
    const escaped = q ? q.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : '';
    const filter = escaped ? `(name ~ "${escaped}" || email ~ "${escaped}")` : '';
    const result = await pb.collection('users').getList(page, perPage, {
      sort: '-created',
      expand: 'department',
      ...(filter && { filter }),
    });
    return {
      items: result.items as unknown as User[],
      total: result.totalItems,
    };
  },

  /** Search users by name or email (e.g. for author picker). Optional role filter. */
  async searchUsers(query: string, options?: { role?: string; limit?: number }): Promise<User[]> {
    const q = (query || '').trim();
    const limit = options?.limit ?? 20;
    if (!q) {
      const { items } = await this.getUsersList(1, limit);
      return items;
    }
    const escaped = q.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const parts = [`(name ~ "${escaped}" || email ~ "${escaped}")`];
    if (options?.role) parts.unshift(`role = "${options.role}"`);
    const filter = parts.join(' && ');
    const result = await pb.collection('users').getList(1, limit, {
      filter,
      sort: 'name',
      expand: 'department',
    });
    return result.items as unknown as User[];
  },

  async getUserById(id: string): Promise<User> {
    const record = await pb.collection('users').getOne(id);
    return record as unknown as User;
  },
};
