// Parser de mysqldump por STREAMING — utilidad NEUTRAL (cero conocimiento de la fuente/aplicación). Lee un
// .sql grande sin cargarlo entero en memoria: detecta CREATE TABLE (orden de columnas) e INSERT … VALUES
// (extended, multi-línea), y emite filas como objetos keyed por columna. El adapter de cada fuente decide QUÉ
// tablas/columnas le importan; esto solo sabe de SQL. (FB0/FB1, ECO-63 / ADR-012.)
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

// Des-escapa un literal de string de MySQL (lo de dentro de las comillas simples ya extraído).
function unescapeSql(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "\\") { out += c; continue; }
    const n = s[++i];
    out += n === "n" ? "\n" : n === "r" ? "\r" : n === "t" ? "\t" : n === "0" ? "\0" : n === "Z" ? "\x1a" : n;
  }
  return out;
}

// Tokeniza el texto de VALUES `(...),(...)` en filas de valores. Respeta strings con comillas simples y
// escapes `\\`,`\'`,etc. Un token sin comillas igual a NULL → null; numérico → string del número (el adapter
// coacciona). Devuelve un array de arrays (cada fila = valores en orden de columna).
export function parseValues(valuesText) {
  const rows = [];
  let i = 0;
  const n = valuesText.length;
  while (i < n) {
    while (i < n && valuesText[i] !== "(") i++;        // hasta el siguiente '('
    if (i >= n) break;
    i++;
    const row = [];
    let raw = "", quoted = false, inStr = false, has = false;
    while (i < n) {
      const c = valuesText[i];
      if (inStr) {
        if (c === "\\") { raw += c + (valuesText[i + 1] ?? ""); i += 2; continue; }
        if (c === "'") { inStr = false; i++; continue; }
        raw += c; i++; continue;
      }
      if (c === "'") { inStr = true; quoted = true; has = true; i++; continue; }
      if (c === "," || c === ")") {
        row.push(quoted ? unescapeSql(raw) : finalizeBare(raw));
        raw = ""; quoted = false; has = false;
        i++;
        if (c === ")") break;
        continue;
      }
      raw += c; has = true; i++;
    }
    rows.push(row);
    while (i < n && (valuesText[i] === "," || /\s/.test(valuesText[i]))) i++;   // separador entre tuplas
  }
  return rows;
}
function finalizeBare(raw) {
  const t = raw.trim();
  if (t === "" ) return null;
  if (t.toUpperCase() === "NULL") return null;
  return t;   // número/booleano como string; el adapter coacciona si lo necesita
}

// Cuenta '(' de apertura de tupla al nivel raíz — sirve para validar nº de filas si hiciera falta.
// (No usado en el camino feliz; el parseValues ya separa.)

// ¿El statement acumulado termina? Mantiene estado de comillas a través de líneas (escaneo O(n) total).
function feed(state, line) {
  const s = line;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (state.inStr) {
      if (c === "\\") { i++; continue; }
      if (c === "'") state.inStr = false;
      continue;
    }
    if (c === "'") { state.inStr = true; continue; }
    if (c === ";") return true;   // ';' fuera de string → fin del statement
  }
  return false;
}

// Stream del dump. `tables` = set/array de nombres de tabla deseados. Llama `onRow(table, rowObj)` por fila.
// Devuelve { tables: {tabla: nFilas}, columns: {tabla: [cols]} } (estadística de cobertura).
export async function streamDump(dumpPath, tables, onRow) {
  const want = new Set(tables);
  const columns = {};
  const counts = {};
  for (const t of want) counts[t] = 0;
  const rl = createInterface({ input: createReadStream(dumpPath, { encoding: "utf8" }), crlfDelay: Infinity });
  let curCreate = null;
  let insert = null;   // { table, buf, st:{inStr} }

  const flush = (ins) => {
    const valuesText = ins.buf.replace(/^INSERT INTO `[^`]+` VALUES/, "");
    const cols = columns[ins.table] || [];
    for (const vals of parseValues(valuesText)) {
      const row = {};
      cols.forEach((c, k) => { row[c] = vals[k]; });
      counts[ins.table] = (counts[ins.table] || 0) + 1;
      onRow(ins.table, row);
    }
  };

  for await (const line of rl) {
    if (insert) {
      insert.buf += "\n" + line;
      if (feed(insert.st, line)) { flush(insert); insert = null; }
      continue;
    }
    const cm = line.match(/^CREATE TABLE `([^`]+)`/);
    if (cm) { curCreate = want.has(cm[1]) ? cm[1] : null; if (curCreate) columns[curCreate] = []; continue; }
    if (curCreate) {
      const colm = line.match(/^\s+`([^`]+)`\s/);
      if (colm) columns[curCreate].push(colm[1]);
      if (/^\)\s*ENGINE/.test(line) || /^\);/.test(line)) curCreate = null;
      continue;
    }
    const im = line.match(/^INSERT INTO `([^`]+)` VALUES/);
    if (im && want.has(im[1])) {
      insert = { table: im[1], buf: line, st: { inStr: false } };
      if (feed(insert.st, line)) { flush(insert); insert = null; }
    }
  }
  return { tables: counts, columns };
}
