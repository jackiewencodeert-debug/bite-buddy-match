import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export type Source = 'verified' | 'ingredient_inferred' | 'unknown';

export function SourceBadge({ source }: { source: Source }) {
  switch (source) {
    case 'verified':
      return (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Geverifieerd door restaurant</span>
        </div>
      );
    case 'ingredient_inferred':
      return (
        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Op basis van herkende ingrediënten</span>
        </div>
      );
    case 'unknown':
      return (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-sm">
          <HelpCircle className="w-4 h-4" />
          <span>Onbekend — vraag het restaurant</span>
        </div>
      );
  }
}
