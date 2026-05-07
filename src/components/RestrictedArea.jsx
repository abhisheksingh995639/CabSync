import React from 'react';
import { Link } from 'react-router-dom';

const RestrictedArea = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-12 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Lock Icon */}
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
           <div className="relative">
              <span className="material-symbols-outlined text-red-500 text-5xl">lock</span>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                 <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
           </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-4 tracking-tight">Restricted Area</h1>
        <p className="text-zinc-500 font-medium leading-relaxed mb-10 text-sm md:text-base">
          You do not have the administrative privileges required to access this section of CabSync.
        </p>

        <div className="space-y-4">
          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 text-[#FFD100] font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/20"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Back to Dashboard
          </button>

          <div className="bg-red-50 py-3 rounded-xl border border-red-100">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                Unauthorized Access Attempt Logged
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestrictedArea;
