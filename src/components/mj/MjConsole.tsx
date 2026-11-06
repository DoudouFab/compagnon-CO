import React, { useState } from 'react';
import {
  Swords,
  Users,
  Skull,
  Coins,
  BookOpen,
  Sparkles,
  Dices,
  RotateCcw,
  Plus,
  Trash2,
  FileDown,
  FileUp,
  Search,
  Filter,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpDown,
  Zap,
  Info,
  ExternalLink,
  Download,
} from 'lucide-react';
import { DetailModal, DetailItem } from '../DetailModal';
import { StateBadgeList } from '../common/StateBadgeList';
import { PnjCreatorModal } from './PnjCreatorModal';
import {
  BESTIAIRE,
  EQUIPEMENTS,
  ETATS,
  PROFILS,
  RACES,
  REGLES,
  SORTS_CATALOG,
  VOIES_CATALOG,
  getMod,
} from '../../data/coDatabase';
import {
  THARNEA_MONSTERS,
  THARNEA_ARTIFACTS,
  THARNEA_LORE_RULES,
} from '../../data/tharneaSupplement';
import {
  Character,
  Combatant,
  Equipment,
  Monster,
  PrejudicialState,
  ProfilData,
  RaceData,
  RuleChapter,
  SpellItem,
} from '../../types/chroniques';

interface MjTableData {
  pjs: Character[];
  combatants: Combatant[];
  bestiaire: Monster[];
  equipements: Equipment[];
  regles: RuleChapter[];
  etats: PrejudicialState[];
  races: RaceData[];
  profils: ProfilData[];
  sorts: SpellItem[];
}

interface MjConsoleProps {
  tableData: MjTableData;
  onUpdateTableData: (updated: MjTableData) => void;
  currentActivePj: Character | null;
  onImportActivePj: () => void;
  isTharneaActive?: boolean;
}

export const MjConsole: React.FC<MjConsoleProps> = ({
  tableData,
  onUpdateTableData,
  currentActivePj,
  onImportActivePj,
  isTharneaActive = true,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'combat'
    | 'groupe'
    | 'bestiaire'
    | 'tharnea'
    | 'equipements'
    | 'regles'
    | 'races'
    | 'profils'
    | 'voies'
    | 'grimoire'
  >('combat');

  // Search & Filter states
  const [combatSearch, setCombatSearch] = useState('');
  const [combatFilter, setCombatFilter] = useState<'all' | 'pj' | 'monstre' | 'alive' | 'ko'>('all');

  const [pjSearch, setPjSearch] = useState('');
  const [pjProfFilter, setPjProfFilter] = useState('');
  const [pjRaceFilter, setPjRaceFilter] = useState('');

  const [bestSearch, setBestSearch] = useState('');
  const [bestNcFilter, setBestNcFilter] = useState('');
  const [bestFamFilter, setBestFamFilter] = useState('');
  const [bestSourceFilter, setBestSourceFilter] = useState<'all' | 'drs' | 'tharnea'>('all');

  // Tharnea Codex Tab states
  const [tharneaSubTab, setTharneaSubTab] = useState<'monstres' | 'artefacts' | 'bonbons' | 'lore'>('monstres');
  const [tharneaSearch, setTharneaSearch] = useState('');
  const [isPnjCreatorOpen, setIsPnjCreatorOpen] = useState(false);

  const [eqSearch, setEqSearch] = useState('');
  const [eqCatFilter, setEqCatFilter] = useState('');
  const [eqSourceFilter, setEqSourceFilter] = useState<'all' | 'drs' | 'tharnea'>('all');

  const [regSearch, setRegSearch] = useState('');
  const [regCatFilter, setRegCatFilter] = useState('');

  const [raceSearch, setRaceSearch] = useState('');
  const [profSearch, setProfSearch] = useState('');
  const [voieSearch, setVoieSearch] = useState('');
  const [voiesProfilFilter, setVoiesProfilFilter] = useState<string>('all');
  const [grimSearch, setGrimSearch] = useState('');
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  // Add custom combatant state
  const [isAddCombatantOpen, setIsAddCombatantOpen] = useState(false);
  const [newCombatantName, setNewCombatantName] = useState('');
  const [newCombatantHp, setNewCombatantHp] = useState(15);
  const [newCombatantDef, setNewCombatantDef] = useState(12);
  const [newCombatantInit, setNewCombatantInit] = useState(10);
  const [newCombatantIsPj, setNewCombatantIsPj] = useState(false);
  const [newCombatantNotes, setNewCombatantNotes] = useState('');

  // ==================== COMBAT ACTIONS ====================
  const rollOneInit = (index: number) => {
    const list = [...tableData.combatants];
    const c = list[index];
    const d20 = Math.floor(Math.random() * 20) + 1;
    c.lastRoll = d20;
    c.init = d20 + (c.baseInit || 10);
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const rollAllInit = () => {
    const list = tableData.combatants.map((c) => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      return {
        ...c,
        lastRoll: d20,
        init: d20 + (c.baseInit || 10),
      };
    });
    list.sort((a, b) => b.init - a.init);
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const rollMonstersInit = () => {
    const list = tableData.combatants.map((c) => {
      if (!c.isPj) {
        const d20 = Math.floor(Math.random() * 20) + 1;
        return {
          ...c,
          lastRoll: d20,
          init: d20 + (c.baseInit || 10),
        };
      }
      return c;
    });
    list.sort((a, b) => b.init - a.init);
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const sortCombatantsByInit = () => {
    const list = [...tableData.combatants].sort((a, b) => b.init - a.init);
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const clearCombat = () => {
    if (confirm('Voulez-vous vider la piste de combat ?')) {
      onUpdateTableData({ ...tableData, combatants: [] });
    }
  };

  const alterCombatHp = (index: number, delta: number) => {
    const list = [...tableData.combatants];
    const c = list[index];
    c.hp = Math.max(0, Math.min(c.hpMax, c.hp + delta));
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const setCombatHp = (index: number, val: number) => {
    const list = [...tableData.combatants];
    const c = list[index];
    c.hp = Math.max(0, Math.min(c.hpMax, val));
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const removeCombatant = (index: number) => {
    const list = [...tableData.combatants];
    list.splice(index, 1);
    onUpdateTableData({ ...tableData, combatants: list });
  };

  const toggleCombatantState = (index: number, stateName: string) => {
    const list = [...tableData.combatants];
    const c = list[index];
    const current = c.etats || [];
    const exists = current.includes(stateName);
    const nextStates = exists ? current.filter((s) => s !== stateName) : [...current, stateName];
    c.etats = nextStates;

    // S'il est lié à un PJ du groupe, synchroniser également le groupe
    let nextPjs = tableData.pjs;
    if (c.pjRefId || c.isPj) {
      nextPjs = tableData.pjs.map((p) => {
        if (p.id === (c.pjRefId || c.id) || p.name === c.n) {
          return { ...p, etats: nextStates };
        }
        return p;
      });
    }
    onUpdateTableData({ ...tableData, combatants: list, pjs: nextPjs });
  };

  const handleSavePnj = (newPnj: Character, addToCombat: boolean) => {
    const nextPjs = [...tableData.pjs, newPnj];
    let nextCombatants = tableData.combatants;
    if (addToCombat) {
      const pnjCombatant: Combatant = {
        id: newPnj.id,
        n: `${newPnj.name} (${newPnj.rolePnj || 'PNJ Allié'})`,
        hp: newPnj.hp,
        hpMax: newPnj.hp,
        def: (newPnj as any).def || 12,
        init: (newPnj as any).init || 10,
        baseInit: (newPnj as any).init || 10,
        isPj: true, // allié des PJ
        isPnj: true,
        pjRefId: newPnj.id,
        notes: `PNJ Allié - ${newPnj.rolePnj || 'Guide/Mercenaire'} (${newPnj.race} ${newPnj.profil})`,
        etats: newPnj.etats || [],
      };
      nextCombatants = [...nextCombatants, pnjCombatant];
    }
    onUpdateTableData({ ...tableData, pjs: nextPjs, combatants: nextCombatants });
  };

  const handleAddCustomCombatant = () => {
    if (!newCombatantName.trim()) {
      alert('Veuillez spécifier un nom.');
      return;
    }
    const newC: Combatant = {
      id: 'c_' + Date.now(),
      n: newCombatantName.trim(),
      isPj: newCombatantIsPj,
      hp: newCombatantHp,
      hpMax: newCombatantHp,
      def: newCombatantDef,
      baseInit: newCombatantInit,
      init: newCombatantInit,
      notes: newCombatantNotes.trim(),
    };
    onUpdateTableData({
      ...tableData,
      combatants: [...tableData.combatants, newC],
    });
    setIsAddCombatantOpen(false);
    setNewCombatantName('');
    setNewCombatantNotes('');
  };

  // Add monster to combat
  const addMonsterToCombat = (m: Monster) => {
    const newC: Combatant = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      n: m.n,
      isPj: false,
      hp: m.pv,
      hpMax: m.pv,
      def: m.def,
      baseInit: m.init,
      init: m.init,
      notes: `${m.att} | ${m.traits}`,
    };
    onUpdateTableData({
      ...tableData,
      combatants: [...tableData.combatants, newC],
    });
    alert(`« ${m.n} » a été ajouté à la piste de combat !`);
  };

  // Send PJ to combat
  const sendPjToCombat = (pj: Character) => {
    const existing = tableData.combatants.find((c) => c.pjRefId === pj.id || c.n === pj.name);
    if (existing) {
      if (!confirm(`"${pj.name}" est déjà dans le combat. Ajouter une autre occurrence ?`)) {
        return;
      }
    }
    const hpMax = pj.hpMaxManual || pj.hpMaxAuto || pj.hpBase || 10;
    const newC: Combatant = {
      id: 'pj_cmb_' + Date.now(),
      n: pj.name,
      isPj: true,
      hp: pj.hp,
      hpMax: hpMax,
      def: 10 + (getMod((pj.base.DEX || 10) + (pj.rb.DEX || 0))),
      baseInit: (pj.base.DEX || 10) + (pj.rb.DEX || 0),
      init: (pj.base.DEX || 10) + (pj.rb.DEX || 0),
      notes: `${pj.profil} Niv. ${pj.level} (${pj.race})`,
      pjRefId: pj.id,
    };
    onUpdateTableData({
      ...tableData,
      combatants: [...tableData.combatants, newC],
    });
    alert(`"${pj.name}" envoyé au combat !`);
  };

  const addAllPjToCombat = () => {
    if (!tableData.pjs.length) {
      alert("Aucun personnage n'est présent dans le groupe.");
      return;
    }
    const combatantsToAdd: Combatant[] = tableData.pjs.map((p) => {
      const hpMax = p.hpMaxManual || p.hpMaxAuto || p.hpBase || 10;
      return {
        id: 'pj_cmb_' + p.id + '_' + Date.now(),
        n: p.name,
        isPj: true,
        hp: p.hp,
        hpMax: hpMax,
        def: 10 + (getMod((p.base.DEX || 10) + (p.rb.DEX || 0))),
        baseInit: (p.base.DEX || 10) + (p.rb.DEX || 0),
        init: (p.base.DEX || 10) + (p.rb.DEX || 0),
        notes: `${p.profil} Niv. ${p.level} (${p.race})`,
        pjRefId: p.id,
      };
    });
    onUpdateTableData({
      ...tableData,
      combatants: [...tableData.combatants, ...combatantsToAdd],
    });
    setActiveTab('combat');
    alert(`${combatantsToAdd.length} personnages envoyés au combat !`);
  };

  // Master Save & Load
  const handleSaveMaster = () => {
    const a = document.createElement('a');
    a.href =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(tableData, null, 2));
    a.download = 'Campagne_CO_Master.json';
    a.click();
  };

  const handleLoadMaster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed === 'object') {
          onUpdateTableData({
            ...tableData,
            ...parsed,
          });
          alert('Campagne Master restaurée avec succès !');
        }
      } catch (err: any) {
        alert('Erreur lors du chargement : ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Import multi PJ files
  const handleImportPjFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const pjs = [...tableData.pjs];
    let count = 0;
    const fileList = Array.from(files);
    let pending = fileList.length;

    fileList.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.name && data.base) {
            const idx = pjs.findIndex((p) => p.name.toLowerCase() === data.name.toLowerCase());
            if (idx >= 0) pjs[idx] = data;
            else pjs.push(data);
            count++;
          }
        } catch (e) {
          console.error(e);
        }
        pending--;
        if (pending === 0) {
          onUpdateTableData({ ...tableData, pjs });
          alert(`${count} fiches de PJ importées avec succès !`);
        }
      };
      reader.readAsText(f);
    });
  };

  // Download Offline Standalone MJ HTML App
  const handleDownloadOfflineMjHtml = async () => {
    try {
      const res = await fetch('/assets/aistudio/ai_studio_code_a33982d1.html');
      const htmlText = await res.text();
      const injectedHtml = htmlText.replace(
        'let st = LS.get("co_mj_table", null);',
        `let st = ${JSON.stringify(tableData)};`
      );
      const blob = new Blob([injectedHtml], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Console_MJ_Chroniques_Oubliees_Offline.html`;
      a.click();
      alert(
        'Application HTML Meneur de Jeu autonome téléchargée ! Vous pouvez double-cliquer dessus pour l\'ouvrir directement dans n\'importe quel navigateur, même 100% hors-ligne.'
      );
    } catch (err: any) {
      alert("Erreur lors du téléchargement : " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* MJ Console Sub-Header & Controls */}
      <div className="bg-gradient-to-r from-[#2e1313] via-[#1c1410] to-[#120f0d] border border-[#9c2a2b]/70 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-co text-2xl font-bold text-[#ffb8b8]">
                Console du Meneur de Jeu (MJ)
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#4d1f1c] text-[#ff9d9d] border border-[#cf5544]/50">
                Hub de Table &amp; DRS
              </span>
            </div>
            <p className="text-xs text-[#9e907d] mt-1">
              Gestion de combat, initiatives d20, bestiaire complet (53 monstres), groupe d'aventuriers, règles officielles et équipement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadOfflineMjHtml}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8b2628] to-[#691c1d] hover:brightness-110 text-xs font-bold text-white flex items-center gap-1.5 shadow-md"
              title="Télécharger l'application HTML autonome du MJ pour jouer hors-ligne"
            >
              <Download className="w-3.5 h-3.5" /> MJ Offline (.html)
            </button>
            <button
              onClick={handleSaveMaster}
              className="px-3 py-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-semibold text-[#f3d48d] flex items-center gap-1.5 shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5 text-[#d4a84a]" /> Sauvegarder (JSON)
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-semibold text-[#ede3d1] flex items-center gap-1.5 cursor-pointer shadow-xs">
              <FileUp className="w-3.5 h-3.5 text-[#d4a84a]" /> Charger Campagne
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleLoadMaster}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for MJ */}
      <div className="flex items-center gap-1 bg-[#181410] p-1.5 rounded-xl border border-[#3d3023] overflow-x-auto">
        {[
          { key: 'combat', label: 'Combat & Init', icon: Swords, badge: tableData.combatants.length },
          { key: 'groupe', label: 'Groupe & PNJ', icon: Users, badge: tableData.pjs.length },
          { key: 'bestiaire', label: 'Bestiaire DRS', icon: Skull, badge: BESTIAIRE.length },
          ...(isTharneaActive
            ? [
                {
                  key: 'tharnea',
                  label: '🔮 Codex Tharnéa',
                  icon: Sparkles,
                  badge: THARNEA_MONSTERS.length + THARNEA_ARTIFACTS.length,
                  highlight: true,
                },
              ]
            : []),
          { key: 'equipements', label: 'Équipements', icon: Coins, badge: EQUIPEMENTS.length },
          { key: 'regles', label: 'Règles & États', icon: BookOpen, badge: REGLES.length + ETATS.length },
          { key: 'races', label: 'Races', icon: Shield, badge: RACES.length },
          { key: 'profils', label: 'Profils', icon: Layers, badge: PROFILS.length },
          { key: 'voies', label: 'Voies & Rangs', icon: Sparkles, badge: Object.keys(VOIES_CATALOG).length },
          { key: 'grimoire', label: 'Grimoire DRS', icon: Zap, badge: SORTS_CATALOG.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const isTharneaTab = tab.key === 'tharnea';

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? isTharneaTab
                    ? 'bg-gradient-to-r from-[#692994] to-[#4c1670] text-[#f7e6ff] border border-[#a855f7] shadow-md'
                    : 'bg-gradient-to-r from-[#9c2a2b] to-[#751c1d] text-white shadow-sm'
                  : isTharneaTab
                  ? 'text-[#cbafff] bg-[#22152f]/60 hover:bg-[#2b193d] border border-[#6b21a8]/50'
                  : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isTharneaTab && !isActive ? 'text-[#c084fc]' : ''}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-black/40 text-[#f3d48d]'
                      : isTharneaTab
                      ? 'bg-[#3b1754] text-[#e9d5ff]'
                      : 'bg-[#231c15] text-[#9e907d]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== 1. COMBAT & INITIATIVE ==================== */}
      {activeTab === 'combat' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                  Piste de Combat &amp; Ordre d'Initiative
                </h3>
                <span className="text-xs text-[#9e907d]">
                  Total engagés : <b className="text-[#ede3d1]">{tableData.combatants.length}</b>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={rollAllInit}
                  className="px-3 py-1.5 bg-[#d4a84a] hover:bg-[#e0b555] text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Dices className="w-3.5 h-3.5" /> Lancer TOUT (d20+Base)
                </button>
                <button
                  onClick={rollMonstersInit}
                  className="px-3 py-1.5 bg-[#3a2954] hover:bg-[#4d3670] border border-[#654a93] text-[#dccbff] text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Dices className="w-3.5 h-3.5" /> Lancer Monstres
                </button>
                <button
                  onClick={sortCombatantsByInit}
                  className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#ede3d1] rounded-lg flex items-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" /> Trier par Init
                </button>
                <button
                  onClick={() => setIsAddCombatantOpen(true)}
                  className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#f3d48d] rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Combattant
                </button>
                <button
                  onClick={clearCombat}
                  className="px-3 py-1.5 bg-[#381616] hover:bg-[#4d1f1f] border border-[#6d2525] text-[#ff9d9d] text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vider
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30251a]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrer par nom ou notes..."
                  value={combatSearch}
                  onChange={(e) => setCombatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <select
                value={combatFilter}
                onChange={(e) => setCombatFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              >
                <option value="all">Tous les combattants</option>
                <option value="pj">PJ uniquement</option>
                <option value="monstre">Monstres uniquement</option>
                <option value="alive">En vie (&gt; 0 PV)</option>
                <option value="ko">Inconscients / Morts (0 PV)</option>
              </select>

              {(combatSearch || combatFilter !== 'all') && (
                <button
                  onClick={() => {
                    setCombatSearch('');
                    setCombatFilter('all');
                  }}
                  className="px-2.5 py-1 text-xs text-[#9e907d] hover:text-[#ede3d1]"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Combatants List */}
          <div className="space-y-2.5">
            {tableData.combatants
              .filter((c) => {
                const matchQ = (c.n + (c.notes || '')).toLowerCase().includes(combatSearch.toLowerCase());
                let matchF = true;
                if (combatFilter === 'pj') matchF = !!c.isPj;
                else if (combatFilter === 'monstre') matchF = !c.isPj;
                else if (combatFilter === 'alive') matchF = c.hp > 0;
                else if (combatFilter === 'ko') matchF = c.hp <= 0;
                return matchQ && matchF;
              })
              .map((c, idx) => {
                const globalIdx = tableData.combatants.indexOf(c);
                const pct = Math.max(0, Math.min(100, Math.round((100 * c.hp) / Math.max(1, c.hpMax))));
                const barCol = pct > 50 ? '#6fa85b' : pct > 25 ? '#c97d32' : '#cf5544';

                return (
                  <div
                    key={c.id || idx}
                    className={`p-3.5 bg-[#181410] border-l-4 rounded-xl border border-[#3d3023] space-y-2.5 shadow-sm ${
                      c.isPj ? 'border-l-[#d4a84a]' : 'border-l-[#9c2a2b]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            c.isPj
                              ? 'bg-[#3b2a1a] text-[#f3d48d] border border-[#d4a84a]/40'
                              : 'bg-[#381616] text-[#ff9d9d] border border-[#6d2525]'
                          }`}
                        >
                          {c.isPj ? 'PJ' : 'Monstre'}
                        </span>
                        <b className="font-serif-co text-base text-[#ede3d1]">{c.n}</b>

                        {/* DÉFENSE / CA (Très mise en évidence) */}
                        <div
                          className="flex items-center gap-1.5 bg-[#121c2a] px-2.5 py-1 rounded-lg border border-[#2b4c6f]"
                          title="Classe d'Armure / Défense (10 + DEX + Armure + Bouclier). Modifiable directement."
                        >
                          <Shield className="w-3.5 h-3.5 text-[#7db5ff]" />
                          <span className="text-[11px] font-bold text-[#9ec4ff] uppercase">DEF / CA :</span>
                          <input
                            type="number"
                            value={c.def}
                            onChange={(e) => {
                              const list = [...tableData.combatants];
                              list[globalIdx].def = parseInt(e.target.value) || 10;
                              onUpdateTableData({ ...tableData, combatants: list });
                            }}
                            className="w-10 text-center font-bold text-sm text-[#ffffff] bg-[#0c131c] rounded border border-[#2b4c6f]/60 py-0.5 outline-none"
                          />
                        </div>
                      </div>

                      {/* Initiative input & roll */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5 bg-[#120f0c] px-2.5 py-1 rounded-lg border border-[#3d3023]">
                          <span className="text-[11px] text-[#9e907d] font-bold uppercase">Init :</span>
                          <input
                            type="number"
                            value={c.init}
                            onChange={(e) => {
                              const list = [...tableData.combatants];
                              list[globalIdx].init = parseInt(e.target.value) || 0;
                              onUpdateTableData({ ...tableData, combatants: list });
                            }}
                            className="w-12 text-center font-bold text-base text-[#f3d48d] bg-transparent outline-none"
                          />
                        </div>
                        <button
                          onClick={() => rollOneInit(globalIdx)}
                          className="px-2.5 py-1 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-semibold rounded text-[#ede3d1] flex items-center gap-1"
                        >
                          <Dices className="w-3.5 h-3.5 text-[#d4a84a]" /> Jet
                        </button>
                        {c.lastRoll !== undefined && (
                          <span className="text-[10px] text-[#9e907d] font-mono">
                            (d20: {c.lastRoll})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ÉTATS PRÉJUDICIABLES DU COMBATTANT */}
                    <div className="flex items-center gap-2 flex-wrap bg-[#14100c] px-2.5 py-1.5 rounded-lg border border-[#2d2218]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9e907d] shrink-0">
                        États :
                      </span>
                      <StateBadgeList
                        activeStates={c.etats || []}
                        onToggleState={(st) => toggleCombatantState(globalIdx, st)}
                        onSelectDetail={(state) => setDetailItem({ type: 'etat', data: state })}
                        allowEdit={true}
                        compact={true}
                      />
                    </div>

                    {/* HP management */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div>
                          Points de Vie : <b className="text-[#f3d48d]">{c.hp}</b> / {c.hpMax}
                          {c.hp <= 0 && (
                            <span className="ml-2 font-bold text-[#cf5544]">
                              💀 Inconscient / Hors de combat
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => alterCombatHp(globalIdx, -5)}
                            className="w-6 h-6 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] rounded text-xs font-bold text-[#ede3d1]"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => alterCombatHp(globalIdx, -1)}
                            className="w-6 h-6 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] rounded text-xs font-bold text-[#ede3d1]"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            value={c.hp}
                            onChange={(e) => setCombatHp(globalIdx, parseInt(e.target.value) || 0)}
                            className="w-12 text-center text-xs font-bold text-[#ede3d1] bg-[#120f0c] border border-[#3d3023] rounded py-0.5"
                          />
                          <button
                            onClick={() => alterCombatHp(globalIdx, 1)}
                            className="w-6 h-6 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] rounded text-xs font-bold text-[#ede3d1]"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => alterCombatHp(globalIdx, 5)}
                            className="w-6 h-6 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] rounded text-xs font-bold text-[#ede3d1]"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => removeCombatant(globalIdx)}
                            className="p-1 rounded text-[#9e907d] hover:text-[#cf5544] ml-2"
                            title="Retirer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#0c0a08] border border-[#3d3023] rounded-md h-2 overflow-hidden">
                        <div
                          className="h-full transition-all duration-200"
                          style={{ width: `${pct}%`, backgroundColor: barCol }}
                        />
                      </div>
                    </div>

                    {c.notes && (
                      <p className="text-xs text-[#9e907d] bg-[#120f0c] p-2 rounded border border-[#261f18]">
                        {c.notes}
                      </p>
                    )}
                  </div>
                );
              })}

            {tableData.combatants.length === 0 && (
              <div className="p-8 bg-[#181410] border border-[#3d3023] rounded-xl text-center space-y-3">
                <Swords className="w-10 h-10 text-[#9e907d] mx-auto opacity-50" />
                <h4 className="font-serif-co text-base font-bold text-[#ede3d1]">
                  Piste de Combat Vide
                </h4>
                <p className="text-xs text-[#9e907d] max-w-sm mx-auto">
                  Ajoutez des héros depuis l'onglet « Groupe PJ » ou des créatures depuis le « Bestiaire » pour démarrer un affrontement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. GROUPE PJ ==================== */}
      {activeTab === 'groupe' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                  Groupe d'Aventuriers
                </h3>
                <span className="text-xs text-[#9e907d]">
                  Héros enregistrés : <b className="text-[#ede3d1]">{tableData.pjs.length}</b>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPnjCreatorOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#2c4058] to-[#1a293b] hover:brightness-110 border border-[#4d7ca8] text-[#cce3ff] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                  title="Créer un nouveau PNJ ou allié officiel et l'intégrer au groupe d'aventuriers"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7db5ff]" /> Créer un PNJ / Allié
                </button>

                {currentActivePj && (
                  <button
                    onClick={onImportActivePj}
                    className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#d4a84a] text-[#f3d48d] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#d4a84a]" /> Importer PJ Actif ({currentActivePj.name.split(' ')[0]})
                  </button>
                )}

                <label className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-[#d4a84a]" /> Importer Fiches (JSON)
                  <input
                    type="file"
                    multiple
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleImportPjFiles(e.target.files)}
                  />
                </label>

                <button
                  onClick={addAllPjToCombat}
                  className="px-3 py-1.5 bg-[#d4a84a] hover:bg-[#e0b555] text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Swords className="w-3.5 h-3.5" /> Envoyer TOUT en Combat
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30251a]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, joueur, roleplay..."
                  value={pjSearch}
                  onChange={(e) => setPjSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <select
                value={pjProfFilter}
                onChange={(e) => setPjProfFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              >
                <option value="">Tous les profils</option>
                {[...new Set(tableData.pjs.map((p) => p.profil).filter(Boolean))].map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>

              <select
                value={pjRaceFilter}
                onChange={(e) => setPjRaceFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              >
                <option value="">Toutes les races</option>
                {[...new Set(tableData.pjs.map((p) => p.race).filter(Boolean))].map((rc) => (
                  <option key={rc} value={rc}>
                    {rc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of PJ cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tableData.pjs
              .filter((p) => {
                const str = (p.name + (p.player || '') + (p.persoTraits || '')).toLowerCase();
                const matchQ = str.includes(pjSearch.toLowerCase());
                const matchProf = !pjProfFilter || p.profil === pjProfFilter;
                const matchRace = !pjRaceFilter || p.race === pjRaceFilter;
                return matchQ && matchProf && matchRace;
              })
              .map((p, idx) => {
                const hpMax = p.hpMaxManual || p.hpMaxAuto || p.hpBase || 10;
                const defVal = (p as any).def || 12;

                const handleTogglePjState = (stName: string) => {
                  const list = [...tableData.pjs];
                  const current = list[idx].etats || [];
                  const exists = current.includes(stName);
                  const newStates = exists
                    ? current.filter((s) => s !== stName)
                    : [...current, stName];
                  list[idx] = { ...list[idx], etats: newStates };

                  // Sync also combatant if present in tableData.combatants
                  const updatedCombatants = tableData.combatants.map((c) => {
                    if (c.pjRefId === p.id || c.n.startsWith(p.name)) {
                      return { ...c, etats: newStates };
                    }
                    return c;
                  });

                  onUpdateTableData({ ...tableData, pjs: list, combatants: updatedCombatants });
                };

                return (
                  <div
                    key={p.id || idx}
                    className={`p-4 bg-[#181410] border rounded-xl flex flex-col justify-between space-y-3 ${
                      p.isPnj ? 'border-[#3b597a]' : 'border-[#3d3023]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              p.isPnj
                                ? 'bg-[#18283a] text-[#7db5ff] border border-[#2b4c6f]'
                                : 'bg-[#291e13] text-[#f3d48d] border border-[#d4a84a]/40'
                            }`}
                          >
                            {p.isPnj ? p.rolePnj || 'PNJ Allié' : 'PJ'}
                          </span>
                          <b className="font-serif-co text-base text-[#f3d48d]">{p.name}</b>
                        </div>

                        <button
                          onClick={() => {
                            const list = [...tableData.pjs];
                            list.splice(idx, 1);
                            onUpdateTableData({ ...tableData, pjs: list });
                          }}
                          className="p-1 rounded text-[#9e907d] hover:text-[#cf5544]"
                          title="Supprimer du groupe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-[#9e907d]">
                        {!p.isPnj && (
                          <span>
                            Joueur : <b className="text-[#ede3d1]">{p.player || 'Anonyme'}</b> •{' '}
                          </span>
                        )}
                        {p.race} • {p.profil} Niv. {p.level}
                      </div>

                      {/* PV et DÉFENSE / CA */}
                      <div className="mt-2.5 flex items-center justify-between text-xs bg-[#120f0c] p-2 rounded-lg border border-[#2d2218]">
                        <div>
                          Points de Vie : <b className="text-[#6fa85b]">{p.hp}</b> / {hpMax}
                        </div>
                        <div className="flex items-center gap-1 font-bold text-[#7db5ff]">
                          <Shield className="w-3.5 h-3.5" />
                          <span>DEF/CA :</span>
                          <span className="text-white">{defVal}</span>
                        </div>
                      </div>

                      {/* ÉTATS PRÉJUDICIABLES */}
                      <div className="mt-2.5 pt-2 border-t border-[#261f18]">
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-[#9e907d] font-bold uppercase">
                          <span>États :</span>
                        </div>
                        <StateBadgeList
                          activeStates={p.etats || []}
                          onToggleState={handleTogglePjState}
                          onSelectDetail={(state) => setDetailItem({ type: 'etat', data: state })}
                          allowEdit={true}
                          compact={true}
                        />
                      </div>

                      {p.persoTraits && (
                        <p className="text-[11px] text-[#9e907d] mt-2 italic line-clamp-2">
                          « {p.persoTraits} »
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => sendPjToCombat(p)}
                      className="w-full py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-[#f3d48d] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Swords className="w-3.5 h-3.5" /> Envoyer au Combat
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ==================== 3. BESTIAIRE (DRS + THARNÉA) ==================== */}
      {activeTab === 'bestiaire' && (() => {
        const fullBestiaire = isTharneaActive ? [...THARNEA_MONSTERS, ...BESTIAIRE] : BESTIAIRE;

        return (
          <div className="space-y-4">
            <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                    Bestiaire {isTharneaActive ? 'Complet (DRS & Codex de l\'Obscure)' : 'Officiel du DRS'}
                  </h3>
                  <span className="text-xs text-[#9e907d]">
                    Créatures répertoriées : <b className="text-[#ede3d1]">{fullBestiaire.length}</b> (DRS: {BESTIAIRE.length}{isTharneaActive ? ` · Tharnéa: ${THARNEA_MONSTERS.length}` : ''})
                  </span>
                </div>

                {/* Source filter selector */}
                {isTharneaActive && (
                  <div className="flex items-center gap-1 bg-[#120f0c] p-1 rounded-lg border border-[#3d3023]">
                    <button
                      type="button"
                      onClick={() => setBestSourceFilter('all')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        bestSourceFilter === 'all'
                          ? 'bg-[#d4a84a] text-black shadow-xs'
                          : 'text-[#9e907d] hover:text-[#ede3d1]'
                      }`}
                    >
                      Tous ({fullBestiaire.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBestSourceFilter('drs')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        bestSourceFilter === 'drs'
                          ? 'bg-[#d4a84a] text-black shadow-xs'
                          : 'text-[#9e907d] hover:text-[#ede3d1]'
                      }`}
                    >
                      DRS Officiel ({BESTIAIRE.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBestSourceFilter('tharnea')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        bestSourceFilter === 'tharnea'
                          ? 'bg-[#8a2d75] text-white shadow-xs'
                          : 'text-[#cca3c7] hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-[#ff8fed]" />
                      <span>Codex de l'Obscure ({THARNEA_MONSTERS.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30251a]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher nom, attaque, capacité, milieu..."
                    value={bestSearch}
                    onChange={(e) => setBestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                  />
                </div>

                <select
                  value={bestNcFilter}
                  onChange={(e) => setBestNcFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                >
                  <option value="">Tous les NC</option>
                  <option value="0">NC 0</option>
                  <option value="1/2">NC 1/2</option>
                  <option value="1">NC 1</option>
                  <option value="2">NC 2</option>
                  <option value="3">NC 3</option>
                  <option value="4">NC 4</option>
                  <option value="5">NC 5</option>
                  <option value="6">NC 6</option>
                  <option value="7">NC 7</option>
                  <option value="8">NC 8</option>
                  <option value="9">NC 9</option>
                  <option value="10">NC 10+</option>
                </select>

                <select
                  value={bestFamFilter}
                  onChange={(e) => setBestFamFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                >
                  <option value="">Toutes Familles / Milieux</option>
                  <option value="Humanoïdes">Humanoïdes</option>
                  <option value="Bêtes">Bêtes</option>
                  <option value="Morts-vivants">Morts-vivants</option>
                  <option value="Géants">Géants</option>
                  <option value="Créatures magiques">Créatures magiques</option>
                  <option value="Dragons">Dragons</option>
                  <option value="Élémentaires">Élémentaires</option>
                  <option value="Démons">Démons</option>
                </select>

                {(bestSearch || bestNcFilter || bestFamFilter || bestSourceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setBestSearch('');
                      setBestNcFilter('');
                      setBestFamFilter('');
                      setBestSourceFilter('all');
                    }}
                    className="px-2.5 py-1 text-xs text-[#9e907d] hover:text-[#ede3d1]"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* List of Monsters */}
            <div className="space-y-2.5">
              {fullBestiaire
                .filter((m) => {
                  const isTharneaMob = m.source === 'tharnea' || !!m.source?.toLowerCase().includes('tharnea');
                  if (bestSourceFilter === 'drs') return !isTharneaMob;
                  if (bestSourceFilter === 'tharnea') return isTharneaMob;
                  return true;
                })
                .filter((m) => {
                  const str = (m.n + m.att + m.traits + (m.fam || '') + (m.milieu || '')).toLowerCase();
                  const matchQ = str.includes(bestSearch.toLowerCase());
                  const matchNc =
                    !bestNcFilter ||
                    (bestNcFilter === '10' ? parseInt(m.nc) >= 10 : m.nc === bestNcFilter);
                  const matchFam = !bestFamFilter || m.fam === bestFamFilter;
                  return matchQ && matchNc && matchFam;
                })
                .map((m, idx) => {
                  const isTharnea = m.source === 'tharnea' || !!m.source?.toLowerCase().includes('tharnea');

                  return (
                    <details
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isTharnea
                          ? 'bg-[#1b1019] border-[#5e194f]'
                          : 'bg-[#181410] border-[#3d3023]'
                      }`}
                    >
                      <summary className="px-4 py-3 cursor-pointer hover:bg-[#231c15] flex items-center justify-between select-none">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {isTharnea && (
                            <span className="text-[10px] bg-[#5e194f] text-[#ffddfa] px-1.5 py-0.5 rounded font-mono font-bold border border-[#b8389e]/40">
                              #{m.num || idx + 1}
                            </span>
                          )}
                          <b className="font-serif-co text-base text-[#f3d48d]">{m.n}</b>
                          <span className="text-[10px] bg-[#382b1b] text-[#f3d48d] px-2 py-0.5 rounded font-bold border border-[#523d24]">
                            NC {m.nc}
                          </span>
                          {isTharnea && (
                            <span className="text-[10px] bg-[#3a1435] text-[#ffbdf4] px-1.5 py-0.2 rounded font-bold border border-[#78286a]">
                              Codex Obscure
                            </span>
                          )}
                          <span className="text-xs text-[#9e907d] hidden sm:inline">
                            {m.fam || m.milieu || ''} • PV : {m.pv} • DEF : {m.def} • Init : {m.init}
                          </span>
                        </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailItem({ type: 'monster', data: m });
                      }}
                      className="p-1.5 rounded bg-[#231c15] hover:bg-[#32271d] text-[#d4a84a] hover:text-[#fff] border border-[#3d3023] flex items-center gap-1 text-xs font-semibold"
                      title="Ouvrir la fiche complète en Pop-up"
                    >
                      <Info className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Détails</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addMonsterToCombat(m);
                      }}
                      className="px-3 py-1 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-bold text-[#f3d48d] rounded flex items-center gap-1"
                    >
                      <Swords className="w-3.5 h-3.5" /> Combat
                    </button>
                  </div>
                </summary>

                <div className="p-4 pt-1 border-t border-[#30251a] space-y-2 text-xs">
                  <div>
                    <b className="text-[#f3d48d]">Attaques :</b>{' '}
                    <span className="text-[#ede3d1]">{m.att}</span>
                  </div>
                  <div>
                    <b className="text-[#f3d48d]">Capacités &amp; Traits :</b>{' '}
                    <span className="text-[#ede3d1]">{m.traits}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-[#9e907d]">
                      Famille : {m.fam || 'Non classé'} • PV : {m.pv} • Défense : {m.def} •
                      Initiative : {m.init}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailItem({ type: 'monstre', data: m })}
                      className="px-3 py-1 bg-[#2e1d16] hover:bg-[#3d271e] text-[#f3d48d] rounded border border-[#d4a84a]/40 text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Fiche Pop-up
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    );
  })()}

      {/* ==================== 3.5 CODEX THARNÉA (EXTENSION INÉDITE) ==================== */}
      {activeTab === 'tharnea' && (() => {
        const candies = THARNEA_ARTIFACTS.filter((a) => a.cat === 'Bonbon Alchimique');
        const artifactsOnly = THARNEA_ARTIFACTS.filter((a) => a.cat !== 'Bonbon Alchimique');

        return (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#291338] via-[#1f102b] to-[#120a1c] border border-[#a855f7]/60 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">🔮</span>
                    <h3 className="font-serif-co text-xl font-bold text-[#f3e8ff]">
                      Codex de l'Obscure – Extension Tharnéa
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#4c1d6f] text-[#f5d0fe] border border-[#c084fc]/40">
                      Campagne Inédite
                    </span>
                    <span className="text-[10px] text-[#a855f7] italic font-mono">
                      Signé Doudou, F.P
                    </span>
                  </div>
                  <p className="text-xs text-[#d8b4fe] max-w-2xl">
                    Pack complet de créatures cauchemardesques, artefacts d'ombre, alchimies mystiques et lore militaire de Norvhal, 100% harmonisé avec le système Chroniques Oubliées Fantasy.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#170a24] px-3.5 py-2 rounded-lg border border-[#6b21a8]/60">
                  <div className="text-center px-2 border-r border-[#4c1d6f]">
                    <span className="block font-serif-co text-base font-bold text-[#f5d0fe]">{THARNEA_MONSTERS.length}</span>
                    <span className="text-[9px] text-[#c084fc] uppercase">Monstres</span>
                  </div>
                  <div className="text-center px-2 border-r border-[#4c1d6f]">
                    <span className="block font-serif-co text-base font-bold text-[#f5d0fe]">{artifactsOnly.length}</span>
                    <span className="text-[9px] text-[#c084fc] uppercase">Artéfacts</span>
                  </div>
                  <div className="text-center px-2">
                    <span className="block font-serif-co text-base font-bold text-[#f5d0fe]">{candies.length}</span>
                    <span className="text-[9px] text-[#c084fc] uppercase">Bonbons</span>
                  </div>
                </div>
              </div>

              {/* Sub navigation inside Tharnea tab */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#4c1d6f]/50 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => { setTharneaSubTab('monstres'); setTharneaSearch(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    tharneaSubTab === 'monstres'
                      ? 'bg-[#9333ea] text-white shadow-md'
                      : 'text-[#d8b4fe] bg-[#1a0c28] hover:bg-[#2c1445] border border-[#581c87]'
                  }`}
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>Bestiaire de l'Obscure ({THARNEA_MONSTERS.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTharneaSubTab('artefacts'); setTharneaSearch(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    tharneaSubTab === 'artefacts'
                      ? 'bg-[#9333ea] text-white shadow-md'
                      : 'text-[#d8b4fe] bg-[#1a0c28] hover:bg-[#2c1445] border border-[#581c87]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Artéfacts &amp; Reliques ({artifactsOnly.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTharneaSubTab('bonbons'); setTharneaSearch(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    tharneaSubTab === 'bonbons'
                      ? 'bg-[#9333ea] text-white shadow-md'
                      : 'text-[#d8b4fe] bg-[#1a0c28] hover:bg-[#2c1445] border border-[#581c87]'
                  }`}
                >
                  <span>🍬</span>
                  <span>Boîte à Bonbons ({candies.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTharneaSubTab('lore'); setTharneaSearch(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    tharneaSubTab === 'lore'
                      ? 'bg-[#9333ea] text-white shadow-md'
                      : 'text-[#d8b4fe] bg-[#1a0c28] hover:bg-[#2c1445] border border-[#581c87]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Armée &amp; Dossiers Boss</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1 : 61 MONSTRES DE THARNÉA */}
            {tharneaSubTab === 'monstres' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-[#181410] p-3 rounded-xl border border-[#3d3023]">
                  <Search className="w-3.5 h-3.5 text-[#9e907d]" />
                  <input
                    type="text"
                    placeholder="Filtrer par nom (#1 Rat, #2 Gobelin, #41 Bogart, #53 Malin...), milieu, pouvoir..."
                    value={tharneaSearch}
                    onChange={(e) => setTharneaSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#ede3d1] outline-none"
                  />
                  {tharneaSearch && (
                    <button
                      onClick={() => setTharneaSearch('')}
                      className="text-xs text-[#9e907d] hover:text-[#ede3d1]"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {THARNEA_MONSTERS
                    .filter((m) => {
                      const query = tharneaSearch.toLowerCase();
                      const numStr = m.num ? `#${m.num}` : '';
                      const fullStr = `${numStr} ${m.n} ${m.fam || ''} ${m.milieu || ''} ${m.att} ${m.traits} ${m.tactique || ''}`.toLowerCase();
                      return fullStr.includes(query);
                    })
                    .map((m) => {
                      return (
                        <div
                          key={m.num || m.n}
                          className="bg-[#181410] border border-[#581c87]/60 hover:border-[#a855f7] rounded-xl p-4 transition-all shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#2d1b3b] pb-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {m.num && (
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#3b1259] text-[#e9d5ff] border border-[#7e22ce]/60">
                                    #{m.num}
                                  </span>
                                )}
                                <h4 className="font-serif-co text-lg font-bold text-[#f3e8ff]">
                                  {m.n}
                                </h4>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#9c2a2b] text-white">
                                  NC {m.nc}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-[#1e1329] text-[#c084fc] border border-[#4c1d6f]">
                                  {m.fam || 'Abomination'}
                                </span>
                              </div>
                              <p className="text-xs text-[#9e907d] flex items-center gap-2 flex-wrap">
                                <span>📍 {m.milieu || 'Région de Tharnéa'}</span>
                                {m.taille && <span>• Taille : {m.taille}</span>}
                                {m.poids && <span>• Poids : {m.poids}</span>}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => addMonsterToCombat(m)}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#9333ea] to-[#7e22ce] hover:brightness-110 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                                title="Ajouter cette créature directement au tracker de combat"
                              >
                                <Swords className="w-3.5 h-3.5" /> Ajouter au Combat
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailItem({ type: 'monstre', data: m })}
                                className="px-2.5 py-1.5 bg-[#231530] hover:bg-[#341d47] border border-[#6b21a8] text-[#e9d5ff] text-xs font-semibold rounded-lg flex items-center gap-1"
                                title="Afficher la fiche complète officielle"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Fiche Pop-up
                              </button>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-[#120a1c] p-2 rounded-lg border border-[#3b1259]">
                              <span className="text-[10px] text-[#c084fc] font-bold uppercase block">Points de Vie</span>
                              <b className="font-serif-co text-base text-[#6fa85b]">{m.pv} PV</b>
                            </div>
                            <div className="bg-[#120a1c] p-2 rounded-lg border border-[#3b1259]">
                              <span className="text-[10px] text-[#c084fc] font-bold uppercase block">Défense / CA</span>
                              <b className="font-serif-co text-base text-[#7db5ff]">{m.def}</b>
                            </div>
                            <div className="bg-[#120a1c] p-2 rounded-lg border border-[#3b1259]">
                              <span className="text-[10px] text-[#c084fc] font-bold uppercase block">Initiative</span>
                              <b className="font-serif-co text-base text-[#f3d48d]">{m.init}</b>
                            </div>
                            <div className="bg-[#120a1c] p-2 rounded-lg border border-[#3b1259]">
                              <span className="text-[10px] text-[#c084fc] font-bold uppercase block">Attaque &amp; DM</span>
                              <b className="font-serif-co text-xs text-[#ede3d1] truncate block">{m.att}</b>
                            </div>
                          </div>

                          {/* Pouvoirs, Tactique & Butin */}
                          <div className="space-y-2 text-xs text-[#d8b4fe]">
                            {m.traits && (
                              <p className="italic text-[#c4b5fd] bg-[#1a0e26] p-2.5 rounded-lg border border-[#3b1259]">
                                {m.traits}
                              </p>
                            )}

                            {m.pouvoirs && m.pouvoirs.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold uppercase tracking-wider text-[11px] text-[#c084fc]">
                                  Capacités &amp; Pouvoirs :
                                </span>
                                {m.pouvoirs.map((p, pIdx) => (
                                  <div key={pIdx} className="text-xs bg-[#140b20] p-2 rounded border border-[#2e1047]">
                                    <b className="text-[#f5d0fe]">{p.n} : </b>
                                    <span className="text-[#e9d5ff]">{p.t}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {m.tactique && (
                              <div className="text-xs bg-[#1e102e] p-2 rounded border border-[#581c87]/60">
                                <b className="text-[#f5d0fe]">🧠 Tactique MJ : </b>
                                <span className="text-[#e9d5ff]">{m.tactique}</span>
                              </div>
                            )}

                            {m.butin && (
                              <div className="text-xs text-[#a7f3d0] bg-[#0c1f17] p-2 rounded border border-[#065f46]">
                                <b>🎁 Butin / Dépouille : </b>
                                <span>{m.butin}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2 : ARTÉFACTS & RELIQUES */}
            {tharneaSubTab === 'artefacts' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-[#181410] p-3 rounded-xl border border-[#3d3023]">
                  <Search className="w-3.5 h-3.5 text-[#9e907d]" />
                  <input
                    type="text"
                    placeholder="Rechercher une relique (Lame, Anneau, Bâton, Masque, Pendentif...)..."
                    value={tharneaSearch}
                    onChange={(e) => setTharneaSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#ede3d1] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artifactsOnly
                    .filter((a) => {
                      const str = `${a.n} ${a.cat || ''} ${a.desc || ''} ${a.props || ''}`.toLowerCase();
                      return str.includes(tharneaSearch.toLowerCase());
                    })
                    .map((a, idx) => {
                      return (
                        <div
                          key={a.n || idx}
                          onClick={() => setDetailItem({ type: 'equipement', data: a })}
                          className="cursor-pointer bg-[#181410] hover:bg-[#20152b] border border-[#581c87]/60 hover:border-[#a855f7] rounded-xl p-4 transition-all shadow-sm space-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <b className="font-serif-co text-base text-[#f5d0fe]">{a.n}</b>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4c1d6f] text-[#f5d0fe] border border-[#7e22ce]/60 shrink-0">
                                {a.cat || 'Artéfact'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#9e907d]">
                              {a.prix && <span>💰 Prix estimé : <b className="text-[#f3d48d]">{a.prix}</b></span>}
                              {a.dm && <span>⚔️ Dégâts : <b className="text-white">{a.dm}</b></span>}
                              {a.def && <span>🛡️ Défense : <b className="text-white">{a.def}</b></span>}
                            </div>

                            <p className="text-xs text-[#d8b4fe] line-clamp-3">
                              {a.desc || a.props}
                            </p>

                            {a.effetSecondaire && (
                              <p className="text-[11px] text-[#fca5a5] bg-[#2a1315] p-1.5 rounded border border-[#7f1d1d]">
                                ⚠️ <b>Contrecoup :</b> {a.effetSecondaire}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#3b1259] flex items-center justify-between text-[11px] text-[#c084fc]">
                            <span>Cliquer pour la fiche détaillée</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SUB-TAB 3 : BOÎTE À BONBONS */}
            {tharneaSubTab === 'bonbons' && (
              <div className="space-y-3">
                <div className="bg-[#24132b] p-4 rounded-xl border border-[#7e22ce]/60 space-y-2">
                  <h4 className="font-serif-co text-base font-bold text-[#f5d0fe] flex items-center gap-2">
                    <span>🍬</span> Les Bonbons Alchimiques du Codex de l'Obscure
                  </h4>
                  <p className="text-xs text-[#d8b4fe]">
                    Chaque bonbon est une confiserie imprégnée d'essences surnaturelles. Mâcher ou avaler un bonbon libère un effet instantané puissant ou un modificateur étrange sur le joueur !
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {candies.map((c, idx) => {
                    return (
                      <div
                        key={c.n || idx}
                        onClick={() => setDetailItem({ type: 'equipement', data: c })}
                        className="cursor-pointer bg-[#181410] hover:bg-[#251533] border border-[#a855f7]/40 hover:border-[#c084fc] rounded-xl p-4 transition-all shadow-sm space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <b className="font-serif-co text-sm text-[#f5d0fe]">{c.n}</b>
                            <span className="text-xs">🍬</span>
                          </div>
                          <span className="text-[10px] text-[#c084fc] block mb-2 font-mono">
                            {c.prix || 'Rare confiserie'}
                          </span>
                          <p className="text-xs text-[#ede3d1] line-clamp-3">
                            {c.desc}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#3b1259] flex items-center justify-between text-[10px] text-[#c084fc]">
                          <span>Détails &amp; Consommation</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 4 : LORE, ARMÉE & DOSSIERS BOSS */}
            {tharneaSubTab === 'lore' && (
              <div className="space-y-4">
                <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
                  <h4 className="font-serif-co text-base font-bold text-[#f3d48d] flex items-center gap-2">
                    <span>👑</span> Hiérarchie Militaire de l'Armée du Roi
                  </h4>
                  <p className="text-xs text-[#9e907d]">
                    Documentation officielle sur l'organisation des forces armées du royaume de Norvhal et les factions en guerre.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#231c15] p-2.5 rounded-lg border border-[#3d3023]">
                      <b className="text-[#f3d48d] block mb-1">Commandement Suprême</b>
                      <p className="text-[11px] text-[#9e907d]">
                        Le Roi et ses Généraux de Haute-Cour. Décident des grandes purges.
                      </p>
                    </div>
                    <div className="bg-[#231c15] p-2.5 rounded-lg border border-[#3d3023]">
                      <b className="text-[#7db5ff] block mb-1">Garde d'Élite &amp; Ours Vert</b>
                      <p className="text-[11px] text-[#9e907d]">
                        Colosses armurés (NC 4) affectés à la protection des reliques et des hauts dignitaires.
                      </p>
                    </div>
                    <div className="bg-[#231c15] p-2.5 rounded-lg border border-[#3d3023]">
                      <b className="text-[#ede3d1] block mb-1">Infanterie Royale &amp; Soldats</b>
                      <p className="text-[11px] text-[#9e907d]">
                        Ligne de front (NC 2) maniant l'épée longue et le grand pavois.
                      </p>
                    </div>
                    <div className="bg-[#231c15] p-2.5 rounded-lg border border-[#3d3023]">
                      <b className="text-[#cf5544] block mb-1">Bandits &amp; Maître des Pillards</b>
                      <p className="text-[11px] text-[#9e907d]">
                        Mercenaires sans foi ni loi opérant dans les forêts de Tharnéa.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#181410] border border-[#581c87]/60 rounded-xl p-4 space-y-3">
                  <h4 className="font-serif-co text-base font-bold text-[#f5d0fe] flex items-center gap-2">
                    <span>📜</span> Dossiers Majeurs &amp; Antagonistes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#1c0f29] p-3 rounded-lg border border-[#4c1d6f] space-y-1">
                      <b className="text-[#f3d48d] text-sm">Varn le Protecteur (Allié Majeur)</b>
                      <p className="text-[#d8b4fe]">
                        Guerrier vétéran dévoué au sauvetage des rescapés. PV: 45, DEF: 18, Épée bâtarde de vérité 2d6+4.
                      </p>
                    </div>
                    <div className="bg-[#1c0f29] p-3 rounded-lg border border-[#4c1d6f] space-y-1">
                      <b className="text-[#ff9d9d] text-sm">Le Malin (Boss Ultime de l'Obscure)</b>
                      <p className="text-[#d8b4fe]">
                        Entité tentatrice et corrompue (NC 12). PV: 110, DEF: 21, Attaque三重 de ténèbres et aura d'angoisse.
                      </p>
                    </div>
                    <div className="bg-[#1c0f29] p-3 rounded-lg border border-[#4c1d6f] space-y-1">
                      <b className="text-[#ff9d9d] text-sm">Tom Vador Ombrage (Antagoniste)</b>
                      <p className="text-[#d8b4fe]">
                        Seigneur de guerre renégat manipulé par l'Ombre. PV: 75, DEF: 19, Sabre noir 2d8+5.
                      </p>
                    </div>
                    <div className="bg-[#1c0f29] p-3 rounded-lg border border-[#4c1d6f] space-y-1">
                      <b className="text-[#a7f3d0] text-sm">Téo le Veilleur (Guide Mystique)</b>
                      <p className="text-[#d8b4fe]">
                        Érudit silencieux et éclaireur de l'Ombre. Connaît les passages secrets de Tharnéa et les rituels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================== 4. ÉQUIPEMENTS (DRS + THARNÉA) ==================== */}
      {activeTab === 'equipements' && (() => {
        const fullEquipements = isTharneaActive ? [...THARNEA_ARTIFACTS, ...EQUIPEMENTS] : EQUIPEMENTS;

        return (
          <div className="space-y-4">
            <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                    Catalogue des Biens, Équipements {isTharneaActive ? '& Artéfacts' : ''}
                  </h3>
                  <span className="text-xs text-[#9e907d]">
                    Objets répertoriés : <b className="text-[#ede3d1]">{fullEquipements.length}</b> (DRS: {EQUIPEMENTS.length}{isTharneaActive ? ` · Tharnéa: ${THARNEA_ARTIFACTS.length}` : ''})
                  </span>
                </div>

                {isTharneaActive && (
                  <div className="flex items-center gap-1 bg-[#120f0c] p-1 rounded-lg border border-[#3d3023]">
                    <button
                      type="button"
                      onClick={() => setEqSourceFilter('all')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        eqSourceFilter === 'all'
                          ? 'bg-[#d4a84a] text-black shadow-xs'
                          : 'text-[#9e907d] hover:text-[#ede3d1]'
                      }`}
                    >
                      Tous ({fullEquipements.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEqSourceFilter('drs')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        eqSourceFilter === 'drs'
                          ? 'bg-[#d4a84a] text-black shadow-xs'
                          : 'text-[#9e907d] hover:text-[#ede3d1]'
                      }`}
                    >
                      DRS Officiel ({EQUIPEMENTS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEqSourceFilter('tharnea')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                        eqSourceFilter === 'tharnea'
                          ? 'bg-[#8a2d75] text-white shadow-xs'
                          : 'text-[#cca3c7] hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-[#ff8fed]" />
                      <span>Tharnéa ({THARNEA_ARTIFACTS.length})</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30251a]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher arme, armure, tente, artéfact, bonbon..."
                    value={eqSearch}
                    onChange={(e) => setEqSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                  />
                </div>

                <select
                  value={eqCatFilter}
                  onChange={(e) => setEqCatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                >
                  <option value="">Toutes les catégories</option>
                  {isTharneaActive && (
                    <>
                      <option value="Artéfact Majeur">Artéfacts Majeurs</option>
                      <option value="Bonbon Alchimique">Bonbons Alchimiques</option>
                      <option value="Talisman & Relique">Talismans &amp; Reliques</option>
                      <option disabled>──────────</option>
                    </>
                  )}
                  <option value="Armes Contact">Armes Contact</option>
                  <option value="Armes Distance">Armes Distance</option>
                  <option value="Armes Poudre">Armes Poudre</option>
                  <option value="Armures">Armures</option>
                  <option value="Boucliers">Boucliers</option>
                  <option value="Campement">Campement &amp; Tentes</option>
                  <option value="Aventure">Matériel d'aventure</option>
                  <option value="Auberge">Auberge &amp; Vivres</option>
                  <option value="Logement">Logement</option>
                  <option value="Montures">Montures</option>
                  <option value="Véhicules">Véhicules</option>
                  <option value="Immobilier">Immobilier</option>
                </select>

                {(eqSearch || eqCatFilter || eqSourceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setEqSearch('');
                      setEqCatFilter('');
                      setEqSourceFilter('all');
                    }}
                    className="px-2.5 py-1 text-xs text-[#9e907d] hover:text-[#ede3d1]"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#181410] border border-[#3d3023] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#3d3023] bg-[#120f0c] text-[#f3d48d]">
                    <th className="p-3">Nom</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Prix</th>
                    <th className="p-3">DM / DEF / Propriétés &amp; Effets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#261f18]">
                  {fullEquipements
                    .filter((it) => {
                      const isTharneaItem = it.source === 'tharnea' || !!it.source?.toLowerCase().includes('tharnea');
                      if (eqSourceFilter === 'drs') return !isTharneaItem;
                      if (eqSourceFilter === 'tharnea') return isTharneaItem;
                      return true;
                    })
                    .filter((it) => {
                      const matchQ = (
                        it.n +
                        (it.cat || '') +
                        (it.desc || '') +
                        (it.prix || '') +
                        (it.effetSecondaire || '')
                      )
                        .toLowerCase()
                        .includes(eqSearch.toLowerCase());
                      const matchCat = !eqCatFilter || it.cat?.includes(eqCatFilter);
                      return matchQ && matchCat;
                    })
                    .map((it, idx) => {
                      const isTharnea = it.source === 'tharnea' || !!it.source?.toLowerCase().includes('tharnea');

                      return (
                        <tr
                          key={idx}
                          onClick={() =>
                            setDetailItem({
                              type: 'equipment',
                              data: it,
                            })
                          }
                          className={`transition-colors cursor-pointer group ${
                            isTharnea ? 'hover:bg-[#281324] bg-[#180e16]/40' : 'hover:bg-[#2e2318]'
                          }`}
                          title="Cliquez pour ouvrir la fiche détaillée en Pop-up"
                        >
                          <td className="p-3 font-semibold text-[#ede3d1] group-hover:text-[#f3d48d]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {it.couleur && (
                                <span
                                  className="w-3 h-3 rounded-full border border-white/50 shrink-0"
                                  style={{ backgroundColor: it.couleur }}
                                />
                              )}
                              <span>{it.n}</span>
                              {isTharnea && (
                                <span className="text-[9px] bg-[#5e194f] text-[#ffddfa] px-1 rounded font-bold">
                                  Tharnéa
                                </span>
                              )}
                              <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#d4a84a] transition-opacity" />
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                isTharnea
                                  ? 'bg-[#3b1235] text-[#ffbdf4] border border-[#78286a]'
                                  : 'bg-[#1e2f47] text-[#b0d7ff]'
                              }`}
                            >
                              {it.cat || '-'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#f3d48d]">
                            {it.prix || '-'}
                          </td>
                          <td className="p-3 text-[#9e907d]">
                            {it.dm && <b className="text-[#ede3d1]">DM: {it.dm} • </b>}
                            {it.def && <b className="text-[#6fa85b]">+{it.def} DEF • </b>}
                            <span>{it.desc}</span>
                            {it.effetSecondaire && (
                              <span className="block text-[11px] text-[#ff9fc8] italic mt-0.5">
                                ⚠️ {it.effetSecondaire}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ==================== 5. RÈGLES & ÉTATS ==================== */}
      {activeTab === 'regles' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                  Règles du DRS &amp; États Préjudiciables
                </h3>
                <span className="text-xs text-[#9e907d]">
                  13 États officiels &amp; 29 Chapitres de règles complets
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30251a]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher dans les règles, agonie, couvert, saut, poison..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <select
                value={regCatFilter}
                onChange={(e) => setRegCatFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              >
                <option value="">Toutes les sections</option>
                <option value="etats">États préjudiciables uniquement</option>
                <option value="Création">Création de perso</option>
                <option value="Actions">Actions &amp; Tests</option>
                <option value="Combat">Combat &amp; Blessures</option>
                <option value="Aventure">Aventure &amp; Exploration</option>
                <option value="Règles Avancées">Règles Avancées (PC, PM, Prestige)</option>
              </select>

              {(regSearch || regCatFilter) && (
                <button
                  onClick={() => {
                    setRegSearch('');
                    setRegCatFilter('');
                  }}
                  className="px-2.5 py-1 text-xs text-[#9e907d] hover:text-[#ede3d1]"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* États Section */}
          {(!regCatFilter || regCatFilter === 'etats') && (
            <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
              <h4 className="font-serif-co text-base font-bold text-[#f3d48d]">
                13 États Préjudiciables
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {ETATS.filter((e) =>
                  (e.n + e.t).toLowerCase().includes(regSearch.toLowerCase())
                ).map((e, idx) => (
                  <div
                    key={idx}
                    onClick={() => setDetailItem({ type: 'state', data: e })}
                    className="p-3 bg-[#231c15] hover:bg-[#2d2319] border border-[#3d3023] hover:border-[#d4a84a] rounded-lg text-xs space-y-1 cursor-pointer transition-colors group"
                    title="Cliquez pour ouvrir la fiche de l'état"
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-[#f3d48d] text-sm group-hover:text-[#ffe099] flex items-center gap-1.5">
                        {e.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#d4a84a]" />
                      </b>
                      <span className="text-[10px] bg-[#3a1d1d] text-[#ffb8b8] px-1.5 py-0.2 rounded font-bold">
                        État
                      </span>
                    </div>
                    <p className="text-[#ede3d1] leading-relaxed line-clamp-3">{e.t}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Règles Section */}
          {regCatFilter !== 'etats' && (
            <div className="space-y-2.5">
              {REGLES.filter((r) => {
                const matchQ = (r.t + r.c + (r.cat || '')).toLowerCase().includes(regSearch.toLowerCase());
                const matchCat = !regCatFilter || r.cat === regCatFilter;
                return matchQ && matchCat;
              }).map((r, idx) => (
                <details
                  key={idx}
                  open
                  className="bg-[#181410] border border-[#3d3023] rounded-xl overflow-hidden"
                >
                  <summary className="px-4 py-3 cursor-pointer hover:bg-[#231c15] flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      <b className="font-serif-co text-sm text-[#f3d48d]">{r.t}</b>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailItem({ type: 'rule', data: r });
                        }}
                        className="p-1 rounded text-[#9e907d] hover:text-[#d4a84a]"
                        title="Ouvrir la règle en Pop-up"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#d4a84a]" />
                      </button>
                    </div>
                    <span className="text-[10px] bg-[#382b1b] text-[#f3d48d] px-2 py-0.5 rounded font-bold border border-[#523d24]">
                      {r.cat}
                    </span>
                  </summary>
                  <div className="p-4 pt-1 border-t border-[#30251a] text-xs text-[#ede3d1] leading-relaxed">
                    {r.c}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 6. RACES ==================== */}
      {activeTab === 'races' && (
        <div className="space-y-3">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4">
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d] mb-1">
              Races Jouables du DRS
            </h3>
            <p className="text-xs text-[#9e907d]">
              Guide des ascendances et modificateurs raciaux officiels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RACES.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-[#181410] border border-[#3d3023] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <b className="font-serif-co text-base text-[#f3d48d]">{r.n}</b>
                  <span className="text-xs font-mono font-bold text-[#6fa85b] bg-[#122410] px-2 py-0.5 rounded border border-[#274721]">
                    {r.t}
                  </span>
                </div>
                <p className="text-xs text-[#ede3d1]">{r.d}</p>
                <div className="text-[11px] text-[#9e907d] italic">
                  Tempérament : {r.traits}
                </div>
                <div className="pt-2 border-t border-[#30251a] text-xs text-[#ede3d1] space-y-1">
                  {r.cap.map((c, i) => (
                    <div key={i}>
                      <b className="text-[#d4a84a]">• {c.n} :</b> {c.t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 7. PROFILS (CLASSES) ==================== */}
      {activeTab === 'profils' && (
        <div className="space-y-3">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4">
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d] mb-1">
              14 Profils &amp; Vocations Martiales
            </h3>
            <p className="text-xs text-[#9e907d]">
              Dé de vie, accès à la magie, autorisations d'armes et d'armures de chaque profil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROFILS.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-[#181410] border border-[#3d3023] rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <b className="font-serif-co text-base text-[#f3d48d]">{p.n}</b>
                  <span className="text-xs font-mono font-bold text-[#cbafff] bg-[#291b3b] px-2 py-0.5 rounded border border-[#492d6e]">
                    Dé de vie : d{p.dv} {p.mag ? `• Magie ${p.mag}` : ''}
                  </span>
                </div>
                <p className="text-xs text-[#ede3d1] italic">« {p.traits} »</p>
                <div className="text-xs text-[#9e907d] space-y-1">
                  <div>
                    <b className="text-[#ede3d1]">Armes &amp; armures autorisées :</b> {p.ar}
                  </div>
                  <div>
                    <b className="text-[#ede3d1]">Équipement de départ :</b> {p.eq}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 8. VOIES & CAPACITÉS ==================== */}
      {activeTab === 'voies' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                  Encyclopédie des 70 Voies Héroïques (350 Rangs)
                </h3>
                <p className="text-xs text-[#9e907d]">
                  Consultez l'arbre complet des voies par profil ou effectuez une recherche globale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#30251a]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une voie ou un pouvoir..."
                  value={voieSearch}
                  onChange={(e) => setVoieSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#9e907d] whitespace-nowrap">Profil :</label>
                <select
                  value={voiesProfilFilter}
                  onChange={(e) => setVoiesProfilFilter(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none cursor-pointer"
                >
                  <option value="all">Tous les profils (70 voies)</option>
                  {PROFILS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.n}
                    </option>
                  ))}
                  <option value="race">Voies Raciales</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {Object.entries(VOIES_CATALOG)
              .filter(([k, v]) => {
                if (voiesProfilFilter !== 'all') {
                  if (voiesProfilFilter === 'race') return v.profil.startsWith('race:');
                  return v.profil.toLowerCase() === voiesProfilFilter.toLowerCase();
                }
                return true;
              })
              .filter(([k, v]) =>
                (v.nom + v.profil + v.r.map((r) => r.n + r.t).join(' ')).toLowerCase().includes(voieSearch.toLowerCase())
              )
              .map(([wKey, way]) => (
                <details
                  key={wKey}
                  className="bg-[#181410] border border-[#3d3023] rounded-xl overflow-hidden"
                >
                  <summary className="px-4 py-3 cursor-pointer hover:bg-[#231c15] flex items-center justify-between select-none font-serif-co font-bold text-[#f3d48d]">
                    <span>
                      {way.nom}{' '}
                      <span className="text-xs font-sans text-[#9e907d] font-normal">
                        ({way.profil})
                      </span>
                    </span>
                    <span className="text-xs text-[#9e907d] font-sans font-normal">
                      {way.r.length} rangs
                    </span>
                  </summary>

                  <div className="p-4 pt-1 border-t border-[#30251a] space-y-2">
                    {way.r.map((rk, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setDetailItem({
                            type: 'wayRank',
                            data: {
                              wayName: way.nom,
                              className: way.profil,
                              profile: way.profil,
                              rankNum: idx + 1,
                              n: rk.n,
                              t: rk.t,
                              L: rk.L,
                              S: rk.S,
                              rank: {
                                rang: idx + 1,
                                nom: rk.n,
                                description: rk.t,
                                isLimited: rk.L,
                                isSpell: rk.S,
                              },
                            },
                          })
                        }
                        className="p-2.5 bg-[#231c15] hover:bg-[#2d2319] border border-[#3d3023] hover:border-[#d4a84a] rounded-lg text-xs cursor-pointer transition-colors group"
                        title="Cliquez pour ouvrir la fiche détaillée du rang"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <b className="text-[#f3d48d] group-hover:text-[#ffe099] flex items-center gap-1.5">
                            Rang {idx + 1} : {rk.n}{' '}
                            <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#d4a84a]" />
                          </b>
                          <div className="flex items-center gap-1">
                            {rk.L ? (
                              <span className="text-[9px] bg-[#4a1c1d] text-[#ffb8b8] px-1.5 py-0.2 rounded font-bold">
                                Limitée
                              </span>
                            ) : null}
                            {rk.S ? (
                              <span className="text-[9px] bg-[#1e2f47] text-[#b0d7ff] px-1.5 py-0.2 rounded font-bold">
                                Sort
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-[#ede3d1]">{rk.t}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </div>
      )}

      {/* ==================== 9. GRIMOIRE DRS ==================== */}
      {activeTab === 'grimoire' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <h3 className="font-serif-co text-lg font-bold text-[#cbafff]">
              Grimoire Global du DRS
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9e907d] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher sortilège, dégâts, rayon, projectile..."
                value={grimSearch}
                onChange={(e) => setGrimSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {SORTS_CATALOG.filter((s) =>
              (s.n + s.t + (s.voie || '')).toLowerCase().includes(grimSearch.toLowerCase())
            ).map((s, idx) => (
              <div
                key={idx}
                onClick={() => setDetailItem({ type: 'spell', data: s })}
                className="p-3.5 bg-[#181410] hover:bg-[#201824] border-l-4 border-l-[#3a69a1] border border-[#3d3023] hover:border-[#cbafff] rounded-lg space-y-1 cursor-pointer transition-colors group"
                title="Cliquez pour ouvrir la fiche du sort en Pop-up"
              >
                <div className="flex items-center justify-between">
                  <b className="text-[#cbafff] group-hover:text-[#e4d4ff] text-sm flex items-center gap-1.5">
                    {s.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#cbafff]" />
                  </b>
                  <span className="text-[10px] bg-[#291b3b] text-[#dccbff] px-2 py-0.5 rounded font-bold border border-[#492d6e]">
                    Rang {s.rang} • {s.portee}
                  </span>
                </div>
                <div className="text-[11px] text-[#9e907d]">
                  Voie : {s.voie || 'Magie'} • Durée : {s.duree || 'Instantané'}
                </div>
                <p className="text-xs text-[#ede3d1]">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL COMBATTANT SUR MESURE ==================== */}
      {isAddCombatantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#181410] border border-[#d4a84a] rounded-xl w-full max-w-md shadow-2xl p-5 space-y-3">
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
              Ajouter un Combattant à la Piste
            </h3>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Nom du combattant *
              </label>
              <input
                type="text"
                placeholder="Ex: Chef Bandit, Renfort Garde..."
                value={newCombatantName}
                onChange={(e) => setNewCombatantName(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  PV Max
                </label>
                <input
                  type="number"
                  min="1"
                  value={newCombatantHp}
                  onChange={(e) => setNewCombatantHp(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] text-center font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Défense
                </label>
                <input
                  type="number"
                  min="5"
                  value={newCombatantDef}
                  onChange={(e) => setNewCombatantDef(parseInt(e.target.value) || 10)}
                  className="w-full px-2 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] text-center font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Base Init
                </label>
                <input
                  type="number"
                  value={newCombatantInit}
                  onChange={(e) => setNewCombatantInit(parseInt(e.target.value) || 10)}
                  className="w-full px-2 py-1.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Type
              </label>
              <select
                value={newCombatantIsPj ? '1' : '0'}
                onChange={(e) => setNewCombatantIsPj(e.target.value === '1')}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              >
                <option value="0">Monstre / Adversaire / PNJ</option>
                <option value="1">Personnage Joueur (PJ)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Attaques &amp; Notes
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Épée +4 (1d8+2) • Rage de berserk..."
                value={newCombatantNotes}
                onChange={(e) => setNewCombatantNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddCombatantOpen(false)}
                className="px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#ede3d1] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCustomCombatant}
                className="px-5 py-2 bg-[#d4a84a] hover:bg-[#e0b555] text-black font-bold text-xs rounded-lg shadow-md"
              >
                Ajouter au Combat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PNJ CREATOR MODAL (MJ) ==================== */}
      <PnjCreatorModal
        isOpen={isPnjCreatorOpen}
        onClose={() => setIsPnjCreatorOpen(false)}
        onSavePnj={handleSavePnj}
      />

      {/* ==================== UNIVERSAL POP-UP DETAIL MODAL ==================== */}
      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAction={(action, data) => {
          if (action === 'send_to_combat') {
            addMonsterToCombat(data);
          }
        }}
      />

      {/* Discreet Signature */}
      <div className="text-right text-[10px] text-[#4d3d2e] font-mono tracking-wider pt-2 select-none">
        Doudou, F.P
      </div>
    </div>
  );
};
