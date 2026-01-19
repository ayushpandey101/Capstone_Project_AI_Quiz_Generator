import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  
});

mongoose.connection.on('error', (err) => {
  });

mongoose.connection.on('disconnected', () => {
  
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  
  process.exit(0);
});

export default connectDB;

