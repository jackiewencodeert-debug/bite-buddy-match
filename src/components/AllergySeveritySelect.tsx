import { AlertTriangle, AlertCircle, Skull } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type AllergySeverity = "mild" | "moderate" | "severe";

interface AllergySeveritySelectProps {
  value: AllergySeverity;
  onChange: (severity: AllergySeverity) => void;
  compact?: boolean;
}

const severityConfig = {
  mild: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10 border-yellow-500/30",
    selectedBg: "bg-yellow-500/20 border-yellow-500",
  },
  moderate: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    selectedBg: "bg-orange-500/20 border-orange-500",
  },
  severe: {
    icon: Skull,
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/30",
    selectedBg: "bg-red-500/20 border-red-500",
  },
};

export const AllergySeveritySelect = ({ value, onChange, compact = false }: AllergySeveritySelectProps) => {
  const { t } = useLanguage();

  const severities: AllergySeverity[] = ["mild", "moderate", "severe"];

  if (compact) {
    return (
      <div className="flex gap-1">
        {severities.map((severity) => {
          const config = severityConfig[severity];
          const Icon = config.icon;
          const isSelected = value === severity;
          
          return (
            <button
              key={severity}
              type="button"
              onClick={() => onChange(severity)}
              className={`p-1.5 rounded border transition-all ${
                isSelected ? config.selectedBg : config.bgColor
              } hover:opacity-80`}
              title={t(`severity.${severity}`)}
            >
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {severities.map((severity) => {
        const config = severityConfig[severity];
        const Icon = config.icon;
        const isSelected = value === severity;
        
        return (
          <button
            key={severity}
            type="button"
            onClick={() => onChange(severity)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              isSelected ? config.selectedBg : config.bgColor
            } hover:opacity-80`}
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>
              {t(`severity.${severity}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const SeverityBadge = ({ severity }: { severity: AllergySeverity }) => {
  const { t } = useLanguage();
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="h-3 w-3" />
      {t(`severity.${severity}`)}
    </span>
  );
};
