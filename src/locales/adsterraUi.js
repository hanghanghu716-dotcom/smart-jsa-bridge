const rows = {
  ko: ['광고', 'Adsterra 광고를 허용하면 광고 제공·측정을 위해 IP 주소, 기기 정보와 쿠키가 사용될 수 있습니다. 선택은 개인정보처리방침에서 변경할 수 있습니다.', '광고 허용', '허용 안 함', '광고 끄기', '광고 설정', 'Adsterra 개인정보처리방침', '선택을 저장하지 못했습니다. 광고는 표시되지 않습니다.'],
  ja: ['広告', 'Adsterraの広告を許可すると、広告配信・測定にIPアドレス、端末情報、Cookieが使用される場合があります。選択はプライバシーポリシーで変更できます。', '広告を許可', '許可しない', '広告をオフ', '広告設定', 'Adsterraプライバシーポリシー', '設定を保存できませんでした。広告は表示されません。'],
  en: ['Advertisement', 'Allowing Adsterra ads may use your IP address, device information and cookies to deliver and measure ads. You can change your choice on the privacy page.', 'Allow ads', 'Decline', 'Turn off ads', 'Advertising preferences', 'Adsterra privacy policy', 'Your choice could not be saved. Ads remain off.'],
  fr: ['Publicité', 'Autoriser Adsterra peut entraîner l’utilisation de votre adresse IP, des informations sur votre appareil et de cookies pour diffuser et mesurer les publicités. Vous pouvez modifier ce choix sur la page de confidentialité.', 'Autoriser', 'Refuser', 'Désactiver les publicités', 'Préférences publicitaires', 'Confidentialité Adsterra', 'Impossible d’enregistrer votre choix. Les publicités restent désactivées.'],
  de: ['Werbung', 'Wenn Sie Adsterra-Werbung erlauben, können IP-Adresse, Geräteinformationen und Cookies zur Auslieferung und Messung von Werbung verwendet werden. Die Auswahl lässt sich auf der Datenschutzseite ändern.', 'Werbung erlauben', 'Ablehnen', 'Werbung ausschalten', 'Werbeeinstellungen', 'Adsterra-Datenschutz', 'Die Auswahl konnte nicht gespeichert werden. Werbung bleibt deaktiviert.'],
  es: ['Publicidad', 'Al permitir anuncios de Adsterra, se pueden usar su dirección IP, información del dispositivo y cookies para mostrar y medir anuncios. Puede cambiar su elección en la página de privacidad.', 'Permitir anuncios', 'Rechazar', 'Desactivar anuncios', 'Preferencias de publicidad', 'Privacidad de Adsterra', 'No se pudo guardar su elección. Los anuncios siguen desactivados.'],
  it: ['Pubblicità', 'Consentendo gli annunci Adsterra, indirizzo IP, informazioni sul dispositivo e cookie possono essere usati per mostrare e misurare gli annunci. La scelta può essere modificata nella pagina della privacy.', 'Consenti annunci', 'Rifiuta', 'Disattiva annunci', 'Preferenze pubblicitarie', 'Privacy Adsterra', 'Impossibile salvare la scelta. Gli annunci restano disattivati.'],
  pt: ['Publicidade', 'Ao permitir anúncios da Adsterra, seu endereço IP, informações do dispositivo e cookies podem ser usados para exibir e medir anúncios. Você pode alterar a escolha na página de privacidade.', 'Permitir anúncios', 'Recusar', 'Desativar anúncios', 'Preferências de publicidade', 'Privacidade da Adsterra', 'Não foi possível salvar sua escolha. Os anúncios continuam desativados.'],
  ru: ['Реклама', 'При разрешении рекламы Adsterra IP-адрес, данные устройства и cookie могут использоваться для показа и измерения рекламы. Выбор можно изменить на странице конфиденциальности.', 'Разрешить рекламу', 'Отклонить', 'Отключить рекламу', 'Настройки рекламы', 'Конфиденциальность Adsterra', 'Не удалось сохранить выбор. Реклама отключена.'],
  ro: ['Publicitate', 'Dacă permiteți reclamele Adsterra, adresa IP, informațiile dispozitivului și modulele cookie pot fi folosite pentru afișarea și măsurarea reclamelor. Puteți modifica alegerea pe pagina de confidențialitate.', 'Permite reclame', 'Refuză', 'Oprește reclamele', 'Preferințe publicitare', 'Confidențialitate Adsterra', 'Alegerea nu a putut fi salvată. Reclamele rămân oprite.'],
  ar: ['إعلان', 'قد يستخدم السماح بإعلانات Adsterra عنوان IP ومعلومات الجهاز وملفات تعريف الارتباط لعرض الإعلانات وقياسها. يمكنك تغيير اختيارك في صفحة الخصوصية.', 'السماح بالإعلانات', 'رفض', 'إيقاف الإعلانات', 'تفضيلات الإعلانات', 'خصوصية Adsterra', 'تعذر حفظ اختيارك. ستبقى الإعلانات متوقفة.'],
};
const notices = {
  "ko": "무료 서비스 운영을 위해 Adsterra 광고를 표시합니다. 광고 제공·측정에 IP 주소, 기기 정보와 쿠키가 사용될 수 있습니다.",
  "ja": "無料サービスの運営のためAdsterra広告を掲載しています。広告の配信・測定にIPアドレス、端末情報、Cookieが使用される場合があります。",
  "en": "Adsterra ads support this free service. IP addresses, device information and cookies may be used to deliver and measure ads.",
  "fr": "Les publicités Adsterra financent ce service gratuit. L’adresse IP, les informations sur l’appareil et les cookies peuvent servir à diffuser et mesurer les publicités.",
  "de": "Adsterra-Werbung finanziert diesen kostenlosen Dienst. IP-Adresse, Geräteinformationen und Cookies können zur Auslieferung und Messung von Werbung verwendet werden.",
  "es": "Los anuncios de Adsterra financian este servicio gratuito. Pueden utilizarse la dirección IP, información del dispositivo y cookies para mostrar y medir anuncios.",
  "it": "Gli annunci Adsterra sostengono questo servizio gratuito. Indirizzo IP, informazioni sul dispositivo e cookie possono essere usati per mostrare e misurare gli annunci.",
  "pt": "Os anúncios da Adsterra apoiam este serviço gratuito. Endereço IP, informações do dispositivo e cookies podem ser usados para exibir e medir anúncios.",
  "ru": "Реклама Adsterra поддерживает этот бесплатный сервис. IP-адрес, данные устройства и cookie могут использоваться для показа и измерения рекламы.",
  "ro": "Reclamele Adsterra susțin acest serviciu gratuit. Adresa IP, informațiile dispozitivului și modulele cookie pot fi folosite pentru afișarea și măsurarea reclamelor.",
  "ar": "تدعم إعلانات Adsterra هذه الخدمة المجانية. قد تُستخدم عناوين IP ومعلومات الجهاز وملفات تعريف الارتباط لعرض الإعلانات وقياسها."
};
export function adsterraUi(locale = 'en') {
  const [label, body, allow, deny, disable, settings, privacy, error] = rows[locale.split('-')[0]] || rows.en;
  return { label, body, allow, deny, disable, settings, privacy, error, notice: notices[locale.split('-')[0]] || notices.en };
}
