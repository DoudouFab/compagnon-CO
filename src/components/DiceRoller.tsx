import React, { useState } from 'react';
import { Dices, RotateCcw, X } from 'lucide-react';

interface DiceRollHistory {
  id: string;
  timestamp: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  isCritical?: boolean;
  isFumble?: boolean;
  label?: string;
}

interface DiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, onClose }) => {
  const [numDice, setNumDice] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [history, setHistory] = useState<DiceRollHistory[]>([]);
  const [latestRoll, setLatestRoll] = useState<DiceRollHistory | null>(null);

  if (!isOpen) return null;

  const rollDice = (sides: number) => {
    const rolls: number[] = [];
    for (let i = 0; i < Math.max(1, numDice); i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const sum = rolls.reduce((acc, v) => acc + v, 0);
    const total = sum + modifier;

    const isCritical = sides === 20 && rolls.includes(20);
    const isFumble = sides === 20 && rolls.includes(1);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newRoll: DiceRollHistory = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      formula: `${numDice}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
      rolls,
      modifier,
      total,
      isCritical,
      isFumble,
    };

    setLatestRoll(newRoll);
    setHistory((prev) => [newRoll, ...prev].slice(0, 15));
  };

  const diceTypes = [4, 6, 8, 10, 12, 20, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#181410] border border-[#d4a84a] rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#3d3023] flex items-center justify-between bg-gradient-to-r from-[#291712] to-[#181410]">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-[#d4a84a]" />
            <h3 className="font-serif-co text-lg font-bold text-[#f3d48d]">Lancer de Dés Virtuels</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#9e907d] hover:text-[#ede3d1] hover:bg-[#231c15] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Controls: Dice count and modifier */}
          <div className="grid grid-cols-2 gap-4 bg-[#231c15] p-3 rounded-lg border border-[#3d3023]">
            <div>
              <label className="text-[11px] font-bold text-[#9e907d] uppercase tracking-wider block mb-1">
                Nombre de dés
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNumDice((n) => Math.max(1, n - 1))}
                  className="w-8 h-8 rounded bg-[#181410] text-[#ede3d1] border border-[#3d3023] hover:border-[#d4a84a] font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numDice}
                  onChange={(e) => setNumDice(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center font-bold text-[#f3d48d] bg-[#120f0c] border border-[#3d3023] rounded py-1"
                />
                <button
                  type="button"
                  onClick={() => setNumDice((n) => Math.min(10, n + 1))}
                  className="w-8 h-8 rounded bg-[#181410] text-[#ede3d1] border border-[#3d3023] hover:border-[#d4a84a] font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#9e907d] uppercase tracking-wider block mb-1">
                Modificateur (+ / -)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModifier((m) => m - 1)}
                  className="w-8 h-8 rounded bg-[#181410] text-[#ede3d1] border border-[#3d3023] hover:border-[#d4a84a] font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  value={modifier}
                  onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                  className="w-14 text-center font-bold text-[#f3d48d] bg-[#120f0c] border border-[#3d3023] rounded py-1"
                />
                <button
                  type="button"
                  onClick={() => setModifier((m) => m + 1)}
                  className="w-8 h-8 rounded bg-[#181410] text-[#ede3d1] border border-[#3d3023] hover:border-[#d4a84a] font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Dice Buttons */}
          <div>
            <label className="text-[11px] font-bold text-[#9e907d] uppercase tracking-wider block mb-2">
              Sélectionnez un dé à lancer
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {diceTypes.map((sides) => (
                <button
                  key={sides}
                  onClick={() => rollDice(sides)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all active:scale-95 ${
                    sides === 20
                      ? 'bg-gradient-to-b from-[#4d1f1c] to-[#2b1510] border-[#9c2a2b] hover:border-[#d4a84a] text-[#f3d48d]'
                      : 'bg-[#231c15] border-[#3d3023] hover:border-[#d4a84a] hover:bg-[#2e241c] text-[#ede3d1]'
                  }`}
                >
                  <span className="font-serif-co font-bold text-base">d{sides}</span>
                  <span className="text-[10px] text-[#9e907d] mt-0.5">
                    {numDice}d{sides}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Latest Result Display */}
          {latestRoll && (
            <div
              className={`p-4 rounded-xl border text-center transition-all ${
                latestRoll.isCritical
                  ? 'bg-gradient-to-r from-[#21381e] to-[#122410] border-[#6fa85b] shadow-lg shadow-[#6fa85b]/20'
                  : latestRoll.isFumble
                  ? 'bg-gradient-to-r from-[#3e1717] to-[#250d0d] border-[#cf5544] shadow-lg shadow-[#cf5544]/20'
                  : 'bg-[#231c15] border-[#d4a84a]/50'
              }`}
            >
              <div className="text-xs uppercase tracking-widest text-[#9e907d] mb-1">
                Résultat pour : <b className="text-[#ede3d1]">{latestRoll.formula}</b>
              </div>
              <div className="text-4xl font-black font-serif-co text-[#f3d48d] my-1">
                {latestRoll.total}
              </div>
              <div className="text-xs text-[#9e907d]">
                Détail : [{latestRoll.rolls.join(' + ')}]
                {latestRoll.modifier !== 0 && ` ${latestRoll.modifier > 0 ? `+ ${latestRoll.modifier}` : `- ${Math.abs(latestRoll.modifier)}`}`}
              </div>

              {latestRoll.isCritical && (
                <div className="mt-2 text-xs font-bold text-[#6fa85b] uppercase tracking-wider bg-[#0f1f0e] py-1 px-3 rounded-full inline-block">
                  ⭐ Réussite Critique ! (20 Naturel)
                </div>
              )}
              {latestRoll.isFumble && (
                <div className="mt-2 text-xs font-bold text-[#cf5544] uppercase tracking-wider bg-[#220d0d] py-1 px-3 rounded-full inline-block">
                  💀 Échec Critique / Maladresse ! (1 Naturel)
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#9e907d] uppercase tracking-wider">
                  Historique récent
                </span>
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-[#9e907d] hover:text-[#ede3d1] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Effacer
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between bg-[#1f1812] px-3 py-1.5 rounded border border-[#30251a] text-xs"
                  >
                    <span className="text-[#9e907d]">{h.timestamp}</span>
                    <span className="text-[#ede3d1] font-mono">{h.formula}</span>
                    <span className="font-bold text-[#f3d48d]">
                      = {h.total}{' '}
                      <span className="text-[10px] text-[#9e907d] font-normal">
                        ({h.rolls.join(',')})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#3d3023] bg-[#120f0c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#231c15] hover:bg-[#32271d] border border-[#3d3023] text-[#ede3d1] rounded-md text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
