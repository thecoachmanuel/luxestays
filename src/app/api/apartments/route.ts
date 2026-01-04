import { NextResponse } from 'next/server';
import { getApartments, addApartment, getCategories } from '@/lib/db';
import { Apartment } from '@/types';

export async function GET() {
  const apartments = await getApartments();
  return NextResponse.json(apartments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.price || !body.location || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const categories = await getCategories();
    const normalize = (s: string) => s.trim().toLowerCase();
    const requested = normalize(String(body.category));
    const match = categories.find(c => normalize(c.name) === requested);
    if (!match) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const newApartment: Apartment = {
      ...body,
      id: Math.random().toString(36).substr(2, 9),
      rating: body.rating || 0,
      amenities: body.amenities || [],
      category: match.name,
    };

    await addApartment(newApartment);
    
    return NextResponse.json(newApartment, { status: 201 });
  } catch (error) {
    console.error('Error adding apartment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
