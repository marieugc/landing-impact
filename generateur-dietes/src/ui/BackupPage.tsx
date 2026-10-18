import { useRef, useState } from 'react';
import { exportBackup, importBackup } from '../db/db';
import { todayISO } from './hooks';

export function BackupPage() {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const doExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sauvegarde-booty-flow-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ ok: true, text: `Sauvegarde téléchargée : ${data.students.length} élève(s), ${data.diets.length} diète(s), ${data.foods.length} aliment(s).` });
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('Importer cette sauvegarde ? TOUTES les données actuelles seront remplacées par celles du fichier.')) return;
      await importBackup(data);
      setMsg({ ok: true, text: 'Sauvegarde importée avec succès.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Fichier illisible.' });
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Sauvegarde</h1>
      </div>
      <div className="banner info">
        Tes données (élèves, diètes, poids, aliments, réglages) sont enregistrées <strong>uniquement dans ce navigateur, sur cet ordinateur</strong>. Si tu vides
        les données du navigateur ou changes d'ordinateur, elles disparaissent : télécharge une sauvegarde régulièrement (par exemple chaque semaine) et
        range-la dans un dossier sûr (Google Drive, iCloud…).
      </div>
      {msg && <div className={'banner ' + (msg.ok ? 'info' : 'warn')}>{msg.text}</div>}
      <div className="grid grid-2">
        <div className="card glow">
          <h2>Exporter</h2>
          <p className="muted">Télécharge un fichier .json contenant toutes tes données.</p>
          <button className="btn primary" onClick={doExport}>
            ⬇ Télécharger ma sauvegarde
          </button>
        </div>
        <div className="card">
          <h2>Importer</h2>
          <p className="muted">Restaure une sauvegarde (sur ce poste ou un nouvel ordinateur). Les données actuelles sont remplacées.</p>
          <input ref={input} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <button className="btn" onClick={() => input.current?.click()}>
            ⬆ Choisir un fichier de sauvegarde
          </button>
        </div>
      </div>
    </div>
  );
}
