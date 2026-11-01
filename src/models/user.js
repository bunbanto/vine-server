const { createModel } = require('../db/documentModel');

// User records are stored in Firestore; passwords remain bcrypt hashes.
module.exports = createModel('users');
