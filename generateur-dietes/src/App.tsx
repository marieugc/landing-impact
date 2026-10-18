import { useEffect, useState } from 'react';
import { ensureSeeded } from './db/db';
import { BackupPage } from './ui/BackupPage';
import { DietPage } from './ui/DietPage';
import { FoodsPage } from './ui/FoodsPage';
import { go, useRoute } from './ui/router';
import { SettingsPage } from './ui/SettingsPage';
import { StudentPage } from './ui/StudentPage';
import { StudentsPage } from './ui/StudentsPage';

const NAV = [
  { path: '', label: 'Mes élèves', icon: '💜' },
  { path: 'aliments', label: 'Aliments', icon: '🥗' },
  { path: 'reglages', label: 'Réglages', icon: '⚙️' },
  { path: 'sauvegarde', label: 'Sauvegarde', icon: '💾' },
];

export function App() {
  const route = useRoute();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    ensureSeeded()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  const section = route[0] === 'eleve' ? '' : route[0] ?? '';
  let page: JSX.Element;
  if (route[0] === 'eleve' && route[2] === 'diete' && route[3]) page = <DietPage key={route[3]} studentId={Number(route[1])} dietId={Number(route[3])} />;
  else if (route[0] === 'eleve' && route[1]) page = <StudentPage key={route[1]} id={route[1] === 'nouvelle' ? null : Number(route[1])} />;
  else if (route[0] === 'aliments') page = <FoodsPage />;
  else if (route[0] === 'reglages') page = <SettingsPage />;
  else if (route[0] === 'sauvegarde') page = <BackupPage />;
  else page = <StudentsPage />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand" onClick={() => go('')} style={{ cursor: 'pointer' }}>
          <div className="brand-name">Booty Flow</div>
          <div className="brand-sub">Générateur de diètes</div>
        </div>
        {NAV.map((n) => (
          <a key={n.path} href={'#/' + n.path} className={'nav-link' + (section === n.path ? ' active' : '')}>
            <span>{n.icon}</span> {n.label}
          </a>
        ))}
        <div className="sidebar-foot">Données enregistrées uniquement sur cet ordinateur. Pense à faire une sauvegarde régulière.</div>
      </aside>
      <main className="main">
        {error && <div className="banner warn">Impossible d'ouvrir la base locale : {error}</div>}
        {ready ? page : !error && <p className="muted">Chargement…</p>}
      </main>
    </div>
  );
}
