import { useState, useEffect } from "react";

export type Region = "eu" | "us-ca" | "br" | "other";

interface RegionInfo {
  region: Region;
  requiresGDPR: boolean;
  requiresCCPA: boolean;
  requiresLGPD: boolean;
  requiresAccessibility: boolean;
}

// EU countries language codes
const EU_LANGUAGES = [
  "de", "fr", "it", "es", "pt", "nl", "pl", "ro", "hu", "cs", "el", "sv", 
  "bg", "da", "fi", "sk", "lt", "lv", "et", "sl", "hr", "ga", "mt"
];

// Detect region based on browser settings
export const detectRegion = (): Region => {
  // Check timezone for California
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone?.includes("Los_Angeles") || timezone?.includes("America/Los_Angeles")) {
    return "us-ca";
  }
  
  // Check language for EU
  const language = navigator.language?.toLowerCase() || "";
  const langCode = language.split("-")[0];
  
  if (EU_LANGUAGES.includes(langCode) || language.includes("-eu")) {
    return "eu";
  }
  
  // Check for specific country codes
  if (language.includes("-br") || language === "pt-br") {
    return "br";
  }
  
  // Check timezone for Brazil
  if (timezone?.includes("Sao_Paulo") || timezone?.includes("Brazil")) {
    return "br";
  }
  
  // Check timezone for EU
  if (timezone?.includes("Europe/")) {
    return "eu";
  }
  
  return "other";
};

export const getRegionInfo = (region: Region): RegionInfo => {
  switch (region) {
    case "eu":
      return {
        region: "eu",
        requiresGDPR: true,
        requiresCCPA: false,
        requiresLGPD: false,
        requiresAccessibility: true,
      };
    case "us-ca":
      return {
        region: "us-ca",
        requiresGDPR: false,
        requiresCCPA: true,
        requiresLGPD: false,
        requiresAccessibility: true,
      };
    case "br":
      return {
        region: "br",
        requiresGDPR: false,
        requiresCCPA: false,
        requiresLGPD: true,
        requiresAccessibility: false,
      };
    default:
      return {
        region: "other",
        requiresGDPR: false,
        requiresCCPA: false,
        requiresLGPD: false,
        requiresAccessibility: false,
      };
  }
};

export const useRegion = (): RegionInfo => {
  const [regionInfo, setRegionInfo] = useState<RegionInfo>({
    region: "other",
    requiresGDPR: false,
    requiresCCPA: false,
    requiresLGPD: false,
    requiresAccessibility: false,
  });

  useEffect(() => {
    try {
      const region = detectRegion();
      setRegionInfo(getRegionInfo(region));
    } catch (error) {
      console.error("Error detecting region:", error);
    }
  }, []);

  return regionInfo;
};
