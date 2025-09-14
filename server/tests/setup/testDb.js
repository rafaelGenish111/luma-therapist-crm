// tests/setup/testDb.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

class TestDatabase {
  constructor() {
    this.mongod = null;
  }

  async connect() {
    try {
      // יצירת MongoDB בזיכרון
      this.mongod = await MongoMemoryServer.create();
      const uri = this.mongod.getUri();
      
      // התחברות עם mongoose
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('🧪 Test Database connected');
    } catch (error) {
      console.error('❌ Failed to connect to test database:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      if (this.mongod) {
        await this.mongod.stop();
      }
      
      console.log('🧪 Test Database disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect from test database:', error);
    }
  }

  async cleanup() {
    try {
      // ניקוי כל הקולקשנים
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
      
      console.log('🧹 Test Database cleaned');
    } catch (error) {
      console.error('❌ Failed to clean test database:', error);
    }
  }
}

module.exports = new TestDatabase();