import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const planTierEnum = pgEnum('plan_tier', ['free', 'pro', 'team', 'enterprise']);

export const seniorityEnum = pgEnum('seniority', [
  'c_suite', 'vp', 'director', 'manager', 'individual',
]);

export const roleTypeEnum = pgEnum('role_type', [
  'economic_buyer', 'technical_evaluator', 'champion', 'blocker', 'influencer',
]);

export const commStyleEnum = pgEnum('comm_style', [
  'formal', 'casual', 'technical', 'visionary',
]);

export const signalTypeEnum = pgEnum('signal_type', [
  'funding', 'hiring', 'expansion', 'leadership',
  'technology', 'financial', 'competitive', 'tender',
  'product_launch', 'partnership', 'earnings', 'social',
]);

export const signalSeverityEnum = pgEnum('signal_severity', [
  'critical', 'high', 'medium', 'low', 'info',
]);

export const recommendedActionEnum = pgEnum('recommended_action', [
  'urgent_outreach', 'engage', 'research', 'monitor', 'ignore',
]);

export const classifiedByEnum = pgEnum('classified_by', [
  'keyword', 'ml', 'llm',
]);

export const userSignalStatusEnum = pgEnum('user_signal_status', [
  'unread', 'read', 'dismissed', 'actioned',
]);

export const researchJobTypeEnum = pgEnum('research_job_type', [
  'standard', 'deep',
]);

export const researchJobStatusEnum = pgEnum('research_job_status', [
  'pending', 'running', 'completed', 'failed',
]);

export const dealVelocityEnum = pgEnum('deal_velocity', [
  'accelerating', 'steady', 'decelerating',
]);

export const entityTypeEnum = pgEnum('entity_type', [
  'company', 'person', 'technology', 'investor', 'event',
]);

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'employs', 'invested_in', 'competes_with', 'uses_technology',
  'previously_at', 'partners_with', 'acquired', 'board_member_of',
]);

export const outreachChannelEnum = pgEnum('outreach_channel', [
  'email', 'linkedin', 'phone_script',
]);

export const outreachVariantEnum = pgEnum('outreach_variant', [
  'cold', 'warm', 'referral', 'trigger_based', 'follow_up',
]);

export const outreachStatusEnum = pgEnum('outreach_status', [
  'draft', 'sent', 'replied', 'no_response', 'meeting_booked',
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  teamId: uuid('team_id').references(() => teams.id),
  planTier: planTierEnum('plan_tier').default('free').notNull(),
  creditsUsed: integer('credits_used').default(0).notNull(),
  creditsLimit: integer('credits_limit').default(100).notNull(),
  creditsResetAt: timestamp('credits_reset_at', { withTimezone: true }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_clerk_id_idx').on(table.clerkId),
  index('users_email_idx').on(table.email),
  index('users_team_id_idx').on(table.teamId),
]);

// Teams
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id').notNull(),
  planTier: planTierEnum('plan_tier').default('team').notNull(),
  maxMembers: integer('max_members').default(10).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('teams_slug_idx').on(table.slug),
]);

// Companies
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain'),
  logoUrl: text('logo_url'),
  description: text('description'),
  industry: text('industry'),
  subIndustry: text('sub_industry'),
  employeeCount: text('employee_count'),
  employeeExact: integer('employee_exact'),
  foundedYear: integer('founded_year'),
  hqCity: text('hq_city'),
  hqState: text('hq_state'),
  hqCountry: text('hq_country'),
  fundingStage: text('funding_stage'),
  totalFunding: real('total_funding'),
  lastFundingDate: timestamp('last_funding_date', { withTimezone: true }),
  revenueRange: text('revenue_range'),
  lifecycleStage: text('lifecycle_stage'),
  techStack: jsonb('tech_stack').default([]).notNull(),
  socialLinks: jsonb('social_links').default({}).notNull(),
  enrichedAt: timestamp('enriched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('companies_slug_idx').on(table.slug),
  index('companies_domain_idx').on(table.domain),
  index('companies_industry_idx').on(table.industry),
  index('companies_name_idx').on(table.name),
]);

// Company Scores
export const companyScores = pgTable('company_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  healthScore: real('health_score').default(0).notNull(),
  healthFitComponent: real('health_fit_component').default(0).notNull(),
  healthVelocityComponent: real('health_velocity_component').default(0).notNull(),
  healthIntentComponent: real('health_intent_component').default(0).notNull(),
  healthReadinessComponent: real('health_readiness_component').default(0).notNull(),
  propensityScore: real('propensity_score').default(0).notNull(),
  propensityFactors: jsonb('propensity_factors').default({}).notNull(),
  buyingWindowStart: timestamp('buying_window_start', { withTimezone: true }),
  buyingWindowEnd: timestamp('buying_window_end', { withTimezone: true }),
  buyingWindowConfidence: real('buying_window_confidence').default(0).notNull(),
  buyingWindowDriver: text('buying_window_driver'),
  dealVelocity: dealVelocityEnum('deal_velocity'),
  velocitySignals: jsonb('velocity_signals').default([]).notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('company_scores_company_id_idx').on(table.companyId),
  index('company_scores_user_id_idx').on(table.userId),
  uniqueIndex('company_scores_company_user_idx').on(table.companyId, table.userId),
]);

// Contacts
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  email: text('email'),
  fullName: text('full_name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  title: text('title'),
  seniority: seniorityEnum('seniority'),
  department: text('department'),
  linkedinUrl: text('linkedin_url'),
  twitterHandle: text('twitter_handle'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  location: text('location'),
  bio: text('bio'),
  careerHistory: jsonb('career_history').default([]).notNull(),
  roleType: roleTypeEnum('role_type'),
  commStyle: commStyleEnum('comm_style'),
  recentActivity: jsonb('recent_activity').default([]).notNull(),
  enrichedAt: timestamp('enriched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('contacts_company_id_idx').on(table.companyId),
  index('contacts_email_idx').on(table.email),
  index('contacts_full_name_idx').on(table.fullName),
]);

// Signals
export const signals = pgTable('signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  signalType: signalTypeEnum('signal_type').notNull(),
  signalSubtype: text('signal_subtype'),
  severity: signalSeverityEnum('severity').notNull(),
  intentScore: real('intent_score').default(0).notNull(),
  confidence: real('confidence').default(0).notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  rawContent: text('raw_content'),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  sourceTier: integer('source_tier').default(3).notNull(),
  whyItMatters: text('why_it_matters'),
  recommendedAction: recommendedActionEnum('recommended_action'),
  actionTemplate: text('action_template'),
  classifiedBy: classifiedByEnum('classified_by').notNull(),
  entities: jsonb('entities').default({}).notNull(),
  evidence: jsonb('evidence').default([]).notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('signals_company_id_idx').on(table.companyId),
  index('signals_contact_id_idx').on(table.contactId),
  index('signals_signal_type_idx').on(table.signalType),
  index('signals_severity_idx').on(table.severity),
  index('signals_detected_at_idx').on(table.detectedAt),
  index('signals_intent_score_idx').on(table.intentScore),
]);

// Signal Embeddings
export const signalEmbeddings = pgTable('signal_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  signalId: uuid('signal_id').notNull().references(() => signals.id, { onDelete: 'cascade' }),
  embedding: jsonb('embedding').notNull(),
  model: text('model').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('signal_embeddings_signal_id_idx').on(table.signalId),
]);

// User Signals (join table for user-specific signal state)
export const userSignals = pgTable('user_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  signalId: uuid('signal_id').notNull().references(() => signals.id, { onDelete: 'cascade' }),
  status: userSignalStatusEnum('status').default('unread').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  actionedAt: timestamp('actioned_at', { withTimezone: true }),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('user_signals_user_signal_idx').on(table.userId, table.signalId),
  index('user_signals_user_id_idx').on(table.userId),
  index('user_signals_signal_id_idx').on(table.signalId),
  index('user_signals_status_idx').on(table.status),
]);

// Targets (user's tracked companies)
export const targets = pgTable('targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  priority: integer('priority').default(0).notNull(),
  notes: text('notes'),
  tags: jsonb('tags').default([]).notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('targets_user_company_idx').on(table.userId, table.companyId),
  index('targets_user_id_idx').on(table.userId),
  index('targets_company_id_idx').on(table.companyId),
]);

// Graph Entities
export const graphEntities = pgTable('graph_entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: entityTypeEnum('entity_type').notNull(),
  entityRefId: uuid('entity_ref_id'),
  name: text('name').notNull(),
  attributes: jsonb('attributes').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('graph_entities_entity_type_idx').on(table.entityType),
  index('graph_entities_name_idx').on(table.name),
  index('graph_entities_entity_ref_id_idx').on(table.entityRefId),
]);

// Graph Edges
export const graphEdges = pgTable('graph_edges', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceId: uuid('source_id').notNull().references(() => graphEntities.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull().references(() => graphEntities.id, { onDelete: 'cascade' }),
  relationship: relationshipTypeEnum('relationship').notNull(),
  weight: real('weight').default(1.0).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  detectedFrom: uuid('detected_from'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('graph_edges_source_id_idx').on(table.sourceId),
  index('graph_edges_target_id_idx').on(table.targetId),
  index('graph_edges_relationship_idx').on(table.relationship),
]);

// Research Jobs
export const researchJobs = pgTable('research_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactEmail: text('contact_email'),
  jobType: researchJobTypeEnum('job_type').notNull(),
  status: researchJobStatusEnum('status').default('pending').notNull(),
  progress: jsonb('progress').default([]).notNull(),
  result: jsonb('result'),
  creditsConsumed: integer('credits_consumed').default(0).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('research_jobs_user_id_idx').on(table.userId),
  index('research_jobs_company_id_idx').on(table.companyId),
  index('research_jobs_status_idx').on(table.status),
]);

// Outreach Drafts
export const outreachDrafts = pgTable('outreach_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  signalId: uuid('signal_id').references(() => signals.id, { onDelete: 'set null' }),
  channel: outreachChannelEnum('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  variant: outreachVariantEnum('variant'),
  status: outreachStatusEnum('status').default('draft').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('outreach_drafts_user_id_idx').on(table.userId),
  index('outreach_drafts_company_id_idx').on(table.companyId),
  index('outreach_drafts_contact_id_idx').on(table.contactId),
  index('outreach_drafts_status_idx').on(table.status),
]);

// Signal Baselines (for anomaly detection)
export const signalBaselines = pgTable('signal_baselines', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  signalType: signalTypeEnum('signal_type').notNull(),
  baselineValue: real('baseline_value').notNull(),
  stdDev: real('std_dev').notNull(),
  sampleSize: integer('sample_size').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('signal_baselines_company_id_idx').on(table.companyId),
  uniqueIndex('signal_baselines_company_type_idx').on(table.companyId, table.signalType),
]);

// Feedback Events (for ML feedback loop)
export const feedbackEvents = pgTable('feedback_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  signalId: uuid('signal_id').references(() => signals.id, { onDelete: 'set null' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  eventData: jsonb('event_data').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('feedback_events_user_id_idx').on(table.userId),
  index('feedback_events_signal_id_idx').on(table.signalId),
  index('feedback_events_event_type_idx').on(table.eventType),
]);

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  targets: many(targets),
  userSignals: many(userSignals),
  researchJobs: many(researchJobs),
  outreachDrafts: many(outreachDrafts),
  companyScores: many(companyScores),
  feedbackEvents: many(feedbackEvents),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  signals: many(signals),
  scores: many(companyScores),
  targets: many(targets),
  researchJobs: many(researchJobs),
  outreachDrafts: many(outreachDrafts),
  signalBaselines: many(signalBaselines),
  feedbackEvents: many(feedbackEvents),
}));

export const companyScoresRelations = relations(companyScores, ({ one }) => ({
  company: one(companies, { fields: [companyScores.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyScores.userId], references: [users.id] }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
  signals: many(signals),
  outreachDrafts: many(outreachDrafts),
}));

export const signalsRelations = relations(signals, ({ one, many }) => ({
  company: one(companies, { fields: [signals.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [signals.contactId], references: [contacts.id] }),
  embedding: one(signalEmbeddings, { fields: [signals.id], references: [signalEmbeddings.signalId] }),
  userSignals: many(userSignals),
  outreachDrafts: many(outreachDrafts),
  feedbackEvents: many(feedbackEvents),
}));

export const signalEmbeddingsRelations = relations(signalEmbeddings, ({ one }) => ({
  signal: one(signals, { fields: [signalEmbeddings.signalId], references: [signals.id] }),
}));

export const userSignalsRelations = relations(userSignals, ({ one }) => ({
  user: one(users, { fields: [userSignals.userId], references: [users.id] }),
  signal: one(signals, { fields: [userSignals.signalId], references: [signals.id] }),
}));

export const targetsRelations = relations(targets, ({ one }) => ({
  user: one(users, { fields: [targets.userId], references: [users.id] }),
  company: one(companies, { fields: [targets.companyId], references: [companies.id] }),
}));

export const graphEntitiesRelations = relations(graphEntities, ({ many }) => ({
  outgoingEdges: many(graphEdges, { relationName: 'source' }),
  incomingEdges: many(graphEdges, { relationName: 'target' }),
}));

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
  source: one(graphEntities, { fields: [graphEdges.sourceId], references: [graphEntities.id], relationName: 'source' }),
  target: one(graphEntities, { fields: [graphEdges.targetId], references: [graphEntities.id], relationName: 'target' }),
}));

export const researchJobsRelations = relations(researchJobs, ({ one }) => ({
  user: one(users, { fields: [researchJobs.userId], references: [users.id] }),
  company: one(companies, { fields: [researchJobs.companyId], references: [companies.id] }),
}));

export const outreachDraftsRelations = relations(outreachDrafts, ({ one }) => ({
  user: one(users, { fields: [outreachDrafts.userId], references: [users.id] }),
  company: one(companies, { fields: [outreachDrafts.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [outreachDrafts.contactId], references: [contacts.id] }),
  signal: one(signals, { fields: [outreachDrafts.signalId], references: [signals.id] }),
}));

export const signalBaselinesRelations = relations(signalBaselines, ({ one }) => ({
  company: one(companies, { fields: [signalBaselines.companyId], references: [companies.id] }),
}));

export const feedbackEventsRelations = relations(feedbackEvents, ({ one }) => ({
  user: one(users, { fields: [feedbackEvents.userId], references: [users.id] }),
  signal: one(signals, { fields: [feedbackEvents.signalId], references: [signals.id] }),
  company: one(companies, { fields: [feedbackEvents.companyId], references: [companies.id] }),
}));
