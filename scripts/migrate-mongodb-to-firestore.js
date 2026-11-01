require('dotenv').config();
const { MongoClient } = require('mongodb');
const { connectDB } = require('../src/db/connection');

const mongoUri = process.env.MONGO_DB_URI ||
  `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DB}?retryWrites=true&w=majority`;
const mongoDatabase = process.env.MONGODB_DB;

const serialize = (value) => {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    if (value._bsontype === 'ObjectId') return value.toString();
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
};

const migrateCollection = async (source, target, collectionName) => {
  const documents = await source.collection(collectionName).find({}).toArray();
  console.log(`${collectionName}: read ${documents.length} source documents`);
  let batch = target.batch();
  let operations = 0;
  for (const document of documents) {
    const { _id, ...data } = serialize(document);
    batch.set(target.collection(collectionName).doc(String(_id)), { ...data, _id: String(_id) });
    operations += 1;
    if (operations === 450) {
      await batch.commit();
      batch = target.batch();
      operations = 0;
    }
  }
  if (operations) await batch.commit();
  console.log(`${collectionName}: migrated ${documents.length} documents`);
};

const main = async () => {
  if (!process.env.MONGO_DB_URI && (!process.env.MONGODB_USER || !process.env.MONGODB_PASSWORD || !process.env.MONGODB_URL || !mongoDatabase)) {
    throw new Error('Configure the existing MongoDB connection variables before running migration');
  }
  if (!mongoDatabase) throw new Error('MONGODB_DB must be set (also when MONGO_DB_URI is used)');
  const target = await connectDB();
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const source = client.db(mongoDatabase);
    await migrateCollection(source, target, 'users');
    await migrateCollection(source, target, 'wines');
    console.log('Migration complete. Source MongoDB data was left unchanged.');
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  if (error.code === 5) console.error('Firestore reports NOT_FOUND; confirm that a Firestore database exists in this Firebase project.');
  process.exitCode = 1;
});
