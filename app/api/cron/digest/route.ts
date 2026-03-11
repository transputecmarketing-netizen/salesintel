import { NextRequest, NextResponse } from 'next/server';

// Cron endpoint for daily email digest generation
// Iterates all users with active targets and sends a personalized digest

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

interface DigestEntry {
  companyName: string;
  companyId: string;
  signalCount: number;
  topSignal: { title: string; severity: string } | null;
  healthScoreChange: number;
}

interface UserDigest {
  userId: string;
  email: string;
  entries: DigestEntry[];
  sent: boolean;
  error: string | null;
}

async function buildUserDigest(
  _userId: string,
  _email: string
): Promise<UserDigest> {
  // In production:
  // 1. Query user's targets
  // 2. For each target, find signals from last 24h
  // 3. Compute health score changes
  // 4. Prioritize by severity and relevance
  // 5. Build HTML email from template
  // 6. Send via Resend/SendGrid/etc.

  return {
    userId: _userId,
    email: _email,
    entries: [],
    sent: false,
    error: null,
  };
}

async function sendDigestEmail(_digest: UserDigest): Promise<boolean> {
  // In production: use Resend or SendGrid
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'SalesIntel <digest@salesintel.app>',
  //   to: digest.email,
  //   subject: `SalesIntel Daily Digest - ${digest.entries.length} updates`,
  //   html: renderDigestTemplate(digest),
  // });

  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production: query all users who have notification preferences enabled
    // and have at least one active target
    // const eligibleUsers = await db.select({
    //   userId: users.id,
    //   email: users.email,
    // })
    // .from(users)
    // .innerJoin(targets, eq(users.id, targets.userId))
    // .groupBy(users.id, users.email);

    const eligibleUsers: Array<{ userId: string; email: string }> = [];

    const digests: UserDigest[] = [];

    for (const user of eligibleUsers) {
      try {
        const digest = await buildUserDigest(user.userId, user.email);

        // Only send if there are entries
        if (digest.entries.length > 0) {
          const sent = await sendDigestEmail(digest);
          digest.sent = sent;
        }

        digests.push(digest);
      } catch (err) {
        digests.push({
          userId: user.userId,
          email: user.email,
          entries: [],
          sent: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const sentCount = digests.filter((d) => d.sent).length;
    const failedCount = digests.filter((d) => d.error !== null).length;
    const skippedCount = digests.filter((d) => !d.sent && d.error === null).length;
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      totalUsers: eligibleUsers.length,
      digestsSent: sentCount,
      digestsFailed: failedCount,
      digestsSkipped: skippedCount,
      durationMs,
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron/Digest] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Digest generation failed',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
