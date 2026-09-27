import { useState } from 'react';
import { Link } from 'wouter';
import { TopNav } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, ChevronDown, FileText, Github, Home, Lock, Users } from 'lucide-react';

type Tab = 'mathventure' | 'counting';

const TABS: { value: Tab; label: string }[] = [
  { value: 'mathventure', label: 'MathVenture' },
  { value: 'counting', label: 'Counting the Uncounted' },
];

export function About() {
  const [activeTab, setActiveTab] = useState<Tab>('mathventure');

  return (
    <div className="landing-page researchers-page min-h-[100dvh] flex flex-col">
      <TopNav />

      <main className="researchers-main flex-1">
        <div className="researchers-shell">
          <header className="researchers-hero">
            <div className="researchers-hero-copy">
              <div className="researchers-eyebrow">
                <span className="researchers-eyebrow-dot" aria-hidden="true" />
                Meet the people behind MathVenture
              </div>
              <h1>Learning feels better when it is made with care.</h1>
              <p>
                MathVenture brings together playful learning activities and research-informed ideas for young learners, teachers, and families.
              </p>
            </div>

            <div className="researchers-hero-actions" aria-label="About page actions">
              <Link href="/">
                <Button variant="outline" size="sm" className="researchers-toolbar-button">
                  <Home aria-hidden="true" />
                  <span>Home</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="researchers-toolbar-button">
                    <BookOpen aria-hidden="true" />
                    <span>Papers</span>
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 font-bold">
                  <DropdownMenuItem asChild>
                    <a href="/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                      <FileText className="w-4 h-4" />
                      <span>Counting the Uncounted</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="flex items-center gap-2 justify-between w-full">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>MathVenture</span>
                    </span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">WIP</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="researchers-toolbar-button">
                    <Github aria-hidden="true" />
                    <span>Project links</span>
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 font-bold">
                  <DropdownMenuItem asChild>
                    <a href="https://github.com/dmjm99125/mathventureprototype" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                      <Github className="w-4 h-4" />
                      <span><span>Legacy</span> repository</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://github.com/dmjm99125/mathventurev2" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer w-full text-primary">
                      <Github className="w-4 h-4" />
                      <span><span>Current</span> repository</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <section className="researchers-workspace" aria-label="Research and team information">
            <div className="researchers-workspace-header">
              <div>
                <span className="researchers-section-label">Explore the work</span>
                <h2>Who we are and what we study</h2>
              </div>
              <Users className="researchers-workspace-icon" aria-hidden="true" />
            </div>

            <div className="researchers-tabs" role="tablist" aria-label="Research areas">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  className={`researchers-tab${activeTab === tab.value ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'mathventure' && (
              <section className="researchers-tab-panel" role="tabpanel" aria-label="MathVenture team">
                <div className="researchers-panel-intro">
                  <span className="researchers-section-label">MathVenture</span>
                  <h3>Playful practice for the early years.</h3>
                  <p>
                    MathVenture is designed around short, friendly activities that help children build confidence with colors, shapes, numbers, and patterns.
                  </p>
                </div>

                <article className="researchers-feature-profile">
                  <img className="researchers-face" src="/assets/images/dmm.png" alt="Donna May Mesina" />
                  <div>
                    <span className="researchers-profile-role">Creator and developer</span>
                    <h4>Donna May Mesina</h4>
                    <p>Creative mind and developer behind MathVenture.</p>
                  </div>
                </article>
              </section>
            )}

            {activeTab === 'counting' && (
              <section className="researchers-tab-panel" role="tabpanel" aria-label="Counting the Uncounted research team">
                <div className="researchers-panel-intro">
                  <span className="researchers-section-label">Counting the Uncounted</span>
                  <h3>Understanding how young learners experience mathematics.</h3>
                  <p>
                    Read the research project exploring mathematical literacy levels among kindergarten learners in New Cabalan Elementary School.
                  </p>
                </div>

                <div className="researchers-counting-layout">
                  <article className="researchers-primary-profile">
                    <img className="researchers-face researchers-face--professor" src="/assets/images/MR.png" alt="Ms. Rachelle Ann D. Ignacio" />
                    <span className="researchers-profile-role">Professor & Research Adviser</span>
                    <h4>Ms. Rachelle Ann D. Ignacio</h4>
                  </article>

                  <div className="researchers-profile-grid">
                    <ResearchProfile image="dmm.png" name="Donna May Mesina" role="Research lead" />
                    <ResearchProfile image="gy.png" name="Guienn Garganta" />
                    <ResearchProfile image="alr.png" name="Alyssa Rica Librero" />
                    <ResearchProfile image="gv.png" name="Georgia Victoria Villafania" />
                  </div>
                </div>

                <a className="researchers-paper-link" href="/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf" target="_blank" rel="noopener noreferrer">
                  <FileText aria-hidden="true" /> Read the research paper
                </a>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ResearchProfile({ image, name, role = 'Research contributor' }: { image: string; name: string; role?: string }) {
  return (
    <article className="researchers-profile-card">
      <img className="researchers-face" src={`/assets/images/${image}`} alt={name} />
      <div>
        <span className="researchers-profile-role">{role}</span>
        <h4>{name}</h4>
      </div>
    </article>
  );
}
