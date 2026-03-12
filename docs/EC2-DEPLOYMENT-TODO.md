# EC2 Deployment & OTA Integration - TODO Checklist

## Pre-Deployment (Local - Do First)

- [ ] Push code to GitHub/GitLab repository
- [ ] Test the app locally one final time (`npm run dev` in both client & server)
- [ ] Verify all 30 tables exist in local MySQL (`SHOW TABLES;`)
- [ ] Note down any seed data you want on production (admin user, rooms, menu items, etc.)

---

## AWS Setup

### EC2 Instance
- [ ] Create AWS account (if not already)
- [ ] Launch EC2 instance (Ubuntu 22.04 LTS, t3.small, 20GB storage)
- [ ] Configure Security Group: open ports 22, 80, 443
- [ ] Download `.pem` key file and keep it safe
- [ ] Allocate Elastic IP and associate with instance (so IP doesn't change on restart)
- [ ] SSH into instance: `ssh -i your-key.pem ubuntu@<ip>`

### Domain
- [ ] Buy a domain name (GoDaddy, Namecheap, Route53, etc.)
- [ ] Create A record pointing to your EC2 Elastic IP
- [ ] Wait for DNS propagation (5 min to 48 hours)

---

## Server Setup (On EC2)

### Install Software
- [ ] `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js 20: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
- [ ] Install MySQL: `sudo apt install -y mysql-server` → `sudo mysql_secure_installation`
- [ ] Install Redis: `sudo apt install -y redis-server` → `sudo systemctl enable redis-server`
- [ ] Install Nginx: `sudo apt install -y nginx`
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Install Git: `sudo apt install -y git`

### Database Setup
- [ ] Create database: `CREATE DATABASE hotel_management;`
- [ ] Create user: `CREATE USER 'hoteluser'@'localhost' IDENTIFIED BY 'YourStrongPassword';`
- [ ] Grant privileges: `GRANT ALL PRIVILEGES ON hotel_management.* TO 'hoteluser'@'localhost';`
- [ ] Verify: `mysql -u hoteluser -p -e "SHOW DATABASES;"`

### Deploy Code
- [ ] Clone repo: `git clone <your-repo-url> /home/ubuntu/hotel`
- [ ] `cd /home/ubuntu/hotel && npm install`
- [ ] Create `server/.env` with production values (see below)
- [ ] Generate JWT secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Generate OTA encryption key: same command as above (save the 64-char hex output)
- [ ] Build frontend: `cd client && npm run build`
- [ ] Start server: `cd ../server && pm2 start src/server.js --name hotel-server`
- [ ] Verify tables created: `mysql -u hoteluser -p hotel_management -e "SHOW TABLES;"`
- [ ] Set up PM2 auto-start: `pm2 save && pm2 startup` (run the command it outputs)

### Nginx Configuration
- [ ] Create config: `sudo nano /etc/nginx/sites-available/hotel`
- [ ] Symlink: `sudo ln -s /etc/nginx/sites-available/hotel /etc/nginx/sites-enabled/`
- [ ] Remove default: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Test config: `sudo nginx -t`
- [ ] Restart: `sudo systemctl restart nginx`
- [ ] Verify: open `http://yourdomain.com` in browser

### SSL (HTTPS)
- [ ] Install certbot: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Get certificate: `sudo certbot --nginx -d yourdomain.com`
- [ ] Verify: open `https://yourdomain.com` in browser
- [ ] Auto-renewal is set up by certbot automatically

---

## Production .env Values to Prepare

```
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_NAME=hotel_management
DB_USER=hoteluser
DB_PASS=_____________ (fill in)
JWT_SECRET=_____________ (generate)
JWT_REFRESH_SECRET=_____________ (generate)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://yourdomain.com
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
OTA_ENCRYPTION_KEY=_____________ (generate 64-char hex)
OTA_WEBHOOK_BASE_URL=https://yourdomain.com/api/v1/webhooks
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=_____________ (your email)
SMTP_PASS=_____________ (app password, NOT regular password)
SMTP_FROM="Udhayam International" <your@email.com>
```

---

## Post-Deployment Verification

- [ ] `https://yourdomain.com` loads the login page
- [ ] `https://yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] Can log in with admin credentials
- [ ] Can create a reservation
- [ ] Check `pm2 logs hotel-server` for any errors
- [ ] `redis-cli ping` returns `PONG`
- [ ] Run seed data if needed: `cd server && npm run seed`

---

## Gmail App Password Setup (for SMTP)

Gmail blocks regular passwords for SMTP. You need an App Password:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" → "Other" → name it "Hotel PMS"
5. Copy the 16-character password
6. Use this as `SMTP_PASS` in `.env`

---

## OTA Integration (After Deployment)

### Partner Registration
- [ ] Contact MakeMyTrip partner team (https://partner.makemytrip.com)
- [ ] Complete hotel onboarding process (they verify your property)
- [ ] Receive from MMT: Property ID, API URL, API credentials, room/rate codes
- [ ] Repeat for Goibibo (same parent company, may be combined onboarding)

### Configure in Your PMS
- [ ] Login as admin → Channel Manager → Add Channel (MakeMyTrip)
- [ ] Enter: name, code (mmt), API URL, Hotel ID, Commission %, API credentials
- [ ] Click "Test" to verify connection
- [ ] Go to API Keys tab → Create API Key for MMT → copy the key
- [ ] Share with MMT: your webhook URLs + API key
  - `https://yourdomain.com/api/v1/webhooks/mmt/booking`
  - `https://yourdomain.com/api/v1/webhooks/mmt/modify`
  - `https://yourdomain.com/api/v1/webhooks/mmt/cancel`
- [ ] Set up Rate Mappings: map your rate plans to MMT room/rate codes
- [ ] Mark rate plans as "OTA Visible" in Rates page
- [ ] Click "Sync" to push initial availability & rates

### Test OTA Flow
- [ ] Ask MMT for a test booking (or use their sandbox environment)
- [ ] Verify booking appears in OTA Bookings page
- [ ] Verify room availability updated
- [ ] Verify email notification received
- [ ] Test cancellation flow
- [ ] Test modification flow

### Go Live
- [ ] Enable channel (set is_active = true)
- [ ] Monitor Channel Manager → Sync Logs for errors
- [ ] Monitor OTA Bookings page for incoming bookings
- [ ] Check Reconciliation page weekly

---

## Ongoing Maintenance

### Daily
- [ ] Check `pm2 logs hotel-server` for errors
- [ ] Monitor OTA Bookings for any failed webhooks

### Weekly
- [ ] Review Reconciliation reports
- [ ] Check sync logs for persistent failures
- [ ] Verify MySQL backup is running

### Monthly
- [ ] Review AWS bill
- [ ] Update Node.js packages: `npm audit fix`
- [ ] Renew SSL (auto, but verify)
- [ ] Review OTA commission reports vs actual payouts

### Database Backup (Set Up Cron)
```bash
# Add to crontab: crontab -e
0 2 * * * mysqldump -u hoteluser -pYourPassword hotel_management | gzip > /home/ubuntu/backups/hotel_$(date +\%F).sql.gz
0 3 * * 0 find /home/ubuntu/backups -mtime +30 -delete
```
- [ ] Create backup directory: `mkdir -p /home/ubuntu/backups`
- [ ] Set up the cron job above
- [ ] Test backup: `mysqldump -u hoteluser -p hotel_management > test_backup.sql`

---

## Troubleshooting Quick Reference

| Issue | Check |
|-------|-------|
| Site not loading | `pm2 status`, `sudo systemctl status nginx` |
| API errors | `pm2 logs hotel-server` |
| DB connection failed | `sudo systemctl status mysql`, verify `.env` credentials |
| OTA webhooks failing | Channel Manager → Sync Logs, check API key is active |
| Redis not working | `redis-cli ping`, `sudo systemctl status redis-server` |
| SSL expired | `sudo certbot renew` |
| Out of disk space | `df -h`, clean old backups/logs |
| High CPU/memory | `htop`, consider upgrading EC2 instance type |

---

## Cost Summary

| Item | Monthly |
|------|---------|
| EC2 t3.small | ~$15-18 |
| Elastic IP | Free (attached) |
| SSL (Let's Encrypt) | Free |
| Domain | ~$1/month |
| **Total** | **~$18/month** |

---

## WhatsApp Business API Setup

### Get Meta WhatsApp Access

1. [ ] Go to https://developers.facebook.com → Create App → Select "Business" type
2. [ ] Add "WhatsApp" product to the app
3. [ ] Go to WhatsApp → Getting Started
4. [ ] Note down:
   - **Phone Number ID** (from the test number or your own)
   - **WhatsApp Business Account ID**
   - **Temporary Access Token** (for testing, valid 24 hours)
5. [ ] For production: generate a **Permanent Access Token** via System User

### Add Your Own Phone Number (Production)

1. [ ] Go to WhatsApp → Configuration → Phone Numbers
2. [ ] Add your hotel's phone number
3. [ ] Verify via SMS/call
4. [ ] This becomes the number guests see messages from

### Configure in .env

```
WHATSAPP_PHONE_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_BUSINESS_ID=your-business-account-id
HOTEL_WHATSAPP_NUMBER=91XXXXXXXXXX
```

### What Gets Sent Automatically

| Event | Who Receives | Message |
|-------|-------------|---------|
| New Booking | Guest | Booking confirmation with dates, room, amount |
| Check-in Day (8 AM) | Guest | Check-in reminder |
| Check-out Day (8 AM) | Guest | Check-out reminder |
| After Checkout | Guest | Thank you + review request |
| Payment Received | Guest | Payment receipt with balance |
| Cancellation | Guest | Cancellation notice |
| OTA Booking | Hotel Staff | New OTA booking alert |

### Testing WhatsApp

- Without credentials: messages silently skip (no errors)
- With test number: can only send to numbers added in Meta dashboard
- With production number: can send to any WhatsApp number
