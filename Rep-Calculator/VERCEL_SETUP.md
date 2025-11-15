# Vercel Deployment Guide for Scope Builder

Your code has been successfully pushed to GitHub at: **https://github.com/TheJonathanMoore/SimpleQuote**

Follow these steps to deploy to Vercel:

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Import Project from GitHub
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Search for and select **"TheJonathanMoore/SimpleQuote"**
5. Click **"Import"**

### Step 2: Configure Project Settings
When prompted, use these settings:

**Project Name:** `simple-quote` (or your preferred name)

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `scope-builder/`

**Build Command:** `npm run build`

**Output Directory:** `.next`

**Install Command:** `npm install`

### Step 3: Environment Variables
Add these environment variables in the Vercel dashboard:

```
ANTHROPIC_API_KEY=your_api_key_here
```

To get your API key:
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create or log in to your account
3. Navigate to the API keys section
4. Create a new API key and copy it
5. Add it to Vercel as `ANTHROPIC_API_KEY`

### Step 4: Deploy
1. Click **"Deploy"**
2. Vercel will automatically build and deploy your project
3. You'll receive a live URL (e.g., `https://simple-quote.vercel.app`)

---

## Option 2: Deploy via CLI

If you prefer using the command line:

### Step 1: Login to Vercel
```bash
cd "/Users/juliamoore/Documents/App Projects/Job summary generator/scope-builder"
vercel login
```

Follow the prompts to authenticate via your browser.

### Step 2: Deploy
```bash
vercel --prod
```

Vercel will automatically:
- Detect your Next.js project
- Create a new project in your Vercel account
- Build and deploy the application

### Step 3: Add Environment Variables
After deployment, add environment variables:

```bash
vercel env add ANTHROPIC_API_KEY
```

Then redeploy:
```bash
vercel --prod
```

---

## Important Notes

### Environment Variables Required

**For Production:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude integration

### Email Service Integration

The email endpoint at `/app/api/send-email/route.ts` is currently a placeholder. To enable email functionality, you'll need to:

1. **Choose an email service:**
   - SendGrid
   - Mailgun
   - AWS SES
   - Resend
   - Others

2. **Install the service's SDK:**
   ```bash
   # Example: for SendGrid
   npm install @sendgrid/mail
   ```

3. **Update the email endpoint** (`app/api/send-email/route.ts`) to use your chosen service

4. **Add API credentials to Vercel:**
   ```bash
   vercel env add EMAIL_SERVICE_API_KEY
   ```

### Domain Configuration

Once deployed, you can:
1. Add a custom domain in Vercel Dashboard → Project Settings → Domains
2. Follow Vercel's DNS configuration instructions

---

## Testing After Deployment

1. Visit your live URL
2. Upload a sample insurance document
3. Test the full workflow:
   - Upload/parse document
   - Review scope items
   - Add supplements
   - Sign document
   - Download PDF
   - Send email (email service needs setup)

---

## Troubleshooting

**Build fails with "Cannot find module":**
- Ensure you're in the `scope-builder/` directory
- Run `npm install` locally first
- Check that all imports are correct

**API key errors:**
- Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Ensure the key is valid and has API access

**Email not sending:**
- Implement actual email service integration (currently placeholder)
- Add service credentials to environment variables

---

## Vercel Dashboard Features

Once deployed, you can:
- View real-time logs
- Monitor performance
- Set up preview deployments for pull requests
- Configure auto-deployments on git pushes
- Manage environment variables
- Add custom domains

For more information, visit [Vercel Documentation](https://vercel.com/docs)
