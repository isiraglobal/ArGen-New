/**
 * ArGen — Supabase Client Configuration
 * Replaces firebase-config.js.
 * Dynamically fetches public keys from /api/config, then initializes the Supabase JS client.
 */

(async () => {
  let supabaseUrl = '';
  let supabaseAnonKey = '';

  // Fetch public config from backend
  try {
    const configRes = await fetch('/api/config');
    if (configRes.ok) {
      const config = await configRes.json();
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
    }
  } catch (e) {
    console.warn('[ArGen] Could not fetch /api/config:', e.message);
  }

  // If keys are not configured, skip Supabase initialization (mock mode fallback)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[ArGen] Supabase keys not configured. Operating in API-only mode.');
    window.supabaseAuthHelpers = null;
    return;
  }

  // Dynamically load Supabase JS SDK from CDN
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'argen_supabase_session'
    }
  });

  window.supabaseClient = supabaseClient;

  // --- Auth Helper Methods ---
  window.supabaseAuthHelpers = {
    /**
     * Sign in with email & password using Supabase Auth.
     * Returns the Supabase session or throws on error.
     */
    signInWithPassword: async (email, password) => {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data;
    },

    /**
     * Sign in with Google OAuth popup.
     * Redirects back to current URL after auth.
     */
    signInWithGoogle: async () => {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/oauth'
        }
      });
      if (error) throw new Error(error.message);
      return data;
    },

    /**
     * Sign out the current user.
     */
    signOut: async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw new Error(error.message);
    },

    /**
     * Get current session (access_token, user info).
     */
    getSession: async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session;
    },

    /**
     * Update user's password (e.g. for password reset).
     */
    updatePassword: async (newPassword) => {
      const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return data;
    },

    /**
     * Subscribe to auth state changes.
     */
    onAuthStateChange: (callback) => {
      return supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
    }
  };

  // Cookie helpers
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; secure; samesite=lax";
  }

  function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/; secure; samesite=lax';
  }

  // Automatically sync Supabase access_token to localStorage whenever session changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.access_token) {
      localStorage.setItem('argen_token', session.access_token);
      setCookie('argen_token', session.access_token, 7);
      console.log('[ArGen] Supabase access token synced to localStorage and cookies.');
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('argen_token');
      localStorage.removeItem('user');
      eraseCookie('argen_token');
      eraseCookie('user');
      console.log('[ArGen] Session cleared.');
    }
  });

  console.log('[ArGen] Supabase client initialized successfully.');
})();
