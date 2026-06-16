const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let db;
let auth;

// Compatibility Class for CollectionReference
class SupabaseCollectionRef {
  constructor(client, tableName, queryChain = []) {
    this.client = client;
    this.tableName = tableName;
    this.queryChain = queryChain;
    this.orderByField = null;
    this.orderDirection = 'asc';
    this.limitVal = null;
  }

  where(field, op, value) {
    return new SupabaseCollectionRef(this.client, this.tableName, [
      ...this.queryChain,
      { type: 'where', field, op, value }
    ]);
  }

  orderBy(field, direction = 'asc') {
    const ref = new SupabaseCollectionRef(this.client, this.tableName, this.queryChain);
    ref.orderByField = field;
    ref.orderDirection = direction;
    ref.limitVal = this.limitVal;
    return ref;
  }

  limit(n) {
    const ref = new SupabaseCollectionRef(this.client, this.tableName, this.queryChain);
    ref.orderByField = this.orderByField;
    ref.orderDirection = this.orderDirection;
    ref.limitVal = n;
    return ref;
  }

  async get() {
    try {
      let query = this.client.from(this.tableName).select('*');
      
      for (const q of this.queryChain) {
        if (q.type === 'where') {
          if (q.op === '==' || q.op === '===') {
            query = query.eq(q.field, q.value);
          } else if (q.op === '!=') {
            query = query.neq(q.field, q.value);
          } else if (q.op === 'in') {
            query = query.in(q.field, q.value);
          } else if (q.op === '>') {
            query = query.gt(q.field, q.value);
          } else if (q.op === '<') {
            query = query.lt(q.field, q.value);
          } else if (q.op === '>=') {
            const val = q.value instanceof Date ? q.value.toISOString() : q.value;
            query = query.gte(q.field, val);
          } else if (q.op === '<=') {
            const val = q.value instanceof Date ? q.value.toISOString() : q.value;
            query = query.lte(q.field, val);
          }
        }
      }

      if (this.orderByField) {
        query = query.order(this.orderByField, { ascending: this.orderDirection !== 'desc' });
      }

      if (this.limitVal !== null) {
        query = query.limit(this.limitVal);
      }

      const { data, error } = await query;
      if (error) throw error;

      const client = this.client;
      const tableName = this.tableName;
      const docs = (data || []).map(row => ({
        id: row.id,
        ref: {
          update: async (updateData) => {
            const { error: updateError } = await client.from(tableName).update(updateData).eq('id', row.id);
            if (updateError) throw updateError;
          },
          delete: async () => {
            const { error: deleteError } = await client.from(tableName).delete().eq('id', row.id);
            if (deleteError) throw deleteError;
          }
        },
        data: () => row
      }));

      return {
        empty: !data || data.length === 0,
        size: docs.length,
        forEach: (fn) => docs.forEach(fn),
        docs: docs
      };
    } catch (err) {
      console.error(`Supabase DB query error on table ${this.tableName}:`, err.message);
      throw err;
    }
  }

  doc(id) {
    const client = this.client;
    const tableName = this.tableName;
    return {
      ref: this,
      get: async () => {
        try {
          const { data, error } = await client.from(tableName).select('*').eq('id', id).maybeSingle();
          if (error) throw error;
          return {
            exists: !!data,
            id: id,
            data: () => data || null
          };
        } catch (err) {
          console.error(`Supabase DB single row get error on table ${tableName} (ID: ${id}):`, err.message);
          throw err;
        }
      },
      set: async (data, options = {}) => {
        try {
          const payload = sanitizeDates({ id, ...data });
          const { error } = await client.from(tableName).upsert(payload);
          if (error) throw error;
        } catch (err) {
          console.error(`Supabase DB upsert error on table ${tableName}:`, err.message);
          throw err;
        }
      },
      update: async (data) => {
        try {
          const sanitized = sanitizeDates(data);
          const { error } = await client.from(tableName).update(sanitized).eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error(`Supabase DB update error on table ${tableName} (ID: ${id}):`, err.message);
          throw err;
        }
      },
      delete: async () => {
        try {
          const { error } = await client.from(tableName).delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          console.error(`Supabase DB delete error on table ${tableName} (ID: ${id}):`, err.message);
          throw err;
        }
      }
    };
  }

  async add(data) {
    try {
      const sanitized = sanitizeDates(data);
      const { data: insertedData, error } = await this.client.from(this.tableName).insert(sanitized).select().single();
      if (error) throw error;
      if (!insertedData?.id) throw new Error(`Insert into ${this.tableName} returned no id`);
      return {
        id: insertedData.id,
        ref: this.doc(insertedData.id)
      };
    } catch (err) {
      console.error(`Supabase DB insert error on table ${this.tableName}:`, err.message);
      throw err;
    }
  }
}

// Helper: convert JS Date objects to ISO strings (Supabase rejects raw Date objects)
function sanitizeDates(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(sanitizeDates);
  if (typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = sanitizeDates(v);
    }
    return result;
  }
  return obj;
}

// Check configuration and initialize
const isSupabaseConfigured = supabaseUrl && supabaseServiceKey && 
                            !supabaseUrl.includes('your_supabase_url') && 
                            !supabaseServiceKey.includes('your_supabase_service_role');

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    db = {
      collection: (tableName) => new SupabaseCollectionRef(supabase, tableName)
    };

    auth = {
      createUser: async (userRecord) => {
        const { data, error } = await supabase.auth.admin.createUser({
          email: userRecord.email,
          password: userRecord.password,
          email_confirm: true,
          user_metadata: { displayName: userRecord.displayName }
        });
        if (error) throw error;
        return { uid: data.user.id };
      },
      
      verifyIdToken: async (token) => {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error(error?.message || "Invalid Supabase Token");
        return {
          uid: user.id,
          email: user.email,
          role: user.app_metadata?.role || user.user_metadata?.role || 'member',
          companyId: user.app_metadata?.companyId || user.user_metadata?.companyId || null
        };
      },

      setCustomUserClaims: async (uid, claims) => {
        const { data, error } = await supabase.auth.admin.updateUserById(uid, {
          app_metadata: claims,
          user_metadata: claims
        });
        if (error) throw error;
        return data;
      },

      generatePasswordResetLink: async (email, options) => {
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo: options.url }
        });
        if (error) throw error;
        return data.properties.action_link;
      },

      getUser: async (uid) => {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(uid);
        if (error) throw error;
        return {
          uid: user.id,
          email: user.email,
          displayName: user.user_metadata?.displayName
        };
      },

      deleteUser: async (uid) => {
        const { error } = await supabase.auth.admin.deleteUser(uid);
        if (error) throw error;
      }
    };

    global.MOCK_DB = false;
    console.log("✅ Supabase Client initialized successfully with service role.");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase Client:", err.message);
    setupMockLayer();
  }
} else {
  console.warn("⚠️  WARNING: Supabase URL/Key missing. Initializing mock DB layer.");
  setupMockLayer();
}

function setupMockLayer() {
  global.MOCK_DB = true;
  
  db = {
    collection: () => {
      const queryStub = {
        where: () => queryStub,
        orderBy: () => queryStub,
        limit: () => queryStub,
        get: async () => {
          const mockRow = { id: "mock-doc-id", name: "Mock Item", status: "active", role: "teamadmin", companyId: "mock-company-id", inviteCode: "MOCK1234" };
          const mockDoc = { id: mockRow.id, data: () => mockRow, ref: { update: async () => {}, delete: async () => {} } };
          return {
            empty: false,
            size: 1,
            docs: [mockDoc],
            forEach: (fn) => [mockDoc].forEach(fn)
          };
        }
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
    deleteUser: async () => {},
    setCustomUserClaims: async () => {},
    generatePasswordResetLink: async () => "http://localhost:3001/reset-password?token=mock-reset-token"
  };
}

module.exports = { supabase, db, auth };
