#!/usr/bin/env node
/**
 * Static checker for Pine Script v6 declare-before-use rule.
 *
 * Pine v6 enforces: all `var x = ...` declarations must come before first reference
 * to `x` in the script. Forward-reference → CE10272 undeclared identifier.
 *
 * This checker catches the pattern at lint time (CI / pre-commit) so we don't
 * have to wait for TradingView's compile to fail.
 *
 * Usage:
 *   node scripts/check-pine-declarations.mjs scripts/current.v3.5.pine
 *   node scripts/check-pine-declarations.mjs scripts/current.pine scripts/current.v3.4.pine
 *
 * Exit codes:
 *   0 = clean
 *   1 = forward-reference found (CE10272 risk)
 *
 * Limitations (v1):
 *   - Doesn't parse Pine AST — regex-based
 *   - Doesn't understand scope (e.g., var inside if/function blocks would false-positive)
 *   - Doesn't catch references inside string literals
 *
 * For thoroughness, use TradingView's `tv pine check` (server-side) in addition.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function stripComments(line) {
  // Strip // line comments (Pine doesn't have /// docstring, so simple split works)
  const idx = line.indexOf('//');
  return idx >= 0 ? line.slice(0, idx) : line;
}

function findVarDeclarations(line) {
  // Match: var <type>[] <name> = ... or var <type> <name> = ...
  // Types: box, line, label, int, float, bool, string, color, table, array
  // Also matches: var <name> = ... (inferred type)
  const re = /\bvar\s+(?:(?:box|line|label|int|float|bool|string|color|table|array)\s*[\[\]]*\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  const matches = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    matches.push({ name: m[1], col: m.index });
  }
  return matches;
}

function findReferences(line, declaredNames) {
  // Find word-boundary references to any declared name (excluding the declaration itself).
  // Heuristic: name appears as identifier, not in a `var <name>` context.
  // We exclude: `var <name>`, `function <name>(`, `method <name>(`, comments.
  const refs = [];
  for (const name of declaredNames) {
    // Match \bname\b but skip if preceded by `var ` or `function ` or `method `
    const re = new RegExp(`\\b${name}\\b`, 'g');
    let m;
    while ((m = re.exec(line)) !== null) {
      const before = line.slice(Math.max(0, m.index - 6), m.index);
      if (/var\s+$/.test(before) || /function\s+$/.test(before) || /method\s+$/.test(before)) {
        continue; // it's a declaration
      }
      refs.push({ name, col: m.index });
    }
  }
  return refs;
}

function checkFile(filepath) {
  if (!existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    return { errors: 0, warnings: 0, skipped: true };
  }
  const src = readFileSync(filepath, 'utf-8');
  const lines = src.split(/\r?\n/);

  // Pass 1: collect all var declarations (line number → name)
  // We do this so references to names we KNOW are declared somewhere get checked.
  const allDecls = new Map(); // name → first line number
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const clean = stripComments(lines[i]);
    for (const decl of findVarDeclarations(clean)) {
      if (!allDecls.has(decl.name)) {
        allDecls.set(decl.name, lineNum);
      }
    }
  }

  // Pass 2: find forward-references
  const errors = [];
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const clean = stripComments(lines[i]);
    for (const ref of findReferences(clean, allDecls.keys())) {
      const declLine = allDecls.get(ref.name);
      if (lineNum < declLine) {
        errors.push({
          file: filepath,
          refLine: lineNum,
          refCol: ref.col + 1,
          name: ref.name,
          declLine,
          message: `Forward-reference: '${ref.name}' used on line ${lineNum} but declared on line ${declLine} (Pine v6 CE10272)`,
        });
      }
    }
  }

  return { errors, warnings: 0, skipped: false };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/check-pine-declarations.mjs <file.pine> [<file2.pine> ...]');
  process.exit(2);
}

let totalErrors = 0;
let checkedFiles = 0;
for (const file of files) {
  const filepath = resolve(file);
  const result = checkFile(filepath);
  if (result.skipped) continue;
  checkedFiles++;
  if (result.errors.length === 0) {
    console.log(`✓ ${filepath} — no forward-references`);
  } else {
    console.log(`✗ ${filepath} — ${result.errors.length} forward-reference(s):`);
    for (const e of result.errors) {
      console.log(`  Line ${e.refLine}:${e.refCol}  ${e.message}`);
    }
    totalErrors += result.errors.length;
  }
}

console.log(`\nChecked ${checkedFiles} file(s), ${totalErrors} error(s)`);
process.exit(totalErrors > 0 ? 1 : 0);
