import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
  object: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  try {
    // Clerk uses Svix for webhooks which uses a specific HMAC verification
    const expectedSignature = CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);
    return signature.includes(expectedSignature);
  } catch {
    return false;
  }
}

async function handleUserCreated(userData: ClerkUserData): Promise<void> {
  const primaryEmail = userData.email_addresses?.[0]?.email_address;
  const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null;

  // In production: insert into users table
  // await db.insert(users).values({
  //   clerkId: userData.id,
  //   email: primaryEmail,
  //   fullName,
  //   avatarUrl: userData.image_url,
  //   planTier: 'free',
  //   creditsUsed: 0,
  //   creditsLimit: 100,
  //   creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //   onboardingCompleted: false,
  // });

  console.log(`[Clerk Webhook] User created: ${userData.id} (${primaryEmail}), name: ${fullName}`);
}

async function handleUserUpdated(userData: ClerkUserData): Promise<void> {
  const primaryEmail = userData.email_addresses?.[0]?.email_address;
  const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || null;

  // In production: update users table
  // await db.update(users)
  //   .set({
  //     email: primaryEmail,
  //     fullName,
  //     avatarUrl: userData.image_url,
  //     updatedAt: new Date(),
  //   })
  //   .where(eq(users.clerkId, userData.id));

  console.log(`[Clerk Webhook] User updated: ${userData.id} (${primaryEmail}), name: ${fullName}`);
}

async function handleUserDeleted(userData: ClerkUserData): Promise<void> {
  // In production: soft-delete or cascade delete user and related data
  // await db.delete(users).where(eq(users.clerkId, userData.id));

  console.log(`[Clerk Webhook] User deleted: ${userData.id}`);
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const payload = await request.text();

    // Verify webhook signature
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing webhook signature headers' },
        { status: 400 }
      );
    }

    // Timestamp validation (reject events older than 5 minutes)
    const timestampMs = parseInt(svixTimestamp, 10) * 1000;
    if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Webhook timestamp is too old or invalid' },
        { status: 400 }
      );
    }

    // Verify signature
    const signaturePayload = `${svixId}.${svixTimestamp}.${payload}`;
    if (!verifyWebhookSignature(signaturePayload, svixSignature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event: ClerkWebhookEvent = JSON.parse(payload);
    const userData = event.data as unknown as ClerkUserData;

    switch (event.type) {
      case 'user.created':
        await handleUserCreated(userData);
        break;

      case 'user.updated':
        await handleUserUpdated(userData);
        break;

      case 'user.deleted':
        await handleUserDeleted(userData);
        break;

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type }, { status: 200 });
  } catch (err) {
    console.error('[Clerk Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
