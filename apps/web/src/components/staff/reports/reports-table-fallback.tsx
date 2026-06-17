export function ReportsTableFallback({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-staff-border bg-staff-surface">
      <table className="min-w-full text-sm">
        <thead className="bg-staff-bg">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 text-left font-semibold text-staff-text">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-staff-border">
              {row.map((cell, cidx) => (
                <td key={`${idx}-${cidx}`} className="px-3 py-2 text-staff-text-muted">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
