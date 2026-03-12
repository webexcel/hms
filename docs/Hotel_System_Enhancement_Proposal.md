# Hotel Udhayam International
# System Enhancement Proposal

---

## Executive Summary

This proposal outlines a two-phase digital transformation project to:
1. **Phase 1:** Digitize management reports (A, B, J formats) with WhatsApp integration
2. **Phase 2:** Implement revenue leakage prevention controls

**Expected Benefits:**
- Eliminate manual paperwork for daily reports
- Real-time reporting to management via WhatsApp
- Prevent unauthorized transactions and revenue leakage
- Complete audit trail of all operations

---

## PHASE 1: Digital Reports & WhatsApp Integration

### 1.1 Problem Statement

Currently, the hotel uses paper-based formats for daily reporting:
- **Format-A:** Shift Cashier Report (handwritten)
- **Format-B:** Daily Accounts/Ledger (handwritten)
- **Format-J:** Restaurant Retail Sales (handwritten)

**Issues:**
- Time-consuming manual entry
- Prone to errors and manipulation
- Delayed reporting to management
- No digital records for audit

### 1.2 Proposed Solution

| Feature | Description |
|---------|-------------|
| **Digital Format-A** | Auto-generated shift cashier report with guest payments |
| **Digital Format-B** | Daily accounts ledger with receipts & expenses |
| **Digital Format-J** | Restaurant retail sales report with KOT/Bill tracking |
| **WhatsApp Integration** | One-click share reports to management |
| **Complimentary Meal Tracking** | Capture at check-in, auto-notify restaurant |

### 1.3 New Features

#### A. Complimentary Meals at Check-in

When a guest checks in with complimentary breakfast/dinner:

```
+------------------------------------------+
|   Check-in: Room 205                     |
+------------------------------------------+
| Guest: John Davidson                     |
| Check-in: 05-02-2026                     |
| Check-out: 07-02-2026                    |
|                                          |
| Complimentary Meals:                     |
| [x] Breakfast - 2 pax                    |
| [x] Dinner - 2 pax                       |
+------------------------------------------+
```

**Auto WhatsApp to Restaurant:**
```
COMPLIMENTARY MEAL ALERT

Room: 205
Guest: John Davidson
Dates: 05-02-2026 to 07-02-2026

Complimentary:
- Breakfast: 2 pax x 2 nights = 4 servings
- Dinner: 2 pax x 2 nights = 4 servings
```

**Benefit:** Restaurant always knows complimentary count in advance.

---

#### B. Daily Expenses Entry

New page for recording daily expenses:

```
+------------------------------------------+
|   Daily Expenses                         |
+------------------------------------------+
| Category: [Groceries ▼]                  |
| Description: Vegetables                  |
| Amount: Rs 2,500                         |
| [Add Expense]                            |
|                                          |
| Today's Expenses:                        |
| 1. Vegetables - Rs 2,500                 |
| 2. Staff lunch - Rs 1,200                |
| 3. Electricity - Rs 5,000                |
| ---------------------------------        |
| Total: Rs 8,700                          |
+------------------------------------------+
```

**Benefit:** All expenses recorded digitally, feeds into B-Format report.

---

#### C. Daily Receipts Entry

New page for recording daily receipts:

```
+------------------------------------------+
|   Daily Receipts                         |
+------------------------------------------+
| Category: [From F/Office ▼]              |
| Description: Cash received               |
| Amount: Rs 50,000                        |
| [Add Receipt]                            |
|                                          |
| Today's Receipts:                        |
| 1. From F/Office - Rs 50,000             |
| 2. Room Collections - Rs 85,500          |
| 3. Restaurant Sales - Rs 15,500          |
| ---------------------------------        |
| Total: Rs 1,51,000                       |
+------------------------------------------+
```

**Benefit:** All receipts recorded digitally, feeds into B-Format report.

---

#### D. Restaurant Retail Sales

Enhanced restaurant page with retail sales tracking:

```
+------------------------------------------+
|   Restaurant - Retail Sales              |
+------------------------------------------+
| KOT No: K-001                            |
| Bill No: B-001                           |
| Amount: Rs 850                           |
| Room/Cash: [Room 101 ▼]                  |
| [Add Sale]                               |
|                                          |
| Today's Sales:                           |
| K-001 | B-001 | Rs 850  | Room 101      |
| K-002 | B-002 | Rs 450  | CASH          |
| K-003 | B-003 | Rs 1200 | Room 205      |
| ---------------------------------        |
| Total: Rs 2,500                          |
+------------------------------------------+
```

**Benefit:** All sales recorded digitally, feeds into J-Format report.

---

#### E. Management Reports Page

Single page with all three report formats:

```
+------------------------------------------+
|   Management Reports                     |
+------------------------------------------+
| [Format-A] [Format-B] [Format-J]         |
|                                          |
| Date: [05-02-2026]                       |
| Shift: [Morning ▼]                       |
|                                          |
| [Generate Report]                        |
|                                          |
| +------------------------------------+   |
| |      FORMAT-A PREVIEW              |   |
| |   (Exact paper format layout)      |   |
| +------------------------------------+   |
|                                          |
| [Print] [Download PDF] [Share WhatsApp]  |
+------------------------------------------+
```

---

#### F. WhatsApp Sharing

One-click share to pre-configured management numbers:

```
+------------------------------------------+
|   Share via WhatsApp                     |
+------------------------------------------+
| Report: Format-A (05-02-2026)            |
|                                          |
| Send to:                                 |
| [x] GM - 9876543210                      |
| [x] Finance Manager - 9876543211         |
| [ ] HR - 9876543212                      |
|                                          |
| [Download & Share]                       |
+------------------------------------------+
```

**How it works:**
1. Report converted to image
2. Image downloaded to phone
3. WhatsApp opens with pre-filled message
4. User sends to selected contacts

---

#### G. Settings - WhatsApp Numbers & Categories

```
+------------------------------------------+
|   Settings                               |
+------------------------------------------+
| WHATSAPP NUMBERS                         |
| GM: [9876543210]                         |
| Finance Manager: [9876543211]            |
| HR: [9876543212]                         |
| Restaurant: [9876543213]                 |
|                                          |
| EXPENSE CATEGORIES                       |
| [Groceries] [Utilities] [Staff Wages]    |
| [Maintenance] [+ Add New]                |
|                                          |
| RECEIPT CATEGORIES                       |
| [From F/Office] [Room Collections]       |
| [Restaurant Sales] [+ Add New]           |
+------------------------------------------+
```

---

### 1.4 Report Formats (Matching Paper)

#### FORMAT-A (Shift Cashier Report)

```
+------------------------------------------------------------------+
| HOTEL UDHAYAM INTERNATIONAL                                       |
| FORMAT-A                          DATE: 05-02-2026                |
| DUTY CASHIER: John Doe            TIME: 6AM - 2PM                 |
+------------------------------------------------------------------+
|     |      |       | Check| Check|        PAYMENTS DETAILS        |
| S.No| Room | Guest | In   | In   |Adv |Rcpt|Tariff|RST |Bed|Other|
|     | No.  | Name  | Time | Date |Amt |No. |      |Bill|   |     |
+------------------------------------------------------------------+
|  1  | 101  |Sharma | 10:30| 05/02|5000|R001| 2500 |850 | 0 |  0  |
|  2  | 205  |Kumar  | 11:00| 05/02|3000|R002| 2000 |450 |500|  0  |
|  3  | 301  |Singh  | 14:00| 05/02|8000|R003| 4500 |1200| 0 |200  |
+------------------------------------------------------------------+
| OB + ADV + RST + CAB + M.HALL + BALANCE = TOTAL                   |
| TOTAL - HR - SBI - GPAY - CC - RF = CB                            |
+------------------------------------------------------------------+
| CHECKED BY         | CHECKED BY      | PREPARED BY               |
| AM SUPERVISOR      | HR              | DUTY                      |
+------------------------------------------------------------------+
```

#### FORMAT-B (Daily Accounts)

```
+------------------------------------------------------------------+
| HOTEL UDHAYAM INTERNATIONAL                                       |
| DAILY ACCOUNTS ADMINISTRATIONS    DATE: 05-02-2026                |
| B-FORMAT                          TIME: 7AM to 10PM               |
| Duty H.R. Co-ordinator: _______________                           |
+------------------------------------------------------------------+
| Sl.No |     Particulars              | Receipts  | Payments      |
+------------------------------------------------------------------+
|       | Opening Balance Rs. 50,000   |           |               |
|   1   | Received from F/Office       | 50,000    |               |
|   2   | Room Collections             | 85,500    |               |
|   3   | Restaurant Sales             | 15,500    |               |
|   4   | Vegetables (Groceries)       |           | 2,500         |
|   5   | Staff lunch                  |           | 1,200         |
|   6   | Electricity bill             |           | 5,000         |
|   7   | SBI Deposit                  |           | 50,000        |
+------------------------------------------------------------------+
|       | TOTALS                       | 1,51,000  | 58,700        |
|       | C B Rs = 1,42,300            |           |               |
+------------------------------------------------------------------+
| Finance & Admin Manager | O.M        | H.R. Signature            |
+------------------------------------------------------------------+
```

#### FORMAT-J (Restaurant Retail Sales)

```
+------------------------------------------------------------------+
| HOTEL UDHAYAM INTERNATIONAL                                       |
| FORMAT-J                          TIRUCHENDUR                     |
| BELL RESTAURANT                   DATE: 05-02-2026                |
| RETAIL SALES                      TIME: 7:00AM TO 10:30PM         |
+------------------------------------------------------------------+
|     |  KOT | BILL |       | AC &  |     | KOT | BILL |      |AC &|
| S.NO|  NO  |  NO  | AMOUNT| ROOM  |S.NO | NO  |  NO  |AMOUNT|ROOM|
+------------------------------------------------------------------+
|  1  | K001 | B001 |   850 |  101  |  11 | K011| B011 |  650 | 301|
|  2  | K002 | B002 |   450 |  CASH |  12 | K012| B012 |  980 | 205|
|  3  | K003 | B003 |  1200 |  205  |  13 | K013| B013 |  550 |CASH|
|  4  | K004 | B004 |   650 |  301  |  14 | K014| B014 | 1100 | 101|
|  5  | K005 | B005 |   980 |  CASH |  15 | K015| B015 |  780 | 205|
+------------------------------------------------------------------+
| RST FORMAT:          | RST FORMAT:          | RST FORMAT:        |
| G FORMAT:            | G FORMAT:            | G FORMAT:          |
| B/F:                 |                      |                    |
+------------------------------------------------------------------+
| Complimentary: Breakfast - 10 pax | Dinner - 6 pax               |
+------------------------------------------------------------------+
| CHECKED BY          | CHECKED BY           | PREPARED BY         |
| AM SUPERVISOR       | HR                   | DUTY                |
+------------------------------------------------------------------+
```

---

### 1.5 Phase 1 Summary

| New Feature | Purpose |
|-------------|---------|
| Complimentary at Check-in | Track free meals, auto-notify restaurant |
| Expenses Page | Record daily expenses for B-Format |
| Receipts Page | Record daily receipts for B-Format |
| Restaurant Retail Sales | Record sales for J-Format |
| Management Reports Page | Generate A, B, J formats digitally |
| WhatsApp Integration | Share reports to management instantly |
| Settings Enhancement | Configure numbers & categories |

---

## PHASE 2: Revenue Leakage Prevention

### 2.1 Problem Statement

Hotels face revenue leakage through:
- **Unauthorized check-ins:** Staff allows short stays, collects cash privately
- **Pocket collection:** Payment collected but not recorded
- **Restaurant fraud:** Orders served but not billed
- **Inventory theft:** Stock used but not accounted

**Estimated Loss:** 5-15% of revenue in uncontrolled hotels

### 2.2 Proposed Solutions

#### A. Room Occupancy Detection (PIR Sensors)

**The Problem:**
Staff checks in a guest unofficially, collects Rs 2,000 cash, and pockets it.
System shows room as "Available" but guest is actually inside.

**The Solution:**
Install PIR (motion) sensors in each room.

```
System Status: AVAILABLE
PIR Sensor: MOTION DETECTED
Result: ALERT - Unauthorized occupancy!
```

**How it works:**

```
+------------------------------------------+
|   ROOM OCCUPANCY MONITOR                 |
+------------------------------------------+
| Room | System   | PIR Sensor | Status    |
|------|----------|------------|-----------|
| 101  | Occupied | Motion     | OK        |
| 102  | Available| No Motion  | OK        |
| 205  | Available| MOTION     | ALERT!    |
| 301  | Maint.   | MOTION     | ALERT!    |
+------------------------------------------+
```

**Alert sent to Management:**
```
OCCUPANCY ALERT

Room: 205
System Status: Available
PIR Sensor: Motion Detected
Time: 2:30 PM

Possible unauthorized occupancy!
```

**Hardware Cost:**
- Per room: Rs 500-700
- For 50 rooms: Rs 25,000-35,000
- One-time investment, permanent control

---

#### B. Mandatory Controls at Check-in

| Control | Purpose |
|---------|---------|
| **Guest ID Photo** | Cannot check-in without capturing ID |
| **Guest Face Photo** | Visual record of actual guest |
| **Minimum Advance** | Must collect at least 1 night payment |
| **Override with PIN** | Any exception needs manager approval |

```
+------------------------------------------+
|   Check-in Controls                      |
+------------------------------------------+
| Guest ID Photo: [Required - Capture]     |
| Guest Face: [Required - Capture]         |
|                                          |
| Room Rate: Rs 2,500/night                |
| Minimum Advance: Rs 2,500                |
| Amount Received: Rs ____                 |
|                                          |
| [ ] Waive Advance (Requires Manager PIN) |
+------------------------------------------+
```

---

#### C. Restaurant KOT Tracking

**The Problem:**
Waiter takes order, serves food, but doesn't generate bill.
Collects cash from customer and pockets it.

**The Solution:**
Every KOT must have a corresponding bill or authorized cancellation.

```
+------------------------------------------+
|   KOT TRACKING                           |
+------------------------------------------+
| KOT  | Time  | Items      | Bill | Status|
|------|-------|------------|------|-------|
| K001 | 10:30 | Biryani x2 | B001 | OK    |
| K002 | 11:00 | Meals x3   | B002 | OK    |
| K003 | 11:30 | Coffee x4  | -    | ALERT |
+------------------------------------------+
| K003 has no bill - possible leakage!     |
+------------------------------------------+
```

**Cancellation requires:**
- Reason selection
- Manager PIN approval
- Logged for audit

---

#### D. Stock vs Sales Reconciliation

**The Problem:**
20 kg chicken purchased, only 15 kg worth of dishes billed.
5 kg unaccounted = theft or unauthorized consumption.

**The Solution:**
Match stock consumed with sales.

```
+------------------------------------------+
|   STOCK AUDIT                            |
+------------------------------------------+
| Item     | Used | Sold | Variance        |
|----------|------|------|-----------------|
| Chicken  | 20kg | 18kg | -2kg ALERT      |
| Rice     | 25kg | 24kg | -1kg            |
| Oil      | 5L   | 4L   | -1L ALERT       |
+------------------------------------------+
```

---

#### E. Daily Audit Reports (Auto WhatsApp)

Every day at 10 PM, management receives:

```
HOTEL UDHAYAM DAILY SUMMARY
Date: 05-02-2026

ROOMS:
- Check-ins: 12 | Check-outs: 8
- Occupancy: 75%
- Revenue: Rs 1,25,000

RESTAURANT:
- Orders: 45 | Cancelled: 3
- Revenue: Rs 28,500

CASH FLOW:
- Opening: Rs 50,000
- Collections: Rs 1,53,500
- Expenses: Rs 28,000
- Closing: Rs 1,75,500

ALERTS (3):
1. Short stay Room 205 (4 hrs only)
2. KOT K-003 unbilled
3. Chicken variance: -2kg

Staff Activity attached.
```

---

#### F. Staff Activity Tracking

Every action logged:

```
+------------------------------------------+
|   STAFF ACTIVITY LOG                     |
+------------------------------------------+
| Time  | Staff | Action       | Details   |
|-------|-------|--------------|-----------|
| 10:30 | John  | CHECK-IN     | Room 205  |
| 10:45 | John  | DISCOUNT     | Rs 500    |
| 11:00 | Ravi  | KOT_CANCEL   | K-003     |
| 11:30 | John  | OVERRIDE     | Advance   |
+------------------------------------------+
```

**Daily Staff Report:**
- Check-ins/outs per staff
- Collections per staff
- Discounts given
- Cancellations done
- Overrides used

---

### 2.3 Phase 2 Summary

| Control | Catches |
|---------|---------|
| PIR Sensors | Unauthorized room occupancy |
| Photo Capture | Fake bookings |
| Advance Enforcement | Walk-away guests |
| KOT Tracking | Unbilled restaurant orders |
| Stock Reconciliation | Inventory theft |
| Activity Logs | Staff misbehavior |
| Daily Reports | All anomalies |

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 2-3 weeks | Reports, WhatsApp, Expenses, Receipts |
| **Phase 2A** | 2-3 weeks | Software controls, audit logs |
| **Phase 2B** | 2-4 weeks | PIR sensor installation |

---

## Investment Summary

### Phase 1: Software Only
- Development: Part of existing project
- No additional hardware cost

### Phase 2: Software + Hardware

| Item | Cost |
|------|------|
| PIR Sensors (50 rooms) | Rs 25,000 - 35,000 |
| Installation | Rs 10,000 - 15,000 |
| **Total** | **Rs 35,000 - 50,000** |

---

## Expected ROI

### Revenue Leakage Prevention

| Area | Estimated Monthly Loss | After Implementation |
|------|------------------------|----------------------|
| Unauthorized rooms | Rs 20,000 - 50,000 | Near Zero |
| Restaurant leakage | Rs 10,000 - 30,000 | Reduced 90% |
| Inventory theft | Rs 5,000 - 15,000 | Reduced 80% |
| **Total Savings** | **Rs 35,000 - 95,000/month** |

**PIR Investment recovered in:** 1-2 months

### Operational Benefits

- **Time Saved:** 2-3 hours daily on manual reports
- **Accuracy:** Elimination of calculation errors
- **Speed:** Instant reporting to management
- **Accountability:** Complete audit trail
- **Control:** Real-time alerts for anomalies

---

## Approval Required

Please review and approve:

- [ ] Phase 1: Digital Reports & WhatsApp Integration
- [ ] Phase 2A: Software Controls & Audit System
- [ ] Phase 2B: PIR Sensor Installation

---

**Prepared By:** Development Team
**Date:** 06-02-2026
**For:** Hotel Udhayam International Management
