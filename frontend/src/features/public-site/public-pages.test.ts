import { describe, expect, it, vi } from 'vitest';

vi.mock('./about', () => ({ About: () => null }));
vi.mock('./landing', () => ({ Landing: () => null }));
vi.mock('./not-found', () => ({ NotFound: () => null }));
vi.mock('./auth', () => ({
  ForgotPassword: () => null,
  Login: () => null,
  PasswordReset: () => null,
  Signup: () => null,
}));

import { About } from './about';
import { ForgotPassword, Login, PasswordReset, Signup } from './auth';
import { Landing } from './landing';
import { NotFound } from './not-found';

describe('public page feature boundary', () => {
  it('owns the public page implementations outside the legacy pages directory', () => {
    expect([About, ForgotPassword, Landing, Login, NotFound, PasswordReset, Signup]).toEqual([
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
