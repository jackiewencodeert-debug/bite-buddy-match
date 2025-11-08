import { Button } from "@/components/ui/button";
import { Camera, Shield, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Veilig eten begint hier</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Scan. Match. Geniet.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Scan een menukaart en ontdek direct welke gerechten veilig zijn voor jouw allergieën en voorkeuren
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/scan">
              <Button size="lg" className="text-lg px-8 shadow-hover transition-all hover:scale-105">
                <Camera className="mr-2 h-5 w-5" />
                Menu Scannen
              </Button>
            </Link>
            <Link to="/profile">
              <Button size="lg" variant="outline" className="text-lg px-8 transition-all hover:scale-105">
                <Users className="mr-2 h-5 w-5" />
                Mijn Profiel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Camera className="h-8 w-8 text-primary" />}
            title="Scan & Herken"
            description="Scan een menukaart met je camera of upload een foto. Onze AI herkent automatisch alle gerechten en ingrediënten."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-success" />}
            title="Veiligheid Eerst"
            description="Direct zien welke gerechten veilig zijn met ons duidelijke smiley-systeem. Geen verrassingen meer."
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8 text-warning" />}
            title="Persoonlijk"
            description="Stel je allergieën en voorkeuren in en krijg gepersonaliseerde matches voor elk restaurant."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Zo werkt het
          </h2>
          
          <div className="space-y-8">
            <Step
              number="1"
              title="Stel je voorkeuren in"
              description="Voeg je allergieën, dieetwensen en voorkeuren toe aan je profiel. Dit hoef je maar één keer te doen."
            />
            <Step
              number="2"
              title="Scan de menukaart"
              description="Gebruik je camera om de menukaart te scannen, of upload een foto. Onze AI doet de rest."
            />
            <Step
              number="3"
              title="Zie direct wat veilig is"
              description="Elk gerecht krijgt een smiley: 😊 veilig, 😐 aanpasbaar, of 🤢 bevat allergenen."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-warm p-12 rounded-3xl shadow-hover">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Klaar om veilig te genieten?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Start nu met scannen en ontdek wat je kunt eten
          </p>
          <Link to="/scan">
            <Button size="lg" variant="secondary" className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Camera className="mr-2 h-5 w-5" />
              Begin Nu
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card p-8 rounded-2xl border border-border shadow-soft hover:shadow-hover transition-all hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const Step = ({ number, title, description }: { number: string; title: string; description: string }) => {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-soft">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default Index;
