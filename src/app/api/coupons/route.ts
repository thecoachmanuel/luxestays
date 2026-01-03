import { NextResponse } from 'next/server';
import { getCoupons, addCoupon } from '@/lib/db';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive(),
  expirationDate: z.string(),
});

export async function GET() {
  try {
    const coupons = await getCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = couponSchema.safeParse(body);

    if (!result.success) {
      console.error("Coupon validation error:", result.error);
      return NextResponse.json(
        { error: 'Invalid coupon data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    await addCoupon(result.data);
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
