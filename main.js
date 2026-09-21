"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TaskMatrixPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// src/i18n/en.ts
var EN = {
  // ── toolbar / modes ──────────────────────────────────────────────
  "\u4EFB\u52A1\u77E9\u9635": "Task matrix",
  "\u65B0\u5EFA\u4EFB\u52A1": "New task",
  "\u5237\u65B0": "Refresh",
  "\u91CD\u65B0\u626B\u63CF\u4EFB\u52A1": "Rescan tasks",
  "\u6253\u5F00\u4EFB\u52A1\u77E9\u9635": "Open task matrix",
  "\u5217\u8868": "List",
  "\u77E9\u9635": "Matrix",
  "\u65E5\u5386": "Calendar",
  "GTD": "GTD",
  "\u5168\u90E8\u5C55\u5F00": "Expand all",
  "\u5168\u90E8\u6536\u8D77": "Collapse all",
  // ── filter bar ───────────────────────────────────────────────────
  "\u72B6\u6001": "Status",
  "\u72B6\u6001\u9884\u8BBE": "Status presets",
  "\u5168\u90E8\u72B6\u6001": "All statuses",
  "\u53EA\u770B\u672A\u5B8C\u6210": "Active only",
  "\u9690\u85CF\u5DF2\u53D6\u6D88": "Hide cancelled",
  "\u6807\u8BB0": "Marker",
  "\u65B9\u62EC\u53F7\u5185\u5BB9\u662F {marker} \u7684\u4EFB\u52A1": "Tasks whose brackets contain {marker}",
  "\u641C\u7D22": "Search",
  "\u4EFB\u52A1\u63CF\u8FF0\u3001\u6587\u4EF6\u3001ID": "Description, file or ID",
  "\u5F00\u59CB\u65E5\u671F": "Start date",
  "\u622A\u6B62\u65E5\u671F": "Due date",
  "\u6309\u5F00\u59CB\u65E5\u671F\u7B5B\u9009": "Filter by start date",
  "\u6309\u622A\u6B62\u65E5\u671F\u7B5B\u9009": "Filter by due date",
  "\u533A\u95F4\u8D77\u59CB\u65E5\u671F": "Range start date",
  "\u533A\u95F4\u7ED3\u675F\u65E5\u671F": "Range end date",
  "\u4E0D\u9650": "Any time",
  "\u4ECA\u5929": "Today",
  "\u672C\u5468": "This week",
  "\u672C\u6708": "This month",
  "\u672C\u5E74": "This year",
  "\u81EA\u5B9A\u4E49\u533A\u95F4": "Custom range",
  "\u6392\u5E8F": "Sort",
  "\u6392\u5E8F\u65B9\u5F0F": "Sort mode",
  "\u622A\u6B62\u65E5 \u2191": "Due \u2191",
  "\u622A\u6B62\u65E5 \u2193": "Due \u2193",
  "\u5F00\u59CB\u65E5 \u2191": "Start \u2191",
  "\u4F18\u5148\u7EA7": "Priority",
  "\u6587\u4EF6\u540D": "File name",
  "\u6E05\u9664\u7B5B\u9009": "Clear filters",
  "\u6E05\u9664\u5168\u90E8\u7B5B\u9009\u6761\u4EF6\uFF0C\u663E\u793A\u6240\u6709\u4EFB\u52A1": "Clear every filter and show all tasks",
  "{shown}/{total} \u4E2A\u4EFB\u52A1": "{shown}/{total} tasks",
  // ── task status ──────────────────────────────────────────────────
  "\u672A\u5F00\u59CB": "Open",
  "\u5F85\u5F00\u59CB": "To be started",
  "\u8FDB\u884C\u4E2D": "In progress",
  "\u5DF2\u903E\u671F": "Overdue",
  "\u5DF2\u5B8C\u6210": "Completed",
  "\u5DF2\u53D6\u6D88": "Cancelled",
  // ── priority levels ──────────────────────────────────────────────
  "\u7D27\u6025": "Critical",
  "\u6700\u9AD8": "Highest",
  "\u9AD8": "High",
  "\u4E2D": "Medium",
  "\u4F4E": "Low",
  "\u6700\u4F4E": "Lowest",
  "\u65E0": "None",
  // ── containers ───────────────────────────────────────────────────
  "\u5168\u90E8\u4EFB\u52A1": "All tasks",
  "\u6839\u76EE\u5F55": "Vault root",
  "\u6536\u4EF6\u7BB1": "Inbox",
  "\u7B49\u5F85\u4E2D": "Waiting",
  "\u91CD\u8981\u4E14\u7D27\u6025": "Important and urgent",
  "\u91CD\u8981\u4E0D\u7D27\u6025": "Important, not urgent",
  "\u7D27\u6025\u4E0D\u91CD\u8981": "Urgent, not important",
  "\u4E0D\u91CD\u8981\u4E0D\u7D27\u6025": "Not important, not urgent",
  "\u6682\u65E0\u4EFB\u52A1": "No tasks",
  "\u6CA1\u6709\u7B26\u5408\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u7684\u4EFB\u52A1": "No tasks match the current filters",
  "\u6B63\u5728\u5EFA\u7ACB\u4EFB\u52A1\u7D22\u5F15\u2026": "Building the task index\u2026",
  "\u7D22\u5F15\u5728 Obsidian \u5E03\u5C40\u5C31\u7EEA\u540E\u5F00\u59CB\uFF0C\u5927\u5E93\u9700\u8981\u4E00\u70B9\u65F6\u95F4\u3002": "Indexing starts once Obsidian has finished loading; a large vault takes a moment.",
  "{count} \u4E2A\u4EFB\u52A1": "{count} tasks",
  "\u5728\u6B64\u5BB9\u5668\u65B0\u5EFA\u4EFB\u52A1": "New task in this container",
  // ── cards ────────────────────────────────────────────────────────
  "\u65E0\u63CF\u8FF0": "No description",
  "\u4F18\u5148\u7EA7 {level}": "Priority {level}",
  "\u622A\u6B62 {date}": "Due {date}",
  "\u5F00\u59CB {date}": "Start {date}",
  "ID {id}": "ID {id}",
  "\u88AB {id} \u963B\u585E": "Blocked by {id}",
  "\u4F9D\u8D56 {id} \u5DF2\u5B8C\u6210": "Depends on {id} (done)",
  "\u65E5\u671F\u51B2\u7A81": "Date conflict",
  "\u5B8C\u6210": "Done",
  "\u91CD\u65B0\u6253\u5F00": "Reopen",
  "\u5F00\u59CB": "Start",
  "\u53D6\u6D88": "Cancel",
  "\u7F16\u8F91": "Edit",
  "\u5220\u9664": "Delete",
  "\u79FB\u52A8\u5230": "Move to",
  "\u79FB\u52A8\u5230 {quadrant}": "Move to {quadrant}",
  "\u79FB\u52A8\u5230\u300C{state}\u300D": "Move to {state}",
  "\u5DF2\u79FB\u52A8\u5230 {quadrant}": "Moved to {quadrant}",
  "\u5DF2\u79FB\u52A8\u5230\u300C{state}\u300D": "Moved to {state}",
  "\u4EFB\u52A1\u5DF2\u5B8C\u6210": "Task completed",
  "\u5DF2\u91CD\u65B0\u6253\u5F00": "Task reopened",
  "\u4EFB\u52A1\u5DF2\u53D6\u6D88": "Task cancelled",
  "\u4EFB\u52A1\u5DF2\u5F00\u59CB": "Task started",
  "\u4EFB\u52A1\u5DF2\u5220\u9664": "Task deleted",
  "\u4EFB\u52A1\u5DF2\u66F4\u65B0": "Task updated",
  "\u5DF2\u5237\u65B0\uFF1A{count} \u4E2A\u4EFB\u52A1": "Refreshed: {count} tasks",
  // ── calendar ─────────────────────────────────────────────────────
  "\u6708": "Month",
  "\u5468": "Week",
  "\u6C47\u603B": "Summary",
  "\u622A\u6B62": "Due",
  "\u8BA1\u5212": "Scheduled",
  "\u903E\u671F": "Overdue",
  "\u65E0\u4EFB\u52A1": "No tasks",
  "\u8FD8\u6709 {count} \u9879": "{count} more",
  "\u5DF2\u5B8C\u6210\uFF1A{done}/{total}": "Done: {done}/{total}",
  "\u622A\u6B62\uFF1A{count}": "Due: {count}",
  "\u903E\u671F\uFF1A{count}": "Overdue: {count}",
  "\u5F00\u59CB\uFF1A{count}": "Start: {count}",
  "\u8BA1\u5212\uFF1A{count}": "Scheduled: {count}",
  "\u91CD\u590D\uFF1A{count}": "Recurring: {count}",
  "\u65E5\u8BB0\uFF1A{count}": "Daily notes: {count}",
  "\u5468\u4E00": "Mon",
  "\u5468\u4E8C": "Tue",
  "\u5468\u4E09": "Wed",
  "\u5468\u56DB": "Thu",
  "\u5468\u4E94": "Fri",
  "\u5468\u516D": "Sat",
  "\u5468\u65E5": "Sun",
  // ── gantt ────────────────────────────────────────────────────────
  "\u7518\u7279": "Gantt",
  "\u65F6\u95F4\u7C92\u5EA6": "Time scale",
  "\u5206\u7EC4\u4F9D\u636E": "Group by",
  "\u65E5": "Day",
  "\u5E74": "Year",
  "\u4E0D\u5206\u7EC4": "No grouping",
  "\u6309 GTD \u72B6\u6001\u5206\u7EC4": "Group by GTD state",
  "\u6309\u77E9\u9635\u8C61\u9650\u5206\u7EC4": "Group by quadrant",
  "\u672A\u547D\u540D\u4EFB\u52A1": "Untitled task",
  "\u91CC\u7A0B\u7891": "Milestone",
  "\u5173\u952E": "Critical",
  "\u7F3A\u65E5\u671F": "Missing dates",
  "\u8D77\u6B62\u65E5\u671F\u4E0D\u5B8C\u6574\uFF0C\u56FE\u4E0A\u90A3\u4E00\u6BB5\u662F\u63A8\u5BFC\u51FA\u6765\u7684": "Start or due date is missing, so the span shown is inferred",
  "{count} \u5929": "{count} days",
  "{count} \u4E2A\u6CA1\u6709\u65E5\u671F": "{count} without dates",
  "{name}\uFF1A{start} \u81F3 {end}\uFF0C{days} \u5929": "{name}: {start} to {end}, {days} days",
  "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u4EFB\u52A1\uFF08\u9700\u8981\u81F3\u5C11\u4E00\u4E2A\u5F00\u59CB\u65E5\u6216\u622A\u6B62\u65E5\uFF09": "No tasks to show (each needs a start or due date)",
  // ── settings: tabs ───────────────────────────────────────────────
  "\u901A\u7528": "General",
  "\u626B\u63CF\u8303\u56F4\u3001\u754C\u9762\u8BED\u8A00\u4E0E\u4EFB\u52A1\u6807\u8BB0\u7684\u5199\u6CD5\u3002\u6539\u52A8\u4F1A\u89E6\u53D1\u4E00\u6B21\u5168\u5E93\u91CD\u65B0\u7D22\u5F15\u3002": "Scan scope, interface language and how task markers are written. Changing these rebuilds the index.",
  "\u65B0\u5EFA\u4EFB\u52A1\u843D\u5230\u54EA\u7BC7\u7B14\u8BB0\u3001\u7528\u54EA\u4E2A\u6A21\u677F\u3001\u63D2\u5230\u54EA\u4E2A\u6807\u9898\u4E0B\u3002": "Where new tasks go, which template to use, and which heading they are inserted under.",
  "\u89C6\u56FE\u504F\u597D": "View preferences",
  "\u6253\u5F00\u89C6\u56FE\u65F6\u7684\u9ED8\u8BA4\u72B6\u6001\uFF0C\u4EE5\u53CA\u9762\u677F\u6A21\u5F0F\u94FA\u51FA\u54EA\u4E9B\u4EFB\u52A1\u3002": "What the view looks like when it opens, and which tasks the panel modes show.",
  "\u65E5\u5386\u4E0E\u7518\u7279": "Calendar and Gantt",
  "\u65E5\u5386\u4E0E\u7518\u7279\u5404\u81EA\u7684\u663E\u793A\u53E3\u5F84\u548C\u914D\u8272\uFF0C\u4E92\u4E0D\u5F71\u54CD\u3002": "Display settings and colours for the calendar and the Gantt, which do not affect each other.",
  "\u7518\u7279\u56FE\u6A21\u5F0F": "Gantt mode",
  "\u9000\u51FA\u7518\u7279\u56FE\u6A21\u5F0F": "Exit Gantt mode",
  // ── settings: journal template ───────────────────────────────────
  "\u65E5\u5FD7\u6A21\u677F": "Journal template",
  "\u6A21\u677F\u7B14\u8BB0\u8DEF\u5F84": "Template note path",
  "\u76EE\u6807\u7B14\u8BB0\u4E0D\u5B58\u5728\u65F6\uFF0C\u7528\u8FD9\u7BC7\u7B14\u8BB0\u7684\u5185\u5BB9\u65B0\u5EFA\u3002\u586B vault \u76F8\u5BF9\u8DEF\u5F84\uFF0C\u6269\u5C55\u540D\u53EF\u7701\u7565\uFF1B\u7559\u7A7A\u5219\u65B0\u5EFA\u7A7A\u767D\u7B14\u8BB0\u3002": "Used to create the target note when it does not exist yet. Enter a vault-relative path; the extension is optional. Leave empty to create a blank note.",
  "\u6A21\u677F": "Templates",
  "\u76EE\u6807\u7B14\u8BB0\u8DEF\u5F84\u4E0E\u6A21\u677F\u91CC\u53EF\u7528\u7684\u5360\u4F4D\u7B26": "Placeholders available in the path and the template",
  "{{title}} \u662F\u65B0\u7B14\u8BB0\u7684\u6587\u4EF6\u540D\uFF0C{{date}} \u4E0E {{time}} \u662F\u5F53\u524D\u65E5\u671F\u4E0E\u65F6\u95F4\uFF0C\u4E5F\u53EF\u4EE5\u5199\u6210 {{date:YYYY-MM-DD}} \u6307\u5B9A\u683C\u5F0F\uFF1B\u672A\u8BC6\u522B\u7684\u5360\u4F4D\u7B26\u539F\u6837\u4FDD\u7559\u3002": "{{title}} is the new note's file name, {{date}} and {{time}} are the current date and time, and {{date:YYYY-MM-DD}} picks a format. Unrecognised placeholders are kept as they are.",
  "\u65B0\u5EFA\u4EFB\u52A1\u7684\u843D\u70B9\uFF0C\u9ED8\u8BA4\u5199\u5230\u5F53\u65E5\u65E5\u5FD7\uFF1B\u7B14\u8BB0\u4E0D\u5B58\u5728\u65F6\u4F1A\u81EA\u52A8\u65B0\u5EFA\u3002\u7559\u7A7A\u8868\u793A\u5199\u8FDB\u5F53\u524D\u6253\u5F00\u7684\u7B14\u8BB0\u3002": "Where new tasks go. The default writes to today's journal, creating the note if needed. Leave empty to use the note you have open.",
  "\u627E\u4E0D\u5230\u6A21\u677F\u7B14\u8BB0\uFF1A{path}\uFF08\u5DF2\u6309\u7A7A\u767D\u7B14\u8BB0\u521B\u5EFA\uFF09": "Template note not found: {path} (created a blank note instead)",
  "\u6A21\u677F\u547D\u4EE4\u672A\u5168\u90E8\u6267\u884C\uFF0C\u7B14\u8BB0\u5DF2\u6309\u6A21\u677F\u539F\u6587\u521B\u5EFA\uFF1B\u53EF\u7A0D\u540E\u6267\u884C\u4E00\u6B21\u6A21\u677F\u547D\u4EE4\u91CD\u8DD1": "Some template commands did not run. The note was created from the template as written; run the template command again later if needed.",
  "\u65E0\u6CD5\u521B\u5EFA\u76EE\u6807\u7B14\u8BB0\uFF1A{path}": "Could not create the target note: {path}",
  // ── settings: gantt colours ──────────────────────────────────────
  "\u7518\u7279\u89C6\u56FE": "Gantt view",
  "\u7518\u7279\u6761\u914D\u8272": "Bar colours",
  "\u6309 Mermaid \u7518\u7279\u7684\u56DB\u79CD\u72B6\u6001\u914D\u8272\u3002\u989C\u8272\u53EF\u5199 var(--color-blue) \u6216\u989C\u8272\u540D\uFF1B\u70B9\u4E0B\u9762\u7684\u8272\u5757\u5373\u6539\u3002": "One colour per Mermaid Gantt state. Values can be var(--color-blue) or a colour name; click a swatch to change one.",
  "\u5173\u952E\u4EFB\u52A1": "Critical tasks",
  "\u5E26 \u{1F53A} \u6216 #crit \u6807\u8BB0\u7684\u4EFB\u52A1\uFF1B\u4F18\u5148\u7EA7\u6700\u9AD8\uFF0C\u540C\u65F6\u5DF2\u5B8C\u6210\u4E5F\u6309\u8FD9\u4E00\u8272\u663E\u793A\u3002": "Tasks marked \u{1F53A} or #crit. Takes precedence, so a critical task keeps this colour even when completed.",
  "\u5176\u4ED6\u72B6\u6001": "Other states",
  "\u65E2\u975E\u5173\u952E\u4E5F\u975E\u5DF2\u5B8C\u6210\u3001\u4E14\u8D77\u6B62\u65E5\u671F\u4E0D\u5B8C\u6574\uFF08\u56FE\u4E0A\u90A3\u4E00\u6BB5\u662F\u63A8\u5BFC\u503C\uFF09\u7684\u4EFB\u52A1\u3002": "Tasks that are neither critical nor completed and are missing a date, so the span shown is inferred.",
  "\u672A\u5B8C\u6210\u3001\u4E14\u8D77\u6B62\u65E5\u671F\u5B8C\u6574\u7684\u4EFB\u52A1\u3002": "Tasks that are still open and have both dates.",
  "\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1\uFF08\u52FE\u9009\u6846\u4E3A x\uFF09\u3002": "Tasks whose checkbox is ticked.",
  "\u9ED8\u8BA4\uFF1A{value}": "Default: {value}",
  "\u7EA2": "Red",
  "\u6A59": "Orange",
  "\u9EC4": "Yellow",
  "\u7EFF": "Green",
  "\u9752": "Cyan",
  "\u84DD": "Blue",
  "\u7D2B": "Purple",
  "\u7C89": "Pink",
  // ── task editor ──────────────────────────────────────────────────
  "\u7F16\u8F91\u4EFB\u52A1": "Edit task",
  "\u63CF\u8FF0": "Description",
  "\u4EFB\u52A1\u63CF\u8FF0": "Task description",
  "\u4EFB\u52A1 ID": "Task ID",
  "\u7528\u4E8E\u88AB\u5176\u4ED6\u4EFB\u52A1\u4F9D\u8D56": "Used by other tasks as a dependency",
  "\u968F\u673A\u751F\u6210 ID": "Generate a random ID",
  "\u4F9D\u8D56\u4EFB\u52A1": "Depends on",
  "\u4E0D\u4F9D\u8D56": "No dependency",
  "\uFF08\u622A\u6B62 {date}\uFF09": "(due {date})",
  "\u521B\u5EFA": "Create",
  "\u4FDD\u5B58": "Save",
  "\u8BF7\u586B\u5199\u4EFB\u52A1\u63CF\u8FF0": "Enter a task description",
  "\u627E\u4E0D\u5230\u6587\u4EF6\uFF1A{path}": "File not found: {path}",
  "\u8BF7\u5148\u5728\u8BBE\u7F6E\u91CC\u6307\u5B9A\u76EE\u6807\u7B14\u8BB0\uFF0C\u6216\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u4EF6": "Set a target note in the settings, or open a Markdown file first",
  "\u5DF2\u6DFB\u52A0\u5230 {path}": "Added to {path}",
  "\u65E0\u6CD5\u6DFB\u52A0\u4EFB\u52A1\uFF1A{reason}": "Cannot add the task: {reason}",
  "\u627E\u4E0D\u5230\u6807\u9898\u300C{heading}\u300D": 'Heading "{heading}" not found',
  "\u6807\u9898\u683C\u5F0F\u4E0D\u5408\u6CD5": "Invalid heading format",
  "\u5728 {path}:{line} \u627E\u4E0D\u5230\u8BE5\u4EFB\u52A1\u884C": "Task line not found in {path}:{line}",
  // ── confirm dialogs ──────────────────────────────────────────────
  "\u5F00\u59CB\u65E5\u671F\uFF08{start}\uFF09\u665A\u4E8E\u622A\u6B62\u65E5\u671F\uFF08{due}\uFF09\u3002": "The start date ({start}) is later than the due date ({due}).",
  "\u8981\u628A\u622A\u6B62\u65E5\u671F\u8C03\u6574\u5230\u4ECA\u5929\uFF0C\u8FD8\u662F\u4FDD\u7559\u539F\u65E5\u671F\u5E76\u6807\u8BB0\u4E3A\u51B2\u7A81\uFF1F": "Adjust the due date to today, or keep it and mark the conflict?",
  "\u8C03\u6574\u622A\u6B62\u65E5\u671F": "Adjust due date",
  "\u6807\u8BB0\u51B2\u7A81": "Mark as conflicting",
  "\u5DF2\u628A\u622A\u6B62\u65E5\u671F\u8C03\u6574\u4E3A\u4ECA\u5929": "Due date adjusted to today",
  "\u5220\u9664\u4EFB\u52A1": "Delete task",
  "\u786E\u5B9A\u8981\u5220\u9664\u300C{description}\u300D\u5417\uFF1F\u8FD9\u4E00\u884C\u4F1A\u4ECE\u7B14\u8BB0\u91CC\u79FB\u9664\u3002": 'Delete "{description}"? The line is removed from the note.',
  // ── settings: interface / scanning ───────────────────────────────
  "\u754C\u9762": "Interface",
  "\u754C\u9762\u8BED\u8A00": "Interface language",
  "\u81EA\u52A8": "Automatic",
  "\u4E2D\u6587": "\u4E2D\u6587",
  "\u81EA\u52A8\u8DDF\u968F Obsidian \u7684\u754C\u9762\u8BED\u8A00\u3002": "Follow the Obsidian interface language.",
  "\u626B\u63CF\u8303\u56F4": "Scanning",
  "\u626B\u63CF\u76EE\u5F55": "Scan folders",
  "\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\u591A\u4E2A\u76EE\u5F55\u3002\u7559\u7A7A\u8868\u793A\u626B\u63CF\u6574\u4E2A\u4ED3\u5E93\uFF08\u5927\u5E93\u4F1A\u5F88\u6162\uFF09\u3002\u5F53\u524D\u9ED8\u8BA4\uFF1A{folders}": "Comma separated folders to scan. Leave empty to scan the whole vault (slow on large vaults). Current default: {folders}",
  "\u6392\u9664\u76EE\u5F55": "Excluded folders",
  "\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\u591A\u4E2A\u76EE\u5F55\uFF0C\u5176\u4E0B\u7684\u4EFB\u52A1\u4E0D\u53C2\u4E0E\u7EDF\u8BA1\u3002": "Comma separated folders whose tasks are left out of every view.",
  // ── settings: markers ────────────────────────────────────────────
  "\u4EFB\u52A1\u6807\u8BB0": "Task markers",
  "\u5DF2\u5B8C\u6210\u6807\u8BB0": "Completion markers",
  "\u65B9\u62EC\u53F7\u91CC\u7684\u5185\u5BB9\uFF0C\u9017\u53F7\u5206\u9694\u3002\u9ED8\u8BA4 x \u4E0E X\u3002": "Checkbox contents, comma separated. Defaults to x and X.",
  "\u5DF2\u53D6\u6D88\u6807\u8BB0": "Cancelled markers",
  "\u65B9\u62EC\u53F7\u91CC\u7684\u5185\u5BB9\uFF0C\u9017\u53F7\u5206\u9694\u3002\u9ED8\u8BA4\u77ED\u6A2A\u7EBF\u3002": "Checkbox contents, comma separated. Defaults to a hyphen.",
  "\u5FFD\u7565\u6807\u8BB0": "Ignored markers",
  "\u5E26\u8FD9\u4E9B\u6807\u8BB0\u7684\u4EFB\u52A1\u4E0D\u8FDB\u89C6\u56FE\u4E5F\u4E0D\u8FDB\u7EDF\u8BA1\uFF0C\u9017\u53F7\u5206\u9694\u3002": "Tasks with these markers are skipped in views and counts, comma separated.",
  "\u81EA\u52A8\u8BB0\u5F55\u5B8C\u6210\u65E5\u671F": "Track completion date",
  "\u52FE\u9009\u5B8C\u6210\u65F6\u81EA\u52A8\u8865\u4E0A\u5B8C\u6210\u6807\u8BB0\u4E0E\u5F53\u5929\u65E5\u671F\uFF0C\u91CD\u65B0\u6253\u5F00\u65F6\u79FB\u9664\u3002": "Adds the completion marker and today's date when you complete a task, and removes it when you reopen.",
  // ── settings: display ────────────────────────────────────────────
  "\u663E\u793A": "Display",
  "\u9ED8\u8BA4\u89C6\u56FE": "Default view",
  "\u6253\u5F00\u65F6\u5148\u663E\u793A\u54EA\u4E00\u79CD\u9762\u677F\u3002": "Which panel to show first.",
  "\u6253\u5F00\u4F4D\u7F6E": "Open location",
  "\u53F3\u4FA7\u8FB9\u680F": "Right sidebar",
  "\u65B0\u6807\u7B7E\u9875": "New tab",
  "\u9762\u677F\u6253\u5F00\u5728\u53F3\u4FA7\u8FB9\u680F\u8FD8\u662F\u65B0\u6807\u7B7E\u9875\u3002": "Open the panel in the right sidebar or a new tab.",
  "\u7D27\u6025\u5929\u6570": "Urgent window",
  "\u8DDD\u4ECA\u591A\u5C11\u5929\u5185\u6709\u622A\u6B62\u65E5\u7684\u4EFB\u52A1\u7B97\u7D27\u6025\uFF0C\u77E9\u9635\u636E\u6B64\u5212\u5165\u7D27\u6025\u8C61\u9650\u3002": "How many days ahead counts as urgent. Tasks due within it land in the urgent quadrants.",
  "\u622A\u6B62\u65E5\u663E\u793A\u8303\u56F4": "Due date range",
  "\u53EA\u94FA\u51FA\u8FD9\u4E48\u591A\u6708\u5185\u5230\u671F\u7684\u4EFB\u52A1\uFF0C\u903E\u671F\u4E0E\u5DF2\u5B8C\u6210\u7684\u59CB\u7EC8\u663E\u793A\u30020 \u8868\u793A\u4E0D\u9650\u5236\u3002": "Only show tasks due within this many months. Overdue and completed tasks always show. 0 means no limit.",
  "\u9690\u85CF\u8FDC\u671F\u5F00\u59CB\u7684\u4EFB\u52A1": "Hide tasks that start far ahead",
  "\u5F00\u59CB\u65E5\u5728 1 \u4E2A\u6708\u4E4B\u540E\u7684\u5148\u4E0D\u94FA\u51FA\u6765\u3002": "Hide tasks that start more than one month away.",
  "\u94FA\u51FA\u65E0\u622A\u6B62\u65E5\u7684\u5DF2\u5B8C\u6210\u4EFB\u52A1": "Show completed tasks without a due date",
  "\u5173\u95ED\u65F6\uFF0C\u5DF2\u5B8C\u6210\u4EFB\u52A1\u8981\u6709\u5B8C\u6210\u65E5\u6216\u622A\u6B62\u65E5\u624D\u4F1A\u663E\u793A\u3002": "When off, a completed task needs a completion or due date to show.",
  "\u5DF2\u5B8C\u6210\u4EFB\u52A1\u7684\u663E\u793A\u8303\u56F4": "Completed task range",
  "\u53EA\u94FA\u51FA\u8FD9\u4E48\u591A\u6708\u5185\u5B8C\u6210\u7684\u5DF2\u5B8C\u6210\u4EFB\u52A1\uFF0C0 \u8868\u793A\u4E0D\u9650\u5236\u3002": "Only show tasks completed within this many months. 0 means no limit.",
  "\u6392\u5E8F\u6863\u4F4D\u8BF4\u660E": "Sort options",
  "\u6392\u5E8F\u5728\u7B5B\u9009\u680F\u91CC\u968F\u65F6\u53EF\u6539\uFF0C\u53EF\u9009\uFF1A{modes}": "Sorting can be changed from the filter bar at any time: {modes}",
  // ── settings: new tasks ──────────────────────────────────────────
  "\u76EE\u6807\u7B14\u8BB0\u8DEF\u5F84": "Target note path",
  "\u76EE\u6807\u6807\u9898": "Target heading",
  "\u628A\u65B0\u4EFB\u52A1\u63D2\u5230\u54EA\u4E2A\u6807\u9898\u4E0B\uFF08\u8981\u5E26\u4E0A\u4E95\u53F7\uFF09\u3002\u7559\u7A7A\u8868\u793A\u8FFD\u52A0\u5230\u6587\u672B\u3002": "Heading to insert new tasks under (include the #). Leave empty to append at the end of the note.",
  // ── settings: list ───────────────────────────────────────────────
  "\u5217\u8868\u89C6\u56FE": "List view",
  "\u6309\u6587\u4EF6\u5939\u5206\u7EC4": "Group by folder",
  "\u6309\u7B14\u8BB0\u5206\u7EC4": "Group by note",
  "\u5217\u8868\u89C6\u56FE\u91CC\u6309\u6240\u5728\u6587\u4EF6\u5939\u5212\u5206\u5BB9\u5668\u3002": "Split list view containers by folder.",
  "\u5206\u7EC4\u5C42\u7EA7": "Folder depth",
  "\u53D6\u6587\u4EF6\u8DEF\u5F84\u7684\u524D\u51E0\u5C42\u4F5C\u4E3A\u5BB9\u5668\u540D\u3002": "How many leading folders to use as the container name.",
  "\u5F52\u6863, \u6A21\u677F": "Archive, Templates",
  // ── settings: calendar ───────────────────────────────────────────
  "\u65E5\u5386\u89C6\u56FE": "Calendar view",
  "\u6BCF\u5468\u7B2C\u4E00\u5929": "First day of week",
  "\u51B3\u5B9A\u65E5\u5386\u91CC\u4E00\u5468\u4ECE\u54EA\u5929\u6392\u8D77\u3002": "Which day a calendar week starts on.",
  "\u6708\u89C6\u56FE\u663E\u793A\u5468\u672B": "Show weekends in month view",
  "\u5173\u95ED\u540E\u53EA\u5217\u5DE5\u4F5C\u65E5\u3002": "When off, only weekdays are shown.",
  "\u5468\u89C6\u56FE\u663E\u793A\u5468\u672B": "Show weekends in week view",
  "\u5F00\u542F\u540E\u5468\u672B\u5355\u72EC\u6392\u5728\u4E0B\u65B9\u4E00\u884C\u3002": "When on, weekends move to their own row below.",
  "\u5217\u8868\u89C6\u56FE\u663E\u793A\u6574\u6708": "Show the whole month in list view",
  "\u5173\u95ED\u540E\u53EA\u5217\u51FA\u6709\u4EFB\u52A1\u7684\u65E5\u671F\u3002": "When off, only dates with tasks are listed.",
  "\u94FA\u5F00\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1": "Spread in-progress tasks",
  "\u540C\u65F6\u6709\u5F00\u59CB\u65E5\u4E0E\u622A\u6B62\u65E5\u7684\u4EFB\u52A1\uFF0C\u4F1A\u5728\u8D77\u6B62\u4E4B\u95F4\u7684\u6BCF\u4E00\u5929\u90FD\u51FA\u73B0\u3002": "Tasks with both a start and a due date appear on every day in between."
};

// src/i18n/translate.ts
function detectLocale(hostLocale) {
  return hostLocale.toLowerCase().startsWith("zh") ? "zh" : "en";
}
function fillParams(text, params) {
  if (params === void 0) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name];
    return value === void 0 ? match : String(value);
  });
}
function translate(locale, key, params) {
  const text = locale === "en" ? EN[key] ?? key : key;
  return fillParams(text, params);
}

// src/i18n/index.ts
var current = "zh";
function getLocale() {
  return current;
}
function setLocale(locale) {
  if (locale === current) return false;
  current = locale;
  return true;
}
function applyLanguageSetting(setting, detected) {
  return setLocale(setting === "auto" ? detected : setting);
}
function t(key, params) {
  return translate(current, key, params);
}

// src/settings.ts
var import_obsidian = require("obsidian");

// src/types.ts
var DEFAULT_GANTT_BAR_COLORS = {
  active: "var(--color-blue)",
  done: "var(--color-green)",
  crit: "var(--color-red)",
  fallback: "var(--text-muted)"
};
var DEFAULT_SETTINGS = {
  uiLanguage: "auto",
  // Defaults keep the first index pass small instead of scanning the whole vault.
  scanFolders: ["500 Journal", "100 Projects"],
  excludeFolders: [],
  defaultView: "eisenhower",
  ganttBarColors: { ...DEFAULT_GANTT_BAR_COLORS },
  completedTaskDisplayRange: 1,
  includeCompletedWithoutDueDate: false,
  openLocation: "sidebar",
  completionMarkers: ["x", "X"],
  excludeMarkers: [],
  cancelledMarkers: ["-"],
  listGroupByFolder: false,
  listGroupByFolderDepth: 1,
  // 默认落到当日日志：新任务最常见的去处就是今天那条，缺了会被自动建出来
  newTaskTargetPath: "500 Journal/{{date:YYYY-MM-DD}}",
  newTaskTemplatePath: "",
  newTaskTargetHeading: "",
  trackCompletionDate: false,
  urgentDaysRange: 1,
  showCalendarWeekends: true,
  showCalendarMonthWeekends: true,
  calendarListShowFullMonth: false,
  showCalendarInProcessTasks: false,
  calendarFirstDayOfWeek: "monday",
  dueDateDisplayRange: 1,
  hideFutureStartTasks: true
};

// src/utils/date.ts
function formatIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayIso() {
  return formatIso(/* @__PURE__ */ new Date());
}
function isoDateOffset(days) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + days);
  return formatIso(date);
}
function isValidIso(value) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/u.test(value));
}
function parseIso(value) {
  if (!isValidIso(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
function startOfWeek(date, firstDay) {
  const result = startOfDay(date);
  const weekday = result.getDay();
  const offset = firstDay === "sunday" ? -weekday : weekday === 0 ? -6 : 1 - weekday;
  result.setDate(result.getDate() + offset);
  return result;
}
function weekdayOrder(firstDay) {
  return firstDay === "sunday" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
}
function isWeekend(weekday) {
  return weekday === 0 || weekday === 6;
}
var ISO_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/u;
function isoFromParts(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function parseIsoParts(iso) {
  const match = ISO_PREFIX.exec(iso);
  if (match === null) {
    const now2 = /* @__PURE__ */ new Date();
    return { year: now2.getFullYear(), month: now2.getMonth() + 1, day: now2.getDate() };
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function addDaysIso(iso, days) {
  const { year, month, day } = parseIsoParts(iso);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return isoFromParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}
function diffDaysIso(fromIso, toIso) {
  const from = parseIsoParts(fromIso);
  const to = parseIsoParts(toIso);
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 864e5);
}
function weekdayOfIso(iso) {
  const { year, month, day } = parseIsoParts(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
function minIso(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return a <= b ? a : b;
}
function maxIso(a, b) {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}
function monthStartIso(iso) {
  const { year, month } = parseIsoParts(iso);
  return isoFromParts(year, month, 1);
}
function monthEndIso(iso) {
  const { year, month } = parseIsoParts(iso);
  return isoFromParts(year, month, daysInMonth(year, month));
}

// src/parser/task-parser.ts
var PRIORITY_MARKERS = [
  ["\u{1F53A}", "critical" /* Critical */],
  ["\u23EB", "highest" /* Highest */],
  ["\u{1F53C}", "high" /* High */],
  ["\u{1F53D}", "low" /* Low */],
  ["\u23EC", "lowest" /* Lowest */]
];
var FIELD_PATTERNS = {
  dueDate: /\ud83d\udcc5\s*(\d{4}-\d{2}-\d{2})/u,
  startDate: /\ud83d\udeeb\ufe0f?\s*(\d{4}-\d{2}-\d{2})/u,
  scheduledDate: /\u23f3\s*(\d{4}-\d{2}-\d{2})/u,
  doneDate: /\u2705\s*(\d{4}-\d{2}-\d{2})/u,
  createdDate: /\u2795\s*(\d{4}-\d{2}-\d{2})/u,
  recurrence: /\ud83d\udd04\s*([^\n]+)/u,
  taskIdIcon: /\ud83c\udd94\s*([^\s#]+)/u,
  taskIdField: /\bid::\s*([^\s#]+)/iu,
  dependsIcon: /\u26d4\s*([^\s#]+)/u,
  dependsField: /\bdependsOn::\s*([^\s#]+)/iu
};
var TASK_PATTERN = /^[ \t]*[-*][ \t]\[([^\]]*)\][ \t]+(.*)$/u;
var INLINE_FIELD_TOKEN_SOURCE = "\u{1F4C5}\\s*\\d{4}-\\d{2}-\\d{2}|\u{1F6EB}\\s*\\d{4}-\\d{2}-\\d{2}|\u23F3\\s*\\d{4}-\\d{2}-\\d{2}|\u2705\\s*\\d{4}-\\d{2}-\\d{2}|\u2795\\s*\\d{4}-\\d{2}-\\d{2}|\u{1F194}\\s*\\S+|\u26D4\\s*\\S+|\u{1F53A}|\u23EB|\u{1F53C}|\u{1F53D}|\u23EC|#[\\p{L}\\p{N}_/-]+|\\w+::\\s*\\S+";
function extractValue(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim();
}
function cleanDescription(raw) {
  return raw.replace(FIELD_PATTERNS.dueDate, "").replace(FIELD_PATTERNS.startDate, "").replace(FIELD_PATTERNS.scheduledDate, "").replace(FIELD_PATTERNS.doneDate, "").replace(FIELD_PATTERNS.createdDate, "").replace(FIELD_PATTERNS.recurrence, "").replace(FIELD_PATTERNS.taskIdIcon, "").replace(FIELD_PATTERNS.taskIdField, "").replace(FIELD_PATTERNS.dependsIcon, "").replace(FIELD_PATTERNS.dependsField, "").replace(/[\u{1f4c5}\u{1f6eb}\u{23f3}\u{2705}\u{2795}\u{1f504}\u{1f194}\u{26d4}\u{1f53c}\u{23eb}\u{1f53d}\u{23ec}\u{1f53a}]/gu, "").replace(/\s+/g, " ").trim();
}
function isCompletedCheckbox(checkboxContent, completionMarkers) {
  const trimmed = checkboxContent.trim();
  return completionMarkers.includes(trimmed);
}
function isCancelledCheckbox(checkboxContent, cancelledMarkers) {
  const trimmed = checkboxContent.trim();
  return cancelledMarkers.includes(trimmed);
}
function computeDisplayStatus(checkboxContent, completionMarkers, cancelledMarkers, dueDate, startDate) {
  if (isCompletedCheckbox(checkboxContent, completionMarkers)) {
    return "completed";
  }
  if (isCancelledCheckbox(checkboxContent, cancelledMarkers)) {
    return "cancelled";
  }
  const today = todayIso();
  if (dueDate && dueDate < today) {
    return "overdue";
  }
  if (startDate && startDate > today) {
    return "to-be-started";
  }
  return "open";
}
function computeGtdState(displayStatus, checkboxContent, description, dueDate, startDate, blocked) {
  if (displayStatus === "completed" || displayStatus === "cancelled") {
    return "Done";
  }
  const desc = description.toLowerCase();
  const today = todayIso();
  if (blocked || desc.includes("#waiting") || desc.includes("#delegated") || desc.includes("#blocked")) {
    return "Waiting";
  }
  if (desc.includes("#started") || desc.includes("#doing") || desc.includes("#active")) {
    return "In Progress";
  }
  if (dueDate && dueDate < today) {
    return "Overdue";
  }
  if (startDate) {
    if (startDate < today) {
      return "In Progress";
    } else if (startDate > today) {
      return "To be Started";
    }
  }
  if (desc.includes("#doing") || desc.includes("#active") || desc.includes("#next")) {
    return "In Progress";
  }
  return "Inbox";
}
function computeQuadrant(priority, dueDate, urgentDaysRange) {
  const isImportant = priority === "critical" /* Critical */ || priority === "highest" /* Highest */ || priority === "high" /* High */;
  const urgentDeadline = isoDateOffset(urgentDaysRange - 1);
  const isUrgent = Boolean(dueDate && dueDate <= urgentDeadline);
  if (isImportant && isUrgent) return "Q1";
  if (isImportant && !isUrgent) return "Q2";
  if (!isImportant && isUrgent) return "Q3";
  return "Q4";
}
function priorityRank(priority) {
  switch (priority) {
    case "critical" /* Critical */:
      return 6;
    case "highest" /* Highest */:
      return 5;
    case "high" /* High */:
      return 4;
    case "medium" /* Medium */:
      return 3;
    case "none" /* None */:
      return 2;
    case "low" /* Low */:
      return 1;
    case "lowest" /* Lowest */:
      return 0;
  }
}
function parseTaskLine(line, filePath, lineNumber, settings) {
  const match = line.match(TASK_PATTERN);
  if (!match) return null;
  const checkboxContent = match[1];
  if (checkboxContent.includes("::")) return null;
  const rawDescription = match[2];
  const priority = PRIORITY_MARKERS.find(([marker]) => rawDescription.includes(marker))?.[1] ?? "none" /* None */;
  const dueDate = extractValue(rawDescription, FIELD_PATTERNS.dueDate);
  const startDate = extractValue(rawDescription, FIELD_PATTERNS.startDate);
  const scheduledDate = extractValue(rawDescription, FIELD_PATTERNS.scheduledDate);
  const doneDate = extractValue(rawDescription, FIELD_PATTERNS.doneDate);
  const createdDate = extractValue(rawDescription, FIELD_PATTERNS.createdDate);
  const recurrence = extractValue(rawDescription, FIELD_PATTERNS.recurrence);
  const taskId = extractValue(rawDescription, FIELD_PATTERNS.taskIdIcon) ?? extractValue(rawDescription, FIELD_PATTERNS.taskIdField);
  const dependsOn = extractValue(rawDescription, FIELD_PATTERNS.dependsIcon) ?? extractValue(rawDescription, FIELD_PATTERNS.dependsField);
  const tags = Array.from(rawDescription.matchAll(/(^|\s)(#[\p{L}\p{N}_/-]+)/gu)).map((entry) => entry[2].toLowerCase());
  const description = cleanDescription(rawDescription);
  const blocked = Boolean(dependsOn);
  const displayStatus = computeDisplayStatus(checkboxContent, settings.completionMarkers, settings.cancelledMarkers, dueDate, startDate);
  const gtdState = computeGtdState(displayStatus, checkboxContent, description, dueDate, startDate, blocked);
  const quadrant = computeQuadrant(priority, dueDate, settings.urgentDaysRange);
  return {
    id: `${filePath}:${lineNumber}:${description}`,
    filePath,
    lineNumber,
    lineText: line,
    description,
    checkboxStatus: checkboxContent,
    displayStatus,
    priority,
    dueDate,
    startDate,
    scheduledDate,
    doneDate,
    createdDate,
    recurrence,
    taskId,
    dependsOn,
    tags,
    blocked,
    gtdState,
    quadrant
  };
}
function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

// src/services/filter-service.ts
var TASK_STATUSES = [
  "open",
  "to-be-started",
  "overdue",
  "completed",
  "cancelled"
];
function statusLabel(status) {
  switch (status) {
    case "open":
      return t("\u672A\u5F00\u59CB");
    case "to-be-started":
      return t("\u5F85\u5F00\u59CB");
    case "overdue":
      return t("\u5DF2\u903E\u671F");
    case "completed":
      return t("\u5DF2\u5B8C\u6210");
    case "cancelled":
      return t("\u5DF2\u53D6\u6D88");
    case "in-progress":
      return t("\u8FDB\u884C\u4E2D");
  }
}
function priorityLabel(priority) {
  switch (priority) {
    case "critical" /* Critical */:
      return t("\u7D27\u6025");
    case "highest" /* Highest */:
      return t("\u6700\u9AD8");
    case "high" /* High */:
      return t("\u9AD8");
    case "medium" /* Medium */:
      return t("\u4E2D");
    case "low" /* Low */:
      return t("\u4F4E");
    case "lowest" /* Lowest */:
      return t("\u6700\u4F4E");
    default:
      return t("\u65E0");
  }
}
function statusPresetLabel(preset) {
  switch (preset) {
    case "active-only":
      return t("\u53EA\u770B\u672A\u5B8C\u6210");
    case "hide-cancelled":
      return t("\u9690\u85CF\u5DF2\u53D6\u6D88");
    default:
      return t("\u5168\u90E8\u72B6\u6001");
  }
}
function presetToStatuses(preset) {
  switch (preset) {
    case "active-only":
      return ["open", "to-be-started", "overdue"];
    case "hide-cancelled":
      return TASK_STATUSES.filter((status) => status !== "cancelled");
    default:
      return [...TASK_STATUSES];
  }
}
function detectStatusPreset(statuses) {
  for (const preset of ["active-only", "hide-cancelled", "all"]) {
    const expected = presetToStatuses(preset);
    if (expected.length === statuses.length && expected.every((status) => statuses.includes(status))) {
      return preset;
    }
  }
  return "all";
}
function sortModeLabel(mode) {
  switch (mode) {
    case "due-asc":
      return t("\u622A\u6B62\u65E5 \u2191");
    case "due-desc":
      return t("\u622A\u6B62\u65E5 \u2193");
    case "start-asc":
      return t("\u5F00\u59CB\u65E5 \u2191");
    case "priority":
      return t("\u4F18\u5148\u7EA7");
    default:
      return t("\u6587\u4EF6\u540D");
  }
}
var SORT_MODES = ["due-asc", "due-desc", "start-asc", "priority", "file"];
function datePresetLabel(preset) {
  switch (preset) {
    case "today":
      return t("\u4ECA\u5929");
    case "week":
      return t("\u672C\u5468");
    case "month":
      return t("\u672C\u6708");
    case "year":
      return t("\u672C\u5E74");
    case "custom":
      return t("\u81EA\u5B9A\u4E49\u533A\u95F4");
    default:
      return t("\u4E0D\u9650");
  }
}
var DATE_PRESETS = ["all", "today", "week", "month", "year", "custom"];
function emptyDateRange() {
  return { preset: "all", start: null, end: null };
}
function defaultFilterState() {
  return {
    search: "",
    statuses: [...TASK_STATUSES],
    markers: [],
    startDate: emptyDateRange(),
    dueDate: emptyDateRange()
  };
}
function initialFilterState() {
  return {
    search: "",
    statuses: presetToStatuses("hide-cancelled"),
    markers: [],
    startDate: emptyDateRange(),
    dueDate: emptyDateRange()
  };
}
function collectMarkers(tasks, settings) {
  const present = new Set(tasks.map((task) => task.checkboxStatus.trim()));
  const preferred = ["", ...settings.completionMarkers, ...settings.cancelledMarkers].map((marker) => marker.trim());
  const ordered = [];
  for (const marker of preferred) {
    if (present.has(marker) && !ordered.includes(marker)) ordered.push(marker);
  }
  const rest = [...present].filter((marker) => !ordered.includes(marker)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest];
}
function markerLabel(marker) {
  return marker.length === 0 ? "[ ]" : `[${marker}]`;
}
function toggle(list, value) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}
function hasActiveFilter(state) {
  return state.search.trim().length > 0 || detectStatusPreset(state.statuses) !== "all" || state.markers.length > 0 || state.startDate.preset !== "all" || state.dueDate.preset !== "all";
}
function resolveDateRange(range, today) {
  if (range.preset === "custom") return { start: range.start, end: range.end };
  const now2 = parseIso(today) ?? /* @__PURE__ */ new Date();
  switch (range.preset) {
    case "today":
      return { start: today, end: today };
    case "week": {
      const start = startOfWeek(now2, "monday");
      return { start: formatIso(start), end: formatIso(addDays(start, 6)) };
    }
    case "month": {
      const start = new Date(now2.getFullYear(), now2.getMonth(), 1);
      const end = new Date(now2.getFullYear(), now2.getMonth() + 1, 0);
      return { start: formatIso(start), end: formatIso(end) };
    }
    case "year": {
      const start = new Date(now2.getFullYear(), 0, 1);
      const end = new Date(now2.getFullYear(), 11, 31);
      return { start: formatIso(start), end: formatIso(end) };
    }
    default:
      return { start: null, end: null };
  }
}
function matchesRange(dateIso, range, today) {
  if (range.preset === "all") return true;
  if (!dateIso) return false;
  const { start, end } = resolveDateRange(range, today);
  if (start !== null && dateIso < start) return false;
  if (end !== null && dateIso > end) return false;
  return true;
}
function applyFilters(tasks, state, today = todayIso()) {
  const keyword = state.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (!state.statuses.includes(task.displayStatus)) return false;
    if (state.markers.length > 0 && !state.markers.includes(task.checkboxStatus.trim())) {
      return false;
    }
    if (!matchesRange(task.startDate, state.startDate, today)) return false;
    if (!matchesRange(task.dueDate, state.dueDate, today)) return false;
    if (keyword.length > 0) {
      const haystack = [task.description, task.filePath, task.taskId, task.dependsOn].filter((value) => Boolean(value)).join(" ").toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}
function applyVisibilityRanges(tasks, settings, today = todayIso()) {
  const maxDue = settings.dueDateDisplayRange > 0 ? isoOffsetFrom(today, settings.dueDateDisplayRange * 30) : null;
  const maxStart = settings.hideFutureStartTasks ? isoOffsetFrom(today, 30) : null;
  const completedCutoff = settings.completedTaskDisplayRange > 0 ? isoOffsetFrom(today, -settings.completedTaskDisplayRange * 30) : null;
  return tasks.filter((task) => {
    if (task.displayStatus === "completed" && !settings.includeCompletedWithoutDueDate) {
      const reference = task.doneDate ?? task.dueDate;
      if (reference === void 0) return false;
      if (completedCutoff !== null && reference < completedCutoff) return false;
    }
    if (maxDue !== null && task.dueDate && task.dueDate > maxDue) {
      const pinned = task.displayStatus === "overdue" || task.displayStatus === "completed" || task.displayStatus === "cancelled";
      if (!pinned) return false;
    }
    if (maxStart !== null && task.startDate && task.displayStatus === "to-be-started" && task.startDate > maxStart) {
      return false;
    }
    return true;
  });
}
function isoOffsetFrom(baseIso, days) {
  const base = parseIso(baseIso);
  return base === null ? baseIso : formatIso(addDays(base, days));
}
function sortTasks(tasks, mode) {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    switch (mode) {
      case "due-desc":
        return compareOptionalDesc(a.dueDate, b.dueDate) || compareByFile(a, b);
      case "start-asc":
        return compareOptionalAsc(a.startDate, b.startDate) || compareByFile(a, b);
      case "priority":
        return priorityRank(b.priority) - priorityRank(a.priority) || compareOptionalAsc(a.dueDate, b.dueDate) || compareByFile(a, b);
      case "file":
        return compareByFile(a, b);
      default:
        return compareOptionalAsc(a.dueDate, b.dueDate) || priorityRank(b.priority) - priorityRank(a.priority) || compareByFile(a, b);
    }
  });
  return sorted;
}
function compareOptionalAsc(a, b) {
  if (a === b) return 0;
  if (a === void 0) return 1;
  if (b === void 0) return -1;
  return a.localeCompare(b);
}
function compareOptionalDesc(a, b) {
  if (a === b) return 0;
  if (a === void 0) return 1;
  if (b === void 0) return -1;
  return b.localeCompare(a);
}
function compareByFile(a, b) {
  if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
  return a.lineNumber - b.lineNumber;
}

// src/settings.ts
var TaskMatrixSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin, host) {
    super(app, plugin);
    this.host = host;
    /**
     * 当前停在哪一页。
     *
     * 存成实例状态而不是每次回到第一页：开关（比如「铺出无截止日的已完成任务」）
     * 会重绘整个设置页，回到第一页会让人以为自己点错了。
     */
    this.activeTab = "general";
  }
  /**
   * 每次都从 host 现取，不缓存引用：设置对象在保存/迁移时会被整份替换，
   * 缓存一份就会在「改了没生效」时骗自己。
   */
  get settings() {
    return this.host.settings;
  }
  persist(rescan = false) {
    void this.host.persistSettings(rescan);
  }
  /** Obsidian 每次打开设置页都会调它；内部一律转 `render()`，重绘只走一条路 */
  display() {
    this.render();
  }
  tabs() {
    return [
      {
        id: "general",
        label: t("\u901A\u7528"),
        lead: t("\u626B\u63CF\u8303\u56F4\u3001\u754C\u9762\u8BED\u8A00\u4E0E\u4EFB\u52A1\u6807\u8BB0\u7684\u5199\u6CD5\u3002\u6539\u52A8\u4F1A\u89E6\u53D1\u4E00\u6B21\u5168\u5E93\u91CD\u65B0\u7D22\u5F15\u3002"),
        render: (host) => {
          this.renderLanguage(host);
          this.renderScanning(host);
          this.renderMarkers(host);
        }
      },
      {
        id: "newtask",
        label: t("\u65B0\u5EFA\u4EFB\u52A1"),
        lead: t("\u65B0\u5EFA\u4EFB\u52A1\u843D\u5230\u54EA\u7BC7\u7B14\u8BB0\u3001\u7528\u54EA\u4E2A\u6A21\u677F\u3001\u63D2\u5230\u54EA\u4E2A\u6807\u9898\u4E0B\u3002"),
        render: (host) => {
          this.renderNewTasks(host);
          this.renderJournalTemplate(host);
        }
      },
      {
        id: "view",
        label: t("\u89C6\u56FE\u504F\u597D"),
        lead: t("\u6253\u5F00\u89C6\u56FE\u65F6\u7684\u9ED8\u8BA4\u72B6\u6001\uFF0C\u4EE5\u53CA\u9762\u677F\u6A21\u5F0F\u94FA\u51FA\u54EA\u4E9B\u4EFB\u52A1\u3002"),
        render: (host) => {
          this.renderDisplay(host);
          this.renderList(host);
        }
      },
      {
        id: "calendar",
        label: t("\u65E5\u5386\u4E0E\u7518\u7279"),
        lead: t("\u65E5\u5386\u4E0E\u7518\u7279\u5404\u81EA\u7684\u663E\u793A\u53E3\u5F84\u548C\u914D\u8272\uFF0C\u4E92\u4E0D\u5F71\u54CD\u3002"),
        render: (host) => {
          this.renderCalendar(host);
          this.renderGantt(host);
        }
      }
    ];
  }
  render() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("tm-settings");
    const tabs = this.tabs();
    this.renderTabBar(containerEl, tabs);
    const body = containerEl.createDiv({ cls: "tm-settings__body", attr: { role: "tabpanel" } });
    const active = tabs.find((tab) => tab.id === this.activeTab) ?? tabs[0];
    if (active === void 0) return;
    body.createDiv({ cls: "tm-settings__lead", text: active.lead });
    active.render(body);
  }
  renderTabBar(host, tabs) {
    const bar = host.createDiv({ cls: "tm-settings__tabs", attr: { role: "tablist" } });
    for (const tab of tabs) {
      const isActive = tab.id === this.activeTab;
      const button = bar.createEl("button", {
        cls: `tm-settings__tab${isActive ? " is-active" : ""}`,
        text: tab.label,
        attr: { type: "button", role: "tab", "aria-selected": String(isActive) }
      });
      button.addEventListener("click", () => this.switchTab(tab.id, false));
      button.addEventListener("keydown", (event) => this.onTabKeyDown(event, tabs, tab.id));
    }
  }
  switchTab(id, focus) {
    if (id === this.activeTab) return;
    this.activeTab = id;
    this.render();
    if (focus) {
      this.containerEl.querySelector(".tm-settings__tab.is-active")?.focus();
    }
  }
  /** 方向键在 tab 间移动：键盘用户不必退回列表再选下一个 */
  onTabKeyDown(event, tabs, id) {
    const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (offset !== 0) {
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.id === id);
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      if (next !== void 0) this.switchTab(next.id, true);
      return;
    }
    if (event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const target = event.key === "Home" ? tabs[0] : tabs[tabs.length - 1];
    if (target !== void 0) this.switchTab(target.id, true);
  }
  renderLanguage(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u754C\u9762")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u754C\u9762\u8BED\u8A00")).setDesc(t("\u81EA\u52A8\u8DDF\u968F Obsidian \u7684\u754C\u9762\u8BED\u8A00\u3002")).addDropdown(
      (dropdown) => dropdown.addOption("auto", t("\u81EA\u52A8")).addOption("zh", t("\u4E2D\u6587")).addOption("en", "English").setValue(this.settings.uiLanguage).onChange((value) => {
        this.settings.uiLanguage = value;
        this.persist();
        void this.host.refreshViews();
        this.display();
      })
    );
  }
  renderScanning(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u626B\u63CF\u8303\u56F4")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u626B\u63CF\u76EE\u5F55")).setDesc(
      t("\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\u591A\u4E2A\u76EE\u5F55\u3002\u7559\u7A7A\u8868\u793A\u626B\u63CF\u6574\u4E2A\u4ED3\u5E93\uFF08\u5927\u5E93\u4F1A\u5F88\u6162\uFF09\u3002\u5F53\u524D\u9ED8\u8BA4\uFF1A{folders}", {
        folders: DEFAULT_SETTINGS.scanFolders.join(", ")
      })
    ).addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.scanFolders.join(", ")).setValue(this.settings.scanFolders.join(", ")).onChange((value) => {
        this.settings.scanFolders = splitList(value);
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u6392\u9664\u76EE\u5F55")).setDesc(t("\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\u591A\u4E2A\u76EE\u5F55\uFF0C\u5176\u4E0B\u7684\u4EFB\u52A1\u4E0D\u53C2\u4E0E\u7EDF\u8BA1\u3002")).addText(
      (text) => text.setPlaceholder(t("\u5F52\u6863, \u6A21\u677F")).setValue(this.settings.excludeFolders.join(", ")).onChange((value) => {
        this.settings.excludeFolders = splitList(value);
        this.persist(true);
      })
    );
  }
  renderMarkers(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u4EFB\u52A1\u6807\u8BB0")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u5DF2\u5B8C\u6210\u6807\u8BB0")).setDesc(t("\u65B9\u62EC\u53F7\u91CC\u7684\u5185\u5BB9\uFF0C\u9017\u53F7\u5206\u9694\u3002\u9ED8\u8BA4 x \u4E0E X\u3002")).addText(
      (text) => text.setValue(this.settings.completionMarkers.join(", ")).onChange((value) => {
        const markers = splitList(value);
        this.settings.completionMarkers = markers.length > 0 ? markers : DEFAULT_SETTINGS.completionMarkers;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u5DF2\u53D6\u6D88\u6807\u8BB0")).setDesc(t("\u65B9\u62EC\u53F7\u91CC\u7684\u5185\u5BB9\uFF0C\u9017\u53F7\u5206\u9694\u3002\u9ED8\u8BA4\u77ED\u6A2A\u7EBF\u3002")).addText(
      (text) => text.setValue(this.settings.cancelledMarkers.join(", ")).onChange((value) => {
        const markers = splitList(value);
        this.settings.cancelledMarkers = markers.length > 0 ? markers : DEFAULT_SETTINGS.cancelledMarkers;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u5FFD\u7565\u6807\u8BB0")).setDesc(t("\u5E26\u8FD9\u4E9B\u6807\u8BB0\u7684\u4EFB\u52A1\u4E0D\u8FDB\u89C6\u56FE\u4E5F\u4E0D\u8FDB\u7EDF\u8BA1\uFF0C\u9017\u53F7\u5206\u9694\u3002")).addText(
      (text) => text.setPlaceholder("I, ?, !").setValue(this.settings.excludeMarkers.join(", ")).onChange((value) => {
        this.settings.excludeMarkers = splitList(value);
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u81EA\u52A8\u8BB0\u5F55\u5B8C\u6210\u65E5\u671F")).setDesc(t("\u52FE\u9009\u5B8C\u6210\u65F6\u81EA\u52A8\u8865\u4E0A\u5B8C\u6210\u6807\u8BB0\u4E0E\u5F53\u5929\u65E5\u671F\uFF0C\u91CD\u65B0\u6253\u5F00\u65F6\u79FB\u9664\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.trackCompletionDate).onChange((value) => {
        this.settings.trackCompletionDate = value;
        this.persist();
      })
    );
  }
  renderDisplay(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u663E\u793A")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u9ED8\u8BA4\u89C6\u56FE")).setDesc(t("\u6253\u5F00\u65F6\u5148\u663E\u793A\u54EA\u4E00\u79CD\u9762\u677F\u3002")).addDropdown(
      (dropdown) => dropdown.addOption("eisenhower", t("\u77E9\u9635")).addOption("gtd", t("GTD")).addOption("list", t("\u5217\u8868")).addOption("calendar", t("\u65E5\u5386")).addOption("gantt", t("\u7518\u7279")).setValue(this.settings.defaultView).onChange((value) => {
        this.settings.defaultView = value;
        this.persist();
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u6253\u5F00\u4F4D\u7F6E")).setDesc(t("\u9762\u677F\u6253\u5F00\u5728\u53F3\u4FA7\u8FB9\u680F\u8FD8\u662F\u65B0\u6807\u7B7E\u9875\u3002")).addDropdown(
      (dropdown) => dropdown.addOption("sidebar", t("\u53F3\u4FA7\u8FB9\u680F")).addOption("tab", t("\u65B0\u6807\u7B7E\u9875")).setValue(this.settings.openLocation).onChange((value) => {
        this.settings.openLocation = value;
        this.persist();
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u7D27\u6025\u5929\u6570")).setDesc(t("\u8DDD\u4ECA\u591A\u5C11\u5929\u5185\u6709\u622A\u6B62\u65E5\u7684\u4EFB\u52A1\u7B97\u7D27\u6025\uFF0C\u77E9\u9635\u636E\u6B64\u5212\u5165\u7D27\u6025\u8C61\u9650\u3002")).addSlider(
      (slider) => slider.setLimits(1, 7, 1).setValue(this.settings.urgentDaysRange).setDynamicTooltip().onChange((value) => {
        this.settings.urgentDaysRange = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u622A\u6B62\u65E5\u663E\u793A\u8303\u56F4")).setDesc(t("\u53EA\u94FA\u51FA\u8FD9\u4E48\u591A\u6708\u5185\u5230\u671F\u7684\u4EFB\u52A1\uFF0C\u903E\u671F\u4E0E\u5DF2\u5B8C\u6210\u7684\u59CB\u7EC8\u663E\u793A\u30020 \u8868\u793A\u4E0D\u9650\u5236\u3002")).addSlider(
      (slider) => slider.setLimits(0, 12, 1).setValue(this.settings.dueDateDisplayRange).setDynamicTooltip().onChange((value) => {
        this.settings.dueDateDisplayRange = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u9690\u85CF\u8FDC\u671F\u5F00\u59CB\u7684\u4EFB\u52A1")).setDesc(t("\u5F00\u59CB\u65E5\u5728 1 \u4E2A\u6708\u4E4B\u540E\u7684\u5148\u4E0D\u94FA\u51FA\u6765\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.hideFutureStartTasks).onChange((value) => {
        this.settings.hideFutureStartTasks = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u94FA\u51FA\u65E0\u622A\u6B62\u65E5\u7684\u5DF2\u5B8C\u6210\u4EFB\u52A1")).setDesc(t("\u5173\u95ED\u65F6\uFF0C\u5DF2\u5B8C\u6210\u4EFB\u52A1\u8981\u6709\u5B8C\u6210\u65E5\u6216\u622A\u6B62\u65E5\u624D\u4F1A\u663E\u793A\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.includeCompletedWithoutDueDate).onChange((value) => {
        this.settings.includeCompletedWithoutDueDate = value;
        this.persist(true);
        this.display();
      })
    );
    if (!this.settings.includeCompletedWithoutDueDate) {
      new import_obsidian.Setting(containerEl).setName(t("\u5DF2\u5B8C\u6210\u4EFB\u52A1\u7684\u663E\u793A\u8303\u56F4")).setDesc(t("\u53EA\u94FA\u51FA\u8FD9\u4E48\u591A\u6708\u5185\u5B8C\u6210\u7684\u5DF2\u5B8C\u6210\u4EFB\u52A1\uFF0C0 \u8868\u793A\u4E0D\u9650\u5236\u3002")).addSlider(
        (slider) => slider.setLimits(0, 12, 1).setValue(this.settings.completedTaskDisplayRange).setDynamicTooltip().onChange((value) => {
          this.settings.completedTaskDisplayRange = value;
          this.persist(true);
        })
      );
    }
    const activeModes = ["due-asc", "due-desc", "start-asc", "priority", "file"];
    new import_obsidian.Setting(containerEl).setName(t("\u6392\u5E8F\u6863\u4F4D\u8BF4\u660E")).setDesc(t("\u6392\u5E8F\u5728\u7B5B\u9009\u680F\u91CC\u968F\u65F6\u53EF\u6539\uFF0C\u53EF\u9009\uFF1A{modes}", {
      modes: activeModes.map((mode) => sortModeLabel(mode)).join("\u3001")
    }));
  }
  renderNewTasks(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u65B0\u5EFA\u4EFB\u52A1")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u76EE\u6807\u7B14\u8BB0\u8DEF\u5F84")).setDesc(
      t("\u65B0\u5EFA\u4EFB\u52A1\u7684\u843D\u70B9\uFF0C\u9ED8\u8BA4\u5199\u5230\u5F53\u65E5\u65E5\u5FD7\uFF1B\u7B14\u8BB0\u4E0D\u5B58\u5728\u65F6\u4F1A\u81EA\u52A8\u65B0\u5EFA\u3002\u7559\u7A7A\u8868\u793A\u5199\u8FDB\u5F53\u524D\u6253\u5F00\u7684\u7B14\u8BB0\u3002")
    ).addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.newTaskTargetPath).setValue(this.settings.newTaskTargetPath).onChange((value) => {
        this.settings.newTaskTargetPath = value.trim();
        this.persist();
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u76EE\u6807\u6807\u9898")).setDesc(t("\u628A\u65B0\u4EFB\u52A1\u63D2\u5230\u54EA\u4E2A\u6807\u9898\u4E0B\uFF08\u8981\u5E26\u4E0A\u4E95\u53F7\uFF09\u3002\u7559\u7A7A\u8868\u793A\u8FFD\u52A0\u5230\u6587\u672B\u3002")).addText(
      (text) => text.setPlaceholder("## \u4EFB\u52A1").setValue(this.settings.newTaskTargetHeading).onChange((value) => {
        this.settings.newTaskTargetHeading = value.trim();
        this.persist();
      })
    );
  }
  /**
   * 日志模板。
   *
   * 与 Project Master 的「新建项目模板」同口径：模板是**一篇笔记**，不是设置里的一段文本 ——
   * 模板里通常还有 frontmatter、Templater 命令、其他插件要解析的东西，复制进设置页就全丢了。
   * 占位符只解 `{{title}}` / `{{date}}` / `{{time}}`，`<% %>` 原样留着交给 Templater 自己执行。
   */
  renderJournalTemplate(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u65E5\u5FD7\u6A21\u677F")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u6A21\u677F\u7B14\u8BB0\u8DEF\u5F84")).setDesc(t("\u76EE\u6807\u7B14\u8BB0\u4E0D\u5B58\u5728\u65F6\uFF0C\u7528\u8FD9\u7BC7\u7B14\u8BB0\u7684\u5185\u5BB9\u65B0\u5EFA\u3002\u586B vault \u76F8\u5BF9\u8DEF\u5F84\uFF0C\u6269\u5C55\u540D\u53EF\u7701\u7565\uFF1B\u7559\u7A7A\u5219\u65B0\u5EFA\u7A7A\u767D\u7B14\u8BB0\u3002")).addText(
      (text) => text.setPlaceholder(`${t("\u6A21\u677F")}/\u65E5\u8BB0\u6A21\u677F.md`).setValue(this.settings.newTaskTemplatePath).onChange((value) => {
        this.settings.newTaskTemplatePath = value.trim();
        this.persist();
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u76EE\u6807\u7B14\u8BB0\u8DEF\u5F84\u4E0E\u6A21\u677F\u91CC\u53EF\u7528\u7684\u5360\u4F4D\u7B26")).setDesc(
      t("{{title}} \u662F\u65B0\u7B14\u8BB0\u7684\u6587\u4EF6\u540D\uFF0C{{date}} \u4E0E {{time}} \u662F\u5F53\u524D\u65E5\u671F\u4E0E\u65F6\u95F4\uFF0C\u4E5F\u53EF\u4EE5\u5199\u6210 {{date:YYYY-MM-DD}} \u6307\u5B9A\u683C\u5F0F\uFF1B\u672A\u8BC6\u522B\u7684\u5360\u4F4D\u7B26\u539F\u6837\u4FDD\u7559\u3002")
    );
  }
  renderList(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u5217\u8868\u89C6\u56FE")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u6309\u6587\u4EF6\u5939\u5206\u7EC4")).setDesc(t("\u5217\u8868\u89C6\u56FE\u91CC\u6309\u6240\u5728\u6587\u4EF6\u5939\u5212\u5206\u5BB9\u5668\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.listGroupByFolder).onChange((value) => {
        this.settings.listGroupByFolder = value;
        this.persist();
        this.display();
      })
    );
    if (!this.settings.listGroupByFolder) return;
    new import_obsidian.Setting(containerEl).setName(t("\u5206\u7EC4\u5C42\u7EA7")).setDesc(t("\u53D6\u6587\u4EF6\u8DEF\u5F84\u7684\u524D\u51E0\u5C42\u4F5C\u4E3A\u5BB9\u5668\u540D\u3002")).addSlider(
      (slider) => slider.setLimits(1, 5, 1).setValue(this.settings.listGroupByFolderDepth).setDynamicTooltip().onChange((value) => {
        this.settings.listGroupByFolderDepth = value;
        this.persist();
      })
    );
  }
  /**
   * 甘特条配色。
   *
   * 只给「四类 Mermaid 状态」各一个颜色，而不是让用户逐条设色：任务的颜色
   * 存在笔记里没有落点（Project Master 存的是 frontmatter 字段，任务矩阵的
   * 任务只是一行文字）。四类色覆盖了图上能出现的所有条子，既够用，
   * 也不用往用户的笔记里塞插件私有语法。
   */
  renderGantt(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u7518\u7279\u89C6\u56FE")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u7518\u7279\u6761\u914D\u8272")).setDesc(
      t("\u6309 Mermaid \u7518\u7279\u7684\u56DB\u79CD\u72B6\u6001\u914D\u8272\u3002\u989C\u8272\u53EF\u5199 var(--color-blue) \u6216\u989C\u8272\u540D\uFF1B\u70B9\u4E0B\u9762\u7684\u8272\u5757\u5373\u6539\u3002")
    );
    for (const key of Object.keys(DEFAULT_GANTT_BAR_COLORS)) {
      this.renderBarColorSetting(containerEl, key);
    }
  }
  renderBarColorSetting(containerEl, key) {
    const meta = barColorCopy(key);
    const current2 = this.settings.ganttBarColors[key] || DEFAULT_GANTT_BAR_COLORS[key];
    new import_obsidian.Setting(containerEl).setName(meta.label).setDesc(`${meta.desc}${t("\u9ED8\u8BA4\uFF1A{value}", { value: DEFAULT_GANTT_BAR_COLORS[key] })}`).addText(
      (text) => text.setValue(current2).setPlaceholder(DEFAULT_GANTT_BAR_COLORS[key]).onChange((value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return;
        void this.patchBarColor(key, trimmed);
      })
    );
    const swatches = containerEl.createDiv({ cls: "tm-color-presets" });
    for (const preset of barColorPresets()) {
      const swatch = swatches.createEl("button", {
        cls: `tm-color-swatch${preset.value === current2 ? " is-active" : ""}`,
        // 颜色直接写在元素上，不经过自定义属性中转：那层解析不出颜色（色块会空心）
        attr: { type: "button", title: preset.label, "aria-label": preset.label }
      });
      swatch.style.backgroundColor = preset.value;
      swatch.addEventListener("click", () => {
        void this.patchBarColor(key, preset.value);
        this.display();
      });
    }
  }
  /** 配色改动不影响解析，所以只重绘视图、不重扫全库 */
  async patchBarColor(key, value) {
    this.settings.ganttBarColors = { ...this.settings.ganttBarColors, [key]: value };
    await this.host.persistSettings(false);
  }
  renderCalendar(containerEl) {
    new import_obsidian.Setting(containerEl).setName(t("\u65E5\u5386\u89C6\u56FE")).setHeading();
    new import_obsidian.Setting(containerEl).setName(t("\u6BCF\u5468\u7B2C\u4E00\u5929")).setDesc(t("\u51B3\u5B9A\u65E5\u5386\u91CC\u4E00\u5468\u4ECE\u54EA\u5929\u6392\u8D77\u3002")).addDropdown(
      (dropdown) => dropdown.addOption("monday", t("\u5468\u4E00")).addOption("sunday", t("\u5468\u65E5")).setValue(this.settings.calendarFirstDayOfWeek).onChange((value) => {
        this.settings.calendarFirstDayOfWeek = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u6708\u89C6\u56FE\u663E\u793A\u5468\u672B")).setDesc(t("\u5173\u95ED\u540E\u53EA\u5217\u5DE5\u4F5C\u65E5\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.showCalendarMonthWeekends).onChange((value) => {
        this.settings.showCalendarMonthWeekends = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u5468\u89C6\u56FE\u663E\u793A\u5468\u672B")).setDesc(t("\u5F00\u542F\u540E\u5468\u672B\u5355\u72EC\u6392\u5728\u4E0B\u65B9\u4E00\u884C\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.showCalendarWeekends).onChange((value) => {
        this.settings.showCalendarWeekends = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u5217\u8868\u89C6\u56FE\u663E\u793A\u6574\u6708")).setDesc(t("\u5173\u95ED\u540E\u53EA\u5217\u51FA\u6709\u4EFB\u52A1\u7684\u65E5\u671F\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.calendarListShowFullMonth).onChange((value) => {
        this.settings.calendarListShowFullMonth = value;
        this.persist(true);
      })
    );
    new import_obsidian.Setting(containerEl).setName(t("\u94FA\u5F00\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1")).setDesc(t("\u540C\u65F6\u6709\u5F00\u59CB\u65E5\u4E0E\u622A\u6B62\u65E5\u7684\u4EFB\u52A1\uFF0C\u4F1A\u5728\u8D77\u6B62\u4E4B\u95F4\u7684\u6BCF\u4E00\u5929\u90FD\u51FA\u73B0\u3002")).addToggle(
      (toggle2) => toggle2.setValue(this.settings.showCalendarInProcessTasks).onChange((value) => {
        this.settings.showCalendarInProcessTasks = value;
        this.persist(true);
      })
    );
  }
};
function splitList(value) {
  return value.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function barColorPresets() {
  return [
    { value: "var(--color-red)", label: t("\u7EA2") },
    { value: "var(--color-orange)", label: t("\u6A59") },
    { value: "var(--color-yellow)", label: t("\u9EC4") },
    { value: "var(--color-green)", label: t("\u7EFF") },
    { value: "var(--color-cyan)", label: t("\u9752") },
    { value: "var(--color-blue)", label: t("\u84DD") },
    { value: "var(--color-purple)", label: t("\u7D2B") },
    { value: "var(--color-pink)", label: t("\u7C89") }
  ];
}
function barColorCopy(key) {
  switch (key) {
    case "active":
      return { label: t("\u8FDB\u884C\u4E2D"), desc: t("\u672A\u5B8C\u6210\u3001\u4E14\u8D77\u6B62\u65E5\u671F\u5B8C\u6574\u7684\u4EFB\u52A1\u3002") };
    case "done":
      return { label: t("\u5DF2\u5B8C\u6210"), desc: t("\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1\uFF08\u52FE\u9009\u6846\u4E3A x\uFF09\u3002") };
    case "crit":
      return {
        label: t("\u5173\u952E\u4EFB\u52A1"),
        desc: t("\u5E26 \u{1F53A} \u6216 #crit \u6807\u8BB0\u7684\u4EFB\u52A1\uFF1B\u4F18\u5148\u7EA7\u6700\u9AD8\uFF0C\u540C\u65F6\u5DF2\u5B8C\u6210\u4E5F\u6309\u8FD9\u4E00\u8272\u663E\u793A\u3002")
      };
    default:
      return {
        label: t("\u5176\u4ED6\u72B6\u6001"),
        desc: t("\u65E2\u975E\u5173\u952E\u4E5F\u975E\u5DF2\u5B8C\u6210\u3001\u4E14\u8D77\u6B62\u65E5\u671F\u4E0D\u5B8C\u6574\uFF08\u56FE\u4E0A\u90A3\u4E00\u6BB5\u662F\u63A8\u5BFC\u503C\uFF09\u7684\u4EFB\u52A1\u3002")
      };
  }
}

// src/services/task-index.ts
var import_obsidian2 = require("obsidian");

// src/parser/gantt-parser.ts
var GANTT_TASK_PATTERN = /^\s*-\s*\[([ xX])\]\s+(.+)$/u;
var GANTT_HEADING_PATTERN = /^\s{0,3}(#{2,3})\s+(.+)$/u;
var DATE = "\\d{4}-\\d{2}-\\d{2}";
var START_FIELD = `(?:\\u{1F6EB}\\uFE0F?\\s*|\\[start::\\s*)(${DATE})\\]?`;
var SCHEDULED_FIELD = `(?:\\u{23F3}\\uFE0F?\\s*|\\[scheduled::\\s*)(${DATE})\\]?`;
var DUE_FIELD = `(?:\\u{1F4C5}\\uFE0F?\\s*|\\[due::\\s*)(${DATE})\\]?`;
var DONE_FIELD = `(?:\\u{2705}\\uFE0F?|\\[completion::\\s*)(${DATE})\\]?`;
var CREATED_FIELD = `(?:\\u{2795}\\uFE0F?|\\[created::\\s*)(${DATE})\\]?`;
var CANCELLED_FIELD = `(?:\\u{274C}\\uFE0F?|\\[cancelled::\\s*)(${DATE})\\]?`;
var ID_FIELD = "(?:\\u{1F194}\\uFE0F?\\s*|\\[id::\\s*)([a-zA-Z0-9_-]+)\\]?";
var DEPENDENCY_FIELD = "(?:\\u{26D4}\\uFE0F?\\s*|\\[(?:dependsOn|depends on|depends)::\\s*)([a-zA-Z0-9_-]+)\\]?";
var OWNER_FIELD = "\\[owner::\\s*([^\\]]+)\\]";
var START_RE = new RegExp(START_FIELD, "u");
var SCHEDULED_RE = new RegExp(SCHEDULED_FIELD, "u");
var DUE_RE = new RegExp(DUE_FIELD, "u");
var ID_RE = new RegExp(ID_FIELD, "u");
var DEPENDENCY_RE = new RegExp(DEPENDENCY_FIELD, "iu");
var MILESTONE_RE = new RegExp("#milestone|\\u{1F6A9}\\uFE0F?", "iu");
var CRITICAL_RE = new RegExp("\\u{1F53A}\\uFE0F?", "u");
var STRIP_PATTERNS = [
  START_FIELD,
  SCHEDULED_FIELD,
  DUE_FIELD,
  DONE_FIELD,
  CREATED_FIELD,
  CANCELLED_FIELD,
  ID_FIELD,
  DEPENDENCY_FIELD,
  OWNER_FIELD
].map((source) => new RegExp(source, "gu"));
var ORPHAN_EMOJI = /[\u{1F6EB}\u{23F3}\u{1F4C5}\u{2705}\u{2795}\u{274C}\u{1F194}\u{26D4}\u{1F53A}\u{1F6A9}]/gu;
function ganttHeadingOf(line) {
  const match = GANTT_HEADING_PATTERN.exec(line);
  if (match === null) return null;
  return { level: match[1].length === 2 ? 2 : 3, text: match[2].trim() };
}
function stripGanttFields(raw) {
  let name = raw;
  for (const pattern of STRIP_PATTERNS) {
    name = name.replace(pattern, "");
  }
  name = name.replace(ORPHAN_EMOJI, "");
  name = name.replace(/#crit\b/giu, "").replace(/#milestone\b/giu, "");
  return name.replace(/\s+/gu, " ").trim();
}
function parseGanttTaskLine(line, filePath, lineNumber, headings) {
  const match = GANTT_TASK_PATTERN.exec(line);
  if (match === null) return null;
  const raw = match[2];
  const start = normalizeIso(START_RE.exec(raw)?.[1]);
  const scheduled = normalizeIso(SCHEDULED_RE.exec(raw)?.[1]);
  const due = normalizeIso(DUE_RE.exec(raw)?.[1]);
  const name = stripGanttFields(raw) || t("\u672A\u547D\u540D\u4EFB\u52A1");
  return {
    id: `${filePath}:${lineNumber}:${name}`,
    filePath,
    lineNumber,
    lineText: line,
    name,
    project: headings.project,
    section: headings.section,
    completed: match[1].toLowerCase() === "x",
    // 🛫 缺省时用 ⏳ 顶上：来源项目的口径，能让「只写了计划日」的任务也上得了图
    startDate: start ?? scheduled,
    scheduledDate: scheduled,
    dueDate: due,
    taskId: ID_RE.exec(raw)?.[1]?.trim() || void 0,
    dependsOn: DEPENDENCY_RE.exec(raw)?.[1]?.trim() || void 0,
    critical: CRITICAL_RE.test(raw),
    milestone: MILESTONE_RE.test(raw)
  };
}
function normalizeIso(value) {
  const trimmed = value?.trim();
  return trimmed !== void 0 && isValidIso(trimmed) ? trimmed : void 0;
}

// src/services/task-index.ts
function isExcalidrawPath(path) {
  return path.toLowerCase().endsWith(".excalidraw.md");
}
function isPathInScope(path, settings) {
  const excluded = settings.excludeFolders.some((folder) => isInside(path, folder));
  if (excluded) return false;
  if (settings.scanFolders.length === 0) return true;
  return settings.scanFolders.some((folder) => isInside(path, folder));
}
function isTrackedMarkdownPath(path, settings) {
  return path.toLowerCase().endsWith(".md") && !isExcalidrawPath(path) && isPathInScope(path, settings);
}
function isInside(path, folderSetting) {
  const folder = folderSetting.trim().replace(/^\/+|\/+$/gu, "");
  if (folder.length === 0) return false;
  return path === folder || path.startsWith(`${folder}/`);
}
function shouldRescanForVaultChange(file, settings) {
  return file instanceof import_obsidian2.TFile && isTrackedMarkdownPath(file.path, settings);
}
function shouldRescanForRename(file, oldPath, settings) {
  const currentMatches = file instanceof import_obsidian2.TFile && isTrackedMarkdownPath(file.path, settings);
  return currentMatches || isTrackedMarkdownPath(oldPath, settings);
}
async function collectIndex(app, settings) {
  const tasks = [];
  const ganttTasks = [];
  const files = app.vault.getMarkdownFiles().filter((file) => isTrackedMarkdownPath(file.path, settings));
  for (const file of files) {
    const content = await app.vault.cachedRead(file);
    const lines = content.split(/\r?\n/u);
    const codeBlockLines = codeBlockLineNumbers(app, file);
    let sectionHeading;
    let ganttProject = "";
    let ganttSection = "";
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lineNumber = index + 1;
      if (codeBlockLines.has(lineNumber)) continue;
      const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);
      if (headingMatch) sectionHeading = headingMatch[1].trim();
      const ganttHeading = ganttHeadingOf(line);
      if (ganttHeading !== null) {
        if (ganttHeading.level === 2) {
          ganttProject = ganttHeading.text;
          ganttSection = "";
        } else {
          ganttSection = ganttHeading.text;
        }
      }
      const parsed = parseTaskLine(line, file.path, lineNumber, settings);
      if (parsed !== null && !settings.excludeMarkers.includes(parsed.checkboxStatus.trim())) {
        parsed.sectionHeading = sectionHeading;
        tasks.push(parsed);
      }
      const ganttTask = parseGanttTaskLine(line, file.path, lineNumber, {
        project: ganttProject,
        section: ganttSection
      });
      if (ganttTask !== null) ganttTasks.push(ganttTask);
    }
  }
  applyBlockedState(tasks);
  return { tasks, ganttTasks };
}
function codeBlockLineNumbers(app, file) {
  const lines = /* @__PURE__ */ new Set();
  const sections = app.metadataCache.getFileCache(file)?.sections ?? [];
  for (const section of sections) {
    if (section.type !== "code") continue;
    for (let line = section.position.start.line + 1; line <= section.position.end.line + 1; line += 1) {
      lines.add(line);
    }
  }
  return lines;
}
function applyBlockedState(tasks) {
  const completedIds = new Set(
    tasks.filter((task) => task.displayStatus === "completed").map((task) => task.taskId).filter((id) => Boolean(id))
  );
  for (const task of tasks) {
    if (!task.dependsOn) continue;
    task.blocked = !completedIds.has(task.dependsOn);
    task.gtdState = computeGtdState(
      task.displayStatus,
      task.checkboxStatus,
      task.description,
      task.dueDate,
      task.startDate,
      task.blocked
    );
  }
}
function taskSignature(tasks) {
  return tasks.map(
    (task) => `${task.id}|${task.lineText}|${task.displayStatus}|${task.gtdState}|${task.quadrant}|${task.blocked}|${task.sectionHeading ?? ""}`
  ).join("\n");
}
function ganttSignature(tasks) {
  return tasks.map(
    (task) => `${task.id}|${task.lineText}|${task.project}|${task.section}|${task.completed}|${task.critical}|${task.milestone}`
  ).join("\n");
}

// src/utils/icon.ts
var ICON_CANDIDATES = [
  "square-kanban",
  "kanban",
  "list-checks",
  "list-todo",
  "layout-list"
];
function pickViewIcon(iconIds, candidates = ICON_CANDIDATES) {
  const available = new Set(iconIds.map((id) => id.replace(/^lucide-/u, "")));
  return candidates.find((name) => available.has(name)) ?? candidates[0] ?? "list-checks";
}

// src/views/matrix-view.ts
var import_obsidian9 = require("obsidian");

// src/gantt/gantt-labels.ts
var GANTT_GROUPINGS = [
  "none",
  "folder",
  "note",
  "gtd",
  "quadrant"
];
function ganttGroupingLabel(grouping) {
  switch (grouping) {
    case "folder":
      return t("\u6309\u6587\u4EF6\u5939\u5206\u7EC4");
    case "note":
      return t("\u6309\u7B14\u8BB0\u5206\u7EC4");
    case "gtd":
      return t("\u6309 GTD \u72B6\u6001\u5206\u7EC4");
    case "quadrant":
      return t("\u6309\u77E9\u9635\u8C61\u9650\u5206\u7EC4");
    default:
      return t("\u4E0D\u5206\u7EC4");
  }
}
function ganttZoomLabel(zoom) {
  switch (zoom) {
    case "week":
      return t("\u5468");
    case "month":
      return t("\u6708");
    case "year":
      return t("\u5E74");
    default:
      return t("\u65E5");
  }
}

// src/services/grouping-service.ts
var GTD_COLUMNS = ["Inbox", "In Progress", "Waiting", "Done"];
var QUADRANTS = ["Q1", "Q2", "Q3", "Q4"];
function gtdStateLabel(state) {
  switch (state) {
    case "Inbox":
      return t("\u6536\u4EF6\u7BB1");
    case "To be Started":
      return t("\u5F85\u5F00\u59CB");
    case "In Progress":
      return t("\u8FDB\u884C\u4E2D");
    case "Waiting":
      return t("\u7B49\u5F85\u4E2D");
    case "Overdue":
      return t("\u5DF2\u903E\u671F");
    default:
      return t("\u5DF2\u5B8C\u6210");
  }
}
function quadrantSubtitle(quadrant) {
  switch (quadrant) {
    case "Q1":
      return t("\u91CD\u8981\u4E14\u7D27\u6025");
    case "Q2":
      return t("\u91CD\u8981\u4E0D\u7D27\u6025");
    case "Q3":
      return t("\u7D27\u6025\u4E0D\u91CD\u8981");
    default:
      return t("\u4E0D\u91CD\u8981\u4E0D\u7D27\u6025");
  }
}
function panelKeyForGtd(state) {
  return `gtd:${state}`;
}
function panelKeyForQuadrant(quadrant) {
  return `q:${quadrant}`;
}
function panelKeyForFolder(folder) {
  return `folder:${folder}`;
}
function panelKeyForNote(filePath) {
  return `note:${filePath}`;
}
function buildPanels(tasks, mode, settings) {
  switch (mode) {
    case "gtd":
      return buildGtdPanels(tasks);
    case "eisenhower":
      return buildQuadrantPanels(tasks);
    case "calendar":
      return { grid: "flow", panels: [] };
    default:
      return buildListPanels(tasks, settings);
  }
}
function buildListPanels(tasks, settings) {
  if (!settings.listGroupByFolder) {
    return {
      grid: "fixed",
      panels: [
        {
          key: "all",
          title: t("\u5168\u90E8\u4EFB\u52A1"),
          tasks: [...tasks]
        }
      ]
    };
  }
  const grouped = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    const folder = folderPathOf(task.filePath, settings.listGroupByFolderDepth);
    const bucket = grouped.get(folder);
    if (bucket === void 0) grouped.set(folder, [task]);
    else bucket.push(task);
  }
  const panels = [...grouped.keys()].sort((a, b) => a.localeCompare(b)).map((folder) => ({
    key: panelKeyForFolder(folder),
    title: folder === "" ? t("\u6839\u76EE\u5F55") : folder,
    subtitle: taskCountLabel(grouped.get(folder)?.length ?? 0),
    tasks: grouped.get(folder) ?? []
  }));
  return { grid: gridFor(panels.length), panels };
}
function gridFor(panelCount) {
  return panelCount > 1 ? "flow" : "fixed";
}
function folderPathOf(filePath, depth) {
  const parts = filePath.split("/");
  parts.pop();
  if (parts.length === 0) return "";
  return parts.slice(0, Math.max(depth, 1)).join("/");
}
function gtdColumnOf(task, today = todayIso()) {
  if (task.gtdState === "To be Started") return "Inbox";
  if (task.gtdState !== "Overdue") return task.gtdState;
  const description = task.description.toLowerCase();
  const hasActiveTag = description.includes("#doing") || description.includes("#active") || description.includes("#next");
  const hasStarted = Boolean(task.startDate && task.startDate <= today);
  return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
}
function buildGtdPanels(tasks) {
  const today = todayIso();
  const panels = GTD_COLUMNS.map((state) => {
    const columnTasks = tasks.filter((task) => {
      if (task.displayStatus === "cancelled") return false;
      if (state === "Done") return task.displayStatus === "completed" && gtdColumnOf(task, today) === state;
      return task.displayStatus !== "completed" && gtdColumnOf(task, today) === state;
    });
    return {
      key: panelKeyForGtd(state),
      title: gtdStateLabel(state),
      subtitle: taskCountLabel(columnTasks.length),
      tasks: columnTasks,
      dropTarget: { kind: "gtd", state },
      addDefaults: gtdDefaultsFor(state, today)
    };
  });
  return { grid: "fixed", panels };
}
function gtdDefaultsFor(state, today) {
  switch (state) {
    case "Waiting":
      return { gtdState: "Waiting" };
    case "In Progress":
      return { gtdState: "In Progress", startDate: today };
    case "Overdue":
      return { dueDate: today };
    default:
      return { gtdState: state };
  }
}
function buildQuadrantPanels(tasks) {
  const today = todayIso();
  const panels = QUADRANTS.map((quadrant) => {
    const cellTasks = tasks.filter(
      (task) => task.quadrant === quadrant && task.displayStatus !== "completed" && task.displayStatus !== "cancelled"
    );
    return {
      key: panelKeyForQuadrant(quadrant),
      title: quadrant,
      subtitle: quadrantSubtitle(quadrant),
      tasks: cellTasks,
      dropTarget: { kind: "quadrant", quadrant },
      addDefaults: quadrantDefaultsFor(quadrant, today)
    };
  });
  return { grid: "fixed", panels };
}
function quadrantDefaultsFor(quadrant, today) {
  switch (quadrant) {
    case "Q1":
      return { priority: "high" /* High */, dueDate: today };
    case "Q2":
      return { priority: "high" /* High */ };
    case "Q3":
      return { priority: "low" /* Low */, dueDate: today };
    default:
      return { priority: "lowest" /* Lowest */ };
  }
}
function taskCountLabel(count) {
  return t("{count} \u4E2A\u4EFB\u52A1", { count });
}

// src/gantt/gantt-model.ts
var FALLBACK_DAYS = 1;
function buildGanttModel(tasks, options) {
  const today = options.today ?? todayIso();
  const grouped = /* @__PURE__ */ new Map();
  const skipped = [];
  for (const task of tasks) {
    if (resolveRow(task) === null) {
      skipped.push(task);
      continue;
    }
    const { key, name } = sectionOf(task, options, today);
    const bucket = grouped.get(key);
    if (bucket === void 0) grouped.set(key, { name, tasks: [task] });
    else bucket.tasks.push(task);
  }
  const buckets = [...grouped.entries()];
  if (options.grouping === "note") buckets.sort((a, b) => a[0].localeCompare(b[0]));
  const sections = [];
  for (const [key, bucket] of buckets) {
    const rows2 = [];
    for (const task of bucket.tasks) {
      const row = resolveRow(task);
      if (row !== null) rows2.push(row);
    }
    sections.push({
      key,
      name: bucket.name,
      rows: rows2,
      // 「无分组」只有一个分节且没有分节头，折叠它就没法展开了 —— 直接不参与折叠
      collapsed: options.grouping !== "none" && options.collapsedKeys.has(key)
    });
  }
  const rows = sections.flatMap((section) => section.rows);
  const range = resolveRange(rows, options, today);
  return {
    sections,
    rows,
    // 无分组时只有一个分节，分节名与内容重复，是纯噪声
    showSectionHeaders: options.grouping !== "none",
    ...range,
    skipped
  };
}
function resolveRow(task) {
  const { startDate, dueDate } = task;
  if (startDate !== void 0 && dueDate !== void 0) {
    const [start, end] = startDate <= dueDate ? [startDate, dueDate] : [dueDate, startDate];
    return withSpan(task, start, end, false, false);
  }
  if (startDate !== void 0) {
    return withSpan(task, startDate, addDaysIso(startDate, FALLBACK_DAYS), false, true);
  }
  if (dueDate !== void 0) {
    return withSpan(task, addDaysIso(dueDate, -FALLBACK_DAYS), dueDate, true, false);
  }
  return null;
}
function withSpan(task, start, end, startFallback, endFallback) {
  return {
    task,
    start,
    end,
    startFallback,
    endFallback,
    calendarDays: diffDaysIso(start, end) + 1
  };
}
function sectionOf(task, options, today) {
  switch (options.grouping) {
    case "folder": {
      const folder = folderPathOf(task.filePath, options.settings.listGroupByFolderDepth);
      return { key: panelKeyForFolder(folder), name: folder === "" ? t("\u6839\u76EE\u5F55") : folder };
    }
    case "note":
      return { key: panelKeyForNote(task.filePath), name: noteNameOf(task.filePath) };
    case "gtd": {
      const state = gtdColumnFor(task, options, today);
      return { key: panelKeyForGtd(state), name: gtdStateLabel(state) };
    }
    case "quadrant": {
      const quadrant = quadrantFor(task, options, today);
      return { key: panelKeyForQuadrant(quadrant), name: `${quadrant} \xB7 ${quadrantSubtitle(quadrant)}` };
    }
    default:
      return { key: "all", name: t("\u5168\u90E8\u4EFB\u52A1") };
  }
}
function noteNameOf(filePath) {
  return filePath.slice(filePath.lastIndexOf("/") + 1).replace(/\.md$/u, "");
}
function gtdColumnFor(task, options, today) {
  const parsed = options.parsedByLine.get(`${task.filePath}:${task.lineNumber}`);
  if (parsed !== void 0) return gtdColumnOf(parsed, today);
  return task.completed ? "Done" : "Inbox";
}
function quadrantFor(task, options, today) {
  const parsed = options.parsedByLine.get(`${task.filePath}:${task.lineNumber}`);
  if (parsed !== void 0) return parsed.quadrant;
  const urgent = task.dueDate !== void 0 && task.dueDate <= addDaysIso(today, options.settings.urgentDaysRange - 1);
  if (task.critical && urgent) return "Q1";
  if (task.critical) return "Q2";
  if (urgent) return "Q3";
  return "Q4";
}
function resolveRange(rows, options, today) {
  let rangeStart = null;
  let rangeEnd = null;
  for (const row of rows) {
    rangeStart = minIso(rangeStart, row.start);
    rangeEnd = maxIso(rangeEnd, row.end);
  }
  rangeStart = minIso(rangeStart, monthStartIso(today));
  rangeEnd = maxIso(rangeEnd, monthEndIso(today));
  if (options.axisRange !== void 0) {
    rangeStart = minIso(rangeStart, options.axisRange.start);
    rangeEnd = maxIso(rangeEnd, options.axisRange.end);
  }
  return { rangeStart: rangeStart ?? today, rangeEnd: rangeEnd ?? today };
}

// src/gantt/time-scale.ts
var DAY_WIDTH = {
  day: 34,
  week: 14,
  month: 5,
  year: 1.2
};
var LOWER_UNIT = {
  day: "day",
  week: "week",
  month: "month",
  // 再按「月」画线就太密了，退到季度；标签形如 2026-Q1
  year: "quarter"
};
var UPPER_UNIT = {
  day: "month",
  week: "month",
  month: "year",
  year: "year"
};
var ZOOM_LADDER = ["year", "month", "week", "day"];
function quarterOf(month) {
  const index = Math.floor((month - 1) / 3) + 1;
  return { index, firstMonth: (index - 1) * 3 + 1 };
}
function unitStart(iso, unit) {
  const { year, month, day } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return iso;
    case "week": {
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      return addDaysIso(iso, -weekday);
    }
    case "month":
      return isoFromParts(year, month, 1);
    case "quarter":
      return isoFromParts(year, quarterOf(month).firstMonth, 1);
    case "year":
      return isoFromParts(year, 1, 1);
  }
}
function unitEnd(iso, unit) {
  const { year, month } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return iso;
    case "week":
      return addDaysIso(iso, 6);
    case "month":
      return isoFromParts(year, month, daysInMonth(year, month));
    case "quarter": {
      const lastMonth = quarterOf(month).firstMonth + 2;
      return isoFromParts(year, lastMonth, daysInMonth(year, lastMonth));
    }
    case "year":
      return isoFromParts(year, 12, 31);
  }
}
function nextUnitStart(iso, unit) {
  const { year, month } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return addDaysIso(iso, 1);
    case "week":
      return addDaysIso(iso, 7);
    case "month": {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      return isoFromParts(nextYear, nextMonth, 1);
    }
    case "quarter": {
      const nextMonth = quarterOf(month).firstMonth + 3;
      return nextMonth > 12 ? isoFromParts(year + 1, 1, 1) : isoFromParts(year, nextMonth, 1);
    }
    case "year":
      return isoFromParts(year + 1, 1, 1);
  }
}
function unitLabel(iso, unit) {
  const { year, month, day } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return String(day);
    case "week":
      return `${month}/${day}`;
    case "month":
      return isoFromParts(year, month, 1).slice(0, 7);
    case "quarter":
      return `${year}-Q${quarterOf(month).index}`;
    case "year":
      return String(year);
  }
}
function buildColumns(from, to, unit, scaleStart, dayWidth) {
  const columns = [];
  let cursor = unitStart(from, unit);
  const maxColumns = 4e3;
  while (cursor <= to && columns.length < maxColumns) {
    const rawStart = cursor;
    const rawEnd = unitEnd(rawStart, unit);
    const colStart = rawStart < scaleStart ? scaleStart : rawStart;
    const colEnd = rawEnd > to ? to : rawEnd;
    if (colStart <= colEnd) {
      columns.push({
        key: `${unit}:${colStart}`,
        label: unitLabel(colStart, unit),
        startIso: colStart,
        endIso: colEnd,
        x: diffDaysIso(scaleStart, colStart) * dayWidth,
        width: (diffDaysIso(colStart, colEnd) + 1) * dayWidth
      });
    }
    cursor = nextUnitStart(rawStart, unit);
    if (rawEnd >= to) break;
  }
  return columns;
}
function buildTimeScale(rangeStart, rangeEnd, zoom, options = {}) {
  const lowerUnit = LOWER_UNIT[zoom];
  const upperUnit = UPPER_UNIT[zoom];
  const dayWidth = DAY_WIDTH[zoom];
  const [from, to] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
  const startIso = unitStart(addDaysIso(unitStart(from, lowerUnit), -1), lowerUnit);
  const endIso = unitEnd(addDaysIso(unitEnd(unitStart(to, lowerUnit), lowerUnit), 1), lowerUnit);
  const totalDays = diffDaysIso(startIso, endIso) + 1;
  const today = options.today ?? null;
  const todayInRange = today !== null && today >= startIso && today <= endIso ? today : null;
  return {
    startIso,
    endIso,
    dayWidth,
    totalWidth: totalDays * dayWidth,
    lower: buildColumns(startIso, endIso, lowerUnit, startIso, dayWidth),
    upper: buildColumns(startIso, endIso, upperUnit, startIso, dayWidth),
    todayX: todayInRange !== null ? diffDaysIso(startIso, todayInRange) * dayWidth + dayWidth / 2 : null,
    xForDate: (iso) => diffDaysIso(startIso, iso) * dayWidth,
    endXForDate: (iso) => (diffDaysIso(startIso, iso) + 1) * dayWidth,
    dateForX: (x) => addDaysIso(startIso, Math.floor(x / dayWidth))
  };
}

// src/gantt/bar-colors.ts
function barColorKey(row) {
  const { task } = row;
  if (task.critical) return "crit";
  if (task.completed) return "done";
  if (row.startFallback || row.endFallback) return "fallback";
  return "active";
}
function barClass(row) {
  if (row.task.milestone) return "tm-gantt__bar--milestone";
  return `tm-gantt__bar--${barColorKey(row)}`;
}

// src/gantt/gantt-view.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var ROW_HEIGHT = 30;
var SECTION_HEIGHT = 26;
var MAX_GRID_LINES = 1e3;
var MAX_HEADER_LABELS = 240;
var MIN_DAY_WIDTH_FOR_OFF_DAYS = 3;
var WHEEL_STEP_THRESHOLD = 40;
var GanttView = class {
  constructor(component, root, callbacks) {
    this.component = component;
    this.root = root;
    this.callbacks = callbacks;
    this.frameBuilt = false;
    /**
     * 甘特框架元素。刻意在宿主容器里**再套一层**：宿主由调用方持有、负责在父级
     * flex 布局里占位；本视图只管「甘特内部怎么排」。两者落在同一个元素上时，
     * 双方各自写的 flex 属性会互相覆盖。
     */
    this.frame = null;
    this.sidebarHeadEl = null;
    this.sidebarBodyEl = null;
    this.timelineEl = null;
    this.canvasEl = null;
    this.scale = null;
    this.layout = [];
    this.wheelAccumulator = 0;
    /** 本轮配色：跟着每次 render 一起传进来，视图自己不留一份可能过期的副本 */
    this.colors = DEFAULT_GANTT_BAR_COLORS;
    /**
     * 任务 id → 任务。
     *
     * 任务条上只带 id（DOM 属性挂不了对象），点击时回来查表。每次渲染重建，
     * 与当前 model 严格一致，不会残留上一轮的任务。
     */
    this.taskIndex = /* @__PURE__ */ new Map();
    this.registerInteraction();
  }
  // ────────────────────────────── 渲染 ──────────────────────────────
  render(model, zoom, today, options) {
    const { anchor, colors } = options;
    this.colors = colors;
    this.scale = buildTimeScale(model.rangeStart, model.rangeEnd, zoom, { today });
    this.layout = buildLayout(model);
    this.taskIndex = new Map(model.rows.map((row) => [row.task.id, row.task]));
    this.ensureFrame();
    const head = this.sidebarHeadEl;
    const body = this.sidebarBodyEl;
    const canvas = this.canvasEl;
    if (head === null || body === null || canvas === null) return;
    head.setText(summaryLabel(model));
    body.empty();
    canvas.empty();
    canvas.style.setProperty("--tm-canvas-width", `${this.scale.totalWidth}px`);
    this.renderSidebar(body);
    this.renderHeader(canvas);
    this.renderBody(canvas);
    if (model.rows.length === 0) {
      canvas.createDiv({
        cls: "tm-gantt__empty",
        text: t("\u6CA1\u6709\u53EF\u663E\u793A\u7684\u4EFB\u52A1\uFF08\u9700\u8981\u81F3\u5C11\u4E00\u4E2A\u5F00\u59CB\u65E5\u6216\u622A\u6B62\u65E5\uFF09")
      });
    }
    this.syncScroll();
    if (anchor !== void 0 && this.timelineEl !== null) {
      this.timelineEl.scrollLeft = Math.max(0, this.scale.xForDate(anchor.iso) - anchor.offsetX);
    }
  }
  /** 只建一次：滚动监听器挂在持久节点上，重渲染不会累积监听器 */
  ensureFrame() {
    if (this.frameBuilt) return;
    this.root.tabIndex = -1;
    const frame = this.root.createDiv({ cls: "tm-gantt" });
    this.frame = frame;
    const sidebar = frame.createDiv({ cls: "tm-gantt__sidebar" });
    this.sidebarHeadEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-head" });
    this.sidebarBodyEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-body" });
    this.timelineEl = frame.createDiv({ cls: "tm-gantt__timeline" });
    this.canvasEl = this.timelineEl.createDiv({ cls: "tm-gantt__canvas" });
    this.component.registerDomEvent(this.timelineEl, "scroll", () => this.syncScroll());
    this.frameBuilt = true;
  }
  renderSidebar(host) {
    for (const entry of this.layout) {
      if (entry.kind === "section") {
        this.renderSectionHeader(host, entry);
        continue;
      }
      const row = entry.row;
      if (row === null) continue;
      const rowEl = host.createDiv({ cls: "tm-gantt__sidebar-row" });
      rowEl.dataset.taskId = row.task.id;
      rowEl.dataset.section = entry.sectionKey;
      const nameEl = rowEl.createDiv({ cls: "tm-gantt__sidebar-name" });
      const link = nameEl.createEl("a", {
        cls: "internal-link",
        text: row.task.name,
        attr: { title: `${row.task.filePath}:${row.task.lineNumber}`, tabindex: "-1" }
      });
      link.dataset.openTask = row.task.id;
      const meta = rowEl.createDiv({ cls: "tm-gantt__sidebar-meta" });
      if (row.task.milestone) {
        meta.createSpan({ cls: "tm-gantt__tag", text: t("\u91CC\u7A0B\u7891") });
      }
      if (row.task.critical) {
        meta.createSpan({ cls: "tm-gantt__tag", text: t("\u5173\u952E") });
      }
      if (row.startFallback || row.endFallback) {
        meta.createSpan({
          cls: "tm-gantt__fallback-hint",
          text: t("\u7F3A\u65E5\u671F"),
          attr: { title: t("\u8D77\u6B62\u65E5\u671F\u4E0D\u5B8C\u6574\uFF0C\u56FE\u4E0A\u90A3\u4E00\u6BB5\u662F\u63A8\u5BFC\u51FA\u6765\u7684") }
        });
      }
    }
  }
  renderSectionHeader(host, entry) {
    const header = host.createEl("button", {
      cls: `tm-gantt__sidebar-section${entry.collapsed ? " is-collapsed" : ""}`,
      attr: { type: "button", "aria-expanded": String(!entry.collapsed) }
    });
    header.dataset.toggleSection = entry.sectionKey;
    header.createSpan({ cls: "tm-gantt__chevron", text: entry.collapsed ? "\u25B8" : "\u25BE" });
    header.createSpan({ cls: "tm-gantt__sidebar-section-name", text: entry.sectionName });
  }
  renderHeader(host) {
    const scale = this.scale;
    if (scale === null) return;
    const header = host.createDiv({ cls: "tm-gantt__header" });
    const upper = header.createDiv({ cls: "tm-gantt__header-row tm-gantt__header-row--upper" });
    const lower = header.createDiv({ cls: "tm-gantt__header-row tm-gantt__header-row--lower" });
    this.fillHeaderRow(upper, scale.upper);
    this.fillHeaderRow(lower, scale.lower);
  }
  fillHeaderRow(host, columns) {
    const step = Math.max(1, Math.ceil(columns.length / MAX_HEADER_LABELS));
    columns.forEach((column, index) => {
      const cell = host.createDiv({ cls: "tm-gantt__header-cell" });
      cell.style.setProperty("--tm-cell-width", `${column.width}px`);
      if (index % step === 0) {
        cell.createSpan({ cls: "tm-gantt__header-label", text: column.label });
      }
    });
  }
  renderBody(host) {
    const scale = this.scale;
    if (scale === null) return;
    const height = Math.max(entryBottom(this.layout), ROW_HEIGHT);
    const svg = this.svg("svg");
    svg.setAttribute("class", "tm-gantt__svg");
    svg.setAttribute("width", String(scale.totalWidth));
    svg.setAttribute("height", String(height));
    host.appendChild(svg);
    const shapes = this.svg("g");
    svg.appendChild(shapes);
    this.renderOffDays(shapes, scale, height);
    this.renderGrid(shapes, scale, height);
    for (const entry of this.layout) {
      if (entry.kind !== "row" || entry.row === null) continue;
      this.renderRowShapes(shapes, entry.row, entry.y, scale);
    }
    if (scale.todayX !== null) {
      const line = this.svg("line");
      line.setAttribute("class", "tm-gantt__today");
      line.setAttribute("x1", String(scale.todayX));
      line.setAttribute("x2", String(scale.todayX));
      line.setAttribute("y1", "0");
      line.setAttribute("y2", String(height));
      shapes.appendChild(line);
    }
  }
  /**
   * 周末底带：画在所有内容之下，只做背景提示。
   *
   * 只画周末，没有节假日 —— 任务矩阵没有节假日日历这层配置，凭空造一个
   * 工作日口径反而会让人对不上账。
   */
  renderOffDays(host, scale, height) {
    if (scale.dayWidth < MIN_DAY_WIDTH_FOR_OFF_DAYS) return;
    for (const band of weekendBands(scale.startIso, scale.endIso)) {
      const x = scale.xForDate(band.start);
      const rect = this.svg("rect");
      rect.setAttribute("class", "tm-gantt__off-day");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(scale.endXForDate(band.end) - x));
      rect.setAttribute("height", String(height));
      host.appendChild(rect);
    }
  }
  renderGrid(host, scale, height) {
    if (scale.lower.length > MAX_GRID_LINES) return;
    for (const column of scale.lower) {
      const line = this.svg("line");
      line.setAttribute("class", "tm-gantt__grid-line");
      line.setAttribute("x1", String(column.x));
      line.setAttribute("x2", String(column.x));
      line.setAttribute("y1", "0");
      line.setAttribute("y2", String(height));
      host.appendChild(line);
    }
  }
  renderRowShapes(host, row, y, scale) {
    const x = scale.xForDate(row.start);
    const width = barWidth(row.start, row.end, scale, x);
    const barY = y + 5;
    const barHeight = ROW_HEIGHT - 10;
    const fallback = row.startFallback || row.endFallback;
    const color = this.colors[barColorKey(row)];
    const bar = row.task.milestone ? this.buildMilestone(x, width, barY, barHeight, color) : this.buildBar(x, width, barY, barHeight, row, fallback, color);
    bar.dataset.taskId = row.task.id;
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("role", "button");
    bar.setAttribute(
      "aria-label",
      t("{name}\uFF1A{start} \u81F3 {end}\uFF0C{days} \u5929", {
        name: row.task.name,
        start: row.start,
        end: row.end,
        days: row.calendarDays
      })
    );
    const title = this.svg("title");
    title.textContent = `${row.task.name}
${row.start} \u2192 ${row.end}
${t("{count} \u5929", { count: row.calendarDays })}`;
    bar.appendChild(title);
    host.appendChild(bar);
    if (!row.task.milestone) {
      this.renderDurationLabel(host, `${row.calendarDays}`, x, width, barY, barHeight);
    }
  }
  buildBar(x, width, barY, barHeight, row, fallback, color) {
    const bar = this.svg("rect");
    bar.setAttribute("class", `tm-gantt__bar ${barClass(row)}`);
    bar.setAttribute("x", String(x));
    bar.setAttribute("y", String(barY));
    bar.setAttribute("width", String(width));
    bar.setAttribute("height", String(barHeight));
    bar.setAttribute("rx", "4");
    if (fallback) bar.dataset.fallback = "true";
    bar.style.fill = color;
    return bar;
  }
  /** 里程碑：以结束日为尖点的菱形，宽度固定一个日宽；颜色沿用状态色，形状负责区分 */
  buildMilestone(x, width, barY, barHeight, color) {
    const size = Math.min(barHeight, 14);
    const centerX = x + width;
    const centerY = barY + barHeight / 2;
    const half = size / 2;
    const diamond = this.svg("polygon");
    diamond.setAttribute("class", "tm-gantt__bar tm-gantt__bar--milestone");
    diamond.setAttribute(
      "points",
      [
        `${centerX},${centerY - half}`,
        `${centerX + half},${centerY}`,
        `${centerX},${centerY + half}`,
        `${centerX - half},${centerY}`
      ].join(" ")
    );
    diamond.style.fill = color;
    return diamond;
  }
  /**
   * 条上的天数。
   *
   * 放得下就写在条内（配合对比色与描边），放不下就挪到右外侧用次要色——
   * 绝不能因为条子窄就把信息吞掉：年档下 40 天的条子只有几十像素宽，
   * 而「这段到底跨了多久」正是最需要看见的。
   */
  renderDurationLabel(host, label, barX, barWidthPx, barY, barHeight) {
    const inset = 6;
    const fits = barWidthPx >= estimateTextWidth(label) + inset * 2;
    const text = this.svg("text");
    text.setAttribute(
      "class",
      fits ? "tm-gantt__bar-duration" : "tm-gantt__bar-duration tm-gantt__bar-duration--outside"
    );
    text.setAttribute("y", String(barY + barHeight / 2));
    if (fits) {
      text.setAttribute("x", String(barX + barWidthPx / 2));
      text.setAttribute("text-anchor", "middle");
    } else {
      text.setAttribute("x", String(barX + barWidthPx + inset));
      text.setAttribute("text-anchor", "start");
    }
    text.textContent = label;
    host.appendChild(text);
  }
  /** SVG 元素统一经 ownerDocument 创建（popout 安全） */
  svg(tag) {
    return this.root.ownerDocument.createElementNS(SVG_NS, tag);
  }
  // ────────────────────────────── 交互 ──────────────────────────────
  /** 监听器只注册这一次，之后全靠 data-* 委托分发 */
  registerInteraction() {
    this.component.registerDomEvent(this.root, "click", (evt) => this.onClick(evt));
    this.component.registerDomEvent(this.root, "keydown", (evt) => this.onKeyDown(evt));
    this.component.registerDomEvent(this.root, "wheel", (evt) => this.onWheel(evt), {
      passive: false
    });
  }
  /** 把事件目标收窄成元素（跨窗口安全：用根容器所属窗口的构造器判断） */
  elementOf(target) {
    const win = this.root.ownerDocument.defaultView;
    if (win === null || !(target instanceof win.Element)) return null;
    return target;
  }
  taskOf(target) {
    const el = this.elementOf(target);
    if (el === null) return null;
    const id = el.closest("[data-task-id]")?.getAttribute("data-task-id");
    if (id === null || id === void 0) return null;
    return this.taskIndex.get(id) ?? null;
  }
  onClick(evt) {
    const el = this.elementOf(evt.target);
    if (el === null) return;
    const toggle2 = el.closest("[data-toggle-section]")?.getAttribute("data-toggle-section");
    if (toggle2 !== null && toggle2 !== void 0) {
      evt.preventDefault();
      this.callbacks.onToggleSection(toggle2);
      return;
    }
    const task = this.taskOf(evt.target);
    if (task !== null) {
      evt.preventDefault();
      this.callbacks.onOpenTask(task);
    }
  }
  onKeyDown(evt) {
    const task = this.taskOf(evt.target);
    if (task === null) return;
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      this.callbacks.onOpenTask(task);
    }
  }
  onWheel(evt) {
    if (!evt.ctrlKey && !evt.metaKey) return;
    evt.preventDefault();
    this.wheelAccumulator += evt.deltaY;
    if (Math.abs(this.wheelAccumulator) < WHEEL_STEP_THRESHOLD) return;
    const direction = this.wheelAccumulator < 0 ? 1 : -1;
    this.wheelAccumulator = 0;
    this.callbacks.onZoom(direction, this.anchorAtClientX(evt.clientX));
  }
  /** 把屏幕 x 换算成「日期 + 距可视区左缘的偏移」，缩放后据此还原视野 */
  anchorAtClientX(clientX) {
    const scale = this.scale;
    const timeline = this.timelineEl;
    if (scale === null || timeline === null) return null;
    const bounds = timeline.getBoundingClientRect();
    const offsetX = clientX - bounds.left;
    return { iso: scale.dateForX(offsetX + timeline.scrollLeft), offsetX };
  }
  /** 供键盘 Ctrl +/- 用：以可视区中心为锚点 */
  centerAnchor() {
    const timeline = this.timelineEl;
    if (timeline === null) return null;
    const bounds = timeline.getBoundingClientRect();
    return this.anchorAtClientX(bounds.left + bounds.width / 2);
  }
  // ────────────────────────────── 滚动 ──────────────────────────────
  /**
   * 打开时把视野落到今天：甘特的常态就是盯着最近这几周。
   *
   * @returns 是否真的滚了。容器还隐藏着（例如视图在收起的侧栏里）时 clientWidth 是 0，
   *          这时按 0 算会把视野甩到很远的地方；宁可这次不滚，等下一次渲染再来。
   */
  scrollToToday() {
    const scale = this.scale;
    const timeline = this.timelineEl;
    if (scale === null || timeline === null || scale.todayX === null) return false;
    if (timeline.clientWidth === 0) return false;
    timeline.scrollLeft = Math.max(0, scale.todayX - timeline.clientWidth / 3);
    return true;
  }
  /** 侧栏纵向跟随时间轴滚动（两侧行高一致，用 transform 对齐） */
  syncScroll() {
    if (this.timelineEl === null || this.sidebarBodyEl === null) return;
    this.sidebarBodyEl.style.setProperty("--tm-sidebar-offset", `${-this.timelineEl.scrollTop}px`);
  }
  destroy() {
    this.frameBuilt = false;
    this.frame = null;
    this.sidebarHeadEl = null;
    this.sidebarBodyEl = null;
    this.timelineEl = null;
    this.canvasEl = null;
    this.scale = null;
    this.layout = [];
    this.taskIndex.clear();
    this.root.empty();
  }
};
var DURATION_FONT_SIZE = 11;
function estimateTextWidth(label) {
  let width = 0;
  for (const char of label) {
    width += /[\u3000-\u9fff\uff00-\uffef]/u.test(char) ? DURATION_FONT_SIZE : DURATION_FONT_SIZE * 0.55;
  }
  return width;
}
function buildLayout(model) {
  const entries = [];
  let y = 0;
  for (const section of model.sections) {
    if (model.showSectionHeaders) {
      entries.push({
        kind: "section",
        sectionKey: section.key,
        sectionName: section.name,
        collapsed: section.collapsed,
        row: null,
        y,
        height: SECTION_HEIGHT
      });
      y += SECTION_HEIGHT;
    }
    if (section.collapsed) continue;
    for (const row of section.rows) {
      entries.push({
        kind: "row",
        sectionKey: section.key,
        sectionName: section.name,
        collapsed: false,
        row,
        y,
        height: ROW_HEIGHT
      });
      y += ROW_HEIGHT;
    }
  }
  return entries;
}
function entryBottom(entries) {
  const last = entries[entries.length - 1];
  return last === void 0 ? 0 : last.y + last.height;
}
function barWidth(start, end, scale, x) {
  return Math.max(scale.dayWidth, scale.endXForDate(end) - x);
}
function summaryLabel(model) {
  const base = t("{count} \u4E2A\u4EFB\u52A1", { count: model.rows.length });
  if (model.skipped.length === 0) return base;
  return `${base} \xB7 ${t("{count} \u4E2A\u6CA1\u6709\u65E5\u671F", { count: model.skipped.length })}`;
}
function weekendBands(startIso, endIso) {
  const bands = [];
  let current2 = null;
  for (let cursor = startIso; cursor <= endIso; cursor = addDaysIso(cursor, 1)) {
    const weekday = weekdayOfIso(cursor);
    const isWeekend2 = weekday === 0 || weekday === 6;
    if (isWeekend2) {
      if (current2 === null) current2 = { start: cursor, end: cursor };
      else current2.end = cursor;
    } else if (current2 !== null) {
      bands.push(current2);
      current2 = null;
    }
  }
  if (current2 !== null) bands.push(current2);
  return bands;
}

// src/panels/gantt-board.ts
var GanttBoard = class {
  constructor(host, component, callbacks) {
    host.addClass("tm-gantt-board");
    const viewHost = host.createDiv({ cls: "tm-gantt-board__view" });
    this.view = new GanttView(component, viewHost, {
      onOpenTask: (task) => callbacks.onOpenTask(task),
      onToggleSection: (key) => callbacks.onToggleSection(key),
      onZoom: (direction, anchor) => callbacks.onZoomStep(direction, anchor)
    });
  }
  /** @returns 是否已经把视野落到今天（容器还没显示出来时为 false，调用方下次再试） */
  render(options) {
    this.view.render(options.model, options.zoom, options.today, {
      anchor: options.anchor,
      colors: options.colors
    });
    return options.scrollToToday ? this.view.scrollToToday() : false;
  }
  destroy() {
    this.view.destroy();
  }
};

// src/modals/confirm-modals.ts
var import_obsidian3 = require("obsidian");
var DateConflictModal = class extends import_obsidian3.Modal {
  constructor(app, startDate, dueDate, settle) {
    super(app);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.settle = settle;
    this.answered = false;
  }
  onOpen() {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(t("\u65E5\u671F\u51B2\u7A81"));
    const message = this.contentEl.createEl("p", { cls: "tm-modal__message" });
    message.setText(
      t("\u5F00\u59CB\u65E5\u671F\uFF08{start}\uFF09\u665A\u4E8E\u622A\u6B62\u65E5\u671F\uFF08{due}\uFF09\u3002", { start: this.startDate, due: this.dueDate })
    );
    this.contentEl.createEl("p", {
      cls: "tm-modal__message",
      text: t("\u8981\u628A\u622A\u6B62\u65E5\u671F\u8C03\u6574\u5230\u4ECA\u5929\uFF0C\u8FD8\u662F\u4FDD\u7559\u539F\u65E5\u671F\u5E76\u6807\u8BB0\u4E3A\u51B2\u7A81\uFF1F")
    });
    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new import_obsidian3.ButtonComponent(buttons).setButtonText(t("\u53D6\u6D88")).onClick(() => this.close());
    new import_obsidian3.ButtonComponent(buttons).setButtonText(t("\u6807\u8BB0\u51B2\u7A81")).onClick(() => this.answer("mark-conflict"));
    new import_obsidian3.ButtonComponent(buttons).setButtonText(t("\u8C03\u6574\u622A\u6B62\u65E5\u671F")).setCta().onClick(() => this.answer("adjust-due"));
  }
  onClose() {
    this.contentEl.empty();
    if (!this.answered) this.settle("cancel");
  }
  answer(result) {
    this.answered = true;
    this.settle(result);
    this.close();
  }
};
var DeleteTaskModal = class extends import_obsidian3.Modal {
  constructor(app, description, settle) {
    super(app);
    this.description = description;
    this.settle = settle;
    this.answered = false;
  }
  onOpen() {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(t("\u5220\u9664\u4EFB\u52A1"));
    this.contentEl.createEl("p", {
      cls: "tm-modal__message",
      text: t("\u786E\u5B9A\u8981\u5220\u9664\u300C{description}\u300D\u5417\uFF1F\u8FD9\u4E00\u884C\u4F1A\u4ECE\u7B14\u8BB0\u91CC\u79FB\u9664\u3002", { description: this.description })
    });
    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new import_obsidian3.ButtonComponent(buttons).setButtonText(t("\u53D6\u6D88")).onClick(() => this.close());
    new import_obsidian3.ButtonComponent(buttons).setButtonText(t("\u5220\u9664")).setWarning().onClick(() => {
      this.answered = true;
      this.settle(true);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
    if (!this.answered) this.settle(false);
  }
};
function askDateConflict(app, startDate, dueDate) {
  return new Promise((resolve) => {
    new DateConflictModal(app, startDate, dueDate, resolve).open();
  });
}
function askDeleteTask(app, description) {
  return new Promise((resolve) => {
    new DeleteTaskModal(app, description, resolve).open();
  });
}

// src/modals/task-editor-modal.ts
var import_obsidian7 = require("obsidian");

// src/parser/task-writer.ts
var import_obsidian4 = require("obsidian");
var CHECKBOX_PREFIX = /^([ \t]*[-*][ \t]*\[[^\]]*\][ \t]*)/u;
var LEADING_INDENT = /^[ \t]*/u;
var PRIORITY_MARKERS2 = {
  ["critical" /* Critical */]: "\u{1F53A}",
  ["highest" /* Highest */]: "\u23EB",
  ["high" /* High */]: "\u{1F53C}",
  ["medium" /* Medium */]: "",
  ["low" /* Low */]: "\u{1F53D}",
  ["lowest" /* Lowest */]: "\u23EC",
  ["none" /* None */]: ""
};
function splitWithEol(content) {
  return {
    lines: content.split(/\r?\n/u),
    eols: content.match(/\r\n|\n/gu) ?? []
  };
}
function joinWithEol({ lines, eols }) {
  let result = lines[0] ?? "";
  for (let index = 1; index < lines.length; index += 1) {
    result += `${eols[index - 1] ?? "\n"}${lines[index]}`;
  }
  return result;
}
function removeLine(content, index) {
  content.lines.splice(index, 1);
  const eolIndex = index < content.eols.length ? index : content.eols.length - 1;
  content.eols.splice(eolIndex, 1);
}
function detectEol(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}
function getIndent(line) {
  return LEADING_INDENT.exec(line)?.[0] ?? "";
}
function compactLine(line) {
  const indent = getIndent(line);
  const body = line.slice(indent.length).replace(/[ \t]{2,}/gu, " ").replace(/[ \t]+$/u, "");
  return `${indent}${body}`;
}
function appendLine(content, line) {
  if (content.length === 0) return `${line}${detectEol(content)}`;
  const separator = content.endsWith("\n") ? "" : detectEol(content);
  return `${content}${separator}${line}${detectEol(content)}`;
}
function locateTaskLine(lines, task) {
  const preferred = task.lineNumber - 1;
  if (preferred >= 0 && preferred < lines.length && lines[preferred] === task.lineText) {
    return preferred;
  }
  const byExactText = lines.indexOf(task.lineText);
  if (byExactText !== -1) return byExactText;
  return lines.findIndex(
    (line) => CHECKBOX_PREFIX.test(line) && line.includes(task.description)
  );
}
async function editFileContent(app, file, transform) {
  let changed = false;
  await app.vault.process(file, (content) => {
    const next = transform(content);
    if (next === null || next === content) return content;
    changed = true;
    return next;
  });
  return changed;
}
async function editTaskLine(app, task, transform) {
  const target = app.vault.getAbstractFileByPath(task.filePath);
  if (!(target instanceof import_obsidian4.TFile)) {
    new import_obsidian4.Notice(t("\u627E\u4E0D\u5230\u6587\u4EF6\uFF1A{path}", { path: task.filePath }));
    return "missing";
  }
  let result = "missing";
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
function replaceTaskDescription(line, description) {
  const prefixMatch = CHECKBOX_PREFIX.exec(line);
  if (!prefixMatch) return line;
  const prefix = prefixMatch[1];
  const rest = line.slice(prefix.length);
  const tokenPattern = new RegExp(INLINE_FIELD_TOKEN_SOURCE, "gu");
  const parts = [];
  let descriptionWritten = false;
  let cursor = 0;
  let match;
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
function setCheckboxMarker(line, marker) {
  const prefixMatch = CHECKBOX_PREFIX.exec(line);
  if (!prefixMatch) return line;
  const prefix = prefixMatch[1];
  const rest = line.slice(prefix.length).replace(/^\[[^\]]*\]/u, `[${marker}]`);
  return `${prefix}${rest}`;
}
function setPriority(line, priority) {
  const indent = getIndent(line);
  const body = line.slice(indent.length).replace(/⏫|🔼|🔽|⏬|🔺/gu, "");
  const marker = PRIORITY_MARKERS2[priority];
  if (!marker) return compactLine(`${indent}${body}`);
  const prefix = CHECKBOX_PREFIX.exec(body)?.[1];
  const withMarker = prefix ? body.replace(prefix, `${prefix}${marker} `) : `${marker} ${body}`;
  return compactLine(`${indent}${withMarker}`);
}
function setDateField(line, emoji, value) {
  const pattern = new RegExp(`\\s*${emoji}(?:\\s*\\d{4}-\\d{2}-\\d{2})?`, "gu");
  const stripped = line.replace(pattern, "");
  return value ? `${stripped} ${emoji} ${value}` : stripped;
}
function setIdentifierField(line, emoji, fieldName, value) {
  const stripped = line.replace(new RegExp(`\\s*${emoji}\\s*\\S+`, "gu"), "").replace(new RegExp(`\\b${fieldName}\\s*\\S+`, "giu"), "");
  return value ? `${stripped} ${emoji} ${value}` : stripped;
}
function setConflictTag(line, enabled) {
  const stripped = line.replace(/\s*#due-date-conflict\b/giu, "");
  return enabled ? `${stripped} #due-date-conflict` : stripped;
}
function insertLineUnderHeading(content, heading, line) {
  const split = splitWithEol(content);
  const { lines } = split;
  const headingPattern = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "u");
  const headingIndex = lines.findIndex((candidate) => headingPattern.test(candidate.trim()));
  if (headingIndex === -1) {
    return { success: false, error: t("\u627E\u4E0D\u5230\u6807\u9898\u300C{heading}\u300D", { heading }) };
  }
  const levelMatch = /^(#{1,6})/u.exec(lines[headingIndex]);
  if (!levelMatch) return { success: false, error: t("\u6807\u9898\u683C\u5F0F\u4E0D\u5408\u6CD5") };
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

// src/services/note-service.ts
var import_obsidian5 = require("obsidian");
var CORE_DATE_FORMAT = "YYYY-MM-DD";
var CORE_TIME_FORMAT = "HH:mm";
var now = import_obsidian5.moment;
function resolvePlaceholders(text, options = {}) {
  const at = now();
  const formatted = (raw, fallback) => {
    const value = (raw ?? "").trim();
    return at.format(value.length === 0 ? fallback : value);
  };
  return text.replace(/\{\{title\}\}/gu, options.title ?? "").replace(
    /\{\{date(?::([^}]+))?\}\}/gu,
    (_match, format) => formatted(format, CORE_DATE_FORMAT)
  ).replace(
    /\{\{time(?::([^}]+))?\}\}/gu,
    (_match, format) => formatted(format, CORE_TIME_FORMAT)
  ).replace(/YYYY/gu, at.format("YYYY")).replace(/MM/gu, at.format("MM")).replace(/DD/gu, at.format("DD"));
}
async function ensureFolder(app, folderPath) {
  const normalized = (0, import_obsidian5.normalizePath)(folderPath.trim()).replace(/^\/+|\/+$/gu, "");
  if (normalized.length === 0 || normalized === ".") return;
  let current2 = "";
  for (const segment of normalized.split("/")) {
    if (segment.length === 0) continue;
    current2 = current2.length === 0 ? segment : `${current2}/${segment}`;
    if (app.vault.getAbstractFileByPath(current2) !== null) continue;
    await app.vault.createFolder(current2);
  }
}
function templateCandidates(raw) {
  let value = raw.trim();
  const link = /^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/u.exec(value);
  if (link !== null) value = (link[1] ?? "").trim();
  value = value.replace(/^["'`]+|["'`]+$/gu, "");
  const path = (0, import_obsidian5.normalizePath)(value).replace(/^\/+|\/+$/gu, "");
  if (path.length === 0) return [];
  return path.toLowerCase().endsWith(".md") ? [path] : [path, `${path}.md`];
}
function findTemplate(app, raw) {
  for (const candidate of templateCandidates(raw)) {
    const file = app.vault.getAbstractFileByPath(candidate);
    if (file instanceof import_obsidian5.TFile) return file;
  }
  return null;
}
async function ensureNote(app, path, options = { templatePath: "" }) {
  const normalized = (0, import_obsidian5.normalizePath)(path);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian5.TFile) return existing;
  const slash = normalized.lastIndexOf("/");
  await ensureFolder(app, slash === -1 ? "" : normalized.slice(0, slash));
  const rawTemplate = options.templatePath.trim();
  const template = rawTemplate.length === 0 ? null : findTemplate(app, rawTemplate);
  if (rawTemplate.length > 0 && template === null) {
    new import_obsidian5.Notice(t("\u627E\u4E0D\u5230\u6A21\u677F\u7B14\u8BB0\uFF1A{path}\uFF08\u5DF2\u6309\u7A7A\u767D\u7B14\u8BB0\u521B\u5EFA\uFF09", { path: rawTemplate }));
  }
  const name = slash === -1 ? normalized : normalized.slice(slash + 1);
  const title = name.replace(/\.md$/u, "");
  const body = template === null ? "" : resolvePlaceholders(await app.vault.read(template), { title });
  const file = await app.vault.create(normalized, body);
  if (template !== null) await runTemplateCommands(app, file);
  return file;
}
async function runTemplateCommands(app, file) {
  const templater = app.plugins?.plugins?.["templater-obsidian"]?.templater;
  if (templater === void 0 || typeof templater.overwrite_file_commands !== "function") return;
  try {
    await templater.overwrite_file_commands(file);
  } catch {
    new import_obsidian5.Notice(t("\u6A21\u677F\u547D\u4EE4\u672A\u5168\u90E8\u6267\u884C\uFF0C\u7B14\u8BB0\u5DF2\u6309\u6A21\u677F\u539F\u6587\u521B\u5EFA\uFF1B\u53EF\u7A0D\u540E\u6267\u884C\u4E00\u6B21\u6A21\u677F\u547D\u4EE4\u91CD\u8DD1"));
  }
}

// src/services/task-actions.ts
var import_obsidian6 = require("obsidian");
function notifyEditResult(result, task, message) {
  if (result === "missing") {
    new import_obsidian6.Notice(t("\u5728 {path}:{line} \u627E\u4E0D\u5230\u8BE5\u4EFB\u52A1\u884C", { path: task.filePath, line: task.lineNumber }));
    return;
  }
  if (result === "updated") new import_obsidian6.Notice(message);
}
function hasDateConflict(startDate, dueDate) {
  if (!startDate || !dueDate) return false;
  return startDate > dueDate;
}
async function toggleTaskStatus(app, settings, task) {
  const completionMarkers = settings.completionMarkers;
  const defaultCompleteMarker = completionMarkers[0] ?? "x";
  const trackCompletionDate = settings.trackCompletionDate;
  const today = todayIso();
  let wasCompleted = completionMarkers.includes(task.checkboxStatus.trim());
  const result = await editTaskLine(app, task, (line) => {
    const currentMarker = /\[([^\]]*)\]/u.exec(line)?.[1]?.trim() ?? "";
    wasCompleted = completionMarkers.includes(currentMarker);
    let next = setCheckboxMarker(line, wasCompleted ? " " : defaultCompleteMarker);
    if (trackCompletionDate) {
      next = wasCompleted ? next.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/u, "") : `${next} \u2705 ${today}`;
    }
    return next;
  });
  notifyEditResult(result, task, wasCompleted ? t("\u5DF2\u91CD\u65B0\u6253\u5F00") : t("\u4EFB\u52A1\u5DF2\u5B8C\u6210"));
}
async function cancelTask(app, settings, task) {
  const cancelledMarker = settings.cancelledMarkers[0] ?? "-";
  const result = await editTaskLine(app, task, (line) => setCheckboxMarker(line, cancelledMarker));
  notifyEditResult(result, task, t("\u4EFB\u52A1\u5DF2\u53D6\u6D88"));
}
async function startTask(app, task) {
  const today = todayIso();
  const result = await editTaskLine(app, task, (line) => {
    const withStartDate = line.includes("\u{1F6EB}") ? line : `${line} \u{1F6EB} ${today}`;
    return withStartDate.toLowerCase().includes("#doing") ? withStartDate : `${withStartDate} #doing`;
  });
  notifyEditResult(result, task, t("\u4EFB\u52A1\u5DF2\u5F00\u59CB"));
}
async function deleteTask(app, task) {
  const result = await editTaskLine(app, task, () => null);
  notifyEditResult(result, task, t("\u4EFB\u52A1\u5DF2\u5220\u9664"));
}
async function moveTaskToGtdState(app, settings, task, newState, resolveConflict) {
  const today = todayIso();
  const updates = {};
  let tagToAdd = "";
  let removeTags = [];
  let shouldComplete = false;
  switch (newState) {
    case "Waiting":
      tagToAdd = "#waiting";
      removeTags = ["#doing", "#active", "#next"];
      break;
    case "In Progress":
      tagToAdd = "#doing";
      removeTags = ["#waiting", "#delegated", "#blocked"];
      updates.startDate = today;
      break;
    case "To be Started":
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
    case "Overdue":
      updates.dueDate = today;
      removeTags = ["#waiting", "#delegated", "#blocked"];
      break;
    case "Done":
      shouldComplete = true;
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
    case "Inbox":
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
  }
  const effectiveStart = updates.startDate ?? task.startDate;
  const effectiveDue = updates.dueDate ?? task.dueDate;
  let addConflictTag = false;
  if (hasDateConflict(effectiveStart, effectiveDue) && updates.startDate) {
    const choice = await resolveConflict(effectiveStart, effectiveDue);
    if (choice === "cancel") return;
    if (choice === "adjust-due") updates.dueDate = today;
    else addConflictTag = true;
  }
  if (task.gtdState === newState && updates.startDate === void 0 && updates.dueDate === void 0 && !shouldComplete && !addConflictTag) {
    return;
  }
  const completionMarker = settings.completionMarkers[0] ?? "x";
  const result = await editTaskLine(app, task, (line) => {
    const indent = getIndent(line);
    let body = line.slice(indent.length);
    for (const tag of removeTags) {
      body = body.replace(new RegExp(`\\s*${tag}\\b`, "giu"), "");
    }
    body = setConflictTag(body, false);
    if (tagToAdd && !body.toLowerCase().includes(tagToAdd.toLowerCase())) {
      body += ` ${tagToAdd}`;
    }
    if (addConflictTag) body = setConflictTag(body, true);
    if (shouldComplete) body = setCheckboxMarker(body, completionMarker);
    if (updates.startDate !== void 0) body = setDateField(body, "\u{1F6EB}", updates.startDate);
    if (updates.dueDate !== void 0) body = setDateField(body, "\u{1F4C5}", updates.dueDate);
    return compactLine(`${indent}${body}`);
  });
  if (result === "updated") new import_obsidian6.Notice(t("\u5DF2\u79FB\u52A8\u5230\u300C{state}\u300D", { state: newState }));
}
async function moveTaskToQuadrant(app, task, newQuadrant) {
  if (task.quadrant === newQuadrant) return;
  const today = todayIso();
  let priority = "none" /* None */;
  let shouldAddDueDate = false;
  switch (newQuadrant) {
    case "Q1":
      priority = "high" /* High */;
      shouldAddDueDate = true;
      break;
    case "Q2":
      priority = "high" /* High */;
      break;
    case "Q3":
      priority = "low" /* Low */;
      shouldAddDueDate = true;
      break;
    case "Q4":
      priority = "lowest" /* Lowest */;
      break;
  }
  const result = await editTaskLine(app, task, (line) => {
    const indent = getIndent(line);
    let body = setPriority(line.slice(indent.length), priority);
    body = setDateField(body, "\u{1F4C5}", shouldAddDueDate ? today : "");
    return compactLine(`${indent}${body}`);
  });
  if (result === "updated") new import_obsidian6.Notice(t("\u5DF2\u79FB\u52A8\u5230 {quadrant}", { quadrant: newQuadrant }));
}

// src/modals/task-editor-modal.ts
var TaskEditorModal = class extends import_obsidian7.Modal {
  constructor(host, task, defaults = {}) {
    super(host.app);
    this.host = host;
    this.task = task;
    this.defaults = defaults;
    this.isCreateMode = task === null;
  }
  onOpen() {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(this.isCreateMode ? t("\u65B0\u5EFA\u4EFB\u52A1") : t("\u7F16\u8F91\u4EFB\u52A1"));
    const form = this.contentEl.createDiv({ cls: "tm-form" });
    const source = this.task;
    let description = this.isCreateMode ? "" : source?.description ?? "";
    let priority = this.isCreateMode ? this.defaults.priority ?? "none" /* None */ : source?.priority ?? "none" /* None */;
    let startDate = this.isCreateMode ? this.defaults.startDate ?? "" : source?.startDate ?? "";
    let dueDate = this.isCreateMode ? this.defaults.dueDate ?? "" : source?.dueDate ?? "";
    let taskId = this.isCreateMode ? "" : source?.taskId ?? "";
    let dependsOn = this.isCreateMode ? "" : source?.dependsOn ?? "";
    new import_obsidian7.Setting(form).setName(t("\u63CF\u8FF0")).addText(
      (text) => text.setPlaceholder(t("\u4EFB\u52A1\u63CF\u8FF0")).setValue(description).onChange((value) => {
        description = value;
      })
    );
    new import_obsidian7.Setting(form).setName(t("\u4F18\u5148\u7EA7")).addDropdown((dropdown) => {
      for (const level of [
        "none" /* None */,
        "lowest" /* Lowest */,
        "low" /* Low */,
        "medium" /* Medium */,
        "high" /* High */,
        "highest" /* Highest */,
        "critical" /* Critical */
      ]) {
        dropdown.addOption(level, priorityLabel(level));
      }
      dropdown.setValue(priority).onChange((value) => {
        priority = value;
      });
    });
    new import_obsidian7.Setting(form).setName(t("\u5F00\u59CB\u65E5\u671F")).addText((text) => {
      text.inputEl.type = "date";
      text.setValue(startDate).onChange((value) => {
        startDate = value;
      });
    });
    new import_obsidian7.Setting(form).setName(t("\u622A\u6B62\u65E5\u671F")).addText((text) => {
      text.inputEl.type = "date";
      text.setValue(dueDate).onChange((value) => {
        dueDate = value;
      });
    });
    let idText = null;
    new import_obsidian7.Setting(form).setName(t("\u4EFB\u52A1 ID")).setDesc(t("\u7528\u4E8E\u88AB\u5176\u4ED6\u4EFB\u52A1\u4F9D\u8D56")).addText((text) => {
      idText = text;
      text.setValue(taskId).onChange((value) => {
        taskId = value.trim();
      });
    }).addButton(
      (button) => button.setButtonText("\u{1F3B2}").setTooltip(t("\u968F\u673A\u751F\u6210 ID")).onClick(() => {
        taskId = generateShortId();
        idText?.setValue(taskId);
      })
    );
    new import_obsidian7.Setting(form).setName(t("\u4F9D\u8D56\u4EFB\u52A1")).addDropdown((dropdown) => {
      dropdown.addOption("", t("\u4E0D\u4F9D\u8D56"));
      for (const [id, label] of this.dependencyOptions(source?.taskId ?? "")) {
        dropdown.addOption(id, label);
      }
      dropdown.setValue(dependsOn).onChange((value) => {
        dependsOn = value;
      });
    });
    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new import_obsidian7.Setting(buttons).addButton((button) => button.setButtonText(t("\u53D6\u6D88")).onClick(() => this.close())).addButton(
      (button) => button.setButtonText(this.isCreateMode ? t("\u521B\u5EFA") : t("\u4FDD\u5B58")).setCta().onClick(() => {
        void this.submit({ description, priority, startDate, dueDate, taskId, dependsOn });
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
  /** 依赖候选：未完成、有 ID、且不是自己；按截止日由近到远 */
  dependencyOptions(selfId) {
    const options = [];
    const seen = /* @__PURE__ */ new Set();
    const candidates = this.host.tasks.filter(
      (task) => task.displayStatus !== "completed" && task.displayStatus !== "cancelled" && Boolean(task.taskId) && task.taskId !== selfId
    ).sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));
    for (const candidate of candidates) {
      const id = candidate.taskId;
      if (id === void 0 || seen.has(id)) continue;
      seen.add(id);
      const due = candidate.dueDate ? t("\uFF08\u622A\u6B62 {date}\uFF09", { date: candidate.dueDate }) : "";
      options.push([id, `${id}${due}\uFF1A${candidate.description.slice(0, 40)}`]);
    }
    return options;
  }
  // ────────────────────────────── 提交 ──────────────────────────────
  async submit(updates) {
    const startDate = updates.startDate ?? "";
    const dueDate = updates.dueDate ?? "";
    if (hasDateConflict(startDate, dueDate)) {
      const choice = await askDateConflict(this.host.app, startDate, dueDate);
      if (choice === "cancel") return;
      if (choice === "adjust-due") {
        updates.dueDate = todayIso();
        new import_obsidian7.Notice(t("\u5DF2\u628A\u622A\u6B62\u65E5\u671F\u8C03\u6574\u4E3A\u4ECA\u5929"));
      } else {
        updates.conflictTag = true;
      }
    }
    const saved = this.isCreateMode ? await this.createTask(updates) : await this.saveTask(updates);
    if (!saved) return;
    this.host.onSaved();
    this.close();
  }
  async createTask(updates) {
    const description = updates.description?.trim() ?? "";
    if (description.length === 0) {
      new import_obsidian7.Notice(t("\u8BF7\u586B\u5199\u4EFB\u52A1\u63CF\u8FF0"));
      return false;
    }
    const target = await this.resolveTargetFile();
    if (target === null) return false;
    let line = `- [ ] ${description}`;
    if (updates.priority !== void 0 && updates.priority !== "none" /* None */) {
      line = setPriority(line, updates.priority);
    }
    if (updates.dueDate) line = setDateField(line, "\u{1F4C5}", updates.dueDate);
    if (updates.startDate) line = setDateField(line, "\u{1F6EB}", updates.startDate);
    if (updates.taskId) line = setIdentifierField(line, "\u{1F194}", "id::", updates.taskId);
    if (updates.dependsOn) line = setIdentifierField(line, "\u26D4", "dependsOn::", updates.dependsOn);
    if (this.defaults.gtdState === "Waiting") line += " #waiting";
    else if (this.defaults.gtdState === "In Progress") line += " #doing";
    if (updates.conflictTag === true) line += " #due-date-conflict";
    const heading = this.host.settings.newTaskTargetHeading;
    let failure;
    if (heading.length > 0) {
      const inserted = await editFileContent(this.host.app, target, (content) => {
        const result = insertLineUnderHeading(content, heading, line);
        if (!result.success) {
          failure = result.error;
          return null;
        }
        return result.content ?? null;
      });
      if (!inserted && failure !== void 0) {
        new import_obsidian7.Notice(t("\u65E0\u6CD5\u6DFB\u52A0\u4EFB\u52A1\uFF1A{reason}", { reason: failure }));
        return false;
      }
    } else {
      await editFileContent(this.host.app, target, (content) => appendLine(content, line));
    }
    new import_obsidian7.Notice(t("\u5DF2\u6DFB\u52A0\u5230 {path}", { path: target.path }));
    return true;
  }
  /**
   * 落点笔记：配了路径模板就用它（**不存在时按模板新建**），没配就用当前打开的笔记。
   *
   * 「当日日志还没写」是常态而不是异常，所以这里走的是「缺了就建」，
   * 而不是提示用户先自己去建一篇 —— 新建任务本来就该是一步的事。
   */
  async resolveTargetFile() {
    const { newTaskTargetPath, newTaskTemplatePath } = this.host.settings;
    if (newTaskTargetPath.length > 0) {
      const path = resolvePlaceholders(newTaskTargetPath);
      try {
        return await ensureNote(this.host.app, path, { templatePath: newTaskTemplatePath });
      } catch {
        new import_obsidian7.Notice(t("\u65E0\u6CD5\u521B\u5EFA\u76EE\u6807\u7B14\u8BB0\uFF1A{path}", { path }));
        return null;
      }
    }
    const active = this.host.app.workspace.getActiveFile();
    if (active === null || active.extension !== "md") {
      new import_obsidian7.Notice(t("\u8BF7\u5148\u5728\u8BBE\u7F6E\u91CC\u6307\u5B9A\u76EE\u6807\u7B14\u8BB0\uFF0C\u6216\u6253\u5F00\u4E00\u4E2A Markdown \u6587\u4EF6"));
      return null;
    }
    return active;
  }
  async saveTask(updates) {
    const task = this.task;
    if (task === null) return false;
    const description = updates.description?.trim() ?? "";
    if (description.length === 0) {
      new import_obsidian7.Notice(t("\u8BF7\u586B\u5199\u4EFB\u52A1\u63CF\u8FF0"));
      return false;
    }
    const result = await editTaskLine(this.host.app, task, (line) => {
      let next = line;
      if (description !== task.description) next = replaceTaskDescription(next, description);
      if (updates.priority !== void 0 && updates.priority !== task.priority) {
        next = setPriority(next, updates.priority);
      }
      if (updates.dueDate !== void 0 && updates.dueDate !== (task.dueDate ?? "")) {
        next = setDateField(next, "\u{1F4C5}", updates.dueDate);
      }
      if (updates.startDate !== void 0 && updates.startDate !== (task.startDate ?? "")) {
        next = setDateField(next, "\u{1F6EB}", updates.startDate);
      }
      if (updates.taskId !== void 0 && updates.taskId !== (task.taskId ?? "")) {
        next = setIdentifierField(next, "\u{1F194}", "id::", updates.taskId);
      }
      if (updates.dependsOn !== void 0 && updates.dependsOn !== (task.dependsOn ?? "")) {
        next = setIdentifierField(next, "\u26D4", "dependsOn::", updates.dependsOn);
      }
      if (updates.conflictTag === true && !/#due-date-conflict\b/iu.test(next)) {
        next = `${next} #due-date-conflict`;
      }
      if (next === line) return line;
      return compactLine(next);
    });
    if (result === "missing") {
      new import_obsidian7.Notice(t("\u5728 {path}:{line} \u627E\u4E0D\u5230\u8BE5\u4EFB\u52A1\u884C", { path: task.filePath, line: task.lineNumber }));
      return false;
    }
    if (result === "updated") new import_obsidian7.Notice(t("\u4EFB\u52A1\u5DF2\u66F4\u65B0"));
    return true;
  }
};

// src/services/calendar-service.ts
function calendarItemLabel(type) {
  switch (type) {
    case "due":
      return t("\u622A\u6B62");
    case "start":
      return t("\u5F00\u59CB");
    case "scheduled":
      return t("\u8BA1\u5212");
    case "done":
      return t("\u5B8C\u6210");
    case "overdue":
      return t("\u903E\u671F");
    default:
      return t("\u8FDB\u884C\u4E2D");
  }
}
function calendarModeLabel(mode) {
  switch (mode) {
    case "week":
      return t("\u5468");
    case "list":
      return t("\u5217\u8868");
    default:
      return t("\u6708");
  }
}
function weekdayLabel(weekday) {
  switch (weekday) {
    case 0:
      return t("\u5468\u65E5");
    case 1:
      return t("\u5468\u4E00");
    case 2:
      return t("\u5468\u4E8C");
    case 3:
      return t("\u5468\u4E09");
    case 4:
      return t("\u5468\u56DB");
    case 5:
      return t("\u5468\u4E94");
    default:
      return t("\u5468\u516D");
  }
}
function localeTag() {
  return getLocale() === "zh" ? "zh-CN" : "en-US";
}
function calendarTitle(anchor, mode, firstDay) {
  const tag = localeTag();
  if (mode === "week") {
    const from = startOfWeek(anchor, firstDay);
    const to = addDays(from, 6);
    const sameYear = from.getFullYear() === to.getFullYear();
    const fromLabel = from.toLocaleDateString(tag, {
      year: sameYear ? void 0 : "numeric",
      month: "short",
      day: "numeric"
    });
    const toLabel = to.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
    return `${fromLabel} \u2013 ${toLabel}`;
  }
  return anchor.toLocaleDateString(tag, { year: "numeric", month: "long" });
}
function isInCalendarRange(dateIso, mode, anchor, firstDay) {
  const check = dateIso ? parseIso(dateIso) : null;
  if (check === null) return false;
  check.setHours(0, 0, 0, 0);
  if (mode === "week") {
    const from = startOfWeek(anchor, firstDay);
    const to = addDays(from, 6);
    return check >= from && check <= to;
  }
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return check >= monthStart && check <= monthEnd;
}
function monthGridDates(anchor, firstDay, showWeekends) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const cursor = startOfWeek(monthStart, firstDay);
  const renderEnd = addDays(startOfWeek(monthEnd, firstDay), 6);
  const dates = [];
  for (let day = new Date(cursor); day <= renderEnd; day = addDays(day, 1)) {
    if (!showWeekends && isWeekend(day.getDay())) continue;
    dates.push(new Date(day));
  }
  return dates;
}
function weekDates(anchor, firstDay, showWeekends) {
  const from = startOfWeek(anchor, firstDay);
  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const day = addDays(from, index);
    if (!showWeekends && isWeekend(day.getDay())) continue;
    dates.push(day);
  }
  return dates;
}
function monthDates(anchor) {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const dates = [];
  for (let day = new Date(monthStart); day <= monthEnd; day = addDays(day, 1)) {
    dates.push(new Date(day));
  }
  return dates;
}
function extractDailyNoteDate(filePath) {
  return /(\d{4}-\d{2}-\d{2})/u.exec(filePath)?.[1];
}
function collectCalendarItems(tasks, options) {
  const byDate = {};
  const today = todayIso();
  const push = (dateKey, task, type) => {
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push({ task, type });
  };
  for (const task of tasks) {
    if (task.displayStatus === "completed") {
      if (task.doneDate) push(task.doneDate, task, "done");
      else if (task.dueDate) push(task.dueDate, task, "done");
      continue;
    }
    if (task.dueDate) {
      push(task.dueDate, task, task.displayStatus === "overdue" ? "overdue" : "due");
    }
    if (task.startDate && task.startDate !== task.dueDate) push(task.startDate, task, "start");
    if (task.scheduledDate) push(task.scheduledDate, task, "scheduled");
    if (task.displayStatus === "overdue" && task.dueDate && task.dueDate < today) {
      push(today, task, "overdue");
    }
    if (options.showInProcessTasks && task.displayStatus !== "cancelled" && task.startDate && task.dueDate && task.startDate < task.dueDate) {
      const start = parseIso(task.startDate);
      if (start !== null) {
        for (let day = addDays(start, 1); formatIso(day) < task.dueDate; day = addDays(day, 1)) {
          push(formatIso(day), task, "process");
        }
      }
    }
  }
  return byDate;
}
function buildCalendarSummary(tasks, mode, anchor, settings) {
  const today = todayIso();
  const inScope = (dateIso) => isInCalendarRange(dateIso, mode, anchor, settings.calendarFirstDayOfWeek);
  const scoped = tasks.filter((task) => [task.dueDate, task.startDate, task.scheduledDate, task.doneDate, extractDailyNoteDate(task.filePath)].some((date) => inScope(date)));
  const unique = new Map(scoped.map((task) => [task.id, task]));
  const values = [...unique.values()];
  const isDone = (task) => settings.completionMarkers.includes(task.checkboxStatus.trim());
  const isCancelled = (task) => settings.cancelledMarkers.includes(task.checkboxStatus.trim());
  const active = values.filter(
    (task) => !isDone(task) && !isCancelled(task) && task.displayStatus !== "completed" && task.displayStatus !== "cancelled"
  );
  return {
    total: values.length,
    done: values.filter((task) => task.displayStatus === "completed").length,
    due: active.filter((task) => Boolean(task.dueDate) && inScope(task.dueDate)).length,
    overdue: active.filter((task) => task.displayStatus === "overdue" && Boolean(task.dueDate) && task.dueDate < today).length,
    start: active.filter((task) => Boolean(task.startDate) && inScope(task.startDate)).length,
    scheduled: active.filter((task) => Boolean(task.scheduledDate) && inScope(task.scheduledDate)).length,
    recurrence: active.filter((task) => Boolean(task.recurrence)).length,
    dailyNotes: values.filter((task) => {
      const dailyDate = extractDailyNoteDate(task.filePath);
      return Boolean(dailyDate && inScope(dailyDate) && !task.dueDate && !task.startDate && !task.scheduledDate);
    }).length
  };
}

// src/panels/tooltip.ts
var OFFSET = 8;
var HoverTooltip = class {
  constructor() {
    this.el = null;
    this.doc = null;
  }
  show(anchor, lines) {
    if (lines.length === 0) return;
    const el = this.ensureElement(anchor.ownerDocument);
    el.empty();
    for (const line of lines) {
      el.createDiv({ cls: line.muted === true ? "tm-tooltip__line is-muted" : "tm-tooltip__line", text: line.text });
    }
    el.removeClass("is-hidden");
    this.position(el, anchor);
  }
  hide() {
    this.el?.addClass("is-hidden");
  }
  /** 视图关闭时调用：提示元素挂在 document 上，不清理就会留一个孤儿节点 */
  destroy() {
    this.el?.remove();
    this.el = null;
    this.doc = null;
  }
  ensureElement(doc) {
    if (this.el !== null && this.doc === doc) return this.el;
    this.destroy();
    this.doc = doc;
    this.el = doc.body.createDiv({ cls: "tm-tooltip is-hidden" });
    return this.el;
  }
  /** 默认贴在锚点上方；上方放不下就翻到下方，并夹在视口内 */
  position(el, anchor) {
    const win = anchor.ownerDocument.defaultView;
    const anchorRect = anchor.getBoundingClientRect();
    const ownRect = el.getBoundingClientRect();
    const viewportWidth = win?.innerWidth ?? 0;
    const viewportHeight = win?.innerHeight ?? 0;
    let top = anchorRect.top - ownRect.height - OFFSET;
    if (top < OFFSET) top = anchorRect.bottom + OFFSET;
    top = Math.min(top, Math.max(OFFSET, viewportHeight - ownRect.height - OFFSET));
    let left = anchorRect.left;
    if (left + ownRect.width > viewportWidth - OFFSET) {
      left = Math.max(OFFSET, viewportWidth - ownRect.width - OFFSET);
    }
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
  }
};

// src/panels/calendar-board.ts
var MAX_ITEMS_PER_DAY = 4;
var CalendarBoard = class {
  constructor(host, callbacks) {
    this.host = host;
    this.callbacks = callbacks;
    this.tooltip = new HoverTooltip();
    this.host.addClass("tm-calendar");
  }
  /** 视图关闭时调用：提示元素挂在 document 上，不清理会留下孤儿节点 */
  destroy() {
    this.tooltip.destroy();
  }
  render(options) {
    this.host.empty();
    this.tooltip.hide();
    this.renderToolbar(options);
    switch (options.mode) {
      case "week":
        this.renderWeek(options);
        return;
      case "list":
        this.renderList(options);
        return;
      default:
        this.renderMonth(options);
    }
  }
  renderToolbar(options) {
    const bar = this.host.createDiv({ cls: "tm-calendar__toolbar" });
    const modes = bar.createDiv({ cls: "tm-calendar__modes" });
    for (const mode of ["list", "month", "week"]) {
      const button = modes.createEl("button", {
        cls: `tm-calendar__mode${options.mode === mode ? " is-active" : ""}`,
        text: calendarModeLabel(mode),
        attr: { type: "button" }
      });
      button.addEventListener("click", () => this.callbacks.onModeChange(mode));
    }
    const nav = bar.createDiv({ cls: "tm-calendar__nav" });
    const prev = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: "\u2190", attr: { type: "button" } });
    nav.createDiv({
      cls: "tm-calendar__title",
      text: calendarTitle(options.anchor, options.mode, options.settings.calendarFirstDayOfWeek)
    });
    const today = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: t("\u4ECA\u5929"), attr: { type: "button" } });
    const next = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: "\u2192", attr: { type: "button" } });
    prev.addEventListener("click", () => this.callbacks.onShift(-1));
    next.addEventListener("click", () => this.callbacks.onShift(1));
    today.addEventListener("click", () => this.callbacks.onToday());
    const summaryBtn = nav.createEl("button", {
      cls: `tm-calendar__nav-btn${options.summaryOpen ? " is-active" : ""}`,
      text: t("\u6C47\u603B"),
      attr: { type: "button" }
    });
    summaryBtn.addEventListener("click", () => this.callbacks.onToggleSummary());
    if (options.summaryOpen) this.renderSummary(bar, options.summary);
  }
  renderSummary(parent, summary) {
    const popup = parent.createDiv({ cls: "tm-calendar__summary" });
    const list = popup.createEl("ul");
    const rows = [
      ["\u2705", t("\u5DF2\u5B8C\u6210\uFF1A{done}/{total}", { done: summary.done, total: summary.total })],
      ["\u{1F4C5}", t("\u622A\u6B62\uFF1A{count}", { count: summary.due })],
      ["\u26A0\uFE0F", t("\u903E\u671F\uFF1A{count}", { count: summary.overdue })],
      ["\u{1F6EB}", t("\u5F00\u59CB\uFF1A{count}", { count: summary.start })],
      ["\u23F3", t("\u8BA1\u5212\uFF1A{count}", { count: summary.scheduled })],
      ["\u{1F501}", t("\u91CD\u590D\uFF1A{count}", { count: summary.recurrence })],
      ["\u{1F4DD}", t("\u65E5\u8BB0\uFF1A{count}", { count: summary.dailyNotes })]
    ];
    for (const [icon, text] of rows) {
      list.createEl("li", { text: `${icon} ${text}` });
    }
  }
  // ────────────────────────────── 月视图 ──────────────────────────────
  renderMonth(options) {
    const showWeekends = options.settings.showCalendarMonthWeekends;
    const visibleWeekdays = weekdayOrder(options.settings.calendarFirstDayOfWeek).filter((weekday) => showWeekends || !isWeekend(weekday));
    const wrap = this.host.createDiv({ cls: "tm-calendar__month" });
    if (!showWeekends) wrap.addClass("is-workweek");
    const heads = wrap.createDiv({ cls: "tm-calendar__heads" });
    for (const weekday of visibleWeekdays) {
      heads.createEl("div", {
        cls: `tm-calendar__head${isWeekend(weekday) ? " is-weekend" : ""}`,
        text: weekdayLabel(weekday)
      });
    }
    const grid = wrap.createDiv({ cls: "tm-calendar__grid" });
    const month = options.anchor.getMonth();
    for (const date of monthGridDates(options.anchor, options.settings.calendarFirstDayOfWeek, showWeekends)) {
      const iso = formatIso(date);
      const classes = ["tm-calendar__day"];
      if (isWeekend(date.getDay())) classes.push("is-weekend");
      if (date.getMonth() !== month) classes.push("is-outside");
      if (iso === options.today) classes.push("is-today");
      const dayEl = grid.createDiv({ cls: classes.join(" ") });
      dayEl.createDiv({ cls: "tm-calendar__date", text: String(date.getDate()) });
      const items = dayEl.createDiv({ cls: "tm-calendar__items" });
      const entries = options.itemsByDate[iso] ?? [];
      for (const entry of entries.slice(0, MAX_ITEMS_PER_DAY)) {
        this.renderItem(items, entry);
      }
      if (entries.length > MAX_ITEMS_PER_DAY) {
        items.createDiv({
          cls: "tm-calendar__more",
          text: t("\u8FD8\u6709 {count} \u9879", { count: entries.length - MAX_ITEMS_PER_DAY })
        });
      }
    }
  }
  // ────────────────────────────── 周视图 ──────────────────────────────
  renderWeek(options) {
    const showWeekends = options.settings.showCalendarWeekends;
    const wrap = this.host.createDiv({ cls: "tm-calendar__week" });
    const weekends = [];
    const weekdays = [];
    for (const date of weekDates(options.anchor, options.settings.calendarFirstDayOfWeek, true)) {
      (isWeekend(date.getDay()) ? weekends : weekdays).push(date);
    }
    const main = wrap.createDiv({ cls: "tm-calendar__week-main" });
    for (const date of weekdays) this.renderDayCard(main, date, options);
    if (!showWeekends) return;
    const aside = wrap.createDiv({ cls: "tm-calendar__weekend" });
    for (const date of weekends) this.renderDayCard(aside, date, options);
  }
  renderDayCard(host, date, options) {
    const iso = formatIso(date);
    const classes = ["tm-calendar__day", "tm-calendar__day--card"];
    if (isWeekend(date.getDay())) classes.push("is-weekend");
    if (iso === options.today) classes.push("is-today");
    const dayEl = host.createDiv({ cls: classes.join(" ") });
    dayEl.createDiv({
      cls: "tm-calendar__date",
      text: `${weekdayLabel(date.getDay())} ${date.getDate()}`
    });
    const items = dayEl.createDiv({ cls: "tm-calendar__items" });
    for (const entry of options.itemsByDate[iso] ?? []) {
      this.renderItem(items, entry);
    }
  }
  // ────────────────────────────── 列表视图 ──────────────────────────────
  renderList(options) {
    const list = this.host.createDiv({ cls: "tm-calendar__list" });
    const showEmptyDays = options.settings.calendarListShowFullMonth;
    for (const date of monthDates(options.anchor)) {
      const iso = formatIso(date);
      const entries = options.itemsByDate[iso] ?? [];
      if (!showEmptyDays && entries.length === 0) continue;
      const details = list.createEl("details", {
        cls: `tm-calendar__list-day${iso === options.today ? " is-today" : ""}`
      });
      if (iso === options.today) details.open = true;
      details.createEl("summary", {
        text: `${date.toLocaleDateString(void 0, { month: "short", day: "numeric", weekday: "short" })} (${entries.length})`
      });
      const body = details.createDiv({ cls: "tm-calendar__list-body" });
      if (entries.length === 0) {
        body.createDiv({ cls: "tm-calendar__item", text: t("\u65E0\u4EFB\u52A1") });
        continue;
      }
      for (const entry of entries) this.renderItem(body, entry);
    }
  }
  // ────────────────────────────── 条目 ──────────────────────────────
  renderItem(host, entry) {
    const { task, type } = entry;
    const linkTarget = task.sectionHeading ? `${task.filePath}#${task.sectionHeading}` : task.filePath;
    const item = host.createEl("a", {
      cls: `tm-calendar__item is-${type} internal-link`,
      text: `${calendarItemLabel(type)} ${task.description}`,
      attr: { "aria-label": task.description }
    });
    item.setAttribute("href", linkTarget);
    item.setAttribute("data-href", linkTarget);
    item.addEventListener("mouseenter", () => {
      this.tooltip.show(item, [
        { text: `${calendarItemLabel(type)} \xB7 ${task.description}` },
        { text: `${task.filePath}:${task.lineNumber}`, muted: true }
      ]);
    });
    item.addEventListener("mouseleave", () => this.tooltip.hide());
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.tooltip.hide();
      this.callbacks.onOpenTask(task);
    });
  }
};

// src/panels/filter-bar.ts
var SEARCH_DEBOUNCE_MS = 300;
var FilterBar = class {
  constructor(component, host, deps) {
    this.component = component;
    this.host = host;
    this.deps = deps;
    this.chipsEl = null;
    this.markerGroupEl = null;
    this.markerChipsEl = null;
    this.searchInput = null;
    this.presetSelect = null;
    this.sortSelect = null;
    this.countEl = null;
    this.clearBtn = null;
    this.searchTimer = null;
    this.dateControls = /* @__PURE__ */ new Map();
    this.host.addClass("tm-filter-bar");
    this.build();
    this.component.register(() => this.clearSearchTimer());
  }
  build() {
    this.buildStatusGroup();
    this.buildMarkerGroup();
    this.buildSearchGroup();
    this.dateControls.set("start", this.buildDateGroup("start"));
    this.dateControls.set("due", this.buildDateGroup("due"));
    this.buildSortGroup();
    this.buildSummary();
    this.update();
  }
  buildStatusGroup() {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--status" });
    group.createEl("label", { cls: "tm-filter-label", text: t("\u72B6\u6001") });
    const preset = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": t("\u72B6\u6001\u9884\u8BBE") }
    });
    this.presetSelect = preset;
    for (const value of ["active-only", "hide-cancelled", "all"]) {
      preset.createEl("option", { value, text: statusPresetLabel(value) });
    }
    this.component.registerDomEvent(preset, "change", () => {
      this.deps.setStatuses(presetToStatuses(preset.value));
    });
    this.chipsEl = group.createDiv({ cls: "tm-chips" });
  }
  /**
   * 标记筛选：按方括号里的原始内容筛（`- [x]` 的 x、`- [-]` 的 -、未勾选的空）。
   *
   * 候选从**数据里实际出现过的标记**生成，而不是把设置里的配置列一遍：
   * 配置了却一个都没用到的标记，做成 chip 只会点了没反应。
   */
  buildMarkerGroup() {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--marker" });
    this.markerGroupEl = group;
    group.createEl("label", { cls: "tm-filter-label", text: t("\u6807\u8BB0") });
    this.markerChipsEl = group.createDiv({ cls: "tm-chips tm-chips--marker" });
  }
  buildSearchGroup() {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--search" });
    group.createEl("label", { cls: "tm-filter-label", text: t("\u641C\u7D22") });
    const input = group.createEl("input", {
      cls: "tm-filter-input",
      attr: { type: "search", placeholder: t("\u4EFB\u52A1\u63CF\u8FF0\u3001\u6587\u4EF6\u3001ID") }
    });
    this.searchInput = input;
    this.component.registerDomEvent(input, "input", () => this.scheduleSearch(input.value));
    this.component.registerDomEvent(input, "keydown", (evt) => {
      if (evt.key !== "Enter") return;
      evt.preventDefault();
      this.clearSearchTimer();
      this.deps.setSearch(input.value);
    });
  }
  /**
   * 日期区间：预设下拉 + **常显**的起止输入框。
   *
   * 常显而不是藏在某个模式里：选「本月」时也该看到具体是哪几天；
   * 手改任一端即自动切到「自定义区间」，不必先切模式再选日期。
   */
  buildDateGroup(field) {
    const group = this.host.createDiv({ cls: `tm-filter-group tm-filter-group--${field}` });
    group.createEl("label", { cls: "tm-filter-label", text: field === "start" ? t("\u5F00\u59CB\u65E5\u671F") : t("\u622A\u6B62\u65E5\u671F") });
    const select = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": field === "start" ? t("\u6309\u5F00\u59CB\u65E5\u671F\u7B5B\u9009") : t("\u6309\u622A\u6B62\u65E5\u671F\u7B5B\u9009") }
    });
    for (const preset of DATE_PRESETS) {
      select.createEl("option", { value: preset, text: datePresetLabel(preset) });
    }
    const row = group.createDiv({ cls: "tm-date-range" });
    const from = row.createEl("input", {
      cls: "tm-filter-input tm-filter-input--date",
      attr: { type: "date", "aria-label": t("\u533A\u95F4\u8D77\u59CB\u65E5\u671F") }
    });
    row.createSpan({ cls: "tm-date-sep", text: "~" });
    const to = row.createEl("input", {
      cls: "tm-filter-input tm-filter-input--date",
      attr: { type: "date", "aria-label": t("\u533A\u95F4\u7ED3\u675F\u65E5\u671F") }
    });
    const commit = (preset) => {
      const range = {
        preset,
        start: from.value === "" ? null : from.value,
        end: to.value === "" ? null : to.value
      };
      if (field === "start") this.deps.setStartDate(range);
      else this.deps.setDueDate(range);
    };
    this.component.registerDomEvent(select, "change", () => commit(select.value));
    for (const input of [from, to]) {
      this.component.registerDomEvent(input, "change", () => commit("custom"));
    }
    return { group, select, from, to };
  }
  buildSortGroup() {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--sort" });
    group.createEl("label", { cls: "tm-filter-label", text: t("\u6392\u5E8F") });
    const select = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": t("\u6392\u5E8F\u65B9\u5F0F") }
    });
    this.sortSelect = select;
    for (const mode of SORT_MODES) {
      select.createEl("option", { value: mode, text: sortModeLabel(mode) });
    }
    this.component.registerDomEvent(select, "change", () => {
      this.deps.setSortMode(select.value);
    });
  }
  buildSummary() {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--summary" });
    this.countEl = group.createDiv({ cls: "tm-filter-count" });
    const clear = group.createEl("button", {
      cls: "tm-filter-clear",
      text: t("\u6E05\u9664\u7B5B\u9009"),
      attr: { type: "button", title: t("\u6E05\u9664\u5168\u90E8\u7B5B\u9009\u6761\u4EF6\uFF0C\u663E\u793A\u6240\u6709\u4EFB\u52A1") }
    });
    this.clearBtn = clear;
    this.component.registerDomEvent(clear, "click", () => this.deps.clearFilters());
  }
  // ────────────────────────────── 同步 ──────────────────────────────
  /** 状态变化后调用：只同步，绝不重建 DOM */
  update() {
    const state = this.deps.getState();
    this.syncStatusChips(state.statuses);
    this.syncMarkerChips(state.markers);
    if (this.presetSelect !== null) this.presetSelect.value = detectStatusPreset(state.statuses);
    if (this.sortSelect !== null) this.sortSelect.value = this.deps.getSortMode();
    this.syncDateGroup(this.dateControls.get("start"), state.startDate);
    this.syncDateGroup(this.dateControls.get("due"), state.dueDate);
    if (this.searchInput !== null && this.searchInput.value !== state.search) {
      this.searchInput.value = state.search;
    }
    const counts = this.deps.getCounts();
    if (this.countEl !== null) {
      this.countEl.setText(t("{shown}/{total} \u4E2A\u4EFB\u52A1", { shown: counts.shown, total: counts.total }));
      this.countEl.toggleClass("tm-filter-count--empty", counts.shown === 0);
    }
    this.clearBtn?.toggleClass("is-hidden", !hasActiveFilter(state));
  }
  syncStatusChips(active) {
    this.renderChips(
      this.chipsEl,
      TASK_STATUSES.map((status) => ({
        value: status,
        label: statusLabel(status),
        active: active.includes(status),
        title: ""
      })),
      (value) => this.deps.setStatuses(toggle(this.deps.getState().statuses, value))
    );
  }
  syncMarkerChips(active) {
    const markers = this.deps.getAvailableMarkers();
    this.markerGroupEl?.toggleClass("is-hidden", markers.length <= 1);
    this.renderChips(
      this.markerChipsEl,
      markers.map((marker) => ({
        value: marker,
        label: markerLabel(marker),
        active: active.includes(marker),
        title: t("\u65B9\u62EC\u53F7\u5185\u5BB9\u662F {marker} \u7684\u4EFB\u52A1", { marker: markerLabel(marker) })
      })),
      (value) => this.deps.setMarkers(toggle(this.deps.getState().markers, value))
    );
  }
  /** chips 不是输入框，重建不会丢光标或输入法状态，所以每次都整体重画 */
  renderChips(host, chips, onToggle) {
    if (host === null) return;
    host.empty();
    for (const chip of chips) {
      const button = host.createEl("button", {
        cls: `tm-chip${chip.active ? " is-active" : ""}`,
        text: chip.label,
        attr: { type: "button", "aria-pressed": String(chip.active), title: chip.title }
      });
      this.component.registerDomEvent(button, "click", () => onToggle(chip.value));
    }
  }
  /**
   * 回填预设与日期。
   *
   * 正在编辑的那个输入框跳过：不跳的话每次 update 都会覆盖用户刚敲了一半的日期。
   */
  syncDateGroup(controls, range) {
    if (controls === void 0) return;
    const today = todayIso();
    controls.select.value = range.preset;
    const effective = range.preset === "custom" ? { start: range.start, end: range.end } : resolveDateRange(range, today);
    const doc = this.host.ownerDocument;
    const pairs = [
      [controls.from, effective.start],
      [controls.to, effective.end]
    ];
    for (const [input, value] of pairs) {
      if (input === doc.activeElement) continue;
      const next = value ?? "";
      if (input.value !== next) input.value = next;
    }
  }
  scheduleSearch(raw) {
    this.clearSearchTimer();
    const win = this.host.ownerDocument.defaultView;
    if (win === null) return;
    this.searchTimer = win.setTimeout(() => {
      this.searchTimer = null;
      this.deps.setSearch(raw);
    }, SEARCH_DEBOUNCE_MS);
  }
  clearSearchTimer() {
    if (this.searchTimer === null) return;
    this.host.ownerDocument.defaultView?.clearTimeout(this.searchTimer);
    this.searchTimer = null;
  }
};

// src/panels/task-card.ts
var import_obsidian8 = require("obsidian");
var TASK_DRAG_MIME = "text/tm-task-id";
var QUADRANTS2 = ["Q1", "Q2", "Q3", "Q4"];
var GTD_QUICK_TARGETS = [
  { state: "Inbox", short: "\u6536", label: t("\u6536\u4EF6\u7BB1") },
  { state: "In Progress", short: "\u8FDB", label: t("\u8FDB\u884C\u4E2D") },
  { state: "Waiting", short: "\u7B49", label: t("\u7B49\u5F85\u4E2D") }
];
async function renderTaskCard(host, task, context, callbacks) {
  const card = host.createDiv({ cls: `tm-card${task.blocked ? " tm-card--blocked" : ""}` });
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData(TASK_DRAG_MIME, task.id);
    card.addClass("is-dragging");
  });
  card.addEventListener("dragend", () => card.removeClass("is-dragging"));
  card.addEventListener("click", (event) => {
    if (event.target.closest(".tm-card__actions")) return;
    callbacks.onOpen(task);
  });
  const head = card.createDiv({ cls: "tm-card__head" });
  const titleEl = head.createDiv({ cls: "tm-card__title" });
  const file = context.app.vault.getAbstractFileByPath(task.filePath);
  if (file instanceof import_obsidian8.TFile && task.description.length > 0) {
    await import_obsidian8.MarkdownRenderer.render(
      context.app,
      task.description,
      titleEl,
      task.filePath,
      context.markdownComponent
    );
  } else {
    titleEl.setText(task.description || t("\u65E0\u63CF\u8FF0"));
  }
  head.createDiv({
    cls: `tm-badge tm-badge--${task.displayStatus}`,
    text: statusLabel(task.displayStatus)
  });
  renderChips(card, task);
  card.createDiv({
    cls: "tm-card__meta",
    text: `${task.filePath}:${task.lineNumber} \xB7 ${gtdStateLabel(task.gtdState)}`
  });
  renderActions(card, task, context, callbacks);
  return card;
}
function renderChips(card, task) {
  const chips = card.createDiv({ cls: "tm-card__chips" });
  const push = (text, modifier = "") => {
    chips.createSpan({ cls: `tm-chip tm-chip--static${modifier}`, text });
  };
  if (task.priority !== "none" /* None */) {
    push(t("\u4F18\u5148\u7EA7 {level}", { level: priorityLabel(task.priority) }));
  }
  if (task.dueDate) push(t("\u622A\u6B62 {date}", { date: task.dueDate }));
  if (task.startDate) push(t("\u5F00\u59CB {date}", { date: task.startDate }));
  if (task.taskId) push(t("ID {id}", { id: task.taskId }));
  if (task.dependsOn) {
    push(
      task.blocked ? t("\u88AB {id} \u963B\u585E", { id: task.dependsOn }) : t("\u4F9D\u8D56 {id} \u5DF2\u5B8C\u6210", { id: task.dependsOn }),
      task.blocked ? " tm-chip--warning" : ""
    );
  }
  if (task.lineText.toLowerCase().includes("#due-date-conflict")) {
    push(t("\u65E5\u671F\u51B2\u7A81"), " tm-chip--conflict");
  }
}
function renderActions(card, task, context, callbacks) {
  const actions = card.createDiv({ cls: "tm-card__actions" });
  if (task.displayStatus === "completed") {
    addAction(actions, "\u21BA", t("\u91CD\u65B0\u6253\u5F00"), () => callbacks.onToggle(task));
  } else {
    addAction(actions, "\u2713", t("\u5B8C\u6210"), () => callbacks.onToggle(task));
    if (!task.startDate || task.displayStatus === "to-be-started") {
      addAction(actions, "\u25B6", t("\u5F00\u59CB"), () => callbacks.onStart(task));
    }
    addAction(actions, "\u2715", t("\u53D6\u6D88"), () => callbacks.onCancel(task));
  }
  addAction(actions, "\u270E", t("\u7F16\u8F91"), () => callbacks.onEdit(task));
  addAction(actions, "\u{1F5D1}", t("\u5220\u9664"), () => callbacks.onDelete(task));
  const quick = quickMovesFor(task, context.mode, callbacks);
  if (quick.length === 0) return;
  actions.createSpan({ cls: "tm-card__actions-sep", text: "|" });
  actions.createSpan({ cls: "tm-card__actions-label", text: t("\u79FB\u52A8\u5230") });
  for (const move of quick) {
    addAction(actions, move.text, move.title, move.run);
  }
}
function quickMovesFor(task, mode, callbacks) {
  if (mode === "eisenhower") {
    return QUADRANTS2.filter((quadrant) => quadrant !== task.quadrant).map((quadrant) => ({
      text: quadrant.slice(1),
      title: t("\u79FB\u52A8\u5230 {quadrant}", { quadrant }),
      run: () => callbacks.onMoveQuadrant(task, quadrant)
    }));
  }
  if (mode === "gtd") {
    const current2 = gtdColumnOf(task, todayIso());
    return GTD_QUICK_TARGETS.filter((target) => target.state !== current2).map((target) => ({
      text: target.short,
      title: t("\u79FB\u52A8\u5230\u300C{state}\u300D", { state: target.label }),
      run: () => callbacks.onMoveGtd(task, target.state)
    }));
  }
  return [];
}
function addAction(host, text, title, onClick) {
  const button = host.createEl("button", {
    cls: "tm-card__action tm-btn",
    text,
    // 按钮上的字是 `✎` 这类符号，读屏拿不到含义，所以 title 同时当无障碍名用
    attr: { type: "button", title, "aria-label": title }
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
}

// src/panels/panel-board.ts
var PanelBoard = class {
  constructor(host, app, callbacks) {
    this.host = host;
    this.app = app;
    this.callbacks = callbacks;
    /**
     * 渲染代次。
     *
     * 卡片里的 Markdown 是逐个 await 渲染的，所以一次渲染会跨越多个宏任务；
     * 这期间如果又来一次渲染（连点筛选、文件连续变动），两次渲染会往同一个宿主里
     * 交错插入卡片，出现重复与错位。代次号让旧的那次在每次 await 之后自行退出。
     */
    this.renderGeneration = 0;
    this.host.addClass("tm-board");
  }
  async render(panels, options) {
    const generation = ++this.renderGeneration;
    this.host.empty();
    if (!options.loaded) {
      const loading = this.host.createDiv({ cls: "tm-empty" });
      loading.createEl("h3", { text: t("\u6B63\u5728\u5EFA\u7ACB\u4EFB\u52A1\u7D22\u5F15\u2026") });
      loading.createEl("p", { text: t("\u7D22\u5F15\u5728 Obsidian \u5E03\u5C40\u5C31\u7EEA\u540E\u5F00\u59CB\uFF0C\u5927\u5E93\u9700\u8981\u4E00\u70B9\u65F6\u95F4\u3002") });
      return;
    }
    if (panels.length === 0) {
      this.host.createDiv({ cls: "tm-empty", text: t("\u6CA1\u6709\u7B26\u5408\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u7684\u4EFB\u52A1") });
      return;
    }
    const grid = this.host.createDiv({
      cls: `tm-board__grid tm-board__grid--${options.grid}`
    });
    for (const panel of panels) {
      if (generation !== this.renderGeneration) return;
      await this.renderPanel(grid, panel, options, generation);
    }
  }
  async renderPanel(grid, panel, options, generation) {
    const collapsed = options.collapsedKeys.has(panel.key);
    const el = grid.createDiv({ cls: `tm-panel${collapsed ? " is-collapsed" : ""}` });
    el.dataset.panelKey = panel.key;
    if (panel.dropTarget !== void 0) {
      this.registerDropTarget(el, panel.dropTarget);
    }
    const head = el.createDiv({ cls: "tm-panel__head" });
    head.createSpan({ cls: "tm-panel__chevron", text: collapsed ? "\u25B8" : "\u25BE" });
    const titleWrap = head.createDiv({ cls: "tm-panel__titles" });
    titleWrap.createEl("h3", { cls: "tm-panel__title", text: panel.title });
    if (panel.subtitle) {
      titleWrap.createDiv({ cls: "tm-panel__subtitle", text: panel.subtitle });
    }
    const right = head.createDiv({ cls: "tm-panel__head-right" });
    if (panel.addDefaults !== void 0) {
      this.addPanelButton(right, "+", t("\u5728\u6B64\u5BB9\u5668\u65B0\u5EFA\u4EFB\u52A1"), () => this.callbacks.onAddTask(panel));
    }
    right.createSpan({ cls: "tm-panel__count", text: String(panel.tasks.length) });
    head.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      this.callbacks.onToggleCollapse(panel.key);
    });
    const body = el.createDiv({ cls: "tm-panel__body" });
    if (panel.tasks.length === 0) {
      body.createDiv({ cls: "tm-panel__empty", text: t("\u6682\u65E0\u4EFB\u52A1") });
      return;
    }
    for (const task of panel.tasks) {
      if (generation !== this.renderGeneration) return;
      await renderTaskCard(body, task, {
        app: this.app,
        markdownComponent: options.markdownComponent,
        mode: panel.dropTarget?.kind === "quadrant" ? "eisenhower" : panel.dropTarget?.kind === "gtd" ? "gtd" : "list"
      }, this.callbacks);
    }
  }
  /** 拖放落点：只有带 dropTarget 的容器接受投放（列表容器不接受） */
  registerDropTarget(el, target) {
    el.addClass("tm-panel--drop-target");
    el.addEventListener("dragover", (event) => {
      event.preventDefault();
      el.addClass("is-drop-over");
    });
    el.addEventListener("dragleave", (event) => {
      if (el.contains(event.relatedTarget)) return;
      el.removeClass("is-drop-over");
    });
    el.addEventListener("drop", (event) => {
      event.preventDefault();
      el.removeClass("is-drop-over");
      const taskId = event.dataTransfer?.getData(TASK_DRAG_MIME) ?? "";
      if (taskId.length === 0) return;
      this.callbacks.onDropTask(taskId, target);
    });
  }
  addPanelButton(host, text, title, onClick) {
    const button = host.createEl("button", {
      cls: "tm-panel__add tm-btn",
      text,
      attr: { type: "button", title }
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });
  }
};

// src/views/matrix-view.ts
var VIEW_TYPE_TASK_MATRIX = "task-matrix-view";
var MODES = ["list", "gtd", "eisenhower", "calendar"];
var FALLBACK_PANEL_MODE = "eisenhower";
function modeLabel(mode) {
  switch (mode) {
    case "gtd":
      return "GTD";
    case "eisenhower":
      return t("\u77E9\u9635");
    case "calendar":
      return t("\u65E5\u5386");
    default:
      return t("\u5217\u8868");
  }
}
var MatrixView = class extends import_obsidian9.ItemView {
  constructor(leaf, host) {
    super(leaf);
    this.host = host;
    this.sortMode = "due-asc";
    this.filterState = null;
    this.calendarMode = "month";
    this.calendarAnchor = /* @__PURE__ */ new Date();
    this.calendarSummaryOpen = false;
    /**
     * 折叠的容器/分节 key：一份状态喂给所有渲染路径。
     *
     * 面板视图与甘特共用同一批 key（`folder:` / `gtd:` / `q:`），所以「在甘特里
     * 收起文件夹分组」与「在列表里收起同一个文件夹」是同一个状态，切视图不会变样。
     */
    this.collapsedKeys = /* @__PURE__ */ new Set();
    // 甘特自己的视图状态（粒度 / 分组 / 缩放锚点）
    this.ganttZoom = "day";
    this.ganttGrouping = "none";
    this.ganttNeedsScrollToToday = true;
    this.filterBar = null;
    this.board = null;
    this.calendar = null;
    this.gantt = null;
    this.boardHost = null;
    this.calendarHost = null;
    this.ganttHost = null;
    this.modeButtons = /* @__PURE__ */ new Map();
    /** 根容器：甘特模式下挂 `tm-root--gantt`，工具栏的显隐全由这一个类切换 */
    this.rootEl = null;
    this.ganttToggleBtn = null;
    this.ganttZoomSelect = null;
    this.ganttGroupingSelect = null;
    this.collapseBtn = null;
    /**
     * 当前模式真实渲染出来的可折叠单元（容器 key / 甘特分节 key）。
     * 展开/收起按钮据此判断自己在哪个状态；为空表示这个模式没有可折叠的东西。
     */
    this.lastCollapsibleKeys = [];
    this.markdownComponent = null;
    const defaultView = host.settings.defaultView;
    this.activeTab = defaultView === "gantt" ? "gantt" : "panel";
    this.mode = defaultView === "gantt" ? FALLBACK_PANEL_MODE : defaultView;
  }
  getViewType() {
    return VIEW_TYPE_TASK_MATRIX;
  }
  getDisplayText() {
    return t("\u4EFB\u52A1\u77E9\u9635");
  }
  getIcon() {
    return pickViewIcon((0, import_obsidian9.getIconIds)());
  }
  // ────────────────────────────── 生命周期 ──────────────────────────────
  /**
   * 布局只搭一次：工具栏与筛选栏建好后不再重建，状态变化走 `update()`/类名同步。
   *
   * 用 `Promise.resolve()` 而不是 `async`：这里确实没有需要等待的东西，
   * 加个 `async` 只会让读的人以为有异步步骤。
   */
  onOpen() {
    const root = this.contentEl.createDiv({ cls: "tm-root" });
    this.rootEl = root;
    this.buildToolbar(root);
    this.buildFilterBar(root);
    this.buildBody(root);
    this.syncToolbar();
    this.render();
    return Promise.resolve();
  }
  onClose() {
    this.releaseMarkdownComponent();
    this.calendar?.destroy();
    this.gantt?.destroy();
    this.filterBar = null;
    this.board = null;
    this.calendar = null;
    this.gantt = null;
    this.boardHost = null;
    this.calendarHost = null;
    this.ganttHost = null;
    this.rootEl = null;
    this.ganttToggleBtn = null;
    this.ganttZoomSelect = null;
    this.ganttGroupingSelect = null;
    this.modeButtons.clear();
    this.contentEl.empty();
    return Promise.resolve();
  }
  // ────────────────────────────── 布局 ──────────────────────────────
  buildToolbar(root) {
    const bar = root.createDiv({ cls: "tm-toolbar" });
    bar.createEl("h2", { cls: "tm-toolbar__title", text: t("\u4EFB\u52A1\u77E9\u9635") });
    const actions = bar.createDiv({ cls: "tm-toolbar__actions" });
    this.addButton(actions, t("\u65B0\u5EFA\u4EFB\u52A1"), () => this.openEditor(null, {}));
    this.addButton(actions, t("\u5237\u65B0"), () => this.host.requestRescan());
    const modes = actions.createDiv({
      cls: "tm-toolbar__modes tm-toolbar__panel-only",
      attr: { role: "group" }
    });
    for (const mode of MODES) {
      const button = modes.createEl("button", {
        cls: "tm-mode-btn",
        text: modeLabel(mode),
        attr: { type: "button" }
      });
      this.modeButtons.set(mode, button);
      this.registerDomEvent(button, "click", () => {
        if (this.activeTab === "panel" && this.mode === mode) return;
        this.switchToPanel(mode);
      });
    }
    const zoomField = actions.createDiv({ cls: "tm-toolbar__field tm-toolbar__gantt-only" });
    zoomField.createEl("label", { cls: "tm-toolbar__label", text: t("\u65F6\u95F4\u7C92\u5EA6") });
    const zoom = zoomField.createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": t("\u65F6\u95F4\u7C92\u5EA6") }
    });
    this.ganttZoomSelect = zoom;
    for (const mode of [...ZOOM_LADDER].reverse()) {
      zoom.createEl("option", { value: mode, text: ganttZoomLabel(mode) });
    }
    this.registerDomEvent(zoom, "change", () => {
      this.ganttAnchor = void 0;
      this.ganttZoom = zoom.value;
      this.render();
    });
    const groupingField = actions.createDiv({ cls: "tm-toolbar__field tm-toolbar__gantt-only" });
    groupingField.createEl("label", { cls: "tm-toolbar__label", text: t("\u5206\u7EC4\u4F9D\u636E") });
    const grouping = groupingField.createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": t("\u5206\u7EC4\u4F9D\u636E") }
    });
    this.ganttGroupingSelect = grouping;
    for (const mode of GANTT_GROUPINGS) {
      grouping.createEl("option", { value: mode, text: ganttGroupingLabel(mode) });
    }
    this.registerDomEvent(grouping, "change", () => {
      this.ganttGrouping = grouping.value;
      this.render();
    });
    this.ganttToggleBtn = this.addButton(
      actions,
      t("\u7518\u7279\u56FE\u6A21\u5F0F"),
      () => this.switchTab(this.activeTab === "gantt" ? "panel" : "gantt"),
      "tm-btn--toggle"
    );
    this.collapseBtn = this.addButton(actions, t("\u5168\u90E8\u6536\u8D77"), () => this.toggleAllCollapsed());
  }
  buildFilterBar(root) {
    const hostEl = root.createDiv({ cls: "tm-filter-host" });
    this.filterBar = new FilterBar(this, hostEl, {
      getState: () => this.filterStateValue(),
      getSortMode: () => this.sortMode,
      getCounts: () => this.counts(),
      getAvailableMarkers: () => collectMarkers(this.host.getTasks(), this.host.settings),
      setStatuses: (statuses) => this.patchFilter({ statuses }),
      setMarkers: (markers) => this.patchFilter({ markers }),
      setSearch: (search) => this.patchFilter({ search }),
      setStartDate: (startDate) => this.patchFilter({ startDate }),
      setDueDate: (dueDate) => this.patchFilter({ dueDate }),
      setSortMode: (mode) => {
        this.sortMode = mode;
        this.render();
      },
      clearFilters: () => {
        this.filterState = defaultFilterState();
        this.render();
      }
    });
  }
  buildBody(root) {
    const body = root.createDiv({ cls: "tm-body" });
    this.boardHost = body.createDiv({ cls: "tm-board-host" });
    this.board = new PanelBoard(this.boardHost, this.host.app, {
      onOpen: (task) => void this.host.openTaskFile(task),
      onToggle: (task) => void this.runAction(() => toggleTaskStatus(this.host.app, this.host.settings, task)),
      onStart: (task) => void this.runAction(() => startTask(this.host.app, task)),
      onCancel: (task) => void this.runAction(() => cancelTask(this.host.app, this.host.settings, task)),
      onEdit: (task) => this.openEditor(task, {}),
      onDelete: (task) => void this.confirmDelete(task),
      onMoveGtd: (task, state) => void this.runAction(
        () => moveTaskToGtdState(this.host.app, this.host.settings, task, state, (start, due) => askDateConflict(this.host.app, start, due))
      ),
      onMoveQuadrant: (task, quadrant) => void this.runAction(() => moveTaskToQuadrant(this.host.app, task, quadrant)),
      onToggleCollapse: (key) => this.toggleCollapse(key),
      onAddTask: (panel) => this.openEditor(null, panel.addDefaults ?? {}),
      onDropTask: (taskId, target) => void this.handleDrop(taskId, target)
    });
    this.calendarHost = body.createDiv({ cls: "tm-board-host is-hidden" });
    this.calendar = new CalendarBoard(this.calendarHost, {
      onOpenTask: (task) => void this.host.openTaskFile(task),
      onShift: (delta) => this.shiftCalendar(delta),
      onToday: () => {
        this.calendarAnchor = /* @__PURE__ */ new Date();
        this.render();
      },
      onModeChange: (mode) => {
        this.calendarMode = mode;
        this.render();
      },
      onToggleSummary: () => {
        this.calendarSummaryOpen = !this.calendarSummaryOpen;
        this.render();
      }
    });
    this.ganttHost = body.createDiv({ cls: "tm-board-host is-hidden" });
    this.gantt = new GanttBoard(this.ganttHost, this, {
      onOpenTask: (task) => void this.host.openNote(task.filePath),
      onToggleSection: (key) => this.toggleCollapse(key),
      onZoomStep: (direction, anchor) => this.stepGanttZoom(direction, anchor)
    });
  }
  /** 选面板模式：顺带把主区切回面板那一侧（点「列表」时不该还停在甘特上） */
  switchToPanel(mode) {
    this.mode = mode;
    this.activeTab = "panel";
    this.syncToolbar();
    this.render();
  }
  /**
   * 切到甘特。
   *
   * 进甘特时把视野落到今天（甘特的常态就是盯着最近这几周）；`display:none`
   * 会把滚动容器归零，所以每次进入都重新定位一次，不必保存上次的位置。
   */
  switchTab(tab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === "gantt") {
      this.ganttAnchor = void 0;
      this.ganttNeedsScrollToToday = true;
    }
    this.syncToolbar();
    this.render();
  }
  /** Ctrl+滚轮：在粒度阶梯上走一档，并记住锚点把那天钉回原位 */
  stepGanttZoom(direction, anchor) {
    const index = ZOOM_LADDER.indexOf(this.ganttZoom);
    const next = index + direction;
    if (next < 0 || next >= ZOOM_LADDER.length) return;
    this.ganttZoom = ZOOM_LADDER[next] ?? this.ganttZoom;
    this.ganttAnchor = anchor ?? void 0;
    this.render();
  }
  addButton(host, label, onClick, cls = "") {
    const button = host.createEl("button", {
      cls: cls.length > 0 ? `tm-btn ${cls}` : "tm-btn",
      text: label,
      attr: { type: "button" }
    });
    this.registerDomEvent(button, "click", onClick);
    return button;
  }
  // ────────────────────────────── 渲染管道 ──────────────────────────────
  /**
   * 唯一的数据入口：索引 → 显示口径 → 筛选 → 排序 → 分组 → 画。
   *
   * 顺序有讲究：「显示口径」（设置里的截止日范围、远期开始）先于用户筛选生效，
   * 这样筛选栏里的计数与用户看到的容器内容永远一致。
   */
  render() {
    const all = this.host.getTasks();
    const today = todayIso();
    const settings = this.host.settings;
    const filtered = applyFilters(all, this.filterStateValue(), today);
    const visible = applyVisibilityRanges(filtered, settings, today);
    const ordered = sortTasks(visible, this.sortMode);
    this.releaseMarkdownComponent();
    const markdownComponent = this.getMarkdownComponent();
    const ganttActive = this.activeTab === "gantt";
    const calendarActive = !ganttActive && this.mode === "calendar";
    this.boardHost?.toggleClass("is-hidden", ganttActive || calendarActive);
    this.calendarHost?.toggleClass("is-hidden", !calendarActive);
    this.ganttHost?.toggleClass("is-hidden", !ganttActive);
    if (ganttActive) {
      this.renderGantt(filtered, today, settings);
    } else if (calendarActive) {
      this.renderCalendar(filtered);
    } else {
      const grouping = buildPanels(ordered, this.mode, settings);
      this.lastCollapsibleKeys = grouping.panels.map((panel) => panel.key);
      void this.board?.render(grouping.panels, {
        grid: grouping.grid,
        collapsedKeys: this.collapsedKeys,
        markdownComponent,
        loaded: this.host.isIndexReady()
      });
    }
    this.filterBar?.update();
    this.syncToolbar();
  }
  /**
   * 日历吃「用户筛过的」数据，但不吃「截止日显示范围」：日历自己是按区间看的，
   * 再套一层范围裁剪会出现「切到日历发现远期任务没了」这种莫名其妙的缺口。
   */
  renderCalendar(filtered) {
    const settings = this.host.settings;
    this.lastCollapsibleKeys = [];
    this.calendar?.render({
      mode: this.calendarMode,
      anchor: this.calendarAnchor,
      summaryOpen: this.calendarSummaryOpen,
      settings,
      itemsByDate: collectCalendarItems(filtered, {
        showInProcessTasks: settings.showCalendarInProcessTasks
      }),
      summary: buildCalendarSummary(filtered, this.calendarMode, this.calendarAnchor, settings),
      today: todayIso()
    });
  }
  /**
   * 甘特同样按「用户筛过的」数据画，不吃长期显示口径 —— 那两条是为了让面板
   * 不至于一次铺出上千张卡片，而甘特本来就是按时段看的，再裁一刀会出现
   * 「任务在列表里有、在甘特上找不到」这种对不上账的缺口。
   */
  renderGantt(filtered, today, settings) {
    const allParsed = this.host.getTasks();
    const allKeys = new Set(allParsed.map((task) => `${task.filePath}:${task.lineNumber}`));
    const visibleKeys = new Set(filtered.map((task) => `${task.filePath}:${task.lineNumber}`));
    const ganttTasks = this.host.getGanttTasks().filter((task) => {
      const key = `${task.filePath}:${task.lineNumber}`;
      return visibleKeys.has(key) || !allKeys.has(key);
    });
    const model = buildGanttModel(ganttTasks, {
      grouping: this.ganttGrouping,
      collapsedKeys: this.collapsedKeys,
      today,
      axisRange: this.ganttAxisRange(today),
      settings,
      parsedByLine: new Map(allParsed.map((task) => [`${task.filePath}:${task.lineNumber}`, task]))
    });
    this.lastCollapsibleKeys = this.ganttGrouping === "none" ? [] : model.sections.map((section) => section.key);
    const scrolledToToday = this.gantt?.render({
      zoom: this.ganttZoom,
      grouping: this.ganttGrouping,
      model,
      today,
      anchor: this.ganttAnchor,
      colors: settings.ganttBarColors,
      scrollToToday: this.ganttNeedsScrollToToday
    });
    this.ganttAnchor = void 0;
    if (scrolledToToday === true) this.ganttNeedsScrollToToday = false;
  }
  /** 筛选栏的起止日期一起撑开时间轴（gantt-model 那边是「只扩不缩」的并集） */
  ganttAxisRange(today) {
    const state = this.filterStateValue();
    const startRange = resolveDateRange(state.startDate, today);
    const dueRange = resolveDateRange(state.dueDate, today);
    const from = minIso(startRange.start, dueRange.start);
    const to = maxIso(startRange.end, dueRange.end);
    if (from === null && to === null) return void 0;
    return { start: from ?? today, end: to ?? today };
  }
  syncToolbar() {
    const ganttActive = this.activeTab === "gantt";
    this.rootEl?.toggleClass("tm-root--gantt", ganttActive);
    for (const [mode, button] of this.modeButtons) {
      button.toggleClass("is-active", mode === this.mode);
      button.setAttribute("aria-pressed", String(mode === this.mode));
    }
    if (this.ganttToggleBtn !== null) {
      this.ganttToggleBtn.setText(ganttActive ? t("\u9000\u51FA\u7518\u7279\u56FE\u6A21\u5F0F") : t("\u7518\u7279\u56FE\u6A21\u5F0F"));
      this.ganttToggleBtn.toggleClass("is-on", ganttActive);
    }
    if (this.ganttZoomSelect !== null) this.ganttZoomSelect.value = this.ganttZoom;
    if (this.ganttGroupingSelect !== null) this.ganttGroupingSelect.value = this.ganttGrouping;
    const hasCollapsibles = this.lastCollapsibleKeys.length > 0;
    if (this.collapseBtn !== null) {
      this.collapseBtn.toggleClass("is-hidden", !hasCollapsibles);
      this.collapseBtn.setText(this.isAllExpanded() ? t("\u5168\u90E8\u6536\u8D77") : t("\u5168\u90E8\u5C55\u5F00"));
    }
  }
  /** 只要还有一个单元是收起的，就不算全展开 */
  isAllExpanded() {
    return this.lastCollapsibleKeys.every((key) => !this.collapsedKeys.has(key));
  }
  filterStateValue() {
    this.filterState ?? (this.filterState = initialFilterState());
    return this.filterState;
  }
  patchFilter(patch) {
    this.filterState = { ...this.filterStateValue(), ...patch };
    this.render();
  }
  counts() {
    const all = this.host.getTasks();
    const today = todayIso();
    const visible = applyVisibilityRanges(
      applyFilters(all, this.filterStateValue(), today),
      this.host.settings,
      today
    );
    return { shown: visible.length, total: all.length };
  }
  /** 一个按钮走完两个方向：全展开时它收起，否则它展开 */
  toggleAllCollapsed() {
    if (this.isAllExpanded()) {
      for (const key of this.lastCollapsibleKeys) this.collapsedKeys.add(key);
    } else {
      this.collapsedKeys.clear();
    }
    this.render();
  }
  toggleCollapse(key) {
    if (this.collapsedKeys.has(key)) this.collapsedKeys.delete(key);
    else this.collapsedKeys.add(key);
    this.render();
  }
  shiftCalendar(delta) {
    const next = new Date(this.calendarAnchor);
    if (this.calendarMode === "week") next.setDate(next.getDate() + delta * 7);
    else next.setMonth(next.getMonth() + delta);
    this.calendarAnchor = next;
    this.render();
  }
  // ────────────────────────────── 动作 ──────────────────────────────
  /** 写操作统一收口：写完让插件重新索引，而不是本地猜结果 */
  async runAction(action) {
    await action();
    this.host.requestRescan();
  }
  openEditor(task, defaults) {
    const editorHost = {
      app: this.host.app,
      settings: this.host.settings,
      tasks: this.host.getTasks(),
      onSaved: () => this.host.requestRescan()
    };
    new TaskEditorModal(editorHost, task, defaults).open();
  }
  async confirmDelete(task) {
    const confirmed = await askDeleteTask(this.host.app, task.description);
    if (!confirmed) return;
    await this.runAction(() => deleteTask(this.host.app, task));
  }
  async handleDrop(taskId, target) {
    const task = this.host.getTasks().find((candidate) => candidate.id === taskId);
    if (task === void 0) return;
    if (target.kind === "gtd") {
      await this.runAction(
        () => moveTaskToGtdState(this.host.app, this.host.settings, task, target.state, (start, due) => askDateConflict(this.host.app, start, due))
      );
      return;
    }
    await this.runAction(() => moveTaskToQuadrant(this.host.app, task, target.quadrant));
  }
  // ────────────────────────────── 内联 Markdown ──────────────────────────────
  /**
   * 卡片内联 Markdown 的宿主组件。
   *
   * 每次重绘前卸载旧的：渲染器注册的监听器与子组件都挂在这个 Component 上，
   * 不卸载就会随刷新次数线性增长。
   */
  getMarkdownComponent() {
    if (this.markdownComponent === null) {
      this.markdownComponent = new import_obsidian9.Component();
      this.markdownComponent.load();
    }
    return this.markdownComponent;
  }
  releaseMarkdownComponent() {
    this.markdownComponent?.unload();
    this.markdownComponent = null;
  }
};

// src/main.ts
var REFRESH_DEBOUNCE_MS = 500;
var TaskMatrixPlugin = class extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.tasks = [];
    /** 甘特视图的任务投影，与 tasks 同一次文件读取产出 */
    this.ganttTasks = [];
    this.indexReady = false;
    /** 索引代次：又发起了新扫描时，旧的那次结果直接丢弃 */
    this.refreshGeneration = 0;
    this.refreshTimer = null;
    /** null 表示「还没画过」，保证第一轮一定渲染 */
    this.lastSignature = null;
    this.shuttingDown = false;
  }
  async onload() {
    await this.loadSettings();
    this.applyUiLanguage();
    this.registerView(
      VIEW_TYPE_TASK_MATRIX,
      (leaf) => new MatrixView(leaf, this)
    );
    const icon = pickViewIcon((0, import_obsidian10.getIconIds)());
    this.addRibbonIcon(icon, t("\u6253\u5F00\u4EFB\u52A1\u77E9\u9635"), () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-view",
      name: t("\u6253\u5F00\u4EFB\u52A1\u77E9\u9635"),
      callback: () => {
        void this.activateView();
      }
    });
    this.addCommand({
      id: "refresh-view",
      name: t("\u91CD\u65B0\u626B\u63CF\u4EFB\u52A1"),
      callback: () => {
        void this.refreshTasks(true);
      }
    });
    this.addSettingTab(new TaskMatrixSettingTab(this.app, this, this));
    this.registerEvent(this.app.vault.on("create", (file) => this.handleVaultChange(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleVaultChange(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleVaultChange(file)));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.handleVaultRename(file, oldPath))
    );
    this.app.workspace.onLayoutReady(() => {
      void this.refreshTasks();
    });
    this.register(() => this.clearRefreshTimer());
  }
  onunload() {
    this.shuttingDown = true;
    this.clearRefreshTimer();
    this.tasks = [];
  }
  // ────────────────────────────── 设置 ──────────────────────────────
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved ?? {} };
    this.settings.ganttBarColors = {
      ...DEFAULT_GANTT_BAR_COLORS,
      ...saved?.ganttBarColors ?? {}
    };
  }
  /** 界面语言落到运行时；语言变了要重绘已打开的视图 */
  applyUiLanguage() {
    return applyLanguageSetting(this.settings.uiLanguage, detectLocale(import_obsidian10.moment.locale()));
  }
  /**
   * 落盘设置。
   *
   * `rescan` 决定要不要重建索引：扫描目录、标记、紧急天数这类改动会改变解析结果，
   * 必须重扫；而排序、分组层级这类只影响绘制，重扫一次纯属白读全库。
   */
  async persistSettings(rescan) {
    await this.saveData(this.settings);
    if (rescan) await this.refreshTasks();
    else this.redrawViews();
  }
  refreshViews() {
    this.redrawViews();
  }
  // ────────────────────────────── TaskMatrixHost ──────────────────────────────
  getTasks() {
    return this.tasks;
  }
  getGanttTasks() {
    return this.ganttTasks;
  }
  isIndexReady() {
    return this.indexReady;
  }
  requestRescan() {
    void this.refreshTasks();
  }
  requestRedraw() {
    this.redrawViews();
  }
  async openTaskFile(task) {
    await this.openNote(task.filePath);
  }
  /** 按路径打开笔记（甘特手里只有任务，没有 ParsedTask） */
  async openNote(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian10.TFile)) {
      new import_obsidian10.Notice(t("\u627E\u4E0D\u5230\u6587\u4EF6\uFF1A{path}", { path }));
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
  }
  // ────────────────────────────── 索引编排 ──────────────────────────────
  /**
   * 全量重扫。
   *
   * 代次号 + 卸载标志共同保证：过期的扫描结果绝不会写进状态，
   * 也不会把关闭后的视图再画一次。
   */
  async refreshTasks(showNotice = false) {
    const generation = ++this.refreshGeneration;
    const index = await collectIndex(this.app, this.settings);
    if (this.shuttingDown || generation !== this.refreshGeneration) return;
    this.tasks = index.tasks;
    this.ganttTasks = index.ganttTasks;
    this.indexReady = true;
    const signature = `${taskSignature(index.tasks)}
--
${ganttSignature(index.ganttTasks)}`;
    if (signature !== this.lastSignature) {
      this.lastSignature = signature;
      this.redrawViews();
    }
    if (showNotice) new import_obsidian10.Notice(t("\u5DF2\u5237\u65B0\uFF1A{count} \u4E2A\u4EFB\u52A1", { count: index.tasks.length }));
  }
  /** 设置变更后视图侧的筛选口径也会变，所以要强制重绘一次 */
  redrawViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof MatrixView) view.render();
    }
  }
  handleVaultChange(file) {
    if (shouldRescanForVaultChange(file, this.settings)) this.scheduleRefresh();
  }
  handleVaultRename(file, oldPath) {
    if (shouldRescanForRename(file, oldPath, this.settings)) this.scheduleRefresh();
  }
  scheduleRefresh() {
    if (this.shuttingDown) return;
    this.clearRefreshTimer();
    const win = this.app.workspace.containerEl.ownerDocument.defaultView;
    if (win === null) {
      this.requestRescan();
      return;
    }
    this.refreshTimer = win.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshTasks();
    }, REFRESH_DEBOUNCE_MS);
  }
  clearRefreshTimer() {
    if (this.refreshTimer === null) return;
    this.app.workspace.containerEl.ownerDocument.defaultView?.clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }
  async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX);
    const leaf = existing.length > 0 ? existing[0] : this.settings.openLocation === "sidebar" ? workspace.getRightLeaf(false) : workspace.getLeaf(true);
    if (leaf === null) return;
    await leaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX, active: true });
    await workspace.revealLeaf(leaf);
  }
};
