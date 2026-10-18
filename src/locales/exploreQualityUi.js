const keys = 'excerpt|warningTitle|warningHint|step|hazard|title|details|controls|context|more'.split('|');
const rows = {
  "ko": [
    "본문 발췌",
    "게시 전 문자 확인",
    "입력 오류로 보이는 문자가 있습니다. 아래 위치를 확인해 주세요. 원문은 자동으로 수정하지 않으며, 공개 저장은 계속할 수 있습니다.",
    "작업단계",
    "위험요인",
    "제목",
    "작업 내용",
    "안전대책",
    "공개 설명",
    "총 {count}곳 · 처음 5곳 표시"
  ],
  "en": [
    "From the document",
    "Check text before publishing",
    "Some characters may be typing errors. Check the locations below. Your text is not changed automatically, and you can still publish.",
    "Step",
    "Hazard",
    "Title",
    "Work details",
    "Controls",
    "Publication context",
    "{count} locations · showing the first 5"
  ],
  "ja": [
    "本文からの抜粋",
    "公開前の文字確認",
    "入力ミスの可能性がある文字を検出しました。以下の箇所をご確認ください。本文は自動変更されず、そのまま公開することもできます。",
    "作業手順",
    "危険要因",
    "タイトル",
    "作業内容",
    "対策",
    "公開情報",
    "全{count}か所 · 最初の5か所を表示"
  ],
  "de": [
    "Aus dem Dokument",
    "Text vor Veröffentlichung prüfen",
    "Einige Zeichen könnten Tippfehler sein. Prüfen Sie die folgenden Stellen. Ihr Text wird nicht automatisch geändert; die Veröffentlichung bleibt möglich.",
    "Schritt",
    "Gefahr",
    "Titel",
    "Arbeitsbeschreibung",
    "Maßnahmen",
    "Angaben zur Veröffentlichung",
    "{count} Stellen · die ersten 5 werden angezeigt"
  ],
  "fr": [
    "Extrait du document",
    "Vérifier le texte avant publication",
    "Certains caractères peuvent être des fautes de frappe. Vérifiez les passages ci-dessous. Le texte n’est pas modifié automatiquement et vous pouvez toujours publier.",
    "Étape",
    "Danger",
    "Titre",
    "Description du travail",
    "Mesures",
    "Informations de publication",
    "{count} passages · affichage des 5 premiers"
  ],
  "es": [
    "Extracto del documento",
    "Revisar el texto antes de publicar",
    "Algunos caracteres podrían ser errores de escritura. Revise los pasajes indicados. El texto no se modifica automáticamente y puede continuar con la publicación.",
    "Paso",
    "Peligro",
    "Título",
    "Descripción del trabajo",
    "Medidas",
    "Información de publicación",
    "{count} ubicaciones · se muestran las primeras 5"
  ],
  "it": [
    "Estratto dal documento",
    "Controlla il testo prima di pubblicare",
    "Alcuni caratteri potrebbero essere errori di battitura. Controlla i punti indicati. Il testo non viene modificato automaticamente e puoi comunque pubblicare.",
    "Fase",
    "Pericolo",
    "Titolo",
    "Descrizione del lavoro",
    "Misure",
    "Informazioni di pubblicazione",
    "{count} punti · visualizzati i primi 5"
  ],
  "pt": [
    "Trecho do documento",
    "Confira o texto antes de publicar",
    "Alguns caracteres podem ser erros de digitação. Confira os trechos abaixo. O texto não é alterado automaticamente e você ainda pode publicar.",
    "Etapa",
    "Perigo",
    "Título",
    "Descrição do trabalho",
    "Medidas",
    "Informações de publicação",
    "{count} locais · mostrando os primeiros 5"
  ],
  "ru": [
    "Выдержка из документа",
    "Проверьте текст перед публикацией",
    "Некоторые символы могут быть опечатками. Проверьте указанные места. Текст не изменяется автоматически; публикация остаётся доступной.",
    "Этап",
    "Опасность",
    "Заголовок",
    "Описание работы",
    "Меры",
    "Сведения о публикации",
    "Мест: {count} · показаны первые 5"
  ],
  "ar": [
    "مقتطف من المستند",
    "راجع النص قبل النشر",
    "قد تكون بعض الأحرف أخطاء مطبعية. راجع المواضع أدناه. لا يتغير النص تلقائياً ويمكنك متابعة النشر.",
    "الخطوة",
    "الخطر",
    "العنوان",
    "تفاصيل العمل",
    "التدابير",
    "معلومات النشر",
    "{count} مواضع · عرض أول 5"
  ],
  "ro": [
    "Extras din document",
    "Verificați textul înainte de publicare",
    "Unele caractere pot fi greșeli de tastare. Verificați pasajele de mai jos. Textul nu este modificat automat și puteți continua publicarea.",
    "Etapă",
    "Pericol",
    "Titlu",
    "Descrierea lucrării",
    "Măsuri",
    "Informații de publicare",
    "{count} locuri · sunt afișate primele 5"
  ]
};
export function getExploreQualityUi(locale) {
  const values = rows[String(locale || '').split('-')[0]] || rows.en;
  return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
}
