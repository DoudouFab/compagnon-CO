import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { DetailModal, DetailItem } from '../DetailModal';
import { CARAC_LIST, PROFILS, RACES, VOIES_CATALOG, getMod } from '../../data/coDatabase';
import { CaracName, Character } from '../../types/chroniques';

interface PjCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
}

const WIZARD_STEPS = [
  'Identité',
  'Race',
  'Profil',
  'Caractéristiques',
  'Capacités de départ',
  'Équipement',
  'Confirmation',
];

export const PjCreationWizard: React.FC<PjCreationWizardProps> = ({
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [step, setStep] = useState<number>(0);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [player, setPlayer] = useState<string>('');
  const [raceId, setRaceId] = useState<string>('humain');
  const [rcOption, setRcOption] = useState<number>(0);
  const [profilId, setProfilId] = useState<string>('guerrier');
  const [baseStats, setBaseStats] = useState<Record<CaracName, number>>({
    FOR: 14,
    DEX: 12,
    CON: 14,
    INT: 10,
    SAG: 10,
    CHA: 10,
  });
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [startingGear, setStartingGear] = useState<string>('');

  if (!isOpen) return null;

  const currentRace = RACES.find((r) => r.id === raceId) || RACES[0];
  const currentProfil = PROFILS.find((p) => p.id === profilId) || PROFILS[0];
  const raceBonus = currentRace.b || {};

  // Compute stat rules check
  const mods = CARAC_LIST.map((c) => getMod(baseStats[c] || 10));
  const modSum = mods.reduce((a, b) => a + b, 0);
  const pairsCount = CARAC_LIST.map((c) => baseStats[c] || 10).filter((v) => v % 2 === 0).length;

  const availableWays = Object.entries(VOIES_CATALOG).filter(
    ([, v]) => v.profil === profilId || v.profil === 'race:' + raceId
  );

  const handlePickRace = (id: string) => {
    setRaceId(id);
    setRcOption(0);
  };

  const handlePickProfil = (id: string) => {
    setProfilId(id);
    setSelectedCaps([]);
    const profObj = PROFILS.find((p) => p.id === id);
    if (profObj) {
      setStartingGear(profObj.eq);
    }
  };

  const handleStatChange = (c: CaracName, val: number) => {
    setBaseStats((prev) => ({
      ...prev,
      [c]: Math.max(3, Math.min(18, val)),
    }));
  };

  const toggleCap = (wayKey: string) => {
    if (selectedCaps.includes(wayKey)) {
      setSelectedCaps(selectedCaps.filter((k) => k !== wayKey));
    } else if (selectedCaps.length < 2) {
      setSelectedCaps([...selectedCaps, wayKey]);
    }
  };

  const handleNext = () => {
    if (step === 0 && !name.trim()) {
      alert('Veuillez donner un nom à votre héros.');
      return;
    }
    if (step === 2 && !startingGear) {
      setStartingGear(currentProfil.eq);
    }
    if (step === 4 && selectedCaps.length < 2) {
      if (
        !confirm(
          "Vous n'avez pas sélectionné vos 2 capacités de rang 1 recommandées. Continuer quand même ?"
        )
      ) {
        return;
      }
    }
    if (step === 6) {
      finalizeCreation();
      return;
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const finalizeCreation = () => {
    const modCon = getMod(baseStats.CON + (raceBonus.CON || 0));
    const hpInit = currentProfil.dv + modCon;

    const newChar: Character = {
      version: '1.0',
      id: 'pj_' + Date.now(),
      name: name.trim() || 'Aventurier sans nom',
      player: player.trim(),
      race: raceId,
      rcOption,
      profil: profilId,
      level: 1,
      base: { ...baseStats },
      rb: { ...raceBonus },
      hpBase: hpInit,
      hpMaxAuto: hpInit,
      hpMaxManual: null,
      hp: hpInit,
      pmMaxManual: null,
      pm: currentProfil.mag
        ? Math.max(1, 2 + getMod(baseStats[currentProfil.mag] + (raceBonus[currentProfil.mag] || 0)))
        : 0,
      ptsCap: 0,
      caps: selectedCaps.map((k) => ({ wayKey: k, rank: 1 })),
      armes: [
        {
          n: 'Dague',
          t: 'Contact',
          dm: '1d4',
          crit: '20',
          por: '5 m',
          props: 'Légère',
          note: 'Arme de base',
        },
      ],
      inventaire: [
        {
          n: 'Sac à dos renforcé',
          q: 1,
          desc: 'Toile imperméable',
          note: startingGear || currentProfil.eq,
        },
        {
          n: 'Tente (2 couchages)',
          q: 1,
          desc: 'Tente de bivouac standard',
          note: 'Couchage transportable',
        },
        {
          n: 'Potion de soins légers',
          q: 1,
          desc: 'Restaure 1d8 PV',
          isConsumable: true,
          note: 'Urgence',
        },
      ],
      customSorts: [],
      arm: '',
      bou: '',
      bonus: { pv: 0, def: 0, init: 0 },
      persoTraits: `${currentRace.traits} Vocation : ${currentProfil.traits}`,
    };

    onCharacterCreated(newChar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 animate-fadeIn">
      <div className="bg-[#181410] border border-[#d4a84a] rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#3d3023] flex items-center justify-between bg-gradient-to-r from-[#291712] to-[#181410]">
          <div>
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">
              Création de Personnage · Étape {step + 1}/7 : {WIZARD_STEPS[step]}
            </h3>
            <p className="text-xs text-[#9e907d]">Règles officielles Chroniques Oubliées</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-[#0f0d0b]">
          <div
            className="h-full bg-gradient-to-r from-[#d4a84a] to-[#f3d48d] transition-all duration-300"
            style={{ width: `${((step + 1) / 7) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 0: Identité */}
          {step === 0 && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9e907d] block mb-1">
                  Nom du Héros *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sire Thomas, Grommash, Dame Éléonore..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-[#ede3d1] focus:border-[#d4a84a] outline-none text-base font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#9e907d] block mb-1">
                  Nom du Joueur (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Julien, Sophie..."
                  value={player}
                  onChange={(e) => setPlayer(e.target.value)}
                  className="w-full px-3 py-2 bg-[#231c15] border border-[#3d3023] rounded-lg text-[#ede3d1] focus:border-[#d4a84a] outline-none text-sm"
                />
              </div>

              <div className="p-4 bg-[#231c15] rounded-lg border border-[#3d3023] text-xs text-[#9e907d] leading-relaxed">
                💡 Cet assistant en 7 étapes va vous guider pour créer un personnage légal et
                équilibré conforme aux règles du DRS Chroniques Oubliées.
              </div>
            </div>
          )}

          {/* STEP 1: Race */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-[#9e907d]">
                Choisissez votre ascendance. Les bonus raciaux s'appliqueront à vos scores finaux.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RACES.map((race) => {
                  const isSelected = race.id === raceId;
                  return (
                    <div
                      key={race.id}
                      onClick={() => handlePickRace(race.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#2d2217] border-[#d4a84a] shadow-md shadow-[#d4a84a]/10'
                          : 'bg-[#1e1913] border-[#3d3023] hover:border-[#85652e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem({ type: 'race', data: race });
                          }}
                          className="flex items-center gap-1.5 text-left group cursor-pointer"
                          title="Cliquer pour afficher la fiche officielle complète (co-drs.org)"
                        >
                          <b className="font-serif-co text-base text-[#f3d48d] group-hover:text-[#ffe099] flex items-center gap-1.5 underline-offset-2 hover:underline">
                            {race.n}
                            <Info className="w-4 h-4 text-[#d4a84a] opacity-75 group-hover:opacity-100" />
                          </b>
                        </button>
                        <span className="text-xs font-mono font-bold text-[#6fa85b] bg-[#122410] px-2 py-0.5 rounded border border-[#274721]">
                          {race.t}
                        </span>
                      </div>
                      <p className="text-xs text-[#9e907d] mb-2">{race.d}</p>
                      <div className="text-xs text-[#ede3d1] space-y-1">
                        {race.cap.map((c, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="text-[#d4a84a] font-bold">• {c.n} :</span> {c.t}
                          </div>
                        ))}
                      </div>

                      {/* Racial Options (ex: Demi-Elfe, Gnome) */}
                      {isSelected && race.opts && (
                        <div className="mt-3 pt-2 border-t border-[#3d3023] space-y-1.5">
                          <span className="text-[10px] font-bold text-[#f3d48d] uppercase tracking-wider block">
                            Choix d'héritage :
                          </span>
                          {race.opts.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRcOption(oIdx);
                              }}
                              className={`p-2 rounded text-xs border ${
                                rcOption === oIdx
                                    ? 'bg-[#3b2a1a] border-[#d4a84a] text-[#f3d48d]'
                                  : 'bg-[#181410] border-[#30251a] text-[#9e907d]'
                              }`}
                            >
                              <b>{opt.n} :</b> {opt.t}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Profil (Classe) */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-[#9e907d]">
                Le profil détermine votre rôle, votre dé de vie, vos compétences et votre accès à
                la magie.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {PROFILS.map((prof) => {
                  const isSelected = prof.id === profilId;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => handlePickProfil(prof.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#2d2217] border-[#d4a84a] shadow-md shadow-[#d4a84a]/10'
                          : 'bg-[#1e1913] border-[#3d3023] hover:border-[#85652e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem({ type: 'profil', data: prof });
                          }}
                          className="flex items-center gap-1.5 text-left group cursor-pointer"
                          title="Cliquer pour afficher la fiche officielle complète de la classe (co-drs.org)"
                        >
                          <b className="font-serif-co text-base text-[#f3d48d] group-hover:text-[#ffe099] flex items-center gap-1.5 underline-offset-2 hover:underline">
                            {prof.n}
                            <Info className="w-4 h-4 text-[#cbafff] opacity-75 group-hover:opacity-100" />
                          </b>
                        </button>
                        <span className="text-xs font-mono font-bold text-[#cbafff] bg-[#291b3b] px-2 py-0.5 rounded border border-[#492d6e]">
                          d{prof.dv} {prof.mag ? `• Magie ${prof.mag}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#ede3d1] mb-1.5 italic">« {prof.traits} »</p>
                      <div className="text-[11px] text-[#9e907d] space-y-1">
                        <div>
                          <b className="text-[#ede3d1]">Armes &amp; armures :</b> {prof.ar}
                        </div>
                        <div>
                          <b className="text-[#ede3d1]">Départ :</b> {prof.eq}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Caractéristiques */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-[#231c15] rounded-lg border border-[#3d3023] text-xs">
                <b className="text-[#f3d48d]">Règle de Répartition officielle :</b> 6 points de
                modificateurs à distribuer (ex: +3, +2, +1, +0, +0, +0), avec exactement{' '}
                <b>3 scores pairs</b> et <b>3 scores impairs</b>, maximum 18 avant bonus raciaux.
              </div>

              {/* Stat Validation Banner */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-[#181410] border border-[#3d3023] text-xs">
                <div>
                  Somme des Modificateurs :{' '}
                  <b className={modSum === 6 ? 'text-[#6fa85b]' : 'text-[#cf5544]'}>
                    {modSum} / 6
                  </b>
                </div>
                <div>
                  Valeurs paires de base :{' '}
                  <b className={pairsCount === 3 ? 'text-[#6fa85b]' : 'text-[#cf5544]'}>
                    {pairsCount} / 3
                  </b>
                </div>
                <div>
                  {modSum === 6 && pairsCount === 3 ? (
                    <span className="text-[#6fa85b] font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Répartition conforme !
                    </span>
                  ) : (
                    <span className="text-[#cf5544] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Ajustement requis
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of 6 stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CARAC_LIST.map((c) => {
                  const baseVal = baseStats[c] || 10;
                  const rb = raceBonus[c] || 0;
                  const total = baseVal + rb;
                  const mod = getMod(total);
                  const isEven = baseVal % 2 === 0;

                  return (
                    <div
                      key={c}
                      className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023] text-center"
                    >
                      <span className="text-xs font-bold text-[#9e907d] uppercase tracking-wider block">
                        {c}
                      </span>
                      <div className="flex items-center justify-center gap-2 my-2">
                        <button
                          type="button"
                          onClick={() => handleStatChange(c, baseVal - 1)}
                          className="w-7 h-7 rounded bg-[#181410] border border-[#3d3023] text-sm font-bold text-[#ede3d1] hover:border-[#d4a84a]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="3"
                          max="18"
                          value={baseVal}
                          onChange={(e) => handleStatChange(c, parseInt(e.target.value) || 10)}
                          className="w-14 text-center font-serif-co font-bold text-xl text-[#f3d48d] bg-[#120f0c] border border-[#3d3023] rounded py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleStatChange(c, baseVal + 1)}
                          className="w-7 h-7 rounded bg-[#181410] border border-[#3d3023] text-sm font-bold text-[#ede3d1] hover:border-[#d4a84a]"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs font-bold text-[#6fa85b]">
                        Mod : {mod >= 0 ? `+${mod}` : mod}
                      </div>
                      <div className="text-[10px] text-[#9e907d] mt-1">
                        {rb !== 0 && `(Race ${rb > 0 ? `+${rb}` : rb} = ${total}) • `}
                        {isEven ? 'Pair' : 'Impair'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Capacités de départ */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#9e907d]">
                  Choisissez <b>2 capacités de Rang 1</b> pour démarrer l'aventure :
                </p>
                <span className="text-xs font-bold text-[#f3d48d] bg-[#291e12] px-2 py-1 rounded border border-[#d4a84a]/40">
                  {selectedCaps.length} / 2 sélectionnées
                </span>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {availableWays.map(([wayKey, way]) => {
                  const r1 = way.r[0];
                  if (!r1) return null;
                  const isSelected = selectedCaps.includes(wayKey);

                  return (
                    <div
                      key={wayKey}
                      onClick={() => toggleCap(wayKey)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#2f2214] border-[#d4a84a] shadow-sm'
                          : 'bg-[#1e1913] border-[#3d3023] hover:border-[#634e2c]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9e907d] block">
                            {way.nom}
                          </span>
                          <b className="font-serif-co text-sm text-[#f3d48d]">{r1.n}</b>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {r1.L ? (
                            <span className="text-[10px] font-bold bg-[#4a1c1d] text-[#ffb8b8] px-1.5 py-0.5 rounded">
                              Limitée
                            </span>
                          ) : null}
                          {r1.S ? (
                            <span className="text-[10px] font-bold bg-[#1e2f47] text-[#b0d7ff] px-1.5 py-0.5 rounded">
                              Sort
                            </span>
                          ) : null}
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-[#d4a84a] border-[#d4a84a] text-black'
                                : 'border-[#4a3928]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[#ede3d1] mt-1">{r1.t}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Équipement */}
          {step === 5 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9e907d] block">
                Équipement de départ conseillé (modifiable) :
              </label>
              <textarea
                rows={5}
                value={startingGear}
                onChange={(e) => setStartingGear(e.target.value)}
                className="w-full p-3 bg-[#231c15] border border-[#3d3023] rounded-lg text-[#ede3d1] focus:border-[#d4a84a] outline-none text-sm font-sans"
              />
              <p className="text-xs text-[#9e907d]">
                Cet équipement sera directement chargé dans votre sacoche de départ. Vous pourrez en
                rajouter à tout moment depuis le Catalogue dans votre fiche.
              </p>
            </div>
          )}

          {/* STEP 6: Confirmation */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#291712] to-[#181410] border border-[#d4a84a] rounded-xl text-center">
                <Sparkles className="w-6 h-6 text-[#d4a84a] mx-auto mb-1" />
                <h3 className="font-serif-co text-2xl font-bold text-[#f3d48d]">
                  {name || 'Héros sans nom'}
                </h3>
                <p className="text-sm text-[#9e907d]">
                  {currentRace.n} • {currentProfil.n} • Niveau 1
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                  <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                    Points de Vie (PV)
                  </small>
                  <b className="font-serif-co text-xl text-[#f3d48d]">
                    {currentProfil.dv + getMod(baseStats.CON + (raceBonus.CON || 0))} PV
                  </b>
                  <span className="text-[10px] text-[#9e907d] block mt-0.5">
                    (d{currentProfil.dv} max + CON)
                  </span>
                </div>

                <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                  <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                    Défense (DEF)
                  </small>
                  <b className="font-serif-co text-xl text-[#ede3d1]">
                    {10 +
                      getMod(baseStats.DEX + (raceBonus.DEX || 0)) +
                      (currentRace.defb || 0)}
                  </b>
                  <span className="text-[10px] text-[#9e907d] block mt-0.5">
                    (10 + DEX{currentRace.defb ? ' + race' : ''})
                  </span>
                </div>

                <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                  <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                    Initiative
                  </small>
                  <b className="font-serif-co text-xl text-[#ede3d1]">
                    {baseStats.DEX + (raceBonus.DEX || 0)}
                  </b>
                  <span className="text-[10px] text-[#9e907d] block mt-0.5">(Score de DEX)</span>
                </div>

                <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                  <small className="text-[10px] text-[#9e907d] uppercase font-bold block">
                    Déplacement
                  </small>
                  <b className="font-serif-co text-xl text-[#ede3d1]">10 m</b>
                  <span className="text-[10px] text-[#9e907d] block mt-0.5">Course : 20 m</span>
                </div>
              </div>

              {/* Selected capabilities recap */}
              <div className="bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
                <b className="text-xs text-[#f3d48d] uppercase tracking-wider block mb-1">
                  Capacités de départ choisies :
                </b>
                <div className="text-xs text-[#ede3d1] space-y-1">
                  {selectedCaps.map((k) => (
                    <div key={k}>
                      • <b>{VOIES_CATALOG[k]?.r[0]?.n}</b> ({VOIES_CATALOG[k]?.nom}) :{' '}
                      <span className="text-[#9e907d]">{VOIES_CATALOG[k]?.r[0]?.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-[#3d3023] bg-[#120f0c] flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] rounded-lg text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] rounded-lg text-xs font-semibold"
            >
              Annuler
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-[#d4a84a] to-[#b38833] hover:from-[#e0b555] hover:to-[#c4973c] text-black font-bold rounded-lg text-xs shadow-md transition-all"
          >
            {step === 6 ? (
              <>
                <Check className="w-4 h-4" /> Créer mon Héros
              </>
            ) : (
              <>
                Continuer <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pop-up modal pour afficher les infos complètes de la race ou du profil */}
      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onAction={(action, payload) => {
          if (action === 'selectRace' && payload?.id) {
            handlePickRace(payload.id);
          } else if (action === 'selectProfil' && payload?.id) {
            handlePickProfil(payload.id);
          }
        }}
      />
    </div>
  );
};
