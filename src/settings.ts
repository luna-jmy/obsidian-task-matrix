import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { t, UiLanguage } from "./i18n";
import { sortModeLabel } from "./services/filter-service";
import {
  DEFAULT_GANTT_BAR_COLORS,
  DEFAULT_SETTINGS,
  DefaultView,
  GanttBarColors,
  TaskMatrixSettings,
} from "./types";

/**
 * 设置页需要的最小插件接口。
 *
 * 只声明用得到的三个能力，而不是 import 插件类 —— 这样 settings → main
 * 不产生循环依赖，设置页也不会顺手摸到索引、视图这些它不该碰的东西。
 */
export interface SettingsHost {
  app: App;
  settings: TaskMatrixSettings;
  /** 落盘；`rescan` 为真时顺带重建索引（扫描范围、标记这类改动必须重建） */
  persistSettings(rescan: boolean): Promise<void>;
  /** 语言变化后重渲染已打开的视图 */
  refreshViews(): void;
}

/**
 * 设置页的一页。
 *
 * `label` 同时充当 tab 上的标题，`lead` 是页首那句「这一页在管什么」——
 * 分页之后每页只剩两三组，没有一句总的说明，用户得自己把几组拼起来才知道这页的边界。
 */
type SettingsTabId = "general" | "newtask" | "view" | "calendar";

interface SettingsTabSpec {
  id: SettingsTabId;
  label: string;
  lead: string;
  render: (host: HTMLElement) => void;
}

export class TaskMatrixSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private readonly host: SettingsHost,
  ) {
    super(app, plugin);
  }

  /**
   * 当前停在哪一页。
   *
   * 存成实例状态而不是每次回到第一页：开关（比如「铺出无截止日的已完成任务」）
   * 会重绘整个设置页，回到第一页会让人以为自己点错了。
   */
  private activeTab: SettingsTabId = "general";

  /**
   * 每次都从 host 现取，不缓存引用：设置对象在保存/迁移时会被整份替换，
   * 缓存一份就会在「改了没生效」时骗自己。
   */
  private get settings(): TaskMatrixSettings {
    return this.host.settings;
  }

  private persist(rescan = false): void {
    void this.host.persistSettings(rescan);
  }

  /** Obsidian 每次打开设置页都会调它；内部一律转 `render()`，重绘只走一条路 */
  display(): void {
    this.render();
  }

  private tabs(): SettingsTabSpec[] {
    return [
      {
        id: "general",
        label: t("通用"),
        lead: t("扫描范围、界面语言与任务标记的写法。改动会触发一次全库重新索引。"),
        render: (host) => {
          this.renderLanguage(host);
          this.renderScanning(host);
          this.renderMarkers(host);
        },
      },
      {
        id: "newtask",
        label: t("新建任务"),
        lead: t("新建任务落到哪篇笔记、用哪个模板、插到哪个标题下。"),
        render: (host) => {
          this.renderNewTasks(host);
          this.renderJournalTemplate(host);
        },
      },
      {
        id: "view",
        label: t("视图偏好"),
        lead: t("打开视图时的默认状态，以及面板模式铺出哪些任务。"),
        render: (host) => {
          this.renderDisplay(host);
          this.renderList(host);
        },
      },
      {
        id: "calendar",
        label: t("日历与甘特"),
        lead: t("日历与甘特各自的显示口径和配色，互不影响。"),
        render: (host) => {
          this.renderCalendar(host);
          this.renderGantt(host);
        },
      },
    ];
  }

  private render(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("tm-settings");

    const tabs = this.tabs();
    this.renderTabBar(containerEl, tabs);

    const body = containerEl.createDiv({ cls: "tm-settings__body", attr: { role: "tabpanel" } });
    const active = tabs.find((tab) => tab.id === this.activeTab) ?? tabs[0];
    if (active === undefined) return;
    body.createDiv({ cls: "tm-settings__lead", text: active.lead });
    active.render(body);
  }

  private renderTabBar(host: HTMLElement, tabs: readonly SettingsTabSpec[]): void {
    const bar = host.createDiv({ cls: "tm-settings__tabs", attr: { role: "tablist" } });
    for (const tab of tabs) {
      const isActive = tab.id === this.activeTab;
      const button = bar.createEl("button", {
        cls: `tm-settings__tab${isActive ? " is-active" : ""}`,
        text: tab.label,
        attr: { type: "button", role: "tab", "aria-selected": String(isActive) },
      });
      button.addEventListener("click", () => this.switchTab(tab.id, false));
      button.addEventListener("keydown", (event) => this.onTabKeyDown(event, tabs, tab.id));
    }
  }

  private switchTab(id: SettingsTabId, focus: boolean): void {
    if (id === this.activeTab) return;
    this.activeTab = id;
    this.render();
    if (focus) {
      this.containerEl.querySelector<HTMLElement>(".tm-settings__tab.is-active")?.focus();
    }
  }

  /** 方向键在 tab 间移动：键盘用户不必退回列表再选下一个 */
  private onTabKeyDown(event: KeyboardEvent, tabs: readonly SettingsTabSpec[], id: SettingsTabId): void {
    const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (offset !== 0) {
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.id === id);
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      if (next !== undefined) this.switchTab(next.id, true);
      return;
    }
    if (event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const target = event.key === "Home" ? tabs[0] : tabs[tabs.length - 1];
    if (target !== undefined) this.switchTab(target.id, true);
  }

  private renderLanguage(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("界面")).setHeading();

    new Setting(containerEl)
      .setName(t("界面语言"))
      .setDesc(t("自动跟随 Obsidian 的界面语言。"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", t("自动"))
          .addOption("zh", t("中文"))
          .addOption("en", "English")
          .setValue(this.settings.uiLanguage)
          .onChange((value) => {
            this.settings.uiLanguage = value as UiLanguage;
            this.persist();
            void this.host.refreshViews();
            this.display();
          }),
      );
  }

  private renderScanning(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("扫描范围")).setHeading();

    new Setting(containerEl)
      .setName(t("扫描目录"))
      // 默认值动态拼接：改默认值时这里不会过期，也不必把目录名写成 UI 文案
      .setDesc(
        t("用英文逗号分隔多个目录。留空表示扫描整个仓库（大库会很慢）。当前默认：{folders}", {
          folders: DEFAULT_SETTINGS.scanFolders.join(", "),
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.scanFolders.join(", "))
          .setValue(this.settings.scanFolders.join(", "))
          .onChange((value) => {
            this.settings.scanFolders = splitList(value);
            this.persist(true);
          }),
      );

    new Setting(containerEl)
      .setName(t("排除目录"))
      .setDesc(t("用英文逗号分隔多个目录，其下的任务不参与统计。"))
      .addText((text) =>
        text
          .setPlaceholder(t("归档, 模板"))
          .setValue(this.settings.excludeFolders.join(", "))
          .onChange((value) => {
            this.settings.excludeFolders = splitList(value);
            this.persist(true);
          }),
      );
  }

  private renderMarkers(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("任务标记")).setHeading();

    new Setting(containerEl)
      .setName(t("已完成标记"))
      .setDesc(t("方括号里的内容，逗号分隔。默认 x 与 X。"))
      .addText((text) =>
        text.setValue(this.settings.completionMarkers.join(", ")).onChange((value) => {
          const markers = splitList(value);
          this.settings.completionMarkers =
            markers.length > 0 ? markers : DEFAULT_SETTINGS.completionMarkers;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("已取消标记"))
      .setDesc(t("方括号里的内容，逗号分隔。默认短横线。"))
      .addText((text) =>
        text.setValue(this.settings.cancelledMarkers.join(", ")).onChange((value) => {
          const markers = splitList(value);
          this.settings.cancelledMarkers =
            markers.length > 0 ? markers : DEFAULT_SETTINGS.cancelledMarkers;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("忽略标记"))
      .setDesc(t("带这些标记的任务不进视图也不进统计，逗号分隔。"))
      .addText((text) =>
        text
          .setPlaceholder("I, ?, !")
          .setValue(this.settings.excludeMarkers.join(", "))
          .onChange((value) => {
            this.settings.excludeMarkers = splitList(value);
            this.persist(true);
          }),
      );

    new Setting(containerEl)
      .setName(t("自动记录完成日期"))
      .setDesc(t("勾选完成时自动补上完成标记与当天日期，重新打开时移除。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.trackCompletionDate).onChange((value) => {
          this.settings.trackCompletionDate = value;
          this.persist();
        }),
      );
  }

  private renderDisplay(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("显示")).setHeading();

    new Setting(containerEl)
      .setName(t("默认视图"))
      .setDesc(t("打开时先显示哪一种面板。"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("eisenhower", t("矩阵"))
          .addOption("gtd", t("GTD"))
          .addOption("list", t("列表"))
          .addOption("calendar", t("日历"))
          .addOption("gantt", t("甘特"))
          .setValue(this.settings.defaultView)
          .onChange((value) => {
            this.settings.defaultView = value as DefaultView;
            this.persist();
          }),
      );

    new Setting(containerEl)
      .setName(t("打开位置"))
      .setDesc(t("面板打开在右侧边栏还是新标签页。"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("sidebar", t("右侧边栏"))
          .addOption("tab", t("新标签页"))
          .setValue(this.settings.openLocation)
          .onChange((value) => {
            this.settings.openLocation = value as TaskMatrixSettings["openLocation"];
            this.persist();
          }),
      );

    new Setting(containerEl)
      .setName(t("紧急天数"))
      .setDesc(t("距今多少天内有截止日的任务算紧急，矩阵据此划入紧急象限。"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 7, 1)
          .setValue(this.settings.urgentDaysRange)
          .setDynamicTooltip()
          .onChange((value) => {
            this.settings.urgentDaysRange = value;
            this.persist(true);
          }),
      );

    new Setting(containerEl)
      .setName(t("截止日显示范围"))
      .setDesc(t("只铺出这么多月内到期的任务，逾期与已完成的始终显示。0 表示不限制。"))
      .addSlider((slider) =>
        slider
          .setLimits(0, 12, 1)
          .setValue(this.settings.dueDateDisplayRange)
          .setDynamicTooltip()
          .onChange((value) => {
            this.settings.dueDateDisplayRange = value;
            this.persist(true);
          }),
      );

    new Setting(containerEl)
      .setName(t("隐藏远期开始的任务"))
      .setDesc(t("开始日在 1 个月之后的先不铺出来。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.hideFutureStartTasks).onChange((value) => {
          this.settings.hideFutureStartTasks = value;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("铺出无截止日的已完成任务"))
      .setDesc(t("关闭时，已完成任务要有完成日或截止日才会显示。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.includeCompletedWithoutDueDate).onChange((value) => {
          this.settings.includeCompletedWithoutDueDate = value;
          this.persist(true);
          this.display();
        }),
      );

    if (!this.settings.includeCompletedWithoutDueDate) {
      new Setting(containerEl)
        .setName(t("已完成任务的显示范围"))
        .setDesc(t("只铺出这么多月内完成的已完成任务，0 表示不限制。"))
        .addSlider((slider) =>
          slider
            .setLimits(0, 12, 1)
            .setValue(this.settings.completedTaskDisplayRange)
            .setDynamicTooltip()
            .onChange((value) => {
              this.settings.completedTaskDisplayRange = value;
              this.persist(true);
            }),
        );
    }

    const activeModes = ["due-asc", "due-desc", "start-asc", "priority", "file"] as const;
    new Setting(containerEl)
      .setName(t("排序档位说明"))
      .setDesc(t("排序在筛选栏里随时可改，可选：{modes}", {
        modes: activeModes.map((mode) => sortModeLabel(mode)).join("、"),
      }));
  }

  private renderNewTasks(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("新建任务")).setHeading();

    new Setting(containerEl)
      .setName(t("目标笔记路径"))
      .setDesc(
        t("新建任务的落点，默认写到当日日志；笔记不存在时会自动新建。留空表示写进当前打开的笔记。"),
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.newTaskTargetPath)
          .setValue(this.settings.newTaskTargetPath)
          .onChange((value) => {
            this.settings.newTaskTargetPath = value.trim();
            this.persist();
          }),
      );

    new Setting(containerEl)
      .setName(t("目标标题"))
      .setDesc(t("把新任务插到哪个标题下（要带上井号）。留空表示追加到文末。"))
      .addText((text) =>
        text
          .setPlaceholder("## 任务")
          .setValue(this.settings.newTaskTargetHeading)
          .onChange((value) => {
            this.settings.newTaskTargetHeading = value.trim();
            this.persist();
          }),
      );
  }

  /**
   * 日志模板。
   *
   * 与 Project Master 的「新建项目模板」同口径：模板是**一篇笔记**，不是设置里的一段文本 ——
   * 模板里通常还有 frontmatter、Templater 命令、其他插件要解析的东西，复制进设置页就全丢了。
   * 占位符只解 `{{title}}` / `{{date}}` / `{{time}}`，`<% %>` 原样留着交给 Templater 自己执行。
   */
  private renderJournalTemplate(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("日志模板")).setHeading();

    new Setting(containerEl)
      .setName(t("模板笔记路径"))
      .setDesc(t("目标笔记不存在时，用这篇笔记的内容新建。填 vault 相对路径，扩展名可省略；留空则新建空白笔记。"))
      .addText((text) =>
        text
          .setPlaceholder(`${t("模板")}/日记模板.md`)
          .setValue(this.settings.newTaskTemplatePath)
          .onChange((value) => {
            this.settings.newTaskTemplatePath = value.trim();
            this.persist();
          }),
      );

    // 纯说明行：占位符不写出来没法用，写进 desc 又太长
    new Setting(containerEl)
      .setName(t("目标笔记路径与模板里可用的占位符"))
      .setDesc(
        t("{{title}} 是新笔记的文件名，{{date}} 与 {{time}} 是当前日期与时间，也可以写成 {{date:YYYY-MM-DD}} 指定格式；未识别的占位符原样保留。"),
      );
  }

  private renderList(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("列表视图")).setHeading();

    new Setting(containerEl)
      .setName(t("按文件夹分组"))
      .setDesc(t("列表视图里按所在文件夹划分容器。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.listGroupByFolder).onChange((value) => {
          this.settings.listGroupByFolder = value;
          this.persist();
          this.display();
        }),
      );

    if (!this.settings.listGroupByFolder) return;

    new Setting(containerEl)
      .setName(t("分组层级"))
      .setDesc(t("取文件路径的前几层作为容器名。"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setValue(this.settings.listGroupByFolderDepth)
          .setDynamicTooltip()
          .onChange((value) => {
            this.settings.listGroupByFolderDepth = value;
            this.persist();
          }),
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
  private renderGantt(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("甘特视图")).setHeading();

    new Setting(containerEl)
      .setName(t("甘特条配色"))
      .setDesc(
        t("按 Mermaid 甘特的四种状态配色。颜色可写 var(--color-blue) 或颜色名；点下面的色块即改。"),
      );

    for (const key of Object.keys(DEFAULT_GANTT_BAR_COLORS) as (keyof GanttBarColors)[]) {
      this.renderBarColorSetting(containerEl, key);
    }
  }

  private renderBarColorSetting(containerEl: HTMLElement, key: keyof GanttBarColors): void {
    const meta = barColorCopy(key);
    const current = this.settings.ganttBarColors[key] || DEFAULT_GANTT_BAR_COLORS[key];

    new Setting(containerEl)
      .setName(meta.label)
      .setDesc(`${meta.desc}${t("默认：{value}", { value: DEFAULT_GANTT_BAR_COLORS[key] })}`)
      .addText((text) =>
        text
          .setValue(current)
          .setPlaceholder(DEFAULT_GANTT_BAR_COLORS[key])
          .onChange((value) => {
            const trimmed = value.trim();
            // 空输入会让这一类条子失去颜色，忽略而不是把配置写坏
            if (trimmed.length === 0) return;
            void this.patchBarColor(key, trimmed);
          }),
      );

    const swatches = containerEl.createDiv({ cls: "tm-color-presets" });
    for (const preset of barColorPresets()) {
      const swatch = swatches.createEl("button", {
        cls: `tm-color-swatch${preset.value === current ? " is-active" : ""}`,
        // 颜色直接写在元素上，不经过自定义属性中转：那层解析不出颜色（色块会空心）
        attr: { type: "button", title: preset.label, "aria-label": preset.label },
      });
      swatch.style.backgroundColor = preset.value;
      swatch.addEventListener("click", () => {
        void this.patchBarColor(key, preset.value);
        this.display();
      });
    }
  }

  /** 配色改动不影响解析，所以只重绘视图、不重扫全库 */
  private async patchBarColor(key: keyof GanttBarColors, value: string): Promise<void> {
    this.settings.ganttBarColors = { ...this.settings.ganttBarColors, [key]: value };
    await this.host.persistSettings(false);
  }

  private renderCalendar(containerEl: HTMLElement): void {
    new Setting(containerEl).setName(t("日历视图")).setHeading();

    new Setting(containerEl)
      .setName(t("每周第一天"))
      .setDesc(t("决定日历里一周从哪天排起。"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("monday", t("周一"))
          .addOption("sunday", t("周日"))
          .setValue(this.settings.calendarFirstDayOfWeek)
          .onChange((value) => {
            this.settings.calendarFirstDayOfWeek =
              value as TaskMatrixSettings["calendarFirstDayOfWeek"];
            this.persist(true);
          }),
      );

    new Setting(containerEl)
      .setName(t("月视图显示周末"))
      .setDesc(t("关闭后只列工作日。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.showCalendarMonthWeekends).onChange((value) => {
          this.settings.showCalendarMonthWeekends = value;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("周视图显示周末"))
      .setDesc(t("开启后周末单独排在下方一行。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.showCalendarWeekends).onChange((value) => {
          this.settings.showCalendarWeekends = value;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("列表视图显示整月"))
      .setDesc(t("关闭后只列出有任务的日期。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.calendarListShowFullMonth).onChange((value) => {
          this.settings.calendarListShowFullMonth = value;
          this.persist(true);
        }),
      );

    new Setting(containerEl)
      .setName(t("铺开进行中的任务"))
      .setDesc(t("同时有开始日与截止日的任务，会在起止之间的每一天都出现。"))
      .addToggle((toggle) =>
        toggle.setValue(this.settings.showCalendarInProcessTasks).onChange((value) => {
          this.settings.showCalendarInProcessTasks = value;
          this.persist(true);
        }),
      );
  }
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** 预设色块。写成函数而不是常量：文案要按当前语言求值（理由同 i18n/index.ts） */
function barColorPresets(): Array<{ value: string; label: string }> {
  return [
    { value: "var(--color-red)", label: t("红") },
    { value: "var(--color-orange)", label: t("橙") },
    { value: "var(--color-yellow)", label: t("黄") },
    { value: "var(--color-green)", label: t("绿") },
    { value: "var(--color-cyan)", label: t("青") },
    { value: "var(--color-blue)", label: t("蓝") },
    { value: "var(--color-purple)", label: t("紫") },
    { value: "var(--color-pink)", label: t("粉") },
  ];
}

/**
 * 四类条色的说明。
 *
 * 每一类都写清「哪种任务写法会落到这一类」，否则用户在图上看到一条红条
 * 却不知道是哪条规则判的，只能靠猜。
 */
function barColorCopy(key: keyof GanttBarColors): { label: string; desc: string } {
  switch (key) {
    case "active":
      return { label: t("进行中"), desc: t("未完成、且起止日期完整的任务。") };
    case "done":
      return { label: t("已完成"), desc: t("已完成的任务（勾选框为 x）。") };
    case "crit":
      return {
        label: t("关键任务"),
        desc: t("带 🔺 或 #crit 标记的任务；优先级最高，同时已完成也按这一色显示。"),
      };
    default:
      return {
        label: t("其他状态"),
        desc: t("既非关键也非已完成、且起止日期不完整（图上那一段是推导值）的任务。"),
      };
  }
}
