const crypto = require('node:crypto');
const { getDB } = require('./connection');

const id = () => crypto.randomBytes(12).toString('hex');
const plain = (value) => {
  if (value && typeof value.toDate === 'function') return value.toDate();
  if (value && typeof value.toObject === 'function') return value.toObject();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plain(item)]));
  }
  return value;
};
const field = (obj, key) => key.split('.').reduce((value, part) => value?.[part], obj);
const matches = (doc, filter = {}) => Object.entries(filter).every(([key, expected]) => {
  if (key === '$or') return expected.some((item) => matches(doc, item));
  if (key === '$and') return expected.every((item) => matches(doc, item));
  const actual = field(doc, key);
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if ('$in' in expected) return expected.$in.some((v) => Array.isArray(actual) ? actual.some((a) => String(a) === String(v)) : String(actual) === String(v));
    if ('$regex' in expected) return new RegExp(expected.$regex, expected.$options || '').test(String(actual || ''));
    if ('$gte' in expected && !(actual >= expected.$gte)) return false;
    if ('$lte' in expected && !(actual <= expected.$lte)) return false;
    if ('$gt' in expected && !(actual > expected.$gt)) return false;
    if ('$lt' in expected && !(actual < expected.$lt)) return false;
    return true;
  }
  return Array.isArray(actual) ? actual.some((item) => String(item) === String(expected)) : String(actual) === String(expected);
});

class Document {
  constructor(model, data, isNew = false) {
    Object.defineProperty(this, '_model', { value: model });
    this._isNew = isNew;
    // Keep Firestore timestamps as JavaScript Dates for consistent API responses.
    Object.assign(this, plain(data));
    if (model.collection === 'wines') {
      this.ratings ||= [];
      this.comments ||= [];
      this.favorites ||= [];
      this.adminEdits ||= [];
      this.rating ??= 0;
      this.frizzante ??= false;
      this.unfiltered ??= false;
      this.description ??= '';
      for (const item of [...this.ratings, ...this.comments, ...this.adminEdits]) item._id ||= id();
    }
  }
  get(key) { return this[key]; }
  toObject() {
    const result = {};
    for (const [key, value] of Object.entries(this)) if (!key.startsWith('_')) result[key] = plain(value);
    result._id = this._id;
    return result;
  }
  toJSON() { return this.toObject(); }
  async save() {
    const data = this.toObject();
    data.updatedAt = new Date();
    if (!data.createdAt) data.createdAt = data.updatedAt;
    await getDB().collection(this._model.collection).doc(String(this._id)).set(data);
    Object.assign(this, data);
    this._isNew = false;
    return this;
  }
}

class Query {
  constructor(model, filter, one = false) { this.model = model; this.filter = filter; this.one = one; this.sortSpec = null; this.offset = 0; this.max = Infinity; this.populates = []; }
  sort(spec) { this.sortSpec = spec; return this; }
  skip(n) { this.offset = n; return this; }
  limit(n) { this.max = n; return this; }
  populate(path, projection) { this.populates.push({ path, projection }); return this; }
  async exec() {
    const snapshot = await getDB().collection(this.model.collection).get();
    let rows = snapshot.docs.map((doc) => new Document(this.model, { ...doc.data(), _id: doc.id })).filter((doc) => matches(doc, this.filter));
    if (this.sortSpec) {
      const [key, direction] = Object.entries(this.sortSpec)[0];
      rows.sort((a, b) => (field(a, key) > field(b, key) ? 1 : field(a, key) < field(b, key) ? -1 : 0) * direction);
    }
    if (this.one) rows = rows.slice(0, 1);
    else rows = rows.slice(this.offset, this.offset + this.max);
    await Promise.all(rows.map(async (row) => {
      for (const { path, projection } of this.populates) {
        const ids = path === 'owner' ? [row.owner] : path === 'ratings.userId' ? row.ratings.map((r) => r.userId) : [];
        const users = await Promise.all(ids.map(async (userId) => {
          if (!userId) return null;
          const snap = await getDB().collection('users').doc(String(userId)).get();
          if (!snap.exists) return null;
          const user = snap.data();
          const selected = projection ? Object.fromEntries(projection.split(' ').filter((key) => user[key] !== undefined).map((key) => [key, user[key]])) : user;
          selected._id = String(userId);
          return selected;
        }));
        if (path === 'owner') row.owner = users[0];
        else if (path === 'ratings.userId') row.ratings.forEach((rating, i) => { rating.userId = users[i] || rating.userId; });
      }
    }));
    return this.one ? rows[0] || null : rows;
  }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
}

const createModel = (collection) => {
  const model = {
    collection,
    find(filter = {}) { return new Query(model, filter); },
    findOne(filter = {}) { return new Query(model, filter, true); },
    findById(docId) { return new Query(model, { _id: String(docId) }, true); },
    async create(data) {
      const values = plain(data);
      if (collection === 'wines') Object.assign(values, {
        ratings: [], comments: [], favorites: [], adminEdits: [], rating: 0,
        frizzante: false, unfiltered: false, description: '',
        img: 'https://res.cloudinary.com/demo/image/upload/wines/default.jpg',
      }, values);
      for (const item of [...values.ratings, ...values.comments, ...values.adminEdits]) item._id ||= id();
      const doc = new Document(model, { ...values, _id: id() }, true);
      return doc.save();
    },
    async countDocuments(filter = {}) { return (await model.find(filter)).length; },
    async findOneAndDelete(filter = {}) {
      const doc = await model.findOne(filter);
      if (!doc) return null;
      await getDB().collection(collection).doc(String(doc._id)).delete();
      return doc;
    },
    async findOneAndUpdate(filter = {}, update = {}) {
      const doc = await model.findOne(filter);
      if (!doc) return null;
      Object.assign(doc, update.$set || update);
      return doc.save();
    },
  };
  return model;
};

module.exports = { createModel, Document, matches, id };
