import { supabase } from "./supabase";

/**
 * Retry wrapper for authentication operations
 * Handles transient network errors with exponential backoff
 */
export async function authWithRetry<T>(
  authFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await authFn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Auth attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      // Don't retry on certain errors
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("Email not confirmed") ||
        error.message?.includes("User not found") ||
        error.status === 400 || // Bad request
        error.status === 401 || // Unauthorized
        error.status === 403    // Forbidden
      ) {
        throw error; // Don't retry auth failures
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Sign in with retry logic
 */
export async function signInWithRetry(email: string, password: string) {
  return authWithRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  });
}

/**
 * Sign up with retry logic
 */
export async function signUpWithRetry(email: string, password: string, metadata?: any) {
  return authWithRetry(async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  });
}

/**
 * Reset password with retry logic
 */
export async function resetPasswordWithRetry(email: string) {
  return authWithRetry(async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  });
}

/**
 * Sign out with retry logic
 */
export async function signOutWithRetry() {
  return authWithRetry(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    return { success: true };
  }, 2); // Only 2 retries for logout
}
