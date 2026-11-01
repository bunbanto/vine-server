const { createModel } = require('../db/documentModel');

// Wine records are stored as Firestore documents in the "wines" collection.
module.exports = createModel('wines');
