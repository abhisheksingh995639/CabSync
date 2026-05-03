import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-zinc-200 py-8 px-6 md:px-12 mt-auto">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFD100] rounded flex items-center justify-center font-bold text-zinc-900">c</div>
            <div className="text-2xl font-black text-zinc-900 tracking-tighter">CabSync</div>
          </div>
          <p className="text-zinc-400 text-sm font-medium">
            © 2024 CabSync Technologies.
          </p>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4">
          <a className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer" href="#">Safety Guidelines</a>
          <a className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer" href="#">Privacy Policy</a>
          <a className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer" href="#">Terms of Service</a>
          <a className="text-zinc-500 hover:text-zinc-900 font-medium text-sm transition-colors cursor-pointer" href="#">Help Center</a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
