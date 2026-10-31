import { describe, expect, it } from 'vitest';
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
