import pjCatalog from './pj_catalog.json';
import bestiaireRaw from './bestiaire.json';
import equipementsRaw from './equipements.json';
import reglesEtatsRaw from './regles_etats.json';
import {
  CaracName,
  Character,
  ClassWay,
  Equipment,
  Monster,
  PrejudicialState,
  ProfilData,
  RaceData,
  RuleChapter,
  SpellItem,
} from '../types/chroniques';

import { OFFICIAL_DRS_PROFILS, OFFICIAL_DRS_RACES } from './drsRacesAndProfils';

export const CARAC_LIST: CaracName[] = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA'];

export const PROFILS: ProfilData[] = OFFICIAL_DRS_PROFILS;
export const RACES: RaceData[] = OFFICIAL_DRS_RACES;
export const ARMES_CATALOG: Equipment[] = pjCatalog.armes as Equipment[];
export const ARMURES_CATALOG: Equipment[] = pjCatalog.armures as Equipment[];
export const BIENS_CATALOG: Equipment[] = pjCatalog.biens as Equipment[];
import allVoiesDRS from './allVoiesDRS.json';
import {
  THARNEA_MONSTERS,
  THARNEA_ARTIFACTS,
  THARNEA_LORE_RULES,
} from './tharneaSupplement';

export { THARNEA_MONSTERS, THARNEA_ARTIFACTS, THARNEA_LORE_RULES };

export const VOIES_CATALOG: Record<string, ClassWay> = allVoiesDRS as Record<string, ClassWay>;

// Construction du Grimoire exhaustif complet (176+ sorts issus de toutes les voies magiques)
function buildFullSpellsCatalog(): SpellItem[] {
  const map = new Map<string, SpellItem>();

  // 1. Sorts initiaux du catalogue
  ((pjCatalog.sortsCatalogue as SpellItem[]) || []).forEach((s) => {
    map.set(s.n.toLowerCase().trim(), s);
  });

  // 2. Extraire toutes les capacités de rangs magiques ou profils magiques
  const magicProfiles = [
    'magicien',
    'ensorceleur',
    'necromancien',
    'pretre',
    'druide',
    'barde',
    'forgesort',
  ];

  for (const [, voie] of Object.entries(VOIES_CATALOG)) {
    const isMagicProf = magicProfiles.includes(voie.profil);
    voie.r.forEach((rank, idx) => {
      const isSpell = rank.S === 1 || isMagicProf;
      if (isSpell) {
        const key = rank.n.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            n: rank.n,
            voie: voie.nom,
            rang: idx + 1,
            portee: rank.t.includes('mètre') ? 'Portée' : 'Vue / Contact',
            duree: rank.t.includes('tour') ? '1 combat' : 'Instantané',
            L: rank.L || 0,
            S: 1,
            t: rank.t,
          });
        }
      }
    });
  }

  // 3. Sorts emblématiques supplémentaires
  const extras: SpellItem[] = [
    {
      n: 'Hâte',
      voie: 'Magie des arcanes',
      rang: 3,
      portee: 'Personnelle',
      duree: '1d6 tours',
      L: 1,
      S: 1,
      t: 'Accélère le métabolisme : octroie une action supplémentaire par tour (attaque ou mouvement).',
    },
    {
      n: 'Désintégration',
      voie: 'Magie destructrice',
      rang: 5,
      portee: '20 m',
      duree: 'Instantané',
      L: 1,
      S: 1,
      t: 'Rayon mortel infligeant [5d6 + INT] DM bruts. Réduit en poussière si la cible tombe à 0 PV.',
    },
  ];

  extras.forEach((s) => {
    const key = s.n.toLowerCase().trim();
    if (!map.has(key)) map.set(key, s);
  });

  return Array.from(map.values()).sort((a, b) => a.rang - b.rang || a.n.localeCompare(b.n));
}

export const SORTS_CATALOG: SpellItem[] = buildFullSpellsCatalog();

export const BESTIAIRE: Monster[] = bestiaireRaw as Monster[];
export const EQUIPEMENTS: Equipment[] = equipementsRaw as Equipment[];
export const ETATS: PrejudicialState[] = reglesEtatsRaw.etats as PrejudicialState[];
export const REGLES: RuleChapter[] = reglesEtatsRaw.regles as RuleChapter[];

export function getMod(v: number): number {
  return Math.floor((v - 10) / 2);
}

export function calcStats(p: Character | null) {
  if (!p) return null;
  const m: Record<CaracName, number> = {
    FOR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    SAG: 0,
    CHA: 0,
  };

  CARAC_LIST.forEach((c) => {
    const total = (p.base[c] || 10) + (p.rb[c] || 0);
    m[c] = getMod(total);
  });

  const pr: ProfilData = PROFILS.find((x) => x.id === p.profil) || {
    id: p.profil,
    n: p.profil,
    dv: 8,
    traits: '',
    eq: '',
    ar: '',
  };
  const rc: RaceData = RACES.find((x) => x.id === p.race) || {
    id: p.race,
    n: p.race,
    defb: 0,
    d: '',
    t: '',
    traits: '',
    cap: [],
    b: {},
  };
  const arm = EQUIPEMENTS.find((a) => a.n === p.arm && a.cat?.includes('Armure')) ||
              ARMURES_CATALOG.find((a) => a.n === p.arm);
  const bou = EQUIPEMENTS.find((a) => a.n === p.bou && a.cat?.includes('Bouclier')) ||
              ARMURES_CATALOG.find((a) => a.n === p.bou);

  const def =
    10 +
    m.DEX +
    (arm?.def || 0) +
    (bou?.def || 0) +
    (rc.defb || 0) +
    (p.bonus?.def || 0);

  const init = (p.base.DEX || 10) + (p.rb.DEX || 0) + (p.bonus?.init || 0);
  const ct = p.level + m.FOR;
  const di = p.level + m.DEX;
  const prMag = pr.mag as CaracName | undefined;
  const mg = prMag ? p.level + m[prMag] : null;

  // Calcul Points de Mana Max selon règles officielles Chroniques Oubliées :
  // - Lanceurs profanes majeurs (Magicien, Ensorceleur, Nécromancien) : (2 x Niveau) + Mod. Magie
  // - Lanceurs divins et hybrides (Prêtre, Druide, Barde, Forgesort) : (1 x Niveau) + Mod. Magie
  // - Profils sans magie : 0 PM (ou selon règle optionnelle de table)
  let pmCalculated = 0;
  if (['magicien', 'ensorceleur', 'necromancien'].includes(p.profil)) {
    pmCalculated = Math.max(1, p.level * 2 + (prMag ? m[prMag] : 0));
  } else if (['pretre', 'druide', 'barde', 'forgesort'].includes(p.profil)) {
    pmCalculated = Math.max(1, p.level * 1 + (prMag ? m[prMag] : 0));
  } else if (prMag) {
    pmCalculated = Math.max(0, p.level + (m[prMag] || 0));
  }

  const pmMax =
    p.pmMaxManual !== null && p.pmMaxManual !== undefined
      ? p.pmMaxManual
      : pmCalculated;

  // Déplacement officiel : 10 mètres par action de mouvement (20 m au pas de course)
  let moveBase = 10;
  if (p.profil === 'moine') moveBase += 5; // Bonus voie du vent moine
  const deplacement = (p.moveBonus || 0) + moveBase;

  const hpMax =
    (p.hpMaxManual ?? p.hpMaxAuto ?? p.hpBase ?? 10) + (p.bonus?.pv || 0);

  return {
    m,
    def,
    init,
    ct,
    di,
    mg,
    mag: prMag,
    hpMax,
    pmMax,
    deplacement,
  };
}

export const SAMPLE_HERO: Character = {
  version: '1.0',
  id: 'pj_sample_1',
  name: 'Sire Thomas de Montmirail',
  player: 'Fabien',
  race: 'humain',
  rcOption: 0,
  profil: 'chevalier',
  level: 1,
  base: { FOR: 14, DEX: 12, CON: 14, INT: 10, SAG: 10, CHA: 13 },
  rb: {},
  hpBase: 12,
  hpMaxAuto: 12,
  hpMaxManual: null,
  hp: 12,
  pmMaxManual: null,
  pm: 0,
  ptsCap: 0,
  caps: [
    { wayKey: 'chevalier-guerre', rank: 1 },
    { wayKey: 'chevalier-heros', rank: 1 },
  ],
  armes: [
    { n: 'Épée longue', t: 'Contact', dm: '1d8', crit: '20', por: '-', props: 'Polyvalente classique', note: 'Lame forgée au blason royal' },
    { n: 'Dague', t: 'Contact', dm: '1d4', crit: '20', por: '5 m', props: 'Légère, jet possible', note: 'À la botte droite' }
  ],
  inventaire: [
    { n: 'Demi-plaque', desc: "Plaques d'acier articulées", q: 1, isConsumable: false, note: 'Équipée' },
    { n: 'Grand bouclier', desc: "Grand écu métallique d'infanterie", q: 1, isConsumable: false, note: 'Équipé (+2 DEF)' },
    { n: 'Sac à dos renforcé', desc: 'Toile imperméabilisée', q: 1, isConsumable: false, note: 'Barda principal' },
    { n: 'Tente (2 couchages)', desc: 'Tente de bivouac standard pour 2 compagnons', q: 1, isConsumable: false, note: 'Roulée au dos' },
    { n: 'Potion de soins légers', desc: 'Restaure 1d8 PV immédiatement', q: 2, isConsumable: true, note: 'Ceinture' },
    { n: 'Rations de voyage (1 sem.)', desc: 'Vivres de longue conservation', q: 7, isConsumable: true, note: '1 portion/jour' },
    { n: 'Gourde de cuir (1L)', desc: "Pleine d'eau fraîche", q: 1, isConsumable: true, note: 'Pleine' },
    { n: 'Torches de résine', desc: '1h éclairage', q: 3, isConsumable: true, note: 'Amadou sec' },
    { n: 'Briquet à silex et amadou', desc: 'Allumage rapide', q: 1, isConsumable: false, note: 'Poche étanche' }
  ],
  customSorts: [],
  arm: 'Demi-plaque',
  bou: 'Grand bouclier',
  bonus: { pv: 0, def: 0, init: 0 },
  persoTraits: 'Chevalier errant au code d honneur rigoureux. Protecteur des innocents et loyal envers ses compagnons.'
};
