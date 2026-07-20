/**
 * Serializes rows into RFC 4180-ish CSV text. Values containing a comma,
 * quote, or newline are wrapped in quotes with internal quotes doubled.
 */
export function toCsv(rows: (string | number | boolean)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell);
          if (/[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    )
    .join("\r\n");
}

export function csvResponse(filename: string, rows: (string | number | boolean)[][]): Response {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
