const text={
 ko:'공개 페이지의 방문 통계·제목·유입 사이트 도메인을 Google Analytics 쿠키로 수집합니다. 지역에 따라 수집 전에 동의를 요청하며, 언제든 분석을 중지할 수 있습니다. 광고는 꺼져 있습니다.',
 en:'Google Analytics uses cookies to collect visits, public page titles and referring site domains. Depending on your region, we ask for consent before collection. You can stop analytics at any time. Advertising is disabled.',
 de:'Google Analytics erfasst mit Cookies Besuche, Titel öffentlicher Seiten und verweisende Domains. Je nach Region bitten wir vor der Erfassung um Einwilligung. Sie können die Analyse jederzeit stoppen. Werbung ist deaktiviert.',
 ja:'Google AnalyticsのCookieで訪問数、公開ページのタイトル、参照元ドメインを収集します。地域に応じて収集前に同意を求めます。解析はいつでも停止できます。広告は無効です。',
 fr:'Google Analytics utilise des cookies pour les visites, les titres des pages publiques et les domaines référents. Selon votre région, votre consentement est demandé avant la collecte. Vous pouvez arrêter l’analyse à tout moment. La publicité est désactivée.',
 it:'Google Analytics usa cookie per visite, titoli delle pagine pubbliche e domini di provenienza. In base alla regione, chiediamo il consenso prima della raccolta. Puoi interrompere l’analisi in qualsiasi momento. La pubblicità è disattivata.',
 es:'Google Analytics utiliza cookies para las visitas, los títulos de páginas públicas y los dominios de procedencia. Según su región, pedimos consentimiento antes de recopilar datos. Puede detener el análisis en cualquier momento. La publicidad está desactivada.',
 pt:'O Google Analytics usa cookies para visitas, títulos de páginas públicas e domínios de origem. Conforme a região, pedimos consentimento antes da coleta. Você pode parar a análise a qualquer momento. A publicidade está desativada.',
 ru:'Google Analytics использует cookie для сбора посещений, заголовков открытых страниц и доменов источников. В зависимости от региона мы запрашиваем согласие до сбора. Аналитику можно отключить в любой момент. Реклама отключена.',
 ar:'تستخدم Google Analytics ملفات تعريف الارتباط لجمع الزيارات وعناوين الصفحات العامة ونطاقات الإحالة. نطلب الموافقة قبل الجمع بحسب منطقتك. يمكنك إيقاف التحليلات في أي وقت. الإعلانات معطّلة.',
 ro:'Google Analytics folosește cookie-uri pentru vizite, titlurile paginilor publice și domeniile de proveniență. În funcție de regiune, cerem consimțământul înainte de colectare. Puteți opri analiza oricând. Publicitatea este dezactivată.',
};
export function analyticsRegionalText(locale){return text[locale?.split('-')[0]]||text.en;}
