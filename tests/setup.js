process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'fa15d39f8fec467f95eff35b3feb0833638a585d786a82223114e34a54cb21840d4432bfa9773f421fad6a3251a628f5370bc1e30280b0f27b31fd340d8ff93b';
process.env.JWT_REFRESH_SECRET = '2901a7a98eeff9d8c3418fb870d523eeccae9b41bc6178abea6c534925c94ee032322b3b3dea1636e5bb5bd8b74bce7eb59a5bd615731e173b653e619777d83c';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/...';
process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.LOG_LEVEL = 'silent';