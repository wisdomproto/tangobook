import { supabase } from '@/lib/supabase';

export const authApi = {
  async signUp(email: string, password: string) {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  async signInWithKakao() {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  async signInWithFacebook() {
    const redirectTo = `${window.location.origin}/login/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  async setPin(rawPin: string) {
    const { error } = await supabase.rpc('set_pin', { raw_pin: rawPin });
    if (error) throw error;
  },

  async verifyPin(rawPin: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('verify_pin', { raw_pin: rawPin });
    if (error) throw error;
    return data === true;
  },

  async deleteAccount() {
    const { error } = await supabase.rpc('delete_self_account');
    if (error) throw error;
    await supabase.auth.signOut();
  },

  async requestPinReset(email: string) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-pin`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ email }),
    });
    // 항상 성공 취급 (enumeration 방지)
  },
};
