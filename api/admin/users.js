/**
 * Admin API - Get all users from Firebase Auth + Firestore + MongoDB
 * Restricted to admin users only
 */

const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

// Admin email (base64 encoded for security)
const ADMIN_EMAIL = Buffer.from('cmFmYXNvdXphY3J1ekBnbWFpbC5jb20=', 'base64').toString('utf-8');

async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MongoDB not configured');
    return null;
  }
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    return client.db(process.env.MONGODB_DB || 'vidaextra');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user is admin
    if (decodedToken.email !== ADMIN_EMAIL) {
      console.log(`Access denied for: ${decodedToken.email}`);
      return res.status(403).json({ error: 'Forbidden - Admin access only' });
    }

    console.log(`Admin access granted: ${decodedToken.email}`);

    // Get all users from Firebase Auth (this has ALL users, not just Firestore)
    const listUsersResult = await admin.auth().listUsers(1000);
    
    // Get Firestore instance
    const db = admin.firestore();
    
    // Get MongoDB connection
    const mongodb = await getMongoDb();
    
    // Fetch user data with shifts
    const usersData = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        try {
          // Get user document from Firestore (may not exist for all users)
          let firestoreData = {};
          try {
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (userDoc.exists) {
              firestoreData = userDoc.data();
            }
          } catch (err) {
            console.log(`No Firestore data for user ${userRecord.uid}`);
          }

          // Get user's shifts from MongoDB
          let shifts = [];
          let shiftsCount = 0;
          
          if (mongodb) {
            try {
              const shiftsCollection = mongodb.collection('shifts');
              const userShifts = await shiftsCollection
                .find({ userId: userRecord.uid })
                .sort({ dataMillis: -1 })
                .limit(100)
                .toArray();
              
              shifts = userShifts;
              shiftsCount = userShifts.length;
            } catch (err) {
              console.log(`No MongoDB shifts for user ${userRecord.uid}`);
            }
          }

          return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || firestoreData.displayName || null,
            photoURL: userRecord.photoURL || firestoreData.photoURL || null,
            // Use Firebase Auth metadata (most accurate)
            createdAt: userRecord.metadata.creationTime,
            lastAccess: userRecord.metadata.lastSignInTime || userRecord.metadata.lastRefreshTime,
            isOnline: firestoreData.isOnline || false,
            shifts: shifts.slice(0, 20), // Limit to 20 most recent shifts
            shiftsCount: shiftsCount,
            calendarConnected: !!firestoreData.accessToken,
            emailNotifications: firestoreData.notifySettings?.email !== false
          };
        } catch (error) {
          console.error(`Error fetching data for user ${userRecord.uid}:`, error);
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || null,
            photoURL: userRecord.photoURL || null,
            createdAt: userRecord.metadata.creationTime,
            lastAccess: userRecord.metadata.lastSignInTime,
            isOnline: false,
            shifts: [],
            shiftsCount: 0,
            calendarConnected: false,
            emailNotifications: false
          };
        }
      })
    );

    // Sort by last access (most recent first)
    usersData.sort((a, b) => {
      const dateA = new Date(a.lastAccess || a.createdAt);
      const dateB = new Date(b.lastAccess || b.createdAt);
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      users: usersData,
      totalUsers: usersData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
