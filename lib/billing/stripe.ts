import type { PlanTier } from '@/types/billing';

export interface StripeCustomer {
  customerId: string;
  email: string;
  name: string;
  subscriptionId: string | null;
  planTier: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PortalSessionResult {
  url: string;
}

// Stripe price IDs mapped to plan tiers
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? '',
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY ?? '',
  },
};

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return key;
}

async function stripeRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: Record<string, string>;
  } = {}
): Promise<T | null> {
  try {
    const res = await fetch(`https://api.stripe.com/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Authorization': `Bearer ${getStripeSecretKey()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: options.body
        ? new URLSearchParams(options.body).toString()
        : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`[Stripe] ${path} returned ${res.status}: ${error}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Stripe] Request to ${path} failed:`, err);
    return null;
  }
}

/**
 * Create or retrieve a Stripe customer for a user.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string | null> {
  // Search for existing customer
  const searchResult = await stripeRequest<{
    data?: Array<{ id: string }>;
  }>(`/customers/search?query=metadata["userId"]:"${userId}"`);

  if (searchResult?.data?.[0]?.id) {
    return searchResult.data[0].id;
  }

  // Create new customer
  const customer = await stripeRequest<{ id?: string }>('/customers', {
    method: 'POST',
    body: {
      email,
      name,
      'metadata[userId]': userId,
    },
  });

  return customer?.id ?? null;
}

/**
 * Create a checkout session for subscription upgrade.
 */
export async function createCheckoutSession(
  customerId: string,
  planTier: PlanTier,
  billingInterval: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResult | null> {
  const priceIds = STRIPE_PRICE_IDS[planTier];
  if (!priceIds) {
    console.error(`[Stripe] No price IDs configured for tier: ${planTier}`);
    return null;
  }

  const priceId = billingInterval === 'yearly' ? priceIds.yearly : priceIds.monthly;
  if (!priceId) {
    console.error(`[Stripe] No ${billingInterval} price ID for tier: ${planTier}`);
    return null;
  }

  const session = await stripeRequest<{ id?: string; url?: string }>('/checkout/sessions', {
    method: 'POST',
    body: {
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'subscription_data[metadata][planTier]': planTier,
    },
  });

  if (!session?.id || !session?.url) return null;

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create a billing portal session for subscription management.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<PortalSessionResult | null> {
  const session = await stripeRequest<{ url?: string }>('/billing_portal/sessions', {
    method: 'POST',
    body: {
      customer: customerId,
      return_url: returnUrl,
    },
  });

  if (!session?.url) return null;

  return { url: session.url };
}

/**
 * Get subscription details for a customer.
 */
export async function getSubscription(
  customerId: string
): Promise<StripeCustomer | null> {
  const customer = await stripeRequest<{
    id?: string;
    email?: string;
    name?: string;
    subscriptions?: {
      data?: Array<{
        id?: string;
        status?: string;
        current_period_end?: number;
        cancel_at_period_end?: boolean;
        metadata?: Record<string, string>;
        items?: {
          data?: Array<{
            price?: {
              id?: string;
              metadata?: Record<string, string>;
            };
          }>;
        };
      }>;
    };
  }>(`/customers/${customerId}?expand[]=subscriptions`);

  if (!customer) return null;

  const subscription = customer.subscriptions?.data?.[0];
  const planTier = (subscription?.metadata?.planTier ?? 'free') as PlanTier;

  return {
    customerId: customer.id ?? customerId,
    email: customer.email ?? '',
    name: customer.name ?? '',
    subscriptionId: subscription?.id ?? null,
    planTier,
    status: (subscription?.status as StripeCustomer['status']) ?? 'active',
    currentPeriodEnd: subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  };
}

/**
 * Cancel a subscription at the end of the billing period.
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const result = await stripeRequest<{ id?: string }>(`/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: {
      cancel_at_period_end: 'true',
    },
  });

  return !!result?.id;
}

/**
 * Reactivate a canceled subscription (before period end).
 */
export async function reactivateSubscription(subscriptionId: string): Promise<boolean> {
  const result = await stripeRequest<{ id?: string }>(`/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: {
      cancel_at_period_end: 'false',
    },
  });

  return !!result?.id;
}

/**
 * Handle Stripe webhook events.
 */
export function parseWebhookPlanTier(event: {
  type: string;
  data: { object: Record<string, unknown> };
}): { userId: string; planTier: PlanTier; action: 'upgraded' | 'downgraded' | 'canceled' } | null {
  const obj = event.data.object;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const metadata = (obj.metadata ?? {}) as Record<string, string>;
      const planTier = (metadata.planTier ?? 'free') as PlanTier;
      const customerMetadata = (obj.customer_metadata ?? {}) as Record<string, string>;
      const userId = customerMetadata.userId ?? '';
      if (!userId) return null;
      return { userId, planTier, action: 'upgraded' };
    }

    case 'customer.subscription.deleted': {
      const customerMetadata = (obj.customer_metadata ?? {}) as Record<string, string>;
      const userId = customerMetadata.userId ?? '';
      if (!userId) return null;
      return { userId, planTier: 'free', action: 'canceled' };
    }

    default:
      return null;
  }
}
