import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/useAuth';
import { useLanguage } from '@/lib/useLanguage';
import { signIn, signUp } from '@/lib/auth';
import { Button, Input, Label, Card } from '@/components/ui';
import type { Role } from '@/lib/api';
import { Map, Leaf, Compass } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await signIn(email, password);
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('student');
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
      await signUp(email, password, role, fullName);
      await signIn(email, password);
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
