# Email Spam Report Tool - Backend API

A production-ready Node.js/Express backend for testing email deliverability across multiple providers (Gmail, Outlook, Yahoo). This tool helps you understand where your emails land - inbox, spam, or promotions folder.

## 🚀 Features

### Core Functionality
- Test email deliverability across 2 Gmail inboxes 
- Automatic detection of email folder placement (Inbox/Spam/Promotions)
- Unique test code generation for tracking
- Real-time detection status tracking
- Comprehensive deliverability reports

### Bonus Features
- Overall deliverability score calculation (0-100%)
- Test history tracking per user
- Statistics and trends analysis
- PDF export for reports
- Email notifications with detailed reports
- Shareable report URLs

### Technical Features
- Rate limiting and security (Helmet, CORS)
- Comprehensive logging (Winston)
- Input validation (Joi)
- MongoDB database with Mongoose
- Retry logic for email detection
- Production-ready error handling
- Email notification service


## 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Email APIs:** 
  - Gmail API (googleapis)
- **PDF Generation:** PDFKit
- **Email Service:** Nodemailer
- **Security:** Helmet, CORS, express-rate-limit
- **Validation:** Joi
- **Logging:** Winston

## 📦 Installation

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd email-spam-report-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create logs and reports directories**
```bash
mkdir -p logs reports credentials/gmail credentials/outlook
```

4. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (see Configuration section below).

5. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

6. **Run the server**
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000`

## ⚙️ Configuration

### Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download credentials and get refresh token
6. Update .env:
```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

### Test Inboxes Configuration

Update `.env` with your actual test inbox emails:
```env
TEST_GMAIL_1=test1@gmail.com
TEST_GMAIL_2=test2@gmail.com
TEST_OUTLOOK_1=test1@outlook.com
TEST_OUTLOOK_2=test2@outlook.com
TEST_YAHOO_1=test1@yahoo.com
```

### SMTP Configuration (for notifications)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
## 🔄 Detection Flow

1. User creates a test → receives test code
2. User sends email to test inboxes with test code in subject/body
3. User triggers detection
4. System checks all 5 inboxes with retry logic (10 attempts, 15s delay)
5. Determines folder placement for each inbox
6. Calculates deliverability score
7. Generates report and sends email notification
8. User accesses shareable report URL
