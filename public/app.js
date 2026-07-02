const ROW_HEIGHTS = {
  comfortable: 56,
  compact: 44,
};
const COLOR_LEGEND = [
  { label: "채널", color: "#176B65" },
  { label: "프로젝트", color: "#D8842F" },
  { label: "촬영", color: "#2F80ED" },
  { label: "편집", color: "#8B5CF6" },
  { label: "업로드", color: "#D84E4E" },
];
const PAUSE_COLOR = "#8B949E";
const PALETTE = ["#2F80ED", "#27AE60", "#D84E4E", "#8B5CF6", "#D8842F", "#00A7A7", "#D9468A"];
const DETAIL_PRESETS = [
  { label: "촬영", value: "촬영", color: "#2F80ED" },
  { label: "편집", value: "편집", color: "#8B5CF6" },
  { label: "업로드", value: "업로드", color: "#D84E4E" },
];
const ZOOM = {
  day: { dayWidth: 38, tickEvery: 1 },
  week: { dayWidth: 22, tickEvery: 7 },
  month: { dayWidth: 12, tickEvery: 14 },
};
const DAILY_HEADER_MAX_VISIBLE_DAYS = 75;
const DAILY_HEADER_MIN_DAY_WIDTH = 18;
const ZOOM_ORDER = ["day", "week", "month"];
const TABLE_WIDTH_LIMITS = {
  min: 330,
  max: 760,
};
const EMBED_KEY = embedKeyFromLocation();
const SYNC_CHANNEL_NAME = "solpa-gantt-sync";
const VIEW_PREFS_KEY = "solpa-gantt-view";
const REVIEW_PANEL_PREFS_KEY = "solpa-gantt-review-panel";
const SYNC_STATUS_INTERVAL_MS = 15000;
const FULL_SYNC_INTERVAL_MS = 300000;
const DEFAULT_COLLAPSED_REVIEW_SECTIONS = ["upload-only", "missing-upload", "completed"];
const STALE_REVIEW_BACKLOG_DAYS = 14;
const PINNED_CHANNELS = [
  { name: "현대카드" },
  { name: "Hup!" },
  { name: "ODG" },
  { name: "film94" },
];

const state = {
  tasks: [],
  channelStubs: [],
  hiddenChannels: [],
  projectAliases: [],
  reviewIgnores: [],
  hiddenConvertibleProjects: [],
  hiddenProjectLeaks: [],
  hiddenProjects: [],
  groupRanges: {},
  groupNotes: {},
  rowOrder: [],
  rows: [],
  selectedId: "",
  selectedIds: new Set(),
  selectionAnchorRowId: "",
  zoom: "week",
  rangeStart: "",
  rangeEnd: "",
  connection: null,
  diagnostics: null,
  quality: [],
  embed: null,
  notionEmbed: null,
  tunnel: null,
  baseline: null,
  syncVersion: "",
  syncChangedAt: "",
  appVersion: "",
  serverStartedAt: "",
  pendingAppVersion: "",
  loadedAt: "",
  statusBannerPanel: "operation",
  drag: null,
  dependencyDrag: null,
  selectionDrag: null,
  rowReorderDrag: null,
  createDrag: null,
  tableResizeDrag: null,
  timelineNavigatorDrag: null,
  panMode: false,
  panDrag: null,
  suppressClick: false,
  context: null,
  editorMode: "task",
  editorRowId: "",
  collapsedRows: new Set(),
  showDependencies: true,
  rescheduleDependencies: true,
  showCritical: true,
  showBaseline: true,
  showCompleted: false,
  filters: {
    channel: "",
    detail: "",
    status: "",
    assignee: "",
    date: "",
    kind: "",
    issue: "",
    risk: "",
  },
  search: "",
  searchFocusIndex: -1,
  density: "compact",
  tableWidth: 0,
  reviewQuery: "",
  reviewCollapsedSections: new Set(DEFAULT_COLLAPSED_REVIEW_SECTIONS),
  editorOpen: false,
  saveTimer: null,
  didInitialScroll: false,
  undoStack: [],
  redoStack: [],
  isUndoing: false,
  isRedoing: false,
  syncClientId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  syncChannel: null,
  syncEvents: null,
  syncTimer: null,
  syncStatusTimer: null,
  autoSyncTimer: null,
  pendingSyncForce: false,
  ganttScrollFrame: null,
  renderedScrollLeft: 0,
  isLoading: false,
  pendingSyncReason: "",
  impactResolve: null,
  inputResolve: null,
  inputFieldsSchema: [],
  viewSettingsLoaded: false,
  viewSettingsUpdatedAt: "",
  viewSettingsSaveTimer: null,
  isApplyingViewSettings: false,
};

const els = {
  connectionLine: document.getElementById("connectionLine"),
  statusBanner: document.getElementById("statusBanner"),
  statusBannerTitle: document.getElementById("statusBannerTitle"),
  statusBannerDetail: document.getElementById("statusBannerDetail"),
  statusBannerButton: document.getElementById("statusBannerButton"),
  opsSummary: document.getElementById("opsSummary"),
  layout: document.getElementById("layout"),
  editor: document.getElementById("editor"),
  ganttContent: document.getElementById("ganttContent"),
  ganttScroll: document.getElementById("ganttScroll"),
  monthHeader: document.getElementById("monthHeader"),
  tickHeader: document.getElementById("tickHeader"),
  taskTable: document.getElementById("taskTable"),
  tableResizeHandle: document.getElementById("tableResizeHandle"),
  timelineBody: document.getElementById("timelineBody"),
  timelineNavigator: document.getElementById("timelineNavigator"),
  timelineNavigatorTrack: document.getElementById("timelineNavigatorTrack"),
  timelineNavigatorWindow: document.getElementById("timelineNavigatorWindow"),
  panModeButton: document.getElementById("panModeButton"),
  gridLayer: document.getElementById("gridLayer"),
  todayLine: document.getElementById("todayLine"),
  dependencyLayer: document.getElementById("dependencyLayer"),
  barLayer: document.getElementById("barLayer"),
  selectionBox: document.getElementById("selectionBox"),
  dragTooltip: document.getElementById("dragTooltip"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  searchPrevButton: document.getElementById("searchPrevButton"),
  searchNextButton: document.getElementById("searchNextButton"),
  viewModeButtons: document.querySelectorAll("[data-view-mode]"),
  refreshButton: document.getElementById("refreshButton"),
  todayButton: document.getElementById("todayButton"),
  reviewButton: document.getElementById("reviewButton"),
  newTaskButton: document.getElementById("newTaskButton"),
  collapseAllButton: document.getElementById("collapseAllButton"),
  expandAllButton: document.getElementById("expandAllButton"),
  densityButton: document.getElementById("densityButton"),
  dependencyToggleButton: document.getElementById("dependencyToggleButton"),
  rescheduleToggleButton: document.getElementById("rescheduleToggleButton"),
  criticalToggleButton: document.getElementById("criticalToggleButton"),
  baselineToggleButton: document.getElementById("baselineToggleButton"),
  completedToggleButton: document.getElementById("completedToggleButton"),
  filterButton: document.getElementById("filterButton"),
  hiddenManagerButton: document.getElementById("hiddenManagerButton"),
  activityButton: document.getElementById("activityButton"),
  operationButton: document.getElementById("operationButton"),
  changeRequestButton: document.getElementById("changeRequestButton"),
  undoButton: document.getElementById("undoButton"),
  redoButton: document.getElementById("redoButton"),
  closeEditorButton: document.getElementById("closeEditorButton"),
  taskForm: document.getElementById("taskForm"),
  editorTitle: document.getElementById("editorTitle"),
  sourceBadge: document.getElementById("sourceBadge"),
  titleField: document.getElementById("titleField"),
  channelField: document.getElementById("channelField"),
  projectField: document.getElementById("projectField"),
  detailField: document.getElementById("detailField"),
  descriptionField: document.getElementById("descriptionField"),
  startField: document.getElementById("startField"),
  endField: document.getElementById("endField"),
  statusField: document.getElementById("statusField"),
  assigneeField: document.getElementById("assigneeField"),
  colorField: document.getElementById("colorField"),
  colorSwatches: document.getElementById("colorSwatches"),
  statusOptions: document.getElementById("statusOptions"),
  detailOptions: document.getElementById("detailOptions"),
  detailPresetButtons: document.getElementById("detailPresetButtons"),
  deleteButton: document.getElementById("deleteButton"),
  contextMenu: document.getElementById("contextMenu"),
  contextMenuSummary: document.getElementById("contextMenuSummary"),
  contextCreateButton: document.getElementById("contextCreateButton"),
  contextRenameButton: document.getElementById("contextRenameButton"),
  contextMergeButton: document.getElementById("contextMergeButton"),
  contextEditButton: document.getElementById("contextEditButton"),
  contextDoneButton: document.getElementById("contextDoneButton"),
  contextHideButton: document.getElementById("contextHideButton"),
  contextRestoreButton: document.getElementById("contextRestoreButton"),
  contextDeleteButton: document.getElementById("contextDeleteButton"),
  contextDateDivider: document.getElementById("contextDateDivider"),
  contextMoveButton: document.getElementById("contextMoveButton"),
  contextStartButton: document.getElementById("contextStartButton"),
  contextEndButton: document.getElementById("contextEndButton"),
  filterPanelBackdrop: document.getElementById("filterPanelBackdrop"),
  filterPanel: document.getElementById("filterPanel"),
  closeFilterPanelButton: document.getElementById("closeFilterPanelButton"),
  filterSummary: document.getElementById("filterSummary"),
  channelFilterSelect: document.getElementById("channelFilterSelect"),
  detailFilterSelect: document.getElementById("detailFilterSelect"),
  statusFilterSelect: document.getElementById("statusFilterSelect"),
  assigneeFilterSelect: document.getElementById("assigneeFilterSelect"),
  dateFilterSelect: document.getElementById("dateFilterSelect"),
  kindFilterSelect: document.getElementById("kindFilterSelect"),
  issueFilterSelect: document.getElementById("issueFilterSelect"),
  filterMetrics: document.getElementById("filterMetrics"),
  resetFilterButton: document.getElementById("resetFilterButton"),
  selectionBar: document.getElementById("selectionBar"),
  selectionCount: document.getElementById("selectionCount"),
  selectionSummary: document.getElementById("selectionSummary"),
  selectionShiftBackButton: document.getElementById("selectionShiftBackButton"),
  selectionShiftForwardButton: document.getElementById("selectionShiftForwardButton"),
  selectionResizeBackButton: document.getElementById("selectionResizeBackButton"),
  selectionResizeForwardButton: document.getElementById("selectionResizeForwardButton"),
  selectionStatusButton: document.getElementById("selectionStatusButton"),
  selectionDoneButton: document.getElementById("selectionDoneButton"),
  selectionBulkEditButton: document.getElementById("selectionBulkEditButton"),
  selectionLinkButton: document.getElementById("selectionLinkButton"),
  selectionUnlinkButton: document.getElementById("selectionUnlinkButton"),
  selectionHideButton: document.getElementById("selectionHideButton"),
  selectionDeleteButton: document.getElementById("selectionDeleteButton"),
  selectionClearButton: document.getElementById("selectionClearButton"),
  colorLegend: document.getElementById("colorLegend"),
  hiddenPanelBackdrop: document.getElementById("hiddenPanelBackdrop"),
  hiddenPanel: document.getElementById("hiddenPanel"),
  closeHiddenPanelButton: document.getElementById("closeHiddenPanelButton"),
  hiddenSummary: document.getElementById("hiddenSummary"),
  hiddenChannelsList: document.getElementById("hiddenChannelsList"),
  hiddenProjectsList: document.getElementById("hiddenProjectsList"),
  hiddenConvertibleProjectsList: document.getElementById("hiddenConvertibleProjectsList"),
  hiddenTasksList: document.getElementById("hiddenTasksList"),
  projectAliasesList: document.getElementById("projectAliasesList"),
  reviewIgnoresList: document.getElementById("reviewIgnoresList"),
  reviewPanelBackdrop: document.getElementById("reviewPanelBackdrop"),
  reviewPanel: document.getElementById("reviewPanel"),
  closeReviewPanelButton: document.getElementById("closeReviewPanelButton"),
  reviewSummary: document.getElementById("reviewSummary"),
  reviewSearchInput: document.getElementById("reviewSearchInput"),
  reviewPriorityQueue: document.getElementById("reviewPriorityQueue"),
  reviewSimilarCount: document.getElementById("reviewSimilarCount"),
  reviewSimilarList: document.getElementById("reviewSimilarList"),
  reviewUploadOnlyCount: document.getElementById("reviewUploadOnlyCount"),
  reviewUploadOnlyList: document.getElementById("reviewUploadOnlyList"),
  reviewMissingUploadCount: document.getElementById("reviewMissingUploadCount"),
  reviewMissingUploadList: document.getElementById("reviewMissingUploadList"),
  reviewCompletedCount: document.getElementById("reviewCompletedCount"),
  reviewCompletedList: document.getElementById("reviewCompletedList"),
  activityPanelBackdrop: document.getElementById("activityPanelBackdrop"),
  activityPanel: document.getElementById("activityPanel"),
  closeActivityPanelButton: document.getElementById("closeActivityPanelButton"),
  activitySummary: document.getElementById("activitySummary"),
  activityList: document.getElementById("activityList"),
  operationPanelBackdrop: document.getElementById("operationPanelBackdrop"),
  operationPanel: document.getElementById("operationPanel"),
  closeOperationPanelButton: document.getElementById("closeOperationPanelButton"),
  operationSummary: document.getElementById("operationSummary"),
  operationReadinessList: document.getElementById("operationReadinessList"),
  embedStatusList: document.getElementById("embedStatusList"),
  embedUrlField: document.getElementById("embedUrlField"),
  copyEmbedUrlButton: document.getElementById("copyEmbedUrlButton"),
  installNotionEmbedButton: document.getElementById("installNotionEmbedButton"),
  tunnelUrlField: document.getElementById("tunnelUrlField"),
  startTunnelButton: document.getElementById("startTunnelButton"),
  stopTunnelButton: document.getElementById("stopTunnelButton"),
  tunnelStatusText: document.getElementById("tunnelStatusText"),
  operationSetupList: document.getElementById("operationSetupList"),
  publicUrlField: document.getElementById("publicUrlField"),
  savePublicUrlButton: document.getElementById("savePublicUrlButton"),
  clearPublicUrlButton: document.getElementById("clearPublicUrlButton"),
  fixedCommandRow: document.getElementById("fixedCommandRow"),
  fixedCommandField: document.getElementById("fixedCommandField"),
  copyFixedCommandButton: document.getElementById("copyFixedCommandButton"),
  operationActionsList: document.getElementById("operationActionsList"),
  operationMetrics: document.getElementById("operationMetrics"),
  operationQualityList: document.getElementById("operationQualityList"),
  operationReviewList: document.getElementById("operationReviewList"),
  impactModalBackdrop: document.getElementById("impactModalBackdrop"),
  impactModal: document.getElementById("impactModal"),
  impactTitle: document.getElementById("impactTitle"),
  impactSummary: document.getElementById("impactSummary"),
  impactGuard: document.getElementById("impactGuard"),
  impactList: document.getElementById("impactList"),
  impactCancelButton: document.getElementById("impactCancelButton"),
  impactCancelIconButton: document.getElementById("impactCancelIconButton"),
  impactConfirmButton: document.getElementById("impactConfirmButton"),
  inputModalBackdrop: document.getElementById("inputModalBackdrop"),
  inputModal: document.getElementById("inputModal"),
  inputBadge: document.getElementById("inputBadge"),
  inputTitle: document.getElementById("inputTitle"),
  inputSummary: document.getElementById("inputSummary"),
  inputForm: document.getElementById("inputForm"),
  inputFields: document.getElementById("inputFields"),
  inputCancelButton: document.getElementById("inputCancelButton"),
  inputCancelIconButton: document.getElementById("inputCancelIconButton"),
  inputConfirmButton: document.getElementById("inputConfirmButton"),
  toast: document.getElementById("toast"),
};

init();

function init() {
  restoreViewPrefs();
  restoreReviewPanelPrefs();
  renderSwatches(PALETTE[0]);
  renderColorLegend();
  bindEvents();
  syncViewControls();
  setupSync();
  loadTasks();
}

function bindEvents() {
  bindEscapeCancelEvents();
  document.addEventListener("pointerdown", () => window.focus?.(), { capture: true });
  els.refreshButton.addEventListener("click", () => loadTasks({ force: true }));
  els.newTaskButton.addEventListener("click", newTask);
  els.detailPresetButtons?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail-preset]");
    if (!button) return;
    applyDetailPreset(button.dataset.detailPreset || "");
  });
  els.detailField.addEventListener("input", () => {
    renderDetailPresets(els.detailField.value);
    const preset = detailPresetFor(els.detailField.value);
    if (preset) renderSwatches(preset.color);
  });
  els.todayButton.addEventListener("click", scrollToToday);
  els.collapseAllButton.addEventListener("click", collapseAllGroups);
  els.expandAllButton.addEventListener("click", expandAllGroups);
  els.densityButton.addEventListener("click", () => {
    state.density = state.density === "compact" ? "comfortable" : "compact";
    syncViewControls();
    saveViewPrefs();
    render();
  });
  els.dependencyToggleButton.addEventListener("click", () => {
    state.showDependencies = !state.showDependencies;
    syncViewControls();
    saveViewPrefs();
    render();
  });
  els.rescheduleToggleButton.addEventListener("click", () => {
    state.rescheduleDependencies = !state.rescheduleDependencies;
    syncViewControls();
    saveViewPrefs();
    showToast(state.rescheduleDependencies ? "후속 일정 자동 이동을 켰습니다." : "후속 일정 자동 이동을 껐습니다.");
  });
  els.criticalToggleButton.addEventListener("click", () => {
    state.showCritical = !state.showCritical;
    syncViewControls();
    saveViewPrefs();
    render();
  });
  els.baselineToggleButton.addEventListener("click", () => {
    state.showBaseline = !state.showBaseline;
    syncViewControls();
    saveViewPrefs();
    render();
  });
  els.completedToggleButton.addEventListener("click", () => {
    state.showCompleted = !state.showCompleted;
    syncViewControls();
    saveViewPrefs();
    render();
  });
  els.panModeButton.addEventListener("click", togglePanMode);
  els.filterButton.addEventListener("click", openFilterPanel);
  els.closeFilterPanelButton.addEventListener("click", closeFilterPanel);
  els.filterPanelBackdrop.addEventListener("click", closeFilterPanel);
  els.channelFilterSelect.addEventListener("change", () => updateFilter("channel", els.channelFilterSelect.value));
  els.detailFilterSelect.addEventListener("change", () => updateFilter("detail", els.detailFilterSelect.value));
  els.statusFilterSelect.addEventListener("change", () => updateFilter("status", els.statusFilterSelect.value));
  els.assigneeFilterSelect.addEventListener("change", () => updateFilter("assignee", els.assigneeFilterSelect.value));
  els.dateFilterSelect.addEventListener("change", () => updateFilter("date", els.dateFilterSelect.value));
  els.kindFilterSelect.addEventListener("change", () => updateFilter("kind", els.kindFilterSelect.value));
  els.issueFilterSelect.addEventListener("change", () => updateFilter("issue", els.issueFilterSelect.value));
  els.resetFilterButton.addEventListener("click", resetFilters);
  els.filterPanel.addEventListener("click", handleFilterPanelClick);
  els.reviewButton.addEventListener("click", openReviewPanel);
  els.hiddenManagerButton.addEventListener("click", openHiddenPanel);
  els.activityButton.addEventListener("click", openActivityPanel);
  els.operationButton.addEventListener("click", openOperationPanel);
  els.changeRequestButton?.addEventListener("click", openChangeRequestModal);
  els.statusBannerButton.addEventListener("click", openStatusBannerPanel);
  els.opsSummary.addEventListener("click", handleOpsSummaryClick);
  els.undoButton.addEventListener("click", runUndo);
  els.redoButton.addEventListener("click", runRedo);
  els.closeEditorButton.addEventListener("click", closeEditor);
  els.editor.addEventListener("keydown", (event) => {
    if (handleUndoRedoShortcut(event)) {
      event.stopPropagation();
      return;
    }
    if (event.key !== "Escape" || !state.editorOpen) return;
    event.preventDefault();
    event.stopPropagation();
    closeEditor();
  }, { capture: true });
  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    state.searchFocusIndex = -1;
    clearSelection(false);
    saveViewPrefs();
    render();
  });
  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    focusSearchResult(event.shiftKey ? -1 : 1);
  });
  els.searchPrevButton.addEventListener("click", () => focusSearchResult(-1));
  els.searchNextButton.addEventListener("click", () => focusSearchResult(1));
  els.viewModeButtons.forEach((button) => {
    button.addEventListener("click", () => applyViewMode(button.dataset.viewMode));
  });
  els.deleteButton.addEventListener("click", deleteSelectedTask);
  els.selectionShiftBackButton.addEventListener("click", () => shiftSelectedTasks(-1));
  els.selectionShiftForwardButton.addEventListener("click", () => shiftSelectedTasks(1));
  els.selectionResizeBackButton.addEventListener("click", () => resizeSelectedTaskEnds(-1));
  els.selectionResizeForwardButton.addEventListener("click", () => resizeSelectedTaskEnds(1));
  els.selectionStatusButton.addEventListener("click", bulkSetSelectedStatus);
  els.selectionDoneButton.addEventListener("click", markSelectedTasksDone);
  els.selectionBulkEditButton.addEventListener("click", bulkEditSelectedTasks);
  els.selectionLinkButton.addEventListener("click", linkSelectedTasks);
  els.selectionUnlinkButton.addEventListener("click", unlinkSelectedTasks);
  els.selectionHideButton.addEventListener("click", hideSelectedTasks);
  els.selectionDeleteButton.addEventListener("click", deleteSelectedTask);
  els.selectionClearButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearSelection();
  });
  els.selectionClearButton.addEventListener("click", clearSelection);
  els.closeHiddenPanelButton.addEventListener("click", closeHiddenPanel);
  els.hiddenPanelBackdrop.addEventListener("click", closeHiddenPanel);
  els.hiddenPanel.addEventListener("click", handleHiddenPanelClick);
  els.closeReviewPanelButton.addEventListener("click", closeReviewPanel);
  els.reviewPanelBackdrop.addEventListener("click", closeReviewPanel);
  els.reviewPanel.addEventListener("click", handleReviewPanelClick);
  els.reviewSearchInput.addEventListener("input", () => {
    state.reviewQuery = els.reviewSearchInput.value;
    renderReviewPanel();
  });
  els.closeActivityPanelButton.addEventListener("click", closeActivityPanel);
  els.activityPanelBackdrop.addEventListener("click", closeActivityPanel);
  els.closeOperationPanelButton.addEventListener("click", closeOperationPanel);
  els.operationPanelBackdrop.addEventListener("click", closeOperationPanel);
  els.operationPanel.addEventListener("click", handleOperationPanelClick);
  els.copyEmbedUrlButton.addEventListener("click", copyEmbedUrl);
  els.installNotionEmbedButton.addEventListener("click", installNotionEmbed);
  els.startTunnelButton.addEventListener("click", startTemporaryTunnelFromPanel);
  els.stopTunnelButton.addEventListener("click", stopTemporaryTunnelFromPanel);
  els.savePublicUrlButton.addEventListener("click", savePublicEmbedUrl);
  els.clearPublicUrlButton.addEventListener("click", clearPublicEmbedUrl);
  els.copyFixedCommandButton.addEventListener("click", copyFixedSetupCommand);
  els.impactModalBackdrop.addEventListener("click", () => resolveImpactPreview(false));
  els.impactCancelButton.addEventListener("click", () => resolveImpactPreview(false));
  els.impactCancelIconButton.addEventListener("click", () => resolveImpactPreview(false));
  els.impactConfirmButton.addEventListener("click", () => resolveImpactPreview(true));
  els.inputModalBackdrop.addEventListener("click", () => resolveInputModal(null));
  els.inputCancelButton.addEventListener("click", () => resolveInputModal(null));
  els.inputCancelIconButton.addEventListener("click", () => resolveInputModal(null));
  els.inputForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitInputModal();
  });
  els.taskTable.addEventListener("pointerdown", (event) => startSelectionDrag(event, "table"));
  els.tableResizeHandle.addEventListener("pointerdown", startTableResize);
  els.tableResizeHandle.addEventListener("dblclick", resetTableWidth);
  els.ganttScroll.addEventListener("pointerdown", startPanDrag, { capture: true });
  els.ganttScroll.addEventListener("scroll", handleGanttScroll);
  els.ganttScroll.addEventListener("wheel", handleGanttWheel, { passive: false });
  els.timelineNavigatorTrack?.addEventListener("pointerdown", startTimelineNavigatorJump);
  els.timelineNavigatorWindow?.addEventListener("pointerdown", startTimelineNavigatorDrag);
  els.timelineBody.addEventListener("pointerdown", (event) => startSelectionDrag(event, "timeline"));
  els.timelineBody.addEventListener("contextmenu", openTimelineContext);
  els.contextCreateButton.addEventListener("click", createTaskFromContext);
  els.contextEditButton.addEventListener("click", () => {
    if (["channel", "project"].includes(state.context?.kind)) {
      openGroupEditorFromContext(state.context);
    } else if (state.context?.taskId) {
      selectTask(state.context.taskId);
    }
    hideContextMenu();
  });
  els.contextRenameButton.addEventListener("click", renameContextGroup);
  els.contextMergeButton.addEventListener("click", mergeContextProjects);
  els.contextDoneButton.addEventListener("click", markContextDone);
  els.contextHideButton.addEventListener("click", hideContextItems);
  els.contextRestoreButton.addEventListener("click", restoreContextHiddenItem);
  els.contextDeleteButton.addEventListener("click", deleteContextItems);
  els.contextMoveButton.addEventListener("click", () => applyContextDate("move"));
  els.contextStartButton.addEventListener("click", () => applyContextDate("start"));
  els.contextEndButton.addEventListener("click", () => applyContextDate("end"));

  document.querySelectorAll("[data-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      state.zoom = button.dataset.zoom;
      syncViewControls();
      saveViewPrefs();
      render();
      scrollToToday(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (!els.contextMenu.contains(event.target)) hideContextMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (handleEscapeCancel(event)) return;
    if (handleUndoRedoShortcut(event)) return;
    if (handleKeyboardScheduleNudge(event)) return;
  });

  els.taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveEditor();
  });
}

function bindEscapeCancelEvents() {
  const onEscape = (event) => {
    if (!handleEscapeCancel(event)) return;
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  };
  window.addEventListener("keydown", onEscape, { capture: true });
  window.addEventListener("keyup", onEscape, { capture: true });
  document.addEventListener("keydown", onEscape, { capture: true });
  document.addEventListener("keyup", onEscape, { capture: true });
}

function handleEscapeCancel(event) {
  if (event.key !== "Escape") return false;
  if (event.__solpaEscapeHandled) return true;
  const markHandled = () => {
    event.__solpaEscapeHandled = true;
    event.preventDefault();
  };

  const hadContextMenu = !els.contextMenu.hidden;
  const hadFilterPanel = !els.filterPanel.hidden;
  const hadHiddenPanel = !els.hiddenPanel.hidden;
  const hadReviewPanel = !els.reviewPanel.hidden;
  const hadActivityPanel = !els.activityPanel.hidden;
  const hadOperationPanel = !els.operationPanel.hidden;
  const hadEditor = state.editorOpen;
  const hadSelection = Boolean(state.selectedIds.size || state.selectedId || state.selectionAnchorRowId);

  if (state.panMode) {
    markHandled();
    setPanMode(false);
    return true;
  }
  if (!els.inputModal.hidden) {
    markHandled();
    resolveInputModal(null);
    return true;
  }
  if (!els.impactModal.hidden) {
    markHandled();
    resolveImpactPreview(false);
    return true;
  }
  if (document.querySelector(".range-popover")) {
    markHandled();
    closeRangePopover();
    return true;
  }
  if (document.querySelector(".meta-popover")) {
    markHandled();
    closeMetaPopover();
    return true;
  }

  if (
    !hadContextMenu &&
    !hadFilterPanel &&
    !hadHiddenPanel &&
    !hadReviewPanel &&
    !hadActivityPanel &&
    !hadOperationPanel &&
    !hadEditor &&
    !hadSelection
  ) {
    return false;
  }

  markHandled();
  let shouldRender = false;

  if (hadContextMenu) hideContextMenu();
  if (hadFilterPanel) closeFilterPanel();
  if (hadHiddenPanel) closeHiddenPanel();
  if (hadReviewPanel) closeReviewPanel();
  if (hadActivityPanel) closeActivityPanel();
  if (hadOperationPanel) closeOperationPanel();

  if (hadSelection) {
    clearSelection(false);
    shouldRender = true;
  } else if (hadEditor) {
    state.editorOpen = false;
    state.editorMode = "task";
    state.editorRowId = "";
    shouldRender = true;
  }

  if (shouldRender) render();
  return true;
}

function handleKeyboardScheduleNudge(event) {
  if (keyboardNudgeBlocked(event)) return false;
  if (!(event.ctrlKey || event.metaKey) || !["ArrowLeft", "ArrowRight"].includes(event.key)) return false;
  const delta = event.key === "ArrowRight" ? 1 : -1;
  event.preventDefault();
  if (event.shiftKey) {
    resizeSelectedTaskEnds(delta);
  } else {
    shiftSelectedTasks(delta);
  }
  return true;
}

function handleUndoRedoShortcut(event) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
  const key = event.key.toLowerCase();
  if (key === "z" && !event.shiftKey) {
    event.preventDefault();
    runUndo();
    return true;
  }
  if (key === "y" || (key === "z" && event.shiftKey)) {
    event.preventDefault();
    runRedo();
    return true;
  }
  return false;
}

function keyboardNudgeBlocked(event) {
  if (!selectedTaskIds().length) return true;
  if (state.drag || state.dependencyDrag || state.selectionDrag || state.createDrag || state.timelineNavigatorDrag || state.panDrag) return true;
  if (!els.inputModal.hidden || !els.impactModal.hidden) return true;
  if (!els.contextMenu.hidden) return true;
  if (document.querySelector(".range-popover") || document.querySelector(".meta-popover")) return true;
  const target = event.target;
  return Boolean(target?.closest?.("input, textarea, select, button, [contenteditable='true']"));
}

function restoreViewPrefs() {
  try {
    const raw = localStorage.getItem(VIEW_PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    applyViewPrefs(prefs);
  } catch {
    // Ignore older or blocked browser storage.
  }
}

function restoreReviewPanelPrefs() {
  try {
    const raw = localStorage.getItem(REVIEW_PANEL_PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (Array.isArray(prefs?.collapsedSections)) {
      state.reviewCollapsedSections = new Set(prefs.collapsedSections.filter((kind) => reviewSectionKinds().includes(kind)));
    }
  } catch {
    // Keep the default review panel shape when storage is unavailable.
  }
}

function saveReviewPanelPrefs() {
  try {
    localStorage.setItem(REVIEW_PANEL_PREFS_KEY, JSON.stringify({
      collapsedSections: [...state.reviewCollapsedSections],
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    // Some embed contexts can block localStorage.
  }
}

function reviewSectionKinds() {
  return ["similar", "upload-only", "missing-upload", "completed"];
}

function saveViewPrefs() {
  const payload = viewPrefsPayload();
  try {
    localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(payload));
  } catch {
    // Some embed contexts can block localStorage.
  }
  if (!state.isApplyingViewSettings) scheduleSharedViewPrefsSave(payload);
}

function viewPrefsPayload() {
  return {
    zoom: state.zoom,
    density: state.density,
    showDependencies: state.showDependencies,
    rescheduleDependencies: state.rescheduleDependencies,
    showCritical: state.showCritical,
    showBaseline: state.showBaseline,
    showCompleted: state.showCompleted,
    filters: state.filters,
    search: String(state.search || "").trim().slice(0, 160),
    collapsedRows: [...state.collapsedRows].slice(0, 600),
    groupRanges: normalizeGroupRanges(state.groupRanges),
    groupNotes: normalizeGroupNotes(state.groupNotes),
    rowOrder: normalizeRowOrder(state.rowOrder),
    tableWidth: state.tableWidth || 0,
    updatedAt: new Date().toISOString(),
  };
}

function applySharedViewPrefs(prefs) {
  if (!prefs || typeof prefs !== "object") {
    state.viewSettingsLoaded = true;
    return;
  }
  const incomingVersion = prefs.updatedAt || "";
  if (state.viewSettingsLoaded && incomingVersion && incomingVersion === state.viewSettingsUpdatedAt) return;
  if (state.viewSettingsLoaded && !canApplyIncomingViewPrefs()) return;

  state.isApplyingViewSettings = true;
  applyViewPrefs(prefs);
  state.isApplyingViewSettings = false;
  state.viewSettingsLoaded = true;
  state.viewSettingsUpdatedAt = incomingVersion || state.viewSettingsUpdatedAt;
  syncViewControls();
}

function applyViewPrefs(prefs) {
  if (!prefs || typeof prefs !== "object") return;
  if (ZOOM[prefs.zoom]) state.zoom = prefs.zoom;
  if (["compact", "comfortable"].includes(prefs.density)) state.density = prefs.density;
  if (typeof prefs.showDependencies === "boolean") state.showDependencies = prefs.showDependencies;
  if (typeof prefs.rescheduleDependencies === "boolean") state.rescheduleDependencies = prefs.rescheduleDependencies;
  if (typeof prefs.showCritical === "boolean") state.showCritical = prefs.showCritical;
  if (typeof prefs.showBaseline === "boolean") state.showBaseline = prefs.showBaseline;
  if (typeof prefs.showCompleted === "boolean") state.showCompleted = prefs.showCompleted;
  if (prefs.filters && typeof prefs.filters === "object") state.filters = { ...defaultFilters(), ...prefs.filters };
  if (typeof prefs.search === "string") {
    const nextSearch = prefs.search.trim().slice(0, 160);
    if (nextSearch !== state.search) state.searchFocusIndex = -1;
    state.search = nextSearch;
    els.searchInput.value = state.search;
  }
  if (Number.isFinite(Number(prefs.tableWidth))) {
    const nextTableWidth = Number(prefs.tableWidth);
    state.tableWidth = nextTableWidth > 0 ? normalizeTableWidth(nextTableWidth) : 0;
  }
  if (Array.isArray(prefs.collapsedRows)) state.collapsedRows = new Set(prefs.collapsedRows.filter((rowId) => typeof rowId === "string"));
  if (prefs.groupRanges && typeof prefs.groupRanges === "object") state.groupRanges = normalizeGroupRanges(prefs.groupRanges);
  if (prefs.groupNotes && typeof prefs.groupNotes === "object") state.groupNotes = normalizeGroupNotes(prefs.groupNotes);
  if (Array.isArray(prefs.rowOrder)) state.rowOrder = normalizeRowOrder(prefs.rowOrder);
}

function canApplyIncomingViewPrefs() {
  return (
    !state.drag &&
    !state.dependencyDrag &&
    !state.selectionDrag &&
    !state.rowReorderDrag &&
    !state.createDrag &&
    !state.tableResizeDrag &&
    !state.timelineNavigatorDrag &&
    !state.panDrag &&
    !state.editorOpen &&
    !state.viewSettingsSaveTimer &&
    els.impactModal.hidden &&
    !document.querySelector(".range-popover") &&
    !document.querySelector(".meta-popover")
  );
}

function normalizeGroupRanges(value) {
  const result = {};
  Object.entries(value || {}).forEach(([key, range]) => {
    if (!key || typeof range !== "object") return;
    const start = toDateOnly(range.start);
    const end = toDateOnly(range.end);
    if (!start || !end) return;
    result[key] = compareDate(end, start) < 0 ? { start, end: start } : { start, end };
  });
  return result;
}

function normalizeGroupNotes(value) {
  const result = {};
  Object.entries(value || {}).forEach(([key, note]) => {
    if (!key || typeof note !== "string") return;
    const text = note.trim().slice(0, 6000);
    if (text) result[key] = text;
  });
  return result;
}

function normalizeRowOrder(value) {
  return [...new Set((value || []).filter((rowId) => typeof rowId === "string" && rowId.trim()).map((rowId) => rowId.trim()))].slice(0, 800);
}

function toDateOnly(value) {
  if (!value) return "";
  const text = String(value).trim();
  const direct = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;
  const loose = text.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (loose) {
    const month = String(Number(loose[2])).padStart(2, "0");
    const day = String(Number(loose[3])).padStart(2, "0");
    return `${loose[1]}-${month}-${day}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupRangeForRow(row, fallback) {
  if (!row || !["channel", "project"].includes(row.kind)) return fallback;
  const override = state.groupRanges?.[row.id];
  if (!override?.start || !override?.end) return fallback;
  return {
    start: override.start,
    end: compareDate(override.end, override.start) < 0 ? override.start : override.end,
  };
}

function setGroupRangeOverride(rowId, range) {
  if (!rowId || !range?.start || !range?.end) return;
  const start = toDateOnly(range.start);
  const end = toDateOnly(range.end);
  if (!start || !end) return;
  state.groupRanges = {
    ...(state.groupRanges || {}),
    [rowId]: compareDate(end, start) < 0 ? { start, end: start } : { start, end },
  };
}

function scheduleSharedViewPrefsSave(payload) {
  window.clearTimeout(state.viewSettingsSaveTimer);
  state.viewSettingsSaveTimer = window.setTimeout(() => saveSharedViewPrefs(payload), 500);
}

async function saveSharedViewPrefs(payload) {
  state.viewSettingsSaveTimer = null;
  try {
    const response = await fetch(apiUrl("/api/view-settings"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "보기 설정을 저장하지 못했습니다.");
    state.viewSettingsLoaded = true;
    state.viewSettingsUpdatedAt = result.viewSettings?.updatedAt || payload.updatedAt || state.viewSettingsUpdatedAt;
    notifyDataChanged("view-settings", { forceRefresh: false });
  } catch (error) {
    console.warn(error);
  }
}

function syncViewControls() {
  document.querySelectorAll("[data-zoom]").forEach((item) => item.classList.toggle("is-active", item.dataset.zoom === state.zoom));
  els.panModeButton?.classList.toggle("is-active", state.panMode);
  els.panModeButton?.setAttribute("aria-pressed", String(state.panMode));
  document.body.classList.toggle("is-pan-mode", state.panMode);
  els.densityButton.classList.toggle("is-active", state.density === "compact");
  els.densityButton.textContent = state.density === "compact" ? "촘촘" : "넓게";
  els.dependencyToggleButton.classList.toggle("is-active", state.showDependencies);
  els.rescheduleToggleButton.classList.toggle("is-active", state.rescheduleDependencies);
  els.criticalToggleButton.classList.toggle("is-active", state.showCritical);
  els.baselineToggleButton.classList.toggle("is-active", state.showBaseline && Boolean(state.baseline?.exists));
  els.baselineToggleButton.classList.toggle("is-disabled", !state.baseline?.exists);
  els.baselineToggleButton.title = state.baseline?.exists ? `${state.baseline.taskCount}개 일정 기준선 표시` : "운영 패널에서 기준선을 먼저 저장하세요";
  els.completedToggleButton.classList.toggle("is-active", state.showCompleted);
  renderSearchControls();
}

function togglePanMode() {
  setPanMode(!state.panMode);
}

function setPanMode(enabled) {
  state.panMode = Boolean(enabled);
  if (!state.panMode) state.panDrag = null;
  syncViewControls();
  showToast(state.panMode ? "이동 모드: 차트를 잡고 드래그하면 화면이 움직입니다." : "이동 모드를 껐습니다.");
}

function renderSearchControls() {
  const hasQuery = Boolean(String(state.search || "").trim());
  const count = hasQuery ? searchResultRows().length : 0;
  const disabled = !hasQuery || count === 0;
  els.searchPrevButton.disabled = disabled;
  els.searchNextButton.disabled = disabled;
  const label = hasQuery ? `${count}개 검색 결과` : "검색 결과 이동";
  els.searchPrevButton.title = disabled ? label : `이전 검색 결과 · ${label}`;
  els.searchNextButton.title = disabled ? label : `다음 검색 결과 · ${label}`;
}

function setupSync() {
  try {
    if (typeof BroadcastChannel === "function") {
      state.syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      state.syncChannel.addEventListener("message", (event) => handleSyncMessage(event.data));
    }
  } catch {
    state.syncChannel = null;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== SYNC_CHANNEL_NAME || !event.newValue) return;
    try {
      handleSyncMessage(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed storage events from older browser sessions.
    }
  });

  window.addEventListener("focus", () => requestSyncRefresh("focus", 100));
  window.addEventListener("pageshow", () => requestSyncRefresh("pageshow", 100));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestSyncRefresh("visible", 100);
  });
  setupServerEvents();
  state.syncStatusTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") checkSyncStatus();
  }, SYNC_STATUS_INTERVAL_MS);
  state.autoSyncTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") requestSyncRefresh("full-timer", 800);
  }, FULL_SYNC_INTERVAL_MS);
}

function setupServerEvents() {
  if (typeof EventSource !== "function") return;
  try {
    const events = new EventSource(apiUrl("/api/events"));
    state.syncEvents = events;
    events.addEventListener("snapshot", handleServerSyncSnapshot);
    events.addEventListener("changed", handleServerSyncEvent);
  } catch {
    state.syncEvents = null;
  }
}

function handleServerSyncSnapshot(event) {
  const payload = parseServerSyncEvent(event);
  if (!payload) return;
  if (!state.syncVersion && payload.version) state.syncVersion = payload.version;
  if (!state.syncChangedAt && payload.changedAt) state.syncChangedAt = payload.changedAt;
}

function handleServerSyncEvent(event) {
  const payload = parseServerSyncEvent(event);
  if (!payload?.version) {
    requestSyncRefresh("server-event", 150, { force: true });
    return;
  }
  if (state.syncVersion && payload.version === state.syncVersion) return;
  state.syncVersion = payload.version;
  state.syncChangedAt = payload.changedAt || state.syncChangedAt;
  requestSyncRefresh(payload.reason || "server-event", 150, { force: true });
}

function parseServerSyncEvent(event) {
  try {
    return JSON.parse(event.data || "{}");
  } catch {
    return null;
  }
}

function handleSyncMessage(message) {
  if (!message || message.clientId === state.syncClientId || message.type !== "changed") return;
  requestSyncRefresh("remote", 250, { force: message.forceRefresh !== false });
}

function notifyDataChanged(reason = "changed", options = {}) {
  const message = {
    type: "changed",
    reason,
    clientId: state.syncClientId,
    forceRefresh: options.forceRefresh !== false,
    at: new Date().toISOString(),
  };
  try {
    state.syncChannel?.postMessage(message);
  } catch {
    // Ignore transient embed messaging failures.
  }
  try {
    localStorage.setItem(SYNC_CHANNEL_NAME, JSON.stringify(message));
  } catch {
    // Some embed contexts can block localStorage; BroadcastChannel is enough when available.
  }
}

function requestSyncRefresh(reason = "sync", delay = 1200, options = {}) {
  state.pendingSyncReason = reason;
  state.pendingSyncForce = Boolean(state.pendingSyncForce || options.force);
  window.clearTimeout(state.syncTimer);
  state.syncTimer = window.setTimeout(() => {
    if (isAutoSyncBusy()) {
      requestSyncRefresh(reason, 5000, { force: state.pendingSyncForce });
      return;
    }
    const force = Boolean(state.pendingSyncForce);
    state.pendingSyncForce = false;
    loadTasks({ silent: true, preserveScroll: true, force, reason });
  }, delay);
}

function refreshAfterLocalMutation(reason = "changed", delay = 800) {
  notifyDataChanged(reason, { forceRefresh: true });
  requestSyncRefresh(reason, delay, { force: true });
}

async function checkSyncStatus() {
  try {
    const response = await fetch(apiUrl("/api/sync-status"));
    const status = await response.json();
    if (!response.ok) throw new Error(status.error || "동기화 상태를 확인하지 못했습니다.");
    if (status.appVersion && state.appVersion && status.appVersion !== state.appVersion) {
      state.pendingAppVersion = status.appVersion;
      if (!isAutoSyncBusy()) window.location.reload();
      return;
    }
    if (status.serverStartedAt) state.serverStartedAt = status.serverStartedAt;
    if (!state.appVersion && status.appVersion) state.appVersion = status.appVersion;
    if (state.pendingAppVersion && !isAutoSyncBusy()) {
      window.location.reload();
      return;
    }
    if (!status.version) return;
    if (!state.syncVersion) {
      state.syncVersion = status.version;
      state.syncChangedAt = status.changedAt || "";
      return;
    }
    if (status.version !== state.syncVersion) {
      state.syncVersion = status.version;
      state.syncChangedAt = status.changedAt || "";
      requestSyncRefresh("server-version", 100, { force: true });
    }
  } catch {
    // The regular full refresh path will surface connection errors when needed.
  }
}

function isAutoSyncBusy() {
  return (
    state.isLoading ||
    state.drag ||
    state.dependencyDrag ||
    state.selectionDrag ||
    state.rowReorderDrag ||
    state.createDrag ||
    state.tableResizeDrag ||
    state.timelineNavigatorDrag ||
    state.isUndoing ||
    state.editorOpen ||
    !els.impactModal.hidden ||
    Boolean(document.querySelector(".range-popover")) ||
    Boolean(document.querySelector(".meta-popover"))
  );
}

async function loadTasks(options = {}) {
  const normalizedOptions = options && !options.target ? options : {};
  const silent = Boolean(normalizedOptions.silent);
  const preserveScroll = Boolean(normalizedOptions.preserveScroll);
  const scrollLeft = els.ganttScroll.scrollLeft;
  const scrollTop = els.ganttScroll.scrollTop;
  state.isLoading = true;
  if (!silent) els.connectionLine.textContent = "불러오는 중";
  try {
    const response = await fetch(apiUrl(normalizedOptions.force ? "/api/tasks?refresh=1" : "/api/tasks"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "작업을 불러오지 못했습니다.");
    state.tasks = data.tasks || [];
    state.channelStubs = data.channels || [];
    state.hiddenChannels = Array.isArray(data.hiddenChannels) ? data.hiddenChannels : [];
    state.hiddenProjects = Array.isArray(data.hiddenProjects) ? data.hiddenProjects : [];
    state.projectAliases = data.projectAliases || [];
    state.reviewIgnores = data.reviewIgnores || [];
    state.hiddenProjectLeaks = Array.isArray(data.hiddenProjectLeaks) ? data.hiddenProjectLeaks : [];
    state.connection = data.connection;
    state.diagnostics = data.diagnostics || null;
    state.quality = Array.isArray(data.quality) ? data.quality : [];
    state.embed = data.embed || null;
    state.notionEmbed = data.notionEmbed || null;
    state.tunnel = data.tunnel || state.tunnel || null;
    state.baseline = data.baseline || data.diagnostics?.baseline || null;
    state.syncVersion = data.sync?.version || state.syncVersion;
    state.syncChangedAt = data.sync?.changedAt || state.syncChangedAt;
    state.appVersion = data.sync?.appVersion || state.appVersion;
    state.serverStartedAt = data.sync?.serverStartedAt || state.serverStartedAt;
    state.loadedAt = data.loadedAt;
    applySharedViewPrefs(data.viewSettings);
    if (state.selectedId && !state.tasks.some((task) => task.id === state.selectedId)) {
      state.selectedId = "";
      state.selectedIds.clear();
      state.editorOpen = false;
    }
    state.isLoading = false;
    syncViewControls();
    render();
    refreshOpenPanelsAfterDataLoad();
    if (preserveScroll) {
      els.ganttScroll.scrollLeft = scrollLeft;
      els.ganttScroll.scrollTop = scrollTop;
    }
    if (!state.didInitialScroll) {
      state.didInitialScroll = true;
      window.requestAnimationFrame(() => scrollToToday(false));
      window.setTimeout(() => scrollToToday(false), 300);
    }
  } catch (error) {
    if (!silent) showToast(error.message);
    els.connectionLine.textContent = silent ? "동기화 오류" : "연결 오류";
  } finally {
    state.isLoading = false;
  }
}

function refreshOpenPanelsAfterDataLoad() {
  if (!els.filterPanel.hidden) {
    renderFilterState();
    renderFilterMetrics();
  }
  if (!els.reviewPanel.hidden) renderReviewPanel();
  if (!els.operationPanel.hidden) renderOperationPanel();
}

function render() {
  const baseRows = buildRows(filteredTasks());
  const dependencyConflicts = dependencyConflictsForRows(baseRows);
  annotateRowsWithDependencyConflicts(baseRows, dependencyConflicts);
  const workloadRisks = workloadRisksForRows(baseRows);
  annotateRowsWithWorkloadRisks(baseRows, workloadRisks);
  state.rows = applyRiskRowFilter(baseRows, state.filters.risk);
  const range = calculateRange(state.rows);
  state.rangeStart = range.start;
  state.rangeEnd = range.end;

  const days = daysBetween(range.start, range.end) + 1;
  const dayWidth = ZOOM[state.zoom].dayWidth;
  const rowHeight = currentRowHeight();
  const timelineWidth = Math.max(days * dayWidth, 720);
  const bodyHeight = Math.max(state.rows.length * rowHeight, 240);
  state.renderedScrollLeft = Math.round(els.ganttScroll.scrollLeft || 0);

  document.body.dataset.density = state.density;
  document.documentElement.style.setProperty("--row-height", `${rowHeight}px`);
  applyTableWidth();
  els.ganttContent.style.setProperty("--timeline-width", `${timelineWidth}px`);
  els.ganttContent.style.setProperty("--day-width", `${dayWidth}px`);
  els.timelineBody.style.width = `${timelineWidth}px`;
  els.timelineBody.style.height = `${bodyHeight}px`;
  els.gridLayer.style.height = `${bodyHeight}px`;
  els.dependencyLayer.setAttribute("width", timelineWidth);
  els.dependencyLayer.setAttribute("height", bodyHeight);
  els.dependencyLayer.style.width = `${timelineWidth}px`;
  els.dependencyLayer.style.height = `${bodyHeight}px`;
  els.emptyState.hidden = state.rows.length > 0;
  const criticalTaskIds = state.showCritical ? criticalTaskIdsForRows(state.rows) : new Set();

  renderConnection();
  renderStatusBanner();
  renderOpsSummary({ dependencyConflicts, workloadRisks });
  renderHeaders(range.start, range.end, dayWidth, bodyHeight);
  renderRows(state.rows, criticalTaskIds);
  renderDependencies(state.rows, dayWidth, criticalTaskIds, dependencyConflicts);
  renderBars(state.rows, dayWidth, criticalTaskIds);
  renderTimelineNavigator(timelineWidth);
  renderOptions();
  renderFilterState();
  renderSearchControls();
  renderSelectionBar();
  renderUndoButton();
  if (!els.operationPanel.hidden) renderOperationPanel({ dependencyConflicts, workloadRisks });
  syncEditor();
}

function handleGanttScroll() {
  const nextScrollLeft = Math.round(els.ganttScroll.scrollLeft || 0);
  updateTimelineNavigatorWindow();
  if (nextScrollLeft === state.renderedScrollLeft || state.ganttScrollFrame) return;
  state.ganttScrollFrame = window.requestAnimationFrame(() => {
    state.ganttScrollFrame = null;
    if (Math.round(els.ganttScroll.scrollLeft || 0) === state.renderedScrollLeft) return;
    if (state.isLoading || state.drag || state.selectionDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag || state.panDrag) return;
    render();
  });
}

function renderTimelineNavigator(timelineWidth) {
  if (!els.timelineNavigator || !els.timelineNavigatorTrack || !els.timelineNavigatorWindow) return;
  const totalDays = Math.max(1, daysBetween(state.rangeStart, state.rangeEnd) + 1);
  const projectRows = state.rows.filter((row) => row.kind === "project" && !row.hiddenOnly);
  els.timelineNavigator.hidden = !projectRows.length || timelineWidth <= 0;
  if (els.timelineNavigator.hidden) {
    els.timelineNavigatorTrack.innerHTML = "";
    return;
  }

  const bars = projectRows.slice(0, 160).map((row, index) => {
    const left = clamp(daysBetween(state.rangeStart, row.start) / totalDays * 100, 0, 99.2);
    const maxWidth = Math.max(0.8, 100 - left);
    const width = clamp((daysBetween(row.start, row.end) + 1) / totalDays * 100, 0.8, maxWidth);
    const lane = index % 4;
    return `<span class="timeline-navigator-bar ${escapeHtml(row.issue ? `is-issue-${row.issue}` : "")}" style="--left:${left}%;--width:${width}%;--lane:${lane};--task-color:${row.color || "#d8842f"}"></span>`;
  });

  const todayOffset = daysBetween(state.rangeStart, todayString());
  const todayMarker = todayOffset >= 0 && todayOffset <= totalDays
    ? `<span class="timeline-navigator-today" style="--left:${clamp(todayOffset / totalDays * 100, 0, 100)}%"></span>`
    : "";

  els.timelineNavigatorTrack.innerHTML = `${bars.join("")}${todayMarker}`;
  updateTimelineNavigatorWindow();
}

function updateTimelineNavigatorWindow() {
  if (!els.timelineNavigator || els.timelineNavigator.hidden || !els.timelineNavigatorTrack || !els.timelineNavigatorWindow) return;
  const trackWidth = els.timelineNavigatorTrack.clientWidth || 1;
  const timelineWidth = Math.max(1, timelinePixelWidth());
  const visibleTimelineWidth = Math.max(80, (els.ganttScroll.clientWidth || 0) - currentTableWidth());
  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  const width = clamp((visibleTimelineWidth / timelineWidth) * trackWidth, 34, trackWidth);
  const maxLeft = Math.max(0, trackWidth - width);
  const left = maxScrollLeft > 0 ? clamp((els.ganttScroll.scrollLeft / maxScrollLeft) * maxLeft, 0, maxLeft) : 0;
  els.timelineNavigatorWindow.style.left = `${left}px`;
  els.timelineNavigatorWindow.style.width = `${width}px`;
}

function startTimelineNavigatorJump(event) {
  if (event.button !== 0 || event.target === els.timelineNavigatorWindow) return;
  event.preventDefault();
  event.stopPropagation();
  scrollTimelineNavigatorToPointer(event.clientX);
}

function startTimelineNavigatorDrag(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  state.timelineNavigatorDrag = {
    startX: event.clientX,
    startScrollLeft: els.ganttScroll.scrollLeft,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-navigator-dragging");
  window.addEventListener("pointermove", moveTimelineNavigatorDrag);
  window.addEventListener("pointerup", endTimelineNavigatorDrag, { once: true });
}

function moveTimelineNavigatorDrag(event) {
  const drag = state.timelineNavigatorDrag;
  if (!drag) return;
  const trackWidth = els.timelineNavigatorTrack.clientWidth || 1;
  const windowWidth = els.timelineNavigatorWindow.offsetWidth || 34;
  const maxLeft = Math.max(1, trackWidth - windowWidth);
  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  const scrollDelta = ((event.clientX - drag.startX) / maxLeft) * maxScrollLeft;
  els.ganttScroll.scrollLeft = clamp(drag.startScrollLeft + scrollDelta, 0, maxScrollLeft);
  updateTimelineNavigatorWindow();
}

function endTimelineNavigatorDrag() {
  window.removeEventListener("pointermove", moveTimelineNavigatorDrag);
  document.body.classList.remove("is-navigator-dragging");
  state.timelineNavigatorDrag = null;
}

function scrollTimelineNavigatorToPointer(clientX) {
  const rect = els.timelineNavigatorTrack.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const timelineWidth = timelinePixelWidth();
  const visibleTimelineWidth = Math.max(80, (els.ganttScroll.clientWidth || 0) - currentTableWidth());
  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  els.ganttScroll.scrollLeft = clamp(ratio * timelineWidth - visibleTimelineWidth / 2, 0, maxScrollLeft);
  updateTimelineNavigatorWindow();
}

function handleGanttWheel(event) {
  if (!event.target?.closest?.("#ganttScroll")) return;
  if (event.target?.closest?.("input, textarea, select, button, [contenteditable='true']")) return;
  if (state.drag || state.dependencyDrag || state.selectionDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag) return;

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    zoomTimelineFromWheel(event);
    return;
  }

  if (event.shiftKey && Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
    event.preventDefault();
    els.ganttScroll.scrollLeft += event.deltaY;
  }
}

function startPanDrag(event, options = {}) {
  if ((!state.panMode && !options.force) || event.button !== 0) return;
  if (state.drag || state.dependencyDrag || state.selectionDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag) return;
  if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();

  state.panDrag = {
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: els.ganttScroll.scrollLeft,
    startScrollTop: els.ganttScroll.scrollTop,
  };
  els.ganttScroll.setPointerCapture?.(event.pointerId);
  document.body.classList.add("is-panning");
  window.addEventListener("pointermove", movePanDrag);
  window.addEventListener("pointerup", endPanDrag, { once: true });
  window.addEventListener("pointercancel", endPanDrag, { once: true });
}

function movePanDrag(event) {
  const drag = state.panDrag;
  if (!drag) return;
  event.preventDefault();
  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  const maxScrollTop = Math.max(0, els.ganttScroll.scrollHeight - els.ganttScroll.clientHeight);
  els.ganttScroll.scrollLeft = clamp(drag.startScrollLeft - (event.clientX - drag.startX), 0, maxScrollLeft);
  els.ganttScroll.scrollTop = clamp(drag.startScrollTop - (event.clientY - drag.startY), 0, maxScrollTop);
  updateTimelineNavigatorWindow();
}

function endPanDrag() {
  window.removeEventListener("pointermove", movePanDrag);
  window.removeEventListener("pointercancel", endPanDrag);
  document.body.classList.remove("is-panning");
  state.panDrag = null;
}

function zoomTimelineFromWheel(event) {
  const currentIndex = ZOOM_ORDER.indexOf(state.zoom);
  if (currentIndex < 0) return;
  const nextIndex = clamp(currentIndex + (event.deltaY > 0 ? 1 : -1), 0, ZOOM_ORDER.length - 1);
  const nextZoom = ZOOM_ORDER[nextIndex];
  if (!nextZoom || nextZoom === state.zoom) return;

  const oldDayWidth = ZOOM[state.zoom].dayWidth;
  const timelineRect = els.timelineBody.getBoundingClientRect();
  const maxOffset = Math.max(0, daysBetween(state.rangeStart, state.rangeEnd));
  const focusOffsetDays = clamp((event.clientX - timelineRect.left) / oldDayWidth, 0, maxOffset);
  const scrollTop = els.ganttScroll.scrollTop;

  state.zoom = nextZoom;
  syncViewControls();
  saveViewPrefs();
  render();

  const scrollRect = els.ganttScroll.getBoundingClientRect();
  const tableWidth = currentTableWidth();
  const nextDayWidth = ZOOM[state.zoom].dayWidth;
  const pointerInsideTimeline = event.clientX - scrollRect.left - tableWidth;
  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  els.ganttScroll.scrollLeft = clamp(focusOffsetDays * nextDayWidth - pointerInsideTimeline, 0, maxScrollLeft);
  els.ganttScroll.scrollTop = scrollTop;
  render();
}

function currentRowHeight() {
  return ROW_HEIGHTS[state.density] || ROW_HEIGHTS.compact;
}

function currentTableWidth() {
  const computed = parseFloat(getComputedStyle(els.ganttContent).getPropertyValue("--table-width"));
  return normalizeTableWidth(state.tableWidth || computed || 500);
}

function normalizeTableWidth(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(clamp(number, TABLE_WIDTH_LIMITS.min, TABLE_WIDTH_LIMITS.max));
}

function applyTableWidth() {
  if (state.tableWidth > 0) {
    els.ganttContent.style.setProperty("--table-width", `${normalizeTableWidth(state.tableWidth)}px`);
  } else {
    els.ganttContent.style.removeProperty("--table-width");
  }
}

function startTableResize(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  state.tableResizeDrag = {
    startX: event.clientX,
    startWidth: currentTableWidth(),
    width: currentTableWidth(),
    moved: false,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  document.body.classList.add("is-table-resizing");
  window.addEventListener("pointermove", moveTableResize);
  window.addEventListener("pointerup", endTableResize, { once: true });
}

function moveTableResize(event) {
  const drag = state.tableResizeDrag;
  if (!drag) return;
  event.preventDefault();
  const nextWidth = normalizeTableWidth(drag.startWidth + event.clientX - drag.startX);
  drag.width = nextWidth;
  drag.moved = drag.moved || Math.abs(nextWidth - drag.startWidth) > 2;
  state.tableWidth = nextWidth;
  applyTableWidth();
}

function endTableResize() {
  window.removeEventListener("pointermove", moveTableResize);
  document.body.classList.remove("is-table-resizing");
  const drag = state.tableResizeDrag;
  state.tableResizeDrag = null;
  if (!drag?.moved) return;
  state.tableWidth = normalizeTableWidth(drag.width);
  applyTableWidth();
  saveViewPrefs();
  showToast(`목록 폭을 ${state.tableWidth}px로 저장했습니다.`);
}

function resetTableWidth(event) {
  event.preventDefault();
  event.stopPropagation();
  state.tableWidth = 0;
  applyTableWidth();
  saveViewPrefs();
  showToast("목록 폭을 기본값으로 되돌렸습니다.");
}

function barTop(index, kind, rowHeight) {
  if (kind === "channel") return index * rowHeight + Math.max(4, Math.round((rowHeight - 8) / 2));
  if (kind === "project") return index * rowHeight + Math.max(7, Math.round((rowHeight - 24) / 2));
  return index * rowHeight + Math.max(3, Math.round((rowHeight - 32) / 2));
}

function buildRows(tasks) {
  const scheduleTasks = tasks.filter((task) => isScheduleTask(task) && !isAutoHiddenTask(task));
  const channels = new Map();

  for (const task of scheduleTasks) {
    const channelName = task.channel || "미지정 채널";
    const projectName = task.project || task.title || "새 프로젝트";
    const resolvedProjectName = resolveProjectAliasName(channelName, projectName);
    const projectKey = canonicalProjectKey(resolvedProjectName);
    if (!channels.has(channelName)) {
      channels.set(channelName, { name: channelName, projects: new Map(), tasks: [] });
    }
    const channel = channels.get(channelName);
    const resolvedProjectKey = ensureProjectGroup(channel.projects, projectKey, resolvedProjectName);
    if (!channel.projects.has(resolvedProjectKey)) {
      channel.projects.set(resolvedProjectKey, { key: resolvedProjectKey, name: resolvedProjectName, aliasName: resolvedProjectName, tasks: [] });
    }
    const group = channel.projects.get(resolvedProjectKey);
    if (resolvedProjectName !== projectName) group.aliasName = resolvedProjectName;
    channel.projects.get(resolvedProjectKey).tasks.push(task);
  }

  for (const stub of state.channelStubs || []) {
    const channelName = stub.name || "미지정 채널";
    if (isAutoHiddenTask({ channel: channelName })) continue;
    if (!hiddenStubMatchesCurrentView(stub)) continue;
    if (!channels.has(channelName)) {
      channels.set(channelName, {
        name: channelName,
        projects: new Map(),
        tasks: [],
        hiddenTaskIds: stub.taskIds || [],
        hiddenRange: { start: stub.start || todayString(), end: stub.end || stub.start || todayString() },
      });
    } else {
      const channel = channels.get(channelName);
      channel.hiddenTaskIds = [...new Set([...(channel.hiddenTaskIds || []), ...(stub.taskIds || [])])];
      channel.hiddenRange = channel.hiddenRange || { start: stub.start || todayString(), end: stub.end || stub.start || todayString() };
    }
  }

  for (const pinned of PINNED_CHANNELS) {
    const channelName = pinned.name;
    if (isClientHiddenChannel(channelName)) continue;
    if (isAutoHiddenTask({ channel: channelName })) continue;
    if (!hiddenStubMatchesCurrentView({ name: channelName, start: todayString(), end: todayString() })) continue;
    if (channels.has(channelName)) continue;
    channels.set(channelName, {
      name: channelName,
      projects: new Map(),
      tasks: [],
      hiddenTaskIds: [],
      hiddenRange: { start: todayString(), end: todayString() },
      pinnedEmpty: true,
    });
  }

  channels.forEach((channel) => {
    mergeSimilarProjects(channel.projects);
    mergeUploadOnlyProjects(channel.projects);
    mergeSimilarProjects(channel.projects);
  });

  let channelList = [...channels.values()]
    .map((channel) => {
      const sourceProjects = [...channel.projects.values()];
      const completedProjects = sourceProjects.filter((project) => shouldHideProjectByDefault(project.tasks));
      const reviewBacklogProjects = sourceProjects.filter((project) => shouldHideReviewBacklogByDefault(project.tasks, project, sourceProjects));
      let projects = sourceProjects
        .filter((project) => projectMatchesIssueFilter(project.tasks, state.filters.issue))
        .filter((project) => shouldShowProjectInCurrentView(project.tasks, project, sourceProjects))
        .map((project) => {
          const visibleTasks = visibleTasksForProject(project.tasks);
          if (!visibleTasks.length) return null;
          return {
            ...project,
            tasks: visibleTasks,
            displayTasks: displayTasksForProject(visibleTasks),
            name: pauseProjectDisplayName(visibleTasks) || project.aliasName || displayProjectName(project.tasks, project.name),
            range: rangeOf(visibleTasks),
          };
        })
        .filter(Boolean)
        .sort((a, b) => compareDate(a.range.start, b.range.start) || compareText(a.name, b.name));
      projects = applyManualRowOrder(projects, (project) => `project:${channel.name}:${project.key}`);
      const visibleTasks = projects.flatMap((project) => project.tasks);
      if (!visibleTasks.length) {
        const hiddenDefaultTasks = [...completedProjects, ...reviewBacklogProjects].flatMap((project) => project.tasks);
        const emptyPinnedChannel = Boolean(channel.pinnedEmpty && !channel.hiddenTaskIds?.length && !hiddenDefaultTasks.length);
        if (emptyPinnedChannel) {
          const emptyChannelId = `channel:${channel.name}`;
          const emptyRange = channel.hiddenRange || { start: todayString(), end: todayString() };
          return {
            ...channel,
            projects: [],
            tasks: [],
            range: groupRangeForRow({ id: emptyChannelId, kind: "channel" }, emptyRange),
            emptyOnly: true,
          };
        }
        const shouldKeepHiddenChannel = Boolean(channel.hiddenTaskIds?.length || isAlwaysVisibleChannel(channel.name));
        if (!shouldKeepHiddenChannel) return null;
        const hiddenLabels = [
          channel.hiddenTaskIds?.length ? `${channel.hiddenTaskIds.length}개 숨김 일정` : "",
          completedProjects.length ? `${completedProjects.length}개 프로젝트 숨김` : "",
          reviewBacklogProjects.length ? `${reviewBacklogProjects.length}개 검토 후보 접힘` : "",
          channel.pinnedEmpty ? "표시할 일정 없음" : "",
        ].filter(Boolean);
        const hiddenRange = hiddenDefaultTasks.length
          ? rangeOf(hiddenDefaultTasks)
          : channel.hiddenRange || { start: todayString(), end: todayString() };
        const hiddenChannelId = `channel:${channel.name}`;
        const restoreActions = hiddenRestoreActionsForChannel(channel, completedProjects, reviewBacklogProjects);
        const displayRange = groupRangeForRow({ id: hiddenChannelId, kind: "channel" }, hiddenRange);
        return {
          ...channel,
          projects: [],
          tasks: [],
          range: displayRange,
          hiddenOnly: true,
          restoreActions,
          hiddenLabel: hiddenLabels.join(" · ") || "프로젝트 숨김 유지",
        };
      }
      const channelId = `channel:${channel.name}`;
      const naturalRange = rangeOf(visibleTasks);
      return { ...channel, projects, tasks: visibleTasks, range: groupRangeForRow({ id: channelId, kind: "channel" }, naturalRange) };
    })
    .filter(Boolean)
    .sort((a, b) =>
      Number(Boolean(a.hiddenOnly)) - Number(Boolean(b.hiddenOnly)) ||
      compareDate(a.range.start, b.range.start) ||
      compareText(a.name, b.name)
    );

  channelList = applyManualRowOrder(channelList, (channel) => `channel:${channel.name}`);

  const rows = [];
  for (const channel of channelList) {
    const channelId = `channel:${channel.name}`;
    const channelProgress = progressForTasks(channel.tasks);
    const channelHealth = healthForTasks(channel.tasks);
    const channelComposition = scheduleCompositionLabel(channel.tasks);
    rows.push({
      id: channelId,
      kind: "channel",
      title: channel.name,
      subtitle: channel.hiddenOnly
        ? channel.hiddenLabel || `${channel.hiddenTaskIds?.length || 0}개 숨김 일정`
        : channel.emptyOnly
          ? "표시할 일정 없음"
        : [`${channel.projects.length}개 프로젝트`, `${channel.tasks.length}개 일정`, channelComposition].filter(Boolean).join(" · "),
      start: channel.range.start,
      end: channel.range.end,
      color: "#176B65",
      progress: channelProgress,
      health: channelHealth,
      collapsed: state.collapsedRows.has(channelId),
      taskIds: channel.tasks.length ? channel.tasks.map((task) => task.id) : channel.hiddenTaskIds || [],
      hiddenOnly: Boolean(channel.hiddenOnly),
      emptyOnly: Boolean(channel.emptyOnly),
      restoreActions: channel.restoreActions || [],
    });

    if (state.collapsedRows.has(channelId)) continue;

    for (const project of channel.projects) {
      const projectId = `project:${channel.name}:${project.key}`;
      const projectProgress = progressForTasks(project.tasks);
      const projectIssue = projectIssueForTasks(project.tasks);
      const projectHealth = healthForTasks(project.tasks);
      const projectStatus = projectVisibilityState(project.tasks);
      const projectRange = groupRangeForRow({ id: projectId, kind: "project" }, project.range);
      const projectDisplayTasks = project.displayTasks || project.tasks;
      rows.push({
        id: projectId,
        kind: "project",
        channel: channel.name,
        title: project.name,
        subtitle: projectSubtitle(projectDisplayTasks, projectProgress, projectIssue),
        statusReason: projectIssue?.reason || "",
        start: projectRange.start,
        end: projectRange.end,
        color: projectColor(project),
        progress: projectProgress,
        health: projectHealth,
        collapsed: state.collapsedRows.has(projectId),
        isPause: isPauseProject(project),
        leafOnly: isPauseProject(project),
        taskIds: project.tasks.map((task) => task.id),
        issue: projectIssue?.kind || "",
      });

      if (state.collapsedRows.has(projectId) || isPauseProject(project)) continue;

      (project.displayTasks || project.tasks)
        .slice()
        .sort((a, b) => compareDate(a.start, b.start) || compareDate(a.end, b.end) || compareText(a.detail, b.detail))
        .forEach((task) => {
          const rowTasks = displayRowTasks(task);
          rows.push({
            id: task.id,
            kind: "task",
            title: task.detail || task.title,
            subtitle: task.displayCount > 1 ? `${task.displayCount}개 촬영 묶음` : "",
            start: task.start,
            end: task.end,
            color: isWonheePauseTask(task) ? PAUSE_COLOR : task.color,
            progress: rowTasks.length > 1 ? progressForTasks(rowTasks) : progressForTask(task),
            health: rowTasks.length > 1 ? healthForTasks(rowTasks) : healthForTask(task),
            task,
            isPause: isWonheePauseTask(task),
            taskIds: rowTasks.map((item) => item.id),
          });
        });
    }
  }

  return rows;
}

function applyManualRowOrder(items, idForItem) {
  if (!items?.length || !state.rowOrder?.length) return items;
  const manualIndex = new Map(state.rowOrder.map((id, index) => [id, index]));
  return items
    .map((item, index) => ({
      item,
      index,
      order: manualIndex.has(idForItem(item)) ? manualIndex.get(idForItem(item)) : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map((entry) => entry.item);
}

function hiddenRestoreActionsForChannel(channel, completedProjects = [], reviewBacklogProjects = []) {
  const actions = [];
  const normalizedChannel = normalizeChannelName(channel?.name || "");
  if (!normalizedChannel) return actions;

  if (isClientHiddenChannel(channel.name)) {
    actions.push({ type: "channel", channel: channel.name });
  }

  (state.hiddenProjects || [])
    .filter((item) => normalizeChannelName(item.channel) === normalizedChannel)
    .forEach((item) => {
      if (item.project) actions.push({ type: "project", channel: item.channel || channel.name, project: item.project });
    });

  (channel.hiddenTaskIds || []).forEach((id) => {
    if (id) actions.push({ type: "task", id });
  });

  if (!actions.length && (completedProjects.length || reviewBacklogProjects.length)) {
    actions.push({ type: "show-completed", channel: channel.name });
  }

  return uniqueRestoreActions(actions);
}

function hiddenRestoreActionsForRow(row) {
  if (!row?.hiddenOnly) return [];
  if (Array.isArray(row.restoreActions) && row.restoreActions.length) return uniqueRestoreActions(row.restoreActions);
  const actions = [];
  if (row.kind === "channel" && isClientHiddenChannel(row.title)) {
    actions.push({ type: "channel", channel: row.title });
  }
  taskIdsForRow(row).forEach((id) => actions.push({ type: "task", id }));
  return uniqueRestoreActions(actions);
}

function uniqueRestoreActions(actions) {
  const seen = new Set();
  return (actions || []).filter((action) => {
    const key = [action.type, action.channel || "", action.project || "", action.id || ""].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function projectSubtitle(tasks, progress, issue) {
  return projectScheduleImbalanceLabel(tasks);
}

function projectScheduleImbalanceLabel(tasks) {
  const list = tasks || [];
  const shootCount = list.filter(isShootTask).length;
  const uploadCount = list.filter(isUploadTask).length;
  if (shootCount === uploadCount) return "";
  return [
    shootCount ? `촬영 ${shootCount}` : "",
    uploadCount ? `업로드 ${uploadCount}` : "",
  ].filter(Boolean).join(" · ");
}

function projectColor(project) {
  return hasPauseProjectSignal(project) ? PAUSE_COLOR : "#D8842F";
}

function isPauseProject(project) {
  return Boolean(isWonheePauseLabel([project?.name, project?.aliasName].filter(Boolean).join(" "))) ||
    Boolean(project?.tasks?.length && project.tasks.every(isWonheePauseTask));
}

function hasPauseProjectSignal(project) {
  return Boolean(
    isWonheePauseLabel([project?.name, project?.aliasName].filter(Boolean).join(" ")) ||
    project?.tasks?.some(isWonheePauseTask),
  );
}

function pauseProjectDisplayName(tasks) {
  return tasks?.some(isWonheePauseTask) ? "\uD734\uC7AC" : "";
}

function displayTasksForProject(tasks) {
  const result = [];
  const shootRows = new Map();

  for (const task of tasks || []) {
    if (!isShootTask(task)) {
      result.push(task);
      continue;
    }

    const key = [task.start, task.end, normalizePresetText(task.detail || task.category || "촬영")].join("|");
    const existing = shootRows.get(key);
    if (!existing) {
      const row = { ...task, displayTasks: [task], displayCount: 1 };
      shootRows.set(key, row);
      result.push(row);
      continue;
    }

    existing.displayTasks.push(task);
    existing.displayCount = existing.displayTasks.length;
    existing.assignee = mergeDisplayLabels(existing.displayTasks.map((item) => item.assignee));
  }

  return result;
}

function displayRowTasks(task) {
  return Array.isArray(task?.displayTasks) && task.displayTasks.length ? task.displayTasks : task ? [task] : [];
}

function mergeDisplayLabels(values) {
  return [...new Set((values || []).flatMap((value) => String(value || "").split(",")).map((value) => value.trim()).filter(Boolean))].join(", ");
}

function isShootTask(task) {
  if (!task || isUploadTask(task)) return false;
  const detailText = [task.detail, task.category].filter(Boolean).join(" ");
  const fullText = [detailText, task.title].filter(Boolean).join(" ");
  if (/(업로드|릴리즈|게시|발행|upload|release)/i.test(detailText)) return false;
  return /(촬영|재촬영|shoot)/i.test(fullText);
}

function hiddenStubMatchesCurrentView(stub) {
  const channel = stub?.name || "";
  const query = String(state.search || "").trim().toLowerCase();
  if (query && !String(channel).toLowerCase().includes(query)) return false;
  if (state.filters.channel && !sameChannelName(channel, state.filters.channel)) return false;
  if (state.filters.detail || state.filters.status || state.filters.kind || state.filters.issue) return false;
  if (!state.filters.date) return true;

  const range = { start: stub.start || todayString(), end: stub.end || stub.start || todayString() };
  return taskMatchesDateFilter({ ...range, status: "" }, state.filters.date);
}

function isScheduleTask(task) {
  const type = String(task.rowType || "").trim();
  if (["상위", "채널"].includes(type)) return false;
  if (["하위", "프로젝트"].includes(type)) return false;
  if (isProjectMetaTask(task)) return false;
  return Boolean(task.start && task.end);
}

function isProjectMetaTask(task) {
  const detail = String(task.detail || "").replace(/\s+/g, "").trim();
  const status = String(task.status || "").replace(/\s+/g, "").trim();
  return detail === "프로젝트" && (!status || ["확정", "입력"].includes(status));
}

function isCompletedUploadProject(tasks) {
  const uploadTasks = tasks.filter(isUploadTask);
  if (!uploadTasks.length) return false;
  if (isUploadOnlyProject(tasks)) return false;

  const latestUploadEnd = uploadTasks.reduce((max, task) => (compareDate(task.end, max) > 0 ? task.end : max), uploadTasks[0].end);
  const uploadFinished = uploadTasks.some(isDoneTask) || compareDate(latestUploadEnd, todayString()) < 0;
  if (!uploadFinished) return false;

  return !tasks.some((task) => compareDate(task.end, latestUploadEnd) > 0 && !isDoneTask(task));
}

function shouldHideProjectByDefault(tasks) {
  return Boolean(projectVisibilityState(tasks).hiddenByDefault);
}

function shouldShowProjectInCurrentView(tasks, project = null, siblingProjects = []) {
  if (state.showCompleted) return true;
  if (state.filters.issue === "completed") return true;
  if (["upload-only", "missing-upload", "issue"].includes(state.filters.issue)) return true;
  if (shouldHideReviewBacklogByDefault(tasks, project, siblingProjects)) return false;
  return !shouldHideProjectByDefault(tasks);
}

function shouldHideReviewBacklogByDefault(tasks, project = null, siblingProjects = []) {
  const list = tasks || [];
  if (project && hasRemainingUploadSibling(project, siblingProjects)) return false;
  return Boolean(
    isPastUploadOnlyProject(list) ||
      isStaleMissingUploadProject(list)
  );
}

function hasRemainingUploadSibling(project, siblingProjects = []) {
  const list = project?.tasks || [];
  if (!isMissingUploadProject(list)) return false;
  const productionRange = rangeOf(list);
  const projectName = projectDisplayNameForMatch(project);

  return (siblingProjects || []).some((candidate) => {
    if (!candidate || candidate === project) return false;
    const uploadTasks = (candidate.tasks || []).filter(isUploadTask);
    if (!uploadTasks.length) return false;
    if (!uploadTasks.some((task) => !isDoneTask(task) && compareDate(task.end, todayString()) >= 0)) return false;

    const uploadRange = rangeOf(uploadTasks);
    const gapDays = daysBetween(productionRange.end, uploadRange.start);
    if (gapDays < -14 || gapDays > 210) return false;

    const uploadName = projectDisplayNameForMatch(candidate);
    return nearbyProjectNameScore(projectName, uploadName) >= 0.55;
  });
}

function projectDisplayNameForMatch(project) {
  return project?.aliasName || displayProjectName(project?.tasks || [], project?.name || "");
}

function isStaleMissingUploadProject(tasks) {
  const list = tasks || [];
  if (!isMissingUploadProject(list) || list.some(isActiveTask)) return false;
  const range = rangeOf(list);
  return daysBetween(range.end, todayString()) >= STALE_REVIEW_BACKLOG_DAYS;
}

function isUploadOnlyProject(tasks) {
  return Boolean(tasks?.length && tasks.every(isUploadTask));
}

function isSupplementalUploadProject(tasks) {
  return Boolean(
    isUploadOnlyProject(tasks) &&
    tasks.some((task) => /ng\s*컷|비하인드|티저|쇼츠|shorts?|하이라이트|클립|예고/i.test([task.project, task.title, task.detail, task.category].filter(Boolean).join(" ")))
  );
}

function isPastUploadOnlyProject(tasks) {
  if (!isUploadOnlyProject(tasks)) return false;
  if (tasks.some(isActiveTask)) return false;
  const latestEnd = tasks.reduce((max, task) => (compareDate(task.end, max) > 0 ? task.end : max), tasks[0].end);
  return tasks.some(isDoneTask) || compareDate(latestEnd, todayString()) < 0;
}

function isMissingUploadProject(tasks) {
  return Boolean(
    tasks?.length &&
    !tasks.some(isUploadTask) &&
    tasks.some(isProductionTask) &&
    !tasks.every(isNonDeliverableTask)
  );
}

function projectIssueForTasks(tasks) {
  const status = projectVisibilityState(tasks);
  if (status.kind === "upload-only") return { ...status, label: "업로드만 확인" };
  if (status.kind === "missing-upload") return status;
  if (status.kind === "completed") return status;
  return null;
}

function isPastProductionOnlyProject(tasks) {
  if (!tasks.length || tasks.some(isUploadTask)) return false;
  if (!tasks.every(isProductionTask)) return false;
  if (tasks.some(isActiveTask)) return false;
  return compareDate(rangeOf(tasks).end, todayString()) < 0;
}

function isPastFinishedProject(tasks) {
  const list = tasks || [];
  if (!list.length) return false;
  if (list.some(isActiveTask)) return false;
  if (list.some(isUploadTask) || list.some(isProductionTask) || isMissingUploadProject(list)) return false;
  const range = rangeOf(list);
  return compareDate(range.end, todayString()) < 0 && daysBetween(range.end, todayString()) >= STALE_REVIEW_BACKLOG_DAYS;
}

function isProductionTask(task) {
  const text = [task.detail, task.category, task.title].filter(Boolean).join(" ");
  return /촬영|편집|가편|재촬영/i.test(text);
}

function isNonDeliverableTask(task) {
  const text = [task.detail, task.category, task.title, task.project].filter(Boolean).join(" ");
  return /미팅|회의|사전\s*인터뷰|사전인터뷰|답사|레퍼런스|세팅|기획|기획안|구성안|섭외|섭외리스트|가이드|컨셉|휴가|휴재|휴방|연차|반차|회식|워크숍|워크샵/i.test(text);
}

function isReviewableTask(task) {
  return isScheduleTask(task) && !isAutoHiddenTask(task);
}

function projectReviewGroups(tasks = state.tasks) {
  const channels = new Map();

  tasks.filter(isReviewableTask).forEach((task) => {
    const channelName = task.channel || "미지정 채널";
    const projectName = task.project || task.title || "새 프로젝트";
    const resolvedProject = resolveProjectAliasName(channelName, projectName);
    if (!channels.has(channelName)) {
      channels.set(channelName, { name: channelName, projects: new Map() });
    }
    const channel = channels.get(channelName);
    const resolvedProjectKey = ensureProjectGroup(channel.projects, canonicalProjectKey(resolvedProject), resolvedProject);
    if (!channel.projects.has(resolvedProjectKey)) {
      channel.projects.set(resolvedProjectKey, { key: resolvedProjectKey, name: resolvedProject, aliasName: resolvedProject, tasks: [] });
    }
    const group = channel.projects.get(resolvedProjectKey);
    if (resolvedProject !== projectName) group.aliasName = resolvedProject;
    group.tasks.push(task);
  });

  channels.forEach((channel) => {
    mergeSimilarProjects(channel.projects);
    mergeUploadOnlyProjects(channel.projects);
    mergeSimilarProjects(channel.projects);
  });

  const groups = [];
  channels.forEach((channel) => {
    channel.projects.forEach((project) => {
      if (!project.tasks.length) return;
      const displayName = project.aliasName || displayProjectName(project.tasks, project.name);
      groups.push({
        key: `${normalizeChannelName(channel.name)}:${project.key}`,
        channel: channel.name,
        project: displayName,
        sourceProjects: [...new Set(project.tasks.map((task) => task.project || task.title).filter(Boolean))].sort(compareText),
        tasks: project.tasks,
        range: rangeOf(project.tasks),
      });
    });
  });

  return groups;
}

function projectReviewReport() {
  const groups = projectReviewGroups();
  const similar = withReviewPriority(
    filterReviewIgnored("similar", similarProjectCandidates(groups)),
    "similar",
    groups,
  ).sort(reviewPrioritySort);
  const similarIssueGroupKeys = groupsCoveredBySimilarIssueCandidates(similar);
  const uploadOnly = groups
    .filter((group) => isUploadOnlyProject(group.tasks))
    .filter((group) => !isSupplementalUploadProject(group.tasks))
    .filter((group) => !similarIssueGroupKeys.has(group.key))
    .filter((group) => !isReviewIgnored("upload-only", group))
    .map((group) => reviewGroupWithPriority(group, "upload-only", groups))
    .sort(reviewPrioritySort);
  const missingUpload = groups
    .filter((group) => !group.tasks.some(isUploadTask) && group.tasks.some(isProductionTask) && !group.tasks.every(isNonDeliverableTask))
    .filter((group) => !similarIssueGroupKeys.has(group.key))
    .filter((group) => !isReviewIgnored("missing-upload", group))
    .map((group) => reviewGroupWithPriority(group, "missing-upload", groups))
    .sort(reviewPrioritySort);
  const completed = groups
    .filter((group) => !isUploadOnlyProject(group.tasks) && isCompletedUploadProject(group.tasks))
    .filter((group) => !isReviewIgnored("completed", group))
    .map((group) => reviewGroupWithPriority(group, "completed", groups))
    .sort(reviewPrioritySort);

  return { similar, uploadOnly, missingUpload, completed };
}

function defaultHiddenProjectGroups(tasks = state.tasks) {
  return projectReviewGroups(tasks).filter((group) => shouldHideProjectByDefault(group.tasks || []));
}

function defaultReviewBacklogProjectGroups(tasks = state.tasks) {
  return projectReviewGroups(tasks).filter((group) => shouldHideReviewBacklogByDefault(group.tasks || []));
}

function groupsCoveredBySimilarIssueCandidates(candidates) {
  const keys = new Set();
  for (const candidate of candidates || []) {
    if (!similarCandidateHasSplitSchedule(candidate)) continue;
    (candidate.groups || []).forEach((group) => {
      if (group?.key) keys.add(group.key);
    });
  }
  return keys;
}

function similarCandidateHasSplitSchedule(candidate) {
  const childGroups = candidate?.groups || [];
  const tasks = candidate?.tasks || [];
  if (!tasks.some(isUploadTask) || !tasks.some(isProductionTask)) return false;
  return childGroups.some((group) => isUploadOnlyProject(group.tasks || [])) &&
    childGroups.some((group) => isMissingUploadProject(group.tasks || []));
}

function withReviewPriority(groups, kind, allGroups = groups) {
  return (groups || []).map((group) => reviewGroupWithPriority(group, kind, allGroups));
}

function reviewGroupWithPriority(group, kind, allGroups = []) {
  const signal = reviewSignalForGroup(group, kind);
  const nearbyCandidates = signal.tone === "low" ? [] : reviewNearbyScheduleCandidates(group, kind, allGroups);
  return {
    ...group,
    reviewKind: kind,
    reviewPriority: signal.priority,
    reviewTone: signal.tone,
    reviewReason: signal.reason,
    nearbyCandidates,
    nearbyEvidence: reviewNearbyScheduleEvidence(nearbyCandidates),
  };
}

function reviewSignalForGroup(group, kind) {
  if (kind === "similar") {
    if (similarCandidateHasSplitSchedule(group)) {
      if (hasDifferentEpisodeProjects(group.projects || group.sourceProjects || [])) {
        return {
          priority: 76,
          tone: "medium",
          reason: "촬영/업로드 이름은 비슷하지만 회차가 달라 확인 필요",
        };
      }
      if (group.splitSchedule && group.quickMerge === false) {
        return {
          priority: 88,
          tone: "medium",
          reason: group.splitEvidence || "촬영/편집과 업로드가 시기상 연결 가능",
        };
      }
      return {
        priority: 96,
        tone: "high",
        reason: group.splitEvidence || "촬영/업로드가 비슷한 이름으로 갈라짐",
      };
    }
    const score = Math.round(Number(group.score || 0) * 100);
    return {
      priority: score >= 82 ? 74 : 62,
      tone: "medium",
      reason: `비슷한 이름 후보 · 유사도 ${score || 0}%`,
    };
  }

  if (kind === "upload-only") {
    const range = group.range || rangeOf(group.tasks || []);
    if (isPastUploadOnlyProject(group.tasks || [])) {
      return {
        priority: 24,
        tone: "low",
        reason: "지난 업로드 단독 기록",
      };
    }
    const started = compareDate(range.start, todayString()) <= 0;
    if (isStaleReviewRange(range, 120)) {
      return {
        priority: 28,
        tone: "low",
        reason: "오래 지난 업로드 단독 기록",
      };
    }
    return {
      priority: started ? 82 : 52,
      tone: started ? "high" : "medium",
      reason: started ? "업로드만 있고 이전 공정이 안 보임" : "예정 업로드만 보임",
    };
  }

  if (kind === "missing-upload") {
    const tasks = group.tasks || [];
    const range = group.range || rangeOf(tasks);
    const ended = compareDate(range.end, todayString()) < 0;
    const daysPastEnd = ended ? daysBetween(range.end, todayString()) : 0;
    const hasEdit = tasks.some((task) => /편집|가편/i.test([task.detail, task.category, task.title].filter(Boolean).join(" ")));
    const hasShoot = tasks.some((task) => /촬영/i.test([task.detail, task.category, task.title].filter(Boolean).join(" ")));
    if (ended && isStaleReviewRange(range, 120)) {
      return { priority: 30, tone: "low", reason: "오래 지난 업로드 누락 후보" };
    }
    if (ended && hasEdit) {
      return { priority: 95, tone: "high", reason: "편집까지 지났는데 업로드 없음" };
    }
    if (ended && hasShoot) {
      if (daysPastEnd <= 21) return { priority: 86, tone: "high", reason: "최근 촬영 이후 업로드 없음" };
      return { priority: 64, tone: "medium", reason: "지난 촬영 기록 · 업로드 확인 필요" };
    }
    if (ended) {
      return { priority: 78, tone: "medium", reason: "지난 일정인데 업로드 없음" };
    }
    return { priority: 42, tone: "low", reason: "업로드가 아직 안 보이는 예정 프로젝트" };
  }

  if (kind === "completed") {
    return { priority: 20, tone: "done", reason: "업로드까지 완료되어 기본 숨김" };
  }

  return { priority: 0, tone: "medium", reason: "검토 필요" };
}

function reviewNearbyScheduleCandidates(group, kind, allGroups = []) {
  if (!["upload-only", "missing-upload"].includes(kind) || !group?.tasks?.length) return [];
  const groupRange = group.range || rangeOf(group.tasks || []);
  return (allGroups || [])
    .filter((candidate) => candidate?.key && candidate.key !== group.key)
    .filter((candidate) => sameChannelName(candidate.channel, group.channel))
    .map((candidate) => nearbyScheduleCandidate(group, kind, groupRange, candidate))
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || Math.abs(a.gapDays) - Math.abs(b.gapDays) || compareText(a.project, b.project))
    .slice(0, 3);
}

function reviewNearbyScheduleEvidence(candidates = []) {
  if (!candidates.length) return "";
  return `근처 후보: ${candidates.map((candidate) => `${candidate.project} (${candidate.gapLabel} · ${candidate.composition})`).join(" / ")}`;
}

function nearbyScheduleCandidate(group, kind, groupRange, candidate) {
  const candidateTasks = candidate.tasks || [];
  if (!candidateTasks.length) return null;

  const candidateRange = candidate.range || rangeOf(candidateTasks);
  if (!candidateRange?.start || !candidateRange?.end || !groupRange?.start || !groupRange?.end) return null;

  const wantsProduction = kind === "upload-only";
  const validComposition = wantsProduction
    ? candidateTasks.some(isProductionTask) && !candidateTasks.every(isUploadTask)
    : isUploadOnlyProject(candidateTasks) && !isSupplementalUploadProject(candidateTasks);
  if (!validComposition) return null;

  const gapDays = wantsProduction
    ? daysBetween(candidateRange.end, groupRange.start)
    : daysBetween(groupRange.end, candidateRange.start);
  if (gapDays < -14 || gapDays > 210) return null;

  const nameScore = nearbyProjectNameScore(group.project, candidate.project);
  const nearScore = Math.max(0, 1 - Math.abs(gapDays) / 210);
  const rank = (1 - Math.max(nameScore, nearScore * 0.72)) * 1000 + Math.max(0, gapDays);
  const projectNames = [group.project, candidate.project];
  const episodeMismatch = hasDifferentEpisodeProjects(projectNames);
  return {
    key: candidate.key,
    project: candidate.project,
    gapDays,
    gapLabel: gapDays === 0 ? "같은 날" : gapDays > 0 ? `${gapDays}일 뒤` : `${Math.abs(gapDays)}일 겹침`,
    composition: scheduleCompositionLabel(candidateTasks) || `${candidateTasks.length}개 일정`,
    nameScore,
    canQuickMerge: nameScore >= 0.82 && !episodeMismatch,
    rank,
  };
}

function nearbyProjectNameScore(left, right) {
  const leftKey = canonicalProjectKey(left);
  const rightKey = canonicalProjectKey(right);
  if (!leftKey || !rightKey) return 0;
  if (isSameProjectKey(leftKey, rightKey)) return 1;
  if (sharesEpisodeIdentity(leftKey, rightKey) || canMergeByEpisodeTitle(leftKey, rightKey)) return 0.92;
  if (hasStrongProjectContainment(leftKey, rightKey)) return 0.86;
  if (sharesEmbeddedKoreanName(leftKey, rightKey)) return 0.82;
  if (hasSharedProjectAnchor(leftKey, rightKey)) return 0.72;
  return sharedBigramScore(leftKey, rightKey);
}

function isStaleReviewRange(range, days = 120) {
  return Boolean(range?.end && daysBetween(range.end, todayString()) > days);
}

function reviewPrioritySort(a, b) {
  return (b.reviewPriority || 0) - (a.reviewPriority || 0) || projectReviewSort(a, b);
}

function filterReviewIgnored(kind, groups) {
  return (groups || []).filter((group) => !isReviewIgnored(kind, group));
}

function isReviewIgnored(kind, group) {
  return (state.reviewIgnores || []).some((item) => item.kind === kind && item.key === group.key);
}

function projectReviewSort(a, b) {
  return compareDate(a.range.start, b.range.start) || compareText(a.channel, b.channel) || compareText(a.project, b.project);
}

function similarProjectCandidates(groups) {
  const byChannel = new Map();
  groups.forEach((group) => {
    const channelKey = normalizeChannelName(group.channel);
    if (!byChannel.has(channelKey)) byChannel.set(channelKey, []);
    byChannel.get(channelKey).push(group);
  });

  const candidates = [];
  const seen = new Set();
  byChannel.forEach((items) => {
    for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
        const candidate = similarProjectCandidate(items[leftIndex], items[rightIndex]);
        if (!candidate || seen.has(candidate.key)) continue;
        seen.add(candidate.key);
        candidates.push(candidate);
      }
    }
  });
  return candidates.slice(0, 160);
}

function similarProjectCandidate(left, right) {
  const leftKey = canonicalProjectKey(left.project);
  const rightKey = canonicalProjectKey(right.project);
  if (!leftKey || !rightKey || leftKey === rightKey) return null;

  const lengthRatio = Math.min(leftKey.length, rightKey.length) / Math.max(leftKey.length, rightKey.length);
  const containment = hasStrongProjectContainment(leftKey, rightKey);
  const bigram = sharedBigramScore(leftKey, rightKey);
  const splitSignal = splitScheduleSimilaritySignal(left, right, leftKey, rightKey, { bigram, containment, lengthRatio });
  const score = splitSignal?.score ?? (containment ? Math.max(0.82, lengthRatio) : bigram);
  if (!splitSignal && !containment && bigram < 0.72) return null;
  if (score < 0.55) return null;

  const projects = [left.project, right.project].sort(compareText);
  const channel = left.channel || right.channel || "";
  const tasks = [...left.tasks, ...right.tasks];
  return {
    key: `${normalizeChannelName(channel)}:${canonicalProjectKey(projects[0])}:${canonicalProjectKey(projects[1])}`,
    channel,
    project: projects.join(" ↔ "),
    projects,
    groups: [left, right],
    sourceProjects: projects,
    tasks,
    range: rangeOf(tasks),
    score,
    splitSchedule: Boolean(splitSignal),
    splitGapDays: splitSignal?.gapDays ?? null,
    splitEvidence: splitSignal?.reason || "",
    quickMerge: !splitSignal || splitSignal.confidence === "high",
  };
}

function splitScheduleSimilaritySignal(left, right, leftKey, rightKey, metrics = {}) {
  const leftUploadOnly = isUploadOnlyProject(left.tasks || []) && !isSupplementalUploadProject(left.tasks || []);
  const rightUploadOnly = isUploadOnlyProject(right.tasks || []) && !isSupplementalUploadProject(right.tasks || []);
  const leftMissingUpload = isMissingUploadProject(left.tasks || []);
  const rightMissingUpload = isMissingUploadProject(right.tasks || []);
  if (!((leftUploadOnly && rightMissingUpload) || (rightUploadOnly && leftMissingUpload))) return null;

  const uploadGroup = leftUploadOnly ? left : right;
  const productionGroup = leftUploadOnly ? right : left;
  const uploadRange = rangeOf(uploadGroup.tasks || []);
  const productionRange = rangeOf(productionGroup.tasks || []);
  if (!uploadRange?.start || !productionRange?.end) return null;

  const gapDays = daysBetween(productionRange.end, uploadRange.start);
  const plausibleGap = gapDays >= -14 && gapDays <= 210;
  if (!plausibleGap) return null;

  const bigram = Number(metrics.bigram || 0);
  const containment = Boolean(metrics.containment);
  const episodeMatch = sharesEpisodeIdentity(leftKey, rightKey) || canMergeByEpisodeTitle(leftKey, rightKey);
  const anchorMatch = hasSharedProjectAnchor(leftKey, rightKey);
  const relaxedNameMatch = containment || episodeMatch || anchorMatch || bigram >= 0.58;
  if (!relaxedNameMatch) return null;

  const score = Math.max(
    containment ? Math.max(0.82, Number(metrics.lengthRatio || 0)) : 0,
    episodeMatch ? 0.76 : 0,
    anchorMatch ? 0.66 : 0,
    bigram,
  );
  const confidence = score >= 0.72 ? "high" : "medium";
  const reason = `촬영/편집 뒤 업로드 후보 · 간격 ${gapDays}일 · 유사도 ${Math.round(score * 100)}%`;
  return { score, confidence, gapDays, reason };
}

function hasSharedProjectAnchor(left, right) {
  const leftAnchors = projectAnchors(left);
  const rightAnchors = projectAnchors(right);
  return leftAnchors.some((anchor) => rightAnchors.includes(anchor));
}

function projectAnchors(value) {
  const text = String(value || "");
  const generic = new Set(["프로젝트", "촬영", "편집", "가편", "업로드", "릴리즈", "게시", "발행", "본편", "쇼츠", "숏폼", "콘텐츠", "영상"]);
  const chunks = text.match(/[가-힣]{2,}|[a-zA-Z]{3,}|\d+화|ep\d+/g) || [];
  return chunks
    .map((chunk) => chunk.toLowerCase())
    .filter((chunk) => chunk.length >= 2 && !generic.has(chunk) && !/^ep\d+$/.test(chunk) && !/^\d+화$/.test(chunk));
}

function sharedBigramScore(left, right) {
  const leftGrams = bigrams(left);
  const rightGrams = bigrams(right);
  if (!leftGrams.size || !rightGrams.size) return 0;
  let hits = 0;
  leftGrams.forEach((gram) => {
    if (rightGrams.has(gram)) hits += 1;
  });
  return hits / Math.min(leftGrams.size, rightGrams.size);
}

function bigrams(value) {
  const text = String(value || "");
  const result = new Set();
  for (let index = 0; index < text.length - 1; index += 1) result.add(text.slice(index, index + 2));
  return result;
}

function visibleTasksForProject(tasks) {
  return tasks;
}

function isUploadTask(task) {
  const text = [task.detail, task.category, task.title, task.status].filter(Boolean).join(" ");
  return /업로드|릴리즈|게시|발행/i.test(text);
}

function isDoneTask(task) {
  const text = [task.status, task.detail, task.title].filter(Boolean).join(" ");
  return /완료|종료|끝|done|complete|completed/i.test(text);
}

function isActiveTask(task) {
  const text = [task.status, task.detail, task.title].filter(Boolean).join(" ");
  return /진행|촬영중|편집중|작업중|doing|progress/i.test(text);
}

function canonicalProjectKey(value) {
  return cleanProjectName(canonicalProjectTitle(value)).replace(/\s+/g, "") || "새프로젝트";
}

function upsertLocalProjectAlias(channel, from, to) {
  const channelName = channel || "";
  const fromName = from || "";
  const toName = to || "";
  const channelKey = normalizeChannelName(channelName);
  const fromKey = canonicalProjectKey(fromName);
  if (!channelKey || !fromKey || !toName) return;

  state.projectAliases = [
    ...state.projectAliases.filter(
      (item) => !(sameChannelName(item.channel, channelName) && canonicalProjectKey(item.from) === fromKey),
    ),
    {
      channel: channelName,
      channelKey,
      from: fromName,
      fromKey,
      to: toName,
      toKey: canonicalProjectKey(toName),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function resolveProjectAliasName(channel, projectName) {
  let resolved = canonicalProjectTitle(projectName || "새 프로젝트");
  const visited = new Set();

  for (let index = 0; index < 8; index += 1) {
    const key = `${normalizeChannelName(channel)}:${canonicalProjectKey(resolved)}`;
    if (visited.has(key)) return resolved;
    visited.add(key);

    const alias = state.projectAliases.find(
      (item) => sameChannelName(item.channel, channel) && canonicalProjectKey(item.from) === canonicalProjectKey(resolved),
    );
    if (!alias?.to || alias.to === resolved) return resolved;
    resolved = canonicalProjectTitle(alias.to);
  }

  return resolved;
}

function ensureProjectGroup(projects, key, name) {
  const matchingKeys = [...projects.keys()].filter((existingKey) => isSameProjectKey(existingKey, key));
  const targetKey = [key, ...matchingKeys].sort(
    (a, b) => projectKeyRank(b) - projectKeyRank(a) || a.length - b.length || compareText(a, b),
  )[0];

  if (!projects.has(targetKey)) {
    projects.set(targetKey, { key: targetKey, name, tasks: [] });
  }

  for (const matchingKey of matchingKeys) {
    if (matchingKey === targetKey) continue;
    const match = projects.get(matchingKey);
    projects.get(targetKey).tasks.push(...(match?.tasks || []));
    projects.delete(matchingKey);
  }

  return targetKey;
}

function projectKeyRank(key) {
  return projectAliasKeys(key).size;
}

function mergeSimilarProjects(projects) {
  let merged = true;
  while (merged) {
    merged = false;
    const keys = [...projects.keys()];
    for (let index = 0; index < keys.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < keys.length; nextIndex += 1) {
        const firstKey = keys[index];
        const secondKey = keys[nextIndex];
        if (!projects.has(firstKey) || !projects.has(secondKey) || !isSameProjectKey(firstKey, secondKey)) continue;

        const targetKey = [firstKey, secondKey].sort(
          (a, b) => projectKeyRank(b) - projectKeyRank(a) || a.length - b.length || compareText(a, b),
        )[0];
        const sourceKey = targetKey === firstKey ? secondKey : firstKey;
        const target = projects.get(targetKey);
        const source = projects.get(sourceKey);
        target.tasks.push(...(source?.tasks || []));
        projects.delete(sourceKey);
        merged = true;
        break;
      }
      if (merged) break;
    }
  }
}

function mergeUploadOnlyProjects(projects) {
  const entries = [...projects.entries()];
  for (const [uploadKey, uploadProject] of entries) {
    if (!projects.has(uploadKey) || !uploadProject.tasks.length || !uploadProject.tasks.every(isUploadTask)) continue;

    const candidate = [...projects.entries()]
      .filter(([candidateKey, candidateProject]) => candidateKey !== uploadKey && candidateProject.tasks.some((task) => !isUploadTask(task)))
      .filter(([, candidateProject]) => shouldMergeUploadOnlyProject(uploadProject, candidateProject))
      .sort(([, a], [, b]) => compareDate(rangeOf(b.tasks).end, rangeOf(a.tasks).end))[0];

    if (!candidate) continue;
    const [, targetProject] = candidate;
    targetProject.tasks.push(...uploadProject.tasks);
    projects.delete(uploadKey);
  }
}

function shouldMergeUploadOnlyProject(uploadProject, candidateProject) {
  const uploadKeys = projectKeysForTasks(uploadProject.tasks);
  const candidateKeys = projectKeysForTasks(candidateProject.tasks);

  return uploadKeys.some((uploadKey) =>
    candidateKeys.some(
      (candidateKey) =>
        isSameProjectKey(uploadKey, candidateKey) ||
        sharesEpisodeIdentity(uploadKey, candidateKey) ||
        canMergeByEpisodeTitle(uploadKey, candidateKey) ||
        sharesNamedKeywordSet(uploadKey, candidateKey) ||
        sharesEmbeddedKoreanName(uploadKey, candidateKey) ||
        sharesTrustedRoot(uploadKey, candidateKey) ||
        hasStrongProjectContainment(uploadKey, candidateKey),
    ),
  );
}

function projectKeysForTasks(tasks) {
  const keys = new Set();
  for (const task of tasks) {
    const key = canonicalProjectKey(task.project || task.title);
    if (!key) continue;
    keys.add(key);
    projectAliasKeys(key).forEach((alias) => keys.add(alias));
  }
  return [...keys];
}

function isSameProjectKey(a, b) {
  if (a === b) return true;
  const aliasesA = projectAliasKeys(a);
  const aliasesB = projectAliasKeys(b);
  for (const alias of aliasesA) {
    if (aliasesB.has(alias) && !isBareEpisodeKey(alias)) return true;
  }
  if (sharesEpisodeIdentity(a, b) || canMergeByEpisodeTitle(a, b)) return true;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  const isClearOverlap = longer.endsWith(shorter) || longer.startsWith(shorter);
  const trustedShortKeys = new Set(["방찬", "캔바", "딘딘", "베몬", "힌스", "백룸"]);
  const genericShortKeys = new Set(["마이클"]);
  const isKoreanName = /^[가-힣]{3,}$/.test(shorter) && !genericShortKeys.has(shorter);
  return isClearOverlap && (shorter.length >= 4 || trustedShortKeys.has(shorter) || isKoreanName);
}

function sharesTrustedRoot(a, b) {
  const trustedRoots = ["베몬", "힌스", "백룸"];
  return trustedRoots.some((root) => a.startsWith(root) && b.startsWith(root));
}

function sharesNamedKeywordSet(a, b) {
  const keywordSets = [
    ["네이버", "웹툰", "숏폼"],
  ];
  return keywordSets.some((keywords) => keywords.every((keyword) => a.includes(keyword) && b.includes(keyword)));
}

function sharesEmbeddedKoreanName(a, b) {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  const generic = new Set(["새프로젝트", "프로젝트", "촬영", "편집", "가편", "업로드", "티저", "마이클"]);
  if (generic.has(shorter)) return false;
  if (!/^[가-힣]{3,5}$/.test(shorter)) return false;
  return longer.includes(shorter);
}

function sharesTrustedShortProjectKey(a, b) {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  const trustedShortKeys = new Set(["방찬", "캔바", "딘딘", "베몬", "힌스", "백룸"]);
  return trustedShortKeys.has(shorter) && longer.includes(shorter);
}

function hasStrongProjectContainment(a, b) {
  const first = String(a || "");
  const second = String(b || "");
  const shorter = first.length <= second.length ? first : second;
  const longer = first.length > second.length ? first : second;
  if (!shorter || isBareEpisodeKey(shorter)) return false;
  if (shorter.length < 4 && !sharesTrustedShortProjectKey(first, second)) return false;
  return longer.includes(shorter);
}

function sharesEpisodeNumber(a, b) {
  const aEpisodes = episodeNumbers(a);
  const bEpisodes = episodeNumbers(b);
  if (!aEpisodes.size || !bEpisodes.size) return false;
  for (const episode of aEpisodes) {
    if (bEpisodes.has(episode)) return true;
  }
  return false;
}

function sharesEpisodeIdentity(a, b) {
  const segmentsA = episodeSegments(a);
  const segmentsB = episodeSegments(b);
  for (const [episode, segmentA] of segmentsA) {
    if (!segmentsB.has(episode)) continue;
    const segmentB = segmentsB.get(episode);
    if (!segmentA || !segmentB || sameSegmentText(segmentA, segmentB)) return true;
  }
  return false;
}

function sharesEpisodeTitle(a, b) {
  const segmentsA = [...episodeSegments(a).values()].filter(Boolean);
  const segmentsB = [...episodeSegments(b).values()].filter(Boolean);
  return segmentsA.some((segmentA) => segmentsB.some((segmentB) => sameSegmentText(segmentA, segmentB)));
}

function canMergeByEpisodeTitle(a, b) {
  const episodesA = episodeNumbers(a);
  const episodesB = episodeNumbers(b);
  if (episodesA.size && episodesB.size && !sharesEpisodeNumber(a, b)) return false;
  return sharesEpisodeTitle(a, b);
}

function episodeNumbers(key) {
  return new Set([...key.matchAll(/ep(\d+)/g)].map((match) => match[1]));
}

function episodeSegments(key) {
  const segments = new Map();
  const matches = [...key.matchAll(/ep(\d+)/g)];
  if (!matches.length) return segments;

  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? key.length;
    segments.set(match[1], normalizeSegment(key.slice(start, end)));
  });
  return segments;
}

function sameSegmentText(a, b) {
  const first = normalizeSegment(a);
  const second = normalizeSegment(b);
  if (!first || !second) return false;
  const shorter = first.length <= second.length ? first : second;
  const longer = first.length > second.length ? first : second;
  return shorter.length >= 2 && longer.includes(shorter);
}

function normalizeSegment(value) {
  return String(value || "")
    .replace(/써브웨이/g, "서브웨이")
    .replace(/(촬영|업로드|릴리즈|게시|발행|편집|가편)$/g, "")
    .replace(/[^0-9a-zA-Z가-힣]+/g, "")
    .trim();
}

function isBareEpisodeKey(value) {
  return /^ep\d+$/.test(value);
}

function projectAliasKeys(key) {
  const aliases = new Set([key]);
  const coreKey = projectCoreKey(key);
  if (coreKey && coreKey.length >= 3 && !isBareEpisodeKey(coreKey)) aliases.add(coreKey);
  const rangePattern = /ep(\d+)ep(\d+)/g;
  let rangeMatch = rangePattern.exec(key);
  while (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (Number.isInteger(start) && Number.isInteger(end) && end >= start && end - start <= 20) {
      const prefix = key.slice(0, rangeMatch.index);
      const suffix = key.slice(rangeMatch.index + rangeMatch[0].length);
      for (let number = start; number <= end; number += 1) {
        aliases.add(`${prefix}ep${number}${suffix}`);
      }
    }
    rangeMatch = rangePattern.exec(key);
  }

  if (key.startsWith("ep")) {
    const matches = [...key.matchAll(/ep\d+/g)];
    matches.forEach((match, index) => {
      const next = matches[index + 1]?.index ?? key.length;
      aliases.add(key.slice(match.index, next));
    });
  }

  const episodeNumber = key.match(/^(.+?\d+화)/);
  if (episodeNumber) aliases.add(episodeNumber[1]);

  return aliases;
}

function projectCoreKey(key) {
  return String(key || "")
    .replace(/(구성안|섭외리스트|섭외|티징사진|촬영본|본촬영|본편)/g, "")
    .replace(/본$/g, "")
    .trim();
}

function canonicalProjectTitle(value) {
  const text = String(value || "").trim();
  if (!isCanYouHandleBurnText(text)) return text;
  const prefix = text.match(/^\s*(\[[^\]]+\]\s*)/)?.[1] || "";
  const episode = canYouHandleEpisode(text);
  return `${prefix}캔유 핸들 더 번${episode ? ` EP.${episode}` : ""}`.trim();
}

function isCanYouHandleBurnText(value) {
  return /캔\s*유\s*핸들\s*더\s*(힛|히트|번)|can\s*you\s*handle\s*the\s*(heat|hit|burn)/i.test(String(value || ""));
}

function canYouHandleEpisode(value) {
  const text = String(value || "");
  return text.match(/\bep\.?\s*(\d+)/i)?.[1] || text.match(/(\d+)\s*화/)?.[1] || "";
}

function cleanProjectName(value) {
  return canonicalProjectTitle(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*(숏|롱|광고|short|long)[^)]*\)/gi, " ")
    .replace(/\([^)]*(촬영|업로드|릴리즈|게시|발행|편집|가편|재촬영)[^)]*\)/gi, " ")
    .replace(/→/g, " ")
    .replace(/\bep\.?\s*/gi, "ep")
    .replace(/스몰토크/g, "스몰톡")
    .replace(/써브웨이/g, "서브웨이")
    .replace(/가편\s*공유/g, "가편")
    .replace(/\s+(촬영|업로드|릴리즈|게시|발행|편집|가편|재촬영)$/g, " ")
    .replace(/(촬영|업로드|릴리즈|게시|발행)$/g, " ")
    .replace(/[^0-9a-zA-Z가-힣]+/g, " ")
    .trim();
}

function displayProjectName(tasks, fallback) {
  const pauseName = pauseProjectDisplayName(tasks);
  if (pauseName) return pauseName;
  const candidates = tasks
    .map((task) => task.project || task.title || fallback)
    .filter(Boolean)
    .map((name) => ({ name: cleanDisplayProjectName(name), score: displayNameScore(name) }))
    .filter((item) => item.name);

  if (!candidates.length) return fallback || "새 프로젝트";
  candidates.sort((a, b) => b.score - a.score || a.name.length - b.name.length || compareText(a.name, b.name));
  return candidates[0].name;
}

function cleanDisplayProjectName(value) {
  return canonicalProjectTitle(value)
    .replace(/\s+/g, " ")
    .replace(/\s*(업로드|릴리즈|게시|발행|촬영|편집|가편\s*공유)$/g, "")
    .trim();
}

function displayNameScore(value) {
  const text = String(value || "");
  let score = 0;
  if (!/(업로드|릴리즈|게시|발행|촬영|편집|가편)/.test(text)) score += 4;
  if (!/^\([^)]*(숏|롱|광고)/.test(text)) score += 2;
  if ((text.match(/EP\.?\s*\d+/gi) || []).length > 1) score += 3;
  if (text.length > 4) score += 1;
  return score;
}

function progressForTasks(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((sum, task) => sum + progressForTask(task), 0) / tasks.length);
}

function progressForTask(task) {
  const status = String(task.status || "").toLowerCase();
  if (/완료|종료|끝|done|complete|completed/.test(status)) return 100;
  if (/검수|리뷰|확인|대기/.test(status)) return 75;
  if (/진행|촬영중|편집중|작업중|doing|progress/.test(status)) return 50;
  if (/보류|hold|blocked/.test(status)) return 20;
  return 0;
}

function projectVisibilityState(tasks) {
  const list = tasks || [];
  if (!list.length) {
    return {
      kind: "empty",
      label: "일정 없음",
      tone: "muted",
      reason: "표시할 상세일정이 없습니다",
      hiddenByDefault: false,
    };
  }

  const range = rangeOf(list);
  const composition = scheduleCompositionLabel(list);
  const latestUploadEnd = latestEndForTasks(list.filter(isUploadTask));
  const latestEnd = latestEndForTasks(list);

  if (isPastUploadOnlyProject(list)) {
    return {
      kind: "upload-only",
      label: "업로드만",
      tone: "bad",
      reason: `업로드 일정만 ${dateLabel(latestEnd)}에 끝났습니다. 촬영/편집 매칭 확인이 필요합니다`,
      hiddenByDefault: false,
      composition,
    };
  }

  if (isSupplementalUploadProject(list)) {
    return {
      kind: "publish-only",
      label: "업로드 예정",
      tone: "muted",
      reason: "티저/쇼츠/비하인드처럼 단독 업로드로 볼 수 있는 일정입니다",
      hiddenByDefault: false,
      composition,
    };
  }

  if (isUploadOnlyProject(list)) {
    return {
      kind: "upload-only",
      label: "업로드만",
      tone: "bad",
      reason: "촬영/편집 없이 업로드 일정만 보여 매칭 확인이 필요합니다",
      hiddenByDefault: false,
      composition,
    };
  }

  if (isCompletedUploadProject(list)) {
    return {
      kind: "completed",
      label: "업로드 완료",
      tone: "ok",
      reason: `업로드가 ${dateLabel(latestUploadEnd)}까지 끝나 기본 숨김 대상입니다`,
      hiddenByDefault: true,
      composition,
    };
  }

  if (isMissingUploadProject(list)) {
    const ended = compareDate(range.end, todayString()) < 0;
    return {
      kind: "missing-upload",
      label: "업로드 없음",
      tone: ended ? "bad" : "warn",
      reason: ended ? "촬영/편집 이후 업로드 일정이 보이지 않습니다" : "촬영/편집은 있으나 업로드 일정이 아직 보이지 않습니다",
      hiddenByDefault: false,
      composition,
    };
  }

  if (isPastFinishedProject(list)) {
    return {
      kind: "past-finished",
      label: "",
      tone: "muted",
      reason: "기간이 지난 단독 일정이라 기본 숨김 대상입니다",
      hiddenByDefault: true,
      composition,
    };
  }

  if (list.every(isDoneTask)) {
    return {
      kind: "done",
      label: "완료",
      tone: "ok",
      reason: "모든 상세일정 상태가 완료입니다",
      hiddenByDefault: false,
      composition,
    };
  }

  if (compareDate(range.end, todayString()) < 0 && progressForTasks(list) < 100) {
    return {
      kind: "overdue",
      label: "지연",
      tone: "bad",
      reason: `${dateLabel(range.end)} 이후 남은 일정이 있습니다`,
      hiddenByDefault: false,
      composition,
    };
  }

  if (list.some(isActiveTask)) {
    return {
      kind: "active",
      label: "진행",
      tone: "active",
      reason: "진행 중인 상세일정이 있습니다",
      hiddenByDefault: false,
      composition,
    };
  }

  if (compareDate(range.start, todayString()) > 0) {
    return {
      kind: "upcoming",
      label: "예정",
      tone: "muted",
      reason: `${dateLabel(range.start)} 시작 예정입니다`,
      hiddenByDefault: false,
      composition,
    };
  }

  return {
    kind: "waiting",
    label: "대기",
    tone: "muted",
    reason: "오늘 구간에 걸쳐 있으나 진행 상태가 없습니다",
    hiddenByDefault: false,
    composition,
  };
}

function latestEndForTasks(tasks) {
  const list = (tasks || []).filter((task) => task?.end);
  if (!list.length) return "";
  return list.reduce((max, task) => (compareDate(task.end, max) > 0 ? task.end : max), list[0].end);
}

function healthForTasks(tasks) {
  const list = tasks || [];
  if (!list.length) return { label: "", tone: "muted" };
  const status = projectVisibilityState(list);
  if (["missing-upload", "upload-only"].includes(status.kind)) {
    return { label: status.label, tone: status.tone };
  }
  return { label: "", tone: status.tone };
}

function healthForTask(task) {
  return { label: "", tone: "muted" };
}

function criticalTaskIdsForRows(rows) {
  const ids = new Set();
  const tasksById = new Map(state.tasks.map((task) => [task.id, task]));
  rows
    .filter((row) => row.kind === "project" && row.taskIds?.length)
    .forEach((project) => {
      const projectTasks = project.taskIds.map((id) => tasksById.get(id)).filter(Boolean);
      if (!projectTasks.length) return;
      const latestEnd = projectTasks.reduce((max, task) => (compareDate(task.end, max) > 0 ? task.end : max), projectTasks[0].end);
      projectTasks
        .filter((task) => task.end === latestEnd && !isDoneTask(task))
        .forEach((task) => ids.add(task.id));
    });
  return ids;
}

function dependencyConflictsForRows(rows) {
  const taskRows = rows.filter((row) => row.kind === "task" && row.task);
  const byId = new Map();
  taskRows.forEach((row) => {
    byId.set(normalizeId(row.task.id), row.task);
    if (row.task.originId) byId.set(normalizeId(row.task.originId), row.task);
  });

  const seen = new Set();
  const conflicts = [];
  for (const row of taskRows) {
    const task = row.task;
    (task.predecessorIds || []).forEach((predecessorId) => {
      const predecessor = byId.get(normalizeId(predecessorId));
      if (predecessor) addDependencyConflict(conflicts, seen, predecessor, task);
    });
    (task.successorIds || []).forEach((successorId) => {
      const successor = byId.get(normalizeId(successorId));
      if (successor) addDependencyConflict(conflicts, seen, task, successor);
    });
  }

  return conflicts.sort((a, b) => b.overlapDays - a.overlapDays || compareText(a.fromTitle, b.fromTitle));
}

function addDependencyConflict(conflicts, seen, predecessor, successor) {
  if (!predecessor?.id || !successor?.id) return;
  const key = dependencyPairKey(predecessor.id, successor.id);
  if (seen.has(key)) return;
  seen.add(key);
  if (compareDate(predecessor.end, successor.start) <= 0) return;
  const overlapDays = Math.max(1, daysBetween(successor.start, predecessor.end));
  conflicts.push({
    fromId: predecessor.id,
    toId: successor.id,
    fromTitle: taskDisplayName(predecessor),
    toTitle: taskDisplayName(successor),
    fromEnd: predecessor.end,
    toStart: successor.start,
    overlapDays,
    message: `${taskDisplayName(predecessor)} 종료가 ${taskDisplayName(successor)} 시작보다 ${overlapDays}일 늦습니다.`,
  });
}

function dependencyPairKey(fromId, toId) {
  return `${normalizeId(fromId)}->${normalizeId(toId)}`;
}

function annotateRowsWithDependencyConflicts(rows, conflicts) {
  const taskCounts = new Map();
  conflicts.forEach((conflict) => {
    taskCounts.set(conflict.fromId, (taskCounts.get(conflict.fromId) || 0) + 1);
    taskCounts.set(conflict.toId, (taskCounts.get(conflict.toId) || 0) + 1);
  });
  rows.forEach((row) => {
    if (row.kind === "task" && row.task) {
      row.dependencyConflictCount = taskCounts.get(row.task.id) || 0;
      return;
    }
    const ids = new Set(row.taskIds || []);
    row.dependencyConflictCount = conflicts.filter((conflict) => ids.has(conflict.fromId) || ids.has(conflict.toId)).length;
  });
}

function workloadRisksForRows(rows) {
  const dayAssignees = new Map();
  const tasks = rows.filter((row) => row.kind === "task" && row.task).map((row) => row.task);

  tasks.forEach((task) => {
    if (isDoneTask(task)) return;
    const assignees = assigneeNamesForTask(task);
    if (!assignees.length) return;
    const dates = workloadDatesForTask(task);
    assignees.forEach((assignee) => {
      dates.forEach((date) => {
        const key = `${assignee}|${date}`;
        if (!dayAssignees.has(key)) dayAssignees.set(key, { assignee, date, tasks: [] });
        dayAssignees.get(key).tasks.push(task);
      });
    });
  });

  const risks = [];
  dayAssignees.forEach((entry) => {
    const uniqueTasks = uniqueTasksById(entry.tasks);
    const projectKeys = new Set(uniqueTasks.map(workloadProjectKey).filter(Boolean));
    if (uniqueTasks.length < 2 || projectKeys.size < 2) return;
    risks.push({
      assignee: entry.assignee,
      date: entry.date,
      tasks: uniqueTasks,
      count: uniqueTasks.length,
      projectCount: projectKeys.size,
      tone: uniqueTasks.length >= 3 || projectKeys.size >= 3 ? "bad" : "warn",
    });
  });

  return risks.sort(
    (a, b) =>
      b.count - a.count ||
      b.projectCount - a.projectCount ||
      compareDate(a.date, b.date) ||
      compareText(a.assignee, b.assignee),
  );
}

function assigneeNamesForTask(task) {
  return [...new Set(
    String(task?.assignee || "")
      .split(/[,·]/g)
      .map((name) => name.trim())
      .filter((name) => name && !isMachineAssigneeName(name)),
  )];
}

function isMachineAssigneeName(value) {
  const text = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(text) || /^[0-9a-f]{24,}$/i.test(text);
}

function workloadDatesForTask(task) {
  if (!task?.start || !task?.end) return [];
  const span = Math.max(0, daysBetween(task.start, task.end));
  const cappedSpan = Math.min(span, 30);
  const dates = [];
  for (let offset = 0; offset <= cappedSpan; offset += 1) {
    dates.push(shiftDate(task.start, offset));
  }
  return dates;
}

function workloadProjectKey(task) {
  const channel = normalizeChannelName(task.channel);
  const project = canonicalProjectKey(resolveProjectAliasName(task.channel || "", task.project || task.title || ""));
  return channel && project ? `${channel}:${project}` : "";
}

function annotateRowsWithWorkloadRisks(rows, risks) {
  const taskCounts = new Map();
  (risks || []).forEach((risk) => {
    (risk.tasks || []).forEach((task) => {
      taskCounts.set(task.id, (taskCounts.get(task.id) || 0) + 1);
    });
  });
  rows.forEach((row) => {
    if (row.kind === "task" && row.task) {
      row.workloadRiskCount = taskCounts.get(row.task.id) || 0;
      return;
    }
    const ids = new Set(row.taskIds || []);
    row.workloadRiskCount = (risks || []).filter((risk) => (risk.tasks || []).some((task) => ids.has(task.id))).length;
  });
}

function applyRiskRowFilter(rows, risk) {
  if (!risk) return rows;
  return rows.filter((row) => rowMatchesRiskFilter(row, risk));
}

function rowMatchesRiskFilter(row, risk) {
  if (risk === "dependency") return Number(row.dependencyConflictCount || 0) > 0;
  if (risk === "workload") return Number(row.workloadRiskCount || 0) > 0;
  if (risk === "any") return Number(row.dependencyConflictCount || 0) > 0 || Number(row.workloadRiskCount || 0) > 0;
  return true;
}

function isAutoHiddenTask(task) {
  if (isWonheePauseTask(task)) return false;
  const channel = String(task.channel || "").replace(/\s+/g, "");
  const detail = [task.detail, task.category, task.title].filter(Boolean).join(" ").replace(/\s+/g, "");
  return (
    channel === "미지정채널" ||
    channel === "미지정" ||
    channel === "전체" ||
    channel.includes("기타일정") ||
    channel.includes("대행") ||
    channel.includes("외주") ||
    channel === "휴가" ||
    /휴가|휴재|휴방|연차|반차|회식|워크숍|워크샵/i.test(`${channel} ${detail}`)
  );
}

function isAlwaysVisibleChannel(channel) {
  const normalized = pinnedChannelKey(channel);
  return PINNED_CHANNELS.some((item) => pinnedChannelKey(item.name) === normalized);
}

function isClientHiddenChannel(channel) {
  const normalized = normalizeChannelName(channel);
  return Boolean(normalized && Array.isArray(state.hiddenChannels) && state.hiddenChannels.includes(normalized));
}

function pinnedChannelKey(channel) {
  return String(channel || "").replace(/[\s!_-]+/g, "").toLowerCase();
}

function sameChannelName(a, b) {
  return normalizeChannelName(a) === normalizeChannelName(b);
}

function normalizeChannelName(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function firstScheduleTask(tasks) {
  return tasks.find(isScheduleTask) || tasks[0] || null;
}

function rangeOf(tasks) {
  const start = tasks.reduce((min, task) => (compareDate(task.start, min) < 0 ? task.start : min), tasks[0].start);
  const end = tasks.reduce((max, task) => (compareDate(task.end, max) > 0 ? task.end : max), tasks[0].end);
  return { start, end };
}

function renderConnection() {
  if (!state.connection) {
    els.connectionLine.textContent = "";
    delete els.connectionLine.dataset.embedMode;
    return;
  }
  const loaded = state.loadedAt ? ` · ${formatTime(state.loadedAt)}` : "";
  const fixedEmbed = Boolean(state.embed?.notionReady);
  const embedMode = state.embed?.mode || "";
  const embedLabel = fixedEmbed
    ? "고정 공개 임베드"
    : embedMode === "temporary"
      ? "임시 공개 임베드"
      : state.embed?.localEmbedUrl
        ? "로컬 고정 임베드"
        : "임시 임베드";
  els.connectionLine.dataset.embedMode = fixedEmbed ? "fixed" : "temporary";
  els.connectionLine.textContent = `${state.connection.label}${loaded} · ${embedLabel} · 자동 동기화`;
}

function renderStatusBanner() {
  const banner = currentStatusBanner();
  if (!banner) {
    els.statusBanner.hidden = true;
    return;
  }

  els.statusBanner.hidden = false;
  els.statusBanner.dataset.tone = banner.tone;
  els.statusBannerTitle.textContent = banner.title;
  els.statusBannerDetail.textContent = banner.detail;
  els.statusBannerButton.textContent = banner.button;
  state.statusBannerPanel = banner.panel;
}

function currentStatusBanner() {
  if (!state.connection || !state.diagnostics) return null;

  const fixedEmbed = Boolean(state.embed?.notionReady);
  const temporaryEmbed = state.embed?.mode === "temporary" || state.tunnel?.running;
  const diagnostics = state.diagnostics || {};
  const report = projectReviewReport();
  const urgentReviewCount = reviewHighPriorityCount(report);
  const hiddenTasks = Number(diagnostics.hiddenTasks || 0);
  const hiddenProjects = Number(diagnostics.hiddenProjects || 0);
  const sideIssues = statusSideIssueText({ hiddenTasks, hiddenProjects, urgentReviewCount });

  if (!fixedEmbed) {
    return {
      tone: temporaryEmbed ? "warn" : "warn",
      title: temporaryEmbed ? "임시 공개 주소 사용 중" : "고정 운영 주소 필요",
      detail: temporaryEmbed
        ? `노션 임베드 블록은 임시 주소로 자동 갱신되어 확인 가능합니다. 다만 터널을 다시 만들거나 PC를 끄면 주소가 바뀌므로 운영용으로는 고정 HTTPS 주소가 필요합니다.${sideIssues}`
        : `같은 PC에서는 로컬 주소로 확인할 수 있고, 운영 패널에서 임시 공개 주소를 켜면 노션 임베드도 자동 갱신됩니다. 노션 웹/공유용 상시 운영에는 고정 HTTPS 주소가 필요합니다.${sideIssues}`,
      button: temporaryEmbed ? "임베드 확인" : "임베드 설정",
      panel: "embed",
    };
  }

  if (hiddenTasks > 0) {
    return {
      tone: "warn",
      title: "개별 숨김 정리 필요",
      detail: `개별 숨김 ${hiddenTasks}개가 남아 있어 같은 프로젝트가 다시 보일 수 있습니다. 프로젝트 숨김은 ${hiddenProjects}개입니다.`,
      button: "숨김 열기",
      panel: "hidden",
    };
  }

  if (urgentReviewCount > 0) {
    return {
      tone: "warn",
      title: "검토 후보 확인 필요",
      detail: `촬영/업로드가 갈라졌거나 업로드 누락 가능성이 높은 후보 ${urgentReviewCount}개가 있습니다.`,
      button: "검토 열기",
      panel: "review",
    };
  }

  return null;
}

function statusSideIssueText({ hiddenTasks, hiddenProjects, urgentReviewCount }) {
  const items = [];
  if (hiddenTasks > 0) items.push(`개별 숨김 ${hiddenTasks}개`);
  if (hiddenProjects > 0) items.push(`프로젝트 숨김 ${hiddenProjects}개`);
  if (urgentReviewCount > 0) items.push(`긴급 검토 ${urgentReviewCount}개`);
  return items.length ? ` 함께 확인할 항목: ${items.join(" · ")}.` : "";
}

function openStatusBannerPanel() {
  if (state.statusBannerPanel === "review") {
    openReviewPanel();
    return;
  }
  if (state.statusBannerPanel === "hidden") {
    openHiddenPanel();
    return;
  }
  if (state.statusBannerPanel === "embed") {
    openOperationPanel();
    window.requestAnimationFrame(() => {
      const target = state.embed?.notionReady
        ? els.embedUrlField
        : els.publicUrlField || els.fixedCommandField || els.embedUrlField;
      target?.focus();
      target?.select?.();
    });
    return;
  }
  openOperationPanel();
}

function renderOpsSummary({ dependencyConflicts = [], workloadRisks = [] } = {}) {
  if (!state.connection || !state.rows.length) {
    els.opsSummary.hidden = true;
    return;
  }

  const taskRows = state.rows.filter((row) => row.kind === "task" && row.task);
  const projectRows = state.rows.filter((row) => row.kind === "project" && !row.hiddenOnly);
  const visibleTaskIds = new Set(projectRows.flatMap((row) => row.taskIds || []));
  const totalTaskCount = Number(state.diagnostics?.visibleTasks || state.tasks.length || 0);
  const uploadOnlyProjects = projectRows.filter((row) => row.issue === "upload-only").length;
  const missingUploadProjects = projectRows.filter((row) => row.issue === "missing-upload").length;
  const visibleReviewProjects = uploadOnlyProjects + missingUploadProjects;
  const reviewReport = projectReviewReport();
  const urgentReviewCount = reviewHighPriorityCount(reviewReport);
  const reviewActionTotal = reviewActionCount(reviewReport);
  const reviewActionChip = urgentReviewCount
    ? { label: "긴급 검토", value: urgentReviewCount, tone: "bad", action: "urgent-review" }
    : reviewActionTotal
      ? { label: "검토 액션", value: reviewActionTotal, tone: "warn", action: "review-action" }
      : null;
  const fixedEmbed = Boolean(state.embed?.notionReady);
  const localEmbed = Boolean(state.embed?.localEmbedUrl);
  const embedSummary = fixedEmbed ? { value: "공개고정", tone: "ok" } : localEmbed ? { value: "로컬고정", tone: "warn" } : { value: "임시", tone: "bad" };
  const filterSummary = currentViewConditionLabel();

  const items = [
    { label: "상세일정", value: `${visibleTaskIds.size}/${totalTaskCount || visibleTaskIds.size}`, tone: "ok", action: "filter" },
    reviewActionChip,
    filterSummary ? { label: "조건", value: filterSummary, tone: "warn", action: "filter" } : null,
    filterSummary ? { label: "전체", value: "보기", tone: "ok", action: "clear-filters" } : null,
    { label: "프로젝트", value: projectRows.length, tone: "ok" },
    { label: "업로드 없음", value: missingUploadProjects, tone: missingUploadProjects ? "warn" : "ok", action: "missing-upload" },
    { label: "업로드만", value: uploadOnlyProjects, tone: uploadOnlyProjects ? "warn" : "ok", action: "upload-only" },
    { label: "화면 검토", value: visibleReviewProjects, tone: visibleReviewProjects ? "warn" : "ok", action: "issue" },
    { label: "의존성", value: dependencyConflicts.length, tone: dependencyConflicts.length ? "bad" : "ok", action: "dependency" },
    { label: "임베드", value: embedSummary.value, tone: embedSummary.tone, action: "operation" },
  ].filter(Boolean);

  els.opsSummary.hidden = false;
  els.opsSummary.innerHTML = `
    <strong>${escapeHtml(currentViewTitle())}</strong>
    <div class="ops-summary-items">
      ${items.map(opsSummaryItemMarkup).join("")}
    </div>
  `;
}

function currentViewTitle() {
  const mode = currentViewMode();
  return `${mode ? viewModeLabel(mode) : "필터"} 보기`;
}

function currentViewConditionLabel() {
  const labels = activeFilterLabels();
  if (!labels.length) return "";
  return labels.join(" · ");
}

function opsSummaryItemMarkup(item) {
  const value = String(item.value ?? "");
  const actionable = Boolean(item.action);
  const tag = actionable ? "button" : "span";
  const attrs = actionable ? `type="button" data-ops-action="${escapeHtml(item.action)}"` : "";
  return `
    <${tag} class="ops-summary-chip ${escapeHtml(item.tone || "ok")}" ${attrs}>
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </${tag}>
  `;
}

function handleOpsSummaryClick(event) {
  const button = event.target.closest("[data-ops-action]");
  if (!button) return;
  const action = button.dataset.opsAction || "";
  if (["overdue", "upload-only", "missing-upload", "issue", "workload", "dependency", "completed"].includes(action)) {
    applyOpsSummaryFilter(action);
    return;
  }
  if (action === "urgent-review" || action === "review-action") {
    state.reviewQuery = action === "urgent-review" ? "high" : "action";
    els.reviewSearchInput.value = state.reviewQuery;
    openReviewPanel();
    renderReviewPanel();
    return;
  }
  if (action === "filter") {
    openFilterPanel();
    return;
  }
  if (action === "clear-filters") {
    resetFilters();
    return;
  }
  openOperationPanel();
}

function applyOpsSummaryFilter(action) {
  const filters = defaultFilters();
  if (action === "overdue") filters.date = "overdue";
  if (action === "upload-only") filters.issue = "upload-only";
  if (action === "missing-upload") filters.issue = "missing-upload";
  if (action === "issue") filters.issue = "issue";
  if (action === "workload") {
    filters.date = state.filters.date || "upcoming";
    filters.risk = "workload";
  }
  if (action === "dependency") {
    filters.date = state.filters.date || "upcoming";
    filters.risk = "dependency";
  }
  state.filters = filters;
  state.search = "";
  if (action === "completed") {
    state.showCompleted = true;
  } else if (action === "overdue") {
    state.showCompleted = false;
  }
  els.searchInput.value = "";
  clearSelection(false);
  syncViewControls();
  saveViewPrefs();
  render();
  scheduleOpsFilterFocus(action);
  showToast(`${opsSummaryFilterLabel(action)} 보기로 전환했습니다.`);
}

function scheduleOpsFilterFocus(action) {
  window.requestAnimationFrame(() => focusOpsFilterResult(action));
}

function focusOpsFilterResult(action) {
  if (!state.rows.length || state.drag || state.selectionDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag) return;
  const row = firstOpsFilterResultRow(action);
  if (!row?.start || !row?.end) return;

  const rowIndex = state.rows.findIndex((item) => item.id === row.id);
  if (rowIndex >= 0) {
    const rowHeight = currentRowHeight();
    const targetTop = Math.max(0, rowIndex * rowHeight - rowHeight * 2);
    const maxTop = Math.max(0, els.ganttScroll.scrollHeight - els.ganttScroll.clientHeight);
    els.ganttScroll.scrollTo({
      top: clamp(targetTop, 0, maxTop),
      left: els.ganttScroll.scrollLeft,
      behavior: "smooth",
    });
  }

  focusDateRangeInTimeline(row.start, row.end, { center: true });
}

function firstOpsFilterResultRow(action) {
  const rows = state.rows.filter((row) => !row.hiddenOnly && row.start && row.end);
  if (!rows.length) return null;
  if (action === "overdue") return rows.find((row) => row.kind === "task" && row.task && compareDate(row.end, todayString()) < 0 && !isDoneTask(row.task)) || rows[0];
  if (action === "upload-only") return rows.find((row) => row.kind === "project" && row.issue === "upload-only") || rows[0];
  if (action === "missing-upload") return rows.find((row) => row.kind === "project" && row.issue === "missing-upload") || rows[0];
  if (action === "issue") return rows.find((row) => row.kind === "project" && ["upload-only", "missing-upload"].includes(row.issue)) || rows[0];
  if (action === "workload") return rows.find((row) => Number(row.workloadRiskCount || 0) > 0) || rows[0];
  if (action === "dependency") return rows.find((row) => Number(row.dependencyConflictCount || 0) > 0) || rows[0];
  if (action === "completed") return rows.find((row) => row.kind === "project" && row.issue === "completed") || rows[0];
  return rows.find((row) => row.kind === "project") || rows[0];
}

function opsSummaryFilterLabel(action) {
  if (action === "overdue") return "지연";
  if (action === "upload-only") return "업로드만";
  if (action === "missing-upload") return "업로드 없음";
  if (action === "issue") return "검토 필요";
  if (action === "workload") return "담당 중복";
  if (action === "dependency") return "의존성 충돌";
  if (action === "completed") return "완료 포함";
  return "운영";
}

function renderHeaders(start, end, dayWidth, bodyHeight) {
  const months = [];
  let cursor = startOfMonth(parseDate(start));
  const endDate = parseDate(end);

  while (cursor <= endDate) {
    const monthStart = maxDate(cursor, parseDate(start));
    const nextMonth = addMonths(cursor, 1);
    const monthEnd = minDate(addDays(nextMonth, -1), endDate);
    const left = daysBetween(start, formatDate(monthStart)) * dayWidth;
    const width = (daysBetween(formatDate(monthStart), formatDate(monthEnd)) + 1) * dayWidth;
    months.push(`<div class="month-cell" style="left:${left}px;width:${width}px">${cursor.getUTCFullYear()}.${String(cursor.getUTCMonth() + 1).padStart(2, "0")}</div>`);
    cursor = nextMonth;
  }

  const ticks = [];
  const tickEvery = headerTickInterval(start, end, dayWidth);
  for (let index = 0; index <= daysBetween(start, end); index += tickEvery) {
    const date = addDays(parseDate(start), index);
    const left = index * dayWidth;
    const width = tickEvery * dayWidth;
    const isDaily = tickEvery === 1;
    const isMonthStart = date.getUTCDate() === 1;
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const classes = [
      "tick-cell",
      isDaily ? "is-daily" : "",
      isDaily && isMonthStart ? "is-month-start" : "",
      isDaily && isWeekend ? "is-weekend" : "",
    ].filter(Boolean).join(" ");
    ticks.push(`<div class="${classes}" style="left:${left}px;width:${width}px" title="${fullDateLabel(date)}">${timelineTickLabel(date, isDaily, dayWidth)}</div>`);
  }

  els.monthHeader.innerHTML = months.join("");
  els.tickHeader.innerHTML = ticks.join("");
  els.gridLayer.innerHTML = timelineMarkerMarkup(start, end, dayWidth, bodyHeight);

  const today = todayString();
  const todayOffset = daysBetween(start, today);
  if (todayOffset >= 0 && todayOffset <= daysBetween(start, end)) {
    els.todayLine.hidden = false;
    els.todayLine.style.left = `${todayOffset * dayWidth}px`;
    els.todayLine.style.height = `${bodyHeight}px`;
  } else {
    els.todayLine.hidden = true;
  }
}

function headerTickInterval(start, end, dayWidth) {
  const defaultInterval = ZOOM[state.zoom].tickEvery;
  if (state.zoom === "week") return 1;
  if (dayWidth < DAILY_HEADER_MIN_DAY_WIDTH) return defaultInterval;
  const visibleWidth = Math.max(0, Number(els.ganttScroll?.clientWidth || 0) - currentTableWidth());
  const visibleDays = visibleWidth > 0 ? Math.ceil(visibleWidth / dayWidth) : daysBetween(start, end) + 1;
  return visibleDays <= DAILY_HEADER_MAX_VISIBLE_DAYS ? 1 : defaultInterval;
}

function timelineTickLabel(date, isDaily, dayWidth) {
  if (!isDaily || dayWidth >= 30) return shortDate(date);
  if (date.getUTCDate() === 1) return shortDate(date);
  return String(date.getUTCDate());
}

function fullDateLabel(date) {
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(date.getUTCDate()).padStart(2, "0")}`;
}

function timelineMarkerMarkup(start, end, dayWidth, bodyHeight) {
  const markers = [];
  const totalDays = daysBetween(start, end) + 1;
  for (let index = 0; index < totalDays; index += 1) {
    const date = addDays(parseDate(start), index);
    const left = index * dayWidth;
    const day = date.getUTCDay();
    if (day === 0 || day === 6) {
      markers.push(`<div class="timeline-weekend" style="left:${left}px;width:${dayWidth}px;height:${bodyHeight}px"></div>`);
    }
    if (date.getUTCDate() === 1) {
      markers.push(`<div class="timeline-month-boundary" style="left:${left}px;height:${bodyHeight}px"></div>`);
    }
  }
  return markers.join("");
}

function renderRows(rows, criticalTaskIds) {
  const rowHeight = currentRowHeight();
  els.taskTable.style.height = `${Math.max(rows.length * rowHeight, 240)}px`;
  els.taskTable.innerHTML = rows
    .map((row) => {
      const selected = rowSelectionClass(row);
      const critical = row.kind === "task" && criticalTaskIds.has(row.task.id) ? " is-critical" : "";
      const issue = row.issue ? ` is-issue-${escapeHtml(row.issue)}` : "";
      const dependencyConflict = row.dependencyConflictCount ? " is-dependency-conflict" : "";
      const workloadConflict = row.workloadRiskCount ? " is-workload-conflict" : "";
      const reordering = state.rowReorderDrag?.rowId === row.id ? " is-reordering" : "";
      const leaf = row.leafOnly ? " is-leaf" : "";
      const range = row.hiddenOnly ? "숨김 유지" : `${dateLabel(row.start)}-${dateLabel(row.end)}`;
      const nameTitle = row.hiddenOnly ? row.title : `${row.title} · 더블클릭해 이름 수정`;
      const rangeTitle = row.hiddenOnly ? range : `${range} · 더블클릭해 기간 수정`;
      if (row.kind === "task") {
        const meta = row.subtitle || "";
        const metaTitle = `${meta} · 더블클릭해 상태/담당 수정`;
        const metaMarkup = meta
          ? `<span class="task-meta" data-meta-edit="true" title="${escapeHtml(metaTitle)}">${escapeHtml(meta)}</span>`
          : "";
        return `
          <div class="task-row${selected}${critical}${dependencyConflict}${workloadConflict}" role="button" tabindex="0" data-task-id="${escapeHtml(row.id)}" style="--task-color:${row.color};--progress:${row.progress}%">
            <span class="task-main level-task">
              <span class="task-dot"></span>
              <span class="task-text">
                <span class="task-name-line">
                  <span class="task-name" data-inline-edit="true" title="${escapeHtml(nameTitle)}">${escapeHtml(row.title)}</span>
                  ${healthChipMarkup(row.health)}
                  ${dependencyConflictChipMarkup(row)}
                  ${workloadRiskChipMarkup(row)}
                </span>
                ${metaMarkup}
              </span>
            </span>
            <span class="task-range" data-range-edit="true" title="${escapeHtml(rangeTitle)}">${range}</span>
          </div>
        `;
      }

      return `
        <div class="task-row group-row ${row.kind}${issue}${dependencyConflict}${workloadConflict}${reordering}${leaf}${row.hiddenOnly ? " is-readonly" : ""}" data-row-id="${escapeHtml(row.id)}" style="--task-color:${row.color};--progress:${row.progress}%">
          <span class="task-main level-${row.kind}">
            <span class="group-caret">${row.collapsed ? "▸" : "▾"}</span>
            <span class="task-text">
              <span class="task-name-line">
                <span class="task-name" data-inline-edit="true" title="${escapeHtml(nameTitle)}">${escapeHtml(row.title)}</span>
                ${healthChipMarkup(row.health)}
                ${dependencyConflictChipMarkup(row)}
                ${workloadRiskChipMarkup(row)}
              </span>
              <span class="task-meta" title="${escapeHtml(row.subtitle)}">${escapeHtml(row.subtitle)}</span>
              ${progressMiniMarkup(row)}
            </span>
          </span>
          <span class="task-range" data-range-edit="true" title="${escapeHtml(rangeTitle)}">${range}</span>
        </div>
      `;
    })
    .join("");

  els.taskTable.querySelectorAll("[data-task-id]").forEach((row) => {
    const editableName = row.querySelector("[data-inline-edit]");
    editableName?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    editableName?.addEventListener("dblclick", (event) => {
      const model = state.rows.find((item) => item.id === row.dataset.taskId);
      if (model) startInlineNameEdit(event, model);
    });
    const editableRange = row.querySelector("[data-range-edit]");
    editableRange?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    editableRange?.addEventListener("dblclick", (event) => {
      const model = state.rows.find((item) => item.id === row.dataset.taskId);
      if (model) startInlineRangeEdit(event, model);
    });
    const editableMeta = row.querySelector("[data-meta-edit]");
    editableMeta?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    editableMeta?.addEventListener("dblclick", (event) => {
      const model = state.rows.find((item) => item.id === row.dataset.taskId);
      if (model) startInlineMetaEdit(event, model);
    });
    row.addEventListener("click", (event) => {
      if (state.suppressClick) return;
      const model = state.rows.find((item) => item.id === row.dataset.taskId);
      if (model) selectRow(model, event);
    });
    row.addEventListener("contextmenu", (event) => openTaskContext(event, row.dataset.taskId));
  });
  els.taskTable.querySelectorAll("[data-row-id]").forEach((element) => {
    const caret = element.querySelector(".group-caret");
    caret?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleGroup(element.dataset.rowId);
    });
    const editableName = element.querySelector("[data-inline-edit]");
    editableName?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    editableName?.addEventListener("dblclick", (event) => {
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) startInlineNameEdit(event, row);
    });
    const editableRange = element.querySelector("[data-range-edit]");
    editableRange?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    editableRange?.addEventListener("dblclick", (event) => {
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) startInlineRangeEdit(event, row);
    });
    element.addEventListener("pointerdown", (event) => {
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) startRowReorderDrag(event, row);
    });
    element.addEventListener("mousedown", (event) => {
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) startRowReorderDrag(event, row);
    });
    element.addEventListener("click", (event) => {
      if (state.suppressClick) return;
      const model = state.rows.find((item) => item.id === element.dataset.rowId);
      if (!model) return;
      selectRow(model, event, { focusTimeline: false });
    });
    element.addEventListener("dblclick", (event) => {
      if (event.target.closest("[data-inline-edit], [data-range-edit], button")) return;
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) openGroupEditor(row);
    });
    element.addEventListener("contextmenu", (event) => {
      const row = state.rows.find((item) => item.id === element.dataset.rowId);
      if (row) openRowContext(event, row);
    });
  });
}

function healthChipMarkup(health) {
  if (!health?.label) return "";
  return `<span class="task-health ${escapeHtml(health.tone || "muted")}">${escapeHtml(health.label)}</span>`;
}

function dependencyConflictChipMarkup(row) {
  const count = Number(row?.dependencyConflictCount || 0);
  if (!count) return "";
  return `<span class="task-health bad" title="선행/후속 날짜 충돌 ${count}개">의존성 ${count}</span>`;
}

function workloadRiskChipMarkup(row) {
  return "";
}

function progressMiniMarkup(row) {
  if (!row || row.hiddenOnly) return "";
  const progress = clamp(Number(row.progress || 0), 0, 100);
  return `
    <span class="task-progress-mini" aria-hidden="true">
      <span style="width:${progress}%"></span>
    </span>
  `;
}

function startInlineNameEdit(event, row) {
  event.preventDefault();
  event.stopPropagation();
  if (!row || row.hiddenOnly) return;
  const nameElement = event.currentTarget;
  const originalName = row.title || "";
  const input = document.createElement("input");
  input.className = "inline-edit-input";
  input.type = "text";
  input.value = originalName;
  input.setAttribute("aria-label", "이름 수정");
  nameElement.replaceWith(input);
  input.focus();
  input.select();

  let isDone = false;
  const finish = async (shouldSave) => {
    if (isDone) return;
    isDone = true;
    const nextName = input.value.trim();
    if (!shouldSave || !nextName || nextName === originalName) {
      render();
      return;
    }
    await saveInlineName(row, nextName);
  };

  input.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      finish(true);
    }
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      finish(false);
    }
  });
  input.addEventListener("blur", () => finish(true));
}

async function saveInlineName(row, nextName) {
  if (row.kind === "channel" || row.kind === "project") {
    await renameGroup({
      kind: row.kind,
      title: row.title,
      taskIds: taskIdsForRow(row),
    }, nextName);
    return;
  }

  if (row.kind !== "task" || !row.task) return;
  const previous = { ...row.task };
  const next = { ...row.task, detail: nextName };
  replaceTask(next);
  render();
  showToast(`"${row.title}" 이름을 저장하는 중입니다.`);

  try {
    const result = await patchTask(next.id, taskPatch(next));
    mergeSavedTask(next.id, result.task);
    pushUndo(`"${row.title}" 이름 수정`, () => restoreTaskSnapshots([previous]));
    render();
    showToast(`상세일정을 "${nextName}"으로 바꿨습니다.`);
  } catch (error) {
    replaceTask(previous);
    render();
    showToast(error.message);
  }
}

function startInlineRangeEdit(event, row) {
  event.preventDefault();
  event.stopPropagation();
  if (!row || row.hiddenOnly) return;
  closeRangePopover();

  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const popover = document.createElement("div");
  popover.className = "range-popover";
  popover.innerHTML = `
    <label>
      <span>시작</span>
      <input class="range-start-input" type="date" value="${escapeHtml(row.start)}" />
    </label>
    <label>
      <span>종료</span>
      <input class="range-end-input" type="date" value="${escapeHtml(row.end)}" />
    </label>
    <div class="range-popover-actions">
      <button class="range-cancel-button" type="button">취소</button>
      <button class="range-save-button" type="button">저장</button>
    </div>
  `;
  document.body.appendChild(popover);

  const width = popover.offsetWidth || 260;
  const height = popover.offsetHeight || 140;
  popover.style.left = `${clamp(rect.right - width, 12, Math.max(12, window.innerWidth - width - 12))}px`;
  popover.style.top = `${clamp(rect.bottom + 6, 12, Math.max(12, window.innerHeight - height - 12))}px`;

  const startInput = popover.querySelector(".range-start-input");
  const endInput = popover.querySelector(".range-end-input");
  const finish = async (shouldSave) => {
    if (!document.body.contains(popover)) return;
    if (!shouldSave) {
      closeRangePopover();
      return;
    }
    const nextStart = startInput.value;
    const nextEnd = compareDate(endInput.value, nextStart) < 0 ? nextStart : endInput.value;
    closeRangePopover();
    await saveInlineRange(row, nextStart, nextEnd);
  };

  popover.addEventListener("pointerdown", (pointerEvent) => pointerEvent.stopPropagation());
  popover.querySelector(".range-cancel-button").addEventListener("click", () => finish(false));
  popover.querySelector(".range-save-button").addEventListener("click", () => finish(true));
  popover.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      finish(false);
    }
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      finish(true);
    }
  });
  setTimeout(() => {
    const outsideHandler = (pointerEvent) => {
      if (!popover.contains(pointerEvent.target)) {
        closeRangePopover();
        document.removeEventListener("pointerdown", outsideHandler);
      }
    };
    document.addEventListener("pointerdown", outsideHandler);
  }, 0);
  startInput.focus();
}

function closeRangePopover() {
  document.querySelector(".range-popover")?.remove();
}

async function saveInlineRange(row, nextStart, nextEnd) {
  if (!nextStart || !nextEnd) return;
  if (row.start === nextStart && row.end === nextEnd) {
    render();
    return;
  }

  const rowTaskIds = taskIdsForRow(row);
  if (row.kind === "task" && rowTaskIds.length > 1) {
    const originals = tasksForIds(rowTaskIds);
    const nextTasks = originals.map((task) => ({ ...task, start: nextStart, end: nextEnd }));
    await applyBulkTaskUpdates(nextTasks, `"${row.title}" 묶음 기간 수정`, { rescheduleMode: rangeRescheduleMode(row.task, { ...row.task, start: nextStart, end: nextEnd }) });
    return;
  }

  if (row.kind === "task" && row.task) {
    const next = { ...row.task, start: nextStart, end: nextEnd };
    await applyBulkTaskUpdates([next], `"${row.title}" 기간 수정`, { rescheduleMode: rangeRescheduleMode(row.task, next) });
    return;
  }

  if (["channel", "project"].includes(row.kind)) {
    await saveGroupRangeOverride(row, { start: nextStart, end: nextEnd }, "기간 수정");
    return;
  }

  const ids = new Set(taskIdsForRow(row));
  const originals = state.tasks.filter((task) => ids.has(task.id));
  if (!originals.length) return;
  const currentRange = rangeOf(originals);
  const nextById = new Map();

  if (nextStart !== currentRange.start) {
    groupResizeStartTasks(originals, currentRange, nextStart).forEach((task) => nextById.set(task.id, task));
  }

  if (nextEnd !== currentRange.end) {
    const baseline = originals.map((task) => nextById.get(task.id) || task);
    groupResizeEndTasks(baseline, currentRange, nextEnd).forEach((task) => nextById.set(task.id, task));
  }

  const nextTasks = [...nextById.values()];
  if (!nextTasks.length) return;
  const mode = nextEnd !== currentRange.end ? "end" : "";
  await applyBulkTaskUpdates(nextTasks, `"${row.title}" 기간 수정`, { rescheduleMode: mode });
}

async function saveGroupRangeOverride(row, nextRange, action = "기간 수정") {
  if (!row || !["channel", "project"].includes(row.kind) || !nextRange?.start || !nextRange?.end) return;
  const previousRanges = { ...(state.groupRanges || {}) };
  setGroupRangeOverride(row.id, nextRange);
  render();
  saveViewPrefs();
  pushUndo(
    `"${row.title}" ${action}`,
    async () => {
      state.groupRanges = previousRanges;
      saveViewPrefs();
      render();
    },
    async () => {
      setGroupRangeOverride(row.id, nextRange);
      saveViewPrefs();
      render();
    },
  );
  showToast(`"${row.title}" ${action}했습니다.`);
}

function rangeRescheduleMode(original, next) {
  const startDelta = daysBetween(original.start, next.start);
  const endDelta = daysBetween(original.end, next.end);
  if (startDelta && startDelta === endDelta) return "move";
  if (endDelta) return "end";
  return "";
}

function startInlineMetaEdit(event, row) {
  event.preventDefault();
  event.stopPropagation();
  if (!row?.task) return;
  closeMetaPopover();

  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const popover = document.createElement("div");
  popover.className = "meta-popover";
  popover.innerHTML = `
    <label>
      <span>상태</span>
      <input class="meta-status-input" type="text" list="statusOptions" value="${escapeHtml(row.task.status || "")}" placeholder="시작 전" />
    </label>
    <label>
      <span>담당</span>
      <input class="meta-assignee-input" type="text" value="${escapeHtml(row.task.assignee || "")}" placeholder="담당자" />
    </label>
    <div class="meta-popover-actions">
      <button class="meta-cancel-button" type="button">취소</button>
      <button class="meta-save-button" type="button">저장</button>
    </div>
  `;
  document.body.appendChild(popover);

  const width = popover.offsetWidth || 260;
  const height = popover.offsetHeight || 140;
  popover.style.left = `${clamp(rect.left, 12, Math.max(12, window.innerWidth - width - 12))}px`;
  popover.style.top = `${clamp(rect.bottom + 6, 12, Math.max(12, window.innerHeight - height - 12))}px`;

  const statusInput = popover.querySelector(".meta-status-input");
  const assigneeInput = popover.querySelector(".meta-assignee-input");
  const finish = async (shouldSave) => {
    if (!document.body.contains(popover)) return;
    if (!shouldSave) {
      closeMetaPopover();
      return;
    }
    const status = statusInput.value.trim() || "시작 전";
    const assignee = assigneeInput.value.trim();
    closeMetaPopover();
    await saveInlineMeta(row, status, assignee);
  };

  popover.addEventListener("pointerdown", (pointerEvent) => pointerEvent.stopPropagation());
  popover.querySelector(".meta-cancel-button").addEventListener("click", () => finish(false));
  popover.querySelector(".meta-save-button").addEventListener("click", () => finish(true));
  popover.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      finish(false);
    }
    if (keyEvent.key === "Enter") {
      keyEvent.preventDefault();
      finish(true);
    }
  });
  setTimeout(() => {
    const outsideHandler = (pointerEvent) => {
      if (!popover.contains(pointerEvent.target)) {
        closeMetaPopover();
        document.removeEventListener("pointerdown", outsideHandler);
      }
    };
    document.addEventListener("pointerdown", outsideHandler);
  }, 0);
  statusInput.focus();
  statusInput.select();
}

function closeMetaPopover() {
  document.querySelector(".meta-popover")?.remove();
}

async function saveInlineMeta(row, status, assignee) {
  if (!row?.task) return;
  if ((row.task.status || "") === status && (row.task.assignee || "") === assignee) {
    render();
    return;
  }

  const previous = { ...row.task };
  const next = { ...row.task, status, assignee };
  replaceTask(next);
  render();
  showToast(`"${row.title}" 상태/담당을 저장하는 중입니다.`);

  try {
    const result = await patchTask(next.id, taskPatch(next));
    mergeSavedTask(next.id, result.task);
    pushUndo(`"${row.title}" 상태/담당 수정`, () => restoreTaskSnapshots([previous]));
    render();
    showToast(`"${row.title}" 상태/담당을 저장했습니다.`);
  } catch (error) {
    replaceTask(previous);
    render();
    showToast(error.message);
  }
}

function renderBars(rows, dayWidth, criticalTaskIds) {
  els.barLayer.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const rowHeight = currentRowHeight();
  const editableTaskIds = new Set(state.tasks.map((task) => task.id));
  const taskById = new Map();
  for (const task of state.tasks) {
    [task.id, task.originId].filter(Boolean).forEach((id) => {
      taskById.set(id, task);
      taskById.set(normalizeId(id), task);
    });
  }
  const baselineMap = baselineTaskMap();

  rows.forEach((row, index) => {
    if (row.hiddenOnly) return;
    const baseline = baselineRangeForRow(row, baselineMap, taskById);
    if (baseline) {
      const baselineLeft = daysBetween(state.rangeStart, baseline.start) * dayWidth;
      const baselineWidth = Math.max((daysBetween(baseline.start, baseline.end) + 1) * dayWidth, row.kind === "task" ? 18 : 28);
      const baselineRect = visibleBarRect(baselineLeft, baselineWidth, row.kind);
      if (baselineRect.width > 0) {
        const baselineBar = document.createElement("div");
        baselineBar.className = `baseline-bar ${row.kind}${baselineRect.clippedStart ? " is-clipped-start" : ""}${baselineRect.clippedEnd ? " is-clipped-end" : ""}`;
        baselineBar.style.left = `${baselineRect.left}px`;
        baselineBar.style.top = `${baselineBarTop(index, row.kind, rowHeight)}px`;
        baselineBar.style.width = `${baselineRect.width}px`;
        baselineBar.title = baselineTitle(row, baseline);
        fragment.appendChild(baselineBar);
      }
    }

    const rawLeft = daysBetween(state.rangeStart, row.start) * dayWidth;
    const rawWidth = Math.max((daysBetween(row.start, row.end) + 1) * dayWidth, row.kind === "task" ? 18 : 28);
    const { left, width, clippedStart, clippedEnd } = visibleBarRect(rawLeft, rawWidth, row.kind);
    if (width <= 0) return;
    const isGroupRow = row.kind === "channel" || row.kind === "project";
    const editableGroup = row.kind === "task" || isGroupRow || (row.taskIds || []).some((id) => editableTaskIds.has(id));
    const bar = document.createElement("div");
    bar.className = `gantt-bar ${row.kind}${rowSelectionClass(row)}${row.isPause ? " is-pause" : ""}${row.kind === "task" && criticalTaskIds.has(row.task.id) ? " is-critical" : ""}`;
    if (row.issue) bar.classList.add(`is-issue-${row.issue}`);
    if (row.dependencyConflictCount) bar.classList.add("is-dependency-conflict");
    if (row.workloadRiskCount) bar.classList.add("is-workload-conflict");
    if (clippedStart) bar.classList.add("is-clipped-start");
    if (clippedEnd) bar.classList.add("is-clipped-end");
    if (!editableGroup) bar.classList.add("is-readonly");
    if (editableGroup && row.kind !== "task" && width < 56) bar.classList.add("is-short-group-bar");
    bar.style.setProperty("--task-color", row.isPause ? PAUSE_COLOR : row.color);
    bar.style.setProperty("--progress", `${row.progress || 0}%`);
    bar.style.left = `${left}px`;
    bar.style.top = `${barTop(index, row.kind, rowHeight)}px`;
    bar.style.width = `${width}px`;
    bar.dataset.rowId = row.id;
    bar.title = barTitle(row);

    if (row.kind === "task") {
      bar.dataset.taskId = row.task.id;
      const taskLabel = taskBarLabel(row);
      bar.classList.toggle("is-label-hidden", !taskLabel);
      bar.innerHTML = `
        <span class="bar-progress"></span>
        <span class="bar-label">${escapeHtml(taskLabel)}</span>
        <span class="dependency-dot left" data-dependency-side="left" title="선행 연결"></span>
        <span class="dependency-dot right" data-dependency-side="right" title="후속 연결"></span>
        <span class="bar-handle left" data-mode="resize-start" title="시작일 조정"></span>
        <span class="bar-move" data-mode="move" title="일정 이동"></span>
        <span class="bar-handle right" data-mode="resize-end" title="종료일 조정"></span>
      `;
      bar.addEventListener("click", (event) => {
        if (state.drag?.moved || state.suppressClick) return;
        selectRow(row, event);
        event.stopPropagation();
      });
      bar.addEventListener("contextmenu", (event) => openTaskContext(event, row.task.id, dateFromTimelineEvent(event)));
      bar.addEventListener("pointerdown", (event) => {
        if (isSelectionModifier(event)) return;
        if (event.button !== 0 || event.target.dataset.mode) return;
        startDrag(event, row.task.id, "move", taskIdsForRow(row));
      });
      bar.querySelectorAll("[data-mode]").forEach((target) => {
        target.addEventListener("pointerdown", (event) => {
          if (isSelectionModifier(event)) return;
          startDrag(event, row.task.id, target.dataset.mode, taskIdsForRow(row));
        });
      });
      bar.querySelectorAll("[data-dependency-side]").forEach((target) => {
        target.addEventListener("pointerdown", (event) => startDependencyDrag(event, row.task.id, target.dataset.dependencySide));
      });
    } else {
      const groupLabel = row.kind === "channel" ? "" : row.title;
      const outsideLabel = shouldUseOutsideProjectLabel(row, width, clippedEnd);
      const labelMarkup = outsideLabel
        ? `<span class="bar-label-outside">${escapeHtml(groupLabel)}</span>`
        : `<span class="bar-label">${escapeHtml(groupLabel)}</span>`;
      bar.classList.toggle("has-outside-label", outsideLabel);
      bar.classList.toggle("is-label-hidden", !groupLabel || outsideLabel);
      bar.title = editableGroup ? `${barTitle(row)} · 가운데 드래그: 이동 / 양끝 드래그: 기간 조정` : `${barTitle(row)} · 숨김 요약 행은 원본 일정이 없어 직접 조정할 수 없습니다`;
      bar.innerHTML = editableGroup
        ? `
          <span class="bar-progress"></span>
          ${labelMarkup}
          <span class="bar-handle left" data-mode="resize-start" title="시작일 조정"></span>
          <span class="bar-move" data-mode="move" title="그룹 이동"></span>
          <span class="bar-handle right" data-mode="resize-end" title="종료일 조정"></span>
        `
        : `
          <span class="bar-progress"></span>
          ${labelMarkup}
        `;
      bar.addEventListener("contextmenu", (event) => openRowContext(event, row, dateFromTimelineEvent(event)));
      bar.addEventListener("click", (event) => {
        if (state.drag?.moved || state.suppressClick) return;
        selectRow(row, event);
        event.stopPropagation();
      });
      bar.addEventListener("dblclick", (event) => {
        if (event.target.dataset.mode) return;
        openGroupEditor(row);
        event.stopPropagation();
      });
      if (editableGroup) {
        bar.addEventListener("pointerdown", (event) => {
          if (isSelectionModifier(event)) return;
          if (event.button !== 0 || event.target.dataset.mode) return;
          startGroupDrag(event, row, "move");
        });
        bar.querySelectorAll("[data-mode]").forEach((target) => {
          target.addEventListener("pointerdown", (event) => {
            if (isSelectionModifier(event)) return;
            startGroupDrag(event, row, target.dataset.mode);
          });
        });
      }
    }

    fragment.appendChild(bar);
  });

  els.barLayer.appendChild(fragment);
}

function baselineTaskMap() {
  const map = new Map();
  if (!state.showBaseline || !state.baseline?.exists || !Array.isArray(state.baseline.tasks)) return map;
  for (const task of state.baseline.tasks) {
    const keys = [task.key, task.id, task.originId].map(normalizeId).filter(Boolean);
    for (const key of keys) {
      if (!map.has(key)) map.set(key, task);
    }
  }
  return map;
}

function baselineRangeForRow(row, baselineMap, taskById) {
  if (!baselineMap.size) return null;
  if (row.kind === "task" && !(row.taskIds || []).length) return baselineForTask(row.task, baselineMap);
  const matches = (row.taskIds || [])
    .map((id) => taskById.get(id) || taskById.get(normalizeId(id)) || { id })
    .map((task) => baselineForTask(task, baselineMap))
    .filter(Boolean);
  if (!matches.length) return null;
  return {
    start: matches.reduce((min, task) => compareDate(task.start, min) < 0 ? task.start : min, matches[0].start),
    end: matches.reduce((max, task) => compareDate(task.end, max) > 0 ? task.end : max, matches[0].end),
    taskCount: matches.length,
  };
}

function baselineForTask(task, baselineMap) {
  if (!task) return null;
  return [task.originId, task.id].map(normalizeId).filter(Boolean).map((key) => baselineMap.get(key)).find(Boolean) || null;
}

function baselineBarTop(index, kind, rowHeight) {
  const top = barTop(index, kind, rowHeight);
  if (kind === "channel") return top + 11;
  if (kind === "project") return top + 27;
  return top + 36;
}

function baselineTitle(row, baseline) {
  const label = state.baseline?.createdAtLabel ? `기준선 ${state.baseline.createdAtLabel}` : "기준선";
  const range = `${dateLabel(baseline.start)}-${dateLabel(baseline.end)}`;
  const diff = baselineDriftLabel(row, baseline);
  return [label, row.title, range, diff].filter(Boolean).join(" · ");
}

function baselineDriftLabel(row, baseline) {
  const startDelta = daysBetween(baseline.start, row.start);
  const endDelta = daysBetween(baseline.end, row.end);
  if (!startDelta && !endDelta) return "변경 없음";
  return [`시작 ${signedDays(startDelta)}`, `종료 ${signedDays(endDelta)}`].join(" / ");
}

function signedDays(value) {
  if (!value) return "0일";
  return `${value > 0 ? "+" : ""}${value}일`;
}

function visibleBarRect(rawLeft, rawWidth, kind) {
  const minWidth = kind === "task" ? 18 : 28;
  const timelineWidth = timelinePixelWidth();
  const stickyLeft = visibleTimelineLeft();
  const rawRight = rawLeft + rawWidth;
  const clippedStart = rawLeft < stickyLeft || rawLeft < 0;
  const clippedEnd = rawRight > timelineWidth;
  const left = Math.max(stickyLeft, 0, rawLeft);
  const right = Math.min(timelineWidth, rawRight);
  const width = Math.max(right - left, clippedStart || clippedEnd ? minWidth : 0);
  if (rawRight < stickyLeft || right < 0 || left > timelineWidth) return { left: rawLeft, width: 0, clippedStart, clippedEnd };
  return { left, width, clippedStart, clippedEnd };
}

function visibleTimelineLeft() {
  const scrollLeft = Number(els.ganttScroll?.scrollLeft || 0);
  return Number.isFinite(scrollLeft) ? Math.max(0, scrollLeft) : 0;
}

function timelinePixelWidth() {
  const cssWidth = parseFloat(getComputedStyle(els.ganttContent).getPropertyValue("--timeline-width"));
  if (Number.isFinite(cssWidth) && cssWidth > 0) return cssWidth;
  return els.timelineBody?.offsetWidth || 0;
}

function barTitle(row) {
  return [
    row.title,
    row.health?.label,
    row.statusReason,
    row.dependencyConflictCount ? `의존성 충돌 ${row.dependencyConflictCount}개` : "",
    row.start && row.end ? `${dateLabel(row.start)}-${dateLabel(row.end)}` : "",
    row.subtitle,
  ].filter(Boolean).join(" · ");
}

function taskBarLabel(row) {
  const text = [row.title, row.task?.detail, row.task?.category].filter(Boolean).join(" ");
  if (/(촬영|업로드|릴리즈|게시|발행)/.test(text)) return "";
  return row.title;
}

function shouldUseOutsideProjectLabel(row, width, clippedEnd) {
  if (row.kind !== "project" || !row.title || clippedEnd) return false;
  const estimatedLabelWidth = Math.min(280, Math.max(126, String(row.title).length * 8 + 28));
  return width < estimatedLabelWidth;
}

function renderDependencies(rows, dayWidth, criticalTaskIds, dependencyConflicts = []) {
  els.dependencyLayer.innerHTML = "";
  if (!state.showDependencies) return;
  const conflictPairs = new Set(dependencyConflicts.map((conflict) => dependencyPairKey(conflict.fromId, conflict.toId)));

  const taskRows = rows
    .map((row, index) => ({ row, index }))
    .filter((item) => item.row.kind === "task");
  const byId = new Map();
  taskRows.forEach((item) => {
    byId.set(normalizeId(item.row.task.id), item);
    if (item.row.task.originId) byId.set(normalizeId(item.row.task.originId), item);
  });

  const pairs = new Set();
  const paths = [];
  for (const item of taskRows) {
    const current = item.row.task;
    const predecessorIds = current.predecessorIds || [];
    for (const predecessorId of predecessorIds) {
      const predecessor = byId.get(normalizeId(predecessorId));
      if (!predecessor) continue;
      const key = `${predecessor.row.task.id}->${current.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      paths.push(dependencyPath(predecessor, item, dayWidth, criticalTaskIds, conflictPairs));
    }

    const successorIds = current.successorIds || [];
    for (const successorId of successorIds) {
      const successor = byId.get(normalizeId(successorId));
      if (!successor) continue;
      const key = `${current.id}->${successor.row.task.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      paths.push(dependencyPath(item, successor, dayWidth, criticalTaskIds, conflictPairs));
    }
  }

  els.dependencyLayer.innerHTML = `
    <defs>
      <marker id="dependencyArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 8 4 L 0 8 z"></path>
      </marker>
    </defs>
    ${paths.join("")}
  `;
  els.dependencyLayer.querySelectorAll("[data-dependency-from][data-dependency-to]").forEach((path) => {
    path.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeDependency(path.dataset.dependencyFrom, path.dataset.dependencyTo);
    });
  });
}

function dependencyPath(from, to, dayWidth, criticalTaskIds, conflictPairs = new Set()) {
  const fromEnd = daysBetween(state.rangeStart, from.row.end) * dayWidth + dayWidth;
  const toStart = daysBetween(state.rangeStart, to.row.start) * dayWidth;
  const rowHeight = currentRowHeight();
  const y1 = from.index * rowHeight + rowHeight / 2;
  const y2 = to.index * rowHeight + rowHeight / 2;
  const gap = Math.max(22, Math.abs(toStart - fromEnd) / 2);
  const x1 = fromEnd;
  const x2 = toStart;
  const c1 = x1 + gap;
  const c2 = x2 - gap;
  const critical = criticalTaskIds.has(from.row.task.id) && criticalTaskIds.has(to.row.task.id) ? " is-critical" : "";
  const conflict = conflictPairs.has(dependencyPairKey(from.row.task.id, to.row.task.id)) ? " is-conflict" : "";
  return `<path class="dependency-path${critical}${conflict}" data-dependency-from="${escapeHtml(from.row.task.id)}" data-dependency-to="${escapeHtml(to.row.task.id)}" d="M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}" marker-end="url(#dependencyArrow)"></path>`;
}

function renderSwatches(selectedColor) {
  els.colorSwatches.innerHTML = PALETTE.map(
    (color) => `<button class="swatch${color === selectedColor ? " is-selected" : ""}" style="--swatch:${color}" data-color="${color}" type="button" aria-label="${color}"></button>`,
  ).join("");
  els.colorSwatches.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      els.colorField.value = button.dataset.color;
      renderSwatches(button.dataset.color);
    });
  });
  els.colorField.value = selectedColor;
}

function renderDetailPresets(selectedDetail = "") {
  if (!els.detailPresetButtons) return;
  const selectedKey = normalizePresetText(selectedDetail);
  els.detailPresetButtons.innerHTML = DETAIL_PRESETS.map((preset) => `
    <button
      class="${normalizePresetText(preset.value) === selectedKey ? "is-selected" : ""}"
      type="button"
      data-detail-preset="${escapeHtml(preset.value)}"
      style="--preset-color:${preset.color}">
      ${escapeHtml(preset.label)}
    </button>
  `).join("");
}

function applyDetailPreset(detail) {
  const preset = detailPresetFor(detail);
  els.detailField.value = preset?.value || detail || "";
  renderSwatches(preset?.color || colorForDetail(detail, els.colorField.value || PALETTE[0]));
  renderDetailPresets(els.detailField.value);
}

function detailPresetFor(value) {
  const text = normalizePresetText(value);
  if (!text) return null;
  return DETAIL_PRESETS.find((preset) => text.includes(normalizePresetText(preset.value))) || null;
}

function colorForDetail(value, fallback = PALETTE[0]) {
  if (isWonheePauseLabel(value)) return PAUSE_COLOR;
  return detailPresetFor(value)?.color || fallback || PALETTE[0];
}

function normalizePresetText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function isWonheePauseTask(task) {
  return isWonheePauseLabel([task?.channel, task?.project, task?.title, task?.detail, task?.category].filter(Boolean).join(" "));
}

function isWonheePauseLabel(value) {
  const text = String(value || "");
  return /(\uC6D0\uC774|\uB9AC\uC13C\uB290\s*\uC6D0\uC774)/i.test(text) && /(\uD734\uC7AC|\uD734\uBC29)/i.test(text);
}

function renderColorLegend() {
  els.colorLegend.innerHTML = COLOR_LEGEND.map(
    (item) => `
      <span class="legend-item">
        <span class="legend-dot" style="--legend-color:${item.color}"></span>
        <span>${escapeHtml(item.label)}</span>
      </span>
    `,
  ).join("");
}

function renderOptions() {
  const statuses = [...new Set(state.tasks.map((task) => task.status).filter(Boolean))];
  els.statusOptions.innerHTML = statuses.map((status) => `<option value="${escapeHtml(status)}"></option>`).join("");

  const details = [...new Set(state.tasks.map((task) => task.detail || task.category).filter(Boolean))];
  els.detailOptions.innerHTML = details.map((detail) => `<option value="${escapeHtml(detail)}"></option>`).join("");
  const assignees = taskAssigneeOptions(state.tasks);

  populateFilterSelect(els.channelFilterSelect, "전체 채널", state.tasks.map((task) => task.channel).filter(Boolean), state.filters.channel);
  populateFilterSelect(els.detailFilterSelect, "전체 상세일정", details, state.filters.detail);
  populateFilterSelect(els.statusFilterSelect, "전체 상태", statuses, state.filters.status);
  populateFilterSelect(els.assigneeFilterSelect, "전체 담당", assignees, state.filters.assignee);
  els.dateFilterSelect.value = state.filters.date || "";
  els.kindFilterSelect.value = state.filters.kind || "";
  els.issueFilterSelect.value = state.filters.issue || "";
}

function taskAssigneeOptions(tasks) {
  return [...new Set((tasks || []).flatMap((task) => assigneeNames(task.assignee)))].sort(compareText);
}

function assigneeNames(value) {
  return String(value || "")
    .split(/[,/·\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function populateFilterSelect(select, allLabel, values, currentValue) {
  const uniqueValues = [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort(compareText);
  if (currentValue && !uniqueValues.includes(currentValue)) uniqueValues.unshift(currentValue);
  select.innerHTML = [
    `<option value="">${escapeHtml(allLabel)}</option>`,
    ...uniqueValues.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
  ].join("");
  select.value = currentValue || "";
}

function renderFilterState() {
  const active = activeFilterLabels();
  els.filterButton.textContent = active.length ? `필터 ${active.length}` : "필터";
  els.filterButton.classList.toggle("is-active", active.length > 0);
  els.filterSummary.textContent = active.length ? active.join(" · ") : "전체 보기";
  syncViewModeButtons();
  els.filterPanel.querySelectorAll("[data-filter-preset]").forEach((button) => {
    const preset = button.dataset.filterPreset;
    button.classList.toggle("is-active", state.filters.date === preset || state.filters.kind === preset || state.filters.issue === preset);
  });
  if (!els.filterPanel.hidden) renderFilterMetrics();
}

function renderFilterMetrics() {
  const filtered = filteredTasks();
  const scheduleCount = filtered.filter((task) => isScheduleTask(task) && !isAutoHiddenTask(task)).length;
  const channelCount = new Set(filtered.map((task) => normalizeChannelName(task.channel)).filter(Boolean)).size;
  const projectCount = new Set(filtered.map((task) => `${normalizeChannelName(task.channel)}:${canonicalProjectKey(task.project || task.title)}`).filter(Boolean)).size;
  els.filterMetrics.innerHTML = [
    statusItemMarkup("표시 대상", `${scheduleCount}개 상세일정`, "ok"),
    statusItemMarkup("채널", `${channelCount}개`, "ok"),
    statusItemMarkup("프로젝트", `${projectCount}개`, "ok"),
    statusItemMarkup("기간", dateFilterLabel(state.filters.date), state.filters.date ? "warn" : "ok"),
    statusItemMarkup("업무", kindFilterLabel(state.filters.kind), state.filters.kind ? "warn" : "ok"),
    statusItemMarkup("검토", issueFilterLabel(state.filters.issue), state.filters.issue ? "warn" : "ok"),
    statusItemMarkup("리스크", state.filters.risk ? riskFilterLabel(state.filters.risk) : "전체 리스크", state.filters.risk ? "warn" : "ok"),
    statusItemMarkup("완료 프로젝트", state.showCompleted ? "함께 표시" : "숨김", state.showCompleted ? "warn" : "ok"),
  ].join("");
}

function activeFilterLabels() {
  return [
    state.search ? `검색 ${state.search}` : "",
    state.filters.channel ? `채널 ${state.filters.channel}` : "",
    state.filters.detail ? `상세 ${state.filters.detail}` : "",
    state.filters.status ? `상태 ${state.filters.status}` : "",
    state.filters.assignee ? `담당 ${state.filters.assignee}` : "",
    state.filters.date ? `기간 ${dateFilterLabel(state.filters.date)}` : "",
    state.filters.kind ? `업무 ${kindFilterLabel(state.filters.kind)}` : "",
    state.filters.issue ? `검토 ${issueFilterLabel(state.filters.issue)}` : "",
    state.filters.risk ? `리스크 ${riskFilterLabel(state.filters.risk)}` : "",
  ].filter(Boolean);
}

function dateFilterLabel(value) {
  const labels = {
    active: "진행 중",
    upcoming: "오늘 이후",
    next30: "향후 30일",
    overdue: "지난 미완료",
  };
  return labels[value] || "전체 기간";
}

function kindFilterLabel(value) {
  const labels = {
    shoot: "촬영",
    edit: "편집",
    upload: "업로드",
  };
  return labels[value] || "전체 업무";
}

function issueFilterLabel(value) {
  const labels = {
    issue: "검토 필요",
    "upload-only": "업로드만 확인",
    "missing-upload": "업로드 없음",
  };
  return labels[value] || "전체 검토";
}

function riskFilterLabel(value) {
  const labels = {
    workload: "담당 중복",
    dependency: "의존성 충돌",
    any: "전체 리스크",
  };
  return labels[value] || "전체 리스크";
}

function toggleGroup(rowId) {
  if (state.collapsedRows.has(rowId)) {
    state.collapsedRows.delete(rowId);
  } else {
    state.collapsedRows.add(rowId);
  }
  saveViewPrefs();
  render();
}

function collapseAllGroups() {
  state.rows
    .filter((row) => ["channel", "project"].includes(row.kind))
    .forEach((row) => state.collapsedRows.add(row.id));
  saveViewPrefs();
  render();
}

function expandAllGroups() {
  state.collapsedRows.clear();
  saveViewPrefs();
  render();
}

function openTimelineContext(event) {
  if (event.target.closest(".gantt-bar")) return;
  const rect = els.timelineBody.getBoundingClientRect();
  const rowIndex = Math.floor((event.clientY - rect.top) / currentRowHeight());
  const row = state.rows[rowIndex];
  if (!row) return;
  openRowContext(event, row, dateFromTimelineEvent(event));
}

function openTaskContext(event, taskId, date = "") {
  const row = state.rows.find((item) => item.kind === "task" && (item.id === taskId || item.task?.id === taskId || (item.taskIds || []).includes(taskId)));
  if (row) openRowContext(event, row, date);
}

function openRowContext(event, row, date = "") {
  event.preventDefault();
  event.stopPropagation();

  const rowTaskIds = taskIdsForRow(row);
  const useSelection = row.kind === "task" && state.selectedIds.size > 1 && rowTaskIds.some((id) => state.selectedIds.has(id));
  const taskIds = useSelection ? [...state.selectedIds] : rowTaskIds;
  const restoreActions = useSelection ? [] : hiddenRestoreActionsForRow(row);
  const canUseEmptyChannel = !useSelection && row.kind === "channel" && row.emptyOnly;
  if (!taskIds.length && !restoreActions.length && !canUseEmptyChannel) return;

  if (!useSelection && taskIds.length) {
    applySelection(taskIds, row.id, row.kind === "task" && taskIds.length === 1);
  }

  state.context = {
    taskId: !useSelection && row.kind === "task" && taskIds.length === 1 ? row.task.id : "",
    taskIds,
    rowId: row.id,
    kind: useSelection ? "selection" : row.kind,
    channel: row.channel || row.task?.channel || (row.kind === "channel" ? row.title : ""),
    project: row.kind === "project" ? row.title : row.task?.project || "",
    title: useSelection ? `${taskIds.length}개 선택` : row.title,
    summary: row.hiddenLabel || row.subtitle || "",
    hiddenOnly: Boolean(row.hiddenOnly),
    emptyOnly: Boolean(row.emptyOnly),
    restoreActions,
    date,
  };
  render();
  showContextMenu(event.clientX, event.clientY, {
    summary: contextSummary(state.context) || state.context.summary || row.title,
    canCreate: !useSelection && !row.hiddenOnly && (Boolean(date) || ["channel", "project"].includes(row.kind)),
    canEdit: !useSelection && !row.hiddenOnly && ((row.kind === "task" && taskIds.length === 1) || ["channel", "project"].includes(row.kind)),
    canRename: !useSelection && taskIds.length > 0 && ["channel", "project"].includes(row.kind) && !row.hiddenOnly,
    canMerge: canMergeContextProjects(useSelection ? "selection" : row.kind, taskIds),
    canDone: tasksForIds(taskIds).some((task) => !isDoneTask(task)),
    canRestore: !useSelection && restoreActions.length > 0,
    hasDate: Boolean(date),
    kind: state.context.kind,
  });
}

function showContextMenu(x, y, options) {
  els.contextMenuSummary.textContent = options.summary || "";
  els.contextMenuSummary.hidden = !options.summary;
  els.contextCreateButton.textContent = contextCreateActionLabel(options.kind);
  els.contextCreateButton.hidden = !options.canCreate;
  els.contextRenameButton.hidden = !options.canRename;
  els.contextMergeButton.hidden = !options.canMerge;
  els.contextEditButton.hidden = !options.canEdit;
  els.contextDoneButton.hidden = !options.canDone;
  els.contextRestoreButton.hidden = !options.canRestore;
  els.contextDoneButton.textContent = contextActionLabel(options.kind, "완료 처리");
  els.contextHideButton.textContent = contextActionLabel(options.kind, "숨기기");
  els.contextHideButton.hidden = Boolean(options.canRestore);
  els.contextDeleteButton.textContent = contextActionLabel(options.kind, "삭제");
  els.contextDeleteButton.hidden = Boolean(options.canRestore);
  els.contextDateDivider.hidden = !options.hasDate;
  [els.contextMoveButton, els.contextStartButton, els.contextEndButton].forEach((button) => {
    button.hidden = !options.hasDate;
  });

  els.contextMenu.hidden = false;
  const width = els.contextMenu.offsetWidth || 200;
  const height = els.contextMenu.offsetHeight || 160;
  els.contextMenu.style.left = `${clamp(x, 8, Math.max(8, window.innerWidth - width - 8))}px`;
  els.contextMenu.style.top = `${clamp(y, 8, Math.max(8, window.innerHeight - height - 8))}px`;
}

function hideContextMenu() {
  els.contextMenu.hidden = true;
  state.context = null;
}

function contextSummary(context) {
  if (!context?.taskIds?.length) return "";
  const tasks = tasksForIds(context.taskIds);
  if (!tasks.length) return `${context.taskIds.length}개 일정`;
  const range = rangeOf(tasks);
  const projectCount = contextProjectCount(context);
  const channels = new Set(tasks.map((task) => normalizeChannelName(task.channel)).filter(Boolean));
  const parts = [
    `${tasks.length}개 일정`,
    `${projectCount}개 프로젝트`,
    `${channels.size || 1}개 채널`,
    dateRangeLabel(range),
  ].filter(Boolean);
  return parts.join(" · ");
}

function contextProjectCount(context) {
  if (context?.kind === "project") return 1;
  if (context?.kind === "channel") {
    const ids = new Set(context.taskIds || []);
    const visibleProjects = state.rows.filter(
      (row) =>
        row.kind === "project" &&
        sameChannelName(row.channel, context.title) &&
        taskIdsForRow(row).some((id) => ids.has(id)),
    );
    if (visibleProjects.length) return visibleProjects.length;
  }
  return projectGroupsForTaskIds(context.taskIds).length || 1;
}

function contextActionLabel(kind, action) {
  if (kind === "selection") return `선택 ${action}`;
  if (kind === "channel") return `채널 ${action}`;
  if (kind === "project") return `프로젝트 ${action}`;
  return `일정 ${action}`;
}

function contextCreateActionLabel(kind) {
  if (kind === "channel") return "프로젝트 만들기";
  if (kind === "project") return "상세일정 만들기";
  return "새 일정 만들기";
}

async function createTaskFromContext() {
  const context = state.context;
  if (!context) return;
  hideContextMenu();
  const copy = contextCreateModalCopy(context);
  await createTaskFromSeed(contextTaskSeed(context), {
    title: copy.title,
    summary: copy.summary,
  });
}

function contextCreateModalCopy(context) {
  if (context?.kind === "channel") {
    return {
      title: "이 채널에 프로젝트 만들기",
      summary: "선택한 채널을 기본값으로 새 프로젝트 일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.",
    };
  }
  if (context?.kind === "project") {
    return {
      title: "이 프로젝트에 상세일정 만들기",
      summary: "선택한 프로젝트를 기본값으로 새 상세일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.",
    };
  }
  return {
    title: "이 위치에 새 일정 만들기",
    summary: "우클릭한 날짜와 행 정보를 기본값으로 새 일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.",
  };
}

function contextTaskSeed(context) {
  const sourceTask = context.taskId ? state.tasks.find((task) => task.id === context.taskId) : null;
  const channel = sourceTask?.channel || context.channel || (context.kind === "channel" ? context.title : "") || "새 채널";
  const project = sourceTask?.project || context.project || (context.kind === "project" ? context.title : "") || "새 프로젝트";
  const start = context.date || sourceTask?.start || todayString();
  return {
    title: project || "새 상세일정",
    channel,
    project,
    detail: "상세일정",
    start,
    end: shiftDate(start, 1),
    status: "시작 전",
    assignee: sourceTask?.assignee || "",
    color: sourceTask?.color || PALETTE[Math.floor(Math.random() * PALETTE.length)],
  };
}

async function renameContextGroup() {
  const context = state.context;
  if (!context?.taskIds?.length || !["channel", "project"].includes(context.kind)) return;

  const fieldLabel = context.kind === "channel" ? "채널명" : "프로젝트명";
  hideContextMenu();
  const input = await openInputModal({
    title: `${fieldLabel} 수정`,
    summary: `${contextSummary(context)} 기준으로 ${fieldLabel}을 바꿉니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`,
    badge: "이름 수정",
    confirmText: "이름 저장",
    fields: [
      { name: "name", label: fieldLabel, value: context.title, placeholder: fieldLabel },
    ],
  });
  const nextName = input?.name?.trim();
  if (!nextName || nextName === context.title) {
    return;
  }

  await renameGroup(context, nextName);
}

function canMergeContextProjects(kind, taskIds) {
  const groups = projectGroupsForTaskIds(taskIds);
  if (kind === "project") return groups.length === 1;
  return groups.length > 1 && new Set(groups.map((group) => normalizeChannelName(group.channel))).size === 1;
}

async function mergeContextProjects() {
  const context = state.context;
  if (!context?.taskIds?.length) return;

  const groups = projectGroupsForTaskIds(context.taskIds);
  if (!groups.length) {
    hideContextMenu();
    return;
  }

  const channelKeys = new Set(groups.map((group) => normalizeChannelName(group.channel)));
  if (channelKeys.size > 1) {
    hideContextMenu();
    showToast("같은 채널 안의 프로젝트만 병합할 수 있습니다.");
    return;
  }

  const channel = groups[0].channel;
  const defaultTarget = context.kind === "project" ? context.title : groups[0].project;
  hideContextMenu();
  const input = await openInputModal({
    title: "프로젝트 병합",
    summary: `${groups.length}개 프로젝트명을 하나의 기준 이름으로 묶습니다. 원본 DB는 건드리지 않고 병합 기준만 저장합니다.`,
    badge: "병합",
    confirmText: "병합 확인",
    fields: [
      { name: "target", label: "기준 프로젝트명", value: defaultTarget, placeholder: "프로젝트명" },
    ],
  });
  const target = input?.target?.trim();
  if (!target) {
    return;
  }

  const aliases = groups
    .map((group) => group.project)
    .filter((project) => canonicalProjectKey(project) !== canonicalProjectKey(target));

  if (!aliases.length) {
    showToast("이미 같은 프로젝트 기준입니다.");
    return;
  }

  if (!(await confirmProjectMergePreview({
    title: "프로젝트 병합 확인",
    channel,
    target,
    aliases,
    tasks: groups.flatMap((group) => group.ids || []).map((id) => state.tasks.find((task) => task.id === id)).filter(Boolean),
  }))) {
    return;
  }

  try {
    for (const from of aliases) {
      const response = await fetch(apiUrl("/api/project-aliases"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, from, to: target }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "프로젝트 병합 기준을 저장하지 못했습니다.");
      upsertLocalProjectAlias(channel, from, target);
    }
    pushUndo("프로젝트 병합", () => deleteProjectAliases(aliases.map((from) => ({ channel, from }))));
    refreshAfterLocalMutation("project-alias", 250);
    showToast(`프로젝트를 "${target}" 기준으로 묶었습니다.`);
    render();
  } catch (error) {
    showToast(error.message);
  }
}

function projectGroupsForTaskIds(taskIds) {
  const ids = new Set(taskIds || []);
  const groups = new Map();

  state.tasks
    .filter((task) => ids.has(task.id))
    .forEach((task) => {
      const channel = task.channel || "미지정 채널";
      const project = task.project || task.title || "새 프로젝트";
      const key = `${normalizeChannelName(channel)}:${canonicalProjectKey(project)}`;
      if (!groups.has(key)) groups.set(key, { channel, project, ids: [], projects: [] });
      const group = groups.get(key);
      group.ids.push(task.id);
      group.projects.push(...projectHideVariantsForTask(task, project));
    });

  return [...groups.values()].sort((a, b) => compareText(a.channel, b.channel) || compareText(a.project, b.project));
}

function projectHideVariantsForTask(task, fallback = "") {
  const values = [
    fallback,
    task?.project,
    task?.title,
    cleanDisplayProjectName(task?.project || ""),
    cleanDisplayProjectName(task?.title || ""),
    displayProjectName([task].filter(Boolean), fallback),
  ];
  const variants = new Set();
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    variants.add(text);
    const canonical = canonicalProjectKey(text);
    if (!canonical) continue;
    variants.add(canonical);
    projectAliasKeys(canonical).forEach((alias) => variants.add(alias));
  }
  return [...variants].filter(Boolean);
}

function completeProjectGroupsForIds(ids) {
  const selected = new Set(ids || []);
  const coveredIds = new Set();
  const groups = [];

  state.rows
    .filter((row) => row.kind === "project")
    .forEach((row) => {
      const rowIds = taskIdsForRow(row);
      if (!rowIds.length || !rowIds.every((id) => selected.has(id))) return;
      rowIds.forEach((id) => coveredIds.add(id));
      groups.push(...projectGroupsForTaskIds(rowIds));
    });

  return {
    groups: normalizeProjectGroups(groups),
    coveredIds: [...coveredIds],
  };
}

function isCompleteProjectSelection(ids, projectSelection) {
  const uniqueIds = new Set((ids || []).filter(Boolean));
  const coveredIds = new Set(projectSelection?.coveredIds || []);
  if (!uniqueIds.size || !projectSelection?.groups?.length) return false;
  if (coveredIds.size !== uniqueIds.size) return false;
  return [...uniqueIds].every((id) => coveredIds.has(id));
}

async function hideIdsRespectingProjectScope(ids, label = "선택 항목") {
  const uniqueIds = [...new Set(ids || [])].filter(Boolean);
  const projectSelection = completeProjectGroupsForIds(uniqueIds);
  if (isCompleteProjectSelection(uniqueIds, projectSelection)) {
    await hideProjectGroups(projectSelection.groups, `선택한 ${projectSelection.groups.length}개 프로젝트`);
    return;
  }
  await hideTasks(uniqueIds, label);
}

async function deleteIdsRespectingProjectScope(ids, label = "선택 항목") {
  const uniqueIds = [...new Set(ids || [])].filter(Boolean);
  const projectSelection = completeProjectGroupsForIds(uniqueIds);
  if (isCompleteProjectSelection(uniqueIds, projectSelection)) {
    await hideProjectGroups(projectSelection.groups, `선택한 ${projectSelection.groups.length}개 프로젝트`);
    return;
  }
  await deleteTasks(uniqueIds, label);
}

async function hideContextItems() {
  const context = state.context;
  if (!context || (!context.taskIds?.length && context.kind !== "channel")) return;
  hideContextMenu();
  if (context.kind === "channel") {
    await hideChannel(context.title);
    return;
  }
  if (context.kind === "project") {
    await hideProject(context);
    return;
  }
  await hideIdsRespectingProjectScope(context.taskIds, contextLabel(context));
}

async function restoreContextHiddenItem() {
  const context = state.context;
  if (!context) return;
  hideContextMenu();
  const actions = context.restoreActions?.length
    ? context.restoreActions
    : [
        {
          type: context.kind,
          channel: context.channel || context.title,
          project: context.project || context.title,
          id: context.taskId || context.taskIds?.[0] || "",
        },
      ];
  if (!(await confirmRestoreHiddenPreview(actions[0], context.title, contextSummary(context) || context.summary))) return;
  try {
    const remoteActions = [];
    for (const action of actions) {
      if (action.type === "show-completed") {
        state.showCompleted = true;
        continue;
      }
      remoteActions.push(action);
    }
    for (const action of remoteActions) {
      await restoreHidden(action);
    }
    if (actions.some((action) => action.type === "show-completed")) saveViewPrefs();
    await loadTasks();
    if (!els.hiddenPanel.hidden) await loadHiddenState();
    showToast("숨김을 복구했습니다.");
  } catch (error) {
    showToast(error.message);
  }
}

async function deleteContextItems() {
  const context = state.context;
  if (!context || (!context.taskIds?.length && context.kind !== "channel")) return;
  const label = contextLabel(context);
  hideContextMenu();
  if (context.kind === "channel") {
    await hideChannel(context.title);
    return;
  }
  if (context.kind === "project") {
    await hideProject(context);
    return;
  }
  await deleteIdsRespectingProjectScope(context.taskIds, label);
}

async function renameGroup(context, nextName) {
  const uniqueIds = [...new Set(context.taskIds)];
  const previousTasks = state.tasks;
  const snapshots = previousTasks.filter((task) => uniqueIds.includes(task.id)).map((task) => ({ ...task }));
  const field = context.kind === "channel" ? "channel" : "project";
  const label = contextLabel(context);
  const nextTasks = snapshots.map((task) => ({ ...task, [field]: nextName }));

  if (!(await confirmFieldChangePreview({
    title: `${label} 이름 수정 확인`,
    label,
    field,
    fieldLabel: context.kind === "channel" ? "채널명" : "프로젝트명",
    originalTasks: snapshots,
    nextTasks,
    confirmText: "이름 저장",
  }))) {
    render();
    return false;
  }

  state.tasks = state.tasks.map((task) => (uniqueIds.includes(task.id) ? { ...task, [field]: nextName } : task));
  render();
  showToast(`${label} 이름을 저장하는 중입니다.`);

  try {
    for (const id of uniqueIds) {
      const task = state.tasks.find((item) => item.id === id);
      if (!task) continue;
      const result = await patchTask(id, taskPatch(task));
      mergeSavedTask(id, result.task);
    }
    pushUndo(`${label} 이름 수정`, () => restoreTaskSnapshots(snapshots));
    render();
    showToast(`${label} 이름을 "${nextName}"으로 바꿨습니다.`);
    return true;
  } catch (error) {
    state.tasks = previousTasks;
    render();
    showToast(error.message);
    return false;
  }
}

async function hideTasks(ids, label = "선택 항목") {
  const uniqueIds = [...new Set(ids)];
  const previousTasks = state.tasks;
  const previousStubs = state.channelStubs;
  const hiddenTasks = previousTasks.filter((task) => uniqueIds.includes(task.id));
  if (!(await confirmTaskActionPreview({
    title: `${label} 숨김 확인`,
    label,
    action: "숨김",
    confirmText: "숨기기",
    tasks: hiddenTasks,
  }))) return;
  state.tasks = state.tasks.filter((task) => !uniqueIds.includes(task.id));
  state.channelStubs = channelStubsAfterHide(previousStubs, hiddenTasks, state.tasks);
  if (uniqueIds.includes(state.selectedId)) {
    state.selectedId = "";
    state.editorOpen = false;
  }
  uniqueIds.forEach((id) => state.selectedIds.delete(id));
  render();

  try {
    for (const id of uniqueIds) {
      const response = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}/hide`), { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "숨기지 못했습니다.");
    }
    pushUndo(`${label} 숨김`, () => restoreHiddenTaskIds(uniqueIds));
    notifyDataChanged("hide-tasks");
    showToast(`${label} 숨김 처리했습니다.`);
  } catch (error) {
    state.tasks = previousTasks;
    state.channelStubs = previousStubs;
    render();
    showToast(error.message);
  }
}

function channelStubsAfterHide(currentStubs, hiddenTasks, remainingTasks) {
  const stubs = [...(currentStubs || [])];
  const remainingChannels = new Set(remainingTasks.map((task) => normalizeChannelName(task.channel)));
  const grouped = new Map();

  for (const task of hiddenTasks) {
    const channel = task.channel || "미지정 채널";
    const key = normalizeChannelName(channel);
    if (!key || remainingChannels.has(key)) continue;
    if (!grouped.has(key)) grouped.set(key, { name: channel, tasks: [] });
    grouped.get(key).tasks.push(task);
  }

  for (const [key, group] of grouped) {
    if (stubs.some((stub) => normalizeChannelName(stub.name) === key)) continue;
    const range = rangeOf(group.tasks);
    stubs.push({
      name: group.name,
      start: range.start,
      end: range.end,
      taskIds: group.tasks.map((task) => task.id),
    });
  }

  return stubs;
}

async function hideChannel(channelName) {
  const previousTasks = state.tasks;
  const previousStubs = state.channelStubs;
  const hiddenTasks = previousTasks.filter((task) => sameChannelName(task.channel, channelName));
  if (!(await confirmTaskActionPreview({
    title: `채널 "${channelName}" 숨김 확인`,
    label: `채널 "${channelName}"`,
    action: "숨김",
    confirmText: "채널 숨기기",
    tasks: hiddenTasks,
    emptyMessage: "현재 화면에 표시된 일정은 없지만, 채널 숨김 규칙이 저장됩니다.",
  }))) return;
  state.tasks = state.tasks.filter((task) => !sameChannelName(task.channel, channelName));
  state.channelStubs = channelStubsAfterHide(previousStubs, hiddenTasks, state.tasks);
  state.selectedIds.clear();
  state.selectedId = "";
  state.editorOpen = false;
  render();

  try {
    const response = await fetch(apiUrl(`/api/channels/${encodeURIComponent(channelName)}/hide`), { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "채널을 숨기지 못했습니다.");
    pushUndo(`채널 "${channelName}" 숨김`, () => restoreHiddenChannel(channelName));
    notifyDataChanged("hide-channel");
    showToast(`채널 "${channelName}" 숨김 처리했습니다.`);
  } catch (error) {
    state.tasks = previousTasks;
    state.channelStubs = previousStubs;
    render();
    showToast(error.message);
  }
}

async function hideProject(context) {
  const groups = projectGroupsForTaskIds(context.taskIds || []);
  if (!groups.length && (context.channel || context.title) && (context.project || context.title)) {
    groups.push({
      channel: context.channel || "미지정 채널",
      project: context.project || context.title,
      ids: context.taskIds || [],
      projects: [context.project || context.title],
    });
  }
  await hideProjectGroups(groups, contextLabel(context));
}

async function hideProjectGroups(groups, label = "선택 프로젝트") {
  const normalizedGroups = normalizeProjectGroups(groups);
  if (!normalizedGroups.length) return;

  const previousTasks = state.tasks;
  const previousStubs = state.channelStubs;
  const hiddenTasks = tasksMatchingProjectGroups(previousTasks, normalizedGroups);
  const ids = new Set(hiddenTasks.map((task) => task.id));
  const restoreProjects = normalizedGroups.map((group) => ({
    channel: group.channel,
    project: group.project,
    projects: group.projects || [group.project],
    ids: hiddenTasks.filter((task) => taskMatchesProjectGroup(task, group)).map((task) => task.id),
  }));
  const projectsByChannel = groupProjectsByChannel(normalizedGroups);
  if (!(await confirmTaskActionPreview({
    title: `${label} 숨김 확인`,
    label,
    action: "숨김",
    confirmText: "프로젝트 숨기기",
    tasks: hiddenTasks,
    forceProjectItems: true,
  }))) return;

  state.tasks = state.tasks.filter((task) => !ids.has(task.id));
  state.channelStubs = channelStubsAfterHide(previousStubs, hiddenTasks, state.tasks);
  state.selectedIds.clear();
  state.selectedId = "";
  state.editorOpen = false;
  render();

  try {
    for (const [channel, projects] of projectsByChannel) {
      const idsForChannel = normalizedGroups
        .filter((group) => sameChannelName(group.channel, channel))
        .flatMap((group) => hiddenTasks.filter((task) => taskMatchesProjectGroup(task, group)).map((task) => task.id));
      const response = await fetch(apiUrl("/api/projects/hide"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, projects, ids: [...new Set(idsForChannel)] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "프로젝트를 숨기지 못했습니다.");
    }
    pushUndo(`${label} 숨김`, () => restoreHiddenProjects(restoreProjects));
    notifyDataChanged("hide-project");
    showToast(`${label} 숨김 처리했습니다.`);
    await loadTasks();
    if (!els.hiddenPanel.hidden) await loadHiddenState();
  } catch (error) {
    state.tasks = previousTasks;
    state.channelStubs = previousStubs;
    render();
    showToast(error.message);
  }
}

function normalizeProjectGroups(groups) {
  const byKey = new Map();
  for (const group of groups || []) {
    const channel = String(group?.channel || "").trim();
    const project = String(group?.project || "").trim();
    const ids = [...new Set(group?.ids || group?.taskIds || [])].filter(Boolean);
    if (!channel || !project) continue;
    const key = `${normalizeChannelName(channel)}:${canonicalProjectKey(project)}`;
    if (!byKey.has(key)) byKey.set(key, { channel, project, ids: [], projects: [] });
    const target = byKey.get(key);
    target.ids.push(...ids);
    target.projects.push(project, ...(group.projects || []));
  }
  return [...byKey.values()].map((group) => ({
    ...group,
    ids: [...new Set(group.ids)],
    projects: [...new Set(group.projects.map((project) => String(project || "").trim()).filter(Boolean))],
  }));
}

function groupProjectsByChannel(groups) {
  const byChannel = new Map();
  for (const group of groups) {
    if (!byChannel.has(group.channel)) byChannel.set(group.channel, new Set());
    const projects = group.projects?.length ? group.projects : [group.project];
    projects.forEach((project) => byChannel.get(group.channel).add(project));
  }
  return [...byChannel.entries()].map(([channel, projects]) => [channel, [...projects]]);
}

function tasksMatchingProjectGroups(tasks, groups) {
  return (tasks || []).filter((task) => groups.some((group) => taskMatchesProjectGroup(task, group)));
}

function hiddenLookupId(value) {
  return String(value || "")
    .split(":")[0]
    .replace(/-/g, "")
    .toLowerCase();
}

function taskMatchesProjectGroup(task, group) {
  if (!task || !group || !sameChannelName(task.channel, group.channel)) return false;
  const groupIds = new Set([...(group.ids || []), ...(group.taskIds || [])].map(hiddenLookupId).filter(Boolean));
  if (groupIds.size) {
    const taskIds = [task.id, task.originId, String(task.id || "").split(":")[0], String(task.originId || "").split(":")[0]]
      .map(hiddenLookupId)
      .filter(Boolean);
    if (taskIds.some((id) => groupIds.has(id))) return true;
  }
  const groupKeys = (group.projects?.length ? group.projects : [group.project])
    .flatMap((project) => [...projectAliasKeys(canonicalProjectKey(project))])
    .filter(Boolean);
  const taskKeys = projectHideVariantsForTask(task, task.project || task.title || "")
    .flatMap((project) => [...projectAliasKeys(canonicalProjectKey(project))])
    .filter(Boolean);
  return projectKeySetsOverlap(taskKeys, groupKeys);
}

async function deleteTasks(ids, label = "선택 항목") {
  const uniqueIds = [...new Set(ids)];
  const previousTasks = state.tasks;
  const deletedTasks = previousTasks.filter((task) => uniqueIds.includes(task.id));
  if (!(await confirmTaskActionPreview({
    title: `${label} 삭제 확인`,
    label,
    action: "삭제",
    confirmText: "삭제",
    tasks: deletedTasks,
    danger: true,
  }))) return;
  state.tasks = state.tasks.filter((task) => !uniqueIds.includes(task.id));
  if (uniqueIds.includes(state.selectedId)) {
    state.selectedId = "";
    state.editorOpen = false;
  }
  uniqueIds.forEach((id) => state.selectedIds.delete(id));
  render();

  try {
    const results = [];
    for (const id of uniqueIds) {
      const response = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "삭제하지 못했습니다.");
      results.push(result);
    }
    const canUndoAsHidden = uniqueIds.every((id) => !id.startsWith("local-")) && results.every((result) => result.mode === "local");
    if (canUndoAsHidden) pushUndo(`${label} 삭제`, () => restoreHiddenTaskIds(uniqueIds));
    notifyDataChanged("delete-tasks");
    showToast(`${label} 삭제 처리했습니다.`);
  } catch (error) {
    state.tasks = previousTasks;
    render();
    showToast(error.message);
  }
}

function contextLabel(context) {
  if (context.kind === "selection") return `선택한 ${context.taskIds.length}개 일정`;
  if (context.kind === "channel") return `채널 "${context.title}"`;
  if (context.kind === "project") return `프로젝트 "${context.title}"`;
  return `"${selectedTask()?.detail || context.title || "상세일정"}"`;
}

async function applyContextDate(mode) {
  const context = state.context;
  if (!context?.taskIds?.length || !context.date) {
    hideContextMenu();
    return;
  }

  const originals = tasksForIds(context.taskIds).map((task) => ({ ...task }));
  if (!originals.length) {
    hideContextMenu();
    return;
  }

  hideContextMenu();
  const nextTasks = contextDateNextTasks(originals, mode, context.date);
  const changes = nextTasks
    .map((next) => ({ original: originals.find((task) => task.id === next.id), next }))
    .filter((change) => change.original && (change.original.start !== change.next.start || change.original.end !== change.next.end));
  if (!changes.length) {
    showToast("바뀐 날짜가 없습니다.");
    return;
  }

  const action = contextDateActionLabel(mode);
  const label = contextLabel(context);
  if (!(await confirmDateChangePreview({
    title: `${label} ${action} 확인`,
    label,
    originalTasks: changes.map((change) => change.original),
    nextTasks: changes.map((change) => change.next),
    confirmText: "날짜 저장",
  }))) {
    return;
  }

  applySelection(context.taskIds, context.taskId || rowIdForTaskId(context.taskIds[0]), Boolean(context.taskId && context.taskIds.length === 1));
  const rescheduleMode = mode === "move" ? "move" : mode === "end" ? "end" : "";
  await applyBulkTaskUpdates(changes.map((change) => change.next), `${label} ${action}`, { rescheduleMode });
}

function contextDateNextTasks(tasks, mode, date) {
  const originals = uniqueTasksById(tasks || []);
  if (!originals.length) return [];

  if (originals.length === 1) {
    const original = originals[0];
    const next = { ...original };
    if (mode === "move") {
      const duration = daysBetween(original.start, original.end);
      next.start = date;
      next.end = shiftDate(date, duration);
    } else if (mode === "start") {
      next.start = compareDate(date, original.end) <= 0 ? date : original.end;
    } else if (mode === "end") {
      next.end = compareDate(date, original.start) >= 0 ? date : original.start;
    }
    return [next];
  }

  const range = rangeOf(originals);
  if (mode === "move") {
    const deltaDays = daysBetween(range.start, date);
    return originals.map((task) => ({
      ...task,
      start: shiftDate(task.start, deltaDays),
      end: shiftDate(task.end, deltaDays),
    }));
  }
  if (mode === "start") return groupResizeStartTasks(originals, range, date);
  if (mode === "end") return groupResizeEndTasks(originals, range, date);
  return [];
}

function contextDateActionLabel(mode) {
  if (mode === "move") return "이동";
  if (mode === "start") return "시작일 수정";
  if (mode === "end") return "종료일 수정";
  return "날짜 수정";
}

function dateFromTimelineEvent(event) {
  return dateFromTimelineClientX(event.clientX);
}

function dateFromTimelineClientX(clientX) {
  const rect = els.timelineBody.getBoundingClientRect();
  const dayWidth = ZOOM[state.zoom].dayWidth;
  const maxOffset = daysBetween(state.rangeStart, state.rangeEnd);
  const offset = clamp(Math.floor((clientX - rect.left) / dayWidth), 0, maxOffset);
  return shiftDate(state.rangeStart, offset);
}

function startDependencyDrag(event, taskId, side) {
  if (event.button !== 0) return;
  const task = state.tasks.find((item) => item.id === taskId);
  const bar = event.currentTarget.closest(".gantt-bar.task");
  if (!task || !bar) return;

  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);

  const point = dependencyPointForBar(bar, side);
  state.dependencyDrag = {
    fromId: taskId,
    side,
    startX: point.x,
    startY: point.y,
    currentX: point.x,
    currentY: point.y,
    moved: false,
  };
  document.body.classList.add("is-linking");
  applySelection([taskId], rowIdForTaskId(taskId), true);
  updateDependencyDraftPath();
  window.addEventListener("pointermove", moveDependencyDrag);
  window.addEventListener("pointerup", endDependencyDrag, { once: true });
}

function moveDependencyDrag(event) {
  const drag = state.dependencyDrag;
  if (!drag) return;
  event.preventDefault();
  const rect = els.timelineBody.getBoundingClientRect();
  drag.currentX = clamp(event.clientX - rect.left, 0, els.timelineBody.offsetWidth || 0);
  drag.currentY = clamp(event.clientY - rect.top, 0, els.timelineBody.offsetHeight || 0);
  drag.moved = drag.moved || Math.hypot(drag.currentX - drag.startX, drag.currentY - drag.startY) > 4;
  updateDependencyDraftPath();
  highlightDependencyTarget(event.clientX, event.clientY, drag.fromId);
}

async function endDependencyDrag(event) {
  window.removeEventListener("pointermove", moveDependencyDrag);
  const drag = state.dependencyDrag;
  state.dependencyDrag = null;
  document.body.classList.remove("is-linking");
  clearDependencyDraftPath();
  clearDependencyTargetHighlight();
  if (!drag?.moved) return;

  const targetId = dependencyTargetIdAt(event.clientX, event.clientY, drag.fromId);
  if (!targetId) {
    showToast("연결할 상세일정 막대 위에 놓아주세요.");
    return;
  }

  const predecessorId = drag.side === "left" ? targetId : drag.fromId;
  const successorId = drag.side === "left" ? drag.fromId : targetId;
  await createDependency(predecessorId, successorId);
}

function dependencyPointForBar(bar, side) {
  const barRect = bar.getBoundingClientRect();
  const bodyRect = els.timelineBody.getBoundingClientRect();
  return {
    x: (side === "left" ? barRect.left : barRect.right) - bodyRect.left,
    y: barRect.top + barRect.height / 2 - bodyRect.top,
  };
}

function updateDependencyDraftPath() {
  const drag = state.dependencyDrag;
  if (!drag) return;
  ensureDependencyDefs();
  let path = els.dependencyLayer.querySelector("#dependencyDraftPath");
  if (!path) {
    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = "dependencyDraftPath";
    path.classList.add("dependency-draft");
    path.setAttribute("marker-end", "url(#dependencyArrow)");
    els.dependencyLayer.appendChild(path);
  }

  const direction = drag.side === "left" ? -1 : 1;
  const gap = Math.max(24, Math.abs(drag.currentX - drag.startX) / 2);
  const c1 = drag.startX + gap * direction;
  const c2 = drag.currentX - gap * direction;
  path.setAttribute("d", `M ${drag.startX} ${drag.startY} C ${c1} ${drag.startY}, ${c2} ${drag.currentY}, ${drag.currentX} ${drag.currentY}`);
}

function ensureDependencyDefs() {
  if (els.dependencyLayer.querySelector("#dependencyArrow")) return;
  els.dependencyLayer.insertAdjacentHTML("afterbegin", `
    <defs>
      <marker id="dependencyArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 8 4 L 0 8 z"></path>
      </marker>
    </defs>
  `);
}

function clearDependencyDraftPath() {
  els.dependencyLayer.querySelector("#dependencyDraftPath")?.remove();
}

function highlightDependencyTarget(clientX, clientY, fromId) {
  clearDependencyTargetHighlight();
  const bar = dependencyTargetBarAt(clientX, clientY, fromId);
  bar?.classList.add("is-link-target");
}

function clearDependencyTargetHighlight() {
  document.querySelectorAll(".gantt-bar.is-link-target").forEach((bar) => bar.classList.remove("is-link-target"));
}

function dependencyTargetBarAt(clientX, clientY, fromId) {
  const element = document.elementFromPoint(clientX, clientY);
  const bar = element?.closest?.(".gantt-bar.task");
  if (!bar || !bar.dataset.taskId || bar.dataset.taskId === fromId) return null;
  return bar;
}

function dependencyTargetIdAt(clientX, clientY, fromId) {
  return dependencyTargetBarAt(clientX, clientY, fromId)?.dataset.taskId || "";
}

async function createDependency(predecessorId, successorId) {
  if (!predecessorId || !successorId || predecessorId === successorId) return;
  const predecessor = state.tasks.find((task) => task.id === predecessorId);
  const successor = state.tasks.find((task) => task.id === successorId);
  if (!predecessor || !successor) return;

  const alreadyLinked =
    (predecessor.successorIds || []).some((id) => normalizeId(id) === normalizeId(successor.id)) ||
    (successor.predecessorIds || []).some((id) => normalizeId(id) === normalizeId(predecessor.id));
  if (alreadyLinked) {
    showToast("이미 연결된 일정입니다.");
    return;
  }

  await applyBulkTaskUpdates(
    [
      { ...predecessor, successorIds: addRelatedId(predecessor.successorIds, successor.id) },
      { ...successor, predecessorIds: addRelatedId(successor.predecessorIds, predecessor.id) },
    ],
    `"${predecessor.detail || predecessor.project}" → "${successor.detail || successor.project}" 연결`,
  );
}

async function removeDependency(predecessorId, successorId) {
  const predecessor = state.tasks.find((task) => task.id === predecessorId);
  const successor = state.tasks.find((task) => task.id === successorId);
  if (!predecessor || !successor) return;
  await applyBulkTaskUpdates(
    [
      { ...predecessor, successorIds: (predecessor.successorIds || []).filter((id) => normalizeId(id) !== normalizeId(successor.id)) },
      { ...successor, predecessorIds: (successor.predecessorIds || []).filter((id) => normalizeId(id) !== normalizeId(predecessor.id)) },
    ],
    `"${predecessor.detail || predecessor.project}" → "${successor.detail || successor.project}" 연결 해제`,
  );
}

function dependencyCascadeForChanges(changes) {
  if (!state.rescheduleDependencies || !changes?.length) return [];
  const taskIndex = dependencyTaskIndex(state.tasks);
  const successorMap = dependencySuccessorMap(state.tasks, taskIndex);
  const directIds = new Set(changes.map((change) => change.next?.id).filter(Boolean));
  const queue = [];

  changes.forEach((change) => {
    const delta = dependencyDeltaForChange(change);
    if (delta) queue.push({ task: change.next, delta });
  });

  const cascadeById = new Map();
  const originalById = new Map();
  const deltaById = new Map();
  let guard = 0;

  while (queue.length && guard < 1000) {
    guard += 1;
    const { task, delta } = queue.shift();
    const successorIds = successorMap.get(normalizeId(task?.id)) || new Set();

    for (const successorId of successorIds) {
      if (directIds.has(successorId)) continue;
      const currentSuccessor = cascadeById.get(successorId)?.next || state.tasks.find((item) => item.id === successorId);
      if (!currentSuccessor) continue;

      const previousDelta = deltaById.get(successorId);
      const nextDelta = combineDependencyDelta(previousDelta, delta);
      if (nextDelta === previousDelta || !nextDelta) continue;

      const original = originalById.get(successorId) || { ...currentSuccessor };
      originalById.set(successorId, original);
      const next = shiftTaskDates(original, nextDelta);
      cascadeById.set(successorId, { original, next });
      deltaById.set(successorId, nextDelta);
      queue.push({ task: next, delta: nextDelta });
    }
  }

  return [...cascadeById.values()];
}

async function confirmDependencyCascade(label, cascaded) {
  if (!cascaded?.length) return true;
  return openImpactPreview(label, cascaded);
}

function openImpactPreview(label, cascaded) {
  return new Promise((resolve) => {
    resolveImpactPreview(false, true);
    state.impactResolve = resolve;
    els.impactModal.querySelector(".source-badge").textContent = "변경 확인";
    els.impactConfirmButton.textContent = "저장";
    els.impactTitle.textContent = label;
    els.impactSummary.textContent = `연결된 후속 일정 ${cascaded.length}개도 같이 이동합니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`;
    els.impactGuard.innerHTML = impactGuardMarkup({ mode: "save" });
    els.impactList.innerHTML = impactPreviewMarkup(cascaded);
    els.impactModalBackdrop.hidden = false;
    els.impactModal.hidden = false;
    window.requestAnimationFrame(() => els.impactConfirmButton.focus());
  });
}

function resolveImpactPreview(confirmed, silent = false) {
  const resolve = state.impactResolve;
  state.impactResolve = null;
  els.impactModalBackdrop.hidden = true;
  els.impactModal.hidden = true;
  els.impactGuard.innerHTML = "";
  els.impactList.innerHTML = "";
  els.impactModal.querySelector(".source-badge").textContent = "변경 확인";
  els.impactConfirmButton.textContent = "저장";
  if (!silent && resolve) resolve(Boolean(confirmed));
}

function openInputModal({ title, summary, fields, confirmText = "저장", badge = "입력" }) {
  return new Promise((resolve) => {
    resolveInputModal(null, true);
    state.inputResolve = resolve;
    state.inputFieldsSchema = fields || [];
    els.inputBadge.textContent = badge;
    els.inputTitle.textContent = title || "값 입력";
    els.inputSummary.textContent = summary || "변경할 값을 입력하세요.";
    els.inputConfirmButton.textContent = confirmText;
    els.inputFields.innerHTML = state.inputFieldsSchema.map(inputFieldMarkup).join("");
    bindInputModalPresetButtons();
    els.inputModalBackdrop.hidden = false;
    els.inputModal.hidden = false;
    window.requestAnimationFrame(() => {
      const focusTarget = els.inputFields.querySelector("input, select, textarea");
      focusTarget?.focus();
      if (focusTarget?.select) focusTarget.select();
    });
  });
}

function inputFieldMarkup(field, index) {
  const name = String(field.name || `field${index}`);
  const label = String(field.label || name);
  const value = String(field.value ?? "");
  const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
  const required = field.required === false ? "" : " required";
  const inputId = `inputModalField${index}`;
  const type = field.type || "text";

  if (type === "color") {
    const options = normalizeInputOptions(field.options || PALETTE);
    return `
      <label class="input-field" for="${inputId}">
        <span>${escapeHtml(label)}</span>
        <select id="${inputId}" data-input-name="${escapeHtml(name)}"${required}>
          ${options.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === value ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  if (type === "select") {
    const options = normalizeInputOptions(field.options || []);
    return `
      <label class="input-field" for="${inputId}">
        <span>${escapeHtml(label)}</span>
        <select id="${inputId}" data-input-name="${escapeHtml(name)}"${required}>
          ${options.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === value ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  if (type === "textarea") {
    return `
      <label class="input-field" for="${inputId}">
        <span>${escapeHtml(label)}</span>
        <textarea id="${inputId}" data-input-name="${escapeHtml(name)}"${placeholder}${required}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  return `
    <label class="input-field" for="${inputId}">
      <span>${escapeHtml(label)}</span>
      <input id="${inputId}" data-input-name="${escapeHtml(name)}" type="${escapeHtml(inputTypeForField(type))}" value="${escapeHtml(value)}"${placeholder}${required} />
      ${inputPresetMarkup(field, name)}
    </label>
  `;
}

function inputPresetMarkup(field, targetName) {
  const presets = Array.isArray(field.presets) ? field.presets : targetName === "detail" ? DETAIL_PRESETS : [];
  if (!presets.length) return "";
  return `
    <span class="input-presets" aria-label="${escapeHtml(field.label || targetName)} 빠른 선택">
      ${presets.map((preset) => `
        <button
          type="button"
          data-input-preset-target="${escapeHtml(targetName)}"
          data-input-preset-value="${escapeHtml(preset.value)}"
          data-input-preset-color="${escapeHtml(preset.color || "")}"
          style="--preset-color:${escapeHtml(preset.color || "#8b949e")}">
          ${escapeHtml(preset.label || preset.value)}
        </button>
      `).join("")}
    </span>
  `;
}

function bindInputModalPresetButtons() {
  els.inputFields.querySelectorAll("[data-input-preset-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = modalInputControl(button.dataset.inputPresetTarget || "");
      if (target) target.value = button.dataset.inputPresetValue || "";
      const color = button.dataset.inputPresetColor || "";
      if (color) {
        const colorControl = modalInputControl("color");
        if (colorControl) colorControl.value = color;
      }
    });
  });
}

function modalInputControl(name) {
  return [...els.inputFields.querySelectorAll("[data-input-name]")]
    .find((control) => control.dataset.inputName === name) || null;
}

function inputTypeForField(type) {
  return ["text", "date"].includes(type) ? type : "text";
}

function normalizeInputOptions(options) {
  const seen = new Set();
  return options
    .map((option) => {
      if (typeof option === "string") return { value: option, label: option };
      return { value: String(option?.value ?? ""), label: String(option?.label ?? option?.value ?? "") };
    })
    .filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
}

function submitInputModal() {
  const values = {};
  const controls = els.inputFields.querySelectorAll("[data-input-name]");
  for (const control of controls) {
    const name = control.dataset.inputName;
    const value = String(control.value || "").trim();
    const schema = state.inputFieldsSchema.find((field) => field.name === name) || {};
    if (schema.required !== false && !value) {
      showToast(`${schema.label || "값"}을 입력하세요.`);
      control.focus();
      return;
    }
    values[name] = value;
  }
  resolveInputModal(values);
}

function resolveInputModal(values, silent = false) {
  const resolve = state.inputResolve;
  state.inputResolve = null;
  state.inputFieldsSchema = [];
  els.inputModalBackdrop.hidden = true;
  els.inputModal.hidden = true;
  els.inputFields.innerHTML = "";
  els.inputBadge.textContent = "입력";
  els.inputConfirmButton.textContent = "저장";
  if (!silent && resolve) resolve(values);
}

async function openChangeRequestModal() {
  const input = await openInputModal({
    badge: "요청",
    title: "수정요청",
    summary: "필요한 내용만 짧게 적어주세요. 현재 화면과 선택 항목은 자동으로 같이 저장됩니다.",
    confirmText: "요청 저장",
    fields: [
      {
        name: "message",
        label: "수정요청사항",
        type: "textarea",
        placeholder: "예: 휴재처럼 특정 항목은 다른 색으로 보이게 해주세요.",
      },
    ],
  });
  if (!input?.message) return;

  try {
    const response = await fetch(apiUrl("/api/change-requests"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.message,
        context: changeRequestContext(),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "수정요청을 저장하지 못했습니다.");
    showToast("수정요청을 저장했습니다. 승인 전에는 자동으로 반영되지 않습니다.");
  } catch (error) {
    showToast(error.message);
  }
}

function changeRequestContext() {
  const dayWidth = ZOOM[state.zoom]?.dayWidth || 22;
  const visibleStartOffset = Math.max(0, Math.floor((els.ganttScroll?.scrollLeft || 0) / dayWidth));
  const visibleDayCount = Math.max(1, Math.ceil((els.ganttScroll?.clientWidth || 0) / dayWidth));
  const selected = selectedTasks().slice(0, 12).map((task) => ({
    id: task.id,
    channel: task.channel,
    project: task.project,
    detail: task.detail || task.category,
    title: task.title,
    start: task.start,
    end: task.end,
    status: task.status,
  }));
  return {
    url: window.location.href,
    search: state.search || "",
    filters: { ...state.filters },
    view: {
      zoom: state.zoom,
      density: state.density,
      showCompleted: state.showCompleted,
      rangeStart: state.rangeStart,
      rangeEnd: state.rangeEnd,
      visibleStart: state.rangeStart ? shiftDate(state.rangeStart, visibleStartOffset) : "",
      visibleEnd: state.rangeStart ? shiftDate(state.rangeStart, visibleStartOffset + visibleDayCount) : "",
      scrollLeft: Math.round(els.ganttScroll?.scrollLeft || 0),
      scrollTop: Math.round(els.ganttScroll?.scrollTop || 0),
    },
    selection: {
      count: selectedTaskIds().length,
      tasks: selected,
    },
    createdFrom: "gantt",
  };
}

function impactPreviewMarkup(cascaded) {
  const visible = cascaded.slice(0, 10).map(({ original, next }) => `
    <div class="impact-item">
      <span>
        <span class="impact-title">${escapeHtml(taskDisplayName(next))}</span>
        <span class="impact-meta">${escapeHtml([next.status, next.assignee].filter(Boolean).join(" · ") || "상세일정")}</span>
      </span>
      <span class="impact-date">
        <span>${escapeHtml(`${dateLabel(original.start)}-${dateLabel(original.end)}`)}</span>
        <strong>${escapeHtml(`${dateLabel(next.start)}-${dateLabel(next.end)}`)}</strong>
      </span>
    </div>
  `).join("");
  const remaining = cascaded.length > 10 ? `<div class="impact-more">외 ${cascaded.length - 10}개 일정</div>` : "";
  return visible + remaining;
}

function openActionPreview({ title, summary, items, confirmText = "확인", badge = "확인 필요" }) {
  return new Promise((resolve) => {
    resolveImpactPreview(false, true);
    state.impactResolve = resolve;
    els.impactModal.querySelector(".source-badge").textContent = badge;
    els.impactConfirmButton.textContent = confirmText;
    els.impactTitle.textContent = title;
    els.impactSummary.textContent = summary;
    els.impactGuard.innerHTML = impactGuardMarkup({ mode: impactGuardMode(confirmText, badge) });
    els.impactList.innerHTML = actionPreviewMarkup(items || []);
    els.impactModalBackdrop.hidden = false;
    els.impactModal.hidden = false;
    window.requestAnimationFrame(() => els.impactConfirmButton.focus());
  });
}

function impactGuardMode(confirmText, badge) {
  const text = `${confirmText || ""} ${badge || ""}`;
  if (/숨김|삭제|복구|확인 처리|검토 확인/.test(text)) return "local-rule";
  return "save";
}

function impactGuardMarkup({ mode = "save" } = {}) {
  const saveLabel = mode === "local-rule" ? "저장: 화면 규칙" : "저장: 간트_확인";
  const saveDetail = mode === "local-rule"
    ? "숨김/확인/복구 규칙만 저장"
    : "수정·생성은 간트_확인 DB에 기록";
  return `
    <div class="impact-guard-item">
      <strong>원본 보호</strong>
      <span>채널팀 플랜 읽기 전용</span>
    </div>
    <div class="impact-guard-item">
      <strong>${escapeHtml(saveLabel)}</strong>
      <span>${escapeHtml(saveDetail)}</span>
    </div>
    <div class="impact-guard-item">
      <strong>실행 전 확인</strong>
      <span>취소하면 변경 없음</span>
    </div>
  `;
}

async function confirmTaskActionPreview({ title, label, action, confirmText, tasks, forceProjectItems = false, danger = false, emptyMessage = "" }) {
  const uniqueTasks = uniqueTasksById(tasks || []);
  const actionLabel = action || "변경";
  const itemLabel = label || "선택 항목";
  const uploadCount = uniqueTasks.filter(isUploadTask).length;
  const projectCount = groupedPreviewItems(uniqueTasks).length;
  const sourceMessage = actionLabel === "삭제"
    ? deleteModeSummary()
    : forceProjectItems && actionLabel === "숨김"
      ? "채널팀 플랜 원본은 건드리지 않고, 서버가 같은 프로젝트명 변형과 현재 매칭되는 일정 ID도 함께 숨김 규칙으로 저장합니다."
    : "채널팀 플랜 원본은 건드리지 않고, 화면 표시/숨김 규칙만 바뀝니다.";
  const countMessage = uniqueTasks.length
    ? `${itemLabel}: ${uniqueTasks.length}개 일정, ${projectCount}개 프로젝트${uploadCount ? `, 업로드 ${uploadCount}개 포함` : ""}.`
    : emptyMessage || `${itemLabel}: 현재 화면에 표시된 일정이 없습니다.`;
  const summary = `${countMessage} ${sourceMessage}`;
  const items = uniqueTasks.length
    ? previewItemsForTasks(uniqueTasks, { forceProjectItems, result: actionLabel, danger })
    : [{ title: itemLabel, meta: emptyMessage || "표시된 일정 없음", range: "", result: actionLabel, danger }];

  return openActionPreview({
    title,
    summary,
    items,
    confirmText: confirmText || actionLabel,
    badge: danger ? "삭제 확인" : "숨김 확인",
  });
}

async function confirmFieldChangePreview({ title, label, field, fieldLabel, originalTasks, nextTasks, confirmText = "저장" }) {
  const originals = uniqueTasksById(originalTasks || []);
  const nextById = new Map(uniqueTasksById(nextTasks || []).map((task) => [task.id, task]));
  const changes = originals
    .map((original) => ({ original, next: nextById.get(original.id) }))
    .filter((change) => change.next && String(change.original?.[field] || "") !== String(change.next?.[field] || ""));

  if (!changes.length) return false;

  const originalList = changes.map((change) => change.original);
  const projectCount = groupedPreviewItems(originalList).length;
  const writeSummary = writeTargetBreakdown(originalList);
  const summary = `${label}: ${changes.length}개 일정, ${projectCount}개 프로젝트의 ${fieldLabel || field} 값이 바뀝니다. 채널팀 플랜 원본은 건드리지 않습니다. ${writeSummary}`;

  return openActionPreview({
    title,
    summary,
    items: fieldChangePreviewItems(changes, field),
    confirmText,
    badge: "수정 확인",
  });
}

function writeTargetBreakdown(tasks) {
  const uniqueTasks = uniqueTasksById(tasks || []);
  const sourceTasks = uniqueTasks.filter((task) => task.source === "source" && task.syncMode !== "target-copy");
  const targetTasks = uniqueTasks.filter((task) => task.source === "target" || task.syncMode === "target-copy");
  const localTasks = uniqueTasks.filter((task) => task.source === "local" || task.source === "demo");
  if (state.connection?.writeMode !== "target") {
    return `현재 쓰기 대상은 ${state.connection?.label || "로컬"} 상태라 변경분은 로컬 변경사항으로 남습니다.`;
  }
  const parts = [
    sourceTasks.length ? `원본 일정 ${sourceTasks.length}개는 간트_확인 사본으로 저장` : "",
    targetTasks.length ? `기존 간트_확인 일정 ${targetTasks.length}개는 직접 수정` : "",
    localTasks.length ? `로컬 일정 ${localTasks.length}개는 간트_확인에 생성/갱신` : "",
  ].filter(Boolean);
  return parts.length ? `저장 영향: ${parts.join(", ")}됩니다.` : "저장 영향: 간트_확인에 변경분이 기록됩니다.";
}

async function confirmDateChangePreview({ title, label, originalTasks, nextTasks, confirmText = "저장" }) {
  const originals = uniqueTasksById(originalTasks || []);
  const nextById = new Map(uniqueTasksById(nextTasks || []).map((task) => [task.id, task]));
  const changes = originals
    .map((original) => ({ original, next: nextById.get(original.id) }))
    .filter((change) => change.next && (change.original.start !== change.next.start || change.original.end !== change.next.end));

  if (!changes.length) return false;

  const projectCount = groupedPreviewItems(changes.map((change) => change.original)).length;
  const summary = `${label}: ${changes.length}개 일정, ${projectCount}개 프로젝트의 날짜가 바뀝니다. 후속 이동이 켜져 있으면 저장 직전에 연결된 후속 일정 영향도 한 번 더 확인합니다. 채널팀 플랜 원본은 건드리지 않습니다.`;

  return openActionPreview({
    title,
    summary,
    items: dateChangePreviewItems(changes),
    confirmText,
    badge: "날짜 확인",
  });
}

function dateChangePreviewItems(changes) {
  return changes.map(({ original, next }) => ({
    title: taskDisplayName(original),
    meta: [original.status, original.assignee].filter(Boolean).join(" · ") || sourceLabel(original),
    range: dateRangeLabel(original),
    result: dateRangeLabel(next),
  }));
}

function fieldChangePreviewItems(changes, field) {
  const items = changes.map(({ original, next }) => ({
    title: taskDisplayName(original),
    meta: [original.status, original.assignee].filter(Boolean).join(" · ") || sourceLabel(original),
    before: String(original?.[field] || "비어 있음"),
    after: String(next?.[field] || "비어 있음"),
  }));

  if (items.length <= 10) {
    return items.map((item) => ({
      title: item.title,
      meta: item.meta,
      range: item.before,
      result: item.after,
    }));
  }

  const grouped = new Map();
  for (const { original, next } of changes) {
    const before = String(original?.[field] || "비어 있음");
    const after = String(next?.[field] || "비어 있음");
    const key = `${before}→${after}`;
    if (!grouped.has(key)) grouped.set(key, { before, after, tasks: [] });
    grouped.get(key).tasks.push(original);
  }

  return [...grouped.values()].map((group) => ({
    title: `${group.tasks.length}개 일정`,
    meta: scheduleCompositionLabel(group.tasks) || `${groupedPreviewItems(group.tasks).length}개 프로젝트`,
    range: group.before,
    result: group.after,
  }));
}

async function confirmProjectMergePreview({ title, channel, target, aliases, tasks }) {
  const uniqueTasks = uniqueTasksById(tasks || []);
  const uniqueAliases = [...new Set((aliases || []).map((item) => String(item || "").trim()).filter(Boolean))];
  const composition = scheduleCompositionLabel(uniqueTasks);
  const summary = `${channel || "채널"} 안에서 ${uniqueAliases.length}개 프로젝트명을 "${target}" 기준으로 묶습니다. 현재 화면 기준 ${uniqueTasks.length}개 일정${composition ? `(${composition})` : ""}이 영향을 받으며, 채널팀 플랜 원본은 건드리지 않고 병합 기준만 저장합니다.`;
  const items = uniqueAliases.map((alias) => {
    const aliasKey = canonicalProjectKey(alias);
    const aliasTasks = uniqueTasks.filter((task) => canonicalProjectKey(task.project || task.title) === aliasKey || projectHideVariantsForTask(task, task.project || task.title).some((variant) => canonicalProjectKey(variant) === aliasKey));
    return {
      title: alias,
      meta: aliasTasks.length ? `${aliasTasks.length}개 일정 · ${scheduleCompositionLabel(aliasTasks) || "프로젝트명 병합"}` : "프로젝트명 병합",
      range: alias,
      result: target,
    };
  });

  return openActionPreview({
    title,
    summary,
    items,
    confirmText: "병합 저장",
    badge: "병합 확인",
  });
}

async function confirmDependencyChangePreview({ title, summary, links, result, confirmText, danger = false }) {
  const uniqueLinks = uniqueDependencyLinks(links || []);
  if (!uniqueLinks.length) return false;

  return openActionPreview({
    title,
    summary,
    items: uniqueLinks.map(({ predecessor, successor }) => ({
      title: taskDisplayName(predecessor),
      meta: `후속: ${taskDisplayName(successor)}`,
      range: dateRangeLabel(predecessor),
      result,
      danger,
    })),
    confirmText,
    badge: danger ? "해제 확인" : "연결 확인",
  });
}

async function confirmEditorChangePreview(original, next, changes) {
  const dateChanged = original.start !== next.start || original.end !== next.end;
  const summary = `"${original.detail || original.title}"의 ${changes.length}개 항목이 바뀝니다.${dateChanged ? " 후속 이동이 켜져 있으면 저장 직전에 연결된 후속 일정 영향도 한 번 더 확인합니다." : ""} 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`;

  return openActionPreview({
    title: `"${original.detail || original.title}" 편집 저장 확인`,
    summary,
    items: changes,
    confirmText: "편집 저장",
    badge: "수정 확인",
  });
}

async function confirmCreateTaskPreview(task) {
  return openActionPreview({
    title: "새 일정 생성 확인",
    summary: `"${task.channel}" 채널의 "${task.project}" 프로젝트에 새 상세일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에만 저장합니다.`,
    items: [{
      title: taskDisplayName(task),
      meta: [task.status, task.assignee].filter(Boolean).join(" · ") || "새 상세일정",
      range: dateRangeLabel(task),
      result: "생성",
    }],
    confirmText: "생성",
    badge: "생성 확인",
  });
}

async function confirmRestoreHiddenPreview(body, title, meta) {
  const kindLabel = body?.type === "channel" ? "채널" : body?.type === "project" ? "프로젝트" : "일정";
  const itemTitle = title || body?.project || body?.channel || body?.id || "숨김 항목";
  return openActionPreview({
    title: `${kindLabel} 숨김 복구 확인`,
    summary: `"${itemTitle}" 숨김을 복구합니다. 채널팀 플랜 원본은 건드리지 않고 화면 숨김 규칙만 바뀝니다.`,
    items: [{
      title: itemTitle,
      meta: meta || kindLabel,
      range: "숨김",
      result: "복구",
    }],
    confirmText: "복구",
    badge: "복구 확인",
  });
}

async function confirmHiddenTaskProjectConvertPreview(body, title, meta) {
  const project = body?.project || "프로젝트";
  const channel = body?.channel || "채널";
  return openActionPreview({
    title: "프로젝트 숨김 전환 확인",
    summary: `"${channel}"의 "${project}" 관련 개별 숨김을 프로젝트 숨김 규칙으로 전환합니다. 채널팀 플랜 원본은 건드리지 않고 화면 숨김 규칙만 정리합니다.`,
    items: [{
      title: title || project,
      meta: meta || channel,
      range: "개별 숨김",
      result: "프로젝트 숨김",
    }],
    confirmText: "전환",
    badge: "숨김 확인",
  });
}

async function confirmHiddenProjectBulkConvertPreview(projects) {
  const items = Array.isArray(projects) ? projects : [];
  const totalTasks = items.reduce((sum, item) => sum + Number(item.count || item.ids?.length || 0), 0);
  return openActionPreview({
    title: "프로젝트 숨김 일괄 전환",
    summary: `전환 가능한 ${items.length}개 프로젝트의 개별 숨김 ${totalTasks}개를 프로젝트 숨김 규칙으로 정리합니다. 채널팀 플랜 원본은 건드리지 않습니다.`,
    items: items.map((item) => ({
      title: item.project || "프로젝트",
      meta: [item.channel, `${item.count || item.ids?.length || 0}개 개별 숨김`].filter(Boolean).join(" · "),
      range: item.start && item.end ? dateRangeLabel(item) : "개별 숨김",
      result: "프로젝트 숨김",
    })),
    confirmText: "모두 전환",
    badge: "숨김 확인",
  });
}

async function confirmProjectAliasDeletePreview(button) {
  const channel = button.dataset.channel || "채널";
  const from = button.dataset.project || "프로젝트";
  return openActionPreview({
    title: "프로젝트 병합 해제 확인",
    summary: `"${channel}" 안에서 "${from}" 프로젝트명을 묶어둔 기준을 해제합니다. 일정 데이터는 삭제하지 않고 병합 규칙만 바뀝니다.`,
    items: [{
      title: from,
      meta: channel,
      range: "병합됨",
      result: "해제",
    }],
    confirmText: "해제",
    badge: "해제 확인",
  });
}

async function confirmReviewIgnorePreview(group, kind) {
  return openActionPreview({
    title: "검토 후보 확인 처리",
    summary: `"${group.project}" 후보를 검토 목록에서 제외합니다. 일정은 숨기거나 수정하지 않고, 채널팀 플랜 원본도 건드리지 않습니다.`,
    items: [{
      title: group.project,
      meta: [group.channel, `${group.tasks.length}개 일정`, reviewKindLabel(kind)].filter(Boolean).join(" · "),
      range: dateRangeLabel(group.range),
      result: "확인됨",
    }],
    confirmText: "확인 처리",
    badge: "검토 확인",
  });
}

async function confirmReviewIgnoreDeletePreview(button) {
  const title = button.dataset.project || "검토 후보";
  return openActionPreview({
    title: "검토 확인 해제",
    summary: `"${title}" 확인 처리를 해제합니다. 해당 항목은 조건이 맞으면 다시 검토 후보에 나타납니다.`,
    items: [{
      title,
      meta: reviewKindLabel(button.dataset.kind),
      range: "확인됨",
      result: "다시 검토",
    }],
    confirmText: "해제",
    badge: "해제 확인",
  });
}

function editorChangeItems(original, next) {
  const fields = [
    ["title", "노션 제목"],
    ["channel", "채널"],
    ["project", "프로젝트"],
    ["detail", "상세일정"],
    ["description", "내용"],
    ["status", "상태"],
    ["assignee", "담당"],
    ["color", "색상"],
  ];
  const items = [];

  if (original.start !== next.start || original.end !== next.end) {
    items.push({
      title: "기간",
      meta: taskDisplayName(original),
      range: dateRangeLabel(original),
      result: dateRangeLabel(next),
    });
  }

  for (const [field, label] of fields) {
    const before = String(original?.[field] || "");
    const after = String(next?.[field] || "");
    if (before === after) continue;
    items.push({
      title: label,
      meta: taskDisplayName(original),
      range: previewValue(before),
      result: previewValue(after),
    });
  }

  return items;
}

function editorRescheduleMode(original, next) {
  if (original.start === next.start && original.end === next.end) return "";
  return rangeRescheduleMode(original, next);
}

function previewValue(value) {
  const text = String(value || "비어 있음").replace(/\s+/g, " ").trim() || "비어 있음";
  return text.length > 42 ? `${text.slice(0, 41)}...` : text;
}

function deleteModeSummary() {
  if (state.diagnostics?.allowTargetArchive) {
    return "간트_확인 항목은 보관 처리될 수 있지만, 채널팀 플랜 원본은 건드리지 않습니다.";
  }
  return "현재 설정에서는 실제 삭제 대신 화면 숨김으로 처리하며, 채널팀 플랜 원본은 건드리지 않습니다.";
}

function previewItemsForTasks(tasks, { forceProjectItems = false, result = "변경", danger = false } = {}) {
  const uniqueTasks = uniqueTasksById(tasks || []);
  const grouped = groupedPreviewItems(uniqueTasks);
  if (forceProjectItems || uniqueTasks.length > 8 || grouped.length < uniqueTasks.length) {
    return grouped.map((group) => ({
      title: [group.channel, group.project].filter(Boolean).join(" / ") || "프로젝트",
      meta: [`${group.tasks.length}개 일정`, scheduleCompositionLabel(group.tasks)].filter(Boolean).join(" · "),
      range: dateRangeLabel(rangeOf(group.tasks)),
      result,
      danger,
    }));
  }

  return uniqueTasks.map((task) => ({
    title: taskDisplayName(task),
    meta: [task.status, task.assignee].filter(Boolean).join(" · ") || sourceLabel(task),
    range: dateRangeLabel(task),
    result,
    danger,
  }));
}

function groupedPreviewItems(tasks) {
  const groups = new Map();
  for (const task of tasks || []) {
    const channel = task.channel || "미지정 채널";
    const project = task.project || task.title || "새 프로젝트";
    const key = `${normalizeChannelName(channel)}:${canonicalProjectKey(project)}`;
    if (!groups.has(key)) groups.set(key, { channel, project, tasks: [] });
    groups.get(key).tasks.push(task);
  }
  return [...groups.values()].sort((a, b) =>
    compareDate(rangeOf(a.tasks).start, rangeOf(b.tasks).start) ||
    compareText(a.channel, b.channel) ||
    compareText(a.project, b.project),
  );
}

function actionPreviewMarkup(items) {
  const visible = (items || []).slice(0, 14).map((item) => `
    <div class="impact-item ${item.danger ? "is-danger" : ""}">
      <span>
        <span class="impact-title">${escapeHtml(item.title || "선택 항목")}</span>
        <span class="impact-meta">${escapeHtml(item.meta || "")}</span>
      </span>
      <span class="impact-date">
        <span>${escapeHtml(item.range || "")}</span>
        <strong>${escapeHtml(item.result || "변경")}</strong>
      </span>
    </div>
  `).join("");
  const remaining = items.length > 14 ? `<div class="impact-more">외 ${items.length - 14}개 항목</div>` : "";
  return visible + remaining;
}

function dateRangeLabel(value) {
  if (!value) return "";
  if (value.start && value.end) return `${dateLabel(value.start)}-${dateLabel(value.end)}`;
  return "";
}

function taskDisplayName(task) {
  return [task?.channel, task?.project, task?.detail || task?.title].filter(Boolean).join(" / ") || "상세일정";
}

function dependencyDeltaForChange(change) {
  if (!change?.original || !change?.next) return 0;
  if (change.mode === "move") return daysBetween(change.original.start, change.next.start);
  if (change.mode === "resize-end" || change.mode === "end") return daysBetween(change.original.end, change.next.end);
  return 0;
}

function combineDependencyDelta(previous, incoming) {
  if (previous == null) return incoming;
  if (previous >= 0 || incoming >= 0) return Math.max(previous, incoming);
  return Math.min(previous, incoming);
}

function shiftTaskDates(task, deltaDays) {
  return {
    ...task,
    start: shiftDate(task.start, deltaDays),
    end: shiftDate(task.end, deltaDays),
  };
}

function dependencyTaskIndex(tasks) {
  const index = new Map();
  tasks.forEach((task) => {
    taskIdAliases(task).forEach((alias) => {
      if (!index.has(alias)) index.set(alias, task);
    });
  });
  return index;
}

function dependencySuccessorMap(tasks, taskIndex = dependencyTaskIndex(tasks)) {
  const successors = new Map();
  const addEdge = (fromRef, toRef) => {
    const fromTask = taskIndex.get(normalizeId(fromRef));
    const toTask = taskIndex.get(normalizeId(toRef));
    if (!toTask) return;
    const fromAliases = fromTask ? taskIdAliases(fromTask) : [normalizeId(fromRef)].filter(Boolean);
    fromAliases.forEach((fromKey) => {
      if (!successors.has(fromKey)) successors.set(fromKey, new Set());
      successors.get(fromKey).add(toTask.id);
    });
  };

  tasks.forEach((task) => {
    (task.successorIds || []).forEach((successorId) => addEdge(task.id, successorId));
    (task.predecessorIds || []).forEach((predecessorId) => addEdge(predecessorId, task.id));
  });

  return successors;
}

function taskIdAliases(task) {
  return [task?.id, task?.originId, task?.sourceId, task?.notionId]
    .map(normalizeId)
    .filter(Boolean);
}

function startDrag(event, taskId, mode, rowTaskIds = []) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const rowIds = new Set((rowTaskIds || []).filter((id) => state.tasks.some((item) => item.id === id)));
  if (!rowIds.size) rowIds.add(taskId);
  const dragIds = state.selectedIds.size > 1 && [...rowIds].some((id) => state.selectedIds.has(id)) ? new Set(state.selectedIds) : rowIds;
  if (dragIds.size === 1) {
    applySelection([taskId], taskId, true);
  } else {
    applySelection([...dragIds], rowIdForTaskId(taskId) || taskId, false);
  }

  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-dragging");
  document.body.dataset.dragMode = mode;

  if (dragIds.size > 1) {
    state.drag = {
      kind: "group",
      mode,
      rowId: "selection",
      label: `선택한 ${dragIds.size}개 일정`,
      startX: event.clientX,
      originals: state.tasks.filter((item) => dragIds.has(item.id)).map((item) => ({ ...item })),
      changedIds: new Set(),
      moved: false,
    };
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag, { once: true });
    return;
  }

  state.drag = {
    kind: "task",
    taskId,
    mode,
    startX: event.clientX,
    original: { ...task },
    moved: false,
  };
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag, { once: true });
}

function startGroupDrag(event, row, mode) {
  if (event.button !== 0) return;
  mode = normalizeShortGroupDragMode(event, row, mode);
  event.preventDefault();
  event.stopPropagation();
  const rowTaskIds = taskIdsForRow(row);
  const selectedIds = selectedTaskIds();
  const isGroupRangeRow = row.kind === "channel" || row.kind === "project";
  const shouldUseSelection = !isGroupRangeRow && selectedIds.length > 1 && rowTaskIds.some((id) => state.selectedIds.has(id));
  if (isGroupRangeRow) {
    state.selectedIds = new Set();
    state.selectedId = "";
    state.selectionAnchorRowId = row.id;
    state.editorOpen = false;

    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add("is-dragging");
    document.body.dataset.dragMode = mode;
    state.drag = {
      kind: "row-range",
      mode,
      rowId: row.id,
      label: row.title,
      startX: event.clientX,
      originalRange: { start: row.start, end: row.end },
      previousRanges: { ...(state.groupRanges || {}) },
      moved: false,
    };
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag, { once: true });
    return;
  }
  const activeIds = shouldUseSelection ? selectedIds : rowTaskIds;
  const ids = new Set(activeIds);
  const originals = state.tasks.filter((task) => ids.has(task.id)).map((task) => ({ ...task }));
  if (!originals.length) return;

  state.selectedIds = new Set(activeIds);
  state.selectedId = activeIds[0] || "";
  state.selectionAnchorRowId = row.id;
  state.editorOpen = false;

  event.currentTarget.setPointerCapture(event.pointerId);
  document.body.classList.add("is-dragging");
  document.body.dataset.dragMode = mode;
  state.drag = {
    kind: "group",
    mode,
    rowId: row.id,
    label: shouldUseSelection ? `선택한 ${activeIds.length}개 일정` : row.title,
    startX: event.clientX,
    originals,
    changedIds: new Set(),
    moved: false,
  };
  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag, { once: true });
}

function normalizeShortGroupDragMode(event, row, mode) {
  if (!["resize-start", "resize-end"].includes(mode)) return mode;
  if (!row || !["channel", "project"].includes(row.kind)) return mode;
  const bar = event.target?.closest?.(".gantt-bar");
  if (!bar?.classList?.contains("is-short-group-bar")) return mode;

  const rect = bar.getBoundingClientRect();
  if (!rect.width) return mode;
  const edgeGrip = Math.min(7, Math.max(4, rect.width / 4));
  const distanceFromStart = event.clientX - rect.left;
  const distanceFromEnd = rect.right - event.clientX;

  if (mode === "resize-start" && distanceFromStart > edgeGrip) return "move";
  if (mode === "resize-end" && distanceFromEnd > edgeGrip) return "move";
  return mode;
}

function groupDragTasks(drag, deltaDays) {
  if (drag.mode === "move") {
    return drag.originals.map((task) => ({
      ...task,
      start: shiftDate(task.start, deltaDays),
      end: shiftDate(task.end, deltaDays),
    }));
  }

  const range = rangeOf(drag.originals);
  if (drag.mode === "resize-start") {
    return groupResizeStartTasks(drag.originals, range, shiftDate(range.start, deltaDays));
  }

  if (drag.mode === "resize-end") {
    return groupResizeEndTasks(drag.originals, range, shiftDate(range.end, deltaDays));
  }

  return [];
}

function groupDragRange(drag, deltaDays) {
  const range = drag?.originalRange;
  if (!range?.start || !range?.end) return null;
  if (drag.mode === "move") {
    return {
      start: shiftDate(range.start, deltaDays),
      end: shiftDate(range.end, deltaDays),
    };
  }
  if (drag.mode === "resize-start") {
    const proposed = shiftDate(range.start, deltaDays);
    return {
      start: compareDate(proposed, range.end) <= 0 ? proposed : range.end,
      end: range.end,
    };
  }
  if (drag.mode === "resize-end") {
    const proposed = shiftDate(range.end, deltaDays);
    return {
      start: range.start,
      end: compareDate(proposed, range.start) >= 0 ? proposed : range.start,
    };
  }
  return null;
}

function groupResizeStartTasks(tasks, range, rawProposedStart) {
  const proposedStart = compareDate(rawProposedStart, range.end) <= 0 ? rawProposedStart : range.end;
  const isExtending = compareDate(proposedStart, range.start) < 0;
  return tasks
    .filter((task) => (isExtending ? task.start === range.start : compareDate(task.start, proposedStart) < 0))
    .map((task) => ({
      ...task,
      start: proposedStart,
      end: compareDate(task.end, proposedStart) < 0 ? proposedStart : task.end,
    }));
}

function groupResizeEndTasks(tasks, range, rawProposedEnd) {
  const proposedEnd = compareDate(rawProposedEnd, range.start) >= 0 ? rawProposedEnd : range.start;
  const isExtending = compareDate(proposedEnd, range.end) > 0;
  return tasks
    .filter((task) => (isExtending ? task.end === range.end : compareDate(task.end, proposedEnd) > 0))
    .map((task) => ({
      ...task,
      start: compareDate(task.start, proposedEnd) > 0 ? proposedEnd : task.start,
      end: proposedEnd,
    }));
}

function isSelectionModifier(event) {
  return Boolean(event?.shiftKey || event?.ctrlKey || event?.metaKey);
}

function moveDrag(event) {
  if (!state.drag) return;
  const dayWidth = ZOOM[state.zoom].dayWidth;
  const deltaDays = Math.round((event.clientX - state.drag.startX) / dayWidth);
  if (deltaDays === 0 && !state.drag.moved) return;

  if (state.drag.kind === "row-range") {
    const nextRange = groupDragRange(state.drag, deltaDays);
    if (!nextRange) return;
    state.drag.moved = true;
    setGroupRangeOverride(state.drag.rowId, nextRange);
    updateDragTooltip(event, state.drag, deltaDays);
    render();
    return;
  }

  if (state.drag.kind === "group") {
    state.drag.moved = true;
    const nextTasks = groupDragTasks(state.drag, deltaDays);
    state.drag.changedIds = new Set(nextTasks.map((task) => task.id));
    const changed = new Map(nextTasks.map((task) => [task.id, task]));
    const originals = new Map(state.drag.originals.map((task) => [task.id, task]));
    state.tasks = state.tasks.map((task) => {
      if (!originals.has(task.id)) return task;
      return changed.get(task.id) || originals.get(task.id);
    });
    updateDragTooltip(event, state.drag, deltaDays);
    render();
    return;
  }

  const original = state.drag.original;
  const next = { ...original };
  state.drag.moved = true;

  if (state.drag.mode === "move") {
    next.start = shiftDate(original.start, deltaDays);
    next.end = shiftDate(original.end, deltaDays);
  }

  if (state.drag.mode === "resize-start") {
    const proposed = shiftDate(original.start, deltaDays);
    next.start = compareDate(proposed, original.end) <= 0 ? proposed : original.end;
  }

  if (state.drag.mode === "resize-end") {
    const proposed = shiftDate(original.end, deltaDays);
    next.end = compareDate(proposed, original.start) >= 0 ? proposed : original.start;
  }

  replaceTask(next);
  updateDragTooltip(event, state.drag, deltaDays, [next]);
  render();
}

async function endDrag() {
  window.removeEventListener("pointermove", moveDrag);
  document.body.classList.remove("is-dragging");
  delete document.body.dataset.dragMode;
  hideDragTooltip();
  if (!state.drag) return;
  const dragged = state.drag;
  state.drag = null;

  if (!dragged.moved) return;
  if (dragged.kind === "row-range") {
    const nextRange = state.groupRanges?.[dragged.rowId] || dragged.originalRange;
    const action = dragActionLabel(dragged.mode);
    saveViewPrefs();
    pushUndo(
      `"${dragged.label}" ${action}`,
      async () => {
        state.groupRanges = dragged.previousRanges || {};
        saveViewPrefs();
        render();
      },
      async () => {
        setGroupRangeOverride(dragged.rowId, nextRange);
        saveViewPrefs();
        render();
      },
    );
    showToast(`"${dragged.label}" ${action}했습니다.`);
    render();
    return;
  }
  if (dragged.kind === "group") {
    const ids = dragged.changedIds?.size ? dragged.changedIds : new Set(dragged.originals.map((task) => task.id));
    const originalById = new Map(dragged.originals.map((task) => [task.id, task]));
    const changedTasks = state.tasks.filter((task) => ids.has(task.id));
    const changes = changedTasks
      .map((task) => ({ original: originalById.get(task.id), next: task, mode: dragged.mode }))
      .filter((change) => change.original && (change.original.start !== change.next.start || change.original.end !== change.next.end));
    if (!changes.length) {
      render();
      return;
    }
    const directRollback = new Map(changes.map((change) => [change.original.id, change.original]));
    const action = dragActionLabel(dragged.mode);
    if (!(await confirmDateChangePreview({
      title: `"${dragged.label}" ${action} 확인`,
      label: `"${dragged.label}"`,
      originalTasks: changes.map((change) => change.original),
      nextTasks: changes.map((change) => change.next),
      confirmText: "날짜 저장",
    }))) {
      state.tasks = state.tasks.map((task) => directRollback.get(task.id) || task);
      render();
      showToast("드래그 날짜 변경을 취소했습니다.");
      return;
    }

    const cascaded = dependencyCascadeForChanges(changes);
    const cascadeNextById = new Map(cascaded.map((item) => [item.next.id, item.next]));
    if (cascaded.length) {
      state.tasks = state.tasks.map((task) => cascadeNextById.get(task.id) || task);
      render();
    }
    const saveTasks = uniqueTasksById([...changedTasks, ...cascaded.map((item) => item.next)]);
    const snapshots = uniqueTasksById([
      ...dragged.originals.filter((task) => ids.has(task.id)).map((task) => ({ ...task })),
      ...cascaded.map((item) => ({ ...item.original })),
    ]);
    const redoSnapshots = uniqueTasksById(saveTasks.map((task) => ({ ...task })));
    const rollback = new Map(snapshots.map((task) => [task.id, task]));

    if (!(await confirmDependencyCascade(`"${dragged.label}" 변경`, cascaded))) {
      state.tasks = state.tasks.map((task) => rollback.get(task.id) || task);
      render();
      showToast("후속 일정 변경을 취소했습니다.");
      return;
    }

    try {
      for (const task of saveTasks) {
        const result = await patchTask(task.id, taskPatch(task));
        mergeSavedTask(task.id, result.task);
      }
      const cascadeLabel = cascaded.length ? ` · 후속 ${cascaded.length}개 포함` : "";
      pushUndo(
        `"${dragged.label}" ${action}${cascadeLabel}`,
        () => restoreTaskSnapshots(snapshots),
        () => restoreTaskSnapshots(redoSnapshots),
      );
      showToast(`"${dragged.label}" ${action}했습니다${cascadeLabel}.`);
      render();
    } catch (error) {
      state.tasks = state.tasks.map((task) => rollback.get(task.id) || task);
      render();
      showToast(error.message);
    }
    return;
  }

  const task = state.tasks.find((item) => item.id === dragged.taskId);
  if (!task) return;
  const taskAction = dragActionLabel(dragged.mode);
  if (dragged.original.start === task.start && dragged.original.end === task.end) {
    render();
    return;
  }
  if (!(await confirmDateChangePreview({
    title: `"${dragged.original.detail || dragged.original.title}" ${taskAction} 확인`,
    label: `"${dragged.original.detail || dragged.original.title}"`,
    originalTasks: [dragged.original],
    nextTasks: [task],
    confirmText: "날짜 저장",
  }))) {
    state.tasks = state.tasks.map((item) => (item.id === dragged.original.id ? dragged.original : item));
    render();
    showToast("드래그 날짜 변경을 취소했습니다.");
    return;
  }

  const cascaded = dependencyCascadeForChanges([{ original: dragged.original, next: task, mode: dragged.mode }]);
  const cascadeNextById = new Map(cascaded.map((item) => [item.next.id, item.next]));
  if (cascaded.length) {
    state.tasks = state.tasks.map((item) => cascadeNextById.get(item.id) || item);
    render();
  }
  const saveTasks = uniqueTasksById([task, ...cascaded.map((item) => item.next)]);
  const snapshots = uniqueTasksById([{ ...dragged.original }, ...cascaded.map((item) => ({ ...item.original }))]);
  const redoSnapshots = uniqueTasksById(saveTasks.map((item) => ({ ...item })));
  const rollback = new Map(snapshots.map((item) => [item.id, item]));

  if (!(await confirmDependencyCascade(`"${dragged.original.detail || dragged.original.title}" 변경`, cascaded))) {
    state.tasks = state.tasks.map((item) => rollback.get(item.id) || item);
    render();
    showToast("후속 일정 변경을 취소했습니다.");
    return;
  }

  try {
    let result = null;
    for (const saveTask of saveTasks) {
      result = await patchTask(saveTask.id, taskPatch(saveTask));
      mergeSavedTask(saveTask.id, result.task);
    }
    const cascadeLabel = cascaded.length ? ` · 후속 ${cascaded.length}개 포함` : "";
    pushUndo(
      `"${dragged.original.detail || dragged.original.title}" ${taskAction}${cascadeLabel}`,
      () => restoreTaskSnapshots(snapshots),
      () => restoreTaskSnapshots(redoSnapshots),
    );
    showToast(cascaded.length ? `${taskAction}했습니다${cascadeLabel}.` : result.warning || savedLabel(result.mode));
    render();
  } catch (error) {
    state.tasks = state.tasks.map((item) => rollback.get(item.id) || item);
    render();
    showToast(error.message);
  }
}

function dragActionLabel(mode) {
  return mode === "move" ? "일정 이동" : "기간 수정";
}

function updateDragTooltip(event, drag, deltaDays, nextTasks = []) {
  if (!drag) return;
  const range = drag.kind === "row-range"
    ? state.groupRanges?.[drag.rowId] || drag.originalRange
    : drag.kind === "group"
      ? rangeOf(state.tasks.filter((task) => (drag.originals || []).some((original) => original.id === task.id)))
      : rangeOf(nextTasks.length ? nextTasks : [state.tasks.find((task) => task.id === drag.taskId)].filter(Boolean));
  if (!range?.start || !range?.end) return;

  const action = dragActionLabel(drag.mode);
  const delta = deltaDays > 0 ? `+${deltaDays}일` : `${deltaDays}일`;
  const label = drag.kind === "task"
    ? taskDisplayName(nextTasks[0] || state.tasks.find((task) => task.id === drag.taskId))
    : drag.label || "선택 항목";
  const affected = drag.kind === "group" && drag.changedIds?.size ? ` · ${drag.changedIds.size}개 일정 영향` : "";
  els.dragTooltip.innerHTML = `
    <strong>${escapeHtml(`${action} ${delta}`)}</strong>
    <span>${escapeHtml(`${label} · ${dateRangeLabel(range)}${affected}`)}</span>
  `;
  const width = els.dragTooltip.offsetWidth || 260;
  const height = els.dragTooltip.offsetHeight || 48;
  els.dragTooltip.style.left = `${clamp(event.clientX + 14, 8, Math.max(8, window.innerWidth - width - 8))}px`;
  els.dragTooltip.style.top = `${clamp(event.clientY + 14, 8, Math.max(8, window.innerHeight - height - 8))}px`;
  els.dragTooltip.hidden = false;
}

function hideDragTooltip() {
  els.dragTooltip.hidden = true;
  els.dragTooltip.innerHTML = "";
}

function selectRow(row, event = {}, options = {}) {
  const rowTaskIds = taskIdsForRow(row);
  if (!rowTaskIds.length) return;
  const shouldFocusTimeline = options.focusTimeline !== false;

  if (event.shiftKey && state.selectionAnchorRowId) {
    const ids = taskIdsInRowRange(state.selectionAnchorRowId, row.id);
    applySelection(ids, row.id, ids.length === 1 && row.kind === "task");
    render();
    if (shouldFocusTimeline) scheduleSelectedRangeFocus(rowTaskIds, { center: true });
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    const next = new Set(state.selectedIds);
    const isSelected = rowTaskIds.every((id) => next.has(id));
    rowTaskIds.forEach((id) => {
      if (isSelected) next.delete(id);
      else next.add(id);
    });
    state.selectionAnchorRowId = row.id;
    applySelection([...next], row.id, next.size === 1);
    render();
    if (shouldFocusTimeline) scheduleSelectedRangeFocus(rowTaskIds, { center: true });
    return;
  }

  applySelection(rowTaskIds, row.id, row.kind === "task" && rowTaskIds.length === 1);
  render();
  if (shouldFocusTimeline) scheduleSelectedRangeFocus(rowTaskIds);
}

function applySelection(ids, anchorRowId = "", openEditor = false) {
  const uniqueIds = [...new Set(ids)].filter((id) => state.tasks.some((task) => task.id === id));
  state.selectedIds = new Set(uniqueIds);
  state.selectedId = uniqueIds[0] || "";
  state.selectionAnchorRowId = anchorRowId || rowIdForTaskId(state.selectedId) || "";
  state.editorOpen = Boolean(openEditor && uniqueIds.length === 1 && state.selectedId);
  state.editorMode = "task";
  state.editorRowId = "";
  if (!state.editorOpen && uniqueIds.length !== 1) hideContextMenu();
}

function taskIdsForRow(row) {
  if (!row) return [];
  if (row.kind === "task") return [...new Set(row.taskIds?.length ? row.taskIds : [row.task?.id].filter(Boolean))];
  return [...new Set(row.taskIds || [])];
}

function selectedTaskIds() {
  return [...state.selectedIds].filter((id) => state.tasks.some((task) => task.id === id));
}

function selectedTasks() {
  return tasksForIds(selectedTaskIds());
}

function tasksForIds(ids) {
  const selected = new Set(ids || []);
  return state.tasks.filter((task) => selected.has(task.id));
}

function rowIdForTaskId(taskId) {
  return state.rows.find((row) => row.kind === "task" && (row.task?.id === taskId || (row.taskIds || []).includes(taskId)))?.id || "";
}

function taskIdsInRowRange(fromRowId, toRowId) {
  const fromIndex = state.rows.findIndex((row) => row.id === fromRowId);
  const toIndex = state.rows.findIndex((row) => row.id === toRowId);
  if (fromIndex < 0 || toIndex < 0) return [];
  const [start, end] = [fromIndex, toIndex].sort((a, b) => a - b);
  return [...new Set(state.rows.slice(start, end + 1).flatMap(taskIdsForRow))];
}

function startRowReorderDrag(event, row) {
  if (!isPrimaryDragButton(event) || !["channel", "project"].includes(row?.kind)) return;
  if (state.drag || state.dependencyDrag || state.selectionDrag || state.rowReorderDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag) return;
  if (isSelectionModifier(event)) return;
  if (event.target.closest("input, textarea, button, select, a, .group-caret")) return;

  event.preventDefault();
  event.stopPropagation();
  hideContextMenu();
  state.rowReorderDrag = {
    rowId: row.id,
    kind: row.kind,
    channel: row.channel || row.title,
    title: row.title,
    startY: event.clientY,
    previousRowOrder: [...(state.rowOrder || [])],
    moved: false,
  };
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    // Some embedded browsers do not allow pointer capture for synthetic or proxied pointer events.
  }
  document.body.classList.add("is-row-reordering");
  window.addEventListener("pointermove", moveRowReorderDrag);
  window.addEventListener("pointerup", endRowReorderDrag, { once: true });
  window.addEventListener("mousemove", moveRowReorderDrag);
  window.addEventListener("mouseup", endRowReorderDrag, { once: true });
}

function isPrimaryDragButton(event) {
  return event.button === 0 || (event.button === 1 && (event.buttons === 1 || event.buttons == null));
}

function moveRowReorderDrag(event) {
  const drag = state.rowReorderDrag;
  if (!drag) return;
  const distance = Math.abs(event.clientY - drag.startY);
  if (!drag.moved && distance < 8) return;

  event.preventDefault();
  drag.moved = true;
  state.suppressClick = true;
  const target = rowReorderTarget(drag, event.clientY);
  if (!target) return;
  const order = reorderedSiblingIds(drag.rowId, target.siblingIds, target.rowId, target.insertAfter);
  if (!order || arraysEqual(order.nextIds, target.siblingIds)) return;
  state.rowOrder = mergeManualRowOrder(order.siblingIds, order.nextIds);
  render();
}

function endRowReorderDrag() {
  window.removeEventListener("pointermove", moveRowReorderDrag);
  window.removeEventListener("pointerup", endRowReorderDrag);
  window.removeEventListener("mousemove", moveRowReorderDrag);
  window.removeEventListener("mouseup", endRowReorderDrag);
  document.body.classList.remove("is-row-reordering");
  const drag = state.rowReorderDrag;
  state.rowReorderDrag = null;
  if (!drag?.moved) return;

  const previousOrder = normalizeRowOrder(drag.previousRowOrder);
  const nextOrder = normalizeRowOrder(state.rowOrder);
  saveViewPrefs();
  pushUndo(
    `"${drag.title}" order`,
    async () => {
      state.rowOrder = previousOrder;
      saveViewPrefs();
      render();
    },
    async () => {
      state.rowOrder = nextOrder;
      saveViewPrefs();
      render();
    },
  );
  render();
  showToast("순서를 저장했습니다.");
  setTimeout(() => {
    state.suppressClick = false;
  }, 0);
}

function rowReorderTarget(drag, clientY) {
  const index = rowIndexFromTableClientY(clientY);
  if (index < 0) return null;
  let targetRow = state.rows[index];
  if (!targetRow) return null;

  if (drag.kind === "channel") {
    if (targetRow.kind !== "channel") targetRow = parentChannelRowForIndex(index);
    if (!targetRow || targetRow.id === drag.rowId) return null;
    const siblingIds = state.rows.filter((row) => row.kind === "channel").map((row) => row.id);
    return { rowId: targetRow.id, siblingIds, insertAfter: shouldInsertAfterRow(targetRow, clientY) };
  }

  if (drag.kind === "project") {
    if (targetRow.kind !== "project") targetRow = parentProjectRowForIndex(index);
    if (!targetRow || targetRow.id === drag.rowId || !sameChannelName(targetRow.channel, drag.channel)) return null;
    const siblingIds = state.rows
      .filter((row) => row.kind === "project" && sameChannelName(row.channel, drag.channel))
      .map((row) => row.id);
    return { rowId: targetRow.id, siblingIds, insertAfter: shouldInsertAfterRow(targetRow, clientY) };
  }

  return null;
}

function rowIndexFromTableClientY(clientY) {
  const rect = els.taskTable.getBoundingClientRect();
  if (clientY < rect.top || clientY > rect.bottom) return -1;
  return clamp(Math.floor((clientY - rect.top) / currentRowHeight()), 0, state.rows.length - 1);
}

function parentChannelRowForIndex(index) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const row = state.rows[cursor];
    if (row?.kind === "channel") return row;
  }
  return null;
}

function parentProjectRowForIndex(index) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const row = state.rows[cursor];
    if (row?.kind === "channel") return null;
    if (row?.kind === "project") return row;
  }
  return null;
}

function shouldInsertAfterRow(row, clientY) {
  const element = [...els.taskTable.querySelectorAll("[data-row-id]")].find((item) => item.dataset.rowId === row.id);
  const rect = element?.getBoundingClientRect();
  if (!rect) return false;
  return clientY > rect.top + rect.height / 2;
}

function reorderedSiblingIds(rowId, siblingIds, targetRowId, insertAfter) {
  if (!siblingIds.includes(rowId) || !siblingIds.includes(targetRowId)) return null;
  const nextIds = siblingIds.filter((id) => id !== rowId);
  const targetIndex = nextIds.indexOf(targetRowId);
  if (targetIndex < 0) return null;
  nextIds.splice(targetIndex + (insertAfter ? 1 : 0), 0, rowId);
  return { siblingIds, nextIds };
}

function mergeManualRowOrder(siblingIds, nextIds) {
  const siblingSet = new Set(siblingIds);
  const unrelated = normalizeRowOrder(state.rowOrder).filter((id) => !siblingSet.has(id));
  return normalizeRowOrder([...unrelated, ...nextIds]);
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function scheduleSelectedRangeFocus(ids, options = {}) {
  const taskIds = [...new Set(ids || [])].filter(Boolean);
  if (!taskIds.length) return;
  window.requestAnimationFrame(() => focusTaskIdsInTimeline(taskIds, options));
}

function focusSearchResult(direction = 1) {
  const query = String(state.search || "").trim();
  if (!query) {
    showToast("검색어를 입력하세요.");
    els.searchInput.focus();
    return;
  }

  const rows = searchResultRows();
  if (!rows.length) {
    showToast(`"${query}" 검색 결과가 없습니다.`);
    return;
  }

  const currentRowIndex = rows.findIndex((row) => row.id === state.selectionAnchorRowId || row.id === rowIdForTaskId(state.selectedId));
  const baseIndex = state.searchFocusIndex >= 0 ? state.searchFocusIndex : currentRowIndex;
  const nextIndex = modulo((baseIndex >= 0 ? baseIndex : direction < 0 ? 0 : -1) + direction, rows.length);
  const row = rows[nextIndex];
  const rowTaskIds = taskIdsForRow(row);
  state.searchFocusIndex = nextIndex;
  applySelection(rowTaskIds, row.id, row.kind === "task" && rowTaskIds.length === 1);
  render();
  scheduleRowFocus(row.id, { center: true, smooth: true });
  showToast(`${nextIndex + 1}/${rows.length} 검색 결과로 이동했습니다.`);
}

function searchResultRows() {
  const query = String(state.search || "").trim().toLowerCase();
  if (!query) return [];
  const rows = state.rows.filter((row) => !row.hiddenOnly && rowMatchesSearch(row, query));
  return rows.length ? rows : state.rows.filter((row) => !row.hiddenOnly && taskIdsForRow(row).length);
}

function rowMatchesSearch(row, query) {
  if (!row || !query) return false;
  if (row.kind === "task" && row.task) return taskMatchesQuery(row.task, query);
  const rowText = [row.title, row.subtitle, row.channel, row.statusReason, row.health?.label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (rowText.includes(query)) return true;
  return tasksForIds(taskIdsForRow(row)).some((task) => taskMatchesQuery(task, query));
}

function scheduleRowFocus(rowId, options = {}) {
  if (!rowId) return;
  window.requestAnimationFrame(() => focusRowInView(rowId, options));
}

function focusRowInView(rowId, options = {}) {
  const rowIndex = state.rows.findIndex((row) => row.id === rowId);
  const row = state.rows[rowIndex];
  if (!row || !row.start || !row.end) return;

  const rowHeight = currentRowHeight();
  const targetTop = Math.max(0, rowIndex * rowHeight - rowHeight * 2);
  const maxTop = Math.max(0, els.ganttScroll.scrollHeight - els.ganttScroll.clientHeight);
  els.ganttScroll.scrollTo({
    top: clamp(targetTop, 0, maxTop),
    left: els.ganttScroll.scrollLeft,
    behavior: options.smooth ? "smooth" : "auto",
  });
  focusDateRangeInTimeline(row.start, row.end, options);
}

function focusTaskIdsInTimeline(ids, options = {}) {
  const tasks = tasksForIds(ids).filter((task) => task.start && task.end);
  if (!tasks.length || state.drag || state.selectionDrag || state.rowReorderDrag || state.createDrag || state.tableResizeDrag || state.timelineNavigatorDrag) return;
  const range = rangeOf(tasks);
  if (!range?.start || !range?.end) return;
  focusDateRangeInTimeline(range.start, range.end, options);
}

function focusDateRangeInTimeline(start, end, options = {}) {
  const dayWidth = ZOOM[state.zoom].dayWidth;
  const targetLeft = daysBetween(state.rangeStart, start) * dayWidth;
  const targetRight = (daysBetween(state.rangeStart, end) + 1) * dayWidth;
  if (!Number.isFinite(targetLeft) || !Number.isFinite(targetRight)) return;

  const visibleWidth = Math.max(80, (els.ganttScroll.clientWidth || 0) - currentTableWidth());
  const padding = Math.max(dayWidth * 2, 48);
  const visibleLeft = Math.max(0, els.ganttScroll.scrollLeft || 0);
  const visibleRight = visibleLeft + visibleWidth;
  const alreadyVisible = targetLeft >= visibleLeft + padding && targetRight <= visibleRight - padding;
  if (alreadyVisible) return;

  const targetWidth = Math.max(dayWidth, targetRight - targetLeft);
  let nextLeft = targetLeft - padding;
  if (targetWidth <= visibleWidth - padding * 2) {
    if (options.center) {
      nextLeft = targetLeft - (visibleWidth - targetWidth) / 2;
    } else if (targetLeft < visibleLeft + padding) {
      nextLeft = targetLeft - padding;
    } else {
      nextLeft = targetRight - visibleWidth + padding;
    }
  }

  const maxScrollLeft = Math.max(0, els.ganttScroll.scrollWidth - els.ganttScroll.clientWidth);
  els.ganttScroll.scrollTo({
    left: clamp(nextLeft, 0, maxScrollLeft),
    behavior: options.smooth === false ? "auto" : "smooth",
  });
}

function rowSelectionClass(row) {
  const ids = taskIdsForRow(row);
  if (!ids.length || !state.selectedIds.size) return "";
  const selectedCount = ids.filter((id) => state.selectedIds.has(id)).length;
  if (!selectedCount) return "";
  return selectedCount === ids.length ? " is-selected" : " is-partial-selected";
}

function startSelectionDrag(event, area) {
  if (event.button !== 0 || state.panMode || state.panDrag || state.drag || state.dependencyDrag || state.rowReorderDrag || state.createDrag || state.timelineNavigatorDrag) return;
  if (area === "timeline" && shouldPanEmptyTimeline(event)) {
    startPanDrag(event, { force: true });
    return;
  }
  if (area === "timeline" && event.target.closest(".gantt-bar") && !isSelectionModifier(event)) return;
  if (area === "timeline" && event.altKey) {
    startTimelineCreateDrag(event);
    return;
  }
  if (event.target.closest("input, textarea, button, select") && area !== "table") return;
  event.preventDefault();

  state.selectionDrag = {
    area,
    startX: event.clientX,
    startY: event.clientY,
    baseIds: event.shiftKey || event.ctrlKey || event.metaKey ? new Set(state.selectedIds) : new Set(),
    moved: false,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", moveSelectionDrag);
  window.addEventListener("pointerup", endSelectionDrag, { once: true });
}

function shouldPanEmptyTimeline(event) {
  if (event.altKey || isSelectionModifier(event)) return false;
  if (event.target.closest(".gantt-bar, button, input, textarea, select, [contenteditable='true']")) return false;
  return Boolean(event.target.closest("#timelineBody, #gridLayer, #barLayer"));
}

function moveSelectionDrag(event) {
  const drag = state.selectionDrag;
  if (!drag) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (!drag.moved && distance < 6) return;

  event.preventDefault();
  drag.moved = true;
  state.suppressClick = true;
  const rect = selectionRect(drag.startX, drag.startY, event.clientX, event.clientY);
  updateSelectionBox(rect);

  const ids = new Set(drag.baseIds);
  collectTaskIdsInRect(rect).forEach((id) => ids.add(id));
  applySelection([...ids], "", false);
  render();
  updateSelectionBox(rect);
}

function endSelectionDrag(event) {
  window.removeEventListener("pointermove", moveSelectionDrag);
  const drag = state.selectionDrag;
  state.selectionDrag = null;
  els.selectionBox.hidden = true;
  if (!drag?.moved) return;

  const rect = selectionRect(drag.startX, drag.startY, event.clientX, event.clientY);
  const ids = new Set(drag.baseIds);
  collectTaskIdsInRect(rect).forEach((id) => ids.add(id));
  applySelection([...ids], "", ids.size === 1);
  render();
  scheduleSelectedRangeFocus([...ids], { center: true });
  setTimeout(() => {
    state.suppressClick = false;
  }, 0);
}

function startTimelineCreateDrag(event) {
  const rowIndex = timelineRowIndexFromClientY(event.clientY);
  const row = state.rows[rowIndex];
  if (!row || row.hiddenOnly) return;
  event.preventDefault();
  event.stopPropagation();

  const startDate = dateFromTimelineClientX(event.clientX);
  state.createDrag = {
    row,
    rowIndex,
    startX: event.clientX,
    startY: event.clientY,
    startDate,
    moved: false,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", moveTimelineCreateDrag);
  window.addEventListener("pointerup", endTimelineCreateDrag, { once: true });
}

function moveTimelineCreateDrag(event) {
  const drag = state.createDrag;
  if (!drag) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (!drag.moved && distance < 6) return;

  event.preventDefault();
  drag.moved = true;
  state.suppressClick = true;
  const rect = timelineCreateRect(drag, event.clientX);
  els.selectionBox.classList.add("is-creating");
  updateSelectionBox(rect);
  updateCreateDragTooltip(event, drag, dateFromTimelineClientX(event.clientX));
}

async function endTimelineCreateDrag(event) {
  window.removeEventListener("pointermove", moveTimelineCreateDrag);
  const drag = state.createDrag;
  state.createDrag = null;
  els.selectionBox.hidden = true;
  els.selectionBox.classList.remove("is-creating");
  hideDragTooltip();

  if (!drag?.moved) {
    state.suppressClick = false;
    return;
  }

  const endDate = dateFromTimelineClientX(event.clientX);
  const [start, end] = [drag.startDate, endDate].sort(compareDate);
  render();
  setTimeout(() => {
    state.suppressClick = false;
  }, 0);

  await createTaskFromSeed(timelineCreateSeed(drag.row, start, end), {
    title: "드래그한 기간에 새 일정 만들기",
    summary: `${dateLabel(start)}-${dateLabel(end)} 기간으로 새 일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`,
  });
}

function timelineRowIndexFromClientY(clientY) {
  const rect = els.timelineBody.getBoundingClientRect();
  return Math.floor((clientY - rect.top) / currentRowHeight());
}

function timelineCreateRect(drag, clientX) {
  const timelineRect = els.timelineBody.getBoundingClientRect();
  const rowHeight = currentRowHeight();
  const top = timelineRect.top + drag.rowIndex * rowHeight + Math.max(4, Math.round((rowHeight - 32) / 2));
  const left = clamp(Math.min(drag.startX, clientX), timelineRect.left, timelineRect.right);
  const right = clamp(Math.max(drag.startX, clientX), timelineRect.left, timelineRect.right);
  return {
    left,
    top,
    right,
    bottom: top + 32,
    width: Math.max(18, right - left),
    height: 32,
  };
}

function updateCreateDragTooltip(event, drag, endDate) {
  const [start, end] = [drag.startDate, endDate].sort(compareDate);
  els.dragTooltip.innerHTML = `
    <strong>${escapeHtml("새 일정 만들기")}</strong>
    <span>${escapeHtml([drag.row.title, `${dateLabel(start)}-${dateLabel(end)}`].filter(Boolean).join(" · "))}</span>
  `;
  const width = els.dragTooltip.offsetWidth || 220;
  const height = els.dragTooltip.offsetHeight || 48;
  els.dragTooltip.style.left = `${clamp(event.clientX + 14, 8, Math.max(8, window.innerWidth - width - 8))}px`;
  els.dragTooltip.style.top = `${clamp(event.clientY + 14, 8, Math.max(8, window.innerHeight - height - 8))}px`;
  els.dragTooltip.hidden = false;
}

function timelineCreateSeed(row, start, end) {
  const sourceTask = row.kind === "task" ? row.task : null;
  const detail = sourceTask?.detail || "촬영";
  const channel = sourceTask?.channel || row.channel || (row.kind === "channel" ? row.title : "") || "새 채널";
  const project = sourceTask?.project || (row.kind === "project" ? row.title : "") || "새 프로젝트";
  return {
    title: project || "새 상세일정",
    channel,
    project,
    start,
    detail,
    end,
    status: "시작 전",
    assignee: sourceTask?.assignee || "",
    color: sourceTask?.color || colorForDetail(detail, PALETTE[0]),
  };
}

function selectionRect(x1, y1, x2, y2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  return {
    left,
    top,
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

function updateSelectionBox(rect) {
  els.selectionBox.hidden = false;
  els.selectionBox.style.left = `${rect.left}px`;
  els.selectionBox.style.top = `${rect.top}px`;
  els.selectionBox.style.width = `${rect.width}px`;
  els.selectionBox.style.height = `${rect.height}px`;
}

function collectTaskIdsInRect(rect) {
  const ids = new Set();
  const elements = document.querySelectorAll(".task-row[data-task-id], .task-row[data-row-id], .gantt-bar[data-task-id], .gantt-bar[data-row-id]");
  elements.forEach((element) => {
    const bounds = element.getBoundingClientRect();
    if (!rectsIntersect(rect, bounds)) return;
    if (element.dataset.taskId) {
      ids.add(element.dataset.taskId);
      return;
    }
    const row = state.rows.find((item) => item.id === element.dataset.rowId);
    taskIdsForRow(row).forEach((id) => ids.add(id));
  });
  return [...ids];
}

function rectsIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function selectTask(id) {
  state.editorMode = "task";
  state.editorRowId = "";
  const row = state.rows.find((item) => item.kind === "task" && item.task?.id === id);
  if (row) {
    selectRow(row);
    return;
  }
  applySelection([id], id, true);
  render();
  scheduleSelectedRangeFocus([id], { center: true });
}

function openGroupEditorFromContext(context) {
  if (!context || !["channel", "project"].includes(context.kind)) return;
  const row = state.rows.find((item) => item.id === context.rowId) || state.rows.find((item) => item.kind === context.kind && item.title === context.title);
  if (row) openGroupEditor(row);
}

function openGroupEditor(row) {
  if (!row || !["channel", "project"].includes(row.kind)) return;
  state.editorMode = "group";
  state.editorRowId = row.id;
  state.editorOpen = true;
  state.selectedId = "";
  state.selectedIds = new Set(taskIdsForRow(row));
  state.selectionAnchorRowId = row.id;
  hideContextMenu();
  render();
}

function closeEditor() {
  state.editorOpen = false;
  state.editorMode = "task";
  state.editorRowId = "";
  hideContextMenu();
  render();
}

function clearSelection(shouldRender = true) {
  state.selectedId = "";
  state.selectedIds.clear();
  state.selectionAnchorRowId = "";
  state.editorOpen = false;
  state.editorMode = "task";
  state.editorRowId = "";
  hideContextMenu();
  if (shouldRender) render();
}

function renderSelectionBar() {
  const ids = selectedTaskIds();
  els.selectionBar.hidden = ids.length < 2;
  if (ids.length < 2) return;
  els.selectionCount.textContent = `${ids.length}개 선택`;
  els.selectionSummary.textContent = contextSummary({ taskIds: ids });
  const hasInternalLinks = selectedTasksHaveInternalDependencies();
  els.selectionDoneButton.disabled = !selectedTasks().some((task) => !isDoneTask(task));
  els.selectionUnlinkButton.disabled = !hasInternalLinks;
}

function pushUndo(label, run, redo) {
  if (state.isUndoing || typeof run !== "function") return;
  state.undoStack.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label,
    run,
    redo: typeof redo === "function" ? redo : null,
  });
  if (state.undoStack.length > 20) state.undoStack.length = 20;
  if (!state.isRedoing) state.redoStack = [];
  renderHistoryButtons();
}

function renderUndoButton() {
  renderHistoryButtons();
}

function renderHistoryButtons() {
  if (!els.undoButton) return;
  const undo = state.undoStack[0];
  const redo = state.redoStack[0];
  const busy = state.isUndoing || state.isRedoing;
  els.undoButton.disabled = !undo || busy;
  els.undoButton.title = undo ? `${undo.label} 실행 취소` : "실행 취소";
  els.undoButton.setAttribute("aria-label", els.undoButton.title);
  if (els.redoButton) {
    els.redoButton.disabled = !redo || busy;
    els.redoButton.title = redo ? `${redo.label} 다시 실행` : "다시 실행";
    els.redoButton.setAttribute("aria-label", els.redoButton.title);
  }
}

async function runUndo() {
  if (state.isUndoing || !state.undoStack.length) return;
  const item = state.undoStack.shift();
  renderHistoryButtons();
  state.isUndoing = true;
  try {
    await item.run();
    if (item.redo) {
      state.redoStack.unshift(item);
      if (state.redoStack.length > 20) state.redoStack.length = 20;
    }
    showToast(`${item.label} 되돌렸습니다.`);
  } catch (error) {
    state.undoStack.unshift(item);
    showToast(error.message || "되돌리지 못했습니다.");
  } finally {
    state.isUndoing = false;
    renderHistoryButtons();
  }
}

async function runRedo() {
  if (state.isRedoing || !state.redoStack.length) return;
  const item = state.redoStack.shift();
  if (!item.redo) {
    renderHistoryButtons();
    return;
  }
  renderHistoryButtons();
  state.isRedoing = true;
  try {
    await item.redo();
    state.undoStack.unshift(item);
    if (state.undoStack.length > 20) state.undoStack.length = 20;
    showToast(`${item.label} 다시 실행했습니다.`);
  } catch (error) {
    state.redoStack.unshift(item);
    showToast(error.message || "다시 실행하지 못했습니다.");
  } finally {
    state.isRedoing = false;
    renderHistoryButtons();
  }
}

async function restoreTaskSnapshots(snapshots) {
  for (const snapshot of snapshots) {
    const result = await patchTask(snapshot.id, taskPatch(snapshot));
    mergeSavedTask(snapshot.id, result.task || snapshot);
  }
  await loadTasks();
}

async function restoreHiddenTaskIds(ids) {
  for (const id of [...new Set(ids)].filter(Boolean)) {
    await restoreHidden({ type: "task", id });
  }
  await loadTasks();
}

async function restoreHiddenProjects(projects) {
  const ids = new Set();
  for (const project of projects) {
    const variants = project.projects?.length ? project.projects : [project.project];
    for (const variant of variants) {
      await restoreHidden({ type: "project", channel: project.channel, project: variant });
    }
    (project.ids || []).forEach((id) => ids.add(id));
  }
  for (const id of ids) {
    await restoreHidden({ type: "task", id });
  }
  await loadTasks();
}

async function restoreHiddenChannel(channel) {
  await restoreHidden({ type: "channel", channel });
  await loadTasks();
}

async function restoreHidden(body) {
  const response = await fetch(apiUrl("/api/hidden/restore"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "숨김을 복구하지 못했습니다.");
  notifyDataChanged("restore-hidden");
  return result;
}

async function deleteProjectAliases(aliases) {
  let latestAliases = state.projectAliases;
  for (const alias of aliases) {
    const response = await fetch(apiUrl("/api/project-aliases/delete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: alias.channel, from: alias.from }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "프로젝트 병합 기준을 해제하지 못했습니다.");
    latestAliases = result.projectAliases || latestAliases;
  }
  state.projectAliases = latestAliases || [];
  notifyDataChanged("project-alias-delete");
  await loadTasks();
}

async function hideSelectedTasks() {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  await hideIdsRespectingProjectScope(ids, `선택한 ${ids.length}개 일정`);
}

async function shiftSelectedTasks(deltaDays) {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  const tasks = selectedTasks();
  const nextTasks = tasks.map((task) => ({
    ...task,
    start: shiftDate(task.start, deltaDays),
    end: shiftDate(task.end, deltaDays),
  }));
  if (!(await confirmDateChangePreview({
    title: `선택한 ${ids.length}개 일정 날짜 이동 확인`,
    label: `선택한 ${ids.length}개 일정`,
    originalTasks: tasks,
    nextTasks,
    confirmText: "날짜 저장",
  }))) return;
  await applyBulkTaskUpdates(nextTasks, `선택한 ${ids.length}개 일정 ${deltaDays > 0 ? "+" : ""}${deltaDays}일 이동`, { rescheduleMode: "move" });
}

async function resizeSelectedTaskEnds(deltaDays) {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  const tasks = selectedTasks();
  const nextTasks = tasks.map((task) => {
    const proposedEnd = shiftDate(task.end, deltaDays);
    return {
      ...task,
      end: compareDate(proposedEnd, task.start) < 0 ? task.start : proposedEnd,
    };
  });
  if (!(await confirmDateChangePreview({
    title: `선택한 ${ids.length}개 일정 종료일 조정 확인`,
    label: `선택한 ${ids.length}개 일정`,
    originalTasks: tasks,
    nextTasks,
    confirmText: "날짜 저장",
  }))) return;
  await applyBulkTaskUpdates(nextTasks, `선택한 ${ids.length}개 일정 종료일 ${deltaDays > 0 ? "+" : ""}${deltaDays}일 조정`, { rescheduleMode: "end" });
}

async function bulkSetSelectedStatus() {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  const current = selectedTasks().find((task) => task.status)?.status || "시작 전";
  const input = await openInputModal({
    title: "선택 일정 상태 변경",
    summary: `${contextSummary({ taskIds: ids })}의 상태를 한 번에 바꿉니다.`,
    badge: "상태",
    confirmText: "상태 저장",
    fields: [
      { name: "status", label: "상태", value: current, placeholder: "시작 전" },
    ],
  });
  const status = input?.status?.trim();
  if (!status) return;
  const originalTasks = selectedTasks();
  const nextTasks = originalTasks.map((task) => ({ ...task, status }));
  if (!(await confirmFieldChangePreview({
    title: `선택한 ${ids.length}개 일정 상태 수정 확인`,
    label: `선택한 ${ids.length}개 일정`,
    field: "status",
    fieldLabel: "상태",
    originalTasks,
    nextTasks,
    confirmText: "상태 저장",
  }))) return;
  await applyBulkTaskUpdates(nextTasks, `선택한 ${ids.length}개 일정 상태 수정`);
}

async function markSelectedTasksDone() {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  await markTasksDone(ids, `선택한 ${ids.length}개 일정`);
}

async function markContextDone() {
  const context = state.context;
  if (!context?.taskIds?.length) return;
  const ids = [...new Set(context.taskIds)];
  const label = contextLabel(context);
  hideContextMenu();
  await markTasksDone(ids, label);
}

async function markTasksDone(ids, label = "선택 항목") {
  const originalTasks = tasksForIds(ids).filter((task) => !isDoneTask(task));
  if (!originalTasks.length) {
    showToast("이미 완료 처리된 일정입니다.");
    return;
  }

  const nextTasks = originalTasks.map((task) => ({ ...task, status: "완료" }));
  if (!(await confirmFieldChangePreview({
    title: `${label} 완료 처리 확인`,
    label,
    field: "status",
    fieldLabel: "상태",
    originalTasks,
    nextTasks,
    confirmText: "완료 처리",
  }))) return;

  await applyBulkTaskUpdates(nextTasks, `${label} 완료 처리`);
}

async function bulkEditSelectedTasks() {
  const ids = selectedTaskIds();
  if (!ids.length) return;
  const input = await openInputModal({
    title: "선택 일정 일괄 수정",
    summary: `${contextSummary({ taskIds: ids })}의 특정 항목을 같은 값으로 바꿉니다.`,
    badge: "일괄 수정",
    confirmText: "수정 저장",
    fields: [
      {
        name: "field",
        label: "수정 항목",
        type: "select",
        value: "status",
        options: [
          { value: "status", label: "상태" },
          { value: "channel", label: "채널" },
          { value: "project", label: "프로젝트" },
          { value: "detail", label: "상세일정" },
        ],
      },
      { name: "value", label: "새 값", value: "", placeholder: "적용할 값" },
    ],
  });
  const key = input?.field;
  const value = input?.value?.trim();
  if (!key) return;
  if (!value) return;
  const fieldLabel = bulkFieldLabel(key);
  const originalTasks = selectedTasks();
  const nextTasks = originalTasks.map((task) => ({ ...task, [key]: value }));
  if (!(await confirmFieldChangePreview({
    title: `선택한 ${ids.length}개 일정 ${fieldLabel} 수정 확인`,
    label: `선택한 ${ids.length}개 일정`,
    field: key,
    fieldLabel,
    originalTasks,
    nextTasks,
    confirmText: "수정 저장",
  }))) return;
  await applyBulkTaskUpdates(nextTasks, `선택한 ${ids.length}개 일정 ${fieldLabel} 수정`);
}

function bulkFieldLabel(key) {
  const labels = {
    channel: "채널",
    project: "프로젝트",
    detail: "상세일정",
    status: "상태",
  };
  return labels[key] || "항목";
}

async function linkSelectedTasks() {
  const tasks = selectedTasksInDependencyOrder();
  if (tasks.length < 2) return;

  const nextById = new Map(tasks.map((task) => [task.id, { ...task }]));
  const links = [];
  for (let index = 0; index < tasks.length - 1; index += 1) {
    const predecessor = nextById.get(tasks[index].id);
    const successor = nextById.get(tasks[index + 1].id);
    predecessor.successorIds = addRelatedId(predecessor.successorIds, successor.id);
    successor.predecessorIds = addRelatedId(successor.predecessorIds, predecessor.id);
    links.push({ predecessor, successor });
  }

  if (!(await confirmDependencyChangePreview({
    title: "선택 일정 연결 확인",
    summary: `선택한 ${tasks.length}개 일정을 날짜순으로 ${links.length}개 선후관계로 연결합니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`,
    links,
    result: "연결",
    confirmText: "연결 저장",
  }))) return;

  await applyBulkTaskUpdates([...nextById.values()], `선택한 ${tasks.length}개 일정 연결`);
}

async function unlinkSelectedTasks() {
  const tasks = selectedTasks();
  if (tasks.length < 2) return;
  const selected = new Set(tasks.map((task) => normalizeId(task.id)));
  const links = internalDependencyLinks(tasks);
  if (!links.length) return;
  if (!(await confirmDependencyChangePreview({
    title: "선택 일정 연결 해제 확인",
    summary: `선택한 ${tasks.length}개 일정 사이의 선후관계 ${links.length}개를 해제합니다. 채널팀 플랜 원본은 건드리지 않고 간트_확인에 저장합니다.`,
    links,
    result: "해제",
    confirmText: "연결 해제",
    danger: true,
  }))) return;
  const nextTasks = tasks.map((task) => ({
    ...task,
    predecessorIds: (task.predecessorIds || []).filter((id) => !selected.has(normalizeId(id))),
    successorIds: (task.successorIds || []).filter((id) => !selected.has(normalizeId(id))),
  }));
  await applyBulkTaskUpdates(nextTasks, `선택한 ${tasks.length}개 일정 연결 해제`);
}

function selectedTasksInDependencyOrder() {
  const selected = new Set(selectedTaskIds());
  const rowIndex = new Map(state.rows.map((row, index) => [row.task?.id, index]));
  return selectedTasks().sort((a, b) =>
    compareDate(a.start, b.start) ||
    compareDate(a.end, b.end) ||
    (rowIndex.get(a.id) ?? 999999) - (rowIndex.get(b.id) ?? 999999) ||
    compareText(a.project, b.project) ||
    compareText(a.detail, b.detail),
  ).filter((task) => selected.has(task.id));
}

function selectedTasksHaveInternalDependencies() {
  const tasks = selectedTasks();
  const selected = new Set(tasks.map((task) => normalizeId(task.id)));
  return tasks.some((task) =>
    [...(task.predecessorIds || []), ...(task.successorIds || [])].some((id) => selected.has(normalizeId(id))),
  );
}

function internalDependencyLinks(tasks) {
  const byNormalizedId = new Map((tasks || []).map((task) => [normalizeId(task.id), task]));
  const links = [];
  for (const task of tasks || []) {
    for (const successorId of task.successorIds || []) {
      const successor = byNormalizedId.get(normalizeId(successorId));
      if (successor) links.push({ predecessor: task, successor });
    }
    for (const predecessorId of task.predecessorIds || []) {
      const predecessor = byNormalizedId.get(normalizeId(predecessorId));
      if (predecessor) links.push({ predecessor, successor: task });
    }
  }
  return uniqueDependencyLinks(links);
}

function uniqueDependencyLinks(links) {
  const seen = new Set();
  const result = [];
  for (const link of links || []) {
    if (!link?.predecessor?.id || !link?.successor?.id) continue;
    const key = `${normalizeId(link.predecessor.id)}→${normalizeId(link.successor.id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(link);
  }
  return result;
}

function addRelatedId(ids, id) {
  const normalized = normalizeId(id);
  return [...(ids || []).filter((item) => normalizeId(item) !== normalized), id].filter(Boolean);
}

function uniqueTasksById(tasks) {
  const byId = new Map();
  for (const task of tasks || []) {
    if (task?.id) byId.set(task.id, task);
  }
  return [...byId.values()];
}

async function applyBulkTaskUpdates(nextTasks, label, options = {}) {
  const ids = new Set(nextTasks.map((task) => task.id));
  const previousTasks = state.tasks;
  const nextById = new Map(nextTasks.map((task) => [task.id, task]));
  const directChanges = nextTasks
    .map((task) => {
      const original = previousTasks.find((item) => item.id === task.id);
      return original ? { original, next: task, mode: options.rescheduleMode || "" } : null;
    })
    .filter(Boolean);

  const cascaded = options.rescheduleMode ? dependencyCascadeForChanges(directChanges) : [];
  if (!(await confirmDependencyCascade(label, cascaded))) {
    showToast("후속 일정 변경을 취소했습니다.");
    return;
  }

  state.tasks = state.tasks.map((task) => nextById.get(task.id) || task);
  if (cascaded.length) {
    const cascadeNextById = new Map(cascaded.map((item) => [item.next.id, item.next]));
    state.tasks = state.tasks.map((task) => cascadeNextById.get(task.id) || task);
  }
  const saveTasks = uniqueTasksById([...nextTasks, ...cascaded.map((item) => item.next)]);
  const snapshots = uniqueTasksById([
    ...directChanges.map((change) => ({ ...change.original })),
    ...cascaded.map((item) => ({ ...item.original })),
  ]);
  const redoSnapshots = uniqueTasksById(saveTasks.map((task) => ({ ...task })));
  render();
  const cascadeLabel = cascaded.length ? ` · 후속 ${cascaded.length}개 포함` : "";
  showToast(`${label}${cascadeLabel} 저장 중입니다.`);

  try {
    for (const task of saveTasks) {
      const result = await patchTask(task.id, taskPatch(task));
      mergeSavedTask(task.id, result.task);
    }
    pushUndo(
      `${label}${cascadeLabel}`,
      () => restoreTaskSnapshots(snapshots),
      () => restoreTaskSnapshots(redoSnapshots),
    );
    render();
    refreshAfterLocalMutation("task-save");
    showToast(`${label}${cascadeLabel} 완료했습니다.`);
  } catch (error) {
    state.tasks = previousTasks;
    render();
    showToast(error.message);
  }
}

function openFilterPanel() {
  els.filterPanel.hidden = false;
  els.filterPanelBackdrop.hidden = false;
  renderFilterState();
  renderFilterMetrics();
}

function closeFilterPanel() {
  els.filterPanel.hidden = true;
  els.filterPanelBackdrop.hidden = true;
}

function applyViewMode(mode) {
  const filters = filtersForViewMode(mode);
  if (!filters) return;
  state.filters = filters;
  state.showCompleted = false;
  state.search = "";
  els.searchInput.value = "";
  clearSelection(false);
  syncViewControls();
  saveViewPrefs();
  render();
  showToast(`${viewModeLabel(mode)} 보기로 전환했습니다.`);
}

function updateFilter(key, value) {
  if (!Object.prototype.hasOwnProperty.call(state.filters, key)) return;
  state.filters[key] = value || "";
  clearSelection(false);
  saveViewPrefs();
  render();
}

function resetFilters() {
  state.filters = defaultFilters();
  state.search = "";
  els.searchInput.value = "";
  clearSelection(false);
  saveViewPrefs();
  render();
  showToast("필터를 초기화했습니다.");
}

function defaultFilters() {
  return { channel: "", detail: "", status: "", assignee: "", date: "", kind: "", issue: "", risk: "" };
}

function filtersForViewMode(mode) {
  const filters = defaultFilters();
  if (mode === "all") return filters;
  if (mode === "ops") return { ...filters, date: "upcoming" };
  if (mode === "review") return { ...filters, issue: "issue" };
  if (mode === "shoot") return { ...filters, date: "upcoming", kind: "shoot" };
  if (mode === "upload") return { ...filters, date: "upcoming", kind: "upload" };
  return null;
}

function syncViewModeButtons() {
  const mode = currentViewMode();
  els.viewModeButtons.forEach((button) => {
    button.classList.toggle("is-active", Boolean(mode && button.dataset.viewMode === mode));
  });
}

function currentViewMode() {
  const f = state.filters || defaultFilters();
  const hasScope = Boolean(f.channel || f.detail || f.status || f.assignee || f.risk);
  if (hasScope) return "";
  if (!f.date && !f.kind && !f.issue) return "all";
  if (f.date === "upcoming" && !f.kind && !f.issue) return "ops";
  if (!f.date && !f.kind && f.issue === "issue") return "review";
  if (f.date === "upcoming" && f.kind === "shoot" && !f.issue) return "shoot";
  if (f.date === "upcoming" && f.kind === "upload" && !f.issue) return "upload";
  return "";
}

function viewModeLabel(mode) {
  const labels = {
    all: "전체",
    ops: "운영",
    review: "검토",
    shoot: "촬영",
    upload: "업로드",
  };
  return labels[mode] || "선택";
}

function handleFilterPanelClick(event) {
  const presetButton = event.target.closest("[data-filter-preset]");
  if (!presetButton) return;
  applyFilterPreset(presetButton.dataset.filterPreset);
}

function applyFilterPreset(preset) {
  if (preset === "active" || preset === "next30") {
    state.filters.date = preset;
  }
  if (preset === "shoot" || preset === "upload") {
    state.filters.kind = preset;
  }
  if (preset === "issue" || preset === "upload-only" || preset === "missing-upload") {
    state.filters.issue = preset;
  }
  clearSelection(false);
  saveViewPrefs();
  render();
}

function openHiddenPanel() {
  els.hiddenPanel.hidden = false;
  els.hiddenPanelBackdrop.hidden = false;
  loadHiddenState();
}

function closeHiddenPanel() {
  els.hiddenPanel.hidden = true;
  els.hiddenPanelBackdrop.hidden = true;
}

function openReviewPanel() {
  els.reviewPanel.hidden = false;
  els.reviewPanelBackdrop.hidden = false;
  renderReviewPanel();
}

function closeReviewPanel() {
  els.reviewPanel.hidden = true;
  els.reviewPanelBackdrop.hidden = true;
}

function openActivityPanel() {
  els.activityPanel.hidden = false;
  els.activityPanelBackdrop.hidden = false;
  loadActivityLog();
}

function closeActivityPanel() {
  els.activityPanel.hidden = true;
  els.activityPanelBackdrop.hidden = true;
}

function openOperationPanel() {
  els.operationPanel.hidden = false;
  els.operationPanelBackdrop.hidden = false;
  renderOperationPanel();
}

function closeOperationPanel() {
  els.operationPanel.hidden = true;
  els.operationPanelBackdrop.hidden = true;
}

async function handleOperationPanelClick(event) {
  const reviewButton = event.target.closest("[data-operation-review-action]");
  if (reviewButton) {
    await handleOperationReviewAction(reviewButton);
    return;
  }

  const button = event.target.closest("[data-operation-action]");
  if (!button) return;

  const action = button.dataset.operationAction;
  if (action === "clean-hidden") {
    await convertHiddenProjectsFromOperation(button);
    return;
  }
  if (action === "hide-completed") {
    await hideCompletedProjectsFromOperation(button);
    return;
  }
  if (action === "open-review") {
    closeOperationPanel();
    openReviewPanel();
    return;
  }
  if (action === "capture-baseline") {
    await captureBaselineFromOperation(button);
    return;
  }
  if (action === "clear-baseline") {
    await clearBaselineFromOperation(button);
    return;
  }
  if (action === "focus-embed") {
    els.embedUrlField.focus();
    els.embedUrlField.select();
    if (state.embed?.embedUrl) await copyEmbedUrl();
  }
  if (action === "copy-fixed-command") {
    await copyFixedSetupCommand();
  }
}

async function handleOperationReviewAction(button) {
  const key = button.dataset.reviewKey || "";
  const kind = button.dataset.reviewKind || "";
  const action = button.dataset.operationReviewAction || "focus";
  if (!key || !kind) return;

  if (action === "focus") {
    closeOperationPanel();
    focusReviewGroup(key, kind);
    return;
  }

  if (action === "select") {
    closeOperationPanel();
    selectReviewGroup(key);
    return;
  }

  if (action === "ignore") {
    await ignoreReviewGroup(key, kind);
    renderOperationPanel();
    return;
  }

  if (action === "hide") {
    await hideReviewGroup(key);
    renderOperationPanel();
    return;
  }

  if (action === "merge") {
    await mergeReviewGroup(key);
    renderOperationPanel();
  }
}

function renderOperationPanel(options = {}) {
  const diagnostics = state.diagnostics || {};
  const report = projectReviewReport();
  const panelRows = state.rows.length ? state.rows : buildRows(filteredTasks());
  const dependencyConflicts = options.dependencyConflicts || dependencyConflictsForRows(panelRows);
  const workloadRisks = options.workloadRisks || workloadRisksForRows(panelRows);
  const embedUrl = operationEmbedUrl();
  const fixedEmbed = Boolean(state.embed?.notionReady);
  const hiddenTotal = Number(diagnostics.hiddenTasks || 0) + Number(diagnostics.hiddenProjects || 0) + Number(diagnostics.hiddenChannels || 0);
  const hiddenLeakCount = Number(diagnostics.hiddenProjectLeaks || state.hiddenProjectLeaks.length || 0);
  const reviewTotal = report.similar.length + report.uploadOnly.length + report.missingUpload.length;
  const urgentReviewCount = reviewHighPriorityCount(report);
  const reviewActionTotal = reviewActionCount(report);
  const defaultHiddenCount = defaultHiddenProjectGroups().length;
  const defaultReviewBacklogCount = defaultReviewBacklogProjectGroups().length;
  const readinessItems = operationReadinessItems({ diagnostics, report, fixedEmbed, dependencyConflicts, workloadRisks });
  const readinessSummary = operationReadinessSummary(readinessItems);

  els.operationSummary.textContent = `${state.connection?.label || "연결 확인 중"} · 완성 조건 ${readinessSummary.ok}/${readinessSummary.total} · 전체 상세일정 ${state.tasks.length}개 · 완료 숨김 ${defaultHiddenCount}개 · 검토 접힘 ${defaultReviewBacklogCount}개 · 숨김 규칙 ${hiddenTotal}개 · 숨김 누수 ${hiddenLeakCount}개 · 긴급 검토 ${urgentReviewCount}개 · 검토 액션 ${reviewActionTotal}개 · 의존성 충돌 ${dependencyConflicts.length}개 · 담당 중복 ${workloadRisks.length}건`;
  els.operationReadinessList.innerHTML = operationReadinessMarkup(readinessItems);
  els.embedUrlField.value = embedUrl;
  els.installNotionEmbedButton.disabled = !state.notionEmbed?.canInstall;
  els.tunnelUrlField.value = state.tunnel?.embedUrl || state.tunnel?.publicBaseUrl || "";
  els.startTunnelButton.disabled = !state.tunnel?.available || state.tunnel?.running;
  els.stopTunnelButton.disabled = !state.tunnel?.running;
  els.tunnelStatusText.textContent = tunnelStatusDetail();
  els.publicUrlField.value = state.embed?.publicBaseUrl || state.embed?.detectedBaseUrl || "";
  els.fixedCommandRow.hidden = fixedEmbed;
  els.fixedCommandField.value = operationFixedSetupCommand();
  const embedDetail = fixedEmbed
    ? state.embed?.message || "노션 Embed 주소가 고정되어 있습니다."
    : state.embed?.message || "APP_PUBLIC_BASE_URL 또는 CLOUDFLARE_TUNNEL_HOSTNAME이 비어 있어 localhost/임시 터널 주소입니다. 노션에 한 번만 넣고 계속 쓰려면 고정 도메인 설정이 필요합니다.";
  els.embedStatusList.innerHTML = [
    statusItemMarkup(fixedEmbed ? "고정 주소" : "임시/로컬 주소", embedDetail, fixedEmbed ? "ok" : "warn"),
    statusItemMarkup(
      state.embed?.hasEmbedKey ? "Embed 보호키 있음" : "Embed 보호키 없음",
      state.embed?.hasEmbedKey ? "노션 주소에 포함된 키로 API 접근을 보호합니다." : "공개 주소를 쓰려면 APP_EMBED_KEY가 필요합니다.",
      state.embed?.hasEmbedKey ? "ok" : "warn",
    ),
    statusItemMarkup("원본 DB", diagnostics.sourceReadOnly ? "채널팀 플랜은 읽기 전용입니다." : "원본 쓰기 여부를 확인해야 합니다.", diagnostics.sourceReadOnly ? "ok" : "warn"),
    statusItemMarkup("삭제 방식", diagnostics.allowTargetArchive ? "간트_확인 페이지를 보관 처리할 수 있습니다." : "삭제는 화면 숨김으로 처리됩니다.", diagnostics.allowTargetArchive ? "warn" : "ok"),
    statusItemMarkup("동기화 기준", syncStatusDetail(), "ok"),
    statusItemMarkup("동기화 감지", `서버 변경은 최대 ${Math.round(SYNC_STATUS_INTERVAL_MS / 1000)}초 안에 확인합니다.`, "ok"),
    statusItemMarkup("전체 새로고침", `노션 원본 확인은 약 ${Math.round(FULL_SYNC_INTERVAL_MS / 1000)}초마다 수행합니다.`, "ok"),
    statusItemMarkup("임시 공개 주소", tunnelStatusDetail(), tunnelStatusTone()),
    statusItemMarkup("후속 이동", state.rescheduleDependencies ? "선행 일정 이동/종료 변경 시 연결된 후속 일정도 같이 이동합니다." : "후속 일정 자동 이동이 꺼져 있습니다.", state.rescheduleDependencies ? "ok" : "warn"),
    statusItemMarkup(
      "노션 페이지 등록",
      notionEmbedStatusText(),
      state.notionEmbed?.installed ? "ok" : state.notionEmbed?.canInstall ? "warn" : "bad",
    ),
    startupTaskStatusItemMarkup(),
    statusItemMarkup(
      "공유 보기 설정",
      state.viewSettingsLoaded
        ? "필터, 줌, 접기, 완료 표시가 앱 서버에 저장되어 노션 임베드와 브라우저가 같은 기준을 씁니다."
        : "공유 보기 설정을 확인하는 중입니다.",
      state.viewSettingsLoaded ? "ok" : "warn",
    ),
  ].join("");

  els.operationSetupList.innerHTML = operationSetupItems(fixedEmbed).join("");
  els.operationActionsList.innerHTML = operationActionItems({ diagnostics, report, fixedEmbed, urgentReviewCount })
    .map(operationActionMarkup)
    .join("");

  els.operationMetrics.innerHTML = [
    metricMarkup("표시 일정", diagnostics.visibleTasks ?? state.tasks.length),
    metricMarkup("원본 읽기", diagnostics.sourceTasks ?? 0),
    metricMarkup("간트_확인", diagnostics.targetTasks ?? 0),
    metricMarkup("노션 캐시", notionCacheMetric(diagnostics.notionCache)),
    metricMarkup("EP 분리", diagnostics.multiProjectParts ?? 0),
    metricMarkup("자동 제외", diagnostics.autoExcludedTasks ?? 0),
    metricMarkup("메타 제외", diagnostics.metaExcludedTasks ?? 0),
    metricMarkup("비제작 제외", diagnostics.nonDeliverableExcludedTasks ?? 0),
    metricMarkup("숨김 일정", diagnostics.hiddenTasks ?? 0),
    metricMarkup("숨김 프로젝트", diagnostics.hiddenProjects ?? 0),
    metricMarkup("숨김 누수", diagnostics.hiddenProjectLeaks ?? state.hiddenProjectLeaks.length),
    metricMarkup("숨김 채널", diagnostics.hiddenChannels ?? 0),
    metricMarkup("기본 완료 숨김", defaultHiddenCount),
    metricMarkup("검토 후보 접힘", defaultReviewBacklogCount),
    metricMarkup("완료 감사", diagnostics.projectAudit?.completedDefaultHidden ?? 0),
    metricMarkup("업로드만", diagnostics.projectAudit?.uploadOnly ?? 0),
    metricMarkup("업로드 없음", diagnostics.projectAudit?.missingUpload ?? 0),
    metricMarkup("업로드 예정", diagnostics.projectAudit?.pendingUpload ?? 0),
    metricMarkup("커버리지", diagnostics.dataCoverage ? `${diagnostics.dataCoverage.passed}/${diagnostics.dataCoverage.total}` : "-"),
    metricMarkup("로컬 저장", diagnostics.writeHealth?.localTasks ?? diagnostics.localTasks ?? 0),
    metricMarkup("드래프트", diagnostics.writeHealth?.unmappedOverrides ?? 0),
    metricMarkup("사본 연결", diagnostics.writeHealth?.mappedCopies ?? diagnostics.mappedCopies ?? 0),
    metricMarkup("기준선", state.baseline?.exists ? `${state.baseline.taskCount}개` : "없음"),
    metricMarkup("병합 기준", diagnostics.projectAliases ?? state.projectAliases.length),
    metricMarkup("의존성 충돌", dependencyConflicts.length),
    metricMarkup("담당 중복", workloadRisks.length),
    metricMarkup("사본 마커", diagnostics.markedCopies ?? 0),
    metricMarkup("검토 확인", diagnostics.reviewIgnores ?? state.reviewIgnores.length),
    metricMarkup("마지막 로드", state.loadedAt ? formatTime(state.loadedAt) : "-"),
    metricMarkup("서버 변경", state.syncChangedAt ? formatTime(state.syncChangedAt) : "-"),
    metricMarkup("서버 시작", state.serverStartedAt ? formatTime(state.serverStartedAt) : "-"),
    metricMarkup("앱 버전", state.appVersion ? state.appVersion.split(":").pop() : "-"),
    metricMarkup("동기화 버전", state.syncVersion ? state.syncVersion.split(":")[0] : "-"),
    metricMarkup("보기 설정", state.viewSettingsUpdatedAt ? formatTime(state.viewSettingsUpdatedAt) : "-"),
  ].join("");

  const quality = state.quality?.length ? state.quality : fallbackQualityChecks(diagnostics, fixedEmbed);
  els.operationQualityList.innerHTML = quality
    .map((item) => statusItemMarkup(item.title, item.detail, item.tone || "ok"))
    .join("");

  els.operationReviewList.innerHTML = [
    statusItemMarkup("긴급 확인", urgentReviewCount ? `${urgentReviewCount}개 후보를 먼저 확인하세요.` : "긴급 후보가 없습니다.", urgentReviewCount ? "warn" : "ok"),
    statusItemMarkup("비슷한 이름", reviewToneSummary(report.similar), report.similar.length ? "warn" : "ok"),
    statusItemMarkup("업로드만 있음", reviewToneSummary(report.uploadOnly), report.uploadOnly.length ? "warn" : "ok"),
    statusItemMarkup("업로드 없음", reviewToneSummary(report.missingUpload), report.missingUpload.length ? "warn" : "ok"),
    statusItemMarkup(
      "숨김 누수",
      state.hiddenProjectLeaks.length
        ? `${state.hiddenProjectLeaks.length}개 프로젝트가 일부 일정만 숨겨진 상태입니다. 개별 숨김 정리로 프로젝트 규칙을 보강하세요.`
        : "개별 숨김 때문에 같은 프로젝트가 다시 보이는 후보가 없습니다.",
      state.hiddenProjectLeaks.length ? "bad" : "ok",
    ),
    operationHiddenLeakMarkup(state.hiddenProjectLeaks),
    statusItemMarkup("의존성 충돌", dependencyConflicts.length ? `${dependencyConflicts.length}개 연결의 날짜 순서가 맞지 않습니다.` : "선후행 날짜 충돌이 없습니다.", dependencyConflicts.length ? "bad" : "ok"),
    operationDependencyConflictMarkup(dependencyConflicts),
    statusItemMarkup("담당자 중복", workloadRisks.length ? `${workloadRisks.length}건의 같은 날짜 중복 배정이 있습니다.` : "현재 보기에서 담당자 중복 배정이 없습니다.", workloadRisks.length ? "warn" : "ok"),
    operationWorkloadRiskMarkup(workloadRisks),
    statusItemMarkup("완료 숨김 대상", `${report.completed.length}개 프로젝트`, "ok"),
    statusItemMarkup("확인된 후보", `${state.reviewIgnores.length}개는 검토 목록에서 제외`, "ok"),
    statusItemMarkup("고정 표시 채널", "현대카드 · Hup! · ODG · film94는 프로젝트가 모두 숨겨져도 채널 행을 남깁니다.", "ok"),
    operationReviewQueueMarkup(report),
  ].join("");
}

function operationActionItems({ diagnostics, report, fixedEmbed, urgentReviewCount }) {
  const hiddenTasks = Number(diagnostics.hiddenTasks || 0);
  const hiddenLeaks = Number(diagnostics.hiddenProjectLeaks || state.hiddenProjectLeaks.length || 0);
  const completedCount = report.completed.length;
  const reviewCount = reviewActionCount(report);
  const totalReviewCount = report.similar.length + report.uploadOnly.length + report.missingUpload.length;
  const baselineExists = Boolean(state.baseline?.exists);
  const baselineActions = [
    {
      action: "capture-baseline",
      title: baselineExists ? "기준선 갱신" : "기준선 저장",
      detail: baselineExists
        ? `${state.baseline.createdAtLabel || "저장된 기준선"} · ${state.baseline.taskCount}개 일정과 비교 중`
        : "현재 보이는 운영 일정을 비교 기준으로 저장",
      button: baselineExists ? "갱신" : "저장",
      tone: baselineExists ? "ok" : "warn",
      disabled: !state.tasks.some((task) => isScheduleTask(task) && !isAutoHiddenTask(task)),
    },
    {
      action: "clear-baseline",
      title: "기준선 삭제",
      detail: baselineExists ? "현재 비교 기준을 지웁니다" : "삭제할 기준선 없음",
      button: "삭제",
      tone: baselineExists ? "warn" : "ok",
      disabled: !baselineExists,
    },
  ];
  const embedActions = [
    {
      action: "focus-embed",
      title: "고정 임베드",
      detail: fixedEmbed ? "노션에 한 번만 넣고 계속 쓸 주소가 준비됨" : "노션 링크 반복 교체를 막으려면 먼저 필요",
      button: fixedEmbed ? "복사" : "설정",
      tone: fixedEmbed ? "ok" : "bad",
      disabled: false,
    },
    {
      action: "copy-fixed-command",
      title: "고정 터널 명령",
      detail: fixedEmbed ? "이미 고정 주소가 준비되어 있습니다" : operationFixedSetupCommand(),
      button: "명령 복사",
      tone: fixedEmbed ? "ok" : "warn",
      disabled: fixedEmbed,
    },
  ];
  const cleanupActions = [
    {
      action: "clean-hidden",
      title: "개별 숨김 정리",
      detail: hiddenLeaks
        ? `숨김 누수 후보 ${hiddenLeaks}개 · 개별 숨김 ${hiddenTasks}개`
        : hiddenTasks
          ? `개별 숨김 ${hiddenTasks}개`
          : "정리할 개별 숨김 없음",
      button: "정리",
      tone: hiddenLeaks ? "bad" : hiddenTasks ? "warn" : "ok",
      disabled: !hiddenTasks,
    },
    {
      action: "hide-completed",
      title: "완료 프로젝트 숨김",
      detail: completedCount ? `업로드 완료 ${completedCount}개 프로젝트` : "완료 숨김 대상 없음",
      button: "숨김",
      tone: completedCount ? "warn" : "ok",
      disabled: !completedCount,
    },
    {
      action: "open-review",
      title: "검토 후보",
      detail: reviewCount ? `액션 ${reviewCount}개 · 긴급 ${urgentReviewCount}개 · 전체 ${totalReviewCount}개` : "액션 후보 없음",
      button: "열기",
      tone: urgentReviewCount ? "bad" : reviewCount ? "warn" : "ok",
      disabled: !reviewCount,
    },
  ];
  return fixedEmbed ? [...cleanupActions, ...baselineActions, ...embedActions] : [...embedActions, ...cleanupActions, ...baselineActions];
}

function operationReadinessItems({ diagnostics, report, fixedEmbed, dependencyConflicts, workloadRisks }) {
  const urgentReviewCount = reviewHighPriorityCount(report);
  const reviewActionTotal = reviewActionCount(report);
  const hiddenTasks = Number(diagnostics.hiddenTasks || 0);
  const hiddenProjects = Number(diagnostics.hiddenProjects || 0);
  const hiddenLeaks = Number(diagnostics.hiddenProjectLeaks || state.hiddenProjectLeaks.length || 0);
  const targetReady = state.connection?.writeMode === "target" && !["error"].includes(state.connection?.status || "");
  const sourceReady = Boolean(diagnostics.sourceReadOnly && Number(diagnostics.sourceTasks || 0) > 0);
  const syncReady = Boolean(state.syncVersion && state.appVersion && state.serverStartedAt);
  return [
    {
      title: "노션 고정 임베드",
      detail: fixedEmbed
        ? "공개 HTTPS Embed 주소가 준비되어 노션에 한 번 넣고 계속 쓸 수 있습니다."
        : "공개 HTTPS 주소가 없어 Notion 웹/공유 환경에서는 임베드가 흔들릴 수 있습니다.",
      tone: fixedEmbed ? "ok" : "bad",
    },
    {
      title: "팀플랜 원본 보호",
      detail: sourceReady ? "채널팀 플랜을 읽기 전용으로 불러옵니다." : "팀플랜 읽기 또는 원본 보호 설정을 확인해야 합니다.",
      tone: sourceReady ? "ok" : "bad",
    },
    {
      title: "간트_확인 저장",
      detail: targetReady ? "수정/생성은 간트_확인 프로젝트 DB로 저장됩니다." : "쓰기 대상이 로컬 또는 오류 상태일 수 있습니다.",
      tone: targetReady ? "ok" : "warn",
    },
    {
      title: "공유 보기 동기화",
      detail: state.viewSettingsLoaded ? "필터/줌/접기/완료 표시와 목록 폭이 서버에 저장되어 임베드와 같은 기준을 씁니다." : "공유 보기 설정을 아직 확인 중입니다.",
      tone: state.viewSettingsLoaded ? "ok" : "warn",
    },
    {
      title: "숨김 규칙 안정성",
      detail: hiddenLeaks
        ? `숨김 누수 후보 ${hiddenLeaks}개가 있습니다. 개별 숨김을 프로젝트 숨김 규칙으로 정리해야 다시 보이는 일을 줄일 수 있습니다.`
        : hiddenTasks
        ? `개별 숨김 ${hiddenTasks}개와 프로젝트 숨김 ${hiddenProjects}개가 함께 있습니다. 자주 되살아나면 프로젝트 숨김으로 전환하세요.`
        : `프로젝트 숨김 ${hiddenProjects}개가 규칙으로 유지됩니다.`,
      tone: hiddenLeaks ? "bad" : hiddenTasks > 20 && !hiddenProjects ? "bad" : hiddenTasks ? "warn" : "ok",
    },
    {
      title: "일정 기준선",
      detail: state.baseline?.exists
        ? `${state.baseline.createdAtLabel || "저장된 기준선"} · ${state.baseline.taskCount}개 일정과 현재 일정을 비교합니다.`
        : "운영 기준선을 저장하면 이후 일정 변경 폭을 간트에서 바로 확인할 수 있습니다.",
      tone: state.baseline?.exists ? "ok" : "warn",
    },
    {
      title: "검토 후보",
      detail: urgentReviewCount
        ? `긴급 후보 ${urgentReviewCount}개가 있어 운영 전 확인이 필요합니다.`
        : reviewActionTotal
          ? `검토 액션 ${reviewActionTotal}개가 남아 있지만 긴급 후보는 없습니다.`
          : "즉시 처리할 검토 후보가 없습니다.",
      tone: urgentReviewCount ? "warn" : reviewActionTotal ? "warn" : "ok",
    },
    {
      title: "삭제 안전장치",
      detail: diagnostics.allowTargetArchive ? "삭제가 간트_확인 보관으로 갈 수 있어 운영 전 확인이 필요합니다." : "삭제는 실제 보관 대신 화면 숨김으로 처리됩니다.",
      tone: diagnostics.allowTargetArchive ? "warn" : "ok",
    },
    {
      title: "자동 동기화",
      detail: syncReady ? "서버 변경과 앱 버전을 감지해 다른 창/임베드도 갱신합니다." : "동기화 상태를 아직 확인하지 못했습니다.",
      tone: syncReady ? "ok" : "warn",
    },
    {
      title: "일정 리스크",
      detail: dependencyConflicts.length || workloadRisks.length
        ? `의존성 충돌 ${dependencyConflicts.length}개 · 담당 중복 ${workloadRisks.length}건`
        : "현재 보기에서 의존성 충돌과 담당 중복이 없습니다.",
      tone: dependencyConflicts.length ? "bad" : workloadRisks.length ? "warn" : "ok",
    },
  ];
}

function operationReadinessSummary(items) {
  const list = items || [];
  const ok = list.filter((item) => item.tone === "ok").length;
  return {
    ok,
    total: list.length || 0,
    bad: list.filter((item) => item.tone === "bad").length,
    warn: list.filter((item) => item.tone === "warn").length,
  };
}

function operationReadinessMarkup(items) {
  const summary = operationReadinessSummary(items);
  const tone = summary.bad ? "bad" : summary.warn ? "warn" : "ok";
  const detail = summary.bad
    ? `필수 ${summary.bad}개를 해결해야 노션 임베드 운영 상태로 볼 수 있습니다.`
    : summary.warn
      ? `확인 ${summary.warn}개가 남아 있습니다.`
      : "운영 조건이 모두 통과했습니다.";
  return [
    statusItemMarkup(`준비도 ${summary.ok}/${summary.total}`, detail, tone),
    ...(items || []).map((item) => statusItemMarkup(item.title, item.detail, item.tone || "ok")),
  ].join("");
}

function operationActionMarkup(item) {
  return `
    <div class="operation-action ${escapeHtml(item.tone || "ok")}">
      <span>
        <span class="hidden-item-title">${escapeHtml(item.title)}</span>
        <span class="hidden-item-meta">${escapeHtml(item.detail || "")}</span>
      </span>
      <button type="button"
        data-operation-action="${escapeHtml(item.action)}"
        ${item.disabled ? "disabled" : ""}>${escapeHtml(item.button || "열기")}</button>
    </div>
  `;
}

function operationSetupItems(fixedEmbed) {
  if (fixedEmbed) {
    return [
      statusItemMarkup("노션 Embed 주소", state.embed?.embedUrl || operationEmbedUrl(), "ok"),
      statusItemMarkup("설정 상태", "APP_PUBLIC_BASE_URL 기준 고정 주소가 준비되어 있습니다.", "ok"),
      startupTaskStatusItemMarkup(),
      statusItemMarkup("자가 진단", "연결/쓰기/숨김/Embed 상태가 이상하면 doctor.cmd를 실행해 같은 기준으로 확인하세요.", "ok"),
    ];
  }

  const embedKeyState = state.embed?.hasEmbedKey ? "APP_EMBED_KEY는 준비되어 있습니다." : "APP_EMBED_KEY가 필요합니다.";
  const localEmbedUrl = state.embed?.localEmbedUrl || operationEmbedUrl();
  const currentEmbedUrl = operationEmbedUrl();
  return [
    statusItemMarkup("현재 화면 주소", currentEmbedUrl, "warn"),
    statusItemMarkup("로컬 고정 주소", localEmbedUrl, "warn"),
    statusItemMarkup("1. 고정 도메인 정하기", "Cloudflare에 연결된 도메인의 서브도메인을 정합니다. 예: gantt.example.com", "bad"),
    statusItemMarkup("2. 운영 세팅 실행", "setup-production.cmd -Hostname gantt.example.com을 실행하면 고정 터널, 자동 실행, 진단까지 한 번에 준비합니다.", "bad"),
    statusItemMarkup("3. 노션에 Embed", "출력되는 https://hostname/embed/... 주소를 노션에 한 번만 넣으면 됩니다.", "warn"),
    startupTaskStatusItemMarkup("4. 자동 실행"),
    statusItemMarkup("5. 자가 진단", "doctor.cmd를 실행하면 서버, 팀플랜 읽기, 간트_확인 저장, 숨김 규칙, 고정 Embed 상태를 한 번에 확인합니다.", "warn"),
    statusItemMarkup("Embed 보호키", embedKeyState, state.embed?.hasEmbedKey ? "ok" : "bad"),
  ];
}

function startupTaskStatusItemMarkup(title = "자동 실행") {
  const startup = state.diagnostics?.startupTask || {};
  if (startup.installed) {
    return statusItemMarkup(title, `${startup.fixed?.name || startup.name || "SolpaGanttFixedTunnel"} 예약 작업이 등록되어 있습니다. PC 로그인 후 고정 터널과 로컬 서버를 다시 띄울 수 있습니다.`, "ok");
  }
  if (startup.localInstalled) {
    return statusItemMarkup(title, `${startup.local?.name || "SolpaGanttLocalServer"} 예약 작업이 등록되어 있습니다. PC 로그인 후 로컬 서버는 다시 켜지지만, 노션 공개 임베드에는 고정 HTTPS 주소가 아직 필요합니다.`, "warn");
  }
  if (startup.supported === false) {
    return statusItemMarkup(title, startup.detail || "이 운영체제에서는 Windows 예약 작업 상태를 확인하지 않습니다.", "warn");
  }
  if (startup.scriptExists === false && startup.local?.scriptExists === false) {
    return statusItemMarkup(title, "자동 실행 등록 스크립트를 찾지 못했습니다.", "warn");
  }
  return statusItemMarkup(title, startup.detail || "아직 등록되지 않았습니다. 고정 공개 주소가 없다면 install-local-startup-task.cmd로 로컬 서버 자동 실행부터 등록할 수 있습니다.", "warn");
}

function fallbackQualityChecks(diagnostics, fixedEmbed) {
  return [
    {
      title: fixedEmbed ? "고정 임베드 주소" : "고정 임베드 주소 필요",
      detail: fixedEmbed ? "고정 공개 주소가 준비되어 있습니다." : "APP_PUBLIC_BASE_URL 설정이 필요합니다.",
      tone: fixedEmbed ? "ok" : "bad",
    },
    {
      title: "팀플랜 원본 보호",
      detail: diagnostics.sourceReadOnly ? "채널팀 플랜은 읽기 전용입니다." : "원본 쓰기 여부를 확인해야 합니다.",
      tone: diagnostics.sourceReadOnly ? "ok" : "bad",
    },
  ];
}

function reviewToneSummary(groups) {
  const list = groups || [];
  const high = list.filter((group) => group.reviewTone === "high").length;
  const medium = list.filter((group) => group.reviewTone === "medium").length;
  const low = list.filter((group) => group.reviewTone === "low").length;
  const parts = [
    high ? `긴급 ${high}` : "",
    medium ? `보통 ${medium}` : "",
    low ? `낮음 ${low}` : "",
  ].filter(Boolean);
  return parts.length ? `${list.length}개 후보 · ${parts.join(" · ")}` : `${list.length}개 후보`;
}

function operationReviewQueueMarkup(report) {
  const queue = reviewActionQueue(report);
  if (!queue.length) {
    return `
      <div class="operation-review-queue">
        <div class="hidden-empty">바로 처리할 검토 후보가 없습니다</div>
      </div>
    `;
  }

  return `
    <div class="operation-review-queue">
      <div class="operation-review-head">
        <strong>다음 처리 후보</strong>
        <span>${queue.length}개 우선 표시</span>
      </div>
      ${queue.map(operationReviewQueueItemMarkup).join("")}
    </div>
  `;
}

function operationDependencyConflictMarkup(conflicts) {
  const list = (conflicts || []).slice(0, 5);
  if (!list.length) return "";
  return `
    <div class="operation-review-queue">
      <div class="operation-review-head">
        <strong>의존성 충돌</strong>
        <span>${conflicts.length}개 중 ${list.length}개 표시</span>
      </div>
      ${list.map((conflict) => `
        <div class="operation-review-item">
          <span>
            <strong>${escapeHtml(conflict.toTitle)}</strong>
            <small>${escapeHtml(conflict.message)} · ${dateLabel(conflict.fromEnd)} → ${dateLabel(conflict.toStart)}</small>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function operationWorkloadRiskMarkup(risks) {
  const list = (risks || []).slice(0, 6);
  if (!list.length) return "";
  return `
    <div class="operation-review-queue">
      <div class="operation-review-head">
        <strong>담당자 중복</strong>
        <span>${risks.length}건 중 ${list.length}건 표시</span>
      </div>
      ${list.map((risk) => `
        <div class="operation-review-item">
          <span>
            <strong>${escapeHtml(risk.assignee)} · ${escapeHtml(dateLabel(risk.date))}</strong>
            <small>${escapeHtml(risk.projectCount)}개 프로젝트 · ${escapeHtml(risk.count)}개 일정 · ${escapeHtml(workloadRiskTaskSummary(risk))}</small>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function operationHiddenLeakMarkup(leaks) {
  const list = (leaks || []).slice(0, 6);
  if (!list.length) return "";
  return `
    <div class="operation-review-queue">
      <div class="operation-review-head">
        <strong>숨김 누수 후보</strong>
        <span>${leaks.length}개 중 ${list.length}개 표시</span>
      </div>
      ${list.map((leak) => `
        <div class="operation-review-item">
          <span>
            <strong>${escapeHtml([leak.channel, leak.project].filter(Boolean).join(" / "))}</strong>
            <small>보이는 일정 ${escapeHtml(leak.visibleCount || 0)}개 · 숨긴 일정 ${escapeHtml(leak.hiddenCount || 0)}개 · ${escapeHtml(dateLabel(leak.start))}-${escapeHtml(dateLabel(leak.end))}</small>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function workloadRiskTaskSummary(risk) {
  return (risk.tasks || [])
    .slice(0, 3)
    .map((task) => [task.channel, task.project, task.detail || task.title].filter(Boolean).join(" / "))
    .join(" · ");
}

function reviewActionQueue(report) {
  return [
    ...(report.similar || []).map((group) => ({ ...group, queueKind: "similar" })),
    ...(report.uploadOnly || []).map((group) => ({ ...group, queueKind: "upload-only" })),
    ...(report.missingUpload || []).map((group) => ({ ...group, queueKind: "missing-upload" })),
  ]
    .filter((group) => ["high", "medium"].includes(group.reviewTone || ""))
    .sort(reviewPrioritySort)
    .slice(0, 6);
}

function reviewPriorityQueueMarkup(report) {
  const queue = reviewActionQueue(report);
  if (!queue.length) {
    return `<div class="hidden-empty">현재 필터에서 바로 처리할 후보가 없습니다</div>`;
  }

  return `
    <div class="operation-review-head">
      <strong>지금 볼 후보</strong>
      <span>${queue.length}개 우선 표시</span>
    </div>
    ${queue.map(reviewPriorityQueueItemMarkup).join("")}
  `;
}

function reviewPriorityQueueItemMarkup(group) {
  const kind = group.queueKind || group.reviewKind || "";
  const action = reviewNextActionLabel(group, kind);
  const mergeButton = canQuickMergeReviewGroup(group, kind)
    ? `<button type="button" data-review-merge="${escapeHtml(group.key)}">병합</button>`
    : "";
  const hideButton = kind === "similar" ? "" : `<button type="button" data-review-hide="${escapeHtml(group.key)}">숨김</button>`;
  const meta = [
    reviewKindLabel(kind),
    reviewRecencyLabel(group),
    `${dateLabel(group.range.start)}-${dateLabel(group.range.end)}`,
  ].filter(Boolean).join(" · ");

  return `
    <div class="operation-review-item review-priority-item">
      <span>
        <span class="hidden-item-title">
          <span class="review-priority ${escapeHtml(group.reviewTone || "medium")}">${escapeHtml(reviewPriorityLabel(group))}</span>
          ${escapeHtml(group.project)}
          <span class="review-channel-pill">${escapeHtml(group.channel || "채널")}</span>
        </span>
        <span class="hidden-item-meta">${escapeHtml(meta)}</span>
        <span class="hidden-item-meta">${escapeHtml(action)}</span>
      </span>
      <span class="review-actions">
        <button type="button"
          data-review-focus="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">보기</button>
        <button type="button" data-review-select="${escapeHtml(group.key)}">선택</button>
        ${mergeButton}
        ${hideButton}
        <button type="button"
          data-review-ignore="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">확인</button>
      </span>
    </div>
  `;
}

function operationReviewQueueItemMarkup(group) {
  const kind = group.queueKind || group.reviewKind || "";
  const action = reviewNextActionLabel(group, kind);
  const mergeButton = canQuickMergeReviewGroup(group, kind)
    ? `<button type="button"
          data-operation-review-action="merge"
          data-review-key="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">병합</button>`
    : "";
  const hideButton = kind === "similar" ? "" : `<button type="button"
          data-operation-review-action="hide"
          data-review-key="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">숨김</button>`;
  const meta = [
    reviewKindLabel(kind),
    reviewRecencyLabel(group),
    `${dateLabel(group.range.start)}-${dateLabel(group.range.end)}`,
  ].filter(Boolean).join(" · ");
  return `
    <div class="operation-review-item">
      <span>
        <span class="hidden-item-title">
          <span class="review-priority ${escapeHtml(group.reviewTone || "medium")}">${escapeHtml(reviewPriorityLabel(group))}</span>
          ${escapeHtml(group.project)}
          <span class="review-channel-pill">${escapeHtml(group.channel || "채널")}</span>
        </span>
        <span class="hidden-item-meta">${escapeHtml(meta)}</span>
        <span class="hidden-item-meta">${escapeHtml(action)}</span>
      </span>
      <span class="review-actions">
        <button type="button"
          data-operation-review-action="focus"
          data-review-key="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">보기</button>
        <button type="button"
          data-operation-review-action="select"
          data-review-key="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">선택</button>
        ${mergeButton}
        ${hideButton}
        <button type="button"
          data-operation-review-action="ignore"
          data-review-key="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">확인</button>
      </span>
    </div>
  `;
}

function operationEmbedUrl() {
  if (state.embed?.embedUrl) return state.embed.embedUrl;
  if (state.tunnel?.embedUrl) return state.tunnel.embedUrl;
  if (state.embed?.localEmbedUrl && isLocalOrigin(window.location.origin)) return state.embed.localEmbedUrl;
  if (state.embed?.embedPath) return `${window.location.origin}${state.embed.embedPath}`;
  if (EMBED_KEY) return `${window.location.origin}/embed/${encodeURIComponent(EMBED_KEY)}`;
  return window.location.href;
}

function isLocalOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

async function convertHiddenProjectsFromOperation(button) {
  button.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/hidden"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "숨김 상태를 불러오지 못했습니다.");

    const projects = Array.isArray(data.convertibleProjects) ? data.convertibleProjects : [];
    state.hiddenConvertibleProjects = projects;
    if (!projects.length) {
      showToast("전환 가능한 프로젝트 숨김이 없습니다.");
      renderOperationPanel();
      return;
    }
    if (!(await confirmHiddenProjectBulkConvertPreview(projects))) {
      button.disabled = false;
      return;
    }

    const convertResponse = await fetch(apiUrl("/api/hidden/convert-projects"), { method: "POST" });
    const result = await convertResponse.json();
    if (!convertResponse.ok) throw new Error(result.error || "프로젝트 숨김으로 전환하지 못했습니다.");
    showToast(`${result.projects || projects.length}개 프로젝트 숨김으로 전환했습니다.`);
    notifyDataChanged("convert-hidden-projects");
    await loadTasks();
    if (!els.hiddenPanel.hidden) await loadHiddenState();
    renderOperationPanel();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function hideCompletedProjectsFromOperation(button) {
  const groups = reviewGroupsForKind("completed");
  if (!groups.length) {
    showToast("완료 숨김 대상이 없습니다.");
    renderOperationPanel();
    return;
  }

  button.disabled = true;
  try {
    await hideReviewSection("completed");
    renderOperationPanel();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function captureBaselineFromOperation(button) {
  const tasks = state.tasks
    .filter((task) => isScheduleTask(task) && !isAutoHiddenTask(task))
    .map((task) => ({
      id: task.id,
      originId: task.originId || "",
      channel: task.channel || "",
      project: task.project || "",
      detail: task.detail || "",
      title: task.title || "",
      start: task.start,
      end: task.end,
    }));
  if (!tasks.length) {
    showToast("기준선으로 저장할 일정이 없습니다.");
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/baseline"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "운영 기준선", tasks }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "기준선을 저장하지 못했습니다.");
    state.baseline = result.baseline || null;
    state.showBaseline = true;
    syncViewControls();
    notifyDataChanged("baseline-save");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast(`${result.baseline?.taskCount || tasks.length}개 일정 기준선을 저장했습니다.`);
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function clearBaselineFromOperation(button) {
  if (!state.baseline?.exists) {
    showToast("삭제할 기준선이 없습니다.");
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/baseline"), { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "기준선을 삭제하지 못했습니다.");
    state.baseline = result.baseline || null;
    syncViewControls();
    notifyDataChanged("baseline-clear");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast("기준선을 삭제했습니다.");
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

function notionCacheMetric(items) {
  const caches = Array.isArray(items) ? items : [];
  if (!caches.length) return "-";
  const source = caches.find((item) => item.source === "source") || caches[0];
  const age = Number(source.ageSeconds || 0);
  const ttl = Number(source.ttlSeconds || 0);
  return ttl ? `${age}/${ttl}초` : `${age}초`;
}

function syncStatusDetail() {
  const parts = [
    state.loadedAt ? `화면 로드 ${formatTime(state.loadedAt)}` : "",
    state.syncChangedAt ? `서버 변경 ${formatTime(state.syncChangedAt)}` : "",
    state.serverStartedAt ? `서버 시작 ${formatTime(state.serverStartedAt)}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "동기화 상태를 확인하는 중입니다.";
}

function notionEmbedStatusText() {
  const info = state.notionEmbed || {};
  const suffix = info.needsPublicUrl
    ? " 현재는 로컬 주소라 같은 PC의 노션에서 쓰는 용도입니다."
    : "";
  if (info.installed) {
    const updated = info.updatedAt ? ` · ${formatTime(info.updatedAt)}` : "";
    return `${info.message || "간트_확인 페이지에 등록되어 있습니다."}${updated}${suffix}`;
  }
  if (info.canInstall) return `${info.message || "간트_확인 페이지에 자동 등록할 수 있습니다."}${suffix}`;
  return info.message || "노션 자동 등록 조건을 확인해야 합니다.";
}

function tunnelStatusDetail() {
  const tunnel = state.tunnel || {};
  if (!tunnel.available) return "임시 공개 주소 도구가 준비되지 않았습니다. tools/cloudflared.exe를 확인하세요.";
  if (tunnel.running && tunnel.embedUrl) return `켜짐 · ${tunnel.embedUrl}`;
  if (tunnel.running) return "공개 주소를 만드는 중입니다.";
  if (tunnel.error) return `마지막 실행 오류 · ${tunnel.error}`;
  if (tunnel.status === "stopped") return "꺼짐 · 필요할 때 임시 주소를 다시 켤 수 있습니다.";
  return "꺼짐 · 고정 도메인이 없을 때 테스트용으로 켤 수 있습니다.";
}

function tunnelStatusTone() {
  const tunnel = state.tunnel || {};
  if (!tunnel.available || tunnel.error) return "warn";
  if (tunnel.running && tunnel.embedUrl) return "ok";
  return "warn";
}

async function copyEmbedUrl() {
  const url = els.embedUrlField.value || operationEmbedUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast("임베드 주소를 복사했습니다.");
  } catch {
    els.embedUrlField.focus();
    els.embedUrlField.select();
    showToast("주소를 선택했습니다. 직접 복사해주세요.");
  }
}

async function startTemporaryTunnelFromPanel() {
  if (!state.tunnel?.available) {
    showToast("임시 공개 주소 도구가 없습니다. tools/cloudflared.exe를 확인하세요.");
    return;
  }

  const confirmed = await openActionPreview({
    title: "임시 공개 주소 켜기",
    summary: "테스트용 공개 주소를 만들고 간트_확인 페이지의 노션 임베드 블록을 자동 갱신합니다. 채널팀 플랜 원본은 건드리지 않습니다.",
    badge: "임시 주소",
    confirmText: "켜기",
    items: [{
      title: "노션 임베드",
      meta: "trycloudflare 임시 주소",
      range: "터널 재시작 시 주소 변경",
      result: "간트_확인 페이지 임베드 갱신",
      danger: false,
    }],
  });
  if (!confirmed) return;

  els.startTunnelButton.disabled = true;
  els.startTunnelButton.textContent = "켜는 중";
  els.tunnelStatusText.textContent = "공개 주소를 만드는 중입니다.";
  try {
    const response = await fetch(apiUrl("/api/tunnel/start"), { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "임시 공개 주소를 만들지 못했습니다.");
    state.tunnel = result.tunnel || state.tunnel;
    state.embed = result.embed || state.embed;
    state.notionEmbed = result.notionEmbed || state.notionEmbed;
    notifyDataChanged("temporary-tunnel-start");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast(result.warning || "임시 공개 주소를 켜고 노션 임베드를 갱신했습니다.");
  } catch (error) {
    showToast(error.message);
    renderOperationPanel();
  } finally {
    els.startTunnelButton.textContent = "임시 주소 켜기";
    els.startTunnelButton.disabled = Boolean(state.tunnel?.running) || !state.tunnel?.available;
  }
}

async function stopTemporaryTunnelFromPanel() {
  if (!state.tunnel?.running) {
    showToast("켜져 있는 임시 공개 주소가 없습니다.");
    return;
  }

  els.stopTunnelButton.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/tunnel/stop"), { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "임시 공개 주소를 끄지 못했습니다.");
    state.tunnel = result.tunnel || state.tunnel;
    state.embed = result.embed || state.embed;
    state.notionEmbed = result.notionEmbed || state.notionEmbed;
    notifyDataChanged("temporary-tunnel-stop");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast(result.warning || "임시 공개 주소를 껐습니다.");
  } catch (error) {
    showToast(error.message);
    renderOperationPanel();
  }
}

async function installNotionEmbed() {
  if (!state.notionEmbed?.canInstall) {
    showToast("노션에 등록할 수 있는 임베드 주소나 간트_확인 DB 설정이 없습니다.");
    return;
  }

  const embedUrl = operationEmbedUrl();
  const confirmed = await openActionPreview({
    title: state.notionEmbed?.installed ? "노션 임베드 갱신" : "노션 임베드 등록",
    summary: `간트_확인 페이지에 현재 간트 임베드 주소를 ${state.notionEmbed?.installed ? "갱신" : "등록"}합니다. 채널팀 플랜 원본은 건드리지 않습니다.`,
    badge: "노션 임베드",
    confirmText: state.notionEmbed?.installed ? "갱신" : "등록",
    items: [{
      title: "솔파 간트",
      meta: embedUrl,
      range: state.embed?.notionReady ? "고정 주소" : "로컬 주소",
      result: "간트_확인 페이지",
      danger: false,
    }],
  });
  if (!confirmed) return;

  els.installNotionEmbedButton.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/notion-embed"), { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "노션 임베드를 등록하지 못했습니다.");
    state.notionEmbed = result.notionEmbed || state.notionEmbed;
    notifyDataChanged("notion-embed");
    renderOperationPanel();
    showToast(result.mode === "updated" ? "노션 임베드를 갱신했습니다." : "노션에 간트 임베드를 등록했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    els.installNotionEmbedButton.disabled = !state.notionEmbed?.canInstall;
  }
}

async function savePublicEmbedUrl() {
  const value = els.publicUrlField.value.trim();
  if (!value) {
    showToast("고정 공개 주소를 입력하세요.");
    els.publicUrlField.focus();
    return;
  }

  els.savePublicUrlButton.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/embed-config"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicBaseUrl: value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "고정 공개 주소를 저장하지 못했습니다.");
    state.embed = result.embed || state.embed;
    notifyDataChanged("embed-config-save");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast("고정 공개 주소를 저장했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    els.savePublicUrlButton.disabled = false;
  }
}

async function clearPublicEmbedUrl() {
  els.clearPublicUrlButton.disabled = true;
  try {
    const response = await fetch(apiUrl("/api/embed-config"), { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "고정 공개 주소를 초기화하지 못했습니다.");
    state.embed = result.embed || state.embed;
    els.publicUrlField.value = "";
    notifyDataChanged("embed-config-clear");
    await loadTasks({ preserveScroll: true });
    renderOperationPanel();
    showToast("앱에 저장한 고정 공개 주소를 초기화했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    els.clearPublicUrlButton.disabled = false;
  }
}

function operationFixedSetupCommand() {
  const hostname = state.embed?.tunnelHostname || state.embed?.detectedHost || "gantt.example.com";
  return `setup-production.cmd -Hostname ${hostname}`;
}

async function copyFixedSetupCommand() {
  const command = operationFixedSetupCommand();
  try {
    await navigator.clipboard.writeText(command);
    showToast("고정 터널 실행 명령을 복사했습니다.");
  } catch {
    els.fixedCommandRow.hidden = false;
    els.fixedCommandField.value = command;
    els.fixedCommandField.focus();
    els.fixedCommandField.select();
    showToast("명령을 선택했습니다. 직접 복사해주세요.");
  }
}

function statusItemMarkup(title, detail, tone = "ok") {
  const labels = {
    ok: "정상",
    warn: "확인",
    bad: "필수",
  };
  return `
    <div class="status-item">
      <span class="status-pill ${escapeHtml(tone)}">${escapeHtml(labels[tone] || "확인")}</span>
      <span>
        <span class="hidden-item-title">${escapeHtml(title)}</span>
        <span class="hidden-item-meta">${escapeHtml(detail)}</span>
      </span>
    </div>
  `;
}

function metricMarkup(label, value) {
  return `
    <div class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatNumber(value))}</strong>
    </div>
  `;
}

function formatNumber(value) {
  if (typeof value === "string" && value.trim() && !/^-?\d+(\.\d+)?$/.test(value.trim())) return value;
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return String(value || "-");
  return new Intl.NumberFormat("ko-KR").format(number);
}

async function loadActivityLog() {
  els.activitySummary.textContent = "불러오는 중";
  els.activityList.innerHTML = hiddenEmptyMarkup("불러오는 중");

  try {
    const response = await fetch(apiUrl("/api/activity"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "활동 기록을 불러오지 못했습니다.");
    renderActivityLog(data.activities || [], data.counts || {});
  } catch (error) {
    els.activitySummary.textContent = "불러오지 못했습니다";
    els.activityList.innerHTML = hiddenEmptyMarkup(error.message);
  }
}

function renderActivityLog(activities, counts = {}) {
  const viewSettingsCount = Number(counts.viewSettings ?? activities.filter(isViewSettingActivity).length);
  const visibleActivities = activities.filter((activity) => !isViewSettingActivity(activity));
  const operationalCount = Number(counts.operational ?? visibleActivities.length);
  const hiddenSuffix = viewSettingsCount ? ` · 보기 설정 ${viewSettingsCount}개 접음` : "";
  els.activitySummary.textContent = `작업 변경 ${operationalCount}개${hiddenSuffix}`;
  els.activityList.innerHTML = activityListMarkup(visibleActivities, viewSettingsCount);
}

function activityListMarkup(activities, hiddenViewCount = 0) {
  if (!activities.length) {
    return hiddenEmptyMarkup(hiddenViewCount ? "작업 변경 기록은 아직 없습니다. 보기 설정 변경은 기록에서 접었습니다" : "아직 기록된 변경이 없습니다");
  }
  return activities.slice(0, 120).map(activityMarkup).join("");
}

function isViewSettingActivity(activity) {
  return activity?.target === "view" || activity?.title === "보기 설정";
}

function activityMarkup(activity) {
  const meta = [activityTimeLabel(activity.at), activityTargetLabel(activity.target), activity.actor || "간트"].filter(Boolean).join(" · ");
  const detail = [activity.message, activity.channel, activity.project, activity.detail].filter(Boolean).join(" · ");
  return `
    <div class="hidden-item activity-item">
      <span class="activity-type ${escapeHtml(activity.type || "change")}">${escapeHtml(activityTypeLabel(activity.type))}</span>
      <span>
        <span class="hidden-item-title">${escapeHtml(activity.title || "변경")}</span>
        <span class="hidden-item-meta">${escapeHtml(meta)}</span>
        <span class="hidden-item-meta">${escapeHtml(detail)}</span>
      </span>
    </div>
  `;
}

function activityTypeLabel(type) {
  if (type === "create") return "생성";
  if (type === "update") return "수정";
  if (type === "delete") return "삭제";
  if (type === "hide") return "숨김";
  if (type === "restore") return "복구";
  if (type === "merge") return "병합";
  return "변경";
}

function activityTargetLabel(target) {
  if (target === "target" || target === "target-copy") return "간트_확인";
  if (target === "local") return "로컬";
  if (target === "channel") return "채널";
  if (target === "project") return "프로젝트";
  if (target === "task") return "일정";
  if (target === "project-alias") return "병합 기준";
  return target || "";
}

function activityTimeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = `${date.getMonth() + 1}/${date.getDate()}`;
  return `${day} ${formatTime(value)}`;
}

function renderReviewPanel() {
  try {
    const report = projectReviewReport();
    const filtered = filteredReviewReport(report);
    const filteredCount = filtered.similar.length + filtered.uploadOnly.length + filtered.missingUpload.length + filtered.completed.length;
    const highCount = reviewHighPriorityCount(report);
    const actionCount = reviewActionCount(report);
    const querySuffix = state.reviewQuery.trim() ? ` / 검색 결과 ${filteredCount}` : "";
    const ignoredSuffix = state.reviewIgnores.length ? ` · 확인됨 ${state.reviewIgnores.length}` : "";
    els.reviewSummary.textContent = `액션 ${actionCount} · 긴급 ${highCount} · 비슷한 이름 ${report.similar.length} · 업로드만 ${report.uploadOnly.length} · 업로드 없음 ${report.missingUpload.length} · 완료 숨김 ${report.completed.length}${ignoredSuffix}${querySuffix}`;
    els.reviewPriorityQueue.innerHTML = reviewPriorityQueueMarkup(state.reviewQuery.trim() ? filtered : report);
    renderReviewSection("similar", filtered.similar, els.reviewSimilarList, els.reviewSimilarCount);
    renderReviewSection("upload-only", filtered.uploadOnly, els.reviewUploadOnlyList, els.reviewUploadOnlyCount);
    renderReviewSection("missing-upload", filtered.missingUpload, els.reviewMissingUploadList, els.reviewMissingUploadCount);
    renderReviewSection("completed", filtered.completed, els.reviewCompletedList, els.reviewCompletedCount);
    els.reviewPanel.querySelectorAll("[data-review-query]").forEach((button) => {
      button.classList.toggle("is-active", (button.dataset.reviewQuery || "") === state.reviewQuery);
    });
  } catch (error) {
    els.reviewSummary.textContent = `검토 목록을 다시 계산하지 못했습니다: ${error.message}`;
    els.reviewSimilarList.innerHTML = hiddenEmptyMarkup("검토 계산 오류");
    els.reviewUploadOnlyList.innerHTML = "";
    els.reviewMissingUploadList.innerHTML = "";
    els.reviewCompletedList.innerHTML = "";
  }
}

function reviewHighPriorityCount(report) {
  return [...(report.similar || []), ...(report.uploadOnly || []), ...(report.missingUpload || [])]
    .filter((group) => group.reviewTone === "high")
    .length;
}

function reviewActionCount(report) {
  return [...(report.similar || []), ...(report.uploadOnly || []), ...(report.missingUpload || [])]
    .filter((group) => ["high", "medium"].includes(group.reviewTone || ""))
    .length;
}

function renderReviewSection(kind, groups, listEl, countEl) {
  const list = groups || [];
  const queryActive = Boolean(state.reviewQuery.trim());
  const collapsed = !queryActive && state.reviewCollapsedSections.has(kind);
  if (countEl) countEl.textContent = `${list.length}`;

  const toggle = els.reviewPanel.querySelector(`[data-review-section-toggle="${kind}"]`);
  if (toggle) {
    toggle.textContent = collapsed ? "펼치기" : "접기";
    toggle.classList.toggle("is-active", !collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
  }

  if (collapsed) {
    listEl.innerHTML = reviewCollapsedSectionMarkup(kind, list);
    return;
  }
  listEl.innerHTML = reviewGroupListMarkup(list, kind);
}

function reviewCollapsedSectionMarkup(kind, groups) {
  if (!groups.length) return hiddenEmptyMarkup("없음");
  const list = groups || [];
  const high = list.filter((group) => group.reviewTone === "high").length;
  const medium = list.filter((group) => group.reviewTone === "medium").length;
  const low = list.filter((group) => group.reviewTone === "low").length;
  const done = list.filter((group) => group.reviewTone === "done").length;
  const parts = [
    high ? `긴급 ${high}` : "",
    medium ? `보통 ${medium}` : "",
    low ? `낮음 ${low}` : "",
    done ? `완료 ${done}` : "",
  ].filter(Boolean);
  const first = list[0];
  const detail = parts.length ? parts.join(" · ") : reviewKindLabel(kind);
  const sample = first ? `${first.project} · ${dateLabel(first.range.start)}-${dateLabel(first.range.end)}` : "";
  return `
    <div class="hidden-empty review-collapsed-summary">
      <span>${escapeHtml(`${list.length}개 후보 접힘 · ${detail}`)}</span>
      ${sample ? `<span>${escapeHtml(`첫 후보: ${sample}`)}</span>` : ""}
    </div>
  `;
}

function filteredReviewReport(report = projectReviewReport()) {
  const query = normalizeReviewQuery(state.reviewQuery);
  const apply = (groups) => (query ? groups.filter((group) => reviewGroupMatches(group, query)) : groups);
  return {
    similar: apply(report.similar),
    uploadOnly: apply(report.uploadOnly),
    missingUpload: apply(report.missingUpload),
    completed: apply(report.completed),
  };
}

function normalizeReviewQuery(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function reviewGroupMatches(group, query) {
  if (query === "action" || query === "액션") return ["high", "medium"].includes(group.reviewTone || "");
  if (query === "similar" || query === "비슷한이름") return group.reviewKind === "similar";
  if (query === "upload-only" || query === "업로드만") return group.reviewKind === "upload-only";
  if (query === "missing-upload" || query === "업로드없음") return group.reviewKind === "missing-upload";
  if (query === "completed" || query === "완료") return group.reviewKind === "completed";
  if (query === "high" || query === "긴급") return group.reviewTone === "high";
  if (query === "low" || query === "낮음") return group.reviewTone === "low";
  const text = [
    group.channel,
    group.project,
    group.reviewReason,
    group.nearbyEvidence,
    reviewNextActionLabel(group, group.reviewKind || ""),
    reviewPriorityLabel(group),
    ...(group.sourceProjects || []),
    ...(group.projects || []),
    ...(group.nearbyCandidates || []).map((candidate) => candidate.project),
    ...group.tasks.flatMap((task) => [task.title, task.detail, task.category, task.status, task.assignee]),
  ]
    .join(" ")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "");
  return text.includes(query);
}

function reviewGroupListMarkup(groups, kind) {
  if (!groups.length) return hiddenEmptyMarkup("없음");
  const visible = groups.slice(0, 80).map((group) => reviewGroupMarkup(group, kind)).join("");
  const remaining = groups.length > 80 ? hiddenEmptyMarkup(`나머지 ${groups.length - 80}개는 검색으로 좁혀 확인하세요`) : "";
  return visible + remaining;
}

function reviewGroupMarkup(group, kind) {
  const recency = reviewRecencyLabel(group);
  const meta = [
    `${group.tasks.length}개 일정`,
    `${dateLabel(group.range.start)}-${dateLabel(group.range.end)}`,
    reviewKindLabel(kind),
    recency,
  ].join(" · ");
  const composition = scheduleCompositionLabel(group.tasks);
  const taskStatus = reviewTaskStatusLabel(group.tasks);
  const sourceProjects = group.sourceProjects?.length > 1 ? `원본명 ${group.sourceProjects.join(" / ")}` : "";
  const priority = reviewPriorityLabel(group);
  const reason = group.reviewReason || "";
  const mergeHint = reviewMergeHint(group);
  const evidence = reviewEvidenceLabel(group, kind);
  const nextAction = reviewNextActionLabel(group, kind);
  const extraMeta = [priority, reason, evidence, nextAction, mergeHint, composition, taskStatus, sourceProjects].filter(Boolean).join(" · ");
  const hideButton = kind === "similar" ? "" : `<button type="button" data-review-hide="${escapeHtml(group.key)}">숨김</button>`;
  const mergeButton = canQuickMergeReviewGroup(group, kind)
    ? `<button type="button" data-review-merge="${escapeHtml(group.key)}">병합</button>`
    : "";
  const nearbyMergeCandidate = quickMergeNearbyCandidate(group);
  const nearbyMergeButton = nearbyMergeCandidate
    ? `<button type="button" data-review-nearby-merge="${escapeHtml(group.key)}" data-review-nearby-target="${escapeHtml(nearbyMergeCandidate.key)}">근처 병합</button>`
    : "";
  const nearbyFocusCandidate = firstNearbyCandidate(group);
  const nearbyFocusButton = nearbyFocusCandidate
    ? `<button type="button" data-review-nearby-focus="${escapeHtml(group.key)}" data-review-nearby-target="${escapeHtml(nearbyFocusCandidate.key)}">근처 보기</button>`
    : "";
  return `
    <div class="hidden-item review-item">
      <span>
        <span class="hidden-item-title">
          <span class="review-priority ${escapeHtml(group.reviewTone || "medium")}">${escapeHtml(priority)}</span>
          ${escapeHtml(group.project)}
          <span class="review-channel-pill">${escapeHtml(group.channel || "채널")}</span>
        </span>
        <span class="hidden-item-meta">${escapeHtml(meta)}</span>
        ${extraMeta ? `<span class="hidden-item-meta">${escapeHtml(extraMeta)}</span>` : ""}
      </span>
      <span class="review-actions">
        <button type="button"
          data-review-focus="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">보기</button>
        <button type="button" data-review-select="${escapeHtml(group.key)}">선택</button>
        ${mergeButton}
        ${nearbyFocusButton}
        ${nearbyMergeButton}
        ${hideButton}
        <button type="button"
          data-review-ignore="${escapeHtml(group.key)}"
          data-review-kind="${escapeHtml(kind)}">확인</button>
      </span>
    </div>
  `;
}

function quickMergeNearbyCandidate(group) {
  return (group?.nearbyCandidates || []).find((candidate) => candidate.canQuickMerge) || null;
}

function firstNearbyCandidate(group) {
  return (group?.nearbyCandidates || [])[0] || null;
}

function reviewRecencyLabel(group) {
  const range = group.range || rangeOf(group.tasks || []);
  const today = todayString();
  if (compareDate(range.end, today) < 0) return `지남 ${daysBetween(range.end, today)}일`;
  if (compareDate(range.start, today) > 0) return `예정 ${daysBetween(today, range.start)}일 후`;
  return "진행 구간";
}

function reviewTaskStatusLabel(tasks) {
  const statuses = [...new Set((tasks || []).map((task) => String(task.status || "").trim()).filter(Boolean))];
  if (!statuses.length) return "";
  return `상태 ${statuses.slice(0, 3).join("/")}${statuses.length > 3 ? ` 외 ${statuses.length - 3}` : ""}`;
}

function reviewMergeHint(group) {
  const projects = group?.projects?.length ? group.projects : group?.sourceProjects || [];
  if (hasDifferentEpisodeProjects(projects)) return "회차 불일치 확인 필요";
  if (group?.splitSchedule && group.quickMerge === false) return "자동 병합 보류 · 보기/선택으로 확인";
  const info = mergeTargetInfo(projects);
  if (!info.target || info.aliases.length < 1) return "";
  return `추천 병합 기준 ${info.target}`;
}

function canQuickMergeReviewGroup(group, kind) {
  if (kind !== "similar") return false;
  const projects = group?.projects?.length ? group.projects : group?.sourceProjects || [];
  return projects.length > 1 && !hasDifferentEpisodeProjects(projects) && group.quickMerge !== false && Number(group.score || 0) >= 0.72;
}

function reviewEvidenceLabel(group, kind) {
  if (["upload-only", "missing-upload"].includes(kind)) return group?.nearbyEvidence || "";
  if (kind !== "similar" || !group?.splitSchedule) return "";
  const score = Number(group.score || 0);
  const parts = [];
  if (Number.isFinite(group.splitGapDays)) parts.push(`업로드 간격 ${group.splitGapDays}일`);
  if (score) parts.push(`이름 유사도 ${Math.round(score * 100)}%`);
  return parts.length ? `매칭 근거: ${parts.join(" · ")}` : "";
}

function reviewNextActionLabel(group, kind) {
  if (kind === "similar") {
    return hasDifferentEpisodeProjects(group?.projects || group?.sourceProjects || [])
      ? "다음 액션: 같은 프로젝트인지 회차 먼저 확인"
      : "다음 액션: 병합 후보 확인";
  }
  if (kind === "upload-only") {
    if (group.reviewTone === "low") return "다음 액션: 오래된 단독 업로드면 확인 처리";
    return "다음 액션: 촬영/편집 프로젝트와 매칭 확인";
  }
  if (kind === "missing-upload") {
    if (group.reviewTone === "low") return "다음 액션: 예정/낮은 우선순위로 보류 가능";
    return "다음 액션: 업로드 일정 누락 여부 확인";
  }
  if (kind === "completed") return "다음 액션: 완료 숨김 유지";
  return "";
}

function reviewPriorityLabel(group) {
  if (group.reviewTone === "high") return "긴급";
  if (group.reviewTone === "low") return "낮음";
  if (group.reviewTone === "done") return "완료";
  return "보통";
}

function reviewKindLabel(kind) {
  if (kind === "similar") return "비슷한 이름 후보";
  if (kind === "upload-only") return "업로드만 있음";
  if (kind === "missing-upload") return "업로드 없음";
  return "완료 숨김 대상";
}

function scheduleCompositionLabel(tasks) {
  const counts = [
    ["촬영", (task) => /촬영/i.test([task.detail, task.category, task.title].filter(Boolean).join(" "))],
    ["편집", (task) => /편집|가편/i.test([task.detail, task.category, task.title].filter(Boolean).join(" "))],
    ["업로드", isUploadTask],
  ]
    .map(([label, test]) => {
      const count = tasks.filter(test).length;
      return count ? `${label} ${count}` : "";
    })
    .filter(Boolean);
  return counts.length ? counts.join(" · ") : "";
}

async function loadHiddenState() {
  els.hiddenSummary.textContent = "불러오는 중";
  els.hiddenChannelsList.innerHTML = hiddenEmptyMarkup("불러오는 중");
  els.hiddenProjectsList.innerHTML = hiddenEmptyMarkup("불러오는 중");
  els.hiddenConvertibleProjectsList.innerHTML = hiddenEmptyMarkup("불러오는 중");
  els.hiddenTasksList.innerHTML = hiddenEmptyMarkup("불러오는 중");
  els.projectAliasesList.innerHTML = hiddenEmptyMarkup("불러오는 중");
  els.reviewIgnoresList.innerHTML = hiddenEmptyMarkup("불러오는 중");

  try {
    const response = await fetch(apiUrl("/api/hidden"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "숨김 상태를 불러오지 못했습니다.");
    renderHiddenState(data);
  } catch (error) {
    els.hiddenSummary.textContent = "불러오지 못했습니다";
    els.hiddenChannelsList.innerHTML = hiddenEmptyMarkup(error.message);
    els.hiddenProjectsList.innerHTML = "";
    els.hiddenConvertibleProjectsList.innerHTML = "";
    els.hiddenTasksList.innerHTML = "";
    els.projectAliasesList.innerHTML = "";
    els.reviewIgnoresList.innerHTML = "";
  }
}

function renderHiddenState(data) {
  const counts = data.counts || {};
  state.hiddenConvertibleProjects = Array.isArray(data.convertibleProjects) ? data.convertibleProjects : [];
  els.hiddenSummary.textContent = `채널 ${counts.channels || 0} · 프로젝트 ${counts.projects || 0} · 전환 ${counts.convertibleProjects || 0} · 일정 ${counts.tasks || 0} · 병합 ${counts.projectAliases || 0} · 검토 확인 ${counts.reviewIgnores || 0}`;
  els.hiddenChannelsList.innerHTML = hiddenChannelMarkup(data.channels || []);
  els.hiddenProjectsList.innerHTML = hiddenProjectMarkup(data.projects || []);
  els.hiddenConvertibleProjectsList.innerHTML = hiddenConvertibleProjectMarkup(data.convertibleProjects || []);
  els.hiddenTasksList.innerHTML = hiddenTaskMarkup(data.tasks || []);
  els.projectAliasesList.innerHTML = projectAliasMarkup(data.projectAliases || []);
  els.reviewIgnoresList.innerHTML = reviewIgnoreMarkup(data.reviewIgnores || []);
}

function hiddenChannelMarkup(channels) {
  if (!channels.length) return hiddenEmptyMarkup("없음");
  return channels
    .map((item) => hiddenItemMarkup({
      title: item.name,
      meta: "채널 숨김",
      type: "channel",
      channel: item.name,
    }))
    .join("");
}

function hiddenProjectMarkup(projects) {
  if (!projects.length) return hiddenEmptyMarkup("없음");
  return projects
    .map((item) => hiddenItemMarkup({
      title: item.project,
      meta: [item.channel, item.taskIds?.length ? `ID 보강 ${item.taskIds.length}개` : ""].filter(Boolean).join(" · "),
      type: "project",
      channel: item.channel,
      project: item.project,
    }))
    .join("");
}

function hiddenConvertibleProjectMarkup(projects) {
  if (!projects.length) return hiddenEmptyMarkup("전환 가능한 프로젝트 숨김이 없습니다");
  const totalTasks = projects.reduce((sum, item) => sum + Number(item.count || item.ids?.length || 0), 0);
  const bulk = `
    <div class="hidden-item hidden-item-bulk">
      <span>
        <span class="hidden-item-title">전환 가능한 프로젝트 ${projects.length}개</span>
        <span class="hidden-item-meta">개별 숨김 ${totalTasks}개를 프로젝트 숨김 규칙으로 정리</span>
      </span>
      <span class="hidden-item-actions">
        <button type="button" data-hidden-project-convert-all="true">모두 전환</button>
      </span>
    </div>
  `;
  return bulk + projects
    .map((item) => {
      const range = item.start && item.end ? dateRangeLabel(item) : "";
      const meta = [
        item.channel,
        `${item.count || item.ids?.length || 0}개 개별 숨김`,
        range,
      ].filter(Boolean).join(" · ");
      return `
        <div class="hidden-item">
          <span>
            <span class="hidden-item-title">${escapeHtml(item.project)}</span>
            <span class="hidden-item-meta">${escapeHtml(meta)}</span>
          </span>
          <span class="hidden-item-actions">
            <button type="button"
              data-hidden-project-convert="true"
              data-channel="${escapeHtml(item.channel || "")}"
              data-project="${escapeHtml(item.project || "")}">프로젝트로 전환</button>
          </span>
        </div>
      `;
    })
    .join("");
}

function hiddenTaskMarkup(tasks) {
  if (!tasks.length) return hiddenEmptyMarkup("없음");
  return tasks
    .map((item) => hiddenItemMarkup({
      title: item.title || item.id.slice(0, 8),
      meta: hiddenTaskMeta(item),
      type: "task",
      id: item.id,
      channel: item.channel,
      project: item.project,
      canConvertProject: canConvertHiddenTaskToProject(item),
    }))
    .join("");
}

function canConvertHiddenTaskToProject(item) {
  if (!item?.found || !item.channel || !item.project || !item.id) return false;
  if (/\d+개\s*(채널|프로젝트)/.test(`${item.channel} ${item.project}`)) return false;
  if (isNonDeliverableTask(item)) return false;
  return !isAutoHiddenTask({
    channel: item.channel,
    project: item.project,
    detail: item.detail,
    title: item.title,
  });
}

function hiddenTaskMeta(item) {
  if (!item?.found) return item.id;
  const range = item.start && item.end ? dateRangeLabel(item) : "";
  const shortId = item.id ? `ID ${item.id.slice(0, 8)}` : "";
  return [item.project, item.detail, range, item.status, item.assignee, shortId].filter(Boolean).join(" · ");
}

function projectAliasMarkup(aliases) {
  if (!aliases.length) return hiddenEmptyMarkup("없음");
  return aliases
    .map((item) => `
      <div class="hidden-item">
        <span>
          <span class="hidden-item-title">${escapeHtml(item.from)} → ${escapeHtml(item.to)}</span>
          <span class="hidden-item-meta">${escapeHtml(item.channel)}</span>
        </span>
        <button type="button"
          data-alias-delete="true"
          data-channel="${escapeHtml(item.channel || "")}"
          data-project="${escapeHtml(item.from || "")}">해제</button>
      </div>
    `)
    .join("");
}

function reviewIgnoreMarkup(items) {
  if (!items.length) return hiddenEmptyMarkup("없음");
  return items
    .map((item) => `
      <div class="hidden-item">
        <span>
          <span class="hidden-item-title">${escapeHtml(item.project || item.key)}</span>
          <span class="hidden-item-meta">${escapeHtml([reviewKindLabel(item.kind), item.channel, item.summary].filter(Boolean).join(" · "))}</span>
        </span>
        <button type="button"
          data-review-ignore-delete="true"
          data-kind="${escapeHtml(item.kind || "")}"
          data-key="${escapeHtml(item.key || "")}"
          data-project="${escapeHtml(item.project || "")}">해제</button>
      </div>
    `)
    .join("");
}

function hiddenItemMarkup(item) {
  const convertButton = item.canConvertProject
    ? `<button type="button"
        data-hidden-project-convert="true"
        data-channel="${escapeHtml(item.channel || "")}"
        data-project="${escapeHtml(item.project || "")}"
        data-id="${escapeHtml(item.id || "")}">프로젝트로</button>`
    : "";
  return `
    <div class="hidden-item">
      <span>
        <span class="hidden-item-title">${escapeHtml(item.title)}</span>
        <span class="hidden-item-meta">${escapeHtml(item.meta || "")}</span>
      </span>
      <span class="hidden-item-actions">
        ${convertButton}
        <button type="button"
          data-restore-type="${escapeHtml(item.type)}"
          data-channel="${escapeHtml(item.channel || "")}"
          data-project="${escapeHtml(item.project || "")}"
          data-id="${escapeHtml(item.id || "")}">복구</button>
      </span>
    </div>
  `;
}

function hiddenEmptyMarkup(text) {
  return `<div class="hidden-empty">${escapeHtml(text)}</div>`;
}

async function handleHiddenPanelClick(event) {
  const bulkConvertButton = event.target.closest("[data-hidden-project-convert-all]");
  if (bulkConvertButton) {
    await convertAllHiddenProjectsFromPanel(bulkConvertButton);
    return;
  }

  const convertButton = event.target.closest("[data-hidden-project-convert]");
  if (convertButton) {
    await convertHiddenTaskProjectFromPanel(convertButton);
    return;
  }

  const aliasButton = event.target.closest("[data-alias-delete]");
  if (aliasButton) {
    await deleteProjectAliasFromPanel(aliasButton);
    return;
  }

  const reviewIgnoreButton = event.target.closest("[data-review-ignore-delete]");
  if (reviewIgnoreButton) {
    await deleteReviewIgnoreFromPanel(reviewIgnoreButton);
    return;
  }

  const button = event.target.closest("[data-restore-type]");
  if (!button) return;

  const body = {
    type: button.dataset.restoreType,
    channel: button.dataset.channel,
    project: button.dataset.project,
    id: button.dataset.id,
  };
  const item = button.closest(".hidden-item");
  const title = item?.querySelector(".hidden-item-title")?.textContent?.trim() || "";
  const meta = item?.querySelector(".hidden-item-meta")?.textContent?.trim() || "";
  if (!(await confirmRestoreHiddenPreview(body, title, meta))) return;

  button.disabled = true;

  try {
    const response = await fetch(apiUrl("/api/hidden/restore"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "복구하지 못했습니다.");
    showToast(result.restored ? "숨김을 복구했습니다." : "이미 복구된 항목입니다.");
    notifyDataChanged("restore-hidden");
    await loadTasks();
    await loadHiddenState();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function convertHiddenTaskProjectFromPanel(button) {
  const body = {
    id: button.dataset.id,
    channel: button.dataset.channel,
    project: button.dataset.project,
  };
  const item = button.closest(".hidden-item");
  const title = item?.querySelector(".hidden-item-title")?.textContent?.trim() || body.project || "숨김 일정";
  const meta = item?.querySelector(".hidden-item-meta")?.textContent?.trim() || body.channel || "";
  if (!(await confirmHiddenTaskProjectConvertPreview(body, title, meta))) return;

  button.disabled = true;

  try {
    const response = await fetch(apiUrl("/api/hidden/convert-project"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "프로젝트 숨김으로 전환하지 못했습니다.");
    showToast(`${result.project || body.project} 프로젝트 숨김으로 전환했습니다.`);
    notifyDataChanged("convert-hidden-project");
    await loadTasks();
    await loadHiddenState();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function convertAllHiddenProjectsFromPanel(button) {
  const projects = state.hiddenConvertibleProjects || [];
  if (!projects.length) {
    showToast("전환 가능한 프로젝트가 없습니다.");
    return;
  }
  if (!(await confirmHiddenProjectBulkConvertPreview(projects))) return;

  button.disabled = true;

  try {
    const response = await fetch(apiUrl("/api/hidden/convert-projects"), { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "프로젝트 숨김으로 전환하지 못했습니다.");
    showToast(`${result.projects || projects.length}개 프로젝트 숨김으로 전환했습니다.`);
    notifyDataChanged("convert-hidden-projects");
    await loadTasks();
    await loadHiddenState();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function handleReviewPanelClick(event) {
  const sectionToggleButton = event.target.closest("[data-review-section-toggle]");
  if (sectionToggleButton) {
    toggleReviewSection(sectionToggleButton.dataset.reviewSectionToggle);
    return;
  }

  const sectionSelectButton = event.target.closest("[data-review-section-select]");
  if (sectionSelectButton) {
    selectReviewSection(sectionSelectButton.dataset.reviewSectionSelect);
    return;
  }

  const sectionHideButton = event.target.closest("[data-review-section-hide]");
  if (sectionHideButton) {
    await hideReviewSection(sectionHideButton.dataset.reviewSectionHide);
    return;
  }

  const focusButton = event.target.closest("[data-review-focus]");
  if (focusButton) {
    focusReviewGroup(focusButton.dataset.reviewFocus, focusButton.dataset.reviewKind);
    return;
  }

  const selectButton = event.target.closest("[data-review-select]");
  if (selectButton) {
    selectReviewGroup(selectButton.dataset.reviewSelect);
    return;
  }

  const mergeButton = event.target.closest("[data-review-merge]");
  if (mergeButton) {
    await mergeReviewGroup(mergeButton.dataset.reviewMerge);
    return;
  }

  const nearbyFocusButton = event.target.closest("[data-review-nearby-focus]");
  if (nearbyFocusButton) {
    focusNearbyReviewGroup(nearbyFocusButton.dataset.reviewNearbyFocus, nearbyFocusButton.dataset.reviewNearbyTarget);
    return;
  }

  const nearbyMergeButton = event.target.closest("[data-review-nearby-merge]");
  if (nearbyMergeButton) {
    await mergeNearbyReviewGroup(nearbyMergeButton.dataset.reviewNearbyMerge, nearbyMergeButton.dataset.reviewNearbyTarget);
    return;
  }

  const hideButton = event.target.closest("[data-review-hide]");
  if (hideButton) {
    await hideReviewGroup(hideButton.dataset.reviewHide);
    return;
  }

  const ignoreButton = event.target.closest("[data-review-ignore]");
  if (ignoreButton) {
    await ignoreReviewGroup(ignoreButton.dataset.reviewIgnore, ignoreButton.dataset.reviewKind);
    return;
  }

  const queryButton = event.target.closest("[data-review-query]");
  if (queryButton) {
    state.reviewQuery = queryButton.dataset.reviewQuery || "";
    els.reviewSearchInput.value = state.reviewQuery;
    renderReviewPanel();
  }
}

function reviewGroupsForKind(kind) {
  const report = filteredReviewReport();
  if (kind === "similar") return report.similar;
  if (kind === "upload-only") return report.uploadOnly;
  if (kind === "missing-upload") return report.missingUpload;
  if (kind === "completed") return report.completed;
  return [];
}

function toggleReviewSection(kind) {
  if (!reviewSectionKinds().includes(kind)) return;
  if (state.reviewCollapsedSections.has(kind)) {
    state.reviewCollapsedSections.delete(kind);
  } else {
    state.reviewCollapsedSections.add(kind);
  }
  saveReviewPanelPrefs();
  renderReviewPanel();
}

function idsForReviewGroups(groups) {
  return [...new Set(groups.flatMap((group) => group.tasks.map((task) => task.id)))];
}

function focusReviewGroup(key, kind) {
  const group = findReviewGroup(key);
  if (!group?.tasks?.length) {
    showToast("볼 수 있는 검토 후보가 없습니다.");
    return;
  }

  state.filters = defaultFilters();
  state.filters.channel = group.channel || "";
  if (kind === "upload-only" || kind === "missing-upload") state.filters.issue = kind;
  if (kind === "completed") state.showCompleted = true;
  state.search = reviewFocusQuery(group, kind);
  els.searchInput.value = state.search;
  closeReviewPanel();
  clearSelection(false);
  syncViewControls();
  saveViewPrefs();
  render();
  scrollToReviewGroup(group);
  showToast(`"${group.project}"만 좁혀 봅니다.`);
}

function reviewFocusQuery(group, kind) {
  if (kind === "similar") return (group.projects || group.sourceProjects || [group.project])[0] || group.project || "";
  return group.project || (group.sourceProjects || [])[0] || "";
}

function scrollToReviewGroup(group) {
  window.requestAnimationFrame(() => {
    const ids = new Set((group.tasks || []).map((task) => task.id));
    const row = state.rows.find((item) =>
      item.kind === "project"
        ? (item.taskIds || []).some((id) => ids.has(id))
        : ids.has(item.id),
    );
    if (!row) return;
    const index = state.rows.findIndex((item) => item.id === row.id);
    if (index < 0) return;
    focusTaskIdsInTimeline([...ids], { center: true, smooth: true });
    els.ganttScroll.scrollTo({
      top: Math.max(index * currentRowHeight() - currentRowHeight(), 0),
      behavior: "smooth",
    });
  });
}

function selectReviewSection(kind) {
  const groups = reviewGroupsForKind(kind);
  const ids = idsForReviewGroups(groups);
  if (!ids.length) {
    showToast("선택할 일정이 없습니다.");
    return;
  }

  if (kind === "completed") {
    state.showCompleted = true;
    els.completedToggleButton.classList.add("is-active");
  }

  closeReviewPanel();
  applySelection(ids, "", ids.length === 1);
  render();
  scheduleSelectedRangeFocus(ids, { center: true });
  showToast(`${reviewKindLabel(kind)} ${groups.length}개 프로젝트를 선택했습니다.`);
}

async function hideReviewSection(kind) {
  const groups = reviewGroupsForKind(kind);
  const ids = idsForReviewGroups(groups);
  if (!ids.length) {
    showToast("숨길 일정이 없습니다.");
    return;
  }

  const label = `${reviewKindLabel(kind)} ${groups.length}개 프로젝트`;
  await hideProjectGroups(reviewGroupsAsProjectHideGroups(groups), label);
  renderReviewPanel();
}

function reviewGroupsAsProjectHideGroups(groups) {
  return (groups || []).map((group) => {
    const ids = (group.tasks || []).map((task) => task.id);
    const projects = [
      group.project,
      ...(group.sourceProjects || []),
      ...(group.projects || []),
      ...(group.tasks || []).flatMap((task) => projectHideVariantsForTask(task, group.project)),
    ];
    return {
      channel: group.channel,
      project: group.project,
      projects: [...new Set(projects.map((project) => String(project || "").trim()).filter(Boolean))],
      ids,
    };
  });
}

function findReviewGroup(key) {
  const report = projectReviewReport();
  return [...report.similar, ...report.uploadOnly, ...report.missingUpload, ...report.completed, ...projectReviewGroups()].find((group) => group.key === key);
}

function selectReviewGroup(key) {
  const group = findReviewGroup(key);
  if (!group?.tasks?.length) {
    showToast("선택할 일정이 없습니다.");
    return;
  }
  if (isCompletedUploadProject(group.tasks)) {
    state.showCompleted = true;
    els.completedToggleButton.classList.add("is-active");
  }
  closeReviewPanel();
  const ids = group.tasks.map((task) => task.id);
  applySelection(ids, "", group.tasks.length === 1);
  render();
  scheduleSelectedRangeFocus(ids, { center: true });
  showToast(`"${group.project}" ${group.tasks.length}개 일정을 선택했습니다.`);
}

function focusNearbyReviewGroup(key, nearbyKey) {
  const group = findReviewGroup(key);
  const nearbyGroup = findReviewGroup(nearbyKey);
  if (!group?.tasks?.length || !nearbyGroup?.tasks?.length) {
    showToast("근처 후보를 찾지 못했습니다.");
    return;
  }

  const ids = [...new Set([...group.tasks, ...nearbyGroup.tasks].map((task) => task.id))];
  state.filters = defaultFilters();
  state.filters.channel = group.channel || nearbyGroup.channel || "";
  state.filters.issue = "issue";
  state.showCompleted = false;
  state.search = "";
  els.searchInput.value = "";
  closeReviewPanel();
  applySelection(ids, "", ids.length === 1);
  syncViewControls();
  saveViewPrefs();
  render();
  scheduleSelectedRangeFocus(ids, { center: true });
  showToast(`"${group.project}"와 근처 후보 "${nearbyGroup.project}"를 함께 봅니다.`);
}

async function hideReviewGroup(key) {
  const group = findReviewGroup(key);
  if (!group?.tasks?.length) {
    showToast("숨길 일정이 없습니다.");
    return;
  }

  const label = `프로젝트 "${group.project}"`;
  await hideProjectGroups(reviewGroupsAsProjectHideGroups([group]), label);
  renderReviewPanel();
}

async function ignoreReviewGroup(key, kind) {
  const group = findReviewGroup(key);
  if (!group?.tasks?.length) {
    showToast("확인할 검토 후보가 없습니다.");
    return;
  }

  if (!(await confirmReviewIgnorePreview(group, kind))) return;

  try {
    const response = await fetch(apiUrl("/api/review-ignores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewIgnorePayload(group, kind)),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "검토 확인을 저장하지 못했습니다.");
    state.reviewIgnores = result.reviewIgnores || state.reviewIgnores;
    notifyDataChanged("review-ignore");
    renderReviewPanel();
    if (!els.operationPanel.hidden) renderOperationPanel();
    showToast(`"${group.project}" 검토 후보를 확인 처리했습니다.`);
  } catch (error) {
    showToast(error.message);
  }
}

function reviewIgnorePayload(group, kind) {
  return {
    kind,
    key: group.key,
    channel: group.channel,
    project: group.project,
    summary: scheduleCompositionLabel(group.tasks) || `${group.tasks.length}개 일정`,
  };
}

async function mergeReviewGroup(key) {
  const group = findReviewGroup(key);
  if (!group) return;
  const mergeProjects = group.projects?.length ? group.projects : [group.project];
  const mergeInfo = mergeTargetInfo(mergeProjects);
  const defaultTarget = mergeInfo.target;
  const hasEpisodeMismatch = hasDifferentEpisodeProjects(mergeProjects);
  if (hasEpisodeMismatch) {
    // merge-review-episode-guard: quick review merge must not combine different episode sets.
    selectReviewGroup(key);
    showToast("회차가 다른 후보는 바로 병합하지 않고 선택만 합니다.");
    return;
  }

  const mergeSummary = mergeInfo.aliases.length
    ? `${mergeInfo.projects.length}개 프로젝트명을 하나의 기준 이름으로 묶습니다. 추천 기준은 "${defaultTarget}"이고, ${mergeInfo.aliases.length}개 이름이 이 기준으로 연결됩니다. 병합 기준만 저장하고 원본 DB는 건드리지 않습니다.`
    : `${mergeInfo.projects.length}개 프로젝트명을 하나의 기준 이름으로 묶습니다. 병합 기준만 저장하고 원본 DB는 건드리지 않습니다.`;
  const input = await openInputModal({
    title: "검토 후보 프로젝트 병합",
    summary: mergeSummary,
    badge: "검토 병합",
    confirmText: "병합 확인",
    fields: [
      { name: "target", label: "기준 프로젝트명", value: defaultTarget, placeholder: "프로젝트명" },
    ],
  });
  const target = input?.target?.trim();
  if (!target) return;

  const aliases = mergeProjects.filter((project) => canonicalProjectKey(project) !== canonicalProjectKey(target));
  if (!aliases.length) {
    showToast("이미 같은 프로젝트 기준입니다.");
    return;
  }

  if (!(await confirmProjectMergePreview({
    title: "프로젝트 병합 확인",
    channel: group.channel,
    target,
    aliases,
    tasks: group.tasks || [],
  }))) return;

  try {
    for (const from of aliases) {
      const response = await fetch(apiUrl("/api/project-aliases"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: group.channel, from, to: target }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "프로젝트 병합 기준을 저장하지 못했습니다.");
      upsertLocalProjectAlias(group.channel, from, target);
    }
    pushUndo("프로젝트 병합", () => deleteProjectAliases(aliases.map((from) => ({ channel: group.channel, from }))));
    refreshAfterLocalMutation("project-alias", 250);
    showToast(`${aliases.length}개 프로젝트명을 "${target}" 기준으로 묶었습니다.`);
    render();
    renderReviewPanel();
  } catch (error) {
    showToast(error.message);
  }
}

async function mergeNearbyReviewGroup(key, candidateKey) {
  const reportGroup = findReviewGroup(key);
  const candidateGroup = projectReviewGroups().find((group) => group.key === candidateKey);
  if (!reportGroup || !candidateGroup) {
    showToast("근처 병합 후보를 찾지 못했습니다.");
    return;
  }
  if (!sameChannelName(reportGroup.channel, candidateGroup.channel)) {
    showToast("같은 채널 안의 후보만 병합할 수 있습니다.");
    return;
  }

  const mergeProjects = [
    reportGroup.project,
    candidateGroup.project,
    ...(reportGroup.sourceProjects || []),
    ...(candidateGroup.sourceProjects || []),
  ].filter(Boolean);

  if (hasDifferentEpisodeProjects(mergeProjects)) {
    selectReviewGroup(key);
    showToast("회차가 다른 근처 후보는 바로 병합하지 않고 선택만 합니다.");
    return;
  }

  const mergeInfo = mergeTargetInfo(mergeProjects);
  const defaultTarget = mergeInfo.target || candidateGroup.project || reportGroup.project;
  const input = await openInputModal({
    title: "근처 후보 프로젝트 병합",
    summary: `"${reportGroup.project}"와 근처 후보 "${candidateGroup.project}"를 하나의 프로젝트 기준으로 묶습니다. 채널팀 플랜 원본은 건드리지 않고 병합 기준만 저장합니다.`,
    badge: "근처 병합",
    confirmText: "병합 확인",
    fields: [
      { name: "target", label: "기준 프로젝트명", value: defaultTarget, placeholder: "프로젝트명" },
    ],
  });
  const target = input?.target?.trim();
  if (!target) return;

  const aliases = mergeInfo.projects.filter((project) => canonicalProjectKey(project) !== canonicalProjectKey(target));
  if (!aliases.length) {
    showToast("이미 같은 프로젝트 기준입니다.");
    return;
  }

  const tasks = uniqueTasksById([...(reportGroup.tasks || []), ...(candidateGroup.tasks || [])]);
  if (!(await confirmProjectMergePreview({
    title: "근처 후보 병합 확인",
    channel: reportGroup.channel,
    target,
    aliases,
    tasks,
  }))) return;

  try {
    for (const from of aliases) {
      const response = await fetch(apiUrl("/api/project-aliases"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: reportGroup.channel, from, to: target }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "프로젝트 병합 기준을 저장하지 못했습니다.");
      upsertLocalProjectAlias(reportGroup.channel, from, target);
    }
    pushUndo("근처 후보 병합", () => deleteProjectAliases(aliases.map((from) => ({ channel: reportGroup.channel, from }))));
    refreshAfterLocalMutation("nearby-project-alias", 250);
    showToast(`근처 후보를 "${target}" 기준으로 묶었습니다.`);
    render();
    renderReviewPanel();
  } catch (error) {
    showToast(error.message);
  }
}

function bestMergeTarget(projects) {
  const sorted = [...projects].filter(Boolean).sort((a, b) => {
    const scoreA = projectTargetScore(a);
    const scoreB = projectTargetScore(b);
    return scoreB - scoreA || b.length - a.length || compareText(a, b);
  });
  return sorted[0] || "";
}

function mergeTargetInfo(projects) {
  const uniqueProjects = [...new Set((projects || []).map((project) => String(project || "").trim()).filter(Boolean))];
  const target = bestMergeTarget(uniqueProjects);
  const aliases = uniqueProjects.filter((project) => canonicalProjectKey(project) !== canonicalProjectKey(target));
  return { projects: uniqueProjects, target, aliases };
}

function hasDifferentEpisodeProjects(projects) {
  const episodeSignatures = (projects || [])
    .map((project) => [...episodeNumbers(canonicalProjectKey(project))].sort((a, b) => a - b).join(","))
    .filter(Boolean);
  return new Set(episodeSignatures).size > 1;
}

function projectTargetScore(project) {
  const text = String(project || "");
  let score = text.length;
  if (/[~∼-]\s*ep?\.?\s*\d|ep?\.?\s*\d+\s*[~∼-]/i.test(text)) score += 18;
  if (/\([^)]*(촬영|업로드|편집|before|after)[^)]*\)/i.test(text)) score -= 12;
  if (/(촬영|업로드|릴리즈|게시|발행|편집|가편)$/i.test(text.trim())) score -= 10;
  return score;
}

async function deleteProjectAliasFromPanel(button) {
  if (!(await confirmProjectAliasDeletePreview(button))) return;
  button.disabled = true;

  try {
    const response = await fetch(apiUrl("/api/project-aliases/delete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: button.dataset.channel,
        from: button.dataset.project,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "프로젝트 병합 기준을 해제하지 못했습니다.");
    state.projectAliases = result.projectAliases || [];
    showToast(result.deleted ? "프로젝트 병합 기준을 해제했습니다." : "이미 해제된 기준입니다.");
    notifyDataChanged("project-alias-delete");
    await loadTasks();
    await loadHiddenState();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

async function deleteReviewIgnoreFromPanel(button) {
  if (!(await confirmReviewIgnoreDeletePreview(button))) return;
  button.disabled = true;

  try {
    const response = await fetch(apiUrl("/api/review-ignores/delete"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: button.dataset.kind,
        key: button.dataset.key,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "검토 확인을 해제하지 못했습니다.");
    state.reviewIgnores = result.reviewIgnores || [];
    showToast(result.deleted ? "검토 확인을 해제했습니다." : "이미 해제된 기준입니다.");
    notifyDataChanged("review-ignore-delete");
    await loadTasks();
    await loadHiddenState();
  } catch (error) {
    button.disabled = false;
    showToast(error.message);
  }
}

function syncEditor() {
  const groupRow = state.editorMode === "group" ? editorGroupRow() : null;
  const task = state.editorMode === "group" ? null : selectedTask();
  const isGroupOpen = state.editorOpen && groupRow;
  const isTaskOpen = state.editorOpen && task;
  const isOpen = Boolean(isGroupOpen || isTaskOpen);
  els.editor.hidden = !isOpen;
  els.layout.classList.toggle("editor-closed", !isOpen);
  els.editor.classList.toggle("is-group-editor", Boolean(isGroupOpen));

  if (!isOpen) {
    setTaskEditorFieldMode();
    els.editorTitle.textContent = "상세일정";
    els.sourceBadge.textContent = "선택 없음";
    els.titleField.value = "";
    els.channelField.value = "";
    els.projectField.value = "";
    els.detailField.value = "";
    els.descriptionField.value = "";
    els.startField.value = todayString();
    els.endField.value = todayString();
    els.statusField.value = "";
    els.assigneeField.value = "";
    renderSwatches(PALETTE[0]);
    renderDetailPresets("");
    els.deleteButton.disabled = true;
    return;
  }

  if (isGroupOpen) {
    syncGroupEditor(groupRow);
    return;
  }

  setTaskEditorFieldMode();
  els.editorTitle.textContent = `${task.project || task.title} · ${task.detail || "상세일정"}`;
  els.sourceBadge.textContent = sourceLabel(task);
  els.titleField.value = task.title;
  els.channelField.value = task.channel;
  els.projectField.value = task.project;
  els.detailField.value = task.detail;
  els.descriptionField.value = task.description || "";
  els.startField.value = task.start;
  els.endField.value = task.end;
  els.statusField.value = task.status;
  els.assigneeField.value = task.assignee;
  renderSwatches(task.color);
  renderDetailPresets(task.detail);
  els.deleteButton.disabled = false;
}

function editorGroupRow() {
  return state.rows.find((row) => row.id === state.editorRowId && ["channel", "project"].includes(row.kind));
}

function syncGroupEditor(row) {
  setGroupEditorFieldMode(row);
  const label = groupKindLabel(row.kind);
  els.editorTitle.textContent = `${row.title} · ${label}`;
  els.sourceBadge.textContent = "간트 메모";
  els.channelField.value = row.kind === "channel" ? row.title : row.channel || "";
  els.projectField.value = row.kind === "project" ? row.title : "";
  els.detailField.value = "";
  els.titleField.value = row.title;
  els.descriptionField.value = state.groupNotes?.[row.id] || "";
  els.startField.value = row.start || todayString();
  els.endField.value = row.end || row.start || todayString();
  els.statusField.value = "";
  els.assigneeField.value = "";
  renderSwatches(row.color || PALETTE[0]);
  renderDetailPresets("");
  els.deleteButton.disabled = true;
}

function setTaskEditorFieldMode() {
  setEditorFieldVisible(els.channelField, true);
  setEditorFieldVisible(els.projectField, true);
  setEditorFieldVisible(els.detailField, true);
  setEditorFieldVisible(els.titleField, true);
  setEditorFieldVisible(els.descriptionField, true);
  setEditorFieldVisible(els.startField, true);
  setEditorFieldVisible(els.endField, true);
  setEditorFieldVisible(els.statusField, true);
  setEditorFieldVisible(els.assigneeField, true);
  setEditorFieldVisible(els.colorField, true);
  els.channelField.disabled = false;
  els.projectField.disabled = false;
  els.detailField.disabled = false;
  els.titleField.disabled = false;
  els.titleField.required = true;
  els.statusField.disabled = false;
  els.assigneeField.disabled = false;
  els.colorField.disabled = false;
  els.descriptionField.rows = 4;
}

function setGroupEditorFieldMode(row) {
  setEditorFieldVisible(els.channelField, true);
  setEditorFieldVisible(els.projectField, row.kind === "project");
  setEditorFieldVisible(els.detailField, false);
  setEditorFieldVisible(els.titleField, false);
  setEditorFieldVisible(els.descriptionField, true);
  setEditorFieldVisible(els.startField, true);
  setEditorFieldVisible(els.endField, true);
  setEditorFieldVisible(els.statusField, false);
  setEditorFieldVisible(els.assigneeField, false);
  setEditorFieldVisible(els.colorField, false);
  els.channelField.disabled = row.kind === "project";
  els.projectField.disabled = row.kind !== "project";
  els.detailField.disabled = true;
  els.titleField.disabled = true;
  els.titleField.required = false;
  els.statusField.disabled = true;
  els.assigneeField.disabled = true;
  els.colorField.disabled = true;
  els.descriptionField.rows = 12;
}

function setEditorFieldVisible(field, visible) {
  const block = field?.closest?.("label") || field?.closest?.("fieldset");
  if (block) block.hidden = !visible;
  if (field) field.disabled = !visible;
}

function groupKindLabel(kind) {
  return kind === "channel" ? "채널" : "프로젝트";
}

async function newTask() {
  const selected = selectedTask();
  const detail = selected?.detail || "촬영";
  await createTaskFromSeed({
    title: selected?.title || "새 상세일정",
    channel: selected?.channel || "새 채널",
    project: selected?.project || "새 프로젝트",
    start: todayString(),
    detail,
    end: shiftDate(todayString(), 3),
    status: "시작 전",
    assignee: "",
    color: selected?.color || colorForDetail(detail, PALETTE[0]),
  }, {
    title: "새 일정 만들기",
    summary: "간트_확인 프로젝트 DB에 새 일정을 만듭니다. 채널팀 플랜 원본은 읽기만 합니다.",
  });
}

async function createTaskFromSeed(seed, copy = {}) {
  const input = await openCreateTaskModal(seed, copy);
  if (!input) return;
  await createTask(input);
}

async function openCreateTaskModal(seed, copy = {}) {
  const start = seed.start || todayString();
  const end = compareDate(seed.end || start, start) < 0 ? start : seed.end || start;
  const input = await openInputModal({
    title: copy.title || "새 일정 만들기",
    summary: copy.summary || "간트_확인에 새 일정을 만듭니다. 채널팀 플랜 원본은 건드리지 않습니다.",
    badge: "생성",
    confirmText: "생성 확인",
    fields: [
      { name: "channel", label: "채널", value: seed.channel || "", placeholder: "채널명" },
      { name: "project", label: "프로젝트", value: seed.project || "", placeholder: "프로젝트명" },
      { name: "detail", label: "상세일정", value: seed.detail || "상세일정", placeholder: "촬영, 편집, 업로드 등" },
      { name: "title", label: "노션 제목", value: seed.title || seed.project || "", placeholder: "간트_확인에 저장될 제목" },
      { name: "description", label: "내용", value: seed.description || "", type: "textarea", required: false, placeholder: "메모" },
      { name: "start", label: "시작", value: start, type: "date" },
      { name: "end", label: "종료", value: end, type: "date" },
      { name: "status", label: "상태", value: seed.status || "시작 전", placeholder: "시작 전" },
      { name: "assignee", label: "담당", value: seed.assignee || "", required: false, placeholder: "담당자" },
      {
        name: "color",
        label: "색상",
        type: "color",
        value: seed.color || colorForDetail(seed.detail, PALETTE[0]),
        options: colorInputOptions(),
      },
    ],
  });
  if (!input) return null;
  const normalizedStart = input.start || start;
  const normalizedEnd = compareDate(input.end || normalizedStart, normalizedStart) < 0 ? normalizedStart : input.end || normalizedStart;
  return {
    title: input.title || input.project || input.detail || "새 상세일정",
    channel: input.channel || "새 채널",
    project: input.project || "새 프로젝트",
    detail: input.detail || "상세일정",
    description: input.description || "",
    start: normalizedStart,
    end: normalizedEnd,
    status: input.status || "시작 전",
    assignee: input.assignee || "",
    color: input.color || seed.color || colorForDetail(input.detail || seed.detail, PALETTE[0]),
  };
}

function colorInputOptions() {
  const labels = ["파랑", "초록", "빨강", "보라", "주황", "청록", "분홍"];
  return PALETTE.map((color, index) => ({ value: color, label: `${labels[index] || "색상"} ${color}` }));
}

async function createTask(seed) {
  const base = {
    title: seed.title || seed.project || "새 상세일정",
    channel: seed.channel || "새 채널",
    project: seed.project || "새 프로젝트",
    detail: seed.detail || "상세일정",
    description: seed.description || "",
    start: seed.start || todayString(),
    end: compareDate(seed.end || seed.start || todayString(), seed.start || todayString()) < 0 ? seed.start || todayString() : seed.end || seed.start || todayString(),
    status: seed.status || "시작 전",
    assignee: seed.assignee || "",
    color: seed.color || PALETTE[Math.floor(Math.random() * PALETTE.length)],
  };
  if (!(await confirmCreateTaskPreview(base))) return;

  try {
    const response = await fetch(apiUrl("/api/tasks"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(base),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "작업을 만들지 못했습니다.");
    state.tasks.push(result.task);
    state.selectedId = result.task.id;
    state.selectedIds = new Set([result.task.id]);
    state.selectionAnchorRowId = result.task.id;
    state.editorOpen = true;
    pushUndo(`"${result.task.detail || result.task.title}" 생성`, async () => {
      const response = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(result.task.id)}`), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "새 작업을 되돌리지 못했습니다.");
      notifyDataChanged("undo-create");
      await loadTasks();
    });
    render();
    refreshAfterLocalMutation("create-task");
    showToast("간트_확인에 상세일정을 만들었습니다.");
  } catch (error) {
    showToast(error.message);
  }
}

async function saveGroupEditor() {
  const row = editorGroupRow();
  if (!row) {
    showToast("편집할 그룹을 찾지 못했습니다.");
    closeEditor();
    return;
  }

  const previousRanges = { ...(state.groupRanges || {}) };
  const previousNotes = { ...(state.groupNotes || {}) };
  const label = groupKindLabel(row.kind);
  const oldRowId = row.id;
  const nextName = (row.kind === "channel" ? els.channelField.value : els.projectField.value).trim() || row.title;
  const normalizedStart = els.startField.value || row.start || todayString();
  const normalizedEnd = compareDate(els.endField.value || normalizedStart, normalizedStart) < 0 ? normalizedStart : els.endField.value || normalizedStart;
  const nextNote = els.descriptionField.value.trim();
  let finalRowId = oldRowId;

  if (nextName !== row.title) {
    if (!taskIdsForRow(row).length) {
      showToast(`일정이 없는 ${label}은 이름 대신 기간과 내용만 저장했습니다.`);
    } else {
      const renamed = await renameGroup(contextForGroupRow(row), nextName);
      if (!renamed) {
        syncEditor();
        return;
      }
      finalRowId = rowIdAfterGroupRename(row, nextName);
    }
  }

  if (finalRowId !== oldRowId) {
    delete state.groupRanges[oldRowId];
    delete state.groupNotes[oldRowId];
  }
  setGroupRangeOverride(finalRowId, { start: normalizedStart, end: normalizedEnd });
  state.groupNotes = { ...(state.groupNotes || {}) };
  if (nextNote) state.groupNotes[finalRowId] = nextNote;
  else delete state.groupNotes[finalRowId];
  state.editorRowId = finalRowId;

  const prefsChanged = JSON.stringify(previousRanges) !== JSON.stringify(state.groupRanges || {}) || JSON.stringify(previousNotes) !== JSON.stringify(state.groupNotes || {});
  if (prefsChanged) {
    const nextRanges = { ...(state.groupRanges || {}) };
    const nextNotes = { ...(state.groupNotes || {}) };
    saveViewPrefs();
    pushUndo(
      `${row.title} ${label} 기간/내용 수정`,
      () => {
        state.groupRanges = previousRanges;
        state.groupNotes = previousNotes;
        saveViewPrefs();
        render();
      },
      () => {
        state.groupRanges = nextRanges;
        state.groupNotes = nextNotes;
        saveViewPrefs();
        render();
      },
    );
  }

  render();
  showToast(`${nextName} ${label} 정보를 저장했습니다.`);
}

function contextForGroupRow(row) {
  return {
    taskIds: taskIdsForRow(row),
    rowId: row.id,
    kind: row.kind,
    channel: row.kind === "channel" ? row.title : row.channel || "",
    project: row.kind === "project" ? row.title : "",
    title: row.title,
  };
}

function rowIdAfterGroupRename(row, nextName) {
  if (row.kind === "channel") return `channel:${nextName}`;
  const channel = row.channel || "";
  return `project:${channel}:${canonicalProjectKey(nextName)}`;
}

async function saveEditor() {
  if (state.editorMode === "group") {
    await saveGroupEditor();
    return;
  }

  const task = selectedTask();
  if (!task) return;

  const patch = {
    title: els.titleField.value.trim() || els.projectField.value.trim() || "새 상세일정",
    channel: els.channelField.value.trim() || "미지정 채널",
    project: els.projectField.value.trim() || "새 프로젝트",
    detail: els.detailField.value.trim() || "상세일정",
    description: els.descriptionField.value.trim(),
    start: els.startField.value,
    end: compareDate(els.endField.value, els.startField.value) < 0 ? els.startField.value : els.endField.value,
    status: els.statusField.value.trim() || "시작 전",
    assignee: els.assigneeField.value.trim(),
    assigneeIds: task.assigneeIds || [],
    color: els.colorField.value,
  };

  const optimistic = { ...task, ...patch };
  const changes = editorChangeItems(task, optimistic);
  if (!changes.length) {
    showToast("바뀐 내용이 없습니다.");
    return;
  }

  if (!(await confirmEditorChangePreview(task, optimistic, changes))) return;

  const rescheduleMode = editorRescheduleMode(task, optimistic);
  await applyBulkTaskUpdates([optimistic], `"${task.detail || task.title}" 편집 저장`, { rescheduleMode });
}

async function deleteSelectedTask() {
  const task = selectedTask();
  const ids = selectedTaskIds();
  if (!ids.length || !task) return;
  const label = ids.length > 1 ? `선택한 ${ids.length}개 일정` : `"${task.detail || task.title}"`;
  await deleteIdsRespectingProjectScope(ids, label);
}

async function patchTask(id, patch) {
  const response = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "저장하지 못했습니다.");
  notifyDataChanged("patch-task");
  return result;
}

function apiUrl(path) {
  if (!EMBED_KEY) return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set("key", EMBED_KEY);
  return `${url.pathname}${url.search}`;
}

function embedKeyFromLocation() {
  const queryKey = new URLSearchParams(window.location.search).get("key");
  if (queryKey) return queryKey;

  const match = window.location.pathname.match(/^\/embed\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function taskPatch(task) {
  return {
    title: canonicalProjectTitle(task.title),
    channel: task.channel,
    project: canonicalProjectTitle(task.project),
    detail: task.detail,
    description: task.description || "",
    start: task.start,
    end: task.end,
    status: task.status,
    assignee: task.assignee,
    assigneeIds: task.assigneeIds || [],
    predecessorIds: task.predecessorIds || [],
    successorIds: task.successorIds || [],
    color: task.color,
  };
}

function mergeSavedTask(id, saved) {
  const previous = state.tasks.find((task) => task.id === id) || {};
  const nextId = saved?.id || id;
  const merged = { ...previous, ...saved, id: nextId };
  let didReplace = false;
  state.tasks = state.tasks.map((task) => {
    if (task.id !== id && task.id !== nextId) return task;
    didReplace = true;
    return { ...task, ...merged };
  });
  if (!didReplace) state.tasks.push(merged);
  if (state.selectedId === id) state.selectedId = nextId;
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
    state.selectedIds.add(nextId);
  }
  if (state.selectionAnchorRowId === id) state.selectionAnchorRowId = nextId;
}

function replaceTask(nextTask) {
  state.tasks = state.tasks.map((task) => (task.id === nextTask.id ? { ...task, ...nextTask } : task));
}

function selectedTask() {
  return state.tasks.find((task) => task.id === state.selectedId);
}

function filteredTasks() {
  const query = String(state.search || "").trim().toLowerCase();
  const baseTasks = state.tasks.filter((task) => taskMatchesQuery(task, query) && taskMatchesNonDateFilters(task));
  if (!state.filters.date) return baseTasks;
  if (!shouldExpandDateFilterToProjects()) {
    return baseTasks.filter((task) => taskMatchesDateFilter(task, state.filters.date));
  }

  const matchingProjects = new Map();
  baseTasks
    .filter((task) => taskMatchesDateFilter(task, state.filters.date))
    .forEach((task) => addProjectScopeMatch(matchingProjects, task));
  return baseTasks.filter((task) => taskMatchesProjectScope(matchingProjects, task));
}

function taskMatchesQuery(task, query) {
  if (!query) return true;
  return [task.channel, task.project, task.detail, task.title, task.status, task.assignee, task.description]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function taskMatchesFilters(task) {
  if (!taskMatchesNonDateFilters(task)) return false;
  if (state.filters.date && !taskMatchesDateFilter(task, state.filters.date)) return false;
  return true;
}

function taskMatchesNonDateFilters(task) {
  if (state.filters.channel && normalizeChannelName(task.channel) !== normalizeChannelName(state.filters.channel)) return false;
  const detail = task.detail || task.category || "";
  if (state.filters.detail && detail !== state.filters.detail) return false;
  if (state.filters.status && (task.status || "") !== state.filters.status) return false;
  if (state.filters.assignee && !assigneeNames(task.assignee).includes(state.filters.assignee)) return false;
  if (state.filters.kind && !taskMatchesKindFilter(task, state.filters.kind)) return false;
  if (state.filters.issue && !taskMatchesIssueFilter(task, state.filters.issue)) return false;
  return true;
}

function shouldExpandDateFilterToProjects() {
  const filters = state.filters || {};
  return Boolean(filters.date && !filters.kind && !filters.detail && !filters.status && !filters.assignee && !filters.issue);
}

function addProjectScopeMatch(scopeMap, task) {
  const channel = normalizeChannelName(task.channel);
  if (!channel) return;
  const keys = projectScopeKeys(task);
  if (!keys.length) return;
  if (!scopeMap.has(channel)) scopeMap.set(channel, []);
  scopeMap.get(channel).push(keys);
}

function taskMatchesProjectScope(scopeMap, task) {
  const channel = normalizeChannelName(task.channel);
  if (!channel || !scopeMap.has(channel)) return false;
  const taskKeys = projectScopeKeys(task);
  return scopeMap.get(channel).some((scopeKeys) => projectKeySetsOverlap(taskKeys, scopeKeys));
}

function projectKeySetsOverlap(leftKeys, rightKeys) {
  return (leftKeys || []).some((leftKey) =>
    (rightKeys || []).some((rightKey) =>
      isSameProjectKey(leftKey, rightKey) ||
      sharesEpisodeIdentity(leftKey, rightKey) ||
      canMergeByEpisodeTitle(leftKey, rightKey) ||
      sharesNamedKeywordSet(leftKey, rightKey) ||
      sharesEmbeddedKoreanName(leftKey, rightKey) ||
      sharesTrustedShortProjectKey(leftKey, rightKey) ||
      sharesTrustedRoot(leftKey, rightKey) ||
      hasStrongProjectContainment(leftKey, rightKey),
    ),
  );
}

function projectScopeKeys(task) {
  const projectName = resolveProjectAliasName(task.channel || "", task.project || task.title || "");
  const key = canonicalProjectKey(projectName);
  if (!key) return [];
  return [...projectAliasKeys(key)];
}

function taskMatchesDateFilter(task, filter) {
  const today = todayString();
  if (filter === "active") return compareDate(task.start, today) <= 0 && compareDate(task.end, today) >= 0;
  if (filter === "upcoming") return compareDate(task.end, today) >= 0;
  if (filter === "next30") {
    const until = shiftDate(today, 30);
    return compareDate(task.end, today) >= 0 && compareDate(task.start, until) <= 0;
  }
  if (filter === "overdue") return compareDate(task.end, today) < 0 && !isDoneTask(task);
  return true;
}

function taskMatchesKindFilter(task, filter) {
  if (filter === "upload") return isUploadTask(task);
  const text = [task.detail, task.category, task.title].filter(Boolean).join(" ");
  if (filter === "shoot") return /촬영|재촬영/i.test(text);
  if (filter === "edit") return /편집|가편/i.test(text);
  return true;
}

function taskMatchesIssueFilter(task, filter) {
  const tasks = projectTasksForIssueFilter(task);
  return projectMatchesIssueFilter(tasks, filter);
}

function projectMatchesIssueFilter(tasks, filter) {
  if (filter === "upload-only") return isUploadOnlyProject(tasks) && !isSupplementalUploadProject(tasks);
  if (filter === "missing-upload") return isMissingUploadProject(tasks);
  if (filter === "issue") return (isUploadOnlyProject(tasks) && !isSupplementalUploadProject(tasks)) || isMissingUploadProject(tasks);
  if (filter === "completed") return shouldHideProjectByDefault(tasks);
  return true;
}

function projectTasksForIssueFilter(task) {
  const channelKey = normalizeChannelName(task.channel);
  const projectName = resolveProjectAliasName(task.channel || "", task.project || task.title || "");
  const projectKeys = [...projectAliasKeys(canonicalProjectKey(projectName))];
  return state.tasks.filter((item) => {
    const itemChannelKey = normalizeChannelName(item.channel);
    if (itemChannelKey !== channelKey) return false;
    const itemProjectName = resolveProjectAliasName(item.channel || "", item.project || item.title || "");
    const itemKeys = [...projectAliasKeys(canonicalProjectKey(itemProjectName))];
    return projectKeySetsOverlap(itemKeys, projectKeys);
  });
}

function calculateRange(rows) {
  if (!rows.length) {
    const start = shiftDate(todayString(), -7);
    return { start, end: shiftDate(start, 45) };
  }

  const minStart = rows.reduce((min, row) => (compareDate(row.start, min) < 0 ? row.start : min), rows[0].start);
  const maxEnd = rows.reduce((max, row) => (compareDate(row.end, max) > 0 ? row.end : max), rows[0].end);
  const start = shiftDate(startOfWeekString(minStart), -7);
  let end = shiftDate(maxEnd, 14);
  if (daysBetween(start, end) < 42) end = shiftDate(start, 42);
  return { start, end };
}

function scrollToToday(smooth = true) {
  const dayWidth = ZOOM[state.zoom].dayWidth;
  const offset = daysBetween(state.rangeStart, todayString()) * dayWidth;
  if (!Number.isFinite(offset)) return;
  els.ganttScroll.scrollTo({
    left: Math.max(offset - 360, 0),
    behavior: smooth ? "smooth" : "auto",
  });
}

function savedLabel(mode) {
  if (mode === "target") return "간트_확인에 저장했습니다.";
  if (mode === "notion") return "노션에 저장했습니다.";
  return "로컬에 저장했습니다.";
}

function sourceLabel(task) {
  if (task.source === "source") return task.syncMode === "target-copy" ? "채널팀 · 간트_확인" : "채널팀 읽기";
  if (task.source === "target") return task.originId ? "간트_확인 사본" : "간트_확인";
  if (task.source === "notion") return task.syncMode === "local" ? "노션 · 로컬" : "노션";
  if (task.source === "demo") return "데모";
  return "로컬";
}

function showToast(message) {
  window.clearTimeout(state.saveTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  state.saveTimer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2600);
}

function todayString() {
  return formatDate(new Date());
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10);
}

function shiftDate(value, offset) {
  return formatDate(addDays(parseDate(value), offset));
}

function addDays(date, days) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeekString(value) {
  const date = parseDate(value);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return formatDate(addDays(date, offset));
}

function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

function compareDate(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "ko");
}

function normalizeId(value) {
  return String(value || "").replaceAll("-", "").toLowerCase();
}

function maxDate(a, b) {
  return a > b ? a : b;
}

function minDate(a, b) {
  return a < b ? a : b;
}

function shortDate(date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function dateLabel(value) {
  return value.slice(5).replace("-", ".");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function modulo(value, size) {
  if (!size) return 0;
  return ((value % size) + size) % size;
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
