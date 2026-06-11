import {
  buildLeadPrompt,
  generateAiPlan,
  getBotConfig,
  jsonResponse,
  readJson,
  sendTelegramMessage,
  trimTelegramMessage
} from "./_bot-utils.js";

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const body = await readJson(request);
  const config = getBotConfig();
  const demand = body.demand || {};
  const products = Array.isArray(body.products) ? body.products : [];

  if (!products.length) {
    return jsonResponse({ ok: false, error: "请选择至少一个业务或线路。" }, 400);
  }

  if (!String(demand.usage || "").trim()) {
    return jsonResponse({ ok: false, error: "请先填写预计用量。" }, 400);
  }

  const prompt = buildLeadPrompt({
    category: body.category,
    products,
    demand,
    sourceText: body.telegramText
  });
  const aiPlan = await generateAiPlan(prompt, config);

  const adminText = [
    "新的网页咨询线索",
    "",
    trimTelegramMessage(body.telegramText),
    "",
    "AI 初步方案：",
    aiPlan.text
  ].join("\n");

  const telegramResult = await sendTelegramMessage(config.adminChatId, adminText, config);
  const missingConfig = [
    !config.openaiApiKey && "OPENAI_API_KEY",
    !config.telegramBotToken && "TELEGRAM_BOT_TOKEN",
    !config.adminChatId && "TELEGRAM_ADMIN_CHAT_ID"
  ].filter(Boolean);

  return jsonResponse({
    ok: true,
    aiPlan: aiPlan.text,
    aiReady: aiPlan.ok,
    telegramForwarded: telegramResult.ok,
    missingConfig
  });
}
