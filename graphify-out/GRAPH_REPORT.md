# Graph Report - Dao Trang Phat Hao  (2026-11-02)

## Corpus Check
- Corpus is ~40,151 words - fits in a single context window. You may not need a graph.

## Summary
- 612 nodes · 1388 edges · 51 communities (37 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.88)
- Token cost: unavailable — agent tools did not expose input/output usage. Zero placeholders in cache/cost.json are not measured usage and do not imply zero cost.

## Community Hubs (Navigation)
- Member Sheets and Profiles
- Dependencies and Package Scripts
- Dashboard Filters and Charts
- Architecture and Design Documents
- Classes and Area Mapping
- Application State and Navigation
- Shared Controls and Accounts
- Public Routes and Forms
- Guided Intake and Portraits
- TypeScript Compiler Configuration
- Registration API Test Fixtures
- Initial Local Database Schema
- Profile Schema and Approval
- Initial Supabase Database Schema
- Maintenance and Deployment Checks
- Cloud Database and Storage
- Backend Validation and Persistence
- Staff Passwords and Sessions
- Workspace API Domain Types
- Navigation and Pending Registrations
- Staff Login and Passwords
- Demo Profiles and Defaults
- Legacy Google Auth Schema
- Staff Account Database Schema
- Backend Runtime and Routing
- Historical Local Overview
- Historical Mobile Branding
- Historical Desktop Branding
- Historical Member Directory
- Community Logo Assets
- Root Layout and Metadata
- Historical Class Management
- Historical Next.js Overview
- Historical Compact Overview
- Single Developer Constraint
- Vercel Build Configuration
- Historical OTP Dialog
- Next.js Runtime Configuration
- Favicon Visual Asset
- Agent Documentation Rules

## God Nodes (most connected - your core abstractions)
1. `createBackend()` - 33 edges
2. `react` - 29 edges
3. `lucide-react` - 27 edges
4. `App()` - 25 edges
5. `IconButton()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Registration request fingerprints prevent duplicate retries` --semantically_similar_to--> `Public pending versus staff approved registration`  [INFERRED] [semantically similar]
  docs/ARCHITECTURE.md → README.md
- `Public circular CTN Phật tử Phật Quang Biên Hòa emblem` --semantically_similar_to--> `Circular CTN Phật tử Phật Quang Biên Hòa emblem`  [INFERRED] [semantically similar]
  public/logo-ctn.png → logo-ctn.png
- `profile()` --calls--> `getTeam()`  [EXTRACTED]
  server/backend.mjs → src/lib/areas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Staff authorization, registration approval, flexible profiles and guided intake** — docs_architecture_staff_permissions, docs_architecture_profile_schema, readme_registration_approval, docs_registration_intake_progressive_flow [INFERRED 0.95]
- **Guardrails, measured Design DNA, UI composition and honest verification** — design_guardrails_premium_saas, docs_design_dna_readme_active_profile, docs_ui_style_current_system, docs_design_dna_premium_saas_audit_refinement, docs_design_dna_premium_saas_verification_palette_limits [INFERRED 0.95]

## Communities (51 total, 14 thin omitted)

### Community 0 - "Member Sheets and Profiles"
Cohesion: 0.11
Nodes (35): ActivityStatus(), MemberDataTable(), MemberPicker(), ProfileForm(), control(), Props, Pagination(), Button() (+27 more)

### Community 1 - "Dependencies and Package Scripts"
Cohesion: 0.05
Nodes (39): dependencies, @aws-sdk/client-s3@^3.1145.0, @electric-sql/pglite@^0.5.8, express@^5.2.1, lucide-react@^0.468.0, next@^16.3.8, pg@^8.23.1, react@^19.3.0 (+31 more)

### Community 2 - "Dashboard Filters and Charts"
Cohesion: 0.10
Nodes (29): groupOrder, ManagementDashboard(), Props, SegmentedControl(), monthlyChartGeometry(), Bars(), DashboardCharts(), Dimension (+21 more)

### Community 3 - "Architecture and Design Documents"
Cohesion: 0.06
Nodes (36): Scrypt staff passwords and secure revocable sessions, Versioned group schemas and members.profile_data JSONB, Dev, Admin, Manager and public authorization, October 8 design: derive team from members.area, Historical 20-ward to three-team mapping, Idempotent local-only 360-member demo data script, Dashboard shared filters and approved-only statistics, Vercel Next.js, Supabase PostgreSQL and private Cloudflare R2 (+28 more)

### Community 4 - "Classes and Area Mapping"
Cohesion: 0.13
Nodes (20): ClassManagement(), download(), Props, areaOptions(), getTeam(), matchesTeam(), Team, teamAreas (+12 more)

### Community 5 - "Application State and Navigation"
Cohesion: 0.14
Nodes (19): App(), approve(), logout(), markSaving(), reject(), Registration(), loading(), ManagementDashboard (+11 more)

### Community 6 - "Shared Controls and Accounts"
Cohesion: 0.21
Nodes (15): lucide-react, react, QuickSearch(), Result, Account, StaffAccounts(), Dialog(), IconButton() (+7 more)

### Community 7 - "Public Routes and Forms"
Cohesion: 0.14
Nodes (8): next, ErrorPage(), NotFound(), Brand(), PublicShell(), RegistrationComplete(), RegistrationForm(), PageHeader()

### Community 8 - "Guided Intake and Portraits"
Cohesion: 0.19
Nodes (14): PortraitInput(), Source, blank, commonSteps, RegistrationIntake(), next(), submit(), update() (+6 more)

### Community 9 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, checkJs, esModuleInterop, incremental, isolatedModules, jsx (+11 more)

### Community 10 - "Registration API Test Fixtures"
Cohesion: 0.26
Nodes (7): sharp, handleRequest(), client(), memoryStorage(), validValues(), client(), client()

### Community 11 - "Initial Local Database Schema"
Cohesion: 0.20
Nodes (15): accounts, app_meta, audit_log, challenges, challenges_account_idx, class_managers, classes, enrollments (+7 more)

### Community 12 - "Profile Schema and Approval"
Cohesion: 0.13
Nodes (10): members_email_unique, members_profile_data_gin, registration_schemas, registration_submissions, members_pending_group_idx, members_email_unique, members_profile_data_gin, registration_schemas (+2 more)

### Community 13 - "Initial Supabase Database Schema"
Cohesion: 0.20
Nodes (15): accounts, app_meta, audit_log, challenges, challenges_account_idx, class_managers, classes, enrollments (+7 more)

### Community 14 - "Maintenance and Deployment Checks"
Cohesion: 0.16
Nodes (8): forbidden, trace, pages, report, results, resetMemberData(), names, seed

### Community 15 - "Cloud Database and Storage"
Cohesion: 0.23
Nodes (5): backupDir, createPostgresDatabase(), createProductionBackend(), createR2Storage(), productionConfig()

### Community 16 - "Backend Validation and Persistence"
Cohesion: 0.31
Nodes (15): createBackend(), avatar(), checkPassword(), limit(), managed(), memberLinks(), schemaFor(), serialize() (+7 more)

### Community 17 - "Staff Passwords and Sessions"
Cohesion: 0.21
Nodes (8): configurable, issueSession(), fields, passwordHash(), passwordMatches(), scrypt, token(), DEV_ACCOUNT

### Community 18 - "Workspace API Domain Types"
Cohesion: 0.21
Nodes (9): Props, WorkspacePage, Choice, Bootstrap, ClassInfo, Session, groupLabels, MemberGroup (+1 more)

### Community 19 - "Navigation and Pending Registrations"
Cohesion: 0.21
Nodes (6): WorkspaceShell(), Card(), CardHeader(), PendingRegistrations(), Props, waiting

### Community 20 - "Staff Login and Passwords"
Cohesion: 0.35
Nodes (7): ChangePassword, Page(), Page(), AdminLogin(), ChangePassword(), Feedback(), Field()

### Community 21 - "Demo Profiles and Defaults"
Cohesion: 0.31
Nodes (4): lines, generateDemoProfiles(), legacyProvinces, defaultSchemas

### Community 22 - "Legacy Google Auth Schema"
Cohesion: 0.28
Nodes (6): accounts_google_subject_unique, google_oauth_flows, google_oauth_flows_expiry_idx, accounts_google_subject_unique, google_oauth_flows, google_oauth_flows_expiry_idx

### Community 23 - "Staff Account Database Schema"
Cohesion: 0.33
Nodes (6): staff_accounts, staff_class_managers, staff_sessions, staff_accounts, staff_class_managers, staff_sessions

### Community 24 - "Backend Runtime and Routing"
Cohesion: 0.31
Nodes (7): getBackend(), key, startLocal(), dynamic, handler(), maxDuration, runtime

### Community 25 - "Historical Local Overview"
Cohesion: 0.29
Nodes (7): Historical member identity and management role header, Historical local-backend overview screenshot, Historical banner: local PostgreSQL and simulated SMS, Personalized green welcome panel, Recent member registrations panel, Historical management sidebar navigation, Study class enrollment panel

### Community 26 - "Historical Mobile Branding"
Cohesion: 0.33
Nodes (6): Burgundy gold historical branding, Historical mobile overview preview, Mobile overview header, Tổng quan mobile page, Recently registered members list, Personalized welcome panel

### Community 27 - "Historical Desktop Branding"
Cohesion: 0.33
Nodes (6): Circular community logo with Phật Hào wordmark, Historical study-class schedule card, Historical red-and-cream brand overview, Historical recent-registration list, Historical fixed sidebar navigation, Burgundy welcome panel with gold edge

### Community 28 - "Historical Member Directory"
Cohesion: 0.33
Nodes (6): Historical browser-stored sample-data banner, Historical desktop member directory screenshot, Historical member table pagination, All active and awaiting-confirmation tabs, Historical member data table, Search filter sort density and CSV controls

### Community 29 - "Community Logo Assets"
Cohesion: 0.33
Nodes (6): Circular CTN Phật tử Phật Quang Biên Hòa emblem, Multicolored flame-like center motif, Red circular lettering and concentric borders, Public circular CTN Phật tử Phật Quang Biên Hòa emblem, Public multicolored flame-like center motif, Public red circular lettering and concentric borders

### Community 30 - "Root Layout and Metadata"
Cohesion: 0.33
Nodes (3): geist, metadata, viewport

### Community 31 - "Historical Class Management"
Cohesion: 0.40
Nodes (5): Enrollment row actions, Historical class navigation, Historical class management screenshot, Class roster data table, Roster search and export controls

### Community 32 - "Historical Next.js Overview"
Cohesion: 0.40
Nodes (5): Study class summary card, Historical desktop overview screenshot, Overview management workspace, Recent member registrations card, Burgundy welcome banner

### Community 33 - "Historical Compact Overview"
Cohesion: 0.40
Nodes (5): Compact overview workspace, Green historical organization branding, Historical compact overview screenshot, Recent registrations compact card, Compact study class card

### Community 35 - "Vercel Build Configuration"
Cohesion: 0.40
Nodes (4): buildCommand, framework, regions, $schema

### Community 36 - "Historical OTP Dialog"
Cohesion: 0.50
Nodes (4): Displayed account-bound single-use five-minute OTP description, Historical simulated-OTP password-change dialog, Visible notice that SMS was not actually sent, Historical OTP input verification and resend controls

### Community 39 - "Favicon Visual Asset"
Cohesion: 0.67
Nodes (3): Rounded dark green tile, Favicon vector asset, White eight-ray radial symbol

## Ambiguous Edges - Review These
- `October 8 design: derive team from members.area` → `Progressive registration intake with persistent revealed sections`  [AMBIGUOUS]
  docs/REGISTRATION_INTAKE.md · relation: conceptually_related_to

## Knowledge Gaps
- **50 isolated node(s):** `Next.js bundled documentation compatibility rules`, `Claude project instructions reference AGENTS.md`, `Idempotent local-only 360-member demo data script`, `Historical member-auth roadmap canceled for staff portal`, `Occupation-dependent workplace or school field` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 213 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Backend `profile()` liên kết với `getTeam()` ở phần khu vực như thế nào?**
  _Liên kết calls được trích xuất từ server/backend.mjs sang src/lib/areas.ts; đi qua hai nhóm chức năng._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `October 8 design: derive team from members.area` and `Progressive registration intake with persistent revealed sections`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._

## Extraction Integrity and Scope
- Read-only source analysis: no application data, database rows, credentials, deployment or business logic was changed.
- All 19 documents were read completely; all 11 images were inspected. Historical screenshots are explicitly labeled historical.
- `src/styles/tokens.css` was falsely classified as sensitive by filename; it was included after source review. The AST extractor does not model CSS symbols.
- SQL parser support was installed locally. DML-only migrations and several test/seed files yield no symbols; their file nodes are not proof of complete SQL/data-flow extraction.
- Graph health warning: 3 dangling-endpoint edges, 2 self-loop edges, and 81 same-endpoint edge variants collapsed in the undirected graph. See graph-health.json; this graph is a navigation aid, not a complete execution model.
- Documentation and screenshots may describe older implementations. The graph does not verify live Supabase state.
- `graphify-out/` was written into the Git working tree and is not ignored; commit only the outputs the team should share, or add it to .gitignore. No commit or push was performed.
