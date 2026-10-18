const rows={
 ko:['비회원도 문의할 수 있습니다. 접수번호 전체를 보관하면 이 화면에서 처리 상태와 답변을 확인할 수 있습니다.','공개 조회·활용 집계는 근사치이며, 고유 이용자 수나 실제 현장 사용을 증명하지 않습니다.'],
 en:['You can submit a request without an account. Keep the full receipt code to check the status and reply here.','Public view and reuse counts are approximate; they do not represent unique people or prove use on site.'],
 de:['Anfragen sind ohne Konto möglich. Bewahren Sie den vollständigen Code auf, um hier Status und Antwort abzurufen.','Öffentliche Aufruf- und Wiederverwendungszahlen sind Näherungswerte, keine Zahl eindeutiger Personen und kein Nachweis der Nutzung vor Ort.'],
 ja:['アカウントがなくてもお問い合わせできます。受付番号全体を保管し、この画面で状況と回答を確認してください。','公開閲覧数・再利用数は概算であり、ユニーク利用者数や現場での使用実績を示すものではありません。'],
 fr:['Vous pouvez envoyer une demande sans compte. Conservez le code complet pour consulter ici son statut et la réponse.','Les nombres de vues et de réutilisations sont approximatifs ; ils ne représentent pas des personnes uniques ni une preuve d’utilisation sur site.'],
 it:['Puoi inviare una richiesta senza account. Conserva il codice completo per consultare qui lo stato e la risposta.','Visualizzazioni e riutilizzi sono approssimativi: non indicano persone uniche né provano l’uso in cantiere.'],
 es:['Puede enviar una solicitud sin cuenta. Guarde el código completo para consultar aquí el estado y la respuesta.','Las vistas y reutilizaciones son aproximadas; no representan personas únicas ni prueban el uso en obra.'],
 pt:['É possível enviar uma solicitação sem conta. Guarde o código completo para consultar aqui o status e a resposta.','Visualizações e reutilizações são aproximadas; não representam pessoas únicas nem comprovam uso no local.'],
 ru:['Можно отправить запрос без аккаунта. Сохраните полный код для проверки статуса и ответа здесь.','Счётчики просмотров и повторного использования приблизительны: они не отражают уникальных людей и не доказывают применение на объекте.'],
 ar:['يمكنك إرسال طلب دون حساب. احتفظ بالرمز الكامل لمراجعة الحالة والرد هنا.','أعداد المشاهدات وإعادة الاستخدام تقريبية ولا تمثل أشخاصًا فريدين أو تثبت الاستخدام في الموقع.'],
 ro:['Puteți trimite o cerere fără cont. Păstrați codul complet pentru a verifica aici starea și răspunsul.','Numerele de vizualizări și reutilizări sunt aproximative; nu reprezintă persoane unice și nu dovedesc utilizarea pe teren.'],
};
export function supportChannelText(locale){const [contact,metrics]=rows[locale?.split('-')[0]]||rows.en;return{contact,metrics};}
