/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PjSheet } from './components/pj/PjSheet';
import { PjCreationWizard } from './components/pj/PjCreationWizard';
import { MjConsole } from './components/mj/MjConsole';
import { DiceRoller } from './components/DiceRoller';
import {
  BESTIAIRE,
  EQUIPEMENTS,
  ETATS,
  PROFILS,
  RACES,
  REGLES,
  SAMPLE_HERO,
  SORTS_CATALOG,
} from './data/coDatabase';
import { Character, Combatant } from './types/chroniques';

export default function App() {
  const [appMode, setAppMode] = useState<'pj' | 'mj'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#mj') return 'mj';
    return 'pj';
  });
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Pack Extension Tharnéa / Codex de l'Obscure toggle state
  const [isTharneaActive, setIsTharneaActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cof_tharnea_active');
      return saved === null ? true : saved === 'true'; // default to true so user immediately sees their pack
    } catch {
      return true;
    }
  });

  const handleToggleTharnea = (active: boolean) => {
    setIsTharneaActive(active);
    try {
      localStorage.setItem('cof_tharnea_active', active ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
    showToast(
      active
        ? "✨ Extension Tharnéa activée : 61 monstres, 30+ artéfacts et 12 bonbons débloqués !"
        : "Extension Tharnéa désactivée : Mode DRS officiel pur."
    );
  };

  // Sync hash routing #pj / #mj
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#mj') setAppMode('mj');
      else if (window.location.hash === '#pj') setAppMode('pj');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleModeChange = (mode: 'pj' | 'mj') => {
    setAppMode(mode);
    window.location.hash = mode;
  };

  // Load PJ from LocalStorage with fallback
  const [currentPj, setCurrentPj] = useState<Character | null>(() => {
    try {
      const saved = localStorage.getItem('co_pj_local');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_HERO;
  });

  // Load MJ table from LocalStorage with full DRS data
  const [tableData, setTableData] = useState(() => {
    try {
      const saved = localStorage.getItem('co_mj_table');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          pjs: parsed.pjs || [SAMPLE_HERO],
          combatants: parsed.combatants || [],
          bestiaire: parsed.bestiaire?.length ? parsed.bestiaire : BESTIAIRE,
          equipements: parsed.equipements?.length ? parsed.equipements : EQUIPEMENTS,
          regles: parsed.regles?.length ? parsed.regles : REGLES,
          etats: parsed.etats?.length ? parsed.etats : ETATS,
          races: parsed.races?.length ? parsed.races : RACES,
          profils: parsed.profils?.length ? parsed.profils : PROFILS,
          sorts: parsed.sorts?.length ? parsed.sorts : SORTS_CATALOG,
        };
      }
    } catch (e) {
      console.error(e);
    }

    return {
      pjs: [SAMPLE_HERO],
      combatants: [
        {
          id: 'c_init_1',
          n: SAMPLE_HERO.name,
          isPj: true,
          hp: SAMPLE_HERO.hp,
          hpMax: SAMPLE_HERO.hpMaxAuto || 12,
          def: 15,
          baseInit: 12,
          init: 12,
          notes: 'Chevalier Niv. 1',
          pjRefId: SAMPLE_HERO.id,
        },
        {
          id: 'c_init_2',
          n: 'Gobelin éclaireur',
          isPj: false,
          hp: 8,
          hpMax: 8,
          def: 13,
          baseInit: 14,
          init: 14,
          notes: 'Dague +2 (1d4) ou Arc +4 (1d6)',
        },
      ],
      bestiaire: BESTIAIRE,
      equipements: EQUIPEMENTS,
      regles: REGLES,
      etats: ETATS,
      races: RACES,
      profils: PROFILS,
      sorts: SORTS_CATALOG,
    };
  });

  // Persist PJ
  useEffect(() => {
    if (currentPj) {
      try {
        localStorage.setItem('co_pj_local', JSON.stringify(currentPj));
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentPj]);

  // Persist MJ state
  useEffect(() => {
    try {
      localStorage.setItem('co_mj_table', JSON.stringify(tableData));
    } catch (e) {
      console.error(e);
    }
  }, [tableData]);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (msg: string) => {
    setNotification(msg);
  };

  // Sync PJ into MJ table
  const handleSendPjToMj = () => {
    if (!currentPj) return;
    const pjs = [...tableData.pjs];
    const idx = pjs.findIndex(
      (p) => (p.id && p.id === currentPj.id) || p.name.toLowerCase() === currentPj.name.toLowerCase()
    );

    if (idx >= 0) {
      pjs[idx] = { ...currentPj };
      showToast(`Héros "${currentPj.name}" actualisé dans la table MJ !`);
    } else {
      pjs.push({ ...currentPj });
      showToast(`Héros "${currentPj.name}" ajouté à l'équipe MJ !`);
    }

    setTableData({ ...tableData, pjs });
  };

  // Global Drag & Drop for JSON files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || !files.length) return;

      Array.from(files).forEach((file) => {
        if (!file.name.endsWith('.json')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.name && data.base) {
              // Character sheet JSON
              setCurrentPj(data);
              showToast(`Fiche "${data.name}" chargée dans le Compagnon PJ !`);
            } else if (data.combatants && data.pjs) {
              // Full MJ campaign master
              setTableData((prev) => ({ ...prev, ...data }));
              showToast('Campagne Master MJ chargée avec succès !');
            } else if (Array.isArray(data) && data[0]?.nc !== undefined) {
              // Bestiary
              setTableData((prev) => ({ ...prev, bestiaire: data }));
              showToast(`${data.length} créatures ajoutées au Bestiaire !`);
            }
          } catch (err) {
            console.error('Erreur lecture JSON', err);
          }
        };
        reader.readAsText(file);
      });
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-[#ede3d1] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        appMode={appMode}
        setAppMode={handleModeChange}
        onOpenDiceRoller={() => setIsDiceRollerOpen(true)}
        currentPj={currentPj}
        onSendPjToMj={handleSendPjToMj}
        pjsCountInMj={tableData.pjs.length}
        isTharneaActive={isTharneaActive}
        onToggleTharnea={handleToggleTharnea}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="no-print fixed top-16 right-4 z-50 bg-[#291712] border border-[#d4a84a] text-[#f3d48d] px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto pb-16">
        {appMode === 'pj' ? (
          <PjSheet
            pj={currentPj}
            onUpdatePj={(updated) => setCurrentPj(updated)}
            onOpenWizard={() => setIsWizardOpen(true)}
            onSendToMjTable={handleSendPjToMj}
            isTharneaActive={isTharneaActive}
          />
        ) : (
          <MjConsole
            tableData={tableData}
            onUpdateTableData={(updated) => setTableData(updated)}
            currentActivePj={currentPj}
            onImportActivePj={handleSendPjToMj}
            isTharneaActive={isTharneaActive}
          />
        )}
      </main>

      {/* Footer credits */}
      <footer className="no-print border-t border-[#3d3023]/60 bg-[#120f0c] py-3 px-4 text-center text-[11px] text-[#9e907d]">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <p>
            Chroniques Oubliées Fantasy est un jeu de rôle de Black Book Éditions.
            Contenus sous licence libre OGL consultables sur{' '}
            <a
              href="https://www.co-drs.org/fr"
              target="_blank"
              rel="noreferrer"
              className="text-[#d4a84a] hover:underline"
            >
              co-drs.org
            </a>
            . Compagnon PJ &amp; Console MJ optimisés pour table physique et virtuelle.
          </p>
          <span className="text-[10px] text-[#6d5e4b] font-mono tracking-wider shrink-0">
            Doudou, F.P
          </span>
        </div>
      </footer>

      {/* Character Creation Wizard Modal */}
      <PjCreationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCharacterCreated={(newChar) => {
          setCurrentPj(newChar);
          showToast(`Héros "${newChar.name}" créé avec succès !`);
        }}
      />

      {/* Virtual Dice Roller Modal */}
      <DiceRoller
        isOpen={isDiceRollerOpen}
        onClose={() => setIsDiceRollerOpen(false)}
      />
    </div>
  );
}
