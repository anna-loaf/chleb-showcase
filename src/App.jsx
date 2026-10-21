import { useEffect, useState } from 'react';
import { ROUTES, useRoute } from './lib/router.js';
import { BreadMark } from './components/BreadMark.jsx';
import { Icon } from './components/Icon.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { UpdatePrompt } from './components/UpdatePrompt.jsx';
import { Dashboard } from './views/Dashboard.jsx';
import { Chat } from './views/Chat.jsx';
import { History } from './views/History.jsx';
import { Knowledge } from './views/Knowledge.jsx';
import { Settings } from './views/Settings.jsx';
import { Events } from './views/Events.jsx';
import { Roles, Unsure } from './views/Roles.jsx';

const TABS = [
  { route: 'piec', icon: 'piec' },
  { route: 'wydarzenia', icon: 'calendar', short: 'Wydarzenia' },
  { route: 'role', icon: 'mail', short: 'Role' },
  { route: 'czat', icon: 'chat', short: 'Zagadaj' },
];

const VIEWS = { piec: Dashboard, wydarzenia: Events, role: Roles, znaki: Unsure, czat: Chat, spizarnia: History, receptura: Knowledge, zaplecze: Settings };

export default function App() {
  const route = useRoute();
  const meta = ROUTES[route];
  const View = VIEWS[route];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = route === 'piec' ? 'C.H.L.E.B' : `${meta.name} · C.H.L.E.B`;
  }, [route, meta.name]);

  return (
    <ToastProvider>
      <div className="app">
        <header className={`topbar${scrolled ? ' scrolled' : ''}`}>
          <div className="topbar-inner">
            <a href="#/" aria-label="Piec — pulpit" className="brandmark">
              <BreadMark size={40} decorative />
            </a>
            <div className="topbar-title">
              <h1>{meta.name}</h1>
              <p>{meta.meaning}</p>
            </div>
            <a
              className="icon-button"
              href="#/zaplecze"
              aria-label="Zaplecze — ustawienia"
              aria-current={route === 'zaplecze' ? 'page' : undefined}
            >
              <Icon name="sliders" />
            </a>
          </div>
        </header>

        <main className="main" id="main">
          <View key={route} />
        </main>

        <nav className="tabbar" aria-label="Główne sekcje">
          <div className="tabbar-inner">
            {TABS.map((t) => (
              <a
                key={t.route}
                className="tab"
                href={t.route === 'piec' ? '#/' : `#/${t.route}`}
                aria-current={(route === t.route || (route === "znaki" && t.route === "role")) ? "page" : undefined}
              >
                <Icon name={t.icon} size={24} />
                <span className="tab-name">{t.short ?? ROUTES[t.route].name}</span>
                <span className="tab-sub">{ROUTES[t.route].tab}</span>
              </a>
            ))}
          </div>
        </nav>
        <UpdatePrompt />
      </div>
    </ToastProvider>
  );
}
