const keys=['news','jobs','all','newsEmpty','jobsEmpty','automatic','withdraw','restore'];
const messages={
 ko:['최신 안전 소식','안전·보건 채용정보','전체 보기','이 지역에 공개된 새 소식이 아직 없습니다.','이 지역의 채용정보를 준비하고 있습니다.','자동 수집 · 원문 확인','노출 중단','복구'],
 en:['Latest safety updates','Safety & health jobs','View all','No published updates for this region yet.','Job listings for this region are being prepared.','Automatically collected · check original','Hide listing','Restore'],
 de:['Aktuelle Arbeitsschutzmeldungen','Stellen im Arbeitsschutz','Alle anzeigen','Noch keine veröffentlichten Meldungen für diese Region.','Stellenangebote für diese Region werden vorbereitet.','Automatisch erfasst · Original prüfen','Ausblenden','Wiederherstellen'],
 ja:['安全衛生の最新情報','安全衛生の求人情報','すべて見る','この地域の公開情報はまだありません。','この地域の求人情報を準備しています。','自動収集 · 原文をご確認ください','非表示にする','再表示'],
 fr:['Actualités en santé et sécurité au travail','Emplois en santé et sécurité au travail','Tout voir','Aucune actualité publiée pour cette région.','Les offres pour cette région sont en préparation.','Collecte automatique · consulter la source','Masquer','Rétablir'],
 it:['Ultime notizie sulla sicurezza sul lavoro','Lavoro nella salute e sicurezza','Vedi tutto','Nessuna notizia pubblicata per questa regione.','Le offerte per questa regione sono in preparazione.','Raccolta automatica · verifica la fonte','Nascondi','Ripristina'],
 es:['Novedades de seguridad y salud laboral','Empleo en seguridad y salud laboral','Ver todo','Todavía no hay noticias publicadas para esta región.','Estamos preparando las ofertas de esta región.','Recopilación automática · consulta la fuente','Ocultar','Restaurar'],
 pt:['Novidades em segurança e saúde no trabalho','Vagas em segurança e saúde no trabalho','Ver todas','Ainda não há notícias publicadas para esta região.','As vagas para esta região estão em preparação.','Coleta automática · confira a fonte','Ocultar','Restaurar'],
 ru:['Новости охраны труда','Вакансии по охране труда','Смотреть все','Для этого региона пока нет опубликованных новостей.','Вакансии для этого региона готовятся.','Автоматический сбор · проверьте источник','Скрыть','Восстановить'],
 ar:['آخر أخبار السلامة والصحة المهنية','وظائف السلامة والصحة المهنية','عرض الكل','لا توجد أخبار منشورة لهذه المنطقة حتى الآن.','يجري إعداد إعلانات الوظائف لهذه المنطقة.','جمع تلقائي · راجع المصدر','إخفاء','استعادة'],
 ro:['Noutăți în securitate și sănătate în muncă','Locuri de muncă în securitate și sănătate','Vezi toate','Nu există încă noutăți publicate pentru această regiune.','Ofertele pentru această regiune sunt în pregătire.','Colectare automată · verificați sursa','Ascunde','Restabilește']
};
export const latestUi=locale=>Object.fromEntries(keys.map((k,i)=>[k,(messages[locale?.split('-')[0]]||messages.en)[i]]));
