import {
  buildLeadPrompt,
  generateAiPlan,
  getBotConfig,
  jsonResponse,
  readJson,
  sendTelegramMessage
} from "./_bot-utils.js";

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const update = await readJson(request);
  const config = getBotConfig();
  const message = update.message || update.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text || "";

  if (!chatId || !text) {
    return jsonResponse({ ok: true, ignored: true });
  }

  if (text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      "你好，我是 AI 报价助手。请直接发送你的业务类型、预计用量和使用场景，我会先给你一版参考方案。",
      config
    );
    return jsonResponse({ ok: true });
  }

  const prompt = buildLeadPrompt({
    category: "Telegram Bot 咨询",
    products: [],
    demand: {
      usage: "客户在 Telegram 消息中描述",
      scenario: text,
      notes: "来自 Telegram Bot 对话"
    },
    sourceText: text
  });
  const aiPlan = await generateAiPlan(prompt, config);

  await sendTelegramMessage(chatId, aiPlan.text, config);

  if (config.adminChatId && String(config.adminChatId) !== String(chatId)) {
    await sendTelegramMessage(
      config.adminChatId,
      [
        "新的 Telegram Bot 咨询",
        `客户 chat_id：${chatId}`,
        "",
        "客户消息：",
        text,
        "",
        "AI 回复：",
        aiPlan.text
      ].join("\n"),
      config
    );
  }

  return jsonResponse({ ok: true });
}
