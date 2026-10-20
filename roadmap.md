# L2Earn 路线图

## 第一阶段：架构重构与基础设施 (Foundation)

**目标**：解决安全性问题，建立真实的数据持久化层。

### 迁移至 Next.js (全栈框架)
- **现状**：当前是纯客户端 SPA (Vite)，AI 采用浏览器 BYOK 直连（无服务端代理）
- **行动**：将项目迁移到 Next.js 14+ (App Router)
- **原因**：
  - **商业化前提**：BYOK 只适合个人/自托管；若要做「平台代付额度」的 SaaS，密钥必须放到服务端 API Routes，绝对不能暴露在前端代码中
  - **SEO**：教育类内容需要被搜索引擎索引，SSR (服务端渲染) 是必须的
  - **性能**：利用 React Server Components 减少客户端 JS 体积

### 后端服务与数据库 (BaaS - Supabase)
- **现状**：使用 dbService.ts 中的 Mock 数据
- **行动**：
  - **Auth**：启用 Supabase Auth，支持 Email/Password 和 Wallet Login (如 Sign-In with Ethereum, SIWE)
  - **Database**：设计真实的 PostgreSQL Schema
    - `users`：存储用户资料、钱包地址
    - `courses`：课程元数据
    - `modules`：课程章节内容（FH-DREAM 结构）
    - `user_progress`：用户学习进度、测验成绩
    - `knowledge_assets`：用户生成的 Insight NFT 元数据
  - **Storage**：存储课程封面、生成的 SVG 图片等

### AI 服务层 (AI Proxy)
- **现状**：已重构为浏览器直连的开放式 LLM 层（`services/llm/*`：OpenAI Chat Completions + Anthropic Messages，BYOK，无服务端代理）
- **行动**：需要「平台代付额度 / 统一计费」时，再构建 pages/api/ai/* 或 app/api/ai/* 路由，把 BYOK 换成服务端密钥
- **功能**：
  - **Rate Limiting**：限制每个用户的调用频率，防止成本爆炸
  - **Caching**：对于相同的课程大纲请求，存入 Redis/数据库，不要重复调用 LLM
  - **Prompt Management**：将提示词（Prompt）从代码中剥离，便于独立优化

---

## 第二阶段：核心业务逻辑实现 (The Engine)

**目标**：让 FH-DREAM 引擎和学习树真正跑起来。

### FH-DREAM 引擎增强 (RAG)
- **问题**：AI 可能会产生幻觉
- **方案**：引入 RAG (检索增强生成)
  - 建立一个向量数据库 (pgvector on Supabase)
  - 存入高质量的技术文档、教程
  - 当用户生成课程时，AI 先检索相关文档，再生成课程内容，确保准确性

### 流式生成 (Streaming UI)
- **体验**：生成一个完整的课程模块可能需要 10-20 秒
- **行动**：使用 Vercel AI SDK 实现流式响应（Streaming）。让用户看着文字一个个蹦出来，而不是对着 Loading 转圈

### 支付与订阅 (Web2 Rails)
- **混合模式**：虽然是 Web3 项目，但初期为了降低门槛，建议接入 Stripe
- **用户可以用法币订阅 "Pro" 会员来获取无限的 AI 生成额度**

---

## 第三阶段：Web3 经济系统 (The Economy)

**目标**：实现"学"与"赚"的价值流转。

### 智能合约开发 (Solidity)
- **选择链**：Base 或 Arbitrum (L2)，因为 Gas 费极低
- **合约架构**：
  - **L2EToken (ERC-20)**：平台代币，用于奖励和支付
  - **KnowledgeSBT (ERC-721/1155)**：灵魂绑定代币 (Soulbound Token)，不可转移。当用户通过测验（Quiz）后铸造，作为技能证书
  - **Marketplace.sol**：允许创作者将课程（ERC-721）加密并出售访问权

### 钱包集成
- **前端**：集成 RainbowKit 或 ConnectKit + Wagmi
- **逻辑**：
  - 用户登录时连接钱包
  - 检测是否持有特定 SBT 来解锁课程
  - 购买课程时唤起钱包签名支付

### 内容加密 (Protocol Encryption)
- **现状**：cryptoProtocol.ts 只是模拟
- **行动**：使用 Lit Protocol 或 Threshold Network
- **逻辑**：课程内容存储在 IPFS 上，只有持有特定 NFT/Token 的钱包地址才能解密内容

---

## 第四阶段：部署与运维 (Production)

### 部署架构
- **前端/API**：部署到 Vercel（全球边缘节点，速度最快）
- **数据库**：Supabase (托管的 AWS 区域)
- **区块链**：合约部署到 Base Mainnet，元数据上链或存 IPFS

### 监控与风控
- **Sentry**：捕获前端和后端报错
- **PostHog**：分析用户行为（漏斗分析）
- **Helicone / LangSmith**：专门监控 LLM 的调用成本、延迟和输出质量。这非常重要，否则 AI API 费用会让你破产

---

## 任务清单 (Task List) - 给开发团队

### Backend / DevOps
- [ ] 初始化 Next.js 项目并配置 TypeScript/Tailwind
- [ ] 配置 Supabase 项目，编写 SQL 建表脚本
- [ ] 编写 Next.js API Routes，封装 LLM 调用（OpenAI / Anthropic 兼容协议）
- [ ] 实现 Redis 缓存层，缓存 AI 生成的课程结构

### Frontend
- [ ] 将现有组件迁移到 Next.js 结构
- [ ] 集成 Clerk 或 Supabase Auth 进行身份验证
- [ ] 集成 RainbowKit 替换模拟的钱包按钮
- [ ] 优化 CreatorStudio，支持 Markdown 渲染和代码高亮

### Smart Contracts
- [ ] 编写 L2EToken.sol
- [ ] 编写 CourseNFT.sol (支持版税分发)
- [ ] 编写单元测试 (Hardhat/Foundry)
- [ ] 部署到 Base Sepolia 测试网

### AI Engineer
- [ ] 优化 Prompt Engineering，确保生成的 JSON 格式 100% 稳定
- [ ] 搭建 RAG 管道，提高生成内容的专业深度