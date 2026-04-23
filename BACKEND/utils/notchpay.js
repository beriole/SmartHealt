const axios = require('axios');
require('dotenv').config();

const notchpayClient = axios.create({
  baseURL: process.env.NOTCHPAY_BASE_URL || 'https://api.notchpay.co',
  headers: {
    'Authorization': process.env.NOTCHPAY_PUBLIC_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

module.exports = notchpayClient;
