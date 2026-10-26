const copy = {
  ko: ['계정 메뉴', '로그인', '마이페이지', '로그아웃', '로그아웃 중…', '로그아웃하지 못했습니다. 다시 시도해주세요.'],
  en: ['Account menu', 'Log in', 'My account', 'Log out', 'Logging out…', 'Could not log out. Please try again.'],
  ja: ['アカウントメニュー', 'ログイン', 'マイページ', 'ログアウト', 'ログアウト中…', 'ログアウトできませんでした。もう一度お試しください。'],
  de: ['Kontomenü', 'Anmelden', 'Mein Konto', 'Abmelden', 'Abmeldung läuft…', 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.'],
  fr: ['Menu du compte', 'Se connecter', 'Mon compte', 'Se déconnecter', 'Déconnexion…', 'La déconnexion a échoué. Veuillez réessayer.'],
  it: ['Menu account', 'Accedi', 'Il mio account', 'Esci', 'Disconnessione…', 'Impossibile disconnettersi. Riprova.'],
  es: ['Menú de cuenta', 'Iniciar sesión', 'Mi cuenta', 'Cerrar sesión', 'Cerrando sesión…', 'No se pudo cerrar la sesión. Inténtalo de nuevo.'],
  pt: ['Menu da conta', 'Entrar', 'Minha conta', 'Sair', 'Saindo…', 'Não foi possível sair. Tente novamente.'],
  ru: ['Меню аккаунта', 'Войти', 'Мой аккаунт', 'Выйти', 'Выход…', 'Не удалось выйти. Попробуйте ещё раз.'],
  ar: ['قائمة الحساب', 'تسجيل الدخول', 'حسابي', 'تسجيل الخروج', 'جارٍ تسجيل الخروج…', 'تعذّر تسجيل الخروج. حاول مرة أخرى.'],
  ro: ['Meniul contului', 'Autentificare', 'Contul meu', 'Deconectare', 'Deconectare…', 'Deconectarea a eșuat. Încercați din nou.'],
};

export function headerAccountUi(locale = 'en-US') {
  const [account, login, profile, logout, signingOut, error] = copy[locale.split('-')[0]] || copy.en;
  return { account, login, profile, logout, signingOut, error };
}
