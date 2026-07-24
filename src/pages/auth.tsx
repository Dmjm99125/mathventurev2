import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/useAuth';
import { useLanguage } from '@/lib/useLanguage';
import { studentRegister, studentSignIn, teacherSignIn, teacherSignUp } from '@/lib/auth';
import { Button, Input, Label, Card } from '@/components/ui';
import type { Role } from '@/lib/api';
import { Map, Leaf, Compass, ArrowLeft } from 'lucide-react';

export function Login() {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'teacher') {
        await teacherSignIn(email, password);
      } else {
        await studentSignIn({ lastName, firstName });
      }
      await refreshProfile();
      setLocation('/'); // App.tsx will redirect based on role
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background overflow-hidden relative">
      {/* Decorative Jungle Leaves */}
      <Leaf className="absolute top-10 left-10 text-primary/20 h-32 w-32 -rotate-45" />
      <Leaf className="absolute bottom-10 right-10 text-jungle-orange/20 h-40 w-40 rotate-12" />
      
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 z-50 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Button>
      </Link>
      
      <Card className="w-full max-w-md p-8 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg -rotate-6">
            <Compass className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-display font-bold text-center mb-2">Welcome Back!</h1>
        <p className="text-center text-muted-foreground mb-8">Ready for your next math adventure?</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.role')}</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={role === 'student' ? 'jungle' : 'outline'}
                onClick={() => setRole('student')}
              >
                {t('landing.student')}
              </Button>
              <Button
                type="button"
                variant={role === 'teacher' ? 'default' : 'outline'}
                onClick={() => setRole('teacher')}
              >
                {t('landing.teacher')}
              </Button>
            </div>
          </div>

          {role === 'teacher' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm font-bold text-muted-foreground">{t('auth.studentLoginHelp')}</p>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </>
          )}
          
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}
          
          <Button type="submit" className="w-full" size="lg" disabled={loading} variant="jungle">
            {loading ? t('common.loading') : t('auth.signin')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          Don't have an account? <Link href="/signup"><span className="text-primary hover:underline cursor-pointer">Sign Up</span></Link>
        </p>
      </Card>
    </div>
  );
}

export function Signup() {
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'teacher') {
        await teacherSignUp(email, password, fullName);
        await teacherSignIn(email, password);
      } else {
        await studentRegister({ classCode, lastName, firstName });
      }
      await refreshProfile();
      setLocation('/'); 
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <Map className="absolute top-1/4 -right-10 text-primary/10 h-64 w-64 rotate-12" />
      
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="absolute top-4 left-4 z-50 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </Button>
      </Link>
      
      <Card className="w-full max-w-md p-8 relative z-10">
        <h1 className="text-3xl font-display font-bold text-center mb-2">Join the Expedition</h1>
        <p className="text-center text-muted-foreground mb-8">Create your account to start learning</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.role')}</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="button" 
                variant={role === 'student' ? 'jungle' : 'outline'} 
                onClick={() => setRole('student')}
              >
                {t('landing.student')}
              </Button>
              <Button 
                type="button" 
                variant={role === 'teacher' ? 'default' : 'outline'} 
                onClick={() => setRole('teacher')}
              >
                {t('landing.teacher')}
              </Button>
            </div>
          </div>

          {role === 'teacher' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.name')}</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm font-bold text-muted-foreground">{t('auth.studentSignupHelp')}</p>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classCode">{t('auth.classCode')}</Label>
                <Input
                  id="classCode"
                  required
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                />
              </div>
            </>
          )}
          
          {error && <p className="text-destructive text-sm font-bold">{error}</p>}
          
          <Button type="submit" className="w-full mt-4" size="lg" disabled={loading} variant="jungle">
            {loading ? t('common.loading') : t('auth.signup')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
          Already have an account? <Link href="/login"><span className="text-primary hover:underline cursor-pointer">Sign In</span></Link>
        </p>
      </Card>
    </div>
  );
}
