import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db/db';
import { normalize } from '../engine/filters';
import { OBJECTIVE_LABELS, PHASE_LABELS } from '../engine/targets';
import { formatDate } from './hooks';
import { go } from './router';

export function StudentsPage() {
  const [q, setQ] = useState('');
  const students = useLiveQuery(() => db.students.toArray(), []);
  const diets = useLiveQuery(() => db.diets.toArray(), []);
  const list = (students ?? [])
    .filter((s) => normalize(s.firstName + ' ' + s.notes).includes(normalize(q)))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, 'fr'));

  return (
    <div>
      <div className="page-head">
        <h1>Mes élèves</h1>
        <div className="row">
          <input placeholder="🔍 Rechercher une élève…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
          <button className="btn primary" onClick={() => go('eleve/nouvelle')}>
            + Nouvelle élève
          </button>
        </div>
      </div>
      {students && students.length === 0 && (
        <div className="card glow">
          <h2>Bienvenue dans ton générateur de diètes 💜</h2>
          <p className="muted">
            Commence par créer une élève. Dans sa fiche, tu pourras saisir son poids, ses options alimentaires, puis générer sa diète en entrant
            simplement son total calorique jour training et jour repos.
          </p>
          <button className="btn primary" onClick={() => go('eleve/nouvelle')}>
            Créer ma première élève
          </button>
        </div>
      )}
      {list.map((s) => {
        const sd = (diets ?? []).filter((d) => d.studentId === s.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return (
          <a key={s.id} href={`#/eleve/${s.id}`} className="list-item" style={{ color: 'inherit' }}>
            <div className="avatar">{s.firstName.slice(0, 1).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{s.firstName}</div>
              <div className="small muted">
                {s.age} ans · {s.height} cm · {s.weight} kg · {OBJECTIVE_LABELS[s.objective]} · {PHASE_LABELS[s.phase]}
              </div>
            </div>
            <div className="spacer" />
            <span className="pill">{sd.length} diète{sd.length > 1 ? 's' : ''}</span>
            {sd[0] && <span className="small faint">dernière : {formatDate(sd[0].createdAt)}</span>}
          </a>
        );
      })}
      {students && students.length > 0 && list.length === 0 && <p className="muted">Aucune élève ne correspond à « {q} ».</p>}
    </div>
  );
}
