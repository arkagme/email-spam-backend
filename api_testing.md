# API Testing Guide

## Complete Test Flow Example

### Step 1: Create a Test

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/tests \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "johndoe@example.com"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Test created successfully",
  "data": {
    "testCode": "TEST-A1B2C3",
    "testId": "6543210abcdef1234567890",
    "testInboxes": [
      {
        "id": "gmail-1",
        "name": "Gmail Test Inbox 1",
        "email": "test1@gmail.com",
        "type": "gmail"
      },
      {
        "id": "gmail-2",
        "name": "Gmail Test Inbox 2",
        "email": "test2@gmail.com",
        "type": "gmail"
      },
      {
        "id": "outlook-1",
        "name": "Outlook Test Inbox 1",
        "email": "test1@outlook.com",
        "type": "outlook"
      },
      {
        "id": "outlook-2",
        "name": "Outlook Test Inbox 2",
        "email": "test2@outlook.com",
        "type": "outlook"
      },
      {
        "id": "yahoo-1",
        "name": "Yahoo Test Inbox",
        "email": "test1@yahoo.com",
        "type": "yahoo"
      }
    ],
    "userEmail": "johndoe@example.com",
    "createdAt": "2025-10-18T10:30:00.000Z"
  }
}
```

### Step 2: Send Email to Test Inboxes

Open your email client and compose an email:
- **To:** test1@gmail.com, test2@gmail.com, test1@outlook.com, test2@outlook.com, test1@yahoo.com
- **Subject:** "Marketing Campaign - TEST-A1B2C3"
- **Body:** Any content you want to test

**Important:** Include the test code (TEST-A1B2C3) in either subject or body.

### Step 3: Start Detection

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/tests/TEST-A1B2C3/detect
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Email detection started. You will receive a report via email once completed.",
  "data": {
    "testCode": "TEST-A1B2C3",
    "estimatedTime": "2-5 minutes"
  }
}
```

### Step 4: Check Detection Status

**Request:**
```bash
curl http://localhost:5000/api/v1/tests/TEST-A1B2C3/status
```

**During Detection:**
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
    "results": [
      {
        "inboxId": "gmail-1",
        "inboxName": "Gmail Test Inbox 1",
        "email": "test1@gmail.com",
        "type": "gmail",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:32:15.000Z"
      },
      {
        "inboxId": "gmail-2",
        "inboxName": "Gmail Test Inbox 2",
        "email": "test2@gmail.com",
        "type": "gmail",
        "status": "received",
        "folder": "promotions",
        "receivedAt": "2025-10-18T10:32:18.000Z"
      },
      {
        "inboxId": "outlook-1",
        "inboxName": "Outlook Test Inbox 1",
        "email": "test1@outlook.com",
        "type": "outlook",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:32:20.000Z"
      },
      {
        "inboxId": "outlook-2",
        "status": "pending"
      },
      {
        "inboxId": "yahoo-1",
        "status": "pending"
      }
    ],
    "deliverabilityScore": 0
  }
}
```

### Step 5: Get Final Report

**Request:**
```bash
curl http://localhost:5000/api/v1/reports/TEST-A1B2C3
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "testCode": "TEST-A1B2C3",
    "userEmail": "johndoe@example.com",
    "status": "completed",
    "deliverabilityScore": 80,
    "overallStatus": "good",
    "createdAt": "2025-10-18T10:30:00.000Z",
    "completedAt": "2025-10-18T10:35:00.000Z",
    "duration": "5m 0s",
    "summary": {
      "totalInboxes": 5,
      "receivedCount": 5,
      "inboxCount": 4,
      "spamCount": 0,
      "promotionsCount": 1,
      "notReceivedCount": 0,
      "errorCount": 0,
      "inboxPercentage": 80,
      "spamPercentage": 0,
      "promotionsPercentage": 20
    },
    "results": [
      {
        "inboxId": "gmail-1",
        "inboxName": "Gmail Test Inbox 1",
        "email": "test1@gmail.com",
        "type": "gmail",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:32:15.000Z"
      },
      {
        "inboxId": "gmail-2",
        "inboxName": "Gmail Test Inbox 2",
        "email": "test2@gmail.com",
        "type": "gmail",
        "status": "received",
        "folder": "promotions",
        "receivedAt": "2025-10-18T10:32:18.000Z"
      },
      {
        "inboxId": "outlook-1",
        "inboxName": "Outlook Test Inbox 1",
        "email": "test1@outlook.com",
        "type": "outlook",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:32:20.000Z"
      },
      {
        "inboxId": "outlook-2",
        "inboxName": "Outlook Test Inbox 2",
        "email": "test2@outlook.com",
        "type": "outlook",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:33:45.000Z"
      },
      {
        "inboxId": "yahoo-1",
        "inboxName": "Yahoo Test Inbox",
        "email": "test1@yahoo.com",
        "type": "yahoo",
        "status": "received",
        "folder": "inbox",
        "receivedAt": "2025-10-18T10:34:10.000Z"
      }
    ],
    "recommendations": [
      {
        "type": "info",
        "title": "Promotions Tab",
        "message": "1 email(s) landed in promotions. This is common for marketing emails. Consider personalizing your content."
      },
      {
        "type": "success",
        "title": "Good Deliverability",
        "message": "Your email deliverability is performing well. Keep monitoring regularly."
      }
    ],
    "reportUrl": "http://localhost:5000/api/v1/reports/TEST-A1B2C3",
    "views": 1
  }
}
```

### Step 6: Download PDF Report

**Request:**
```bash
curl http://localhost:5000/api/v1/reports/TEST-A1B2C3?format=pdf \
  -o report-TEST-A1B2C3.pdf
```

## Additional API Tests

### Get User History

**Request:**
```bash
curl http://localhost:5000/api/v1/tests/history/johndoe@example.com?limit=5
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "userEmail": "johndoe@example.com",
    "count": 3,
    "tests": [
      {
        "testCode": "TEST-A1B2C3",
        "status": "completed",
        "deliverabilityScore": 80,
        "createdAt": "2025-10-18T10:30:00.000Z",
        "completedAt": "2025-10-18T10:35:00.000Z",
        "reportUrl": "http://localhost:5000/api/v1/reports/TEST-A1B2C3"
      },
      {
        "testCode": "TEST-X9Y8Z7",
        "status": "completed",
        "deliverabilityScore": 100,
        "createdAt": "2025-10-17T14:20:00.000Z",
        "completedAt": "2025-10-17T14:24:00.000Z",
        "reportUrl": "http://localhost:5000/api/v1/reports/TEST-X9Y8Z7"
      }
    ]
  }
}
```

### Get Statistics

**Request:**
```bash
curl http://localhost:5000/api/v1/tests/statistics/johndoe@example.com
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalTests": 10,
    "averageScore": 85,
    "trend": "improving",
    "recentTests": [
      {
        "testCode": "TEST-A1B2C3",
        "deliverabilityScore": 80,
        "createdAt": "2025-10-18T10:30:00.000Z"
      }
    ]
  }
}
```

### Send Report via Email

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/reports/TEST-A1B2C3/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Report sent successfully via email"
}
```

### Get Report Summary (Lightweight)

**Request:**
```bash
curl http://localhost:5000/api/v1/reports/TEST-A1B2C3/summary
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
      "spamCount": 0,
      "promotionsCount": 1
    },
    "completedAt": "2025-10-18T10:35:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "userEmail",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 404 Not Found
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Test not found"
}
```

### 429 Too Many Requests
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Email Spam Report Tool API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create Test",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userEmail\": \"{{userEmail}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/tests",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tests"]
        }
      }
    },
    {
      "name": "Start Detection",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/tests/{{testCode}}/detect",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tests", "{{testCode}}", "detect"]
        }
      }
    },
    {
      "name": "Get Detection Status",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/tests/{{testCode}}/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tests", "{{testCode}}", "status"]
        }
      }
    },
    {
      "name": "Get Report (JSON)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/reports/{{testCode}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "reports", "{{testCode}}"]
        }
      }
    },
    {
      "name": "Get Report (PDF)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/reports/{{testCode}}?format=pdf",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "reports", "{{testCode}}"],
          "query": [
            {
              "key": "format",
              "value": "pdf"
            }
          ]
        }
      }
    },
    {
      "name": "Get User History",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/tests/history/{{userEmail}}?limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tests", "history", "{{userEmail}}"],
          "query": [
            {
              "key": "limit",
              "value": "10"
            }
          ]
        }
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/tests/statistics/{{userEmail}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "tests", "statistics", "{{userEmail}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "userEmail",
      "value": "test@example.com"
    },
    {
      "key": "testCode",
      "value": "TEST-A1B2C3"
    }
  ]
}
```

## Testing Tips

1. **Use Real Email Addresses**: Ensure test inboxes are actual emails you have access to
2. **Wait for Detection**: Detection takes 2-5 minutes with retry logic
3. **Include Test Code**: Always include the test code in email subject or body
4. **Check Spam Folders**: Manually verify if emails land in spam
5. **Monitor Logs**: Check `logs/combined.log` for detailed information
6. **Test Rate Limits**: Try exceeding limits to verify protection
7. **Test Edge Cases**: Invalid emails, expired tests