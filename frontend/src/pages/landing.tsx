import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import {
  ArrowUpRight,
  BarChart3,
  Compass,
  Gamepad2,
  GraduationCap,
  Hash,
  Shapes,
  Sparkles,
  Users,
} from 'lucide-react';
import { TopNav } from '@/components/layout';

export function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        setLocation('/teacher');
      } else {
        setLocation('/student');
      }
    }
  }, [user, setLocation]);

  if (isLoading || user) return null;

  return (
    <div className="landing-page min-h-[100dvh] flex flex-col">
      <TopNav />

      <main className="landing-main flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="landing-shell mx-auto w-full max-w-6xl">
          <section className="landing-board">
            <div className="landing-brand-panel">
              <div className="landing-kicker">
                <span className="landing-kicker-dot" aria-hidden="true" />
                Learning games for curious kids
              </div>

              <img
                className="landing-legacy-wordmark"
                src="/assets/images/1let.png"
                alt="Let's learn!"
              />

              <h1>
                Make math your next <span>adventure.</span>
                <Sparkles className="landing-heading-spark" aria-hidden="true" />
              </h1>

              <p className="landing-intro">
                Explore colors, shapes, numbers, and patterns through short games made for young learners.
              </p>

              <div className="landing-actions">
                <Button asChild size="lg" variant="jungle" className="landing-primary-action">
                  <Link href="/free-play">
                    <Gamepad2 aria-hidden="true" /> Play free games
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="landing-secondary-action">
                  <Link href="/login">
                    <GraduationCap aria-hidden="true" /> Log in
                  </Link>
                </Button>
              </div>

              <div className="landing-audience-note">
                <Users aria-hidden="true" />
                <span>Built for kids 4–7, loved by teachers.</span>
              </div>
            </div>

            <div className="landing-right-column">
              <aside className="landing-action-panel">
                <div className="landing-panel-heading">
                  <div>
                    <span className="landing-panel-label">Your first stop</span>
                    <h2>Choose a path</h2>
                  </div>
                  <div className="landing-compass-badge" aria-hidden="true">
                    <Compass />
                  </div>
                </div>

                <div className="landing-path-list">
                  <Link className="landing-path-link landing-path-link--pink" href="/free-play">
                    <span className="landing-path-icon"><Gamepad2 aria-hidden="true" /></span>
                    <span>
                      <strong>Free Play</strong>
                      <small>Jump into a quick game</small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>

                  <Link className="landing-path-link landing-path-link--yellow" href="/signup">
                    <span className="landing-path-icon"><Shapes aria-hidden="true" /></span>
                    <span>
                      <strong>Teacher Sign Up</strong>
                      <small>Bring the adventure to class</small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>

                  <Link className="landing-path-link landing-path-link--cyan" href="/about">
                    <span className="landing-path-icon"><Users aria-hidden="true" /></span>
                    <span>
                      <strong>Meet the Researchers</strong>
                      <small>See the people behind MathVenture</small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </aside>

              <section className="landing-activity-section" aria-labelledby="landing-activity-title">
                <div className="landing-section-heading">
                  <div>
                    <span className="landing-panel-label">Inside the adventure</span>
                    <h2 id="landing-activity-title">Learn by playing</h2>
                  </div>
                  <p>Small games. Big discoveries.</p>
                </div>

                <ul className="landing-activity-list">
                  <li className="landing-activity-item landing-activity-item--pink">
                    <span className="landing-activity-icon"><Shapes aria-hidden="true" /></span>
                    <span className="landing-activity-copy">
                      <strong>Colors &amp; Shapes</strong>
                      <small>Spot, match, and explore.</small>
                    </span>
                  </li>

                  <li className="landing-activity-item landing-activity-item--yellow">
                    <span className="landing-activity-icon"><Hash aria-hidden="true" /></span>
                    <span className="landing-activity-copy">
                      <strong>Numbers 1–10</strong>
                      <small>Count, pair, and sequence.</small>
                    </span>
                  </li>

                  <li className="landing-activity-item landing-activity-item--cyan">
                    <span className="landing-activity-icon"><BarChart3 aria-hidden="true" /></span>
                    <span className="landing-activity-copy">
                      <strong>Teacher Dashboard</strong>
                      <small>Track progress and assign lessons.</small>
                    </span>
                  </li>
                </ul>
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

