type Cell = string | number | boolean | Date | null | undefined

/**
 * One CSV cell. Text starting with = + - @ is prefixed with ' so spreadsheet apps don't run it as a
 * formula (a description like "=HYPERLINK(...)" would otherwise be live when the export is opened).
 */
function cell(value: Cell): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  // The BOM makes Excel read the file as UTF-8, so Lithuanian letters show correctly.
  return "﻿" + [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n"
}
