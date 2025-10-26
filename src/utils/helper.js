const { v4: uuidv4 } = require('uuid');


const generateTestCode = () => {
  const code = uuidv4().split('-')[0].toUpperCase();
  return `TEST-${code}`;
};


const getTimeDifference = (startDate, endDate) => {
  const diff = Math.abs(endDate - startDate);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};


const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const sanitizeText = (text) => {
  if (!text) return '';
  return text.trim().replace(/[^\w\s-]/g, '');
};


const getProviderFromEmail = (email) => {
  if (!email) return 'other';
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain?.includes('gmail.com')) return 'gmail';
  if (domain?.includes('outlook.com') || domain?.includes('hotmail.com') || domain?.includes('live.com')) return 'outlook';
  if (domain?.includes('yahoo.com')) return 'yahoo';
  
  return 'other';
};


const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};


const generateReportUrl = (testCode, baseUrl) => {
  return `${baseUrl}/api/v1/reports/${testCode}`;
};

module.exports = {
  generateTestCode,
  getTimeDifference,
  sleep,
  isValidEmail,
  sanitizeText,
  getProviderFromEmail,
  formatBytes,
  generateReportUrl
};