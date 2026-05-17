export interface ScanSummary {
  total: number;
  verified: number;
  ingredient_inferred: number;
  unknown: number;
}

export function ScanResultSummary({ summary }: { summary: ScanSummary }) {
  return (
    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
      <p className="text-sm text-gray-700">
        <strong>{summary.verified}</strong> van <strong>{summary.total}</strong> gerechten geverifieerd
        {summary.ingredient_inferred > 0 && (
          <>
            , <strong>{summary.ingredient_inferred}</strong> ingredient-gebaseerd
          </>
        )}
        {summary.unknown > 0 && (
          <>
            , <strong>{summary.unknown}</strong> onbekend
          </>
        )}
      </p>
    </div>
  );
}
