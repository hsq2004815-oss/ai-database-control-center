function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined && item !== "") : [];
}

function textValue(value, fallback = "not provided") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function bodyText(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.content || item?.summary || item?.description || item?.text || "";
}

function summaryText(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.summary || item?.content || item?.description || item?.text || "";
}

function titleText(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.title || item?.chunk_id || item?.asset_id || item?.record_id || "Returned item";
}

function idText(item) {
  if (typeof item === "string") {
    return item;
  }
  return item?.chunk_id || item?.asset_id || item?.record_id || item?.relative_path || titleText(item);
}

function listLine(label, value) {
  return `- ${label}: ${textValue(value)}`;
}

function markdownList(values) {
  const items = asArray(values);
  if (!items.length) {
    return "- none";
  }
  return items.map((item) => `- ${textValue(item)}`).join("\n");
}

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function generatedAt() {
  return new Date().toISOString();
}

export function timestampForFile() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildSearchResultMarkdown(item, { asPromptContext = false } = {}) {
  if (!item) {
    return "";
  }
  const heading = asPromptContext ? "# Selected Knowledge Context" : `# ${titleText(item)}`;
  return [
    heading,
    "",
    listLine("chunk_id", item.chunk_id),
    listLine("source_type", item.source_type),
    listLine("priority", item.priority),
    listLine("trust_level", item.trust_level),
    listLine("rank_score", item.rank_score),
    listLine("rank_tier", item.rank_tier),
    listLine("relative_path", item.relative_path),
    listLine("section", item.section),
    "",
    "## Summary",
    "",
    textValue(item.summary, "No summary available."),
    "",
    "## Key Content",
    "",
    textValue(item.content || item.summary, "No content available."),
    "",
    "## Tags",
    "",
    markdownList([...(asArray(item.tags)), ...(asArray(item.keywords))]),
    "",
    "## Ranking Reason",
    "",
    textValue(item.rank_reason, "No ranking reason returned."),
    "",
    "## Usage Note",
    "",
    "Use this as project-specific context. Prefer rules, checklists, templates, and patterns over GitHub project analysis. Do not modify E:\\DataBase unless explicitly requested."
  ].join("\n");
}

export function buildSearchHandoffMarkdown({ meta, results }) {
  const rows = asArray(results);
  return [
    "# Agent Handoff Context",
    "",
    "## Task / Query",
    "",
    listLine("Query", meta?.query),
    listLine("Domain", meta?.domain),
    listLine("Limit", meta?.limit),
    listLine("Generated at", generatedAt()),
    "",
    "## Recommended Usage",
    "",
    "Use these ranked knowledge results as pre-development context for Codex, opencode, Claude Code, or another coding agent. Do not blindly copy project-analysis examples into production code. Prefer rules, checklists, templates, and patterns when they conflict with project references. Do not modify E:\\DataBase unless explicitly requested.",
    "",
    "## Ranked Knowledge Results",
    "",
    rows.length
      ? rows.map((item, index) => [
        `### ${index + 1}. ${titleText(item)}`,
        "",
        listLine("chunk_id", item.chunk_id),
        listLine("source_type", item.source_type),
        listLine("priority", item.priority),
        listLine("trust_level", item.trust_level),
        listLine("rank_score", item.rank_score),
        listLine("relative_path", item.relative_path),
        listLine("section", item.section),
        "",
        "Summary:",
        "",
        textValue(item.summary, "No summary available."),
        "",
        "Key content:",
        "",
        textValue(bodyText(item), "No content available."),
        "",
        "Tags:",
        "",
        markdownList([...(asArray(item.tags)), ...(asArray(item.keywords))]),
        "",
        "Ranking reason:",
        "",
        textValue(item.rank_reason, "No ranking reason returned.")
      ].join("\n")).join("\n\n")
      : "No ranked results available.",
    "",
    "## Safety Notes",
    "",
    "- E:\\DataBase is read-only.",
    "- Do not rebuild indexes unless explicitly requested.",
    "- Prefer rules / checklists / templates over project analysis.",
    "- GitHub project analysis is reference material, not core rule."
  ].join("\n");
}

function valueFrom(data, key) {
  const value = data?.[key] ?? data?.data?.[key];
  return asArray(value);
}

function handoffFrom(data) {
  return data?.final_handoff || data?.handoff || data?.answer || data?.context || null;
}

function chunkBlock(item, index) {
  return [
    `### ${index + 1}. ${titleText(item)}`,
    "",
    listLine("title", titleText(item)),
    listLine("chunk_id", typeof item === "string" ? "" : item?.chunk_id),
    listLine("source_type", typeof item === "string" ? "" : item?.source_type),
    listLine("relative_path", typeof item === "string" ? "" : item?.relative_path),
    "",
    "Summary / content:",
    "",
    textValue(summaryText(item), "No summary available."),
    "",
    "Tags:",
    "",
    markdownList(typeof item === "string" ? [] : [...asArray(item?.tags), ...asArray(item?.keywords)])
  ].join("\n");
}

export function buildBriefHandoffMarkdown({ task, limits, data, includeDebug = false, target = "agent" }) {
  const backendQueries = valueFrom(data, "backend_queries");
  const workflowQueries = valueFrom(data, "workflow_queries");
  const backendChunks = valueFrom(data, "backend_chunks");
  const workflowChunks = valueFrom(data, "workflow_chunks");
  const handoff = handoffFrom(data);
  const targetLine = target === "codex"
    ? "Paste this into Codex as the task context before implementation."
    : target === "opencode"
      ? "Paste this into opencode as the task context before implementation."
      : "Paste this into your coding agent as task context before implementation.";

  const sections = [
    "# Agent Task Brief",
    "",
    "## Original Task",
    "",
    textValue(task, "No task provided."),
    "",
    "## Retrieval Settings",
    "",
    listLine("ui_limit", limits?.ui_limit),
    listLine("backend_limit", limits?.backend_limit),
    listLine("workflow_limit", limits?.workflow_limit),
    listLine("automation_limit", limits?.automation_limit),
    listLine("assets_limit", limits?.assets_limit),
    listLine("Generated at", generatedAt()),
    "",
    "## Backend Queries",
    "",
    markdownList(backendQueries),
    "",
    "## Workflow Queries",
    "",
    markdownList(workflowQueries),
    "",
    "## Retrieved Backend Chunks",
    "",
    backendChunks.length ? backendChunks.map(chunkBlock).join("\n\n") : "No backend chunks returned.",
    "",
    "## Retrieved Workflow Chunks",
    "",
    workflowChunks.length ? workflowChunks.map(chunkBlock).join("\n\n") : "No workflow chunks returned.",
    "",
    "## Final Agent Instructions",
    "",
    targetLine,
    "",
    "You are working with a local personal AI database.",
    "Use the retrieved context below as project-specific guidance.",
    "Do not modify E:\\DataBase unless explicitly asked.",
    "If this is a new project, create it under E:\\Projects.",
    "Prefer rules, checklists, templates, and patterns over GitHub project analysis.",
    "After changes, run validation commands and update TASK_MEMORY / PROJECT_REPORT if applicable.",
    "",
    "## Upstream Final Handoff",
    "",
    handoff ? textValue(handoff) : "No upstream final handoff returned."
  ];

  if (includeDebug) {
    sections.push("", "## Raw Debug Output", "", "```json", compactJson(data), "```");
  }

  return sections.join("\n");
}
