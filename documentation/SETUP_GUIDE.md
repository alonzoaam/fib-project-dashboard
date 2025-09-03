# 🚀 Step-by-Step Setup Guide

## Overview
This guide will walk you through setting up the scalable Fibonacci Project Dashboard from scratch. No confusion, just clear steps!

## 📋 Prerequisites
- GitHub account
- Vercel account (free - sign up at vercel.com)
- Google Apps Script access
- Your communication files in Google Drive

---

## 🏗️ **PHASE 1: Create GitHub Repository** (5 minutes)

### Step 1: Create Repository
1. Go to [GitHub.com](https://github.com) and click "New repository"
2. Name it: `fibonacci-project-dashboard`
3. Make it **Public** (for free Vercel hosting)
4. ✅ Check "Add a README file"
5. Click "Create repository"

### Step 2: Clone Repository Locally
```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/fibonacci-project-dashboard.git
cd fibonacci-project-dashboard
```

### Step 3: Copy Files to Repository
Copy all these files I created into your repository:

**From your current project directory, copy these:**
```
📁 Copy to your new repo:
├── 📄 package.json
├── 📄 vercel.json  
├── 📄 README.md
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 deploy.yml
├── 📁 src/
│   ├── 📁 api/
│   │   ├── 📄 knowledge-base.js
│   │   └── 📄 health.js
│   ├── 📁 dashboard/
│   │   ├── 📄 api-client.js
│   │   ├── 📄 improved_dashboard.html → rename to index.html
│   │   └── 📄 knowledge_base.js (create empty file for now)
│   └── 📁 google-apps-script/
│       └── (copy all your existing .js files)
└── 📁 documentation/
    └── (copy all .md files I created)
```

### Step 4: Push to GitHub
```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial setup: Add scalable dashboard architecture"

# Push to GitHub
git push origin main
```

---

## ☁️ **PHASE 2: Deploy to Vercel** (3 minutes)

### Step 1: Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your `fibonacci-project-dashboard` repository
4. Click "Deploy" (use all default settings)

### Step 2: Get Your URLs
After deployment, Vercel will give you:
- **Production URL:** `https://fibonacci-project-dashboard.vercel.app`
- **API URL:** `https://fibonacci-project-dashboard.vercel.app/api/knowledge-base`

### Step 3: Test the Deployment
Visit these URLs to make sure they work:
- `https://your-app.vercel.app/health` → Should show API health
- `https://your-app.vercel.app/api/knowledge-base` → Should show "no data" message

---

## 🔧 **PHASE 3: Configure Google Apps Script** (5 minutes)

### Step 1: Update Configuration
In your Google Apps Script, update `01_config_main.js`:

```javascript
const CONFIG = {
  SPREADSHEET_ID: '1BJvyyW4g68X9-ccg9TUNSBUDVtwjN-9NMFOhdFoGfzw',
  DRIVE_FOLDER_NAME: 'ProjectCommunications',
  PROJECT_DRIVE_ID: '1VQc2kv_-gFrFh4ubcK3bIz9z4l0HmX0e',
  
  // 🎯 UPDATE THESE WITH YOUR VERCEL URLS:
  API_ENDPOINTS: {
    PRIMARY: 'https://YOUR-APP-NAME.vercel.app/api/knowledge-base',  // ← Your Vercel URL
    BACKUP: 'https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec'
  },
  API_SECRET_KEY: 'fibonacci-secret-2024', // Change this to something secure
  ENABLE_DRIVE_BACKUP: false
};
```

### Step 2: Set Up Vercel Environment Variables
1. Go to your Vercel dashboard
2. Click on your project
3. Go to Settings → Environment Variables
4. Add this variable:
   - **Name:** `API_SECRET_KEY`
   - **Value:** `fibonacci-secret-2024` (same as in Google Apps Script)
   - **Environments:** Production, Preview, Development

### Step 3: Test the Connection
1. In Google Apps Script, run `processAndUpdateAllSheets()`
2. Check the logs - you should see "✅ Successfully published to Primary API"
3. Visit `https://your-app.vercel.app/api/knowledge-base` → Should now show your data!

---

## 📱 **PHASE 4: View Your Dashboard** (1 minute)

### Step 1: Access Dashboard
Go to: `https://your-app.vercel.app`

You should see:
- ✅ Your project data loaded
- ✅ Interactive tabs working
- ✅ Search and filtering functional
- ✅ Real-time data from your Google Apps Script

### Step 2: Share with Stakeholders
Send this URL to anyone who needs access:
`https://your-app.vercel.app`

No login required! It's publicly accessible but secure.

---

## 🔄 **How the CI/CD Works** (Automatic!)

### What happens when you push code:

**On Pull Request:**
- `deploy.yml` automatically runs
- Tests your code
- Creates a preview deployment
- Comments on your PR with preview URL

**On Push to Main:**
- `deploy.yml` automatically runs
- Runs tests and security scans
- Deploys to production
- Updates your live site
- Sends notifications (if configured)

### You don't need to do anything!
The `deploy.yml` file handles everything automatically once it's in your repo.

---

## 🎯 **Quick Test Checklist**

After setup, verify everything works:

- [ ] ✅ GitHub repo created and files pushed
- [ ] ✅ Vercel deployment successful 
- [ ] ✅ `/health` endpoint returns healthy status
- [ ] ✅ Google Apps Script updated with Vercel URL
- [ ] ✅ API_SECRET_KEY configured in both places
- [ ] ✅ Google Apps Script runs without errors
- [ ] ✅ Dashboard loads with your data
- [ ] ✅ All tabs and features working

---

## 🆘 **Troubleshooting**

### Problem: "Failed to publish to Primary API"
**Solution:** Check that:
1. Vercel URL is correct in Google Apps Script
2. API_SECRET_KEY matches in both places
3. Vercel deployment was successful

### Problem: "Knowledge base not found"
**Solution:** 
1. Run Google Apps Script first to populate data
2. Check Google Apps Script logs for errors
3. Verify your communication files are in the right Drive folder

### Problem: Dashboard shows "Loading..."
**Solution:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Make sure Vercel deployment completed

### Problem: GitHub Actions failing
**Solution:**
1. Check you have all required files in the repo
2. Verify package.json is valid
3. Make sure you're pushing to the main branch

---

## 🚀 **You're Done!**

Once you complete these steps, you'll have:
- ✅ **Scalable cloud dashboard** deployed globally
- ✅ **Automatic deployments** via GitHub
- ✅ **Real-time data updates** from Google Apps Script
- ✅ **Professional URL** to share with stakeholders
- ✅ **100x scale ready** architecture

**Total setup time: ~15 minutes**

The system will automatically:
- Update when you push code changes
- Refresh data when Google Apps Script runs
- Scale to handle any amount of traffic
- Work globally with fast loading times

**Need help?** Check the troubleshooting section above or create a GitHub issue!
