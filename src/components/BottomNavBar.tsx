import { Camera, Upload, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavBarProps {
  onCameraClick?: () => void;
  onUploadClick?: () => void;
}

export const BottomNavBar = ({ onCameraClick, onUploadClick }: BottomNavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleProfileClick = () => {
    navigate("/auth");
  };

  const handleCameraClick = () => {
    if (onCameraClick) {
      onCameraClick();
    } else {
      navigate("/scan?mode=camera");
    }
  };

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      navigate("/scan?mode=upload");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {/* Profile Button - Left */}
        <button
          onClick={handleProfileClick}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
            isActive("/auth") 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profiel</span>
        </button>

        {/* Camera Button - Center (Primary) */}
        <button
          onClick={handleCameraClick}
          className="flex flex-col items-center justify-center gap-1 p-3 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Camera className="h-7 w-7" />
        </button>

        {/* Upload Button - Right */}
        <button
          onClick={handleUploadClick}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs font-medium">Upload</span>
        </button>
      </div>
    </nav>
  );
};
