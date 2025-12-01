/**
 * Get User Shifts from MongoDB
 * Returns shifts for a specific user
 */

const { MongoClient } = require('mongodb');

async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not configured');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(process.env.MONGODB_DB || 'vidaextra');
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = await getMongoDb();
    const shiftsCollection = db.collection('shifts');
    
    // Find all shifts for this user
    const shifts = await shiftsCollection
      .find({ userId: userId })
      .sort({ dataMillis: -1 }) // Most recent first
      .limit(100)
      .toArray();

    return res.status(200).json({
      success: true,
      userId: userId,
      shifts: shifts,
      count: shifts.length
    });

  } catch (error) {
    console.error('Get User Shifts Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
