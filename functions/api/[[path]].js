const STORE_KEY = "solpa:gantt:store:v1";
const TASK_CACHE_KEY = "solpa:gantt:tasks-cache:v1";
const TASK_CACHE_MS = 5 * 60 * 1000;
const ORIGIN_MARKER_PREFIX = "solpa-gantt-origin";
const SYSTEM_CHANNEL = "__solpa_gantt_config__";
const DEFAULT_ENV = {
  NOTION_VERSION: "2022-06-28",
  NOTION_READ_DATABASE_ID: "20175c38-e3be-4b38-b81e-e8394914431e",
  NOTION_WRITE_DATABASE_ID: "b6e89562-3634-4ef2-bd75-c592a438e372",
  NOTION_TITLE_PROP: "이름",
  NOTION_DATE_PROP: "날짜",
  NOTION_START_PROP: "날짜",
  NOTION_CHANNEL_PROP: "채널명",
  NOTION_PROJECT_PROP: "이름",
  NOTION_DETAIL_PROP: "카테고리",
  NOTION_CATEGORY_PROP: "카테고리",
  NOTION_STATUS_PROP: "상태",
  NOTION_ASSIGNEE_PROP: "사람",
  NOTION_WRITE_TITLE_PROP: "프로젝트",
  NOTION_WRITE_CHANNEL_PROP: "채널",
  NOTION_WRITE_PROJECT_PROP: "프로젝트",
  NOTION_WRITE_DETAIL_PROP: "일정",
  NOTION_WRITE_DATE_PROP: "날짜",
  NOTION_WRITE_STATUS_PROP: "상태",
  NOTION_WRITE_ASSIGNEE_PROP: "담당자",
  NOTION_WRITE_DESCRIPTION_PROP: "메모",
  APP_ALLOW_TARGET_ARCHIVE: "false",
  APP_EMBED_KEY: "140b034014a1a3d4141cfade6df012553e68",
};
const COLOR_LEGEND = {
  channel: "#176B65",
  project: "#D8842F",
  shoot: "#2F80ED",
  edit: "#8B5CF6",
  upload: "#D84E4E",
  pause: "#8B949E",
  default: "#2F80ED",
};
const DEFAULT_PROJECT_ALIAS_RULES = [
  {
    channel: "\uc874\ubc15",
    target: "\uc5d0\uc774\ud2f0\uc988 \uc2a4\ubab0\ud1a1",
    aliases: ["\uc5d0\uc774\ud2f0\uc988 \ud64d\uc911", "\uc5d0\uc774\ud2f0\uc988 \uc2a4\ubab0\ud1a0\ud06c", "ATEEZ Hongjoong", "\ud64d\uc911"],
    contains: [
      ["\uc5d0\uc774\ud2f0\uc988", "\ud64d\uc911"],
      ["ateez", "hongjoong"],
    ],
  },
];

export async function onRequest(context) {
  try {
    return await route(context);
  } catch (error) {
    const status = Number(error.status || 500);
    return json({ error: error.message || "서버에서 처리하지 못한 오류가 발생했습니다." }, status);
  }
}

async function route({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  if (request.method === "OPTIONS") return empty(204);

  if (!hasApiAccess(request, url, env)) {
    return json({ error: "임베드 접근 키가 필요합니다." }, 401);
  }

  if (path === "/tasks" && request.method === "GET") {
    const forceRefresh = ["1", "true", "yes"].includes(String(url.searchParams.get("refresh") || "").toLowerCase());
    return json(await getTasksPayload(env, request, { forceRefresh }));
  }

  if (path === "/sync-status" && request.method === "GET") {
    return json(await getSyncStatus(env));
  }

  if (path === "/events" && request.method === "GET") {
    const status = await getSyncStatus(env);
    return text(`retry: 60000\nevent: snapshot\ndata: ${JSON.stringify(status)}\n\n`, 200, {
      "Content-Type": "text/event-stream; charset=utf-8",
    });
  }

  if (path === "/tasks" && request.method === "POST") {
    const result = await createTaskInTarget(env, normalizeTaskPatch(await readJson(request)));
    return json(result, 201);
  }

  const taskHideMatch = path.match(/^\/tasks\/(.+)\/hide$/);
  if (taskHideMatch && request.method === "POST") {
    return json(await hideTask(env, decodeURIComponent(taskHideMatch[1])));
  }

  const taskMatch = path.match(/^\/tasks\/(.+)$/);
  if (taskMatch && request.method === "PATCH") {
    return json(await patchTask(env, decodeURIComponent(taskMatch[1]), normalizeTaskPatch(await readJson(request))));
  }

  if (taskMatch && request.method === "DELETE") {
    return json(await hideTask(env, decodeURIComponent(taskMatch[1])));
  }

  const channelHideMatch = path.match(/^\/channels\/(.+)\/hide$/);
  if (channelHideMatch && request.method === "POST") {
    return json(await hideChannel(env, decodeURIComponent(channelHideMatch[1])));
  }

  if (path === "/projects/hide" && request.method === "POST") {
    return json(await hideProjectGroup(env, await readJson(request)));
  }

  if (path === "/project-aliases" && request.method === "POST") {
    return json(await saveProjectAlias(env, await readJson(request)));
  }

  if (path === "/project-aliases/delete" && request.method === "POST") {
    return json(await deleteProjectAlias(env, await readJson(request)));
  }

  if (path === "/review-ignores" && request.method === "POST") {
    return json(await saveReviewIgnore(env, await readJson(request)));
  }

  if (path === "/review-ignores/delete" && request.method === "POST") {
    return json(await deleteReviewIgnore(env, await readJson(request)));
  }

  if (path === "/change-requests" && request.method === "GET") {
    return json(await listChangeRequests(env, url));
  }

  if (path === "/change-requests" && request.method === "POST") {
    return json(await saveChangeRequest(env, await readJson(request)), 201);
  }

  const changeRequestMatch = path.match(/^\/change-requests\/(.+)$/);
  if (changeRequestMatch && request.method === "PATCH") {
    return json(await updateChangeRequest(env, decodeURIComponent(changeRequestMatch[1]), await readJson(request)));
  }

  if (changeRequestMatch && request.method === "DELETE") {
    return json(await deleteChangeRequest(env, decodeURIComponent(changeRequestMatch[1])));
  }

  if (path === "/hidden" && request.method === "GET") {
    return json(await getHiddenState(env));
  }

  if (path === "/hidden/restore" && request.method === "POST") {
    return json(await restoreHiddenItem(env, await readJson(request)));
  }

  if (path === "/hidden/convert-project" && request.method === "POST") {
    return json({ converted: false, warning: "Cloudflare 버전에서는 개별 숨김 전환 대신 프로젝트 숨김을 직접 사용합니다." });
  }

  if (path === "/hidden/convert-projects" && request.method === "POST") {
    return json({ converted: 0, warning: "Cloudflare 버전에서는 개별 숨김 전환 대신 프로젝트 숨김을 직접 사용합니다." });
  }

  if (path === "/activity" && request.method === "GET") {
    const store = await readStore(env);
    return json({ activities: store.activityLog || [] });
  }

  if (path === "/view-settings" && request.method === "GET") {
    const store = await readStore(env);
    return json(store.viewSettings || null);
  }

  if (path === "/view-settings" && request.method === "PATCH") {
    return json(await saveViewSettings(env, await readJson(request)));
  }

  if (path === "/baseline" && request.method === "GET") {
    const store = await readStore(env);
    return json(baselineSummary(store.baseline));
  }

  if (path === "/baseline" && request.method === "POST") {
    return json(await saveBaseline(env, await readJson(request)));
  }

  if (path === "/baseline" && request.method === "DELETE") {
    return json(await deleteBaseline(env));
  }

  if (path === "/notion-embed" && request.method === "GET") {
    return json({ notionEmbed: { installed: false, canInstall: false, message: "Cloudflare Pages 주소를 노션 Embed에 한 번 직접 등록하면 됩니다." }, embed: embedInfo(request, env) });
  }

  if (path === "/notion-embed" && request.method === "POST") {
    return json({ notionEmbed: { installed: false, canInstall: false, message: "Cloudflare Pages 배포에서는 고정 pages.dev 주소를 노션 Embed에 직접 넣습니다." }, embed: embedInfo(request, env) });
  }

  if (path === "/embed-config" && (request.method === "PATCH" || request.method === "DELETE")) {
    return json({ saved: false, embed: embedInfo(request, env), message: "Cloudflare Pages 자체 주소가 고정 주소입니다." });
  }

  if (path.startsWith("/tunnel")) {
    return json({
      tunnel: { available: false, running: false, status: "disabled", publicBaseUrl: "", embedUrl: "" },
      embed: embedInfo(request, env),
      warning: "Cloudflare Pages 배포에서는 임시 터널이 필요 없습니다.",
    });
  }

  return json({ error: "API 경로를 찾을 수 없습니다." }, 404);
}

async function getTasksPayload(env, request, options = {}) {
  const store = await readStore(env);
  const now = Date.now();
  const cache = options.forceRefresh ? null : await readTaskCache(env);
  if (cache?.expiresAt > now) {
    return decorateTaskPayload(cache.payload, store, request, env);
  }

  const [readSchema, writeSchema, sourcePages, targetPages] = await Promise.all([
    getDatabaseSchema(env, config(env).readDatabaseId, "read"),
    getDatabaseSchema(env, config(env).writeDatabaseId, "write"),
    queryDatabase(env, config(env).readDatabaseId),
    queryDatabase(env, config(env).writeDatabaseId),
  ]);

  const targetTasksRaw = targetPages.flatMap((page) => pageToTask(page, writeSchema, "target"));
  const targetOriginMap = new Map();
  for (const task of targetTasksRaw) {
    const originId = task.originId || findOriginMarker(task.description);
    if (originId) {
      task.originId = originId;
      targetOriginMap.set(normalizeLookupId(originId), task.id);
    }
  }

  const sourceTasks = sourcePages
    .flatMap((page) => pageToTask(page, readSchema, "source"))
    .filter((task) => !targetOriginMap.has(normalizeLookupId(task.id)))
    .filter((task) => !store.writeMap?.[task.id])
    .map((task) => ({ ...task, syncMode: "read-only" }));

  const sourceTasksForDedupe = sourceTasks.map(normalizeTask).filter(isGanttScheduleTask);
  const targetTasks = targetTasksRaw
    .map((task) => ({
      ...task,
      syncMode: task.originId ? "target-copy" : "target",
    }))
    .filter((task) => !isTargetTaskSupersededBySource(task, sourceTasksForDedupe));

  const tasks = [...sourceTasks, ...targetTasks]
    .map(normalizeTask)
    .filter((task) => task.title || task.project || task.detail)
    .filter((task) => !isHiddenTaskId(store.hiddenNotionIds, task.id))
    .filter((task) => !isHiddenChannelName(store.hiddenChannels, task.channel))
    .filter((task) => !isHiddenProjectName(store.hiddenProjects, task))
    .filter((task) => !isAutoHiddenTask(task))
    .filter(isGanttScheduleTask)
    .sort(sortTasksForGantt);

  const payload = {
    tasks,
    channels: hiddenChannelSummaries([...sourceTasks, ...targetTasks], store),
    hiddenChannels: store.hiddenChannels || [],
    hiddenProjects: store.hiddenProjects || [],
    connection: {
      mode: "notion",
      read: Boolean(config(env).readDatabaseId),
      write: Boolean(config(env).writeDatabaseId),
      source: "채널팀 플랜",
      target: "간트_확인",
    },
    diagnostics: diagnosticsFor(tasks, sourcePages.length, targetPages.length, store),
    quality: [],
    baseline: baselineSummary(store.baseline),
    hiddenProjectLeaks: [],
    reviewIgnores: store.reviewIgnores || [],
    sync: await getSyncStatus(env),
    embed: embedInfo(request, env),
    notionEmbed: {
      installed: true,
      canInstall: false,
      embedUrl: embedInfo(request, env).embedUrl,
      message: "Cloudflare Pages 고정 주소를 사용합니다.",
    },
    tunnel: { available: false, running: false, status: "disabled", publicBaseUrl: "", embedUrl: "" },
    schema: {
      read: summarizeSchema(readSchema),
      write: summarizeSchema(writeSchema),
    },
    settings: {
      readDatabaseId: config(env).readDatabaseId,
      writeDatabaseId: config(env).writeDatabaseId,
      sourceReadOnly: true,
      creates: "target",
      updates: "target-upsert",
    },
    viewSettings: store.viewSettings || null,
    projectAliases: store.projectAliases || [],
    loadedAt: new Date().toISOString(),
  };

  await writeTaskCache(env, payload, now + TASK_CACHE_MS);
  return payload;
}

function decorateTaskPayload(payload, store, request, env) {
  return {
    ...payload,
    hiddenChannels: store.hiddenChannels || [],
    hiddenProjects: store.hiddenProjects || [],
    reviewIgnores: store.reviewIgnores || [],
    baseline: baselineSummary(store.baseline),
    sync: storeMeta(store),
    embed: embedInfo(request, env),
    tunnel: { available: false, running: false, status: "disabled", publicBaseUrl: "", embedUrl: "" },
    viewSettings: store.viewSettings || null,
    projectAliases: store.projectAliases || [],
    loadedAt: new Date().toISOString(),
  };
}

async function createTaskInTarget(env, patch) {
  const schema = await getDatabaseSchema(env, config(env).writeDatabaseId, "write");
  const task = normalizeTask({
    id: crypto.randomUUID(),
    source: "target",
    syncMode: "target",
    ...patch,
  });
  const page = await createTargetPage(env, task, schema);
  const saved = normalizeTask({ ...task, id: page.id, source: "target", syncMode: "target" });
  await mutateStore(env, (store) => {
    addActivity(store, { type: "create", title: "상세일정 생성", task: saved });
  });
  await invalidateTaskCache(env);
  return { task: saved };
}

async function patchTask(env, id, patch) {
  const schema = await getDatabaseSchema(env, config(env).writeDatabaseId, "write");
  const store = await readStore(env);
  const targetId = store.writeMap?.[id] || id;
  const directTarget = await pageExists(env, targetId);

  if (directTarget) {
    await updateTargetPage(env, targetId, patch, schema);
    const saved = normalizeTask({ ...patch, id: targetId, source: "target", syncMode: "target" });
    await mutateStore(env, (nextStore) => {
      addActivity(nextStore, { type: "update", title: "상세일정 수정", task: saved });
    });
    await invalidateTaskCache(env);
    return { task: saved };
  }

  const sourcePage = await notionRequest(env, `/v1/pages/${id}`, { method: "GET" });
  const readSchema = await getDatabaseSchema(env, config(env).readDatabaseId, "read");
  const [sourceTask] = pageToTask(sourcePage, readSchema, "source");
  const nextTask = normalizeTask({ ...sourceTask, ...patch, originId: id, source: "target", syncMode: "target-copy" });
  const page = await createTargetPage(env, nextTask, schema);
  const saved = normalizeTask({ ...nextTask, id: page.id });

  await mutateStore(env, (nextStore) => {
    nextStore.writeMap[id] = page.id;
    addActivity(nextStore, { type: "update", title: "원본 일정 사본 저장", task: saved });
  });
  await invalidateTaskCache(env);
  return { task: saved };
}

async function hideTask(env, id) {
  await mutateStore(env, (store) => {
    const lookup = normalizeLookupId(id);
    if (lookup && !store.hiddenNotionIds.includes(lookup)) store.hiddenNotionIds.push(lookup);
    addActivity(store, { type: "hide", title: "일정 숨김", task: { id } });
  });
  await invalidateTaskCache(env);
  return { hidden: true, id };
}

async function hideChannel(env, channel) {
  const normalized = normalizeChannelName(channel);
  await mutateStore(env, (store) => {
    if (normalized && !store.hiddenChannels.includes(normalized)) store.hiddenChannels.push(normalized);
    addActivity(store, { type: "hide", title: "채널 숨김", task: { channel } });
  });
  await invalidateTaskCache(env);
  return { hidden: true, channel };
}

function projectHideGroupsFromBody(body) {
  const sourceGroups = Array.isArray(body?.groups) ? body.groups : [body];
  const expanded = [];
  for (const group of sourceGroups) {
    if (!group || typeof group !== "object") continue;
    const primaryProject = group.project || group.title;
    const projectVariants = Array.isArray(group.projects) ? group.projects : [];
    const projectValues = primaryProject
      ? [primaryProject]
      : projectVariants;
    const keepTaskIds = Boolean(primaryProject) || projectValues.length === 1;
    for (const projectValue of projectValues) {
      const project = normalizeProjectName(projectValue);
      const channel = normalizeChannelName(group.channel);
      if (!channel || !project) continue;
      expanded.push({
        channel,
        project,
        taskIds: keepTaskIds ? uniqueNormalizedLookupIds([...(group.ids || []), ...(group.taskIds || [])]) : [],
        projects: uniqueNormalizedProjectNames([projectValue, primaryProject, ...projectVariants]),
      });
    }
  }
  return expanded;
}

function uniqueNormalizedLookupIds(values) {
  return [...new Set((values || []).map(normalizeLookupId).filter(Boolean))];
}

function uniqueNormalizedProjectNames(values) {
  return [...new Set((values || []).map(normalizeProjectName).filter(Boolean))];
}

async function hideProjectGroup(env, body) {
  const groups = projectHideGroupsFromBody(body);
  await mutateStore(env, (store) => {
    for (const group of groups) {
      const channel = group.channel;
      const project = group.project;
      if (!channel || !project) continue;
      const existing = store.hiddenProjects.find((item) => item.channel === channel && item.project === project);
      if (existing) {
        existing.taskIds = uniqueNormalizedLookupIds([...(existing.taskIds || []), ...(group.taskIds || [])]);
        existing.projects = uniqueNormalizedProjectNames([existing.project, ...(existing.projects || []), ...(group.projects || [])]);
      } else {
        store.hiddenProjects.push({
          channel,
          project,
          taskIds: group.taskIds || [],
          projects: group.projects || [project],
        });
      }
    }
    addActivity(store, { type: "hide", title: "프로젝트 숨김", count: groups.length });
  });
  await invalidateTaskCache(env);
  return { hidden: true, groups: groups.length };
}

async function saveProjectAlias(env, body) {
  const channelKey = normalizeChannelName(body.channel);
  const fromKey = normalizeProjectName(body.from);
  const toKey = normalizeProjectName(body.to);
  if (!channelKey || !fromKey || !toKey) throw httpError(400, "프로젝트 병합 기준이 부족합니다.");
  await mutateStore(env, (store) => {
    store.projectAliases = store.projectAliases.filter((item) => !(item.channelKey === channelKey && item.fromKey === fromKey));
    store.projectAliases.push({ channel: body.channel || "", channelKey, from: body.from || "", fromKey, to: body.to || "", toKey, updatedAt: new Date().toISOString() });
    addActivity(store, { type: "update", title: "프로젝트 병합 기준 저장", count: 1 });
  });
  await invalidateTaskCache(env);
  return { saved: true };
}

async function deleteProjectAlias(env, body) {
  const aliases = Array.isArray(body?.aliases) ? body.aliases : [body];
  await mutateStore(env, (store) => {
    store.projectAliases = store.projectAliases.filter((item) => !aliases.some((alias) =>
      item.channelKey === normalizeChannelName(alias.channel) &&
      item.fromKey === normalizeProjectName(alias.from)
    ));
  });
  await invalidateTaskCache(env);
  return { deleted: true };
}

async function saveReviewIgnore(env, body) {
  const item = {
    kind: String(body.kind || ""),
    key: String(body.key || ""),
    channel: String(body.channel || ""),
    project: String(body.project || ""),
    summary: String(body.summary || ""),
    updatedAt: new Date().toISOString(),
  };
  if (!item.kind || !item.key) throw httpError(400, "확인 처리할 검토 후보가 없습니다.");
  await mutateStore(env, (store) => {
    store.reviewIgnores = store.reviewIgnores.filter((existing) => !(existing.kind === item.kind && existing.key === item.key));
    store.reviewIgnores.push(item);
  });
  return { saved: true, item };
}

async function deleteReviewIgnore(env, body) {
  await mutateStore(env, (store) => {
    store.reviewIgnores = store.reviewIgnores.filter((item) => !(item.kind === body.kind && item.key === body.key));
  });
  return { deleted: true };
}

async function listChangeRequests(env, url) {
  const store = await readStore(env);
  const status = String(url.searchParams.get("status") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 200);
  const requests = (store.changeRequests || [])
    .filter((item) => !status || item.status === status)
    .slice(0, limit);
  return {
    requests,
    counts: changeRequestCounts(store.changeRequests || []),
  };
}

async function saveChangeRequest(env, body) {
  const message = String(body?.message || body?.request || "").trim();
  if (!message) throw httpError(400, "수정요청 내용을 입력해주세요.");
  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    status: "대기",
    message: message.slice(0, 3000),
    context: sanitizeChangeRequestContext(body?.context),
    createdAt: now,
    updatedAt: now,
  };
  const nextStore = await mutateStore(env, (store) => {
    store.changeRequests = [item, ...(store.changeRequests || [])].slice(0, 300);
    addActivity(store, {
      type: "request",
      title: "수정요청 접수",
      message: item.message.slice(0, 160),
      count: 1,
    });
  });
  return {
    request: item,
    counts: changeRequestCounts(nextStore.changeRequests || []),
  };
}

async function updateChangeRequest(env, id, body) {
  const allowedStatuses = new Set(["대기", "검토중", "승인대기", "승인됨", "진행중", "완료", "보류"]);
  const status = String(body?.status || "").trim();
  const note = String(body?.note || "").trim().slice(0, 2000);
  const nextStore = await mutateStore(env, (store) => {
    store.changeRequests = (store.changeRequests || []).map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: allowedStatuses.has(status) ? status : item.status,
        note: note || item.note || "",
        updatedAt: new Date().toISOString(),
      };
    });
  });
  const request = (nextStore.changeRequests || []).find((item) => item.id === id);
  if (!request) throw httpError(404, "수정요청을 찾지 못했습니다.");
  return { request, counts: changeRequestCounts(nextStore.changeRequests || []) };
}

async function deleteChangeRequest(env, id) {
  let deleted = false;
  const nextStore = await mutateStore(env, (store) => {
    const before = (store.changeRequests || []).length;
    store.changeRequests = (store.changeRequests || []).filter((item) => item.id !== id);
    deleted = store.changeRequests.length !== before;
  });
  if (!deleted) throw httpError(404, "수정요청을 찾지 못했습니다.");
  return { deleted: true, counts: changeRequestCounts(nextStore.changeRequests || []) };
}

function sanitizeChangeRequestContext(context) {
  if (!context || typeof context !== "object") return {};
  return {
    url: String(context.url || "").slice(0, 500),
    search: String(context.search || "").slice(0, 200),
    filters: context.filters && typeof context.filters === "object" ? context.filters : {},
    view: context.view && typeof context.view === "object" ? context.view : {},
    selection: sanitizeChangeRequestSelection(context.selection),
    createdFrom: String(context.createdFrom || "gantt").slice(0, 80),
  };
}

function sanitizeChangeRequestSelection(selection) {
  const tasks = Array.isArray(selection?.tasks) ? selection.tasks : [];
  return {
    count: Number(selection?.count || tasks.length) || 0,
    tasks: tasks.slice(0, 20).map((task) => ({
      id: String(task?.id || "").slice(0, 120),
      channel: String(task?.channel || "").slice(0, 120),
      project: String(task?.project || "").slice(0, 220),
      detail: String(task?.detail || "").slice(0, 120),
      title: String(task?.title || "").slice(0, 220),
      start: toDateOnly(task?.start),
      end: toDateOnly(task?.end),
      status: String(task?.status || "").slice(0, 80),
    })),
  };
}

function changeRequestCounts(requests) {
  return (requests || []).reduce((counts, item) => {
    const status = item.status || "대기";
    counts.total += 1;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { total: 0 });
}

async function getHiddenState(env) {
  const store = await readStore(env);
  return {
    channels: (store.hiddenChannels || []).map((name) => ({ name })),
    projects: (store.hiddenProjects || []).map((item) => ({ ...item })),
    tasks: (store.hiddenNotionIds || []).map((id) => ({ id })),
    convertibleProjects: [],
    projectAliases: store.projectAliases || [],
    reviewIgnores: store.reviewIgnores || [],
  };
}

async function restoreHiddenItem(env, body) {
  const mode = body.mode || body.type;
  await mutateStore(env, (store) => {
    if (mode === "channel") {
      const channel = normalizeChannelName(body.channel || body.name);
      store.hiddenChannels = store.hiddenChannels.filter((item) => item !== channel);
    } else if (mode === "project") {
      const channel = normalizeChannelName(body.channel);
      const project = normalizeProjectName(body.project);
      store.hiddenProjects = store.hiddenProjects.filter((item) => item.channel !== channel || item.project !== project);
    } else {
      const id = normalizeLookupId(body.id);
      store.hiddenNotionIds = store.hiddenNotionIds.filter((item) => item !== id);
    }
  });
  await invalidateTaskCache(env);
  return { restored: true };
}

async function saveViewSettings(env, body) {
  const settings = body && typeof body === "object" ? body : {};
  const nextStore = await mutateStore(env, (store) => {
    store.viewSettings = { ...settings, updatedAt: new Date().toISOString() };
  });
  return { saved: true, viewSettings: nextStore.viewSettings };
}

async function saveBaseline(env, body) {
  const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const baseline = {
    exists: true,
    tasks,
    createdAt: new Date().toISOString(),
    createdAtLabel: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
  };
  await mutateStore(env, (store) => {
    store.baseline = baseline;
  });
  return baselineSummary(baseline);
}

async function deleteBaseline(env) {
  await mutateStore(env, (store) => {
    store.baseline = null;
  });
  return baselineSummary(null);
}

async function getSyncStatus(env) {
  return storeMeta(await readStore(env));
}

function diagnosticsFor(tasks, sourceCount, targetCount, store) {
  const projectAudit = projectAuditFor(tasks);
  return {
    sourceTasks: sourceCount,
    targetTasks: targetCount,
    localTasks: 0,
    visibleTasks: tasks.length,
    hiddenTasks: (store.hiddenNotionIds || []).length,
    hiddenChannels: (store.hiddenChannels || []).length,
    hiddenProjects: (store.hiddenProjects || []).length,
    hiddenProjectLeaks: 0,
    hiddenProjectLeakTasks: 0,
    projectAudit,
    dataCoverage: { ok: true, total: 0, passed: 0, failed: [], cases: [] },
    multiProjectParts: tasks.filter((task) => /:part-\d+$/.test(task.id)).length,
    metaExcludedTasks: 0,
    nonDeliverableExcludedTasks: 0,
    projectAliases: (store.projectAliases || []).length,
    reviewIgnores: (store.reviewIgnores || []).length,
    changeRequests: (store.changeRequests || []).length,
    pendingChangeRequests: (store.changeRequests || []).filter((item) => item.status === "대기").length,
    kvMissing: Boolean(store.kvMissing),
    autoExcludedTasks: 0,
    mappedCopies: Object.keys(store.writeMap || {}).length,
    markedCopies: tasks.filter((task) => task.originId).length,
    productionSetup: { available: false },
    startupTask: { installed: true, detail: "Cloudflare Pages 고정 주소로 배포됩니다." },
    writeHealth: { healthy: true, mappedCopies: Object.keys(store.writeMap || {}).length, targetPages: targetCount, localTasks: 0, unmappedOverrides: 0 },
    baseline: baselineSummary(store.baseline),
    sourceReadOnly: true,
    allowTargetArchive: false,
  };
}

function projectAuditFor(tasks) {
  const groups = groupTasksByProject(tasks);
  const completed = groups.filter((group) => isCompletedUploadProject(group.tasks));
  const uploadOnly = groups.filter((group) => isUploadOnlyProject(group.tasks));
  const missingUpload = groups.filter((group) => isMissingUploadProject(group.tasks));
  const pendingUpload = groups.filter((group) => group.tasks.some(isUploadTask) && !isCompletedUploadProject(group.tasks) && !isUploadOnlyProject(group.tasks));
  return {
    totalProjects: groups.length,
    completedDefaultHidden: completed.length,
    completedDefaultHiddenTasks: completed.reduce((total, group) => total + group.tasks.length, 0),
    uploadOnly: uploadOnly.length,
    missingUpload: missingUpload.length,
    pendingUpload: pendingUpload.length,
    productionOnlyPast: missingUpload.filter((group) => compareDate(rangeOf(group.tasks).end, todayString()) < 0).length,
    samples: {
      completed: completed.slice(0, 8).map(auditSample),
      uploadOnly: uploadOnly.slice(0, 8).map(auditSample),
      missingUpload: missingUpload.slice(0, 8).map(auditSample),
      pendingUpload: pendingUpload.slice(0, 8).map(auditSample),
    },
  };
}

function auditSample(group) {
  const range = rangeOf(group.tasks);
  return { channel: group.channel, project: group.project, start: range.start, end: range.end, tasks: group.tasks.length };
}

function groupTasksByProject(tasks) {
  const map = new Map();
  for (const task of tasks || []) {
    const key = `${normalizeChannelName(task.channel)}:${normalizeProjectName(resolveProjectAlias(task.channel, task.project || task.title))}`;
    if (!map.has(key)) map.set(key, { channel: task.channel, project: task.project || task.title, tasks: [] });
    map.get(key).tasks.push(task);
  }
  return [...map.values()];
}

function baselineSummary(baseline) {
  return baseline?.exists
    ? { ...baseline, exists: true, taskCount: Array.isArray(baseline.tasks) ? baseline.tasks.length : 0 }
    : { exists: false, tasks: [], taskCount: 0 };
}

async function getDatabaseSchema(env, databaseId, kind) {
  if (!databaseId) throw httpError(400, `${kind} database id is missing.`);
  const database = await notionRequest(env, `/v1/databases/${databaseId}`, { method: "GET" });
  return summarizeNotionSchema(database, kind, env);
}

function summarizeNotionSchema(database, kind, env) {
  const props = database.properties || {};
  const entries = Object.entries(props);
  const byName = (name) => name && props[name] ? { name, type: props[name].type } : null;
  const byAliases = (aliases, types = []) => {
    const normalizedAliases = aliases.map(normalizeLabel);
    const found = entries.find(([name, prop]) =>
      normalizedAliases.includes(normalizeLabel(name)) &&
      (!types.length || types.includes(prop.type))
    );
    return found ? { name: found[0], type: found[1].type } : null;
  };
  const byType = (type) => {
    const found = entries.find(([, prop]) => prop.type === type);
    return found ? { name: found[0], type: found[1].type } : null;
  };

  if (kind === "write") {
    const writeTitleProp = envValue(env, "NOTION_WRITE_TITLE_PROP") || "프로젝트";
    const writeDateProp = envValue(env, "NOTION_WRITE_DATE_PROP") || "날짜";
    const writeChannelProp = envValue(env, "NOTION_WRITE_CHANNEL_PROP") || "채널";
    const writeProjectProp = envValue(env, "NOTION_WRITE_PROJECT_PROP") || "프로젝트";
    const writeDetailProp = envValue(env, "NOTION_WRITE_DETAIL_PROP") || "일정";
    const writeStatusProp = envValue(env, "NOTION_WRITE_STATUS_PROP") || "상태";
    const writeAssigneeProp = envValue(env, "NOTION_WRITE_ASSIGNEE_PROP") || "담당자";
    const writeDescriptionProp = envValue(env, "NOTION_WRITE_DESCRIPTION_PROP") || "메모";
    return {
      databaseId: database.id,
      titleName: byName(writeTitleProp)?.name || byType("title")?.name,
      titleType: byName(writeTitleProp)?.type || "title",
      dateName: byName(writeDateProp)?.name || byAliases(["날짜", "시작일"], ["date"])?.name,
      dateType: byName(writeDateProp)?.type || "date",
      channelName: byName(writeChannelProp)?.name || byAliases(["채널", "채널명"])?.name,
      channelType: byName(writeChannelProp)?.type || "rich_text",
      projectName: byName(writeProjectProp)?.name || byAliases(["프로젝트"])?.name,
      projectType: byName(writeProjectProp)?.type || "rich_text",
      detailName: byName(writeDetailProp)?.name || byAliases(["일정", "카테고리"])?.name,
      detailType: byName(writeDetailProp)?.type || "rich_text",
      statusName: byName(writeStatusProp)?.name || byAliases(["상태"])?.name,
      statusType: byName(writeStatusProp)?.type || "rich_text",
      assigneeName: byName(writeAssigneeProp)?.name || byAliases(["담당자", "사람"])?.name,
      assigneeType: byName(writeAssigneeProp)?.type || "rich_text",
      descriptionName: byName(writeDescriptionProp)?.name || byAliases(["메모", "내용"])?.name,
      descriptionType: byName(writeDescriptionProp)?.type || "rich_text",
    };
  }

  const titleProp = envValue(env, "NOTION_TITLE_PROP") || "이름";
  const dateProp = envValue(env, "NOTION_DATE_PROP") || envValue(env, "NOTION_START_PROP") || "날짜";
  const channelProp = envValue(env, "NOTION_CHANNEL_PROP") || "채널명";
  const projectProp = envValue(env, "NOTION_PROJECT_PROP") || "이름";
  const detailProp = envValue(env, "NOTION_DETAIL_PROP") || envValue(env, "NOTION_CATEGORY_PROP") || "카테고리";
  const statusProp = envValue(env, "NOTION_STATUS_PROP") || "상태";
  const assigneeProp = envValue(env, "NOTION_ASSIGNEE_PROP") || "사람";
  return {
    databaseId: database.id,
    titleName: byName(titleProp)?.name || byType("title")?.name,
    titleType: byName(titleProp)?.type || "title",
    dateName: byName(dateProp)?.name || byAliases(["날짜", "시작일", "촬영일"], ["date"])?.name,
    dateType: "date",
    channelName: byName(channelProp)?.name || byAliases(["채널명", "채널"])?.name,
    channelType: byName(channelProp)?.type || "rich_text",
    projectName: byName(projectProp)?.name || byAliases(["프로젝트", "이름"])?.name,
    projectType: byName(projectProp)?.type || "title",
    detailName: byName(detailProp)?.name || byAliases(["카테고리", "일정"])?.name,
    detailType: byName(detailProp)?.type || "rich_text",
    statusName: byName(statusProp)?.name || byAliases(["상태"])?.name,
    statusType: byName(statusProp)?.type || "rich_text",
    assigneeName: byName(assigneeProp)?.name || byAliases(["사람", "담당자"])?.name,
    assigneeType: byName(assigneeProp)?.type || "people",
    descriptionName: byAliases(["메모", "내용"], ["rich_text"])?.name,
    descriptionType: "rich_text",
  };
}

function summarizeSchema(schema) {
  return Object.fromEntries(Object.entries(schema || {}).filter(([key]) => key.endsWith("Name") || key === "databaseId"));
}

async function queryDatabase(env, databaseId) {
  if (!databaseId) return [];
  const pages = [];
  let cursor = "";
  do {
    const body = cursor ? { start_cursor: cursor } : {};
    const result = await notionRequest(env, `/v1/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    pages.push(...(result.results || []));
    cursor = result.has_more ? result.next_cursor : "";
  } while (cursor);
  return pages;
}

function pageToTask(page, schema, source) {
  const props = page.properties || {};
  const title = readPropertyText(props[schema.titleName]) || "새 프로젝트";
  const channel = readPropertyText(props[schema.channelName]) || inferChannel(title) || "미지정 채널";
  const project = readPropertyText(props[schema.projectName]) || title;
  const detail = readPropertyText(props[schema.detailName]) || inferDetail(title) || "상세일정";
  const status = readPropertyText(props[schema.statusName]) || "시작 전";
  const assignee = readPeopleNames(props[schema.assigneeName]) || readPropertyText(props[schema.assigneeName]) || "";
  const assigneeIds = readPeopleIds(props[schema.assigneeName]);
  const description = readPropertyText(props[schema.descriptionName]) || "";
  const start = readDateStart(props[schema.dateName]) || toDateOnly(page.created_time) || todayString();
  const end = readDateEnd(props[schema.dateName]) || start;
  const base = normalizeTask({
    id: page.id,
    originId: findOriginMarker(description),
    source,
    syncMode: source === "source" ? "read-only" : "target",
    title,
    channel,
    project,
    detail,
    category: detail,
    rowType: "",
    status,
    assignee,
    assigneeIds,
    description,
    start,
    end,
    color: colorForGantt([channel, project, detail, title].filter(Boolean).join(" ")),
    predecessorIds: [],
    successorIds: [],
    updatedAt: page.last_edited_time || "",
  });
  return [base];
}

async function createTargetPage(env, task, schema) {
  const properties = taskToNotionProperties(task, schema);
  return notionRequest(env, "/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: config(env).writeDatabaseId },
      properties,
    }),
  });
}

async function updateTargetPage(env, pageId, patch, schema) {
  await notionRequest(env, `/v1/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: taskToNotionProperties(patch, schema) }),
  });
}

function taskToNotionProperties(task, schema) {
  const properties = {};
  setTitleProperty(properties, schema.titleName, task.title || task.project || "새 프로젝트");
  setDateProperty(properties, schema.dateName, task.start, task.end);
  setTypedProperty(properties, schema.channelName, schema.channelType, task.channel || "");
  setTypedProperty(properties, schema.projectName, schema.projectType, task.project || task.title || "");
  setTypedProperty(properties, schema.detailName, schema.detailType, task.detail || "");
  setTypedProperty(properties, schema.statusName, schema.statusType, task.status || "");
  setAssigneeProperty(properties, schema.assigneeName, schema.assigneeType, task.assignee, task.assigneeIds);
  const originLine = task.originId ? `\n${ORIGIN_MARKER_PREFIX}:${task.originId}` : "";
  setTypedProperty(properties, schema.descriptionName, schema.descriptionType, `${task.description || ""}${originLine}`.trim());
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value));
}

function setTitleProperty(properties, name, value) {
  if (!name) return;
  properties[name] = { title: richText(value) };
}

function setDateProperty(properties, name, start, end) {
  if (!name || !start) return;
  properties[name] = { date: { start, end: end && end !== start ? end : null } };
}

function setAssigneeProperty(properties, name, type, value, ids = []) {
  if (!name) return;
  if (type === "people" && ids?.length) {
    properties[name] = { people: ids.map((id) => ({ id })) };
    return;
  }
  setTypedProperty(properties, name, type, value || "");
}

function setTypedProperty(properties, name, type, value) {
  if (!name) return;
  const textValue = String(value || "").trim();
  if (!textValue && !["rich_text", "url", "email", "phone_number"].includes(type)) return;
  if (type === "select") properties[name] = { select: textValue ? { name: textValue } : null };
  else if (type === "status") properties[name] = { status: textValue ? { name: textValue } : null };
  else if (type === "multi_select") properties[name] = { multi_select: textValue ? textValue.split(/[,/]/).map((name) => ({ name: name.trim() })).filter((item) => item.name) : [] };
  else if (type === "number") properties[name] = { number: Number(textValue) || 0 };
  else if (type === "url") properties[name] = { url: textValue || null };
  else if (type === "email") properties[name] = { email: textValue || null };
  else if (type === "phone_number") properties[name] = { phone_number: textValue || null };
  else if (type === "title") properties[name] = { title: richText(textValue) };
  else properties[name] = { rich_text: richText(textValue) };
}

function richText(value) {
  const content = String(value || "").slice(0, 1900);
  return content ? [{ type: "text", text: { content } }] : [];
}

async function pageExists(env, id) {
  if (!id) return false;
  try {
    await notionRequest(env, `/v1/pages/${id}`, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

async function notionRequest(env, endpoint, options = {}) {
  const token = secretValue(env, "NOTION_TOKEN");
  if (!token) throw httpError(400, "NOTION_TOKEN이 Cloudflare 환경변수에 없습니다.");
  const response = await fetch(`https://api.notion.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": envValue(env, "NOTION_VERSION") || "2022-06-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const textBody = await response.text();
  const data = textBody ? JSON.parse(textBody) : {};
  if (!response.ok) {
    throw httpError(response.status, data.message || `Notion API 오류 ${response.status}`);
  }
  return data;
}

async function readStore(env) {
  if (!env.SOLPA_GANTT_KV) return normalizeStore({ kvMissing: true });
  const textValue = await env.SOLPA_GANTT_KV.get(STORE_KEY);
  const parsed = textValue ? JSON.parse(textValue) : {};
  return normalizeStore(parsed);
}

async function writeStore(env, store) {
  const next = normalizeStore(store);
  next.meta.version = crypto.randomUUID();
  next.meta.changedAt = new Date().toISOString();
  if (!env.SOLPA_GANTT_KV) return next;
  await env.SOLPA_GANTT_KV.put(STORE_KEY, JSON.stringify(next));
  return next;
}

async function mutateStore(env, mutator) {
  const store = await readStore(env);
  await mutator(store);
  return writeStore(env, store);
}

function normalizeStore(store = {}) {
  return {
    hiddenNotionIds: Array.isArray(store.hiddenNotionIds) ? store.hiddenNotionIds.map(normalizeLookupId).filter(Boolean) : [],
    hiddenChannels: Array.isArray(store.hiddenChannels) ? store.hiddenChannels.map(normalizeChannelName).filter(Boolean) : [],
    hiddenProjects: Array.isArray(store.hiddenProjects) ? store.hiddenProjects : [],
    projectAliases: Array.isArray(store.projectAliases) ? store.projectAliases : [],
    reviewIgnores: Array.isArray(store.reviewIgnores) ? store.reviewIgnores : [],
    changeRequests: Array.isArray(store.changeRequests) ? store.changeRequests.slice(0, 300) : [],
    kvMissing: Boolean(store.kvMissing),
    writeMap: store.writeMap && typeof store.writeMap === "object" ? store.writeMap : {},
    viewSettings: store.viewSettings && typeof store.viewSettings === "object" ? store.viewSettings : null,
    baseline: store.baseline && typeof store.baseline === "object" ? store.baseline : null,
    activityLog: Array.isArray(store.activityLog) ? store.activityLog.slice(0, 80) : [],
    meta: store.meta && typeof store.meta === "object" ? store.meta : { version: crypto.randomUUID(), changedAt: new Date().toISOString() },
  };
}

function storeMeta(store) {
  const normalized = normalizeStore(store);
  return {
    version: normalized.meta.version,
    changedAt: normalized.meta.changedAt,
    appVersion: "",
    serverStartedAt: "cloudflare-pages",
  };
}

async function readTaskCache(env) {
  if (!env.SOLPA_GANTT_KV) return null;
  try {
    const textValue = await env.SOLPA_GANTT_KV.get(TASK_CACHE_KEY);
    return textValue ? JSON.parse(textValue) : null;
  } catch {
    return null;
  }
}

async function writeTaskCache(env, payload, expiresAt) {
  if (!env.SOLPA_GANTT_KV) return;
  await env.SOLPA_GANTT_KV.put(TASK_CACHE_KEY, JSON.stringify({ payload, expiresAt }), { expirationTtl: 600 });
}

async function invalidateTaskCache(env) {
  if (!env.SOLPA_GANTT_KV) return;
  await env.SOLPA_GANTT_KV.delete(TASK_CACHE_KEY);
}

function ensureKv(env) {
  if (!env.SOLPA_GANTT_KV) {
    throw httpError(500, "Cloudflare KV 바인딩 SOLPA_GANTT_KV가 필요합니다. Pages 프로젝트 Settings > Bindings에서 추가하세요.");
  }
}

function addActivity(store, item) {
  store.activityLog = [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      actor: "간트",
      type: item.type || "update",
      target: "cloudflare",
      title: item.title || "변경",
      message: item.message || "",
      taskId: item.task?.id || "",
      channel: item.task?.channel || "",
      project: item.task?.project || "",
      detail: item.task?.detail || "",
      count: item.count || 0,
    },
    ...(store.activityLog || []),
  ].slice(0, 80);
}

function config(env) {
  return {
    readDatabaseId: envValue(env, "NOTION_READ_DATABASE_ID") || envValue(env, "NOTION_DATABASE_ID") || "",
    writeDatabaseId: envValue(env, "NOTION_WRITE_DATABASE_ID") || "",
    embedKey: envValue(env, "APP_EMBED_KEY") || "",
  };
}

function envValue(env, key) {
  return env?.[key] || DEFAULT_ENV[key] || "";
}

function secretValue(env, key) {
  return String(env?.[key] || "").trim().replace(/^["']|["']$/g, "");
}

function embedInfo(request, env) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const embedPath = config(env).embedKey ? `/embed/${encodeURIComponent(config(env).embedKey)}` : "";
  const embedUrl = embedPath ? `${origin}${embedPath}` : origin;
  return {
    mode: "fixed",
    hasEmbedKey: Boolean(config(env).embedKey),
    publicBaseUrl: origin,
    tunnelHostname: "",
    configuredFrom: "cloudflare-pages",
    detectedBaseUrl: origin,
    detectedHost: url.host,
    detectedIsTemporary: false,
    embedPath,
    embedUrl,
    fixedEmbedUrl: embedUrl,
    detectedEmbedUrl: embedUrl,
    localEmbedUrl: "",
    recommendedEmbedUrl: embedUrl,
    notionReady: true,
    requiresFixedPublicUrl: false,
    requiresEnvPublicUrl: false,
    message: "Cloudflare Pages 고정 주소로 노션 임베드에 사용할 수 있습니다.",
  };
}

function hasApiAccess(request, url, env) {
  const key = config(env).embedKey;
  if (!key) return true;
  const provided = url.searchParams.get("key") || request.headers.get("x-gantt-key") || embedKeyFromReferer(request) || "";
  return provided === key;
}

function embedKeyFromReferer(request) {
  try {
    const referer = new URL(request.headers.get("referer") || "");
    return referer.pathname.match(/^\/embed\/([^/?#]+)/)?.[1] || "";
  } catch {
    return "";
  }
}

function normalizeTask(task) {
  const start = toDateOnly(task.start) || todayString();
  const end = toDateOnly(task.end) || start;
  const title = canonicalProjectTitle(String(task.title || task.project || "새 프로젝트").trim());
  const project = canonicalProjectTitle(String(task.project || task.title || "새 프로젝트").trim());
  return {
    id: String(task.id || crypto.randomUUID()),
    originId: String(task.originId || ""),
    source: task.source || "target",
    syncMode: task.syncMode || "target",
    title,
    channel: String(task.channel || "미지정 채널").trim(),
    project,
    detail: String(task.detail || task.category || "상세일정").trim(),
    category: String(task.category || task.detail || "").trim(),
    rowType: String(task.rowType || "").trim(),
    description: String(task.description || "").trim(),
    status: String(task.status || "시작 전").trim(),
    assignee: String(task.assignee || "").trim(),
    assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : [],
    start,
    end: compareDate(end, start) < 0 ? start : end,
    color: task.color || colorForGantt(task.detail || task.category || task.title),
    predecessorIds: Array.isArray(task.predecessorIds) ? task.predecessorIds : [],
    successorIds: Array.isArray(task.successorIds) ? task.successorIds : [],
    updatedAt: task.updatedAt || "",
  };
}

function normalizeTaskPatch(body) {
  const patch = body && typeof body === "object" ? body : {};
  const title = canonicalProjectTitle(String(patch.title || patch.project || "새 프로젝트").trim());
  const project = canonicalProjectTitle(String(patch.project || patch.title || "새 프로젝트").trim());
  return {
    title,
    channel: String(patch.channel || "미지정 채널").trim(),
    project,
    detail: String(patch.detail || "상세일정").trim(),
    rowType: String(patch.rowType || "").trim(),
    description: String(patch.description || "").trim(),
    start: toDateOnly(patch.start) || todayString(),
    end: toDateOnly(patch.end) || toDateOnly(patch.start) || todayString(),
    status: String(patch.status || "시작 전").trim(),
    assignee: String(patch.assignee || "").trim(),
    assigneeIds: Array.isArray(patch.assigneeIds) ? patch.assigneeIds : [],
    color: patch.color || colorForGantt(patch.detail || patch.title),
    predecessorIds: Array.isArray(patch.predecessorIds) ? patch.predecessorIds : [],
    successorIds: Array.isArray(patch.successorIds) ? patch.successorIds : [],
    originId: String(patch.originId || ""),
  };
}

function readPropertyText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return plainText(prop.title);
  if (prop.type === "rich_text") return plainText(prop.rich_text);
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "multi_select") return (prop.multi_select || []).map((item) => item.name).join(", ");
  if (prop.type === "people") return readPeopleNames(prop);
  if (prop.type === "formula") return readFormulaText(prop.formula);
  if (prop.type === "relation") return (prop.relation || []).map((item) => item.id).join(", ");
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "number") return prop.number == null ? "" : String(prop.number);
  if (prop.type === "checkbox") return prop.checkbox ? "true" : "false";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "email") return prop.email || "";
  if (prop.type === "phone_number") return prop.phone_number || "";
  return "";
}

function plainText(items) {
  return (items || []).map((item) => item.plain_text || item.text?.content || "").join("").trim();
}

function readFormulaText(formula) {
  if (!formula) return "";
  if (formula.type === "string") return formula.string || "";
  if (formula.type === "number") return formula.number == null ? "" : String(formula.number);
  if (formula.type === "boolean") return formula.boolean ? "true" : "false";
  if (formula.type === "date") return formula.date?.start || "";
  return "";
}

function readPeopleNames(prop) {
  return prop?.type === "people" ? (prop.people || []).map((person) => person.name || person.person?.email || "").filter(Boolean).join(", ") : "";
}

function readPeopleIds(prop) {
  return prop?.type === "people" ? (prop.people || []).map((person) => person.id).filter(Boolean) : [];
}

function readDateStart(prop) {
  return prop?.type === "date" ? toDateOnly(prop.date?.start) : "";
}

function readDateEnd(prop) {
  return prop?.type === "date" ? toDateOnly(prop.date?.end) : "";
}

function findOriginMarker(text) {
  const match = String(text || "").match(/solpa-gantt-origin:([0-9a-f-]{32,36})/i);
  return match?.[1] || "";
}

function isHiddenTaskId(hidden, id) {
  const lookup = normalizeLookupId(id);
  return Boolean(lookup && (hidden || []).map(normalizeLookupId).includes(lookup));
}

function isHiddenChannelName(hiddenChannels, channel) {
  const normalized = normalizeChannelName(channel);
  return Boolean(normalized && (hiddenChannels || []).includes(normalized));
}

function isHiddenProjectName(hiddenProjects, task) {
  const channel = normalizeChannelName(task.channel);
  const projectKeys = projectKeysForTask(task);
  return (hiddenProjects || []).some((item) => {
    if (item.channel !== channel) return false;
    const taskIds = (item.taskIds || []).map(normalizeLookupId);
    if (taskIds.includes(normalizeLookupId(task.id)) || taskIds.includes(normalizeLookupId(task.originId))) return true;
    const hiddenKeys = [item.project, ...(item.projects || [])].map(normalizeProjectName).filter(Boolean);
    return hiddenKeys.some((hiddenKey) => projectKeys.some((key) => projectKeyMatches(hiddenKey, key)));
  });
}

function isTargetTaskSupersededBySource(targetTask, sourceTasks) {
  if (!targetTask || targetTask.originId) return false;
  const target = normalizeTask(targetTask);
  if (!isGanttScheduleTask(target) && !isProjectPlaceholderTask(target)) return false;
  return (sourceTasks || []).some((source) => isSameProductionSchedule(source, target));
}

function isSameProductionSchedule(source, target) {
  if (!source || !target) return false;
  if (normalizeChannelName(source.channel) !== normalizeChannelName(target.channel)) return false;
  if (!projectKeyMatches(projectKeyForProductionDedupe(source), projectKeyForProductionDedupe(target))) return false;
  if (isProjectPlaceholderTask(target)) return true;
  const sourceKind = scheduleKindKey(source);
  const targetKind = scheduleKindKey(target);
  if (!sourceKind || !targetKind || sourceKind !== targetKind) return false;
  if (sourceKind === "other" && normalizeProjectName(source.detail || source.category || source.title) !== normalizeProjectName(target.detail || target.category || target.title)) {
    return false;
  }
  return true;
}

function isProjectPlaceholderTask(task) {
  const rowType = normalizeProjectName(task.rowType || "");
  const detail = normalizeProjectName(task.detail || task.category || "");
  return rowType === normalizeProjectName("\ud504\ub85c\uc81d\ud2b8") || detail === normalizeProjectName("\ud504\ub85c\uc81d\ud2b8");
}

function projectKeyForProductionDedupe(task) {
  return normalizeProjectName(resolveProjectAlias(task.channel, task.project || task.title));
}

function scheduleKindKey(task) {
  const text = [task.detail, task.category, task.title, task.project].filter(Boolean).join(" ");
  if (/\uc5c5\ub85c\ub4dc|\ub9b4\ub9ac\uc988|\uac8c\uc2dc|\ubc1c\ud589|upload|release/i.test(text)) return "upload";
  if (/\ucd2c\uc601|shoot|filming|production/i.test(text)) return "shoot";
  if (/\ud3b8\uc9d1|\uac00\ud3b8|edit/i.test(text)) return "edit";
  const detail = normalizeProjectName(task.detail || task.category || "");
  return detail ? `other:${detail}` : "other";
}

function projectKeysForTask(task) {
  return [...new Set([task.project, task.title].map(normalizeProjectName).filter(Boolean).flatMap((key) => {
    const keys = [key];
    if (!projectEpisodeNumbers(key).size) keys.push(projectCoreKey(key));
    return keys;
  }).filter(Boolean))];
}

function projectKeyMatches(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;
  if (hasDifferentEpisodeNumbers(left, right)) return false;
  const firstCore = projectCoreKey(left);
  const secondCore = projectCoreKey(right);
  if (firstCore && secondCore && firstCore === secondCore) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return shorter.length >= 4 && longer.includes(shorter);
}

function hasDifferentEpisodeNumbers(left, right) {
  const leftEpisodes = projectEpisodeNumbers(left);
  const rightEpisodes = projectEpisodeNumbers(right);
  if (!leftEpisodes.size || !rightEpisodes.size) return false;
  for (const episode of leftEpisodes) {
    if (rightEpisodes.has(episode)) return false;
  }
  return true;
}

function projectEpisodeNumbers(value) {
  return new Set([...String(value || "").matchAll(/ep(\d+)/gi)].map((match) => match[1]));
}

function projectCoreKey(value) {
  return String(value || "")
    .replace(/ep\d+/gi, "")
    .replace(/(촬영|업로드|릴리즈|게시|발행|편집|가편|재촬영)$/g, "")
    .replace(/[^0-9a-zA-Z가-힣]+/g, "")
    .trim();
}

function resolveProjectAlias(channel, project) {
  const resolved = canonicalProjectTitle(project);
  return defaultProjectAliasName(channel, resolved) || resolved;
}

function defaultProjectAliasName(channel, projectName) {
  const channelKey = normalizeChannelName(channel);
  const projectKey = normalizeProjectName(projectName);
  if (!channelKey || !projectKey) return "";

  for (const rule of DEFAULT_PROJECT_ALIAS_RULES) {
    if (normalizeChannelName(rule.channel) !== channelKey) continue;
    const targetKey = normalizeProjectName(rule.target);
    const aliasKeys = (rule.aliases || []).map(normalizeProjectName);
    const containsMatch = (rule.contains || []).some((tokens) => tokens.every((token) => projectKey.includes(normalizeProjectName(token))));
    if (projectKey === targetKey || aliasKeys.includes(projectKey) || containsMatch) {
      return rule.target;
    }
  }

  return "";
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

function isAutoHiddenTask(task) {
  if (isWonheePauseTask(task)) return false;
  const channel = normalizeLabel(task.channel);
  const detail = normalizeLabel([task.detail, task.category, task.title, task.project].filter(Boolean).join(" "));
  return (
    channel === "미지정채널" ||
    channel === "미지정" ||
    channel === "전체" ||
    channel === normalizeLabel(SYSTEM_CHANNEL) ||
    channel.includes("기타일정") ||
    channel.includes("대행") ||
    channel.includes("외주") ||
    /휴가|휴재|휴방|연차|반차|회식|워크숍|워크샵/i.test(`${channel} ${detail}`)
  );
}

function isGanttScheduleTask(task) {
  const rowType = String(task.rowType || "").trim();
  if (["상위", "채널", "하위", "프로젝트"].includes(rowType)) return false;
  return Boolean(task.start && task.end);
}

function isUploadTask(task) {
  return /(업로드|릴리즈|게시|발행|upload|release)/i.test([task.detail, task.category, task.title, task.status].filter(Boolean).join(" "));
}

function isProductionTask(task) {
  return /(촬영|재촬영|편집|가편|shoot|edit)/i.test([task.detail, task.category, task.title].filter(Boolean).join(" "));
}

function isDoneTask(task) {
  return /(완료|종료|끝|done|complete|completed)/i.test([task.status, task.detail, task.title].filter(Boolean).join(" "));
}

function isUploadOnlyProject(tasks) {
  return Boolean(tasks?.length && tasks.every(isUploadTask));
}

function isCompletedUploadProject(tasks) {
  const uploadTasks = (tasks || []).filter(isUploadTask);
  if (!uploadTasks.length || isUploadOnlyProject(tasks)) return false;
  const latestUploadEnd = uploadTasks.reduce((max, task) => compareDate(task.end, max) > 0 ? task.end : max, uploadTasks[0].end);
  const uploadFinished = uploadTasks.some(isDoneTask) || compareDate(latestUploadEnd, todayString()) < 0;
  if (!uploadFinished) return false;
  return !(tasks || []).some((task) => compareDate(task.end, latestUploadEnd) > 0 && !isDoneTask(task));
}

function isMissingUploadProject(tasks) {
  return Boolean((tasks || []).length && !tasks.some(isUploadTask) && tasks.some(isProductionTask));
}

function rangeOf(tasks) {
  const list = (tasks || []).filter((task) => task.start && task.end);
  if (!list.length) return { start: todayString(), end: todayString() };
  return list.reduce((range, task) => ({
    start: compareDate(task.start, range.start) < 0 ? task.start : range.start,
    end: compareDate(task.end, range.end) > 0 ? task.end : range.end,
  }), { start: list[0].start, end: list[0].end });
}

function hiddenChannelSummaries(tasks, store) {
  const channels = new Map();
  for (const task of tasks || []) {
    if (isAutoHiddenTask(task)) continue;
    const hiddenChannel = isHiddenChannelName(store.hiddenChannels, task.channel);
    if (!hiddenChannel && !isHiddenTaskId(store.hiddenNotionIds, task.id) && !isHiddenProjectName(store.hiddenProjects, task)) continue;
    const key = normalizeChannelName(task.channel);
    if (!channels.has(key)) channels.set(key, { name: task.channel, start: task.start, end: task.end, taskIds: [] });
    const channel = channels.get(key);
    channel.taskIds.push(task.id);
    if (compareDate(task.start, channel.start) < 0) channel.start = task.start;
    if (compareDate(task.end, channel.end) > 0) channel.end = task.end;
  }
  return [...channels.values()];
}

function sortTasksForGantt(a, b) {
  return compareText(a.channel, b.channel) || compareDate(a.start, b.start) || compareText(a.project, b.project) || compareText(a.detail, b.detail);
}

function inferChannel(title) {
  const match = String(title || "").match(/^\[([^\]]+)\]/);
  return match?.[1] || "";
}

function inferDetail(title) {
  if (/업로드|릴리즈|게시|발행/i.test(title)) return "업로드";
  if (/편집|가편/i.test(title)) return "편집";
  if (/촬영|재촬영/i.test(title)) return "촬영";
  return "";
}

function colorForGantt(label) {
  if (isWonheePauseLabel(label)) return COLOR_LEGEND.pause;
  if (/업로드|릴리즈|게시|발행/i.test(label)) return COLOR_LEGEND.upload;
  if (/편집|가편/i.test(label)) return COLOR_LEGEND.edit;
  if (/촬영|재촬영/i.test(label)) return COLOR_LEGEND.shoot;
  return COLOR_LEGEND.default;
}

function isWonheePauseTask(task) {
  return isWonheePauseLabel([task?.channel, task?.project, task?.title, task?.detail, task?.category].filter(Boolean).join(" "));
}

function isWonheePauseLabel(value) {
  const text = String(value || "");
  return /(\uC6D0\uC774|\uB9AC\uC13C\uB290\s*\uC6D0\uC774)/i.test(text) && /(\uD734\uC7AC|\uD734\uBC29)/i.test(text);
}

function normalizeLookupId(value) {
  return String(value || "").split(":")[0].replaceAll("-", "").toLowerCase();
}

function normalizeChannelName(value) {
  return normalizeLabel(value).toLowerCase();
}

function normalizeProjectName(value) {
  return canonicalProjectTitle(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*(숏|롱|광고|short|long)[^)]*\)/gi, " ")
    .replace(/(촬영|업로드|릴리즈|게시|발행|편집|가편)$/g, " ")
    .replace(/[^0-9a-zA-Z가-힣]+/g, "")
    .trim();
}

function normalizeLabel(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function toDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function compareDate(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "ko");
}

async function readJson(request) {
  const textBody = await request.text();
  return textBody ? JSON.parse(textBody) : {};
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: noStoreHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

function text(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: noStoreHeaders(headers) });
}

function empty(status = 204) {
  return new Response(null, { status, headers: corsHeaders() });
}

function noStoreHeaders(extra = {}) {
  return {
    ...corsHeaders(),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Gantt-Key",
  };
}
