import React from 'react';

const BannedScreen = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 fixed inset-0 z-[9999]">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle Red Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 blur-[100px]" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <span className="material-symbols-outlined text-red-500 text-5xl">gavel</span>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Access Restricted</h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-10">
            Your account has been permanently suspended for violating our community guidelines and safety protocols.
          </p>

          <div className="space-y-4">
            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Reason for Ban</p>
              <p className="text-sm font-bold text-red-400">Repeated policy violations (5+ warnings)</p>
            </div>

            <div className="pt-6">
              <p className="text-xs text-zinc-500 mb-6 font-medium">
                If you believe this is a mistake, contact our support team.
              </p>
              <a 
                href="mailto:abhisheksingh995639@gmail.com" 
                className="inline-flex items-center gap-2 bg-zinc-800 text-white font-black px-8 py-3 rounded-2xl hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-700"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedScreen;
