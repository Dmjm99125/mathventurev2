import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button, Input, Label } from '@/components/ui';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { changeTeacherPassword, useAuth, signOut } from '@/lib/auth';
import { useLanguage } from '@features/i18n/context';
import { OfflineConflictPanel } from '@/components/offline/OfflineConflictPanel';
import { OfflinePackPanel } from '@/components/offline/OfflinePackPanel';

function teacherPageHeading(title: string, description: string) {
  return (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">{description}</p>
    </>
  );
}

export function TeacherSettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    setIsChangingPassword(true);
    try {
      await changeTeacherPassword(currentPassword, newPassword, confirmPassword);
      setPasswordMessage('Your password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Password change failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Settings', 'Manage the account details and session controls already available to you.')}
    >
      <section className="teacher-section max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="teacher-account-settings">
        <p className="teacher-eyebrow">Account</p>
        <h2 id="teacher-account-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Your teacher account</h2>
        <dl className="mt-6 grid gap-4 border-y border-[var(--teacher-moss)]/20 py-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-sm font-bold text-[var(--teacher-ink)]/65">Name</dt>
          <dd className="font-semibold text-[var(--teacher-ink)]">{user?.full_name ?? 'Teacher'}</dd>
          <dt className="text-sm font-bold text-[var(--teacher-ink)]/65">Role</dt>
          <dd className="font-semibold text-[var(--teacher-ink)]">Teacher</dd>
        </dl>
        <Button type="button" variant="outline" className="mt-6 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" onClick={handleSignOut}>
          {t('common.logout')}
        </Button>
      </section>

      <div className="mt-6 grid max-w-2xl gap-4">
        <OfflinePackPanel />
        <OfflineConflictPanel />
      </div>

      <section className="teacher-section mt-6 max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="teacher-password-settings">
        <p className="teacher-eyebrow">Security</p>
        <h2 id="teacher-password-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Change your password</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--teacher-ink)]/70">Enter your current password before choosing a new one.</p>
        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {passwordMessage && <p className="text-primary text-sm font-bold">{passwordMessage}</p>}
          {passwordError && <p className="text-destructive text-sm font-bold">{passwordError}</p>}
          <Button type="submit" variant="jungle" disabled={isChangingPassword}>
            {isChangingPassword ? t('common.loading') : 'Change password'}
          </Button>
        </form>
      </section>
    </TeacherWorkspaceBoard>
  );
}
