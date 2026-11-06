import React, { useState } from 'react';
import {
  Printer,
  ChevronUp,
  Sparkles,
  Zap,
  Plus,
  Minus,
  Trash2,
  BookOpen,
  Package,
  Shield,
  Swords,
  Scroll,
  HelpCircle,
  FileDown,
  FileUp,
  X,
  Check,
  Search,
  Info,
  ExternalLink,
  Download,
} from 'lucide-react';
import { DetailModal, DetailItem } from '../DetailModal';
import { StateBadgeList } from '../common/StateBadgeList';
import { BbeOfficialSheetModal } from './BbeOfficialSheetModal';
import { THARNEA_ARTIFACTS } from '../../data/tharneaSupplement';
import {
  ARMES_CATALOG,
  ARMURES_CATALOG,
  BIENS_CATALOG,
  CARAC_LIST,
  EQUIPEMENTS,
  PROFILS,
  RACES,
  SORTS_CATALOG,
  VOIES_CATALOG,
  calcStats,
  getMod,
} from '../../data/coDatabase';
import {
  CaracName,
  Character,
  Equipment,
  InventoryItem,
  ProfilData,
  RaceData,
  SpellItem,
  WeaponItem,
} from '../../types/chroniques';

interface PjSheetProps {
  pj: Character | null;
  onUpdatePj: (updated: Character) => void;
  onOpenWizard: () => void;
  onSendToMjTable: () => void;
  isTharneaActive?: boolean;
}

export const PjSheet: React.FC<PjSheetProps> = ({
  pj,
  onUpdatePj,
  onOpenWizard,
  onSendToMjTable,
  isTharneaActive = true,
}) => {
  const [activeTab, setActiveTab] = useState<'fiche' | 'voies' | 'sorts' | 'sac'>('fiche');

  // Drawer & Modals state
  const [catalogDrawer, setCatalogDrawer] = useState<'armes' | 'armures' | 'biens' | 'sorts' | 'tharnea' | null>(null);
  const [catalogQuery, setCatalogQuery] = useState<string>('');
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState<boolean>(false);
  const [levelUpDiceResult, setLevelUpDiceResult] = useState<number>(4);
  const [levelUpMethod, setLevelUpMethod] = useState<'roll' | 'average'>('average');
  const [isBbePrintOpen, setIsBbePrintOpen] = useState<boolean>(false);
  const [selectedWayProfil, setSelectedWayProfil] = useState<string>('all');
  const [waySearchQuery, setWaySearchQuery] = useState<string>('');
  const [isCustomSpellOpen, setIsCustomSpellOpen] = useState<boolean>(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState<boolean>(false);

  // Custom Item Form state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemIsConsumable, setCustomItemIsConsumable] = useState(false);
  const [customItemNote, setCustomItemNote] = useState('');

  // Custom Spell Form state
  const [customSpellName, setCustomSpellName] = useState('');
  const [customSpellRank, setCustomSpellRank] = useState(1);
  const [customSpellRange, setCustomSpellRange] = useState('30 m');
  const [customSpellDesc, setCustomSpellDesc] = useState('');

  if (!pj) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-[#181410] border border-[#d4a84a] rounded-xl p-8 shadow-2xl space-y-4">
          <Shield className="w-12 h-12 text-[#d4a84a] mx-auto opacity-80" />
          <h2 className="font-serif-co text-2xl font-bold text-[#f3d48d]">
            Compagnon de Table – Chroniques Oubliées
          </h2>
          <p className="text-sm text-[#9e907d] max-w-md mx-auto">
            Aucun personnage n'est sélectionné. Vous pouvez créer un nouveau héros grâce à
            l'assistant officiel en 7 étapes ou importer une fiche sauvegardée.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenWizard}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#d4a84a] to-[#ab8230] text-[#1a1208] font-bold text-sm shadow-md flex items-center gap-2 hover:brightness-110"
            >
              <Sparkles className="w-4 h-4" /> Créer un Héros (7 étapes)
            </button>
            <label className="px-5 py-2.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] font-semibold text-sm cursor-pointer flex items-center gap-2">
              <FileUp className="w-4 h-4" /> Charger une Fiche (JSON)
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleImportJson(e)}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  const st = calcStats(pj);
  const pr: ProfilData = PROFILS.find((x) => x.id === pj.profil) || {
    id: pj.profil,
    n: pj.profil,
    dv: 8,
    traits: '',
    eq: '',
    ar: '',
  };
  const rc: RaceData = RACES.find((x) => x.id === pj.race) || {
    id: pj.race,
    n: pj.race,
    d: '',
    t: '',
    traits: '',
    cap: [],
    b: {},
  };

  // Health Stats
  const hpMax = st ? st.hpMax : 10;
  const hpPct = Math.max(0, Math.min(100, Math.round((100 * pj.hp) / Math.max(1, hpMax))));
  const hpColor = hpPct > 50 ? '#6fa85b' : hpPct > 25 ? '#c97d32' : '#cf5544';

  // Mana Stats
  const pmCurrent = pj.pm !== undefined && pj.pm !== null ? pj.pm : (st ? st.pmMax : 0);
  const pmMax = st ? st.pmMax : 0;
  const pmPct = pmMax > 0 ? Math.max(0, Math.min(100, Math.round((100 * pmCurrent) / pmMax))) : 0;

  // Spells (from ways ranks + custom)
  const allSpells: SpellItem[] = [];
  pj.caps.forEach((c) => {
    const v = VOIES_CATALOG[c.wayKey];
    if (v && v.r && v.r[c.rank - 1]) {
      const rk = v.r[c.rank - 1];
      if (rk.S) {
        allSpells.push({
          id: `${c.wayKey}_${c.rank}`,
          n: rk.n,
          voie: v.nom,
          rang: c.rank,
          portee: '30 m',
          t: rk.t,
          L: rk.L,
        });
      }
    }
  });
  if (pj.customSorts) {
    pj.customSorts.forEach((cs, i) => {
      allSpells.push({
        id: `cust_${i}`,
        n: cs.n,
        voie: cs.voie || 'Personnalisé',
        rang: cs.rang || 1,
        portee: cs.portee || 'Contact',
        t: cs.t,
        L: cs.L || 1,
      });
    });
  }

  // Modifiers update helper
  const updateCarac = (c: CaracName, val: number) => {
    const rb = pj.rb[c] || 0;
    const newBase = val - rb;
    onUpdatePj({
      ...pj,
      base: {
        ...pj.base,
        [c]: newBase,
      },
    });
  };

  // Health helpers
  const alterHp = (delta: number) => {
    const newHp = delta === 9999 ? hpMax : Math.max(0, Math.min(hpMax, pj.hp + delta));
    onUpdatePj({ ...pj, hp: newHp });
  };

  const setHpDirect = (val: number) => {
    onUpdatePj({ ...pj, hp: Math.max(0, Math.min(hpMax, val)) });
  };

  const setHpMaxDirect = (val: number) => {
    const valMax = Math.max(1, val);
    onUpdatePj({
      ...pj,
      hpMaxManual: valMax,
      hp: Math.min(pj.hp, valMax),
    });
  };

  // Prejudicial States helper
  const handleToggleState = (stateName: string) => {
    const current = pj.etats || [];
    const exists = current.includes(stateName);
    const newStates = exists
      ? current.filter((s) => s !== stateName)
      : [...current, stateName];
    onUpdatePj({ ...pj, etats: newStates });
  };

  // Mana helpers
  const alterPm = (delta: number) => {
    const current = pj.pm ?? pmMax;
    const newPm = delta === 9999 ? pmMax : Math.max(0, Math.min(pmMax, current + delta));
    onUpdatePj({ ...pj, pm: newPm });
  };

  const setPmDirect = (val: number) => {
    onUpdatePj({ ...pj, pm: Math.max(0, Math.min(pmMax, val)) });
  };

  const setPmMaxDirect = (val: number) => {
    const valMax = Math.max(0, val);
    onUpdatePj({
      ...pj,
      pmMaxManual: valMax,
      pm: Math.min(pj.pm ?? 0, valMax),
    });
  };

  const castSpell = (spell: SpellItem) => {
    const cost = spell.rang || 1;
    const current = pj.pm ?? pmMax;
    if (current < cost) {
      alert(`Pas assez de Points de Mana pour lancer ${spell.n} ! (Requis: ${cost} PM, Actuel: ${current} PM)`);
      return;
    }
    const remaining = current - cost;
    onUpdatePj({ ...pj, pm: remaining });
    alert(`✨ ${spell.n} lancé avec succès ! (-${cost} PM, restant : ${remaining} PM)`);
  };

  // Level Up
  const handleLevelUpConfirm = () => {
    const modCon = st ? st.m.CON : 0;
    const avgRoll = Math.floor(pr.dv / 2) + 1;
    const effectiveRoll = levelUpMethod === 'average' ? avgRoll : levelUpDiceResult;
    const gainedHp = Math.max(1, effectiveRoll + modCon);
    const newLevel = pj.level + 1;
    const newHpMaxAuto = (pj.hpMaxAuto || pj.hpBase || 10) + gainedHp;
    const newHp = pj.hp + gainedHp;
    const newPts = (pj.ptsCap || 0) + 2;

    // PM calculation based on official COF rules
    const isProfaneMajor = ['magicien', 'ensorceleur', 'necromancien'].includes(pj.profil);
    const isDivineOrHybrid = ['pretre', 'druide', 'barde', 'forgesort'].includes(pj.profil);
    const gainedPm = isProfaneMajor ? 2 : isDivineOrHybrid ? 1 : 0;
    const newPm = pj.pm !== undefined && pj.pm !== null ? pj.pm + gainedPm : undefined;

    onUpdatePj({
      ...pj,
      level: newLevel,
      hpMaxAuto: newHpMaxAuto,
      hpMaxManual: pj.hpMaxManual ? pj.hpMaxManual + gainedHp : null,
      hp: newHp,
      pm: newPm,
      ptsCap: newPts,
    });

    setIsLevelUpOpen(false);
    const pmText =
      gainedPm > 0
        ? `\n+${gainedPm} PM (${isProfaneMajor ? 'Magie profane majeure : +2' : 'Magie divine/hybride : +1'})`
        : '';
    alert(
      `Félicitations ! Vous passez niveau ${newLevel} !\n+${gainedHp} PV (${levelUpMethod === 'average' ? `Moyenne d${pr.dv}=${avgRoll}` : `Dé d${pr.dv}=${levelUpDiceResult}`} & Mod CON=${modCon >= 0 ? '+' + modCon : modCon}).${pmText}\n+2 points de capacités accordés.`
    );
  };

  // Download Offline Standalone HTML App
  const handleDownloadOfflineHtml = async () => {
    try {
      const res = await fetch('/assets/aistudio/CO_Compagnon_ac323e33.html');
      const htmlText = await res.text();
      const injectedHtml = htmlText.replace(
        'let pj = LS.get("co_pj_local", null);',
        `let pj = ${JSON.stringify(pj)};`
      );
      const blob = new Blob([injectedHtml], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(pj.name || 'Compagnon_PJ').replace(/\s+/g, '_')}_Offline.html`;
      a.click();
      alert(
        'Application HTML autonome téléchargée ! Vous pouvez double-cliquer dessus pour l ouvrir directement dans n importe quel navigateur, même hors-ligne.'
      );
    } catch (err: any) {
      alert("Erreur lors du téléchargement : " + err.message);
    }
  };

  // JSON Export / Import
  const handleExportJson = () => {
    const a = document.createElement('a');
    a.href =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(pj, null, 2));
    a.download = (pj.name || 'personnage').replace(/\s+/g, '_') + '_CO.json';
    a.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.name || !data.base) throw new Error('Format de fichier JSON non reconnu.');
        onUpdatePj(data);
        alert(`Héros "${data.name}" importé avec succès !`);
      } catch (err: any) {
        alert("Erreur lors de l'import : " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Way unlock
  const handleLearnRank = (wKey: string, rankNum: number, cost: number) => {
    if ((pj.ptsCap || 0) < cost) return;
    const newCaps = [...pj.caps, { wayKey: wKey, rank: rankNum }];
    onUpdatePj({
      ...pj,
      ptsCap: pj.ptsCap - cost,
      caps: newCaps,
    });
  };

  // Add Item to inventory from catalog
  const handleSelectFromDrawer = (item: Equipment | SpellItem) => {
    if (catalogDrawer === 'sorts') {
      const spell = item as SpellItem;
      const customSorts = pj.customSorts || [];
      if (customSorts.some((s) => s.n.toLowerCase() === spell.n.toLowerCase())) {
        alert('Vous connaissez déjà ce sortilège !');
        return;
      }
      onUpdatePj({
        ...pj,
        customSorts: [...customSorts, spell],
      });
      setCatalogDrawer(null);
      alert(`✨ ${spell.n} ajouté à votre Grimoire !`);
      return;
    }

    const eq = item as Equipment;
    if (catalogDrawer === 'armes') {
      const armes = pj.armes || [];
      const newWeapon: WeaponItem = {
        n: eq.n,
        t: eq.cat?.includes('Distance') ? 'Distance' : eq.cat?.includes('Poudre') ? 'Poudre' : 'Contact',
        dm: eq.dm || '1d6',
        crit: eq.crit || '20',
        por: eq.por || (eq.cat?.includes('Distance') ? '30 m' : '-'),
        props: eq.props || eq.desc || '',
        note: '',
      };
      onUpdatePj({ ...pj, armes: [...armes, newWeapon] });
      setCatalogDrawer(null);
      alert(`Arme "${eq.n}" ajoutée à votre équipement !`);
    } else if (catalogDrawer === 'armures') {
      if (eq.cat?.includes('Bouclier') || eq.n.toLowerCase().includes('bouclier')) {
        onUpdatePj({ ...pj, bou: eq.n });
      } else {
        onUpdatePj({ ...pj, arm: eq.n });
      }
      setCatalogDrawer(null);
      alert(`Protection "${eq.n}" équipée !`);
    } else if (catalogDrawer === 'tharnea') {
      const inv = [...(pj.inventaire || [])];
      const exist = inv.find((x) => x.n === eq.n);
      if (exist) {
        exist.q = (exist.q || 1) + (eq.q || 1);
      } else {
        inv.push({
          n: eq.n,
          desc: eq.desc || eq.props || '',
          q: eq.q || 1,
          isConsumable: !!eq.isConsumable || !!eq.effetSecondaire,
          note: eq.effetSecondaire ? `Effet bizarre : ${eq.effetSecondaire}` : eq.cat || '',
        });
      }
      if (eq.dm) {
        const armes = pj.armes || [];
        if (!armes.some((w) => w.n === eq.n)) {
          armes.push({
            n: eq.n,
            t: eq.cat?.includes('Distance') ? 'Distance' : 'Contact',
            dm: eq.dm,
            crit: eq.crit || '20',
            por: eq.por || 'Contact',
            props: eq.props || eq.desc || '',
            note: 'Artéfact Tharnéa',
          });
          onUpdatePj({ ...pj, inventaire: inv, armes });
          setCatalogDrawer(null);
          alert(`Artéfact "${eq.n}" ajouté à votre sacoche et préparé dans vos armes !`);
          return;
        }
      }
      onUpdatePj({ ...pj, inventaire: inv });
      setCatalogDrawer(null);
      alert(`"${eq.n}" ajouté à votre sacoche !`);
    } else {
      // Biens / Pack
      const inv = [...(pj.inventaire || [])];
      if (eq.isPack || eq.n.includes('Pack')) {
        // Auto-déballage du pack d'aventurier complet
        const packElements: InventoryItem[] = [
          { n: 'Sac à dos renforcé', q: 1, desc: 'Toile imperméabilisée', note: 'Rangement principal' },
          { n: 'Corde (15 m) & grappin', q: 1, desc: "Chanvre solide avec crochet d'acier", note: 'Attachée sous le sac' },
          { n: 'Paillasse portable & couverture', q: 1, desc: 'Couchage rembourré et couverture chaude', note: 'Roulée' },
          { n: 'Torches de résine', q: 5, desc: "1h d'éclairage à 10 m", isConsumable: true, note: 'Plein d amadou' },
          { n: 'Briquet à silex et amadou', q: 1, desc: 'Allume un feu rapidement', note: 'Poche étanche' },
          { n: 'Rations de voyage (1 sem.)', q: 7, desc: 'Vivres de longue conservation', isConsumable: true, note: '1 portion/jour' },
          { n: "Gourde d'eau en cuir (1L)", q: 1, desc: "Pleine d'eau fraîche", isConsumable: true, note: 'Ceinture' },
          { n: 'Potion de soins légers', q: 1, desc: 'Rend immédiatement 1d8 PV', isConsumable: true, note: 'Urgence' },
        ];
        packElements.forEach((pItem) => {
          const exist = inv.find((x) => x.n === pItem.n);
          if (exist) exist.q = (exist.q || 1) + pItem.q;
          else inv.push(pItem);
        });
        onUpdatePj({ ...pj, inventaire: inv });
        setCatalogDrawer(null);
        alert("Le Pack d'Aventurier complet a été déballé et rangé dans votre sac !");
      } else {
        const exist = inv.find((x) => x.n === eq.n);
        if (exist) {
          exist.q = (exist.q || 1) + (eq.q || 1);
        } else {
          inv.push({
            n: eq.n,
            desc: eq.desc || eq.props || '',
            q: eq.q || 1,
            isConsumable: !!eq.isConsumable,
            note: '',
          });
        }
        onUpdatePj({ ...pj, inventaire: inv });
        setCatalogDrawer(null);
        alert(`"${eq.n}" ajouté à l'inventaire !`);
      }
    }
  };

  const setItemQty = (idx: number, qty: number) => {
    const inv = [...pj.inventaire];
    if (qty <= 0) {
      if (confirm(`La quantité est à 0. Supprimer définitivement "${inv[idx].n}" ?`)) {
        inv.splice(idx, 1);
      } else {
        inv[idx].q = 0;
      }
    } else {
      inv[idx].q = qty;
    }
    onUpdatePj({ ...pj, inventaire: inv });
  };

  const updateItemNote = (idx: number, note: string) => {
    const inv = [...pj.inventaire];
    inv[idx].note = note;
    onUpdatePj({ ...pj, inventaire: inv });
  };

  const removeItem = (idx: number) => {
    const inv = [...pj.inventaire];
    inv.splice(idx, 1);
    onUpdatePj({ ...pj, inventaire: inv });
  };

  const removeWeapon = (idx: number) => {
    const armes = [...pj.armes];
    armes.splice(idx, 1);
    onUpdatePj({ ...pj, armes });
  };

  const handleSaveCustomItem = () => {
    if (!customItemName.trim()) {
      alert('Veuillez renseigner un nom.');
      return;
    }
    const inv = [...(pj.inventaire || [])];
    inv.push({
      n: customItemName.trim(),
      q: customItemQty,
      isConsumable: customItemIsConsumable,
      desc: customItemDesc.trim(),
      note: customItemNote.trim(),
    });
    onUpdatePj({ ...pj, inventaire: inv });
    setIsCustomItemOpen(false);
    setCustomItemName('');
    setCustomItemDesc('');
    setCustomItemNote('');
  };

  const handleSaveCustomSpell = () => {
    if (!customSpellName.trim()) {
      alert('Veuillez renseigner un nom de sort.');
      return;
    }
    const customSorts = pj.customSorts || [];
    customSorts.push({
      n: customSpellName.trim(),
      rang: customSpellRank,
      portee: customSpellRange,
      t: customSpellDesc.trim(),
      L: 1,
    });
    onUpdatePj({ ...pj, customSorts });
    setIsCustomSpellOpen(false);
    setCustomSpellName('');
    setCustomSpellDesc('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Hero Banner (Always on top) */}
      <div className="print-card bg-gradient-to-r from-[#361917] via-[#241712] to-[#181410] border border-[#d4a84a]/60 rounded-xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-co text-2xl sm:text-3xl font-bold text-[#f3d48d]">
                {pj.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#120f0c] text-[#d4a84a] border border-[#d4a84a]/40 font-mono font-bold">
                Niv. {pj.level}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#9e907d] mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailItem({ type: 'race', data: rc })}
                className="text-[#f3d48d] hover:text-[#fff] hover:underline flex items-center gap-1 font-bold cursor-pointer bg-[#231c15] px-2.5 py-0.5 rounded border border-[#3d3023] transition-colors"
                title="Cliquer pour afficher la fiche de race officielle complète (co-drs.org)"
              >
                <span>{rc.n}</span>
                <Info className="w-3.5 h-3.5 text-[#d4a84a]" />
              </button>
              <button
                type="button"
                onClick={() => setDetailItem({ type: 'profil', data: pr })}
                className="text-[#f3d48d] hover:text-[#fff] hover:underline flex items-center gap-1 font-bold cursor-pointer bg-[#231c15] px-2.5 py-0.5 rounded border border-[#3d3023] transition-colors"
                title="Cliquer pour afficher la fiche de classe officielle complète (co-drs.org)"
              >
                <span>{pr.n}</span>
                <Info className="w-3.5 h-3.5 text-[#cbafff]" />
              </button>
              {pj.player && <span>• Joueur : {pj.player}</span>}
              {pj.ptsCap > 0 && (
                <span className="text-xs font-bold text-[#6fa85b] bg-[#122410] px-2 py-0.5 rounded border border-[#274721]">
                  +{pj.ptsCap} pt{pj.ptsCap > 1 ? 's' : ''} de capacité
                </span>
              )}
            </p>
            {/* Quick States in header */}
            <div className="mt-2.5 pt-2 border-t border-[#3d3023]/60 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9e907d]">États :</span>
              <StateBadgeList
                activeStates={pj.etats || []}
                onToggleState={handleToggleState}
                onSelectDetail={(state) => setDetailItem({ type: 'etat', data: state })}
                allowEdit={true}
                compact={false}
              />
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBbePrintOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#2c1712] to-[#1c120c] hover:bg-[#381c15] border border-[#d4a84a] text-xs font-bold text-[#f3d48d] flex items-center gap-1.5 transition-all shadow-md hover:scale-102"
              title="Affiche et imprime la feuille de personnage A4 officielle conforme à Black Book Éditions"
            >
              <Printer className="w-3.5 h-3.5 text-[#d4a84a]" />
              <span>Fiche A4 Officielle (BBE)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#9e907d] hover:text-[#ede3d1] flex items-center gap-1.5 transition-all"
              title="Impression directe de la vue actuelle"
            >
              <Printer className="w-3.5 h-3.5" /> Direct
            </button>
            <button
              onClick={() => {
                setLevelUpDiceResult(Math.ceil(pr.dv / 2));
                setIsLevelUpOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4a84a] to-[#ab8230] hover:brightness-110 text-black text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ChevronUp className="w-4 h-4" /> Niveau Supérieur
            </button>
            <button
              onClick={handleDownloadOfflineHtml}
              title="Télécharger l application HTML autonome (jouable 100% hors-ligne)"
              className="px-2.5 py-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-semibold text-[#f3d48d] flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#d4a84a]" />
              <span className="hidden sm:inline">HTML Autonome</span>
            </button>
            <button
              onClick={handleExportJson}
              title="Télécharger la fiche au format JSON"
              className="p-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1]"
            >
              <FileDown className="w-4 h-4 text-[#d4a84a]" />
            </button>
            <label
              title="Charger un personnage existant"
              className="p-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-[#d4a84a]" />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleImportJson(e)}
              />
            </label>
            <button
              onClick={onOpenWizard}
              className="px-2.5 py-1.5 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs text-[#9e907d] hover:text-[#ede3d1]"
            >
              + Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="no-print flex items-center gap-1 bg-[#181410] p-1.5 rounded-xl border border-[#3d3023] overflow-x-auto">
        <button
          onClick={() => setActiveTab('fiche')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fiche'
              ? 'bg-[#d4a84a] text-black shadow-sm'
              : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Fiche &amp; Combat</span>
        </button>

        <button
          onClick={() => setActiveTab('voies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'voies'
              ? 'bg-[#d4a84a] text-black shadow-sm'
              : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
          }`}
        >
          <Scroll className="w-4 h-4" />
          <span>Arbre des Voies</span>
        </button>

        <button
          onClick={() => setActiveTab('sorts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sorts'
              ? 'bg-[#3a2954] text-[#dccbff] border border-[#654a93] shadow-sm'
              : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grimoire &amp; Arcanes</span>
          {allSpells.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {allSpells.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sac'
              ? 'bg-[#d4a84a] text-black shadow-sm'
              : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Sac &amp; Matériel</span>
          {pj.inventaire && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {pj.inventaire.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================== TAB 1 : FICHE & COMBAT ==================== */}
      {activeTab === 'fiche' && (
        <div className="space-y-4">
          {/* JAUGES PV & PM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JAUGE DE VIE (PV) */}
            <div className="print-card bg-[#181410] border border-[#3d3023] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9c2a2b]" />
                  <h3 className="font-serif-co text-base font-bold text-[#f3d48d]">
                    Points de Vie (PV)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-[#9e907d]">Actuel :</span>
                  <input
                    type="number"
                    min="0"
                    max={hpMax}
                    value={pj.hp}
                    onChange={(e) => setHpDirect(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold text-[#ede3d1] bg-[#231c15] border border-[#3d3023] rounded py-0.5 text-sm"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    min="1"
                    title="Modifier le PV Max"
                    value={hpMax}
                    onChange={(e) => setHpMaxDirect(parseInt(e.target.value) || 1)}
                    className="w-14 text-center font-bold text-[#f3d48d] bg-[#231c15] border border-[#3d3023] rounded py-0.5 text-sm"
                  />
                </div>
              </div>

              {/* Progress Bar & Slider */}
              <div className="bg-[#0c0a08] border border-[#3d3023] rounded-md h-3 overflow-hidden mb-2">
                <div
                  className="h-full transition-all duration-200"
                  style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
                />
              </div>

              <input
                type="range"
                min="0"
                max={hpMax}
                value={pj.hp}
                onChange={(e) => setHpDirect(parseInt(e.target.value) || 0)}
                className="slider-ctrl no-print mb-3"
              />

              <div className="flex items-center justify-between text-[11px] text-[#9e907d] mb-3">
                <span>0 PV (Inconscient/Mort)</span>
                <span className="font-bold">{hpPct}% vitalité</span>
                <span>{hpMax} PV Max</span>
              </div>

              {/* Quick Health Buttons */}
              <div className="no-print flex items-center gap-1.5">
                {[-5, -1, 1, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => alterHp(d)}
                    className="flex-1 py-1 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold rounded text-[#ede3d1]"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
                <button
                  onClick={() => alterHp(9999)}
                  className="px-3 py-1 bg-[#d4a84a] hover:bg-[#e0b555] text-black text-xs font-bold rounded shadow-xs"
                >
                  Soin Complet
                </button>
              </div>
            </div>

            {/* JAUGE DE MANA / PM (Si magique) */}
            {st?.mag ? (
              <div className="print-card bg-[#181410] border border-[#3a69a1]/60 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3a69a1]" />
                    <h3 className="font-serif-co text-base font-bold text-[#8dbbff]">
                      Points de Sort / Mana (PM)
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-[#9e907d]">Actuel :</span>
                    <input
                      type="number"
                      min="0"
                      max={pmMax}
                      value={pmCurrent}
                      onChange={(e) => setPmDirect(parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-bold text-[#8dbbff] bg-[#231c15] border border-[#3a69a1]/50 rounded py-0.5 text-sm"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      min="0"
                      title="Modifier le PM Max"
                      value={pmMax}
                      onChange={(e) => setPmMaxDirect(parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-bold text-[#8dbbff] bg-[#231c15] border border-[#3a69a1]/50 rounded py-0.5 text-sm"
                    />
                  </div>
                </div>

                <div className="bg-[#0c0a08] border border-[#3d3023] rounded-md h-3 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#2a5384] to-[#3a69a1] transition-all duration-200"
                    style={{ width: `${pmPct}%` }}
                  />
                </div>

                <input
                  type="range"
                  min="0"
                  max={pmMax}
                  value={pmCurrent}
                  onChange={(e) => setPmDirect(parseInt(e.target.value) || 0)}
                  className="slider-ctrl slider-mana no-print mb-3"
                />

                <div className="flex items-center justify-between text-[11px] text-[#9e907d] mb-3">
                  <span>0 PM (Épuisé)</span>
                  <span className="font-bold text-[#8dbbff]">{pmPct}% réserve</span>
                  <span>{pmMax} PM Max (Compagnon CO)</span>
                </div>

                <div className="no-print flex items-center gap-1.5">
                  {[-3, -1, 1, 3].map((d) => (
                    <button
                      key={d}
                      onClick={() => alterPm(d)}
                      className="flex-1 py-1 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold rounded text-[#8dbbff]"
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                  <button
                    onClick={() => alterPm(9999)}
                    className="px-3 py-1 bg-[#233a59] hover:bg-[#2d4b73] border border-[#3a69a1] text-[#8dbbff] text-xs font-bold rounded shadow-xs"
                  >
                    Méditation
                  </button>
                </div>
              </div>
            ) : (
              <div className="print-card bg-[#181410] border border-[#3d3023] rounded-xl p-4 flex flex-col justify-center text-center">
                <span className="text-xs uppercase tracking-widest text-[#9e907d] font-bold block mb-1">
                  Vocation Martiale
                </span>
                <p className="text-sm text-[#ede3d1]">
                  Profil non magique. Vous utilisez votre endurance physique et vos capacités martiales au combat.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={onSendToMjTable}
                    className="px-4 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#d4a84a]/50 text-[#f3d48d] rounded-lg text-xs font-semibold"
                  >
                    ⚔️ Synchroniser avec la Table MJ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ÉTATS PRÉJUDICIABLES & CONDITIONS DE COMBAT */}
          <div className="print-card bg-[#181410] border border-[#cf5544]/50 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cf5544] animate-pulse" />
                <h3 className="font-serif-co text-base font-bold text-[#ffb8b8]">
                  États Préjudiciables &amp; Conditions
                </h3>
                <span className="text-xs text-[#9e907d]">
                  ({(pj.etats || []).length} actif{(pj.etats || []).length > 1 ? 's' : ''})
                </span>
              </div>
              <StateBadgeList
                activeStates={pj.etats || []}
                onToggleState={handleToggleState}
                onSelectDetail={(state) => setDetailItem({ type: 'etat', data: state })}
                allowEdit={true}
                compact={false}
              />
            </div>

            {(pj.etats || []).length === 0 ? (
              <p className="text-xs text-[#9e907d] italic bg-[#231c15] p-2.5 rounded-lg border border-[#3d3023]">
                🛡️ Aucun état préjudiciable en cours. Le héros est en pleine possession de ses moyens physiques et mentaux. Cliquez sur « + Modifier les états » pour lui infliger une condition (aveuglé, étourdi, immobilisé...).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {(pj.etats || []).map((stName) => {
                  return (
                    <div
                      key={stName}
                      onClick={() => {
                        // find state details in data
                        const found = ETATS.find((x) => x.n === stName || x.id === stName);
                        if (found) setDetailItem({ type: 'etat', data: found });
                      }}
                      className="cursor-pointer bg-[#241515] hover:bg-[#331c1c] border border-[#cf5544]/60 rounded-lg p-2.5 flex items-start justify-between gap-2 transition-all hover:scale-101 shadow-xs"
                      title="Cliquer pour afficher la règle officielle complète"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#ffb8b8]">
                          <span>{stName}</span>
                          <Info className="w-3.5 h-3.5 text-[#ff9d9d] opacity-75" />
                        </div>
                        <span className="text-[11px] text-[#e8c7c7] block line-clamp-2">
                          Impact mécanique : Cliquez pour lire le malus officiel.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleState(stName);
                        }}
                        className="text-[#9e907d] hover:text-[#ff9d9d] p-1 rounded hover:bg-black/40"
                        title="Dissiper cet état"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6 CARACTÉRISTIQUES */}
          <div className="print-card bg-[#181410] border border-[#3d3023] rounded-xl p-4">
            <h3 className="font-serif-co text-base font-bold text-[#f3d48d] mb-3">
              Caractéristiques &amp; Modificateurs
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {CARAC_LIST.map((c) => {
                const total = (pj.base[c] || 10) + (pj.rb[c] || 0);
                const mod = getMod(total);
                const rb = pj.rb[c] || 0;

                return (
                  <div
                    key={c}
                    className="bg-[#231c15] border border-[#3d3023] rounded-lg p-2.5 text-center flex flex-col items-center justify-between"
                  >
                    <small className="text-[11px] font-bold uppercase tracking-wider text-[#9e907d]">
                      {c}
                    </small>
                    <input
                      type="number"
                      value={total}
                      onChange={(e) => updateCarac(c, parseInt(e.target.value) || 10)}
                      className="w-full text-center font-serif-co font-bold text-xl text-[#f3d48d] bg-transparent my-1"
                    />
                    <div className="text-sm font-bold text-[#6fa85b]">
                      {mod >= 0 ? `+${mod}` : mod}
                    </div>
                    {rb !== 0 && (
                      <span className="text-[9px] text-[#9e907d]">
                        race {rb > 0 ? `+${rb}` : rb}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TACTIQUE & COMBAT */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <div className="bg-[#231c15] border border-[#3d3023] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                Défense
              </small>
              <b className="font-serif-co text-2xl text-[#f3d48d]">{st?.def}</b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">
                {pj.arm ? pj.arm : 'Sans armure'}
              </span>
            </div>

            <div className="bg-[#231c15] border border-[#3d3023] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                Initiative
              </small>
              <b className="font-serif-co text-2xl text-[#ede3d1]">{st?.init}</b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">Base DEX</span>
            </div>

            <div className="bg-[#231c15] border border-[#3d3023] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                Att. Contact
              </small>
              <b className="font-serif-co text-2xl text-[#ede3d1]">
                {st && st.ct >= 0 ? `+${st.ct}` : st?.ct}
              </b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">Niveau + FOR</span>
            </div>

            <div className="bg-[#231c15] border border-[#3d3023] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                Att. Distance
              </small>
              <b className="font-serif-co text-2xl text-[#ede3d1]">
                {st && st.di >= 0 ? `+${st.di}` : st?.di}
              </b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">Niveau + DEX</span>
            </div>

            <div className="bg-[#231c15] border border-[#3a2954] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#cbafff] uppercase font-bold block">
                Att. Magique
              </small>
              <b className="font-serif-co text-2xl text-[#cbafff]">
                {st && st.mg !== null ? (st.mg >= 0 ? `+${st.mg}` : st.mg) : '-'}
              </b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">
                {st?.mag ? `${st.mag} + Niv` : 'Non magique'}
              </span>
            </div>

            <div className="bg-[#231c15] border border-[#855325] rounded-lg p-3 text-center">
              <small className="text-[10px] text-[#ffd09b] uppercase font-bold block">
                Déplacement
              </small>
              <b className="font-serif-co text-2xl text-[#ffd09b]">{st?.deplacement} m</b>
              <span className="text-[10px] text-[#9e907d] block mt-0.5">
                Course : {(st?.deplacement || 10) * 2} m
              </span>
            </div>
          </div>

          {/* ACTIONS & ARSENAL RAPIDE */}
          <div className="print-card bg-[#181410] border border-[#3d3023] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#d4a84a]" />
                <h3 className="font-serif-co text-base font-bold text-[#f3d48d]">
                  Arsenal Équipé en Combat
                </h3>
              </div>
              <button
                onClick={() => setCatalogDrawer('armes')}
                className="no-print px-3 py-1 rounded-lg bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] hover:border-[#d4a84a] text-xs font-semibold text-[#f3d48d] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter Arme
              </button>
            </div>

            <div className="space-y-2">
              {pj.armes && pj.armes.length > 0 ? (
                pj.armes.map((ar, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      setDetailItem({
                        type: 'equipment',
                        data: {
                          n: ar.n,
                          cat: ar.t,
                          dm: ar.dm,
                          crit: ar.crit,
                          por: ar.por,
                          props: ar.props,
                          desc: ar.note || ar.props,
                        },
                      })
                    }
                    className="p-3 bg-[#231c15] hover:bg-[#2d2218] border border-[#3d3023] hover:border-[#d4a84a] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-[#f3d48d] text-sm group-hover:underline">{ar.n}</b>
                        <span className="text-[10px] bg-[#1e2f47] text-[#b0d7ff] px-2 py-0.5 rounded font-bold">
                          {ar.t}
                        </span>
                        <span className="text-[10px] text-[#9e907d] group-hover:text-[#d4a84a]">
                          (Cliquer pour détails)
                        </span>
                      </div>
                      <div className="text-xs text-[#9e907d] mt-0.5">
                        Dégâts : <b className="text-[#ede3d1]">{ar.dm}</b> • Portée : {ar.por} • Critique : {ar.crit}
                        {ar.props && <span> • {ar.props}</span>}
                      </div>
                      {ar.note && <div className="text-[11px] text-[#ede3d1] italic mt-1">{ar.note}</div>}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWeapon(i);
                        }}
                        className="no-print p-1 rounded text-[#9e907d] hover:text-[#cf5544] hover:bg-[#181410]"
                        title="Déséquiper"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9e907d] italic py-2">
                  Aucune arme équipée pour le moment. Cliquez sur « Ajouter Arme » pour en équiper une.
                </p>
              )}
            </div>
          </div>

          {/* SORTS D'ACTION RAPIDE EN DIRECT SUR PAGE 1 */}
          {st?.mag && (
            <div className="print-card bg-[#181410] border border-[#3a2954] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#cbafff]" />
                  <h3 className="font-serif-co text-base font-bold text-[#cbafff]">
                    Sorts d'Action Rapide
                  </h3>
                </div>
                <span className="text-xs text-[#9e907d]">
                  Coût : <b>1 PM par Rang</b> (Cliquer sur un sort pour détails)
                </span>
              </div>

              <div className="space-y-2">
                {allSpells.length > 0 ? (
                  allSpells.map((s, idx) => {
                    const cost = s.rang || 1;
                    const canCast = pmCurrent >= cost;

                    return (
                      <div
                        key={idx}
                        onClick={() => setDetailItem({ type: 'spell', data: s })}
                        className="p-3 bg-[#231c15] hover:bg-[#261833] border-l-4 border-l-[#3a69a1] border border-[#3d3023] hover:border-[#cbafff] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="text-[#cbafff] text-sm group-hover:underline">{s.n}</b>
                            <span className="text-[10px] text-[#9e907d]">
                              Rang {cost} • Portée : {s.portee}
                            </span>
                          </div>
                          <p className="text-xs text-[#ede3d1] mt-0.5">{s.t}</p>
                        </div>

                        <div className="no-print self-end sm:self-auto">
                          <button
                            disabled={!canCast}
                            onClick={(e) => {
                              e.stopPropagation();
                              castSpell(s);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              canCast
                                ? 'bg-[#233a59] hover:bg-[#32527d] text-[#8dbbff] border border-[#3a69a1]'
                                : 'opacity-40 bg-[#1f2630] text-[#9e907d] cursor-not-allowed'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Lancer (-{cost} PM)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#9e907d] italic py-2">
                    Aucun sort mémorisé. Rendez-vous dans l'onglet Grimoire pour en ajouter.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TRAITS ROLEPLAY & NOTES */}
          <div className="print-card bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <h3 className="font-serif-co text-base font-bold text-[#f3d48d]">
              Caractère, Ascendance &amp; Roleplay
            </h3>
            <div className="p-3 bg-[#231c15] rounded-lg border border-[#3d3023] text-xs space-y-1.5">
              <div>
                <b className="text-[#f3d48d]">Ascendance raciale :</b> {rc.traits || 'Aucun'}
              </div>
              <div>
                <b className="text-[#f3d48d]">Vocation du profil :</b> {pr.traits || 'Aucun'}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#9e907d] uppercase tracking-wider block mb-1">
                Notes personnelles &amp; Objectifs du Héros :
              </label>
              <textarea
                rows={3}
                value={pj.persoTraits || ''}
                onChange={(e) => onUpdatePj({ ...pj, persoTraits: e.target.value })}
                placeholder="Secrets, ennemis jurés, dettes d'honneur, description physique..."
                className="w-full p-2.5 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] focus:border-[#d4a84a] outline-none font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2 : VOIES HÉROÏQUES ==================== */}
      {activeTab === 'voies' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                  Arbre des Voies Héroïques
                </h3>
                <p className="text-xs text-[#9e907d]">
                  Les voies propres à votre profil sont auréolées d'or ⭐. Filtrez par profil ci-dessous ou cherchez une aptitude.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ede3d1]">
                  Points de capacité disponibles :
                </span>
                <span className="text-base font-serif-co font-bold text-[#6fa85b] bg-[#122410] px-3 py-1 rounded-lg border border-[#274721]">
                  {pj.ptsCap || 0}
                </span>
              </div>
            </div>

            {/* Filter controls by Profil & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#30251a]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une voie ou un pouvoir..."
                  value={waySearchQuery}
                  onChange={(e) => setWaySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] focus:border-[#d4a84a] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#9e907d] whitespace-nowrap font-medium">
                  Filtrer par Profil :
                </label>
                <select
                  value={selectedWayProfil}
                  onChange={(e) => setSelectedWayProfil(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] focus:border-[#d4a84a] outline-none cursor-pointer"
                >
                  <option value="all">Toutes les voies (70 voies COF)</option>
                  <option value="mine">⭐ Mon profil ({pr.n})</option>
                  <option disabled>──────────</option>
                  {PROFILS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.n}
                    </option>
                  ))}
                  <option disabled>──────────</option>
                  <option value="race">Voies Raciales</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(VOIES_CATALOG)
              .filter(([wKey, way]) => {
                if (selectedWayProfil === 'mine') {
                  return way.profil === pj.profil || way.profil === 'race:' + pj.race;
                }
                if (selectedWayProfil !== 'all') {
                  if (selectedWayProfil === 'race') return way.profil.startsWith('race:');
                  return way.profil.toLowerCase() === selectedWayProfil.toLowerCase();
                }
                return true;
              })
              .filter(([wKey, way]) => {
                if (!waySearchQuery) return true;
                const q = waySearchQuery.toLowerCase();
                return (
                  way.nom.toLowerCase().includes(q) ||
                  way.profil.toLowerCase().includes(q) ||
                  way.r.some((r) => r.n.toLowerCase().includes(q) || r.t.toLowerCase().includes(q))
                );
              })
              .map(([wKey, way]) => {
              const isFav = way.profil === pj.profil || way.profil === 'race:' + pj.race;
              const myRank = pj.caps.reduce(
                (max, c) => (c.wayKey === wKey ? Math.max(max, c.rank) : max),
                0
              );

              return (
                <details
                  key={wKey}
                  open={isFav}
                  className={`bg-[#181410] border rounded-xl overflow-hidden transition-all ${
                    isFav
                      ? 'border-[#d4a84a] shadow-sm shadow-[#d4a84a]/10'
                      : 'border-[#3d3023]'
                  }`}
                >
                  <summary className="px-4 py-3 cursor-pointer font-serif-co font-bold text-[#f3d48d] hover:bg-[#231c15] flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                      {isFav && <span className="text-[#f3d48d]">⭐</span>}
                      <span>{way.nom}</span>
                      <span className="text-xs text-[#9e907d] font-sans font-normal">
                        ({way.profil})
                      </span>
                    </div>
                    <span className="text-xs font-sans font-bold text-[#d4a84a] bg-[#291e12] px-2.5 py-0.5 rounded-full border border-[#d4a84a]/40">
                      Rang : {myRank} / 5
                    </span>
                  </summary>

                  <div className="p-4 pt-1 border-t border-[#30251a] space-y-2.5">
                    {way.r.map((rk, idx) => {
                      const rankNum = idx + 1;
                      const hasRank = myRank >= rankNum;
                      const isNext = myRank === rankNum - 1;
                      const cost = rankNum <= 2 ? 1 : 2;
                      const canAfford = (pj.ptsCap || 0) >= cost;

                      let statusClass = 'border-[#3d3023] opacity-50 bg-[#14100c]';
                      let badge = 'Verrouillé';
                      if (hasRank) {
                        statusClass = 'border-[#6fa85b] bg-[#122410]/20 text-[#ede3d1]';
                        badge = 'Acquis ✓';
                      } else if (isNext) {
                        statusClass =
                          'border-[#d4a84a] bg-[#2d2217]/50 shadow-md shadow-[#d4a84a]/15';
                        badge = canAfford
                          ? `Accessible (${cost} pt)`
                          : `Points requis (${cost} pt)`;
                      }

                      return (
                        <div
                          key={rankNum}
                          onClick={() =>
                            setDetailItem({
                              type: 'wayRank',
                              data: {
                                ...rk,
                                wayName: way.nom,
                                profile: way.profil,
                                rankNum,
                              },
                            })
                          }
                          className={`p-3 rounded-lg border flex items-start gap-3 transition-all cursor-pointer hover:border-[#d4a84a] group ${statusClass}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                              hasRank
                                ? 'bg-[#6fa85b] text-black border-[#6fa85b]'
                                : isNext
                                ? 'border-[#d4a84a] text-[#f3d48d]'
                                : 'border-[#423628] text-[#9e907d]'
                            }`}
                          >
                            {rankNum}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <b className="text-[#f3d48d] text-sm group-hover:underline">{rk.n}</b>
                              <div className="flex items-center gap-1.5">
                                {rk.L ? (
                                  <span className="text-[10px] font-bold bg-[#4a1c1d] text-[#ffb8b8] px-1.5 py-0.5 rounded">
                                    Limitée
                                  </span>
                                ) : null}
                                {rk.S ? (
                                  <span className="text-[10px] font-bold bg-[#1e2f47] text-[#b0d7ff] px-1.5 py-0.5 rounded">
                                    Sort
                                  </span>
                                ) : null}
                                <span className="text-[10px] text-[#9e907d]">{badge}</span>
                              </div>
                            </div>
                            <p className="text-xs text-[#ede3d1] leading-relaxed">{rk.t}</p>

                            {isNext && canAfford && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLearnRank(wKey, rankNum, cost);
                                }}
                                className="mt-2 px-3 py-1 bg-[#d4a84a] hover:bg-[#e0b555] text-black font-bold text-xs rounded shadow-sm flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Débloquer Rang {rankNum} (-{cost} pt)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3 : GRIMOIRE & SORTS ==================== */}
      {activeTab === 'sorts' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3a2954] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif-co text-lg font-bold text-[#cbafff]">
                Grimoire &amp; Arcanes
              </h3>
              <p className="text-xs text-[#9e907d]">
                Attaque Magique :{' '}
                <b className="text-[#cbafff]">
                  {st && st.mg !== null ? (st.mg >= 0 ? `+${st.mg}` : st.mg) : 'Non magique'}
                </b>{' '}
                • Réserve : <b className="text-[#8dbbff]">{pmCurrent} / {pmMax} PM</b>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCatalogDrawer('sorts')}
                className="px-3 py-1.5 bg-[#3a2954] hover:bg-[#4d3670] border border-[#654a93] text-[#dccbff] text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" /> Catalogue des Sorts
              </button>
              <button
                onClick={() => setIsCustomSpellOpen(true)}
                className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Créer un Sort
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {allSpells.length > 0 ? (
              allSpells.map((s, idx) => {
                const cost = s.rang || 1;
                const canCast = pmCurrent >= cost;
                const isCustom = s.id?.startsWith('cust_');

                return (
                  <div
                    key={idx}
                    onClick={() => setDetailItem({ type: 'spell', data: s })}
                    className="p-3.5 bg-[#181410] hover:bg-[#221630] border-l-4 border-l-[#3a69a1] border border-[#3d3023] hover:border-[#cbafff] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-all group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <b className="text-[#cbafff] text-sm font-serif-co group-hover:underline">{s.n}</b>
                        <span className="text-[10px] bg-[#291b3b] text-[#dccbff] px-2 py-0.5 rounded border border-[#492d6e]">
                          Rang {cost} ({cost} PM)
                        </span>
                        <span className="text-[10px] text-[#9e907d]">Portée : {s.portee}</span>
                        {s.voie && (
                          <span className="text-[10px] text-[#9e907d]">• Voie : {s.voie}</span>
                        )}
                        <span className="text-[10px] text-[#9e907d] group-hover:text-[#cbafff]">
                          (Cliquer pour détails)
                        </span>
                      </div>
                      <p className="text-xs text-[#ede3d1]">{s.t}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        disabled={!canCast}
                        onClick={(e) => {
                          e.stopPropagation();
                          castSpell(s);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          canCast
                            ? 'bg-[#233a59] hover:bg-[#32527d] text-[#8dbbff] border border-[#3a69a1]'
                            : 'opacity-40 bg-[#1f2630] text-[#9e907d] cursor-not-allowed'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Lancer (-{cost} PM)</span>
                      </button>

                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cIndex = parseInt(s.id!.split('_')[1]);
                            const list = [...(pj.customSorts || [])];
                            list.splice(cIndex, 1);
                            onUpdatePj({ ...pj, customSorts: list });
                          }}
                          className="p-1 rounded text-[#9e907d] hover:text-[#cf5544] hover:bg-[#231c15]"
                          title="Supprimer ce sort"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 bg-[#181410] border border-[#3d3023] rounded-xl text-center text-xs text-[#9e907d]">
                Aucun sort mémorisé. Utilisez le bouton « Catalogue des Sorts » ci-dessus pour en ajouter ou débloquez les rangs de sorts dans vos voies.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4 : SAC & MATÉRIEL ==================== */}
      {activeTab === 'sac' && (
        <div className="space-y-4">
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                Sacoche, Équipement &amp; Tentes
              </h3>
              <p className="text-xs text-[#9e907d]">
                Modifiez les quantités directement au clavier. Le catalogue vous propose tentes (1, 2, 4, 6 places), barda et consommables.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isTharneaActive && (
                <button
                  onClick={() => {
                    setCatalogDrawer('tharnea');
                    setCatalogQuery('');
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#4d1945] to-[#2b0c27] hover:brightness-110 border border-[#b8389e] text-[#f7cbf2] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                  title="Consulter et ajouter les 30+ artéfacts et 12 bonbons de Tharnéa"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8fed]" /> Artéfacts Tharnéa
                </button>
              )}
              <button
                onClick={() => setCatalogDrawer('biens')}
                className="px-3 py-1.5 bg-[#d4a84a] hover:bg-[#e0b555] text-black text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" /> Ouvrir Catalogue
              </button>
              <button
                onClick={() => setIsCustomItemOpen(true)}
                className="px-3 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Objet sur Mesure
              </button>
            </div>
          </div>

          {/* PROTECTIONS ÉQUIPÉES */}
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif-co text-sm font-bold text-[#f3d48d]">
                Armures &amp; Protections Équipées
              </h4>
              <button
                onClick={() => setCatalogDrawer('armures')}
                className="text-xs text-[#d4a84a] hover:underline"
              >
                + Changer Protection
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                <span className="text-[10px] uppercase font-bold text-[#9e907d] block">
                  Armure de Corps
                </span>
                <b className="text-[#ede3d1] text-sm">{pj.arm || 'Aucune armure'}</b>
              </div>
              <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                <span className="text-[10px] uppercase font-bold text-[#9e907d] block">
                  Bouclier
                </span>
                <b className="text-[#ede3d1] text-sm">{pj.bou || 'Aucun bouclier'}</b>
              </div>
            </div>
          </div>

          {/* CONSOMMABLES & MUNITIONS AVEC SAISIE NUMÉRIQUE DIRECTE */}
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <h4 className="font-serif-co text-sm font-bold text-[#f3d48d]">
              Consommables &amp; Munitions (Saisie Directe)
            </h4>

            {pj.inventaire && pj.inventaire.filter((it) => it.isConsumable).length > 0 ? (
              <div className="space-y-2">
                {pj.inventaire
                  .filter((it) => it.isConsumable)
                  .map((it) => {
                    const globalIdx = pj.inventaire.indexOf(it);
                    return (
                      <div
                        key={globalIdx}
                        className="p-3 bg-[#231c15] border border-[#3d3023] rounded-lg flex flex-col gap-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDetailItem({
                                type: 'equipment',
                                data: {
                                  n: it.n,
                                  nom: it.n,
                                  type: 'Consommable',
                                  description: it.desc || 'Consommable ou munition d\'aventure.',
                                  proprietes: it.note ? `Notes : ${it.note}` : undefined,
                                },
                              })
                            }
                            className="text-left group cursor-pointer"
                          >
                            <b className="text-[#f3d48d] text-sm group-hover:text-[#ffe099] flex items-center gap-1.5 underline-offset-2 hover:underline">
                              {it.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#d4a84a]" />
                            </b>
                            {it.desc && <p className="text-xs text-[#9e907d]">{it.desc}</p>}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#9e907d]">Qté :</span>
                            <input
                              type="number"
                              min="0"
                              value={it.q || 1}
                              onChange={(e) => setItemQty(globalIdx, parseInt(e.target.value) || 0)}
                              className="w-14 text-center font-bold text-[#f3d48d] bg-[#181410] border border-[#3d3023] rounded py-0.5 text-xs"
                            />
                            <button
                              onClick={() => setItemQty(globalIdx, (it.q || 1) - 1)}
                              className="w-7 h-7 bg-[#181410] hover:bg-[#2e2318] border border-[#3d3023] rounded flex items-center justify-center text-xs text-[#ede3d1]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setItemQty(globalIdx, (it.q || 1) + 1)}
                              className="w-7 h-7 bg-[#181410] hover:bg-[#2e2318] border border-[#3d3023] rounded flex items-center justify-center text-xs text-[#ede3d1]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeItem(globalIdx)}
                              className="p-1 rounded text-[#9e907d] hover:text-[#cf5544] hover:bg-[#181410]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Annotations (poids, doses, rangement...)"
                          value={it.note || ''}
                          onChange={(e) => updateItemNote(globalIdx, e.target.value)}
                          className="w-full text-xs bg-[#181410] border border-dashed border-[#3d3023] rounded px-2.5 py-1 text-[#ede3d1] focus:border-solid focus:border-[#d4a84a] outline-none"
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-[#9e907d] italic">Aucun consommable enregistré.</p>
            )}
          </div>

          {/* INVENTAIRE GÉNÉRAL (AVEC TENTES, ETC.) */}
          <div className="bg-[#181410] border border-[#3d3023] rounded-xl p-4 space-y-3">
            <h4 className="font-serif-co text-sm font-bold text-[#f3d48d]">
              Inventaire Général (Tentes, Matériel d'Aventure)
            </h4>

            {pj.inventaire && pj.inventaire.filter((it) => !it.isConsumable).length > 0 ? (
              <div className="space-y-2">
                {pj.inventaire
                  .filter((it) => !it.isConsumable)
                  .map((it) => {
                    const globalIdx = pj.inventaire.indexOf(it);
                    return (
                      <div
                        key={globalIdx}
                        className="p-3 bg-[#231c15] border border-[#3d3023] rounded-lg flex flex-col gap-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDetailItem({
                                type: 'equipment',
                                data: {
                                  n: it.n,
                                  nom: it.n,
                                  type: 'Matériel d\'aventure',
                                  description: it.desc || 'Matériel d\'exploration et de voyage.',
                                  proprietes: it.note ? `Notes : ${it.note}` : undefined,
                                },
                              })
                            }
                            className="text-left group cursor-pointer"
                          >
                            <b className="text-[#ede3d1] text-sm group-hover:text-[#f3d48d] flex items-center gap-1.5 underline-offset-2 hover:underline">
                              {it.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#d4a84a]" />
                            </b>
                            {it.desc && <p className="text-xs text-[#9e907d]">{it.desc}</p>}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#9e907d]">Qté :</span>
                            <input
                              type="number"
                              min="0"
                              value={it.q || 1}
                              onChange={(e) => setItemQty(globalIdx, parseInt(e.target.value) || 0)}
                              className="w-14 text-center font-bold text-[#ede3d1] bg-[#181410] border border-[#3d3023] rounded py-0.5 text-xs"
                            />
                            <button
                              onClick={() => setItemQty(globalIdx, (it.q || 1) - 1)}
                              className="w-7 h-7 bg-[#181410] hover:bg-[#2e2318] border border-[#3d3023] rounded flex items-center justify-center text-xs text-[#ede3d1]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setItemQty(globalIdx, (it.q || 1) + 1)}
                              className="w-7 h-7 bg-[#181410] hover:bg-[#2e2318] border border-[#3d3023] rounded flex items-center justify-center text-xs text-[#ede3d1]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeItem(globalIdx)}
                              className="p-1 rounded text-[#9e907d] hover:text-[#cf5544] hover:bg-[#181410]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Annotations..."
                          value={it.note || ''}
                          onChange={(e) => updateItemNote(globalIdx, e.target.value)}
                          className="w-full text-xs bg-[#181410] border border-dashed border-[#3d3023] rounded px-2.5 py-1 text-[#ede3d1] focus:border-solid focus:border-[#d4a84a] outline-none"
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-[#9e907d] italic">Sacoche vide.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== DRAWER CATALOGUE ==================== */}
      {catalogDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#181410] border-l border-[#d4a84a] w-full max-w-md h-full flex flex-col shadow-2xl animate-slideLeft">
            <div className="px-5 py-4 border-b border-[#3d3023] flex items-center justify-between bg-gradient-to-r from-[#291712] to-[#181410]">
              <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
                {catalogDrawer === 'armes'
                  ? 'Armurerie Officielle'
                  : catalogDrawer === 'armures'
                  ? 'Protections & Boucliers'
                  : catalogDrawer === 'sorts'
                  ? 'Catalogue des Sorts'
                  : 'Catalogue de Matériel & Tentes'}
              </h3>
              <button
                onClick={() => setCatalogDrawer(null)}
                className="p-1 rounded text-[#9e907d] hover:text-[#ede3d1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#30251a]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9e907d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, dégâts, propriétés..."
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] focus:border-[#d4a84a] outline-none"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {catalogDrawer === 'sorts' &&
                SORTS_CATALOG.filter((s) =>
                  (s.n + s.t + (s.voie || '')).toLowerCase().includes(catalogQuery.toLowerCase())
                ).map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#231c15] border border-[#3d3023] rounded-lg flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setDetailItem({ type: 'spell', data: s })}
                        className="text-left group cursor-pointer"
                      >
                        <b className="text-[#cbafff] text-sm group-hover:text-[#e4d4ff] flex items-center gap-1.5 underline-offset-2 hover:underline">
                          {s.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#cbafff]" />
                        </b>
                      </button>
                      <button
                        onClick={() => handleSelectFromDrawer(s)}
                        className="px-2.5 py-1 bg-[#3a2954] hover:bg-[#4d3670] border border-[#654a93] text-[#dccbff] text-xs font-bold rounded"
                      >
                        + Apprendre
                      </button>
                    </div>
                    <div className="text-[11px] text-[#9e907d]">
                      Rang {s.rang} • Voie : {s.voie || 'Générale'} • Portée : {s.portee}
                    </div>
                    <p className="text-xs text-[#ede3d1]">{s.t}</p>
                  </div>
                ))}

              {catalogDrawer === 'tharnea' &&
                THARNEA_ARTIFACTS.filter((it) =>
                  (it.n + (it.desc || '') + (it.cat || '') + (it.effetSecondaire || '')).toLowerCase().includes(catalogQuery.toLowerCase())
                ).map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#241320] border border-[#5e194f] rounded-lg flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setDetailItem({
                            type: 'equipment',
                            data: it,
                          })
                        }
                        className="flex items-center gap-1.5 text-left group cursor-pointer"
                      >
                        <b className="text-[#f7cbf2] text-sm group-hover:text-[#ffffff] flex items-center gap-1.5 underline-offset-2 hover:underline">
                          {it.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#ff8fed]" />
                        </b>
                      </button>
                      <button
                        onClick={() => handleSelectFromDrawer(it)}
                        className="px-2.5 py-1 bg-[#8a2d75] hover:bg-[#a6368d] text-white text-xs font-bold rounded shadow-xs"
                      >
                        + Choisir
                      </button>
                    </div>
                    <div className="text-[11px] text-[#cca3c7] flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#f7cbf2]">{it.cat}</span>
                      {it.prix && <span>• {it.prix}</span>}
                      {it.couleur && (
                        <span className="flex items-center gap-1">
                          • <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/40" style={{ backgroundColor: it.couleur }} />
                        </span>
                      )}
                    </div>
                    {it.dm && (
                      <div className="text-xs font-mono font-bold text-[#f3d48d]">
                        Dégâts : {it.dm} {it.crit && `(Crit ${it.crit})`} {it.por && `• Portée ${it.por}`}
                      </div>
                    )}
                    <p className="text-xs text-[#ede3d1] line-clamp-2">{it.desc}</p>
                    {it.effetSecondaire && (
                      <p className="text-[11px] text-[#ffb0d9] italic">
                        ⚠️ Effet secondaire : {it.effetSecondaire}
                      </p>
                    )}
                  </div>
                ))}

              {catalogDrawer !== 'sorts' &&
                catalogDrawer !== 'tharnea' &&
                (catalogDrawer === 'armes'
                  ? ARMES_CATALOG
                  : catalogDrawer === 'armures'
                  ? ARMURES_CATALOG
                  : BIENS_CATALOG
                )
                  .filter((it) =>
                    (it.n + (it.desc || '') + (it.props || '')).toLowerCase().includes(catalogQuery.toLowerCase())
                  )
                  .map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#231c15] border border-[#3d3023] rounded-lg flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setDetailItem({
                              type: 'equipment',
                              data: {
                                n: it.n,
                                nom: it.n,
                                type:
                                  catalogDrawer === 'armes'
                                    ? 'Arme'
                                    : catalogDrawer === 'armures'
                                    ? 'Armure / Protection'
                                    : 'Bien & Équipement',
                                degats: it.dm,
                                defense: it.def,
                                portee: it.por,
                                critique: it.crit,
                                proprietes: it.props,
                                description: it.desc,
                              },
                            })
                          }
                          className="flex items-center gap-1.5 text-left group cursor-pointer"
                        >
                          <b className="text-[#f3d48d] text-sm group-hover:text-[#ffe099] flex items-center gap-1.5 underline-offset-2 hover:underline">
                            {it.n} <Info className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 text-[#d4a84a]" />
                          </b>
                          {it.isPack && (
                            <span className="text-[9px] bg-[#543818] text-[#f3d48d] px-1.5 py-0.5 rounded font-bold">
                              Pack Complet
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleSelectFromDrawer(it)}
                          className="px-2.5 py-1 bg-[#d4a84a] hover:bg-[#e0b555] text-black text-xs font-bold rounded"
                        >
                          + Choisir
                        </button>
                      </div>

                      <div className="text-xs text-[#9e907d]">
                        {it.dm && <span>DM : <b>{it.dm}</b> • Portée : {it.por} • Crit : {it.crit}<br /></span>}
                        {it.def && <span>Protection : <b>+{it.def} DEF</b><br /></span>}
                        {it.props && <span>Propriétés : {it.props}<br /></span>}
                        {it.desc && <span>{it.desc}</span>}
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL PASSAGE DE NIVEAU OFFICIEL COF ==================== */}
      {isLevelUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#181410] border border-[#d4a84a] rounded-xl w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#3d3023] pb-3">
              <div>
                <h3 className="font-serif-co text-xl font-bold text-[#f3d48d]">
                  Passage au Niveau {pj.level + 1}
                </h3>
                <p className="text-xs text-[#9e907d]">
                  Application stricte des règles officielles Chroniques Oubliées Fantasy
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-2 py-1 bg-[#231c15] text-[#d4a84a] border border-[#3d3023] rounded">
                Profil : {pr.n} (d{pr.dv})
              </span>
            </div>

            {/* 1. GESTION DES POINTS DE VIE (PV) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d4a84a] block">
                1. Mode de gain des Points de Vie (PV)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLevelUpMethod('average')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    levelUpMethod === 'average'
                      ? 'bg-[#2b1f14] border-[#d4a84a] text-[#f3d48d] shadow-sm'
                      : 'bg-[#181410] border-[#3d3023] text-[#9e907d] hover:border-[#5a4632]'
                  }`}
                >
                  <div className="text-xs font-bold">⚖️ Moyenne arrondie au sup.</div>
                  <div className="text-[11px] text-[#ede3d1] mt-1">
                    Valeur fixe : <b>{Math.floor(pr.dv / 2) + 1} PV</b> (sur d{pr.dv})
                  </div>
                  <div className="text-[10px] text-[#9e907d] mt-0.5">Variante courante de table</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLevelUpMethod('roll')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    levelUpMethod === 'roll'
                      ? 'bg-[#2b1f14] border-[#d4a84a] text-[#f3d48d] shadow-sm'
                      : 'bg-[#181410] border-[#3d3023] text-[#9e907d] hover:border-[#5a4632]'
                  }`}
                >
                  <div className="text-xs font-bold">🎲 Tirage réel Dé de Vie</div>
                  <div className="text-[11px] text-[#ede3d1] mt-1">
                    Lancer physique d{pr.dv} : <b>{levelUpDiceResult}</b>
                  </div>
                  <div className="text-[10px] text-[#9e907d] mt-0.5">Règle de base officielle</div>
                </button>
              </div>

              {levelUpMethod === 'roll' && (
                <div className="p-3 bg-[#231c15] border border-[#3d3023] rounded-lg text-center space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9e907d] uppercase tracking-wider block">
                    Résultat obtenu sur votre d{pr.dv} :
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max={pr.dv}
                      value={levelUpDiceResult}
                      onChange={(e) =>
                        setLevelUpDiceResult(
                          Math.max(1, Math.min(pr.dv, parseInt(e.target.value) || 1))
                        )
                      }
                      className="w-20 text-center font-serif-co text-3xl font-bold text-[#f3d48d] bg-[#120f0c] border border-[#3d3023] rounded py-1"
                    />
                  </div>
                </div>
              )}

              {/* Résumé formule PV */}
              <div className="p-3 bg-[#120f0c] border border-[#3d3023] rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#9e907d]">Base DV ({levelUpMethod === 'average' ? 'Moyenne fixe' : `d${pr.dv}`}) :</span>
                  <span className="font-bold text-[#ede3d1]">{levelUpMethod === 'average' ? Math.floor(pr.dv / 2) + 1 : levelUpDiceResult}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9e907d]">Modificateur de Constitution (CON) :</span>
                  <span className="font-bold text-[#6fa85b]">
                    {st && st.m.CON >= 0 ? `+${st.m.CON}` : st ? st.m.CON : 0}
                  </span>
                </div>
                <div className="border-t border-[#30251a] pt-1 flex items-center justify-between font-bold">
                  <span className="text-[#ede3d1]">Gain net de PV au niveau {pj.level + 1} :</span>
                  <span className="text-[#f3d48d] text-sm">
                    +{Math.max(1, (levelUpMethod === 'average' ? Math.floor(pr.dv / 2) + 1 : levelUpDiceResult) + (st ? st.m.CON : 0))} PV
                  </span>
                </div>
                <div className="text-[10px] text-[#9e907d] italic">
                  * Garanti à minimum +1 PV par niveau si Mod. CON négatif.
                </div>
              </div>
            </div>

            {/* 2. GESTION DES POINTS DE MANA (PM) */}
            <div className="space-y-2 pt-2 border-t border-[#30251a]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#cbafff] block">
                2. Gestion des Points de Mana (PM)
              </label>

              {['magicien', 'ensorceleur', 'necromancien'].includes(pj.profil) ? (
                <div className="p-3 bg-[#251833] border border-[#5a3a7d] rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#e4d4ff]">
                    <span>Magie Profane Majeure ({pr.n}) :</span>
                    <span className="text-[#6fa85b]">+2 PM / niveau</span>
                  </div>
                  <div className="text-[11px] text-[#cbafff]">
                    Formule officielle : <b>(2 × Niveau) + Mod. Mental</b>
                  </div>
                  <div className="text-[11px] text-[#ede3d1] pt-1">
                    Nouveau réservoir max au niveau {pj.level + 1} :{' '}
                    <b className="text-[#f3d48d]">
                      {(pj.level + 1) * 2 + (pr.mag && st ? st.m[pr.mag as keyof typeof st.m] : 0)} PM
                    </b>
                  </div>
                </div>
              ) : ['pretre', 'druide', 'barde', 'forgesort'].includes(pj.profil) ? (
                <div className="p-3 bg-[#1e2333] border border-[#3a497d] rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#cbd7ff]">
                    <span>Magie Divine &amp; Hybride ({pr.n}) :</span>
                    <span className="text-[#6fa85b]">+1 PM / niveau</span>
                  </div>
                  <div className="text-[11px] text-[#cbd7ff]">
                    Formule officielle : <b>(1 × Niveau) + Mod. Mental</b>
                  </div>
                  <div className="text-[11px] text-[#ede3d1] pt-1">
                    Nouveau réservoir max au niveau {pj.level + 1} :{' '}
                    <b className="text-[#f3d48d]">
                      {(pj.level + 1) * 1 + (pr.mag && st ? st.m[pr.mag as keyof typeof st.m] : 0)} PM
                    </b>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#181410] border border-[#3d3023] rounded-lg text-xs text-[#9e907d]">
                  Profil non-magique ({pr.n}) : 0 PM (pas de réserve de mana dépensable).
                </div>
              )}
            </div>

            {/* 3. POINTS DE CAPACITÉ ACCORDÉS */}
            <div className="p-3 bg-[#122410]/30 border border-[#274721] rounded-lg text-xs flex items-center justify-between">
              <span className="text-[#ede3d1]">Points de capacité accordés pour vos voies :</span>
              <span className="font-bold text-[#6fa85b] text-sm">+2 Points</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30251a]">
              <button
                onClick={() => setIsLevelUpOpen(false)}
                className="px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#ede3d1] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleLevelUpConfirm}
                className="px-5 py-2 bg-gradient-to-r from-[#d4a84a] to-[#ab8230] hover:brightness-110 text-black font-bold text-xs rounded-lg shadow-md"
              >
                Valider Niveau {pj.level + 1}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CRÉER OBJET SUR MESURE ==================== */}
      {isCustomItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#181410] border border-[#d4a84a] rounded-xl w-full max-w-md shadow-2xl p-5 space-y-3">
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
              Ajouter un Matériel sur Mesure
            </h3>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Nom de l'objet *
              </label>
              <input
                type="text"
                placeholder="Ex: Tente 3 places, Dague d'argent, Potion de force..."
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none focus:border-[#d4a84a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  min="1"
                  value={customItemQty}
                  onChange={(e) => setCustomItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Type d'objet
                </label>
                <select
                  value={customItemIsConsumable ? '1' : '0'}
                  onChange={(e) => setCustomItemIsConsumable(e.target.value === '1')}
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                >
                  <option value="0">Équipement général</option>
                  <option value="1">Consommable / Munition</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Description &amp; Propriétés
              </label>
              <textarea
                rows={2}
                placeholder="Description sommaire..."
                value={customItemDesc}
                onChange={(e) => setCustomItemDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Annotations
              </label>
              <input
                type="text"
                placeholder="Ex: Roulée sur le sac, étanche..."
                value={customItemNote}
                onChange={(e) => setCustomItemNote(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustomItemOpen(false)}
                className="px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#ede3d1] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCustomItem}
                className="px-5 py-2 bg-[#d4a84a] hover:bg-[#e0b555] text-black font-bold text-xs rounded-lg shadow-md"
              >
                Ajouter au Sac
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CRÉER SORT SUR MESURE ==================== */}
      {isCustomSpellOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#181410] border border-[#654a93] rounded-xl w-full max-w-md shadow-2xl p-5 space-y-3">
            <h3 className="font-serif-co text-lg font-bold text-[#cbafff]">
              Créer un Sortilège sur Mesure
            </h3>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Nom du Sortilège *
              </label>
              <input
                type="text"
                placeholder="Ex: Rayon Glacial, Mur de Flammes..."
                value={customSpellName}
                onChange={(e) => setCustomSpellName(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none focus:border-[#cbafff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Rang du sort (1 à 5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={customSpellRank}
                  onChange={(e) =>
                    setCustomSpellRank(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))
                  }
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                  Portée
                </label>
                <input
                  type="text"
                  placeholder="Ex: 20 m, Contact..."
                  value={customSpellRange}
                  onChange={(e) => setCustomSpellRange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#9e907d] block mb-1">
                Description &amp; Effets
              </label>
              <textarea
                rows={3}
                placeholder="Dégâts infligés, jet de sauvegarde, durée..."
                value={customSpellDesc}
                onChange={(e) => setCustomSpellDesc(e.target.value)}
                className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-xs text-[#ede3d1] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustomSpellOpen(false)}
                className="px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-xs font-semibold text-[#ede3d1] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCustomSpell}
                className="px-5 py-2 bg-[#3a2954] hover:bg-[#4d3670] border border-[#654a93] text-[#dccbff] font-bold text-xs rounded-lg shadow-md"
              >
                Ajouter au Grimoire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FEUILLE DE PERSONNAGE A4 OFFICIELLE BBE ==================== */}
      <BbeOfficialSheetModal
        pj={pj}
        isOpen={isBbePrintOpen}
        onClose={() => setIsBbePrintOpen(false)}
      />

      {/* ==================== UNIVERSAL POP-UP DETAIL MODAL ==================== */}
      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      {/* Discreet Signature */}
      <div className="text-right text-[10px] text-[#4d3d2e] font-mono tracking-wider pt-2 select-none">
        Doudou, F.P
      </div>
    </div>
  );
};
