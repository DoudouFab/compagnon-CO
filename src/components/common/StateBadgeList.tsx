/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, X, Info } from 'lucide-react';
import { ETATS_PREJUDICIABLES, getStateDef, PrejudicialStateDef } from '../../data/etatsData';

interface StateBadgeListProps {
  activeStates: string[];
  onChange?: (newStates: string[]) => void;
  onOpenStateDetail: (stateDef: PrejudicialStateDef) => void;
  compact?: boolean;
  readOnly?: boolean;
  label?: string;
}

export const StateBadgeList: React.FC<StateBadgeListProps> = ({
  activeStates = [],
  onChange,
  onOpenStateDetail,
  compact = false,
  readOnly = false,
  label,
}) => {
  const [isOpenSelector, setIsOpenSelector] = useState(false);

  const toggleState = (name: string) => {
    if (!onChange || readOnly) return;
    if (activeStates.includes(name)) {
      onChange(activeStates.filter((s) => s !== name));
    } else {
      onChange([...activeStates, name]);
    }
  };

  const removeState = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!onChange || readOnly) return;
    onChange(activeStates.filter((s) => s !== name));
  };

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5">
      {label && <span className="text-[11px] font-bold text-[#9e907d] mr-1">{label} :</span>}

      {/* Active State Badges */}
      {activeStates.map((stName) => {
        const def = getStateDef(stName);
        const icon = def?.icon || '⚠️';
        const displayName = def?.name || stName;
        const colorClasses = def
          ? `${def.color} ${def.borderColor} ${def.textColor}`
          : 'bg-[#291712] border-[#8a3328] text-[#ffb0a3]';

        if (compact) {
          return (
            <button
              key={stName}
              type="button"
              onClick={() => def && onOpenStateDetail(def)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer shadow-xs ${colorClasses}`}
              title={`${displayName} : ${def?.impactShort || 'Cliquer pour voir l\'impact'}`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{displayName}</span>
              {!readOnly && (
                <span
                  onClick={(e) => removeState(e, stName)}
                  className="ml-0.5 opacity-60 hover:opacity-100 hover:text-red-400"
                >
                  ×
                </span>
              )}
            </button>
          );
        }

        return (
          <div
            key={stName}
            onClick={() => def && onOpenStateDetail(def)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:scale-102 cursor-pointer shadow-sm ${colorClasses}`}
            title="Cliquer pour afficher la règle officielle en pop-up"
          >
            <span className="text-sm">{icon}</span>
            <span>{displayName}</span>
            {def?.impactShort && (
              <span className="text-[10px] font-normal opacity-80 hidden md:inline">
                ({def.impactShort})
              </span>
            )}
            <Info className="w-3 h-3 opacity-60 hover:opacity-100 ml-0.5" />
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => removeState(e, stName)}
                className="ml-1 p-0.5 rounded hover:bg-black/30 hover:text-red-400 transition-colors"
                title="Retirer cet état"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Button to open state selector */}
      {!readOnly && onChange && (
        <button
          type="button"
          onClick={() => setIsOpenSelector(!isOpenSelector)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border transition-all ${
            activeStates.length > 0
              ? 'bg-[#1b1510] border-[#4a3928] text-[#d4a84a] hover:border-[#d4a84a]'
              : 'bg-[#231c15] border-[#3d3023] text-[#9e907d] hover:text-[#ede3d1] hover:border-[#d4a84a]'
          }`}
          title="Appliquer ou retirer un état préjudiciable"
        >
          <Plus className="w-3 h-3" />
          <span>{activeStates.length === 0 ? 'Ajouter État' : 'Gérer'}</span>
        </button>
      )}

      {/* Dropdown Popover */}
      {isOpenSelector && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpenSelector(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 sm:w-80 p-3 bg-[#181410] border border-[#d4a84a] rounded-xl shadow-2xl space-y-2 animate-fadeIn max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#3d3023]">
              <span className="text-xs font-serif-co font-bold text-[#f3d48d]">
                États Préjudiciables (COF)
              </span>
              <button
                type="button"
                onClick={() => setIsOpenSelector(false)}
                className="text-[#9e907d] hover:text-[#ede3d1]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {ETATS_PREJUDICIABLES.map((st) => {
                const isSelected = activeStates.includes(st.name);

                return (
                  <div
                    key={st.id}
                    onClick={() => toggleState(st.name)}
                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? `${st.color} ${st.borderColor} ${st.textColor} shadow-xs`
                        : 'bg-[#201813] border-[#33251a] text-[#ede3d1] hover:border-[#523d24]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 accent-[#d4a84a] cursor-pointer"
                    />
                    <span className="text-base select-none shrink-0">{st.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold leading-none">{st.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStateDetail(st);
                          }}
                          className="text-[10px] text-[#d4a84a] hover:underline flex items-center gap-0.5"
                          title="Voir règles complètes"
                        >
                          <Info className="w-2.5 h-2.5" /> Règles
                        </button>
                      </div>
                      <p className="text-[10px] text-[#9e907d] mt-1 leading-tight line-clamp-2">
                        {st.impactShort}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
