import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';

// Finalize any pending auth sessions (needed on iOS/Safari when returning to the app)
WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri({
  preferLocalhost: true, // Bunu ekle, bazen IP sorunlarını çözer
});

console.log("Supabase'e gönderilen Redirect URL:", redirectTo);
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
  // 1. Google ile oturum açma işlemini başlat
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      skipBrowserRedirect: true,
      redirectTo, 
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('Google giriş bağlantısı oluşturulamadı.');

  // 2. Tarayıcıyı aç
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    throw new Error('Google girişi iptal edildi.');
  }

  // --- DEBUG İÇİN ÖNEMLİ KISIM ---
  console.log("🟢 Dönen Tam URL:", result.url);
  // ------------------------------

  const params = extractParamsFromUrl(result.url);
  
  // --- DEBUG İÇİN ÖNEMLİ KISIM ---
  console.log("🟢 Ayrıştırılan Parametreler:", params);
  // ------------------------------

  // SENARYO A: Supabase 'code' (PKCE Flow) döndürdüyse
  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
    return;
  }

  // SENARYO B: Supabase direkt 'access_token' (Implicit Flow) döndürdüyse
  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return;
  }

  // İkisi de yoksa hata fırlat
  throw new Error('Giriş başarılı ancak URL içinde code veya token bulunamadı.');
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
