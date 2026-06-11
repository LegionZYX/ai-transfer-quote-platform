const TELEGRAM_API_BASE = "https://api.telegram.org";
const DEFAULT_MODEL = "gpt-4.1-mini";

export function getBotConfig() {
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL
  };
}

export function jsonResponse(response, status = 200) {
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function trimTelegramMessage(text) {
  const value = String(text || "").trim();
  return value.length > 3800 ? `${value.slice(0, 3790)}...` : value;
}

export function buildLeadPrompt({ category, products, demand, sourceText }) {
  const productNames = Array.isArray(products) && products.length
    ? products.map((product) => `${product.name || "未命名"} (${product.publicPrice || "价格待确认"})`).join(" / ")
    : "未选择";

  return [
    "你是 AI 资源报价助手。请根据客户提交的信息生成一版初步方案。",
    "要求：",
    "1. 用中文回复，简洁明确。",
    "2. 只给参考折扣/价格判断，不承诺最终成交价。",
    "3. 如果信息不足，列出最多 3 个需要补充的问题。",
    "4. 涉及特殊权限、大额消耗、合规不明时，提示需要人工确认。",
    "5. 结尾固定说明：最终价格与开通方式以人工确认为准。",
    "",
    `分类：${category?.label || category || "未选择"}`,
    `意向业务：${productNames}`,
    `预计用量：${demand?.usage || "未填写"}`,
    `使用场景：${demand?.scenario || "未填写"}`,
    `其他说明：${demand?.notes || "无"}`,
    "",
    "客户原始咨询文案：",
    sourceText || "无"
  ].join("\n");
}

export async function generateAiPlan(prompt, config = getBotConfig()) {
  if (!config.openaiApiKey) {
    return {
      ok: false,
      missing: "OPENAI_API_KEY",
      text: "AI 报价助手还没有配置模型密钥。需求已整理，最终报价请人工确认。"
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.openaiApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      input: prompt,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      ok: false,
      missing: "OPENAI_API_ERROR",
      text: `AI 报价助手暂时不可用，已转人工确认。错误：${errorText.slice(0, 220)}`
    };
  }

  const data = await response.json();
  const text = data.output_text || data.output?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n")
    .trim();

  return {
    ok: true,
    text: text || "已收到需求，建议转人工确认具体报价和开通方式。"
  };
}

export async function sendTelegramMessage(chatId, text, config = getBotConfig()) {
  if (!config.telegramBotToken || !chatId) {
    return { ok: false, missing: !config.telegramBotToken ? "TELEGRAM_BOT_TOKEN" : "chat_id" };
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: trimTelegramMessage(text),
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    return { ok: false, error: await response.text() };
  }

  return { ok: true, data: await response.json() };
}
