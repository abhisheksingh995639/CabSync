const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.stack);
  }
}

exports.handler = async (event, context) => {
  // Configure CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { token, title, body, targetToken } = JSON.parse(event.body);

    if (!token || !title || !body || !targetToken) {
      return { statusCode: 400, headers, body: 'Missing required parameters' };
    }

    // Verify the Auth Token to ensure the requester is a logged-in CabSync user
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.uid) {
      return { statusCode: 401, headers, body: 'Unauthorized: Invalid token' };
    }

    // Construct the push notification payload
    const message = {
      notification: {
        title,
        body
      },
      token: targetToken
    };

    // Send the notification via FCM
    const response = await admin.messaging().send(message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: response })
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
