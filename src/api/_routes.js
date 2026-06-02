const BASE = "";              // root: auth, identity, health, client
const APPS = `${BASE}/apps`;  // app-domain: agent, memory, coordination
const PLAT = `${BASE}/platform`; // runtime platform layer: flows, observability, nodus, queue

const AUTH = Object.freeze({
  LOGIN: `${BASE}/auth/login`,
  REGISTER: `${BASE}/auth/register`,
});

const TASKS = Object.freeze({
  LIST: `${BASE}/tasks/list`,
  CREATE: `${BASE}/tasks/create`,
  COMPLETE: `${BASE}/tasks/complete`,
  START: `${BASE}/tasks/start`,
});

const ARM = Object.freeze({
  ANALYZE: `${BASE}/arm/analyze`,
  GENERATE: `${BASE}/arm/generate`,
  LOGS: `${BASE}/arm/logs`,
  CONFIG: `${BASE}/arm/config`,
  METRICS: `${BASE}/arm/metrics`,
  CONFIG_SUGGESTIONS: `${BASE}/arm/config/suggest`,
});

const AGENT = Object.freeze({
  CREATE_RUN: `${APPS}/agent/run`,
  RUNS: `${APPS}/agent/runs`,
  RUN: (runId) => `${APPS}/agent/runs/${runId}`,
  APPROVE: (runId) => `${APPS}/agent/runs/${runId}/approve`,
  REJECT: (runId) => `${APPS}/agent/runs/${runId}/reject`,
  STEPS: (runId) => `${APPS}/agent/runs/${runId}/steps`,
  EVENTS: (runId) => `${APPS}/agent/runs/${runId}/events`,
  TOOLS: `${APPS}/agent/tools`,
  TRUST: `${APPS}/agent/trust`,
  SUGGESTIONS: `${APPS}/agent/suggestions`,
});

const ANALYTICS = Object.freeze({
  LINKEDIN_MANUAL: `${BASE}/analytics/linkedin/manual`,
  MASTERPLAN_SUMMARY: (masterplanId) => `${BASE}/analytics/masterplan/${masterplanId}/summary`,
  CALCULATE_TWR: `${BASE}/calculate_twr`,
  CALCULATE_ENGAGEMENT: `${BASE}/calculate_engagement`,
  CALCULATE_AI_EFFICIENCY: `${BASE}/calculate_ai_efficiency`,
  CALCULATE_IMPACT_SCORE: `${BASE}/calculate_impact_score`,
  CALCULATE_INCOME_EFFICIENCY: `${BASE}/income_efficiency`,
  CALCULATE_REVENUE_SCALING: `${BASE}/revenue_scaling`,
  CALCULATE_EXECUTION_SPEED: `${BASE}/execution_speed`,
  CALCULATE_ATTENTION_VALUE: `${BASE}/attention_value`,
  CALCULATE_ENGAGEMENT_RATE: `${BASE}/engagement_rate`,
  CALCULATE_BUSINESS_GROWTH: `${BASE}/business_growth`,
  CALCULATE_MONETIZATION_EFFICIENCY: `${BASE}/monetization_efficiency`,
  CALCULATE_AI_PRODUCTIVITY_BOOST: `${BASE}/ai_productivity_boost`,
  CALCULATE_DECISION_EFFICIENCY: `${BASE}/decision_efficiency`,
  CALCULATE_LOST_POTENTIAL: `${BASE}/lost_potential`,
  SCORES_ME: `${BASE}/scores/me`,
  SCORES_RECALCULATE: `${BASE}/scores/me/recalculate`,
  SCORES_HISTORY: `${BASE}/scores/me/history`,
  SCORES_FEEDBACK: `${BASE}/scores/feedback`,
});

const FREELANCE = Object.freeze({
  ORDERS: `${BASE}/freelance/orders`,
  FEEDBACK: `${BASE}/freelance/feedback`,
  METRICS_LATEST: `${BASE}/freelance/metrics/latest`,
});

const IDENTITY = Object.freeze({
  BOOT: `${BASE}/identity/boot`,
  PROFILE: `${BASE}/identity/`,
  EVOLUTION: `${BASE}/identity/evolution`,
  CONTEXT: `${BASE}/identity/context`,
});

const MASTERPLAN = Object.freeze({
  GENESIS_SESSION: `${BASE}/genesis/session`,
  GENESIS_MESSAGE: `${BASE}/genesis/message`,
  GENESIS_SESSION_BY_ID: (sessionId) => `${BASE}/genesis/session/${sessionId}`,
  GENESIS_SYNTHESIZE: `${BASE}/genesis/synthesize`,
  GENESIS_DRAFT: (sessionId) => `${BASE}/genesis/draft/${sessionId}`,
  GENESIS_LOCK: `${BASE}/genesis/lock`,
  GENESIS_AUDIT: `${BASE}/genesis/audit`,
  PLANS: `${BASE}/masterplans/`,
  PLAN: (planId) => `${BASE}/masterplans/${planId}`,
  PLAN_ACTIVATE: (planId) => `${BASE}/masterplans/${planId}/activate`,
  PLAN_ANCHOR: (planId) => `${BASE}/masterplans/${planId}/anchor`,
  PLAN_PROJECTION: (planId) => `${BASE}/masterplans/${planId}/projection`,
});

const MEMORY = Object.freeze({
  AGENTS: `${APPS}/memory/agents`,
  AGENT_RECALL: (namespace) => `${APPS}/memory/agents/${namespace}/recall`,
  FEDERATED_RECALL: `${APPS}/memory/federated/recall`,
  NODES: `${APPS}/memory/nodes`,
  RECALL_V3: `${APPS}/memory/recall/v3`,
  SUGGEST: `${APPS}/memory/suggest`,
  NODE_FEEDBACK: (nodeId) => `${APPS}/memory/nodes/${nodeId}/feedback`,
  NODE_PERFORMANCE: (nodeId) => `${APPS}/memory/nodes/${nodeId}/performance`,
  NODE_TRAVERSE: (nodeId) => `${APPS}/memory/nodes/${nodeId}/traverse`,
  NODE_HISTORY: (nodeId) => `${APPS}/memory/nodes/${nodeId}/history`,
  NODE_SHARE: (nodeId) => `${APPS}/memory/nodes/${nodeId}/share`,
  METRICS_DASHBOARD: `${APPS}/memory/metrics/dashboard`,
});

const SEARCH = Object.freeze({
  RESEARCH_QUERY: `${BASE}/research/query`,
  HISTORY: `${BASE}/search/history`,
  HISTORY_ITEM: (historyId) => `${BASE}/search/history/${historyId}`,
  LEAD_GEN: `${BASE}/leadgen/`,
  ANALYZE_SEO: `${BASE}/analyze_seo/`,
  GENERATE_META: `${BASE}/generate_meta/`,
  SUGGEST_IMPROVEMENTS: `${BASE}/suggest_improvements/`,
});

const SOCIAL = Object.freeze({
  PROFILE_BY_USERNAME: (username) => `${BASE}/social/profile/${username}`,
  PROFILE: `${BASE}/social/profile`,
  FEED: `${BASE}/social/feed`,
  POST: `${BASE}/social/post`,
  ANALYTICS: `${BASE}/social/analytics`,
  INTERACT: (postId) => `${BASE}/social/posts/${postId}/interact`,
});

const RIPPLETRACE = Object.freeze({
  DROP_POINTS: `${BASE}/rippletrace/drop_points`,
  PINGS: `${BASE}/rippletrace/pings`,
  RECENT: `${BASE}/rippletrace/recent`,
  TRACE: (dropPointId) => `${BASE}/rippletrace/ripples/${dropPointId}`,
  TRACE_GRAPH: (traceId) => `${BASE}/rippletrace/${encodeURIComponent(traceId)}`,
  CAUSAL_GRAPH: `${BASE}/rippletrace/causal/graph`,
  CAUSAL_CHAIN: (dropPointId) => `${BASE}/rippletrace/causal/chain/${encodeURIComponent(dropPointId)}`,
  NARRATIVE_SUMMARY: `${BASE}/rippletrace/narrative/summary`,
  DROP_POINT_NARRATIVE: (dropPointId) => `${BASE}/rippletrace/narrative/${encodeURIComponent(dropPointId)}`,
  PREDICTIONS_SUMMARY: `${BASE}/rippletrace/predictions/summary`,
  DROP_POINT_PREDICTION: (dropPointId) => `${BASE}/rippletrace/predictions/${encodeURIComponent(dropPointId)}`,
  SYSTEM_RECOMMENDATIONS: `${BASE}/rippletrace/recommendations/system`,
  RECOMMENDATIONS_SUMMARY: `${BASE}/rippletrace/recommendations/summary`,
  DROP_POINT_RECOMMENDATION: (dropPointId) => `${BASE}/rippletrace/recommendations/${encodeURIComponent(dropPointId)}`,
  LEARNING_STATS: `${BASE}/rippletrace/learning/stats`,
  EVALUATE_LEARNING_OUTCOME: (dropPointId) => `${BASE}/rippletrace/learning/evaluate/${encodeURIComponent(dropPointId)}`,
  ADJUST_LEARNING_THRESHOLDS: `${BASE}/rippletrace/learning/adjust`,
  PLAYBOOKS: `${BASE}/rippletrace/playbooks`,
  PLAYBOOK: (playbookId) => `${BASE}/rippletrace/playbooks/${encodeURIComponent(playbookId)}`,
  MATCH_PLAYBOOKS: (dropPointId) => `${BASE}/rippletrace/playbooks/match/${encodeURIComponent(dropPointId)}`,
  STRATEGIES: `${BASE}/rippletrace/strategies`,
  BUILD_STRATEGIES: `${BASE}/rippletrace/strategies/build`,
  STRATEGY: (strategyId) => `${BASE}/rippletrace/strategies/${encodeURIComponent(strategyId)}`,
  MATCH_STRATEGIES: (dropPointId) => `${BASE}/rippletrace/strategies/match/${encodeURIComponent(dropPointId)}`,
  EVENT_DOWNSTREAM: (eventId) => `${BASE}/rippletrace/event/${encodeURIComponent(eventId)}/downstream`,
  EVENT_UPSTREAM: (eventId) => `${BASE}/rippletrace/event/${encodeURIComponent(eventId)}/upstream`,
});

const OPERATOR = Object.freeze({
  FLOW_RUNS: `${PLAT}/flows/runs`,
  FLOW_RUN: (runId) => `${PLAT}/flows/runs/${runId}`,
  FLOW_RUN_HISTORY: (runId) => `${PLAT}/flows/runs/${runId}/history`,
  FLOW_RUN_RESUME: (runId) => `${PLAT}/flows/runs/${runId}/resume`,
  FLOW_REGISTRY: `${PLAT}/flows/registry`,
  FLOW_STRATEGIES: `${PLAT}/flows/strategies`,          // DEAD — no backend route (audit)
  AUTOMATION_LOGS: `${BASE}/automation/logs`,            // DEAD — not served (audit)
  AUTOMATION_LOG: (logId) => `${BASE}/automation/logs/${logId}`,           // DEAD (audit)
  AUTOMATION_REPLAY: (logId) => `${BASE}/automation/logs/${logId}/replay`, // DEAD (audit)
  SCHEDULER_STATUS: `${PLAT}/observability/scheduler/status`,
  OBSERVABILITY_REQUESTS: `${PLAT}/observability/requests`,
  OBSERVABILITY_DASHBOARD: `${PLAT}/observability/dashboard`,
  CLIENT_ERROR: `${BASE}/client/error`,
  CLIENT_VITALS: `${BASE}/client/vitals`,
});

const PLATFORM = Object.freeze({
  DASHBOARD_OVERVIEW: `${BASE}/dashboard/overview`,
  HEALTH_DETAILS: `${BASE}/health/details`,
  INFLUENCE_GRAPH: `${BASE}/influence_graph`,
  CAUSAL_GRAPH: `${BASE}/causal_graph`,
  NARRATIVE: (dropPointId) => `${BASE}/narrative/${dropPointId}`,
  HEALTH: `${BASE}/health`,
  HEALTH_DEEP: `${BASE}/health/deep`,
  HEALTH_DOMAINS: `${BASE}/health/domains`,
  VERSION: `${BASE}/api/version`,
});

export const ROUTES = Object.freeze({
  AUTH,
  TASKS,
  ARM,
  AGENT,
  ANALYTICS,
  FREELANCE,
  IDENTITY,
  MASTERPLAN,
  MEMORY,
  SEARCH,
  SOCIAL,
  RIPPLETRACE,
  OPERATOR,
  PLATFORM,
});
