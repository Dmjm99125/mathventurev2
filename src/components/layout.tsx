import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/useAuth';
import { useLanguage } from '@/lib/useLanguage';
import { signOut } from '@/lib/auth';
import { Button } from './ui';
import { LogOut, Globe, Compass, Users, LayoutDashboard, Settings, Map, Menu, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function TopNav() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [location, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'tl' : 'en');
  };

  const isTeacher = user?.role === 'teacher';
  const navItems = user ? (isTeacher ? [
    { href: '/teacher', label: t('teacher.dashboard'), icon: LayoutDashboard },
    { href: '/teacher/classes', label: t('teacher.classes'), icon: Users },
    { href: '/teacher/assignments', label: t('teacher.assignments'), icon: Settings },
  ] : [
    { href: '/student', label: t('student.dashboard'), icon: Map },
    { href: '/student/lessons', label: 'All Lessons', icon: Compass },
  ]) : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={user ? (user.role === 'student' ? '/student' : '/teacher') : '/'}>
            <div className="flex items-center gap-2 cursor-pointer group">
              <Compass className="h-8 w-8 text-primary group-hover:rotate-45 transition-transform" />
              <span className="font-display font-bold text-2xl text-primary tracking-tight">MathVenture</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-2 font-bold text-muted-foreground">
            <Globe className="h-4 w-4" />
            {lang === 'en' ? 'EN' : 'TL'}
          </Button>

          {user && (
            <>
              <div className="h-6 w-px bg-border mx-2 hidden md:block" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground hover:text-foreground">
                    <span className="hidden md:inline-block">{user.full_name}</span>
                    <Menu className="h-5 w-5 md:hidden" />
                    <User className="h-5 w-5 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-bold">
                  {/* Mobile nav items */}
                  <div className="md:hidden">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground border-b border-border/50 mb-1">
                      {user.full_name}
                    </div>
                    {navItems.map(item => {
                      const active = location === item.href || (location.startsWith(item.href) && item.href !== '/teacher' && item.href !== '/student');
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className={`cursor-pointer flex items-center gap-2 ${active ? 'text-primary bg-primary/10' : ''}`}>
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>

                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();

  if (!user) return <div className="min-h-[100dvh] flex flex-col"><TopNav /><main className="flex-1">{children}</main></div>;

  const isTeacher = user.role === 'teacher';

  const navItems = isTeacher ? [
    { href: '/teacher', label: t('teacher.dashboard'), icon: LayoutDashboard },
    { href: '/teacher/classes', label: t('teacher.classes'), icon: Users },
    { href: '/teacher/assignments', label: t('teacher.assignments'), icon: Settings },
  ] : [
    { href: '/student', label: t('student.dashboard'), icon: Map },
    { href: '/student/lessons', label: 'All Lessons', icon: Compass },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 container mx-auto flex flex-col md:flex-row gap-6 p-4 md:py-8">
        
        {/* Sidebar Nav - Hidden on mobile, shown in DropdownMenu instead */}
        <aside className="hidden md:block w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {navItems.map(item => {
              const active = location === item.href || (location.startsWith(item.href) && item.href !== '/teacher' && item.href !== '/student');
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap ${active ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent hover:text-accent-foreground text-foreground'}`}>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
