import { App, normalizePath } from "obsidian";
import { t } from "../i18n";
import {
  exportImageName,
  MermaidImageExport,
  readAttachmentSetting,
  resolveAttachmentFolder,
} from "../utils/svg-image";

/**
 * Mermaid 图片导出的落盘（与 Project Master 同口径）。
 *
 * 落点是 Obsidian **自己的附件目录配置**，不是插件的设置项：那是用户已经配过的地方，
 * 插件没理由再要一个自己的目录参数。文件名带时间戳，同名自动加序号 ——
 * 导出的常态是连着导好几版，覆盖掉上一版比多一个文件更糟。
 *
 * @returns 落盘的 vault 路径，供提示与复制用
 */
export async function writeMermaidImage(app: App, payload: MermaidImageExport): Promise<string> {
  const folder = resolveAttachmentFolder(
    readAttachmentSetting(app),
    app.workspace.getActiveFile()?.parent?.path ?? null,
  );
  const name = exportImageName(t("甘特图"), payload.format, new Date());

  // 附件目录可能还没建过（配置里写的是一个新路径）
  if (folder.length > 0 && app.vault.getAbstractFileByPath(folder) === null) {
    await app.vault.createFolder(folder);
  }

  const path = uniqueExportPath(app, folder, name);
  if (typeof payload.data === "string") {
    await app.vault.create(path, payload.data);
  } else {
    await app.vault.createBinary(path, payload.data);
  }
  return path;
}

/** 同名文件已存在就换 `-2`、`-3`……（不覆盖用户已有的导出） */
function uniqueExportPath(app: App, folder: string, name: string): string {
  const join = (fileName: string): string =>
    normalizePath(folder.length === 0 ? fileName : `${folder}/${fileName}`);
  const dot = name.lastIndexOf(".");
  const base = dot === -1 ? name : name.slice(0, dot);
  const ext = dot === -1 ? "" : name.slice(dot);
  for (let index = 1; index < 1000; index += 1) {
    const candidate = join(index === 1 ? name : `${base}-${index}${ext}`);
    if (app.vault.getAbstractFileByPath(candidate) === null) return candidate;
  }
  return join(name);
}
