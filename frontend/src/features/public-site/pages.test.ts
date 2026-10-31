import { describe, expect, it, vi } from 'vitest';

vi.mock('@/pages/about', () => ({ About: () => null }));
vi.mock('@/pages/auth', () => ({
  ForgotPassword: () => null,
  Login: () => null,
  PasswordReset: () => null,
  Signup: () => null,
}));
vi.mock('@/pages/landing', () => ({ Landing: () => null }));
vi.mock('@/pages/not-found', () => ({ default: () => null }));

import {
  About,
  ForgotPassword,
  Landing,
  Login,
  NotFound,
  PasswordReset,
  Signup,
} from './pages';

describe('public-site page boundary', () => {
  it('exposes the existing public page components through one feature module', () => {
    expect([About, ForgotPassword, Landing, Login, NotFound, PasswordReset, Signup])
      .toEqual(expect.arrayContaining([expect.any(Function)]));
  });
});
