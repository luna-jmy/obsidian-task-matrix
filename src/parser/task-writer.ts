import { App, Notice, TFile } from "obsidian";
import { INLINE_FIELD_TOKEN_SOURCE } from "./task-parser";
import { ParsedTask, Priority } from "../types";
import { t } from "../i18n";

/**
 * Line-level, end-of-line preserving, atomic edits to markdown notes.
 *
 * Every write goes through `Vault.process`, so the transform always runs against
 * the latest content instead of a snapshot taken before an `await`. Only the
 * target line is rewritten, and line endings and trailing newlines are carried
 * over unchanged, so edits made by other plugins (Tasks, Templater, Linter) and
 * by Obsidian Sync survive intact.
 */
export type EditResult = "updated" | "unchanged" | "missing";

const CHECKBOX_PREFIX = /^([ \t]*[-*][ \t]*\[[^\]]*\][ \t]*)/u;
const LEADING_INDENT = /^[ \t]*/u;

const PRIORITY_MARKERS: Record<Priority, string> = {
  [Priority.Critical]: "🔺",
  [Priority.Highest]: "⏫",
  [Priority.High]: "🔼",
  [Priority.Medium]: "",
  [Priority.Low]: "🔽",
  [Priority.Lowest]: "⏬",
  [Priority.None]: "",
};

interface SplitContent {
  lines: string[];
  eols: string[];
}

function splitWithEol(content: string): SplitContent {
  return {
    lines: content.split(/\r?\n/u),
    eols: content.match(/\r\n|\n/gu) ?? [],
  };
}

function joinWithEol({ lines, eols }: SplitContent): string {
  let result = lines[0] ?? "";
  for (let index = 1; index < lines.length; index += 1) {
    result += `${eols[index - 1] ?? "\n"}${lines[index]}`;
  }
  return result;
}

function removeLine(content: SplitContent, index: number): void {
  content.lines.splice(index, 1);
  const eolIndex = index < content.eols.length ? index : content.eols.length - 1;
  content.eols.splice(eolIndex, 1);
}

export function detectEol(content: string): string {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

export function getIndent(line: string): string {
  return LEADING_INDENT.exec(line)?.[0] ?? "";
}

/**
 * Collapses the spacing left behind by removed tokens while preserving the list
 * indentation, so nested tasks stay nested.
 */
export function compactLine(line: string): string {
  const indent = getIndent(line);
  const body = line
    .slice(indent.length)
    .replace(/[ \t]{2,}/gu, " ")
    .replace(/[ \t]+$/u, "");
  return `${indent}${body}`;
}

/** Appends a line to the end of a note without trimming existing content. */
export function appendLine(content: string, line: string): string {
  if (content.length === 0) return `${line}${detectEol(content)}`;
  const separator = content.endsWith("\n") ? "" : detectEol(content);
  return `${content}${separator}${line}${detectEol(content)}`;
}

/**
 * Finds the line a task was parsed from. Line numbers drift whenever anything
 * edits the note between parsing and writing, so the recorded text is verified
 * first and then used as a fallback key.
 */
export function locateTaskLine(lines: string[], task: ParsedTask): number {
  const preferred = task.lineNumber - 1;
  if (preferred >= 0 && preferred < lines.length && lines[preferred] === task.lineText) {
    return preferred;
  }

  const byExactText = lines.indexOf(task.lineText);
  if (byExactText !== -1) return byExactText;

  return lines.findIndex(
    (line) => CHECKBOX_PREFIX.test(line) && line.includes(task.description),
  );
}

/** Runs a transform inside `Vault.process`; `null` means "leave the file alone". */
export async function editFileContent(
  app: App,
  file: TFile,
  transform: (content: string) => string | null,
): Promise<boolean> {
  let changed = false;
  await app.vault.process(file, (content) => {
    const next = transform(content);
    if (next === null || next === content) return content;
    changed = true;
    return next;
  });
  return changed;
}

/** Applies a transform to the single line a parsed task points at. */
export async function editTaskLine(
  app: App,
  task: ParsedTask,
  transform: (line: string) => string | null,
): Promise<EditResult> {
  const target = app.vault.getAbstractFileByPath(task.filePath);
  if (!(target instanceof TFile)) {
    new Notice(t("找不到文件：{path}", { path: task.filePath }));
    return "missing";
  }

  let result: EditResult = "missing";
  await editFileContent(app, target, (content) => {
    const split = splitWithEol(content);
    const index = locateTaskLine(split.lines, task);
    if (index === -1) return null;

    const next = transform(split.lines[index]);
    if (next === split.lines[index]) {
      result = "unchanged";
      return null;
    }

    if (next === null) removeLine(split, index);
    else split.lines[index] = next;
    result = "updated";
    return joinWithEol(split);
  });
  return result;
}

/**
 * Replaces the description in place, leaving every inline field at its original
 * position so other tools still recognise the line.
 */
export function replaceTaskDescription(line: string, description: string): string {
  const prefixMatch = CHECKBOX_PREFIX.exec(line);
  if (!prefixMatch) return line;

  const prefix = prefixMatch[1];
  const rest = line.slice(prefix.length);
  const tokenPattern = new RegExp(INLINE_FIELD_TOKEN_SOURCE, "gu");

  const parts: string[] = [];
  let descriptionWritten = false;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(rest)) !== null) {
    if (rest.slice(cursor, match.index).trim() && !descriptionWritten) {
      parts.push(description);
      descriptionWritten = true;
    }
    parts.push(match[0]);
    cursor = match.index + match[0].length;
  }

  if (rest.slice(cursor).trim() && !descriptionWritten) {
    parts.push(description);
    descriptionWritten = true;
  }
  if (!descriptionWritten) parts.unshift(description);

  return `${prefix}${parts.join(" ")}`;
}

/** Writes the checkbox content, e.g. ` `, `x` or `-`. */
export function setCheckboxMarker(line: string, marker: string): string {
  const prefixMatch = CHECKBOX_PREFIX.exec(line);
  if (!prefixMatch) return line;
  const prefix = prefixMatch[1];
  const rest = line.slice(prefix.length).replace(/^\[[^\]]*\]/u, `[${marker}]`);
  return `${prefix}${rest}`;
}

export function setPriority(line: string, priority: Priority): string {
  const indent = getIndent(line);
  const body = line.slice(indent.length).replace(/⏫|🔼|🔽|⏬|🔺/gu, "");
  const marker = PRIORITY_MARKERS[priority];
  if (!marker) return compactLine(`${indent}${body}`);

  const prefix = CHECKBOX_PREFIX.exec(body)?.[1];
  const withMarker = prefix ? body.replace(prefix, `${prefix}${marker} `) : `${marker} ${body}`;
  return compactLine(`${indent}${withMarker}`);
}

export function setDateField(line: string, emoji: string, value: string): string {
  const pattern = new RegExp(`\\s*${emoji}(?:\\s*\\d{4}-\\d{2}-\\d{2})?`, "gu");
  const stripped = line.replace(pattern, "");
  return value ? `${stripped} ${emoji} ${value}` : stripped;
}

export function setIdentifierField(
  line: string,
  emoji: string,
  fieldName: string,
  value: string,
): string {
  const stripped = line
    .replace(new RegExp(`\\s*${emoji}\\s*\\S+`, "gu"), "")
    .replace(new RegExp(`\\b${fieldName}\\s*\\S+`, "giu"), "");
  return value ? `${stripped} ${emoji} ${value}` : stripped;
}

export function setConflictTag(line: string, enabled: boolean): string {
  const stripped = line.replace(/\s*#due-date-conflict\b/giu, "");
  return enabled ? `${stripped} #due-date-conflict` : stripped;
}

/** Inserts a line at the end of the section owned by `heading`. */
export function insertLineUnderHeading(
  content: string,
  heading: string,
  line: string,
): { success: boolean; content?: string; error?: string } {
  const split = splitWithEol(content);
  const { lines } = split;

  const headingPattern = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "u");
  const headingIndex = lines.findIndex((candidate) => headingPattern.test(candidate.trim()));
  if (headingIndex === -1) {
    return { success: false, error: t("找不到标题「{heading}」", { heading }) };
  }

  const levelMatch = /^(#{1,6})/u.exec(lines[headingIndex]);
  if (!levelMatch) return { success: false, error: t("标题格式不合法") };
  const level = levelMatch[1].length;

  let sectionEnd = headingIndex + 1;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const nextHeading = /^(#{1,6})\s/u.exec(lines[index]);
    if (nextHeading && nextHeading[1].length <= level) break;
    sectionEnd = index + 1;
  }

  let lastContentIndex = sectionEnd - 1;
  while (lastContentIndex > headingIndex && !lines[lastContentIndex].trim()) {
    lastContentIndex -= 1;
  }

  const insertIndex = lastContentIndex + 1;
  lines.splice(insertIndex, 0, line);
  split.eols.splice(insertIndex - 1, 0, detectEol(content));

  return { success: true, content: joinWithEol(split) };
}
