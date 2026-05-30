ทั้งหมดที่ควรรู้

**Plugins คือชุด tools, skills, และ integrations ที่ติดตั้งได้ในคลิกเดียวบน Claude Code และ Claude Cowork** ต่างจาก Connectors ที่เน้นเชื่อมต่อกับแอปภายนอก — Plugins เน้นเพิ่มความสามารถในการทำงานของ Claude โดยตรง เช่น code review, language server, security scanning, deployment, และ workflow เฉพาะทาง ปัจจุบันมี Plugin กว่า 160 ตัว แบ่งเป็น 2 แพลตฟอร์มหลัก: Claude Code (สำหรับนักพัฒนา) และ Cowork (สำหรับทีมธุรกิจ)

160+ Plugins ทั้งหมด

760K Top Plugin Installs Frontend Design

13 หมวด Claude Code

18 Cowork Plugins สำหรับทีมธุรกิจ

---

## I. Code Quality & Review

### ตรวจสอบและปรับปรุงโค้ด

Claude Code

**ตรวจ PR, refactor โค้ดให้อ่านง่าย, และ review อัตโนมัติ** ก่อน merge เข้า main branch

Frontend Design Verifiedสร้าง frontend ระดับ production ที่มี design โดดเด่น หลีกเลี่ยงความ generic760K

Code Review VerifiedAI code review ด้วย specialized agents และ confidence-based filtering322K

Code Simplifier Verifiedทำให้โค้ดอ่านง่ายขึ้นโดยรักษา functionality เดิมไว้265K

PR Review Toolkit VerifiedReview agents สำหรับ comments, tests, errors, types, quality91K

CodeRabbitAI code review ด้วย 40+ analyzers, AST parsing, security checks24K

Optibot Code Reviewจับ production bugs, business logic issues & security vulnerabilities3.4K

Qodo SkillsAI agents สำหรับ code quality, testing, security, compliance checks9.7K

## II. Development Workflow & Productivity

### เพิ่มประสิทธิภาพการ dev

Claude Code

**จัดการ feature development, git workflow, memory, และ skill authoring** ให้ Claude ทำงานเป็นระบบมากขึ้น

SuperpowersBrainstorming, subagent dev, code review, debugging, TDD, skill authoring681K

Feature Dev VerifiedWorkflow agents สำหรับ exploration, design, และ review206K

CLAUDE.md Management Verifiedดูแล CLAUDE.md — audit quality, capture learnings, project memory205K

Ralph Loop VerifiedInteractive AI loops สำหรับ iterative development168K

Commit Commands VerifiedGit commit workflows: commit, push, PR creation137K

Claude Code Setup Verifiedวิเคราะห์ codebase แนะนำ hooks, skills, MCP servers, subagents121K

Skill Creator Verifiedสร้าง, ปรับปรุง, วัดผล skills ของ Claude256K

Plugin Developer Toolkit Verified7 expert skills สำหรับ hooks, MCP, commands, agents, validation54K

Hookify Verifiedสร้าง custom hooks ป้องกันพฤติกรรมที่ไม่ต้องการ48K

Playground VerifiedInteractive HTML playgrounds พร้อม visual controls และ live preview48K

RememberContinuous memory: สรุปและบีบอัด conversations เป็น daily logs26K

session-report Verifiedสร้าง HTML report ของ session usage — tokens, cache, subagents5K

Agent SDK Dev VerifiedDevelopment kit สำหรับ Claude Agent SDK55K

MCP Server Dev Verifiedออกแบบและสร้าง MCP servers สำหรับ Claude14K

code-modernization VerifiedModernize legacy codebases (COBOL, legacy Java/C++, monolith)1.1K

## III. Language Servers (LSP)

### Code Intelligence ทุกภาษา

13 ภาษา

**Language Server Protocol ให้ Claude เข้าใจ type system, definitions, references** ของแต่ละภาษาอย่างลึกซึ้ง ทุกตัว Anthropic verified

TypeScript LSPTypeScript/JavaScript code intelligence167K

Pyright LSPPython type checking and code intelligence85K

C# LSPC# code intelligence33K

Go LSP (gopls)Go code intelligence and refactoring33K

Rust Analyzer LSPRust code intelligence and analysis28K

Java LSP (Eclipse JDT.LS)Java code intelligence26K

PHP LSP (Intelephense)PHP code intelligence26K

Clangd LSPC/C++ code intelligence23K

Swift LSP (SourceKit)Swift code intelligence18K

Kotlin LSPKotlin code intelligence18K

Lua LSPLua code intelligence12K

Ruby LSPRuby code intelligence and analysis6K

Elixir LSElixirLS สำหรับ .ex, .exs, .heex files1.9K

## IV. Security & Compliance

### สแกนช่องโหว่และบังคับ standards

Claude Code

**ตรวจจับ vulnerabilities, secrets, unsafe patterns** ก่อน commit หรือ deploy ทุกครั้ง

Security Guidance Verifiedเตือน command injection, XSS, unsafe code patterns ตอนแก้ไฟล์157K

Semgrepจับ security vulnerabilities แบบ real-time แนะนำให้เขียนโค้ดปลอดภัย14K

Sonatype GuideSupply chain intelligence & dependency security analysis6.3K

Aikido SecuritySAST, secrets, IaC vulnerability detection3.6K

PagerDuty Pre-Commitให้คะแนน deployment risk จาก incident history ก่อน ship3.5K

Endor Labsสแกนและ fix security risks ใน software supply chain2.6K

SonarQubeบังคับ code quality และ security ใน agent coding loop2.2K

NightVisionDAST/API Discovery หา exploitable vulnerabilities1.2K

Opsera DevSecOpsArchitecture analysis, security scanning, compliance auditing1.3K

42Crunch API SecurityAudit OpenAPI specs, ตรวจ vulnerabilities, แก้อัตโนมัติ441

VantaTrust context และ agentic workflows สำหรับ compliance440

CrowdStrike Falconสร้างแอปที่ extend Falcon security platform277

Zscalerจัดการ Zscaler cloud security (ZPA, ZIA, ZDX)741

## V. Git, DevOps & Project Tracking

### จัดการ repo, CI/CD, และ issues

Claude Code

**เชื่อมกับ GitHub, GitLab, Jira และ project management tools** เพื่อจัดการ dev lifecycle ทั้งหมดจาก Claude

GitHubสร้าง issues, จัดการ PRs, review code, ค้นหา repos246K

AtlassianJira & Confluence — search/create issues, manage sprints69K

Linearสร้าง issues, จัดการ projects, อัปเดต statuses37K

GitLabRepos, merge requests, CI/CD pipelines, issues, wikis31K

Sentryดู error reports, วิเคราะห์ stack traces, debug production30K

Asanaสร้างและจัดการ tasks, ค้นหา projects, ติดตามงาน8.8K

BuildkitePipeline management, migration, preflight, agent orchestrationnew

TeamCity CLIInteract กับ TeamCity CI/CD — builds, logs, pipeline statusnew

RootlyFull-lifecycle incident management: deploy safety, on-call, retrospectivesnew

NotionSearch pages, create/update docs, manage databasesnew

## VI. Cloud & Infrastructure

### Deploy, จัดการ infrastructure, IaC

Claude Code

**Deploy แอป, จัดการ cloud resources, เขียน Infrastructure as Code** บน AWS, Azure, GCP, และ edge platforms

Vercelจัดการ deployments, builds, logs, domains, frontend infra122K

CloudflareWorkers, Durable Objects, Agents SDK, MCP servers, Wrangler6.6K

Deploy on AWSArchitecture recommendations, cost estimates, IaC deployment6.8K

AWS ServerlessDesign, build, deploy, test serverless applications5.8K

TerraformSeamless integration กับ Terraform ecosystem สำหรับ IaC automation5.5K

RailwayDeploy and manage apps, databases, infra on Railway3.7K

Netlify SkillsFunctions, edge functions, blobs, database, image CDN, forms2.6K

AzureAzure MCP server + specialized Azure skills1.9K

AWS Dev Toolkit34 skills, 11 agents, 3 MCP servers สำหรับ AWS798

AWS AmplifyFull-stack apps ด้วย auth, data models, storage, GraphQL738

Migration to AWSAssess cloud usage, เปรียบเทียบ pricing, แนะนำ migration1.7K

followrabbitGCP cost optimization: review changes, auto-apply savings1.2K

Fastly Agent ToolkitFastly development tools and platform skills1.9K

## VII. Database & Backend

### จัดการ DB, query, migrations

Claude Code

**เชื่อมต่อฐานข้อมูล รัน SQL จัดการ schema** และทำ migrations จากใน Claude Code

SupabaseDatabase ops, auth, storage, real-time — จัดการ projects, รัน SQL92K

FirebaseFirestore, auth, functions, hosting, storage20K

PrismaPostgres: database management, migrations, SQL queries4.6K

MongoDBConnect databases, explore data, manage collections, optimize4.3K

Neonจัดการ Neon projects และ databases ด้วย agent skill1.8K

PlanetScaleAuthenticated access to organizations, databases, branches1.7K

CockroachDBExplore schemas, write SQL, debug queries, manage clusters1.3K

ClickHouseBrowse organizations, services, databases, run queries167

AlloyDBCreate, connect, interact กับ AlloyDB for PostgreSQL318

Cloud SQL PostgreSQLCloud SQL for PostgreSQL database and data753

AivenDeploy managed PostgreSQL, Kafka, OpenSearch, ClickHouse41

Convex BackendReactive, type-safe, production-grade backendsnew

Redis DevelopmentData structures, query engine, vector search, cachingnew

DuckDB SkillsRead any data file, query databases, search DuckDB/DuckLakenew

AppwriteSDK skills, MCP servers, deployment commandsnew

## VIII. Data & Analytics

### Data pipelines, analytics, ML

Claude Code

**สร้าง data pipelines, query analytics, จัดการ feature flags** และ train/deploy ML models

PostHogQuery analytics, manage flags, A/B tests, track errors, LLM costs10K

Data EngineeringWarehouse exploration, pipeline authoring, Airflow integration9.1K

PineconeVector database: indexes, querying, rapid prototyping8.5K

Data VerifiedWrite SQL, explore datasets, generate insights, build visualizations5.2K

Astronomer Data AgentsApache Airflow: author DAGs, debug failures, trace lineage1.4K

Snowflake Cortex CodeRoute Snowflake prompts to Cortex Code for execution525

AtlanData catalog: search, explore, govern, manage data assets1.2K

FiftyOneHigh-quality datasets, computer vision models, session visualization1.6K

AmplitudeInstrument Amplitude, discover product opportunities, create dashboards1K

FullstoryQuery behavioral analytics, session replays, CX insights92

DataRobot Agent SkillsModel training, deployment, predictions, feature engineering417

Hugging Face SkillsBuild, train, evaluate open source AI models, datasets, spaces27K

SageMaker AIBuild, train, deploy AI models กับ AWS AI/ML expertise910

## IX. Browser, Testing & Web Scraping

### Automate เบราว์เซอร์, ดึงข้อมูลเว็บ

Claude Code

**Automate browser tests, scrape websites, ค้นหา code** และดึงข้อมูลจากแหล่งต่าง ๆ

PlaywrightBrowser automation, e2e testing, screenshots, form filling230K

Context7ดึง live docs เฉพาะเวอร์ชันจาก source repos เข้า LLM context328K

SerenaSemantic code analysis, refactoring, navigation ผ่าน LSP78K

Chrome DevToolsควบคุม Chrome: performance traces, network requests, inspect60K

GreptileAI-powered codebase search ด้วย natural language48K

Firecrawlแปลงเว็บเป็น markdown, scrape, crawl, extract structured data27K

SourcegraphSearch code ข้าม codebases, trace references, security sweeps8.7K

ExaAI web search, deep research, content extraction1.2K

Bright DataWeb scraping, CAPTCHA bypass, data extraction, 40+ sites988

StagehandAutomate web tasks ด้วย natural language628

Nimble Web DataSearch, extract, map, crawl the web1.8K

## X. Communication & Messaging

### เชื่อมช่องทางสื่อสาร

Claude Code

**ส่งข้อความ, ดึง context จากการประชุม** และเชื่อมต่อ messaging platforms เข้ากับ Claude

Slack VerifiedSurface insights, draft messages, engage teams จาก Cowork65K

TelegramMessaging bridge พร้อม access control และ pairing77K

DiscordMessaging bridge พร้อม access control24K

iMessageอ่าน chat.db ตรง, ส่งผ่าน AppleScript11K

Circlebackค้นหาและเข้าถึง meetings, emails, calendar events10K

Zoom PluginPlan, build, debug Zoom integrations — APIs, SDKs, webhooks1.9K

IntercomSearch conversations, analyze support patterns, look up contacts1.9K

Twilio Developer KitProcedural knowledge สำหรับ AI coding agents302

ResendEmail API, agent inbox, CLI, React Email integrationnew

SpeakAISearch transcripts, summarize meetings, create clips88

## XI. Framework & Platform Skills

### ความรู้เฉพาะทางของแต่ละ framework

Claude Code

**Best practices, documentation, และ coding patterns** สำหรับ framework และ platform เฉพาะทาง

Laravel BoostArtisan commands, Eloquent, routing, migrations, code generation18K

ExpoBuild, deploy, upgrade React Native apps ด้วย Expo5.7K

Pydantic AIPatterns, decision trees, gotchas สำหรับ agents, tools2K

Shopify (2 plugins)Dev tools, GraphQL, Liquid, UI extensions, Shopify docs3.6K

StripeStripe development plugin สำหรับ payment integration27K

WixBuild sites and apps, CLI development, dashboard extensions2.2K

WordPressProduction-grade WordPress sites: themes, plugins, commercenew

SanityContent platform: query, author content, build schemas1.6K

MintlifyBuild documentation: convert to MDX, modify content, automate4.8K

PostmanFull API lifecycle: sync collections, generate code, run tests13K

Microsoft DocsAzure, .NET, Windows documentation และ API references15K

SAP (4 plugins)UI5, Fiori, CDS/CAP, MDK — SAP development ecosystem2.5K

Quarkus AgentCreate, manage, interact กับ Quarkus applications383

Apollo GraphQL SkillsClient, Server, Federation, Connectors, Router, Rover CLInew

Auth0Detect framework, scaffold Auth0 SDK integration1.1K

WorkOSAuthKit, SSO, Directory Sync, RBAC, Vault, Audit Logsnew

## XII. Design, Creative & Misc

### Design tools, สื่อ, และอื่น ๆ

Claude Code

**เชื่อมต่อ design tools, สร้างวิดีโอ, จัดการ ads** และ tools เฉพาะทางอื่น ๆ

FigmaAccess design files, extract components, read tokens, translate to code128K

Adobe for creativity VerifiedCreative Cloud tools: images, vectors, design, video740

MiroRead board context, create diagrams, generate code1.1K

HyperFramesHeyGen: เขียน HTML, render video, animations, captionsnew

Runway APIGenerate videos, images, audio — batch ad campaigns, product videosnew

CloudinaryManage assets, apply transformations, optimize media1.5K

Adspirer Ads AgentGoogle, Meta, TikTok & LinkedIn ads — 91 tools2.8K

SearchFit SEOFree AI SEO toolkit: audit, strategy, optimize, keywords6K

MapboxLocation-aware apps, geospatial tools, style managementnew

Amazon Location ServiceMaps, geocoding, routing, geospatial features2.2K

LegalZoomAI reviews legal documents, แนะนำทนายเมื่อจำเป็น1.9K

math-olympiad VerifiedSolve IMO, Putnam, USAMO ด้วย adversarial verification1.8K

Explanatory Output Style Verifiedเพิ่ม educational insights ในทุก implementation53K

Learning Output Style VerifiedInteractive learning mode ที่ขอ code contributions ตอนตัดสินใจ34K

## XIII. Cowork Plugins — สำหรับทีมธุรกิจ

### Workflow เฉพาะทางทุกแผนก

18 ตัว

**Plugins สำหรับ Claude Cowork ที่ออกแบบให้ทีมธุรกิจใช้ได้ทันที** — ไม่ต้องเขียนโค้ด ครอบคลุมตั้งแต่ Sales, Marketing, Finance ไปจนถึง Legal และ HR ทุกตัว Anthropic verified

|Plugin|ใช้ทำอะไร|
|---|---|
|Small Business|Payroll planning, cash forecasts, month-end close, growth campaigns|
|Sales|Prospect, craft outreach, build deal strategy, prep for calls|
|Productivity|Manage tasks, plan your day, build persistent memory|
|Product Management|Feature specs, roadmaps, user research synthesis|
|Marketing|Create content, plan campaigns, analyze performance|
|Legal|Contract review, NDA triage, compliance workflows|
|Finance|Journal entries, reconciliation, financial statements, variance analysis|
|Enterprise Search|Search ข้ามทุกเครื่องมือ — email, chat, documents, wikis|
|Customer Support|Triage tickets, draft responses, escalate, build knowledge base|
|Bio Research|เชื่อม preclinical research tools สำหรับ life sciences R&D|
|Operations|Vendor management, process docs, change management, compliance|
|Design|Design critique, UX writing, accessibility audits, dev handoff|
|Human Resources|Recruiting, onboarding, performance reviews, compensation|
|Engineering|Standups, code review, architecture decisions, incident response|
|Brand Voice|แปลง brand materials เป็น enforceable AI guardrails|
|Wealth Management|Client reviews, financial plans, investment proposals|
|Private Equity|Screen deals, due diligence, IC memos, portfolio tracking|
|Investment Banking|Deal materials, strip profiles, pitch decks, merger models|
|Financial Analysis|DCF models, comps analysis, LBOs, pitch deck review|
|Equity Research|Analyze earnings, investment ideas, initiating coverage|
|S&P Global|Financial intelligence ใน agentic workflows|
|LSEG|Market data & analytics — DCF models, morning notes, portfolios|
|Common Room|GTM copilot: account research, call prep, personalized outreach|
|Apollo|3 pre-built skills สำหรับ complete sales workflows|

## Plugins vs Connectors คืออะไร

### ความต่าง

||Plugins|Connectors|
|---|---|---|
|ใช้กับ|Claude Code & Cowork|Claude (แชท) & Claude Code|
|เน้น|เพิ่มความสามารถ (skills, tools, agents)|เชื่อมข้อมูลจากแอปภายนอก|
|ติดตั้ง|คลิกเดียว — bundle tools + skills + MCP|OAuth / API key setup|
|ตัวอย่าง|Code Review, LSP, Playwright, Figma plugin|Slack, Gmail, Notion connector|
|เหมาะกับ|นักพัฒนาและทีมธุรกิจที่ใช้ Cowork|ทุกคนที่ใช้ Claude|