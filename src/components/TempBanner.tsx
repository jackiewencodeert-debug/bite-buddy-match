import logoGrid from "@/assets/logo-grid.png";

export const TempBanner = () => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800 py-3 px-4">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
        {/* Logo - cropped to show middle-top logo from grid */}
        <div className="w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
          <div 
            className="w-[300%] h-[300%] -ml-[100%] -mt-0"
            style={{
              backgroundImage: `url(${logoGrid})`,
              backgroundSize: '100%',
              backgroundPosition: 'center top',
            }}
          />
        </div>
        
        {/* Text */}
        <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          BiteBuddy
        </span>
      </div>
    </div>
  );
};
