import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' or 'confirm'
    onConfirm: null,
    onCancel: null
  });

  const showNotification = (title, message) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: null,
      onCancel: null
    });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setModal(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}
      {modal.isOpen && (
        <>
          {modal.type === 'confirm' ? (
            /* Large Center Confirmation Modal */
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
              ></div>
              <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 skeuo-card relative z-10 shadow-2xl animate-scale-in text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center text-[#FFD100] shadow-inner">
                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">{modal.title}</h3>
                    <p className="text-zinc-500 font-medium leading-relaxed">{modal.message}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                    <button 
                      onClick={modal.onCancel}
                      className="flex-1 px-8 py-4 rounded-2xl bg-zinc-50 text-zinc-400 font-black hover:bg-zinc-100 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={modal.onConfirm}
                      className="flex-1 px-8 py-4 rounded-2xl bg-zinc-900 text-[#FFD100] font-black hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Slim Bottom-Right Toast */
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end pointer-events-none">
              <div className="bg-white rounded-[1.5rem] p-3 px-5 skeuo-card shadow-2xl border border-zinc-100 animate-slide-up pointer-events-auto flex items-center gap-4 min-w-[200px] max-w-xs">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner shrink-0 ${
                  (modal.title.toLowerCase().includes('error') || modal.title.toLowerCase().includes('fail')) ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                }`}>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {(modal.title.toLowerCase().includes('error') || modal.title.toLowerCase().includes('fail')) ? 'error' : 'check_circle'}
                  </span>
                </div>
                <p className="text-zinc-800 font-bold text-sm leading-tight">{modal.message}</p>
              </div>
            </div>
          )}
        </>
      )}
    </NotificationContext.Provider>
  );
};
