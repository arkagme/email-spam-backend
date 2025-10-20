# Email Spam Report Tool - Backend API

A production-ready Node.js/Express backend for testing email deliverability across multiple providers (Gmail, Outlook, Yahoo). This tool helps you understand where your emails land - inbox, spam, or promotions folder.

## 🚀 Features

### Core Functionality
- ✅ Test email deliverability across 5 test inboxes (2 Gmail, 2 Outlook, 1 Yahoo)
- ✅ Automatic detection of email folder placement (Inbox/Spam/Promotions)
- ✅ Unique test code generation for tracking
- ✅ Real-time detection status tracking
- ✅ Comprehensive deliverability reports

### Bonus Features
- ✅ Overall deliverability score calculation (0-100%)
- ✅ Test history tracking per user
- ✅ Statistics and trends analysis
- ✅ PDF export for reports
- ✅ Email notifications with detailed reports
- ✅ Shareable report URLs

### Technical Features
- 🔒 Rate limiting and security (Helmet, CORS)
- 📝 Comprehensive logging (Winston)
- ✔️ Input validation (Joi)
- 🗄️ MongoDB database with Mongoose
- 🔄 Retry logic for email detection
- 📊 Production-ready error handling
- 📧 Email notification service

## 📋 API Endpoints

### Test Management

#### Create Test
```http
POST /api/v1/tests
Content-Type: application/json

{
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "testCode": "TEST-A1B2C3",
    "testInboxes": [
      {
        "id": "gmail-1",
        "name": "Gmail Test Inbox 1",
        "email": "test1@gmail.com",
        "type": "gmail"
      }
      // ... 4 more inboxes
    ]
  }
}
```

#### Start Detection
```http
POST /api/v1/tests/:testCode/detect
```

**Response:**
```json
{
  "status": "success",
  "message": "Email detection started",
  "data": {
    "testCode": "TEST-A1B2C3",
    "estimatedTime": "2-5 minutes"
  }
}
```

#### Get Detection Status
```http
GET /api/v1/tests/:testCode/status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "testCode": "TEST-A1B2C3",
    "status": "detecting",
    "progress": {
      "completed": 3,
      "total": 5,
      "percentage": 60
    },
    "results": [...]
  }
}
```

#### Get Test Details
```http
GET /api/v1/tests/:testCode
```

#### Get User History
```http
GET /api/v1/tests/history/:userEmail?limit=10
```

#### Get Statistics
```http
GET /api/v1/tests/statistics/:userEmail
```

### Report Management

#### Get Report (JSON)
```http
GET /api/v1/reports/:testCode
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "testCode": "TEST-A1B2C3",
    "deliverabilityScore": 80,
    "overallStatus": "good",
    "summary": {
      "totalInboxes": 5,
      "inboxCount": 4,
      "spamCount": 1,
      "promotionsCount": 0,
      "inboxPercentage": 80
    },
    "results": [...],
    "recommendations": [...]
  }
}
```

#### Get Report (PDF)
```http
GET /api/v1/reports/:testCode?format=pdf
```

Returns a downloadable PDF file.

#### Get Report Summary
```http
GET /api/v1/reports/:testCode/summary
```

#### Send Report via Email
```http
POST /api/v1/reports/:testCode/send
Content-Type: application/json

{
  "email": "recipient@example.com"
}
```

### Health Check
```http
GET /health
```

## 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Email APIs:** 
  - Gmail API (googleapis)
  - Microsoft Graph API (@microsoft/microsoft-graph-client)
  - Yahoo IMAP (imap + mailparser)
- **PDF Generation:** PDFKit
- **Email Service:** Nodemailer
- **Security:** Helmet, CORS, express-rate-limit
- **Validation:** Joi
- **Logging:** Winston

## 📦 Installation

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Gmail API credentials
- Microsoft Azure App (for Outlook)
- Yahoo App Password

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

### Outlook/Microsoft Graph API Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register new application
3. Add Mail.Read permissions
4. Create client secret
5. Update .env:
```env
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_TENANT_ID=your_tenant_id
```

### Yahoo Mail Setup

1. Go to Yahoo Account Security
2. Generate App Password
3. Update .env:
```env
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=your_app_password
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

## 🔐 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Test creation limiting (10 tests per user per day)
- Input validation with Joi
- Error handling middleware
- Secure credential storage

## 📊 Database Schema

### Test Model
- testCode (unique identifier)
- userEmail
- status (initiated/detecting/completed/failed)
- results (array of inbox results)
- deliverabilityScore (0-100)
- reportUrl
- timestamps and metadata

### Report Model
- testId (reference to Test)
- reportUrl (shareable link)
- pdfUrl
- views counter
- expiration date

## 🔄 Detection Flow

1. User creates a test → receives test code
2. User sends email to test inboxes with test code in subject/body
3. User triggers detection
4. System checks all 5 inboxes with retry logic (10 attempts, 15s delay)
5. Determines folder placement for each inbox
6. Calculates deliverability score
7. Generates report and sends email notification
8. User accesses shareable report URL

## 📈 Rate Limits

- General API: 100 requests per 15 minutes
- Test Creation: 10 tests per user per day
- Report Access: 50 requests per 15 minutes

## 🐛 Error Handling

All errors are handled consistently:
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error description"
}
```

Development mode includes stack traces.

## 📝 Logging

Logs are stored in `/logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

Console logging enabled in development mode.

## 🚀 Deployment

### Environment Variables for Production

Ensure all environment variables are properly set for production:
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Recommended Platforms

- **Backend:** Heroku, Railway, Render, AWS, DigitalOcean
- **Database:** MongoDB Atlas
- **File Storage:** AWS S3 (for PDF reports)

## 🧪 Testing

```bash
npm test
```

## 📚 API Documentation

For detailed API documentation, refer to the endpoints section above or generate documentation using tools like Swagger/OpenAPI.

## ⚠️ What's Missing / Could Be Improved

1. **Authentication System:** Currently no user authentication - could add JWT-based auth
2. **Open/Click Tracking:** Bonus feature not fully implemented - needs tracking pixels
3. **Webhook Support:** Real-time notifications via webhooks
4. **Advanced Analytics:** More detailed insights and charts
5. **Bulk Testing:** Test multiple emails simultaneously
6. **Custom Test Inboxes:** Allow users to add their own test inboxes
7. **API Documentation:** Swagger/OpenAPI integration
8. **Unit Tests:** Comprehensive test coverage
9. **Docker Support:** Containerization for easy deployment
10. **Admin Dashboard:** Backend admin panel for monitoring

## 📄 License

MIT

## 👤 Author

Full Stack Developer Intern Assignment

## 🤝 Contributing

This is an assignment project, but suggestions and improvements are welcome!