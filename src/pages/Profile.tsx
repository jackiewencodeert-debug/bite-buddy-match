import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const allergies = [
  { id: "noten", label: "Noten" },
  { id: "gluten", label: "Gluten" },
  { id: "lactose", label: "Lactose" },
  { id: "schaaldieren", label: "Schaaldieren" },
  { id: "vis", label: "Vis" },
  { id: "eieren", label: "Eieren" },
  { id: "soja", label: "Soja" },
  { id: "sulfiet", label: "Sulfiet" },
];

const preferences = [
  { id: "vegetarisch", label: "Vegetarisch" },
  { id: "veganistisch", label: "Veganistisch" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

const Profile = () => {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Profiel opgeslagen! ✓",
      description: "Je voorkeuren zijn succesvol bijgewerkt.",
    });
  };

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const togglePreference = (id: string) => {
    setSelectedPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
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

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Mijn Profiel</h1>
            <p className="text-lg text-muted-foreground">
              Stel je allergieën en voorkeuren in voor gepersonaliseerde matches
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                🚫 Allergieën
              </h2>
              <p className="text-muted-foreground mb-6">
                Selecteer alle allergieën waar we rekening mee moeten houden
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {allergies.map((allergy) => (
                  <div key={allergy.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={allergy.id}
                      checked={selectedAllergies.includes(allergy.id)}
                      onCheckedChange={() => toggleAllergy(allergy.id)}
                    />
                    <Label
                      htmlFor={allergy.id}
                      className="text-base cursor-pointer flex-1"
                    >
                      {allergy.label}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                🥗 Voorkeuren
              </h2>
              <p className="text-muted-foreground mb-6">
                Kies je dieet en voedselvoorkeuren
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {preferences.map((preference) => (
                  <div key={preference.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={preference.id}
                      checked={selectedPreferences.includes(preference.id)}
                      onCheckedChange={() => togglePreference(preference.id)}
                    />
                    <Label
                      htmlFor={preference.id}
                      className="text-base cursor-pointer flex-1"
                    >
                      {preference.label}
                    </Label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-hero border-primary/20">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Je voorkeuren worden opgeslagen</h3>
                  <p className="text-sm text-muted-foreground">
                    Na het opslaan worden al je scans automatisch gecontroleerd tegen deze voorkeuren. 
                    Je kunt ze altijd aanpassen als je wilt.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleSave}
                className="px-12 text-lg shadow-hover hover:scale-105 transition-all"
              >
                Opslaan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
