/**
 * 逗号分隔清单的解析（状态标签、任务标记都用它）。
 *
 * 半角/全角逗号、分号、换行都认：中文输入法下打出来的是「，」，只认半角的话
 * 整串会变成一个条目 —— 用户看到的现象是「明明填了却没生效」。
 *
 * **不做路径归一化**：标记清单里可能出现 `/` 这种单字符（有些写法用它表示取消），
 * 顺手去斜杠会把它清掉。路径请用 `parsePathList`。
 */
export function parseCommaList(value: string): string[] {
  return value
    .split(/[,;，；\n\r]+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * 路径清单（扫描目录、排除目录）。
 *
 * 在 `parseCommaList` 之上把反斜杠归一成 `/`、去掉首尾斜杠：粘贴来的 Windows 路径
 * 与「/文件夹/」这类写法都能直接用。归一化后为空的条目丢掉。
 */
export function parsePathList(value: string): string[] {
  return parseCommaList(value)
    .map((entry) => entry.replace(/\\/gu, "/").replace(/^\/+|\/+$/gu, ""))
    .filter((entry) => entry.length > 0);
}
