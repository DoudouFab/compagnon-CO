import React from 'react';
import {
  Shield,
  Swords,
  Dices,
  Send,
  ExternalLink,
  Download,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Character } from '../types/chroniques';

interface HeaderProps {
  appMode: 'pj' | 'mj';
  setAppMode: (mode: 'pj' | 'mj') => void;
  onOpenDiceRoller: () => void;
  currentPj: Character | null;
  onSendPjToMj: () => void;
  pjsCountInMj: number;
  isTharneaActive: boolean;
  onToggleTharnea: (active: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  setAppMode,
  onOpenDiceRoller,
  currentPj,
  onSendPjToMj,
  pjsCountInMj,
  isTharneaActive,
  onToggleTharnea,
}) => {
  const openOtherInNewTab = () => {
    const targetHash = appMode === 'pj' ? '#mj' : '#pj';
    window.open(window.location.origin + window.location.pathname + targetHash, '_blank');
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-gradient-to-b from-[#2b1510] via-[#1a120d] to-[#0f0d0b] border-b border-[#3d3023] shadow-lg px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl p-0.5 shadow-md flex items-center justify-center transition-all ${
              appMode === 'pj'
                ? 'bg-gradient-to-br from-[#d4a84a] to-[#7a5518] shadow-[#d4a84a]/20'
                : 'bg-gradient-to-br from-[#9c2a2b] to-[#4d1f1c] shadow-[#9c2a2b]/30'
            }`}
          >
            <div className="w-full h-full bg-[#1b140e] rounded-[10px] flex items-center justify-center">
              {appMode === 'pj' ? (
                <Shield className="w-5 h-5 text-[#f3d48d]" />
              ) : (
                <Swords className="w-5 h-5 text-[#ff9d9d]" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-co text-lg sm:text-xl font-bold tracking-wider text-[#f3d48d]">
                Chroniques Oubliées
              </h1>
              <span
                className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                  appMode === 'pj'
                    ? 'bg-[#3d2a17] text-[#d4a84a] border-[#d4a84a]/40'
                    : 'bg-[#4d1f1c] text-[#ff9d9d] border-[#9c2a2b]/50'
                }`}
              >
                {appMode === 'pj' ? 'Application PJ' : 'Application MJ'}
              </span>
            </div>
            <p className="text-[11px] text-[#9e907d] tracking-wide">
              {appMode === 'pj'
                ? 'Fiche de Personnage & Grimoire du Héros'
                : "Console du Meneur de Jeu · Piste d'Initiative & DRS"}
            </p>
          </div>
        </div>

        {/* Center: DUAL APPLICATION SELECTOR */}
        <div className="flex items-center bg-[#120f0c] p-1.5 rounded-xl border border-[#3d3023] shadow-inner">
          <button
            onClick={() => {
              setAppMode('pj');
              window.location.hash = '#pj';
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              appMode === 'pj'
                ? 'bg-gradient-to-r from-[#d4a84a] to-[#ab8230] text-[#1a1208] shadow-md shadow-[#d4a84a]/20 scale-102'
                : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Compagnon Joueur (PJ)</span>
            {currentPj && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-normal truncate max-w-[80px]">
                {currentPj.name.split(' ')[0]}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setAppMode('mj');
              window.location.hash = '#mj';
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              appMode === 'mj'
                ? 'bg-gradient-to-r from-[#9c2a2b] to-[#6d1b1c] text-white shadow-md shadow-[#9c2a2b]/30 scale-102'
                : 'text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Console Meneur (MJ)</span>
            {pjsCountInMj > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono text-[#f3d48d]">
                {pjsCountInMj} PJ
              </span>
            )}
          </button>
        </div>

        {/* THARNÉA EXTENSION TOGGLE */}
        <label
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
            isTharneaActive
              ? 'bg-[#2b1227] border-[#8a2d75] text-[#f7cbf2] shadow-sm shadow-[#8a2d75]/30'
              : 'bg-[#181410] border-[#3d3023] text-[#9e907d] hover:border-[#5a4632]'
          }`}
          title="Active ou désactive le pack supplémentaire Tharnéa (61 monstres du Codex de l'Obscure, artéfacts, 12 bonbons alchimiques et hiérarchie de l'armée)"
        >
          <input
            type="checkbox"
            checked={isTharneaActive}
            onChange={(e) => onToggleTharnea(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#b8389e] rounded cursor-pointer"
          />
          <Sparkles className={`w-3.5 h-3.5 ${isTharneaActive ? 'text-[#ff8fed]' : 'text-[#9e907d]'}`} />
          <span className="font-bold">
            Extension Tharnéa
          </span>
          {isTharneaActive && (
            <span className="text-[9px] bg-[#5e194f] text-[#ffddfa] px-1.5 py-0.2 rounded font-mono font-bold">
              61 Mobs · Actif
            </span>
          )}
        </label>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {appMode === 'pj' && currentPj && (
            <button
              onClick={onSendPjToMj}
              title="Copier/Actualiser ce héros dans l'équipe MJ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#231c15] hover:bg-[#30251c] text-[#f3d48d] border border-[#3d3023] hover:border-[#d4a84a] transition-all"
            >
              <Send className="w-3.5 h-3.5 text-[#d4a84a]" />
              <span className="hidden sm:inline">Transférer au MJ</span>
            </button>
          )}

          <button
            onClick={openOtherInNewTab}
            title={appMode === 'pj' ? 'Ouvrir la Console MJ dans un 2e onglet' : 'Ouvrir la Fiche PJ dans un 2e onglet'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#231c15] hover:bg-[#30251c] text-[#9e907d] hover:text-[#ede3d1] border border-[#3d3023] transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {appMode === 'pj' ? 'Ouvrir MJ séparé' : 'Ouvrir PJ séparé'}
            </span>
          </button>

          <button
            onClick={onOpenDiceRoller}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-b from-[#3a2954] to-[#251739] hover:from-[#49346b] hover:to-[#2e1d47] text-[#dccbff] border border-[#654a93] transition-all shadow-sm"
          >
            <Dices className="w-4 h-4 text-[#dccbff]" />
            <span>Lancer les dés</span>
          </button>
        </div>
      </div>
    </header>
  );
};
