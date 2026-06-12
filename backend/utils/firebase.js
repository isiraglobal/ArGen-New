const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db;
let auth;

const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      // Base64 fallback
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii'));
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized using environment credentials.");
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized using local service account file.");
  } else {
    console.warn("WARNING: No Firebase Service Account found. Initializing with default config (local/emulator/mock).");
    admin.initializeApp({
      projectId: "argen1"
    });
  }
  db = admin.firestore();
  auth = admin.auth();
  global.MOCK_DB = false;
} catch (err) {
  console.error("Firebase Admin SDK Initialization failed:", err.message);
  console.log("--- RUNNING IN MOCK DB MODE ---");
  global.MOCK_DB = true;
  
  // Stub Firestore and Auth to prevent runtime crashes in offline/mock mode
  db = {
    collection: () => {
      const queryStub = {
        where: () => queryStub,
        orderBy: () => queryStub,
        limit: () => queryStub,
        get: async () => ({
          empty: false,
          docs: [
            {
              id: "mock-doc-id",
              data: () => ({
                name: "Mock Item",
                status: "active",
                role: "teamadmin",
                companyId: "mock-company-id",
                inviteCode: "MOCK1234"
              })
            }
          ]
        })
      };
      return {
        doc: () => ({
          get: async () => ({
            exists: true,
            id: "mock-doc-id",
            data: () => ({
              name: "Mock Item",
              status: "active",
              role: "teamadmin",
              companyId: "mock-company-id"
            })
          }),
          set: async () => {},
          update: async () => {},
          delete: async () => {}
        }),
        add: async () => ({ id: "mock-add-id" }),
        ...queryStub
      };
    }
  };
  
  auth = {
    verifyIdToken: async (token) => {
      if (token === "mock-token") {
        return { uid: "mock-uid", email: "admin@argen.ai", role: "teamadmin" };
      }
      throw new Error("Invalid token in mock mode");
    },
    createUser: async (userRecord) => ({ uid: "mock-created-uid", ...userRecord }),
    getUser: async (uid) => ({ uid, email: "mock@argen.ai" }),
    deleteUser: async () => {}
  };
}

module.exports = { admin, db, auth };
