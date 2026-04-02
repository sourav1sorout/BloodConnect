const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing connection to:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection Success!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.reason) console.error('Reason:', err.reason);
    process.exit(1);
  }
};

testConnection();
