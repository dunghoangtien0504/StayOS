import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PANCAKE_API_BASE, getTokenForPage } from '@/lib/pancake';

/**
 * POST /api/bookings/pending/[id]/approve
 * Owner approves a pending booking:
 *  1. Creates a real booking in Supabase
 *  2. Marks pending_booking as approved
 *  3. Sends confirmation message to guest via Pancake
 *
 * Body: { roomId, source? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { roomId, source = 'facebook' } = body;

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  // 1. Fetch pending booking
  const { data: pending, error: fetchErr } = await supabase
    .from('pending_bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !pending) {
    return NextResponse.json({ error: 'Pending booking not found' }, { status: 404 });
  }
  if (pending.status !== 'pending') {
    return NextResponse.json({ error: `Already ${pending.status}` }, { status: 400 });
  }

  // 2. Get property id from room
  const { data: room } = await supabase
    .from('rooms')
    .select('id, property_id, name, base_price')
    .eq('id', roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // 3. Create real booking
  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { error: bookErr } = await supabase.from('bookings').insert({
    id: bookingId,
    property_id: room.property_id,
    room_id: roomId,
    guest_name: pending.guest_name,
    guest_phone: pending.guest_phone ?? '',
    source,
    status: 'confirmed',
    check_in: pending.check_in,
    check_out: pending.check_out,
    total_price: pending.total_price,
    amount_paid: pending.total_price,
    payments: [],
  });

  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }

  // 4. Mark pending booking as approved
  await supabase
    .from('pending_bookings')
    .update({ status: 'approved', approved_booking_id: bookingId })
    .eq('id', id);

  // 5. Send confirmation to guest via Pancake (best-effort)
  try {
    const page = getTokenForPage(pending.page_id);
    if (page) {
      const checkIn = new Date(pending.check_in).toLocaleDateString('vi-VN');
      const checkOut = new Date(pending.check_out).toLocaleDateString('vi-VN');
      const confirmMsg =
        `✅ Xác nhận đặt phòng thành công!\n\n` +
        `👤 Khách: ${pending.guest_name}\n` +
        `🛏️ Phòng: ${room.name}${pending.room_type ? ` (${pending.room_type})` : ''}\n` +
        `📅 Nhận phòng: ${checkIn} (14:00)\n` +
        `📅 Trả phòng: ${checkOut} (11:00)\n` +
        `💰 Tổng tiền: ${Number(pending.total_price).toLocaleString('vi-VN')}đ\n\n` +
        `Cảm ơn bạn đã chọn Ta Thong Dong Homestay! Hẹn gặp bạn sớm nhé 🏠`;

      const url =
        `${PANCAKE_API_BASE}/public_api/v1/pages/${pending.page_id}` +
        `/conversations/${pending.conversation_id}/messages` +
        `?access_token=${page.token}`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_inbox',
          message: confirmMsg,
          ...(pending.customer_id ? { customer_id: pending.customer_id } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });
    }
  } catch (err) {
    console.error('[approve] Pancake confirm send failed:', err);
    // Non-fatal — booking is already created
  }

  return NextResponse.json({ success: true, bookingId });
}

/**
 * DELETE /api/bookings/pending/[id]/approve → reject pending booking
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from('pending_bookings')
    .update({ status: 'rejected' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
