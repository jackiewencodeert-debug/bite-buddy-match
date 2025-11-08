import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { MenuResults } from "@/components/MenuResults";

const Scan = () => {
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    // Simulate scanning - in production this would trigger camera/upload
    setTimeout(() => {
      setScanned(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </Link>

        {!scanned ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Menu Scannen</h1>
              <p className="text-lg text-muted-foreground">
                Kies hoe je de menukaart wilt uploaden
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 text-center hover:shadow-hover transition-all cursor-pointer" onClick={handleScan}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Camera</h3>
                <p className="text-muted-foreground">
                  Scan direct met je camera
                </p>
              </Card>

              <Card className="p-8 text-center hover:shadow-hover transition-all cursor-pointer" onClick={handleScan}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload</h3>
                <p className="text-muted-foreground">
                  Upload een foto of PDF
                </p>
              </Card>
            </div>

            <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
              <h4 className="font-semibold mb-2">💡 Tips voor beste resultaten:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Zorg voor goede verlichting</li>
                <li>Houd de camera stabiel</li>
                <li>Zorg dat de tekst goed leesbaar is</li>
              </ul>
            </div>
          </div>
        ) : (
          <MenuResults />
        )}
      </div>
    </div>
  );
};

export default Scan;
