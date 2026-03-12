const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');

admin.initializeApp({
  projectId: config.projectId
});

const db = admin.firestore();
db.settings({ databaseId: config.firestoreDatabaseId });

db.collection('test_admin').doc('test').set({ hello: 'world' })
  .then(() => {
    console.log('SUCCESS');
    process.exit(0);
  })
  .catch(e => {
    console.error('ERROR', e);
    process.exit(1);
  });
