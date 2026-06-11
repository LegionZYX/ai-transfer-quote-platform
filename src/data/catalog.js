const SOURCE_DATE = "2026-06-04";

export const categories = [
  {
    id: "pool",
    label: "号池类",
    summary: "Claude Code号池 / OpenAI号池 / Gemini Vertex T3",
    description: "适合 Claude Code、OpenAI、Gemini 等模型号池消耗，按模型和通道折扣确认。"
  },
  {
    id: "enterprise",
    label: "企业类",
    summary: "速刷线路 / 官方账号 / 企业稳定中转线路",
    description: "适合官方账号、AWS / Azure / Vertex 资源、企业中转和高折扣速刷线路。"
  },
  {
    id: "video",
    label: "Seedance2.0",
    summary: "满血线路 / 残血线路 / 海外满血线路",
    description: "适合 Seedance2.0 视频生成，根据满血、残血、海外权限和签约要求匹配线路。"
  },
  {
    id: "domestic",
    label: "国内模型",
    summary: "GLM / Kimi / MiniMax / Mimo / Qwen",
    description: "适合中文业务、国内模型调用和按上下文长度分段的 Token 消耗。"
  },
  {
    id: "accounts",
    label: "账号服务",
    summary: "ChatGPT / Claude / Gemini / SuperGroks",
    description: "适合成品号、代充、会员认证和主流 AI 账号服务。"
  }
];

function product({
  id,
  category,
  subCategory,
  subCategoryLabel,
  name,
  publicPrice,
  customerDescription,
  minimumRequirement,
  contractRequirement = "按具体账号/线路确认",
  permissionRequirement = "按资源可用性确认",
  internalCost = "",
  priceType = "custom",
  adminNote = ""
}) {
  return {
    id,
    category,
    subCategory,
    subCategoryLabel,
    name,
    isListed: true,
    showPrice: true,
    publicPrice,
    internalCost,
    priceType,
    minimumRequirement,
    contractRequirement,
    permissionRequirement,
    customerDescription,
    adminNote,
    updatedAt: SOURCE_DATE
  };
}

const poolRows = [
  ["pool-claude", "claude-code-pool", "Claude号池", "Claude号池", "2.11折", "适合 Claude 号池消耗，具体可用模型按当日线路确认。"],
  ["pool-openai", "openai-pool", "OpenAI号池", "OpenAI号池", "0.42折", "适合 OpenAI 号池消耗，具体可用模型按当日线路确认。"],
  ["pool-gemini", "gemini-vertex-t3", "Gemini号池", "Gemini号池", "5折", "适合 Gemini 号池消耗，具体可用模型按当日线路确认。"]
].map(([id, subCategory, subCategoryLabel, name, publicPrice, customerDescription]) =>
  product({
    id,
    category: "pool",
    subCategory,
    subCategoryLabel,
    name,
    publicPrice,
    priceType: "discount",
    minimumRequirement: subCategoryLabel,
    contractRequirement: "大量消耗可单独确认",
    permissionRequirement: subCategory === "claude-code-pool" ? "不能外接，仅限 Claude Code 使用" : "按号池通道可用性确认",
    customerDescription,
    internalCost: `源表：模型企业端渠道报价6月4日 / ${subCategoryLabel}`,
    adminNote: "号池类前台参考价格只显示折扣。"
  })
);

const enterpriseProducts = [
  ["enterprise-fast-claude", "速刷线路", "速刷线路 Claude（AWS BK）", "58折", "走中转"],
  ["enterprise-fast-openai", "速刷线路", "速刷线路 OpenAI官方", "43折", "走中转"],
  ["enterprise-fast-gemini", "速刷线路", "速刷线路 Gemini Vertex T3", "43折", "走中转"],
  ["enterprise-official-openai-small", "官方账号", "官方账号 OpenAI小额", "约5.3折，3.6元人民币等于一刀", "按 6.8 汇率折算"],
  ["enterprise-official-openai-large", "官方账号", "官方账号 OpenAI大额", "约4.7折，3.2元人民币等于一刀", "按 6.8 汇率折算"],
  ["enterprise-official-aws-bk", "官方账号", "官方账号 AWS BK账号", "约8.5折，5元人民币等于一刀", "按 6.8 汇率折算"],
  ["enterprise-official-aws-iam", "官方账号", "官方账号 AWS IAM账号", "8.7折", "按 IAM 权限和区域确认"],
  ["enterprise-official-gemini", "官方账号", "官方账号 Gemini Vertex T3", "8.6折", "按 Vertex T3 权限确认"],
  ["enterprise-official-azure", "官方账号", "官方账号 Microsoft Azure", "8折", "按 Azure 资源权限确认"],
  ["enterprise-relay-claude", "企业稳定中转线路", "企业稳定中转 Claude", "76折", "走中转"],
  ["enterprise-relay-openai", "企业稳定中转线路", "企业稳定中转 OpenAI", "67折", "走中转 + 官K原厂账号"],
  ["enterprise-relay-gemini", "企业稳定中转线路", "企业稳定中转 Gemini", "65折", "走中转"]
].map(([id, subCategoryLabel, name, publicPrice, note]) =>
  product({
    id,
    category: "enterprise",
    subCategory: subCategoryLabel,
    subCategoryLabel,
    name,
    publicPrice,
    priceType: "discount",
    minimumRequirement: "说明平台、用量和交付周期",
    contractRequirement: "大用量可签约",
    permissionRequirement: note,
    customerDescription: `${subCategoryLabel}资源，${note}。`,
    internalCost: "源表：模型企业端渠道报价6月4日",
    adminNote: note
  })
);

const videoProducts = [
  ["video-seedance2-full-1", "满血线路", "Seedance2 第一条满血线路", "9.8折起", "可随用随充", "普通权限"],
  ["video-seedance2-full-2", "满血线路", "Seedance2 第二条满血线路", "9.5折起", "要求日消耗量3万以上", "普通权限"],
  ["video-seedance2-limited", "残血线路", "Seedance2 第三条残血线路", "9.2折起", "适合能接受能力限制的客户", "不能过真人库；要求公司签约"],
  ["video-seedance2-overseas", "海外满血线路", "Seedance2 第四条海外满血线路", "溢价20%起", "需明确海外使用场景", "有海外 NSFW 权限；低审查内容不能回流国内"]
].map(([id, subCategoryLabel, name, publicPrice, minimumRequirement, permissionRequirement]) =>
  product({
    id,
    category: "video",
    subCategory: subCategoryLabel,
    subCategoryLabel,
    name,
    publicPrice,
    priceType: publicPrice.includes("溢价") ? "premium" : "discount",
    minimumRequirement,
    contractRequirement: permissionRequirement.includes("公司签约") ? "要求公司签约" : "按用量确认",
    permissionRequirement,
    customerDescription: `${subCategoryLabel}，${minimumRequirement}。`,
    internalCost: "源表：模型企业端渠道报价6月4日",
    adminNote: permissionRequirement
  })
);

const domesticProducts = [
  ["domestic-glm", "GLM", "GLM 5 / 5.1", "5折", "覆盖 glm-5、glm-5.1 的 0<Token≤32K 与 32K<Token≤200K 分段。"],
  ["domestic-kimi", "Kimi", "Kimi K2.5 / K2.6", "5折", "适合长文本、知识处理和中文内容场景。"],
  ["domestic-minimax", "MiniMax", "MiniMax-M2.7", "5折", "适合中文应用、内容生成和较低成本调用。"],
  ["domestic-mimo", "Mimo", "Mimo v2 / v2.5", "5折", "覆盖 mimo-v2-pro、mimo-v2.5-pro 以及 Token Plan。"],
  ["domestic-qwen", "Qwen", "Qwen 3.5 / 3.6 Plus", "5折", "覆盖 qwen3.5-plus 与 qwen3.6-plus 的 128K、256K、1M 分段。"]
].map(([id, subCategoryLabel, name, publicPrice, customerDescription]) =>
  product({
    id,
    category: "domestic",
    subCategory: subCategoryLabel,
    subCategoryLabel,
    name,
    publicPrice,
    priceType: "token",
    minimumRequirement: "说明上下文窗口和月 Token",
    contractRequirement: "按消耗确认",
    permissionRequirement: "国内模型常规权限",
    customerDescription,
    internalCost: "源表：模型企业端渠道报价6月4日",
    adminNote: "国内模型分段报价。"
  })
);

const accountRows = [
  ["account-chatgpt-plus-finished", "chatgpt", "ChatGPT", "ChatGpt plus 成品号", 118, "订阅消失按剩余天数退款；封号无法质保。", "有货"],
  ["account-chatgpt-plus-recharge", "chatgpt", "ChatGPT", "ChatGpt plus 代充", 130, "订阅消失按剩余天数退款；封号无法质保。", "有货"],
  ["account-chatgpt-pro-5x", "chatgpt", "ChatGPT", "ChatGpt pro 5x 代充/成品号", 750, "信用卡官方正价代充，同步官方售后，退款扣取20%手续费。", "现做/可代充"],
  ["account-chatgpt-pro-20x", "chatgpt", "ChatGPT", "ChatGpt pro 20x 代充/成品号", 1300, "信用卡官方正价代充，同步官方售后，退款扣取20%手续费。", "现做/可代充"],
  ["account-chatgpt-business", "chatgpt", "ChatGPT", "ChatGpt business 48个月成品号【2席位起】", 480, "官方充值，后续每月续费需换自己的卡支付；报价按2席位。", "有货"],
  ["account-claude-pro", "claude", "Claude", "Claude pro 成品号/代充", 170, "质保首次登陆，验收账号无问题后售后结束。", "可代充"],
  ["account-claude-max-x5", "claude", "Claude", "Claude MAX x5 成品号/代充", 800, "订阅消失按剩余天数退款；支持补差价升级；封号无法质保。", "有货"],
  ["account-claude-max-x20", "claude", "Claude", "Claude MAX x20 成品号/代充", 1250, "订阅消失按剩余天数退款；封号无法质保。", "有货"],
  ["account-gemini-pro-year-basic", "gemini", "Gemini", "gemini pro年会员【不包反重力】", 60, "质保首次登陆，验收账号无问题后售后结束。", "有货"],
  ["account-gemini-pro-year-antigravity", "gemini", "Gemini", "gemini pro年会员【包反重力】", 90, "质保首次登陆，验收账号无问题后售后结束。", "有货"],
  ["account-gemini-pro-cert", "gemini", "Gemini", "gemini pro 认证", 60, "质保认证登陆，验收账号无问题后售后结束。", "有货"],
  ["account-supergroks-one-month", "supergroks", "SuperGroks", "SuperGroks-一月成品号", 70, "质保7天；订阅消失按剩余天数退款。", "有货"],
  ["account-supergroks-one-month-recharge", "supergroks", "SuperGroks", "SuperGroks-一月成品号/代充", 120, "质保一个月；订阅消失按剩余天数退款；封号售后结束。", "有货"],
  ["account-supergroks-two-month-recharge", "supergroks", "SuperGroks", "SuperGroks-两个月代充", 200, "质保两个月；订阅消失按剩余天数退款；封号售后结束。", "有货"]
].map(([id, subCategory, subCategoryLabel, name, retailPrice, description, stock]) =>
  product({
    id,
    category: "accounts",
    subCategory,
    subCategoryLabel,
    name,
    publicPrice: `${retailPrice}元/月`,
    priceType: "per-use",
    minimumRequirement: stock,
    contractRequirement: "按账号类型和库存确认",
    permissionRequirement: description,
    customerDescription: description,
    internalCost: `源表：成品代充业务代理价文档 / ${subCategoryLabel}`,
    adminNote: `库存：${stock}`
  })
);

export const defaultProducts = [
  ...poolRows,
  ...enterpriseProducts,
  ...videoProducts,
  ...domesticProducts,
  ...accountRows
];
