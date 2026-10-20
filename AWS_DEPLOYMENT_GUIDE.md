# Choice Electricals — AWS Server & Deployment Guide

This document contains full details for the AWS EC2 production server, file directories, Nginx web routing, database configuration, and one-click deployment commands for the React Admin Panel, Node.js Backend, and Database migrations.

---

## 1. Server Overview & Connection Details

| Parameter | Value |
| :--- | :--- |
| **Server Public IP** | `16.176.101.134` |
| **SSH Username** | `ubuntu` |
| **SSH Private Key Path** | `D:\Downloads\choice1.pem` |
| **Operating System** | Ubuntu 24.04 LTS (AWS EC2) |
| **Web Server (Reverse Proxy)** | Nginx |
| **Process Manager** | PM2 (`choice-backend`) |
| **Database** | MySQL (`choice_db` on `localhost:3306`) |
| **Node.js Environment** | Node.js v20+ / npm |

### Connect via SSH from Windows PowerShell / Terminal:
```powershell
ssh -i D:\Downloads\choice1.pem ubuntu@16.176.101.134
```

---

## 2. Live Web URLs & Endpoints

| Service / Page | URL | Description |
| :--- | :--- | :--- |
| **Admin Panel Web App** | [http://16.176.101.134](http://16.176.101.134) | React Admin Dashboard |
| **Customer Credit Ledger** | [http://16.176.101.134/credit](http://16.176.101.134/credit) | Hardware & Electronic Credit Khata |
| **Backend REST API Base** | [http://16.176.101.134/api](http://16.176.101.134/api) | Express.js REST API |
| **APK Direct Download Page** | [http://16.176.101.134/download](http://16.176.101.134/download) | Mobile App APK Download Page |
| **APK Release Management** | [http://16.176.101.134/admin/apk](http://16.176.101.134/admin/apk) | Admin APK Release Upload |

---

## 3. Server Architecture & Directory Map

```text
/
├── var/
│   └── www/
│       └── admin_panel/               <-- Production React Frontend (Web Root)
│           ├── index.html             <-- Single Page App HTML entry
│           ├── assets/                <-- Compiled JS & CSS bundles
│           ├── bg-store.jpg           <-- Background asset
│           ├── favicon.svg            <-- App favicon
│           └── logo.png               <-- Brand logo
│
├── home/
│   └── ubuntu/
│       ├── choice_backend/            <-- Node/Express Backend root
│       │   ├── server.js (server.ts)  <-- Entry script running on port 5000
│       │   ├── controllers/           <-- Route controllers (creditController, etc.)
│       │   ├── routes/                <-- Express routes (creditRoutes, etc.)
│       │   ├── middlewares/           <-- Auth & file upload middlewares
│       │   ├── prisma/
│       │   │   └── schema.prisma      <-- Database schema
│       │   └── .env                   <-- Environment variables & MySQL credentials
│       │
│       ├── uploads/                   <-- Uploaded files & APK releases
│       └── admin_dist_new/            <-- Temporary upload folder for frontend updates
│
└── etc/
    └── nginx/
        └── sites-available/default    <-- Nginx configuration (reverse proxy & static hosting)
```

---

## 4. Nginx Reverse Proxy Configuration

File location on server: `/etc/nginx/sites-available/default`

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    client_max_body_size 100M;

    # 1. React Frontend (SPA)
    root /var/www/admin_panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Express Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. APK Direct Download Endpoint
    location /download {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 4. APK Upload & Management Portal
    location /admin/apk {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 5. Deployment Guide (Step-by-Step)

### A. Deploy Frontend (`admin_panel`) to AWS:
Run these commands in PowerShell on your local machine:

```powershell
# 1. Build the production React bundle locally:
cd c:\Users\Ansil\Desktop\aoppp\admin_panel
npm run build

# 2. Upload dist folder to the server:
scp -i D:\Downloads\choice1.pem -r dist\* ubuntu@16.176.101.134:/home/ubuntu/admin_dist_new/

# 3. Move files to /var/www/admin_panel and reload Nginx:
ssh -i D:\Downloads\choice1.pem ubuntu@16.176.101.134 "sudo cp -r /home/ubuntu/admin_dist_new/* /var/www/admin_panel/ && sudo chown -R www-data:www-data /var/www/admin_panel && sudo systemctl reload nginx"
```

---

### B. Deploy Backend (`backend`) to AWS:
Run these commands in PowerShell on your local machine:

```powershell
# 1. Upload updated schema and code files:
scp -i D:\Downloads\choice1.pem c:\Users\Ansil\Desktop\aoppp\backend\prisma\schema.prisma ubuntu@16.176.101.134:/home/ubuntu/choice_backend/prisma/
scp -i D:\Downloads\choice1.pem c:\Users\Ansil\Desktop\aoppp\backend\controllers\* ubuntu@16.176.101.134:/home/ubuntu/choice_backend/controllers/
scp -i D:\Downloads\choice1.pem c:\Users\Ansil\Desktop\aoppp\backend\routes\* ubuntu@16.176.101.134:/home/ubuntu/choice_backend/routes/
scp -i D:\Downloads\choice1.pem c:\Users\Ansil\Desktop\aoppp\backend\server.* ubuntu@16.176.101.134:/home/ubuntu/choice_backend/

# 2. Sync database schema with MySQL and restart PM2:
ssh -i D:\Downloads\choice1.pem ubuntu@16.176.101.134 "cd /home/ubuntu/choice_backend && npx prisma generate && npx prisma db push && pm2 restart choice-backend"
```

---

## 6. Server Management & Diagnostic Commands

Run these on the AWS server (after SSH login):

### PM2 Process Manager:
```bash
# Check status of running backend processes:
pm2 status

# View live backend logs:
pm2 logs choice-backend

# Restart backend process:
pm2 restart choice-backend

# Stop backend process:
pm2 stop choice-backend
```

### Nginx Web Server:
```bash
# Test Nginx configuration for syntax errors:
sudo nginx -t

# Reload Nginx without downtime:
sudo systemctl reload nginx

# Restart Nginx:
sudo systemctl restart nginx

# View Nginx error logs:
sudo tail -f /var/log/nginx/error.log
```

### MySQL Database:
```bash
# Connect to MySQL console:
mysql -u choice_user -p choice_db
# Password: ChoicePos2026!

# Check tables:
SHOW TABLES;

# Check credit ledger table:
DESCRIBE credit_entries;
SELECT * FROM credit_entries ORDER BY createdAt DESC LIMIT 10;
```
