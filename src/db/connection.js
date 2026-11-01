const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('node:fs');

let db;

const connectDB = async () => {
  if (db) return db;

  const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let credential;

  if (credentialsJson) {
    credential = admin.cert(JSON.parse(credentialsJson));
  } else if (credentialsPath && fs.existsSync(credentialsPath)) {
    credential = admin.cert(require(require('node:path').resolve(credentialsPath)));
  } else {
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to connect to Firestore',
    );
  }

  if (!admin.getApps().length) {
    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || credential.projectId,
    });
  }
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  db = getFirestore(admin.getApp(), databaseId);
  console.log(`Firestore connection configured for database: ${databaseId}`);
  return db;
};

const getDB = () => {
  if (!db) throw new Error('Firestore has not been initialized');
  return db;
};

module.exports = { connectDB, getDB };
