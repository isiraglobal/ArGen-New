const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let db;
let auth;
let rawFirestore;

const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  // Support three formats: (1) base64 via FIREBASE_PRIVATE_KEY_BASE64, (2) literal \n escapes, (3) actual newlines
  if (!privateKey.startsWith('-----BEGIN')) {
    // Try base64 fallback
    const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    if (b64) {
      privateKey = Buffer.from(b64, 'base64').toString('utf8');
    }
  }
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase credentials missing. Initializing mock DB layer.');
    return setupMockLayer();
  }

  try {
    const fbCert = admin.cert || (admin.credential && admin.credential.cert);
    if (!fbCert) throw new Error('firebase-admin credential method not found (v14+ uses admin.cert())');
    admin.initializeApp({
      credential: fbCert({
        projectId,
        clientEmail,
        privateKey
      })
    });

    const firestore = getFirestore('default');
    rawFirestore = firestore;
    firestore.settings({ ignoreUndefinedProperties: true });

    const firebaseAuth = getAuth();

    function chainFactory(collectionName, base) {
      const ref = firestore.collection(collectionName);
      return {
        ref,
        filters: base ? [...base.filters] : [],
        orderByField: base ? base.orderByField : null,
        orderDirection: base ? base.orderDirection : 'asc',
        limitVal: base ? base.limitVal : null,

        where(field, op, value) {
          const c = chainFactory(collectionName, this);
          c.filters.push({ field, op, value });
          return c;
        },

        orderBy(field, direction) {
          const c = chainFactory(collectionName, this);
          c.orderByField = field;
          c.orderDirection = direction || 'asc';
          return c;
        },

        limit(n) {
          const c = chainFactory(collectionName, this);
          c.limitVal = n;
          return c;
        },

        async get() {
          let query = ref;
          for (const f of this.filters) {
            if (f.op === '==') query = query.where(f.field, '==', f.value);
            else if (f.op === '!=') query = query.where(f.field, '!=', f.value);
            else if (f.op === '>') query = query.where(f.field, '>', f.value);
            else if (f.op === '<') query = query.where(f.field, '<', f.value);
            else if (f.op === '>=') query = query.where(f.field, '>=', f.value);
            else if (f.op === '<=') query = query.where(f.field, '<=', f.value);
            else if (f.op === 'in') query = query.where(f.field, 'in', f.value);
            else if (f.op === 'array-contains') query = query.where(f.field, 'array-contains', f.value);
          }
          if (this.orderByField) {
            query = query.orderBy(this.orderByField, this.orderDirection);
          }
          if (this.limitVal !== null) {
            query = query.limit(this.limitVal);
          }
          const snapshot = await query.get();
          return {
            empty: snapshot.empty,
            size: snapshot.size,
            docs: snapshot.docs.map(doc => ({
              id: doc.id,
              data: () => doc.data(),
              ref: {
                update: async (data) => doc.ref.update(data),
                delete: async () => doc.ref.delete()
              }
            })),
            forEach: (fn) => snapshot.forEach(doc => fn({
              id: doc.id,
              data: () => doc.data(),
              ref: {
                update: async (data) => doc.ref.update(data),
                delete: async () => doc.ref.delete()
              }
            }))
          };
        },

        doc(id) {
          const docRef = id ? ref.doc(id) : ref.doc();
          return {
            get: async () => {
              const doc = await docRef.get();
              return {
                exists: doc.exists,
                id: doc.id,
                data: () => doc.exists ? doc.data() : null
              };
            },
            set: async (data, options) => {
              if (options && options.merge) {
                await docRef.set(data, { merge: true });
              } else {
                await docRef.set(data);
              }
            },
            update: async (data) => { await docRef.update(data); },
            delete: async () => { await docRef.delete(); }
          };
        },

        async add(data) {
          const docRef = await ref.add(data);
          return {
            id: docRef.id,
            ref: {
              get: async () => {
                const doc = await docRef.get();
                return {
                  exists: doc.exists,
                  id: doc.id,
                  data: () => doc.exists ? doc.data() : null
                };
              },
              update: async (d) => docRef.update(d),
              delete: async () => docRef.delete()
            }
          };
        }
      };
    }

    db = {
      collection: (collectionName) => chainFactory(collectionName, null)
    };

    auth = {
      createUser: async (userRecord) => {
        const user = await firebaseAuth.createUser({
          email: userRecord.email,
          password: userRecord.password,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified || false
        });
        return { uid: user.uid };
      },

      verifyIdToken: async (token) => {
        try {
          const decoded = await firebaseAuth.verifyIdToken(token);
          const user = await firebaseAuth.getUser(decoded.uid);
          return {
            uid: user.uid,
            email: user.email,
            role: decoded.role || user.customClaims?.role || 'member',
            companyId: decoded.companyId || user.customClaims?.companyId || null
          };
        } catch (err) {
          throw new Error('Invalid Firebase token: ' + err.message);
        }
      },

      setCustomUserClaims: async (uid, claims) => {
        await firebaseAuth.setCustomUserClaims(uid, claims);
      },

      generatePasswordResetLink: async (email, options) => {
        const link = await firebaseAuth.generatePasswordResetLink(email, {
          url: options?.url || 'https://argen.isira.club/reset-password',
          handleCodeInApp: false
        });
        return link;
      },

      signInWithPassword: async (email, password) => {
        if (!FIREBASE_WEB_API_KEY) {
          throw new Error('FIREBASE_WEB_API_KEY not set (required for email/password sign-in)');
        }
        const res = await fetch(`${FIREBASE_AUTH_BASE}/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || 'Invalid email or password');
        }
        const data = await res.json();
        const decoded = await firebaseAuth.verifyIdToken(data.idToken);
        return {
          user: { id: decoded.uid, email: data.email },
          session: { access_token: data.idToken, refresh_token: data.refreshToken }
        };
      },

      getUser: async (uid) => {
        const user = await firebaseAuth.getUser(uid);
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
      },

      getUserByEmail: async (email) => {
        try {
          const user = await firebaseAuth.getUserByEmail(email);
          return { uid: user.uid, email: user.email };
        } catch (err) {
          if (err.code === 'auth/user-not-found') return null;
          throw err;
        }
      },

      updateUser: async (uid, data) => {
        await firebaseAuth.updateUser(uid, data);
      },

      deleteUser: async (uid) => {
        await firebaseAuth.deleteUser(uid);
      }
    };

    global.MOCK_DB = false;
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase:', err.message);
    setupMockLayer();
  }
}

function setupMockLayer() {
  global.MOCK_DB = true;

  db = {
    batch: () => ({
      set: async () => {},
      update: async () => {},
      delete: async () => {},
      commit: async () => {}
    }),
    collection: () => {
      const stub = {
        where: () => stub,
        orderBy: () => stub,
        limit: () => stub,
        get: async () => ({
          empty: false,
          size: 1,
          docs: [{
            id: 'mock-doc-id',
            data: () => ({ name: 'Mock Item', status: 'active', role: 'teamadmin', companyId: 'mock-company-id', inviteCode: 'MOCK1234' }),
            ref: { update: async () => {}, delete: async () => {} }
          }],
          forEach: (fn) => fn({ id: 'mock-doc-id', data: () => ({ name: 'Mock Item' }) })
        }),
        doc: () => ({
          get: async () => ({ exists: true, id: 'mock-doc-id', data: () => ({ name: 'Mock Item', status: 'active' }) }),
          set: async () => {},
          update: async () => {},
          delete: async () => {}
        }),
        add: async () => ({ id: 'mock-add-id' })
      };
      return stub;
    }
  };

  auth = {
    verifyIdToken: async (token) => {
      if (token === 'mock-token') {
        return { uid: 'mock-uid', email: 'admin@argen.ai', role: 'teamadmin' };
      }
      throw new Error('Invalid token in mock mode');
    },
    createUser: async (rec) => ({ uid: 'mock-' + Date.now(), ...rec }),
    getUser: async () => ({ uid: 'mock-uid', email: 'mock@argen.ai' }),
    getUserByEmail: async () => null,
    updateUser: async () => {},
    deleteUser: async () => {},
    setCustomUserClaims: async () => {},
    generatePasswordResetLink: async () => 'http://localhost:3001/reset-password?token=mock-reset',
    signInWithPassword: async (email, password) => {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPass = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPass && email === adminEmail && password === adminPass) {
        return {
          user: { id: 'mock-uid', email: adminEmail },
          session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
        };
      }
      throw new Error('Invalid email or password');
    }
  };
}

initializeFirebase();

module.exports = { admin, db, auth, firestore: rawFirestore };