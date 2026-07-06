import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/** GET /api/bookings/pending — list all pending bookings */
export async function GET() {
  const { data, error } = await supabase
    .from('pending_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pendingBookings: data ?? [] });
}
