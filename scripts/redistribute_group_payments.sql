-- Redistribute group payments that landed only on the primary bill
-- Source: 9 groups identified with paid_amount > grand_total on primary
START TRANSACTION;

-- ── GRP-1778826337207 SUDHAKARAN (primary 6, siblings 7, 8) ──
UPDATE payments SET amount = 3339.00, notes = CONCAT(notes,' | Split: GRP-1778826337207') WHERE billing_id = 6 AND amount = 7200.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (7, 3087.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 6 (GRP-1778826337207)',NOW(),NOW()),
       (8,  774.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 6 (GRP-1778826337207)',NOW(),NOW());
UPDATE billings SET paid_amount = 3339.00, balance_due = 0.00,    payment_status = 'paid'    WHERE id = 6;
UPDATE billings SET paid_amount = 3087.00, balance_due = 0.00,    payment_status = 'paid'    WHERE id = 7;
UPDATE billings SET paid_amount =  774.00, balance_due = 2313.00, payment_status = 'partial' WHERE id = 8;

-- ── GRP-1778826783906 TAMILSELVI (primary 10, sibling 11) ──
UPDATE payments SET amount = 3591.00, notes = CONCAT(notes,' | Split: GRP-1778826783906') WHERE billing_id = 10 AND amount = 6300.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (11, 2709.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 10 (GRP-1778826783906)',NOW(),NOW());
UPDATE billings SET paid_amount = 3591.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 10;
UPDATE billings SET paid_amount = 2709.00, balance_due = 378.00, payment_status = 'partial' WHERE id = 11;

-- ── GRP-1778827149847 VIJAICHANDRAN (primary 14, sibling 15) ──
UPDATE payments SET amount = 3087.00, notes = CONCAT(notes,' | Split: GRP-1778827149847') WHERE billing_id = 14 AND amount = 5656.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (15, 2569.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 14 (GRP-1778827149847)',NOW(),NOW());
UPDATE billings SET paid_amount = 3087.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 14;
UPDATE billings SET paid_amount = 2569.00, balance_due = 518.00, payment_status = 'partial' WHERE id = 15;

-- ── GRP-1778827951416 HARISH (primary 19, siblings 20, 21) ──
UPDATE payments SET amount = 3087.00, notes = CONCAT(notes,' | Split: GRP-1778827951416') WHERE billing_id = 19 AND amount = 8820.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (20, 3087.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 19 (GRP-1778827951416)',NOW(),NOW()),
       (21, 2646.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 19 (GRP-1778827951416)',NOW(),NOW());
UPDATE billings SET paid_amount = 3087.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 19;
UPDATE billings SET paid_amount = 3087.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 20;
UPDATE billings SET paid_amount = 2646.00, balance_due = 441.00, payment_status = 'partial' WHERE id = 21;

-- ── GRP-1778829345304 SANTHOSHKUMAR (primary 24, sibling 25) ──
UPDATE payments SET amount = 3822.00, notes = CONCAT(notes,' | Split: GRP-1778829345304') WHERE billing_id = 24 AND amount = 7201.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (25, 3379.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 24 (GRP-1778829345304)',NOW(),NOW());
UPDATE billings SET paid_amount = 3822.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 24;
UPDATE billings SET paid_amount = 3379.00, balance_due = 443.00, payment_status = 'partial' WHERE id = 25;

-- ── GRP-1778829453389 SHOGANA PARKAVI (primary 26, sibling 27) — 413 overpay remains on primary ──
UPDATE payments SET amount = 3500.00, notes = CONCAT(notes,' | Split: GRP-1778829453389 (413 overpay remains)') WHERE billing_id = 26 AND amount = 7091.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (27, 3591.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 26 (GRP-1778829453389)',NOW(),NOW());
UPDATE billings SET paid_amount = 3500.00, balance_due = -413.00, payment_status = 'paid' WHERE id = 26;
UPDATE billings SET paid_amount = 3591.00, balance_due = 0.00,    payment_status = 'paid' WHERE id = 27;

-- ── GRP-1778831228952 NITHYS (primary 33, sibling 34) — 6 overpay remains on primary ──
UPDATE payments SET amount = 3828.00, notes = CONCAT(notes,' | Split: GRP-1778831228952 (6 overpay remains)') WHERE billing_id = 33 AND amount = 7650.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (34, 3822.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 33 (GRP-1778831228952)',NOW(),NOW());
UPDATE billings SET paid_amount = 3828.00, balance_due = -6.00, payment_status = 'paid' WHERE id = 33;
UPDATE billings SET paid_amount = 3822.00, balance_due = 0.00,  payment_status = 'paid' WHERE id = 34;

-- ── GRP-1778831500582 SIVAKOLUNDHU (primary 38, sibling 39) ──
UPDATE payments SET amount = 3339.00, notes = CONCAT(notes,' | Split: GRP-1778831500582') WHERE billing_id = 38 AND amount = 6500.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (39, 3161.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 38 (GRP-1778831500582)',NOW(),NOW());
UPDATE billings SET paid_amount = 3339.00, balance_due = 0.00,   payment_status = 'paid'    WHERE id = 38;
UPDATE billings SET paid_amount = 3161.00, balance_due = 178.00, payment_status = 'partial' WHERE id = 39;

-- ── GRP-1778831624353 MANIKANDAN (primary 41, sibling 42) — 26 overpay remains on primary ──
UPDATE payments SET amount = 3113.00, notes = CONCAT(notes,' | Split: GRP-1778831624353 (26 overpay remains)') WHERE billing_id = 41 AND amount = 6200.00;
INSERT INTO payments (billing_id,amount,payment_method,payment_type,payment_date,notes,created_at,updated_at)
VALUES (42, 3087.00, 'cash','payment','2026-05-01 12:00:00','Group payment split from bill 41 (GRP-1778831624353)',NOW(),NOW());
UPDATE billings SET paid_amount = 3113.00, balance_due = -26.00, payment_status = 'paid' WHERE id = 41;
UPDATE billings SET paid_amount = 3087.00, balance_due = 0.00,   payment_status = 'paid' WHERE id = 42;

COMMIT;
