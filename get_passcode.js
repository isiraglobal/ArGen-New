const { db } = require('./backend/utils/supabase');

async function run() {
  const snapshot = await db.collection('companies').get();
  if (snapshot.empty) {
    console.log("No companies found.");
    return;
  }
  snapshot.docs.forEach(doc => {
    console.log(`Company ID: ${doc.id}, Name: ${doc.data().name}, inviteCode: ${doc.data().inviteCode}`);
  });
}

run().catch(console.error);
