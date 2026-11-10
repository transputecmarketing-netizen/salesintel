# Crises Control framework rules (from the Company Operating Framework V4)

These are the parts of the operating framework that shape every document. They are already built into the kits (`LIFE`, `PILLARS`, `POSITIONING`, `MODULES` in ccprac.py / cckit.py); this page explains them so your own text agrees with the pages the kits generate.

## Category and positioning

- Category: **Operational Incident Coordination Platform**. Not "mass notification", not "emergency alerting software". Alerting is the first step, not the product.
- Core line: **"Most organisations can send alerts. Few can manage incidents end-to-end."**
- Positioning statement: "Crises Control helps organisations maintain operational control during incidents by combining alerting, coordination, execution, visibility and accountability in one platform."
- The story to tell: sending the alert is the easy part. Outcomes depend on who acknowledged, who decided, which actions started and finished, what each audience was told, and whether you can prove it afterwards.

## Five common failures (the problem)

1. Fragmented information: different teams work from different information.
2. Delayed decision making: leadership lacks visibility, so decisions wait.
3. Uncoordinated response: several teams work independently on the same problem.
4. Lack of visibility: critical actions become difficult to track.
5. Lack of accountability: actions and decisions are poorly documented.

Scenarios, use cases and essays are strongest when they show one of these failures happening and how a coordinated response avoids it.

## Four value pillars

1. Alerting and activation: reach the right people immediately.
2. Operational coordination: structure communication and response activities.
3. Execution and visibility: track tasks, responsibilities and progress.
4. Proof and accountability: create a complete, defensible operational record.

## Incident lifecycle and module order

Detection → Alert → Coordination → Execution → Recovery → Closure → Reporting.

| Order | Module | Role | What it does |
|---|---|---|---|
| 1 | SOS | Escalate | Frontline staff report an incident in one touch from a mobile device (location where supported). |
| 2 | Ping | Start | Alerting and activation by push, SMS, voice and email; acknowledgements and responses; escalation on no response. |
| 3 | Incident Manager | Coordinate | Activate the incident, assign roles, control communication, keep the timeline. |
| 4 | Task Manager | Execute | Assign actions with owners and deadlines, track completion, escalate what stalls. |
| 5 | Control Centre | Operate | Real-time view of incidents, timelines, task status and assets. |
| 6 | Audit & Reporting | Prove | Incident records, response analysis and task accountability, ready to report. |
| 7 | CRAiG | Assist | AI assistant that helps users interact with the platform, find information and work through the incident. |

- Use the name **Audit & Reporting** (the kit key "Audit Trail" is an alias).
- Platform pages always follow this order. Product descriptions use only these words, never invented features.
- **CRAiG**: current capability only. Never "predicts", "recommends actions automatically", "drafts your plan" or any roadmap item.

## Demonstrations

Demos follow the lifecycle: one incident moving through the whole platform in the reader's industry, about 30 minutes, not a feature tour. The final CTA page is built from `DEMO[industry]` (title + 7 steps, one per module) and links to the industry landing page with a QR code.

## Never

- Name competitors or compare against named products.
- Quote internal framework material: ICP tiers, pricing and packaging, KPIs, internal views of competitors, growth thesis.
- Invent customers, statistics, deployments or outcomes. Customer examples come only from the use-case register, with names removed.
- Present illustrative or intended use as a customer deployment.
