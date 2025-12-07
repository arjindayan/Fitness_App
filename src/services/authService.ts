import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';

const redirectTo = AuthSession.makeRedirectUri({
  scheme: 'fitnessxs',
});

type EmailAuthPayload = {
  email: string;
  password: string;
};

export async function signInWithEmail({ email, password }: EmailAuthPayload) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error('Giriş başarısız. E-postanı doğruladığından ve bilgilerinin doğru olduğundan emin ol.');
  }

  return data.session;
}

export async function signUpWithEmail({ email, password }: EmailAuthPayload) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      skipBrowserRedirect: true,
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('Google giriş bağlantısı oluşturulamadı.');
  }

  // DEĞİŞİKLİK BURADA: startAsync yerine openAuthSessionAsync
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new Error('Google girişi iptal edildi.');
  }

  // URL'den parametreleri ayıklamamız lazım çünkü WebBrowser sadece URL döner
  const url = result.url;
  
  // URL içindeki 'code' veya token parametrelerini alıyoruz
  // Supabase genellikle URL'in query string'ine (veya hash'ine) parametre ekler
  // Basit bir yöntemle parametreleri alalım:
  const params = extractParamsFromUrl(url);

  if (!params || !params.code) { // Supabase 'code' ile dönüyor genellikle
     // Bazen refresh_token ve access_token hash (#) içinde gelebilir, kontrol etmek gerek
     // Ancak OAuth flow (PKCE) kullanıyorsan 'code' döner.
     throw new Error('Giriş başarılı ancak oturum kodu alınamadı.');
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);

  if (exchangeError) {
    throw exchangeError;
  }
}

// 3. YARDIMCI FONKSİYON (URL parsing için)
// WebBrowser bize hazır params vermez, URL string verir. Bunu parçalamak için:
function extractParamsFromUrl(url: string): { [key: string]: string } {
  const params: { [key: string]: string } = {};
  
  // Query string (?) ve Fragment (#) kısımlarını kontrol et
  const queryString = url.split('?')[1];
  const fragmentString = url.split('#')[1];

  const processPart = (part: string) => {
    part.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });
  };

  if (queryString) processPart(queryString);
  if (fragmentString) processPart(fragmentString);

  return params;
}

// signOut fonksiyonun aynı kalabilir
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    if (error.name === 'AuthSessionMissingError') {
      return;
    }
    throw error;
  }
}