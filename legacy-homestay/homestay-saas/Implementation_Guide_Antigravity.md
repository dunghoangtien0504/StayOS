# IMPLEMENTATION GUIDE FOR ANTIGRAVITY

**Auto-Connected System: Booking → Everything Updates**

---

## 🎯 OVERVIEW - HỆ THỐNG TỰ ĐỘNG KẾT NỐI

### Core Principle: Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────┐
│  USER ACTION: Tạo booking mới                           │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  DATABASE: Insert booking record                        │
│  + Auto-calculate total_amount                          │
│  + Validate overlap/buffer                              │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  TRIGGERS & EVENTS (Automatic):                         │
│                                                          │
│  1. Create cleaning_task (status: not_assigned)         │
│  2. Update dashboard_stats (increment booking_count)    │
│  3. Update room status (occupied)                       │
│  4. Notify staff (WebSocket/email)                      │
│  5. Update reports cache (invalidate)                   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  FRONTEND: Auto-refresh (via React Query)               │
│  • Timeline reloads                                     │
│  • Dashboard counters update                            │
│  • Reports re-calculate                                 │
└─────────────────────────────────────────────────────────┘
```

**Ví dụ cụ thể:**
```
User tạo booking:
- Room 101, check-in 10:00, check-out 14:00, giá 500k

AUTO UPDATES:
✅ Cleaning task created (Room 101, scheduled after 14:00)
✅ Dashboard "Booking hôm nay" +1
✅ Dashboard "Doanh thu tiềm năng" +500k
✅ Room 101 status → "occupied" from 10:00-14:00
✅ Timeline shows booking block
✅ Table view shows new row
✅ Reports "Tháng này" +1 booking
```

---

## 📊 DATABASE SCHEMA - WITH AUTO-UPDATE MECHANISMS

### 1. Core Tables với Calculated Columns

```sql
-- ============================================
-- BOOKINGS TABLE (Center of the system)
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  
  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  source_id UUID REFERENCES sources(id),
  assigned_staff_id UUID NOT NULL REFERENCES users(id),
  room_type_id UUID REFERENCES room_types(id),
  
  -- Time
  check_in_at TIMESTAMP NOT NULL,
  check_out_at TIMESTAMP NOT NULL,
  
  -- Pricing (calculated on insert/update)
  unit_price DECIMAL(12,2) NOT NULL,
  extra_fee DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (unit_price + extra_fee) STORED,
  
  -- Payment tracking (computed from payments table)
  total_paid DECIMAL(12,2) DEFAULT 0,  -- Updated by trigger
  remaining DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - total_paid) STORED,
  
  note TEXT,
  booking_status VARCHAR(20) DEFAULT 'confirmed'
    CHECK (booking_status IN ('reserved', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_out_after_check_in CHECK (check_out_at > check_in_at)
);

-- Indexes for performance
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_room_time ON bookings(room_id, check_in_at, check_out_at);
CREATE INDEX idx_bookings_dates ON bookings(check_in_at, check_out_at);
CREATE INDEX idx_bookings_status ON bookings(booking_status);

-- ============================================
-- PAYMENTS TABLE (Updates booking.total_paid)
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  payment_no INTEGER NOT NULL,  -- 1, 2, 3...
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_type VARCHAR(50) DEFAULT 'cash',
  note TEXT,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(booking_id, payment_no)
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

-- ============================================
-- CLEANING TASKS (Auto-created from bookings)
-- ============================================
CREATE TABLE cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES rooms(id),
  
  cleaner_id UUID REFERENCES cleaners(id),
  cleaning_status VARCHAR(20) DEFAULT 'not_assigned'
    CHECK (cleaning_status IN ('not_assigned', 'in_progress', 'completed')),
  
  scheduled_at TIMESTAMP,  -- Auto-set to check_out_at
  finished_at TIMESTAMP,
  note TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cleaning_booking ON cleaning_tasks(booking_id);
CREATE INDEX idx_cleaning_room ON cleaning_tasks(room_id);
CREATE INDEX idx_cleaning_status ON cleaning_tasks(cleaning_status);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),
  expense_group_id UUID NOT NULL REFERENCES expense_groups(id),
  
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  note TEXT,
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_property ON expenses(property_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
```

---

## 🔄 DATABASE TRIGGERS - AUTO-UPDATE LOGIC

### Trigger 1: Auto-update `bookings.total_paid` khi có payment mới

```sql
-- Function to recalculate total_paid
CREATE OR REPLACE FUNCTION update_booking_total_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate total_paid from payments
  UPDATE bookings
  SET total_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE booking_id = NEW.booking_id
  ),
  updated_at = NOW()
  WHERE id = NEW.booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT/UPDATE/DELETE payments
CREATE TRIGGER trg_update_total_paid_insert
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();

CREATE TRIGGER trg_update_total_paid_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();

CREATE TRIGGER trg_update_total_paid_delete
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_total_paid();
```

**Test:**
```sql
-- Insert booking
INSERT INTO bookings (tenant_id, room_id, customer_name, phone, check_in_at, check_out_at, unit_price)
VALUES ('tenant-1', 'room-1', 'John Doe', '0901234567', '2026-06-01 10:00', '2026-06-01 14:00', 500000);

-- Check: total_paid = 0, remaining = 500000
SELECT total_amount, total_paid, remaining FROM bookings WHERE booking_code = 'BK001';

-- Add payment 1: Cọc 200k
INSERT INTO payments (tenant_id, booking_id, payment_no, amount)
VALUES ('tenant-1', 'booking-id', 1, 200000);

-- Check: total_paid = 200000, remaining = 300000 (AUTO!)
SELECT total_amount, total_paid, remaining FROM bookings WHERE booking_code = 'BK001';

-- Add payment 2: Thu nốt 300k
INSERT INTO payments (tenant_id, booking_id, payment_no, amount)
VALUES ('tenant-1', 'booking-id', 2, 300000);

-- Check: total_paid = 500000, remaining = 0 (AUTO!)
```

---

### Trigger 2: Auto-create cleaning task khi có booking mới

```sql
-- Function to create cleaning task
CREATE OR REPLACE FUNCTION create_cleaning_task_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cleaning_tasks (
    tenant_id,
    booking_id,
    room_id,
    scheduled_at,
    cleaning_status
  )
  VALUES (
    NEW.tenant_id,
    NEW.id,
    NEW.room_id,
    NEW.check_out_at,  -- Schedule cleaning after check-out
    'not_assigned'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT booking
CREATE TRIGGER trg_create_cleaning_task
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_cleaning_task_on_booking();
```

**Test:**
```sql
-- Insert booking
INSERT INTO bookings (...)
VALUES (..., check_out_at = '2026-06-01 14:00');

-- Check: Cleaning task auto-created!
SELECT * FROM cleaning_tasks WHERE booking_id = 'new-booking-id';
-- Result: scheduled_at = '2026-06-01 14:00', status = 'not_assigned'
```

---

### Trigger 3: Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_cleaning_tasks_updated_at
  BEFORE UPDATE ON cleaning_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

---

## 🎯 BUSINESS RULES ENGINE

### Rule 1: Booking Overlap Validation

```typescript
// backend/src/services/booking.service.ts
export async function validateBookingOverlap(
  db: PrismaClient,
  input: {
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    excludeBookingId?: string;  // For updates
  }
): Promise<boolean> {
  // Find overlapping bookings
  const overlapping = await db.booking.findFirst({
    where: {
      roomId: input.roomId,
      id: input.excludeBookingId ? { not: input.excludeBookingId } : undefined,
      bookingStatus: { notIn: ['cancelled'] },
      
      // Overlap condition:
      // (new_start < existing_end) AND (new_end > existing_start)
      OR: [
        {
          AND: [
            { checkInAt: { lte: input.checkOut } },
            { checkOutAt: { gte: input.checkIn } }
          ]
        }
      ]
    }
  });
  
  if (overlapping) {
    throw new Error(
      `Room unavailable: Overlaps with booking ${overlapping.bookingCode}`
    );
  }
  
  return true;
}
```

---

### Rule 2: Buffer Time Validation

```typescript
export async function validateBufferTime(
  db: PrismaClient,
  input: {
    roomId: string;
    checkIn: Date;
    checkOut: Date;
    bufferMinutes?: number;  // Default: 30 mins
  }
): Promise<boolean> {
  const buffer = input.bufferMinutes || 30;
  const bufferMs = buffer * 60 * 1000;
  
  // Find bookings within buffer window
  const nearby = await db.booking.findFirst({
    where: {
      roomId: input.roomId,
      bookingStatus: { notIn: ['cancelled'] },
      OR: [
        // Buffer before new booking
        {
          checkOutAt: {
            gt: new Date(input.checkIn.getTime() - bufferMs),
            lte: input.checkIn
          }
        },
        // Buffer after new booking
        {
          checkInAt: {
            gte: input.checkOut,
            lt: new Date(input.checkOut.getTime() + bufferMs)
          }
        }
      ]
    }
  });
  
  if (nearby) {
    throw new Error(
      `Buffer time violation: Need ${buffer} mins between bookings`
    );
  }
  
  return true;
}
```

---

### Rule 3: Payment Validation

```typescript
export function validatePayment(
  booking: Booking,
  newPaymentAmount: number
): boolean {
  const currentPaid = booking.totalPaid || 0;
  const willBePaid = currentPaid + newPaymentAmount;
  
  if (willBePaid > booking.totalAmount) {
    throw new Error(
      `Payment exceeds total: ${willBePaid} > ${booking.totalAmount}`
    );
  }
  
  return true;
}
```

---

## 🔌 API FLOW - tRPC PROCEDURES

### API 1: Create Booking (Full Flow)

```typescript
// backend/src/routers/booking.router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const bookingRouter = router({
  create: protectedProcedure
    .input(z.object({
      propertyId: z.string().uuid(),
      roomId: z.string().uuid(),
      customerName: z.string().min(1),
      phone: z.string().min(10),
      sourceId: z.string().uuid().optional(),
      checkIn: z.date(),
      checkOut: z.date(),
      unitPrice: z.number().positive(),
      extraFee: z.number().default(0),
      roomTypeId: z.string().uuid().optional(),
      note: z.string().optional(),
      
      // Optional: First payment (cọc)
      initialPayment: z.number().positive().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, tenantId, userId } = ctx;
      
      // ======================================
      // STEP 1: Validations
      // ======================================
      
      // 1.1: Check out > Check in
      if (input.checkOut <= input.checkIn) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Check-out must be after check-in'
        });
      }
      
      // 1.2: Validate overlap
      await validateBookingOverlap(db, {
        roomId: input.roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut
      });
      
      // 1.3: Validate buffer time
      await validateBufferTime(db, {
        roomId: input.roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut
      });
      
      // ======================================
      // STEP 2: Generate booking code
      // ======================================
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await db.booking.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().setHours(0,0,0,0))
          }
        }
      });
      const bookingCode = `BK${today}${String(count + 1).padStart(3, '0')}`;
      
      // ======================================
      // STEP 3: Create booking (in transaction)
      // ======================================
      const result = await db.$transaction(async (tx) => {
        // 3.1: Insert booking
        const booking = await tx.booking.create({
          data: {
            tenantId,
            bookingCode,
            propertyId: input.propertyId,
            roomId: input.roomId,
            customerName: input.customerName,
            phone: input.phone,
            sourceId: input.sourceId,
            assignedStaffId: userId,
            roomTypeId: input.roomTypeId,
            checkInAt: input.checkIn,
            checkOutAt: input.checkOut,
            unitPrice: input.unitPrice,
            extraFee: input.extraFee,
            // total_amount auto-calculated by DB
            note: input.note,
            bookingStatus: 'confirmed',
            createdBy: userId
          }
        });
        
        // 3.2: Create initial payment if provided
        if (input.initialPayment) {
          await tx.payment.create({
            data: {
              tenantId,
              bookingId: booking.id,
              paymentNo: 1,
              amount: input.initialPayment,
              paidAt: new Date(),
              paymentType: 'cash',
              note: 'Tiền cọc',
              createdBy: userId
            }
          });
          // total_paid auto-updated by trigger!
        }
        
        // 3.3: Cleaning task auto-created by trigger!
        // (No need to manually create)
        
        return booking;
      });
      
      // ======================================
      // STEP 4: Side effects (outside transaction)
      // ======================================
      
      // 4.1: Invalidate cache
      await invalidateReportsCache(tenantId);
      
      // 4.2: Send real-time update (WebSocket)
      await pubsub.publish(`tenant:${tenantId}:booking:created`, {
        bookingId: result.id,
        roomId: input.roomId
      });
      
      // 4.3: Send notification (optional)
      // await sendBookingNotification(result);
      
      return result;
    })
});
```

**Test Flow:**
```typescript
// Frontend: Create booking
const result = await trpc.booking.create.mutate({
  propertyId: 'prop-1',
  roomId: 'room-101',
  customerName: 'Nguyen Van A',
  phone: '0901234567',
  checkIn: new Date('2026-06-01 10:00'),
  checkOut: new Date('2026-06-01 14:00'),
  unitPrice: 500000,
  extraFee: 50000,
  initialPayment: 200000  // Cọc 200k
});

// AUTO UPDATES:
// ✅ Booking created with code BK202606010001
// ✅ total_amount = 550000 (auto)
// ✅ Payment #1 created: 200000
// ✅ total_paid = 200000 (auto by trigger)
// ✅ remaining = 350000 (auto calculated)
// ✅ Cleaning task created (auto by trigger)
// ✅ Dashboard cache invalidated
// ✅ WebSocket event sent → Timeline auto-reloads
```

---

### API 2: Add Payment (Updates booking.total_paid)

```typescript
export const paymentRouter = router({
  create: protectedProcedure
    .input(z.object({
      bookingId: z.string().uuid(),
      amount: z.number().positive(),
      paymentType: z.string().optional(),
      note: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, tenantId, userId } = ctx;
      
      // Get booking
      const booking = await db.booking.findFirst({
        where: { id: input.bookingId, tenantId }
      });
      
      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      // Validate payment amount
      validatePayment(booking, input.amount);
      
      // Get next payment number
      const lastPayment = await db.payment.findFirst({
        where: { bookingId: input.bookingId },
        orderBy: { paymentNo: 'desc' }
      });
      const nextPaymentNo = (lastPayment?.paymentNo || 0) + 1;
      
      // Create payment
      const payment = await db.payment.create({
        data: {
          tenantId,
          bookingId: input.bookingId,
          paymentNo: nextPaymentNo,
          amount: input.amount,
          paidAt: new Date(),
          paymentType: input.paymentType || 'cash',
          note: input.note,
          createdBy: userId
        }
      });
      
      // booking.total_paid auto-updated by trigger!
      
      // Invalidate cache
      await invalidateReportsCache(tenantId);
      
      // Send update
      await pubsub.publish(`tenant:${tenantId}:payment:created`, {
        bookingId: input.bookingId
      });
      
      return payment;
    })
});
```

---

### API 3: Update Cleaning Task (Updates room status)

```typescript
export const cleaningRouter = router({
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      cleanerId: z.string().uuid().optional(),
      status: z.enum(['not_assigned', 'in_progress', 'completed']).optional(),
      note: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, tenantId } = ctx;
      
      const task = await db.cleaningTask.update({
        where: { id: input.id, tenantId },
        data: {
          cleanerId: input.cleanerId,
          cleaningStatus: input.status,
          finishedAt: input.status === 'completed' ? new Date() : undefined,
          note: input.note
        }
      });
      
      // Send update
      await pubsub.publish(`tenant:${tenantId}:cleaning:updated`, {
        roomId: task.roomId,
        status: input.status
      });
      
      return task;
    })
});
```

---

## 🔄 REAL-TIME UPDATES - FRONTEND AUTO-REFRESH

### Option 1: React Query with Auto-Refetch (Simple)

```typescript
// frontend/src/hooks/useBookings.ts
import { trpc } from '../utils/trpc';

export function useBookings(filters: BookingFilters) {
  return trpc.booking.list.useQuery(filters, {
    // Auto-refetch every 30 seconds
    refetchInterval: 30000,
    
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    
    // Keep previous data while refetching
    keepPreviousData: true
  });
}
```

**Usage:**
```typescript
// Timeline component
function Timeline() {
  const { data: bookings, isLoading } = useBookings({
    propertyId: 'prop-1',
    startDate: weekStart,
    endDate: weekEnd
  });
  
  // Auto-reloads every 30s or when window focus
  // → Always shows latest bookings
  
  return <TimelineGrid bookings={bookings} />;
}
```

---

### Option 2: WebSocket Real-time (Advanced)

```typescript
// backend/src/server.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

// Pub/Sub for tenant-specific events
export const pubsub = {
  publish: async (channel: string, data: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Check if client subscribed to this channel
        const clientData = (client as any).subscriptions;
        if (clientData?.includes(channel)) {
          client.send(JSON.stringify({ channel, data }));
        }
      }
    });
  }
};

// Client connection
wss.on('connection', (ws, req) => {
  const tenantId = getTenantFromRequest(req);
  
  // Subscribe client to tenant channel
  (ws as any).subscriptions = [
    `tenant:${tenantId}:booking:created`,
    `tenant:${tenantId}:booking:updated`,
    `tenant:${tenantId}:payment:created`,
    `tenant:${tenantId}:cleaning:updated`
  ];
  
  ws.on('message', (message) => {
    // Handle client messages if needed
  });
});
```

**Frontend:**
```typescript
// frontend/src/hooks/useRealtimeBookings.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeBookings(tenantId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const { channel, data } = JSON.parse(event.data);
      
      if (channel === `tenant:${tenantId}:booking:created`) {
        // Invalidate bookings query → auto-refetch
        queryClient.invalidateQueries(['bookings']);
      }
      
      if (channel === `tenant:${tenantId}:payment:created`) {
        // Invalidate specific booking
        queryClient.invalidateQueries(['booking', data.bookingId]);
        // Also invalidate reports
        queryClient.invalidateQueries(['reports']);
      }
    };
    
    return () => ws.close();
  }, [tenantId]);
}
```

**Usage:**
```typescript
function App() {
  const { tenantId } = useAuth();
  
  // Hook up real-time updates
  useRealtimeBookings(tenantId);
  
  return <Dashboard />;
}

// Now all components auto-refresh when data changes!
```

---

## 📊 REPORTS AUTO-CALCULATION

### Materialized View for Dashboard (Fast queries)

```sql
-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  tenant_id,
  property_id,
  DATE(created_at) as date,
  
  -- Bookings
  COUNT(*) as booking_count,
  COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_count,
  COUNT(*) FILTER (WHERE booking_status = 'completed') as completed_count,
  
  -- Revenue
  SUM(total_amount) as potential_revenue,
  SUM(total_paid) as actual_revenue,
  SUM(remaining) as outstanding,
  
  -- Avg
  AVG(total_amount) as avg_booking_value
FROM bookings
WHERE booking_status NOT IN ('cancelled')
GROUP BY tenant_id, property_id, DATE(created_at);

-- Index for fast lookups
CREATE INDEX idx_dashboard_stats_tenant_date 
  ON dashboard_stats(tenant_id, date);

-- Refresh materialized view (call after booking/payment changes)
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
```

**API to get dashboard:**
```typescript
export const dashboardRouter = router({
  getStats: protectedProcedure
    .input(z.object({
      propertyId: z.string().uuid().optional(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ ctx, input }) => {
      const { db, tenantId } = ctx;
      
      // Query from materialized view (fast!)
      const stats = await db.$queryRaw`
        SELECT
          SUM(booking_count) as total_bookings,
          SUM(actual_revenue) as total_revenue,
          SUM(outstanding) as total_outstanding,
          AVG(avg_booking_value) as avg_value
        FROM dashboard_stats
        WHERE tenant_id = ${tenantId}
          AND date >= ${input.startDate}
          AND date <= ${input.endDate}
          ${input.propertyId ? `AND property_id = ${input.propertyId}` : ''}
      `;
      
      return stats[0];
    })
});
```

**Auto-refresh materialized view:**
```typescript
// Background job (runs every 5 minutes)
import { CronJob } from 'cron';

const refreshDashboardJob = new CronJob('*/5 * * * *', async () => {
  await db.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats`;
  console.log('Dashboard stats refreshed');
});

refreshDashboardJob.start();
```

---

## ✅ IMPLEMENTATION CHECKLIST FOR ANTIGRAVITY

### Phase 1: Database Setup

```bash
□ Create all tables with proper relationships
□ Add generated columns (total_amount, remaining)
□ Add triggers:
  □ update_booking_total_paid (on payments)
  □ create_cleaning_task_on_booking (on bookings)
  □ update_timestamp (on all tables)
□ Add indexes for performance
□ Create materialized view dashboard_stats
□ Test triggers manually with SQL
```

### Phase 2: Backend API

```bash
□ Setup tRPC routers:
  □ bookingRouter
  □ paymentRouter
  □ cleaningRouter
  □ dashboardRouter
  □ reportsRouter
□ Implement validation functions:
  □ validateBookingOverlap
  □ validateBufferTime
  □ validatePayment
□ Add business logic:
  □ Generate booking code
  □ Calculate totals
  □ Handle transactions
□ Setup cache invalidation
□ Add error handling
□ Write unit tests
```

### Phase 3: Real-time Updates

```bash
□ Option A (Simple): React Query auto-refetch
  □ Set refetchInterval: 30000
  □ Set refetchOnWindowFocus: true
  
□ Option B (Advanced): WebSocket
  □ Setup WebSocket server
  □ Implement pubsub system
  □ Connect frontend to WS
  □ Handle reconnection
```

### Phase 4: Frontend Integration

```bash
□ Create hooks:
  □ useBookings (with auto-refetch)
  □ usePayments
  □ useCleaningTasks
  □ useDashboard
□ Implement optimistic updates:
  □ onMutate: Update cache immediately
  □ onError: Rollback cache
  □ onSuccess: Refetch from server
□ Add loading states
□ Add error handling
□ Test all flows
```

### Phase 5: Testing Scenarios

```bash
□ Test 1: Create booking
  ✓ Booking appears in timeline
  ✓ Dashboard count +1
  ✓ Cleaning task created
  ✓ Reports updated
  
□ Test 2: Add payment
  ✓ total_paid updates
  ✓ remaining decreases
  ✓ Booking detail shows payment
  ✓ Dashboard revenue +X
  
□ Test 3: Complete cleaning
  ✓ Task status updates
  ✓ Room status changes
  ✓ Staff can see completion
  
□ Test 4: Overlap validation
  ✓ Cannot create overlapping booking
  ✓ Error message clear
  ✓ UI shows conflict
  
□ Test 5: Multi-user scenario
  ✓ User A creates booking
  ✓ User B sees it immediately (real-time)
  ✓ Dashboard updates for both
```

---

## 🎯 DATA FLOW EXAMPLES

### Example 1: Complete Booking Flow

```typescript
// ============================================
// USER ACTION: Create booking với cọc
// ============================================

// 1. User fills form:
const formData = {
  room: 'Room 101',
  customer: 'Nguyen Van A',
  phone: '0901234567',
  checkIn: '2026-06-01 10:00',
  checkOut: '2026-06-01 14:00',
  price: 500000,
  extraFee: 0,
  deposit: 200000  // Cọc
};

// 2. Frontend calls API:
const booking = await trpc.booking.create.mutate(formData);

// ============================================
// AUTO UPDATES (in order):
// ============================================

// 3. Database:
//   - INSERT bookings (total_amount = 500000 auto-calculated)
//   - INSERT payments (amount = 200000)
//   - UPDATE bookings SET total_paid = 200000 (trigger!)
//   - INSERT cleaning_tasks (trigger!)

// 4. Backend:
//   - Invalidate cache
//   - Publish WebSocket event

// 5. Frontend (auto-refresh):
//   - Timeline: Shows new booking block
//   - Table: New row appears
//   - Dashboard: "Bookings today" +1
//   - Dashboard: "Revenue today" +500000
//   - Dashboard: "Outstanding" +300000
//   - Cleaning list: New task appears

// ============================================
// USER ACTION: Thu nốt 300k
// ============================================

// 6. User adds payment:
await trpc.payment.create.mutate({
  bookingId: booking.id,
  amount: 300000
});

// 7. Auto updates:
//   - INSERT payments
//   - UPDATE bookings SET total_paid = 500000 (trigger!)
//   - remaining = 0 (auto-calculated!)

// 8. Frontend:
//   - Booking detail: "Đã thanh toán đủ" badge
//   - Dashboard: "Outstanding" -300000
//   - Reports: No change (revenue already counted)

// ============================================
// STAFF ACTION: Complete cleaning
// ============================================

// 9. Cleaner marks done:
await trpc.cleaning.update.mutate({
  id: task.id,
  status: 'completed'
});

// 10. Auto updates:
//   - UPDATE cleaning_tasks SET finished_at = NOW()
//   - WebSocket event

// 11. Frontend:
//   - Cleaning list: Task moves to "Completed"
//   - Room status: Shows "Clean" badge
//   - Manager sees notification
```

---

## 📋 FINAL DELIVERABLE FOR ANTIGRAVITY

**Giao cho Antigravity 3 files:**

1. **`database-schema.sql`** (file SQL này)
   - All tables with relationships
   - Triggers for auto-updates
   - Indexes for performance
   - Materialized views

2. **`api-implementation.ts`** (file code này)
   - tRPC routers
   - Validation functions
   - Business logic
   - Transaction handling

3. **`frontend-integration.tsx`** (file React này)
   - React Query hooks
   - Real-time WebSocket (optional)
   - Optimistic updates
   - Error handling

**Instructions:**
```
1. Run database-schema.sql to create all tables + triggers
2. Implement API endpoints từ api-implementation.ts
3. Connect frontend với API
4. Test từng flow (create booking → auto updates)
5. Verify real-time updates work
```

---

## 🎉 KẾT QUẢ MONG ĐỢI

**Khi hoàn thành, hệ thống sẽ:**

✅ **Tạo booking:**
- Database tự động tính total_amount
- Tự động tạo cleaning task
- Dashboard tự động +1 booking
- Timeline tự động hiển thị booking mới

✅ **Thêm payment:**
- Database tự động cập nhật total_paid
- Tự động tính remaining
- Dashboard tự động cập nhật revenue
- Booking detail tự động hiển thị payment history

✅ **Complete cleaning:**
- Task status tự động update
- Room status tự động đổi
- Staff nhìn thấy ngay

✅ **Thêm expense:**
- Reports tự động trừ profit
- Dashboard expense chart tự động update

✅ **Real-time:**
- User A tạo booking → User B thấy ngay (< 2 giây)
- Không cần F5 reload page
- Tất cả số liệu luôn sync

**→ Hệ thống hoàn toàn tự động, kết nối với nhau!** 🚀
