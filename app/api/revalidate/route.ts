/**
 * On-Demand Revalidation API Route
 * Allows triggering cache revalidation for specific paths
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 *
 * Body:
 * - secret: string (required) - Secret token for authentication
 * - path: string (optional) - Path to revalidate
 * - tag: string (optional) - Tag to revalidate
 *
 * Example:
 * ```
 * fetch('/api/revalidate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     secret: process.env.REVALIDATION_SECRET,
 *     path: '/reports'
 *   })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, tag } = body;

    // Check for secret to confirm this is a valid request
    const revalidationSecret = process.env.REVALIDATION_SECRET || 'dev-secret-key';

    if (secret !== revalidationSecret) {
      return NextResponse.json(
        {
          revalidated: false,
          error: 'Invalid secret',
          message: 'Authentication failed'
        },
        { status: 401 }
      );
    }

    // Revalidate by path or tag
    if (path) {
      console.log(`[Revalidate] Revalidating path: ${path}`);
      revalidatePath(path);

      return NextResponse.json({
        revalidated: true,
        path,
        now: Date.now(),
      });
    }

    if (tag) {
      console.log(`[Revalidate] Revalidating tag: ${tag}`);
      revalidateTag(tag);

      return NextResponse.json({
        revalidated: true,
        tag,
        now: Date.now(),
      });
    }

    return NextResponse.json(
      {
        revalidated: false,
        error: 'Missing parameter',
        message: 'Either path or tag must be provided'
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Revalidate] Error:', error);

    return NextResponse.json(
      {
        revalidated: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
