'use strict';
// Italian is the canonical source locale. Keep product copy and controlled demo
// data centralized here so additional locale modules can be added without
// changing the interaction model.
window.OracoloV2Content = {
  locale: 'it',
  goals: [
    { id: 'skill', label: 'Trasformare una competenza in un lavoro', text: 'Voglio trasformare una mia competenza in un lavoro.', context: 'persona' },
    { id: 'community', label: 'Risolvere un problema nella mia comunità', text: 'Voglio ridurre lo spreco di cibo nel mio quartiere.', context: 'comunita' },
    { id: 'research', label: 'Verificare un’ipotesi di ricerca', text: 'Voglio capire se un materiale di recupero può sostituire quello nuovo.', context: 'ricerca' }
  ],
  contexts: [
    { id: 'persona', label: 'Per me' },
    { id: 'team', label: 'Con un team' },
    { id: 'comunita', label: 'Per una comunità' },
    { id: 'ricerca', label: 'Per una ricerca' }
  ],
  stages: [
    { id: 'intention', label: 'Intenzione', system: 'JasVerse' },
    { id: 'environment', label: 'Ambiente', system: 'MaiKore' },
    { id: 'boundaries', label: 'Confini', system: 'OSHI' },
    { id: 'experiment', label: 'Prova', system: 'JasVerse Lab' },
    { id: 'authority', label: 'Autorità', system: 'TheBossKey' },
    { id: 'result', label: 'Evidenza', system: 'JasVerse Lab' },
    { id: 'value', label: 'Economia', system: 'ByeByePrice' },
    { id: 'contribution', label: 'Contributo', system: 'JasVerse' }
  ],
  systems: {
    maikore: { name: 'MaiKore', code: 'MK', role: 'Capacità e intelligenza', note: 'Interpreta, compone, propone' },
    oshi: { name: 'OSHI', code: 'OS', role: 'Sovranità umana', note: 'Limiti, spiegazioni, revoca' },
    lab: { name: 'JasVerse Lab', code: 'JL', role: 'Prova di realtà', note: 'Ipotesi, esperimento, misura' },
    bosskey: { name: 'TheBossKey', code: 'BK', role: 'Autorità', note: 'Ambito, durata, approvazione' },
    bbp: { name: 'ByeByePrice', code: 'BB', role: 'Capacità economica', note: 'Definizione canonica ancora aperta' }
  },
  capabilities: [
    { id: 'knowledge', label: 'Conoscenza', owner: 'Commons', status: 'ready', reason: 'Serve capire domanda, vincoli e pratiche già disponibili.', contribution: 'Guida riutilizzabile per prove locali.' },
    { id: 'intelligence', label: 'Intelligenza', owner: 'MaiKore', status: 'ready', reason: 'Serve scomporre l’obiettivo e confrontare percorsi.', contribution: 'Metodo di composizione dell’obiettivo.' },
    { id: 'people', label: 'Persone', owner: 'Rete locale', status: 'candidate', reason: 'Servono primi partecipanti e una persona con esperienza complementare.', contribution: 'Relazioni e segnali di domanda.' },
    { id: 'tools', label: 'Strumenti', owner: 'Commons', status: 'reuse', reason: 'Un kit aperto esistente copre prenotazione e raccolta feedback.', contribution: 'Miglioramenti al componente condiviso.' },
    { id: 'evidence', label: 'Evidenza', owner: 'JasVerse Lab', status: 'needed', reason: 'La domanda reale è ancora sconosciuta e va misurata.', contribution: 'Risultati e limiti della prova.' },
    { id: 'capital', label: 'Capitale', owner: 'JasVerse', status: 'bounded', reason: 'Basta un budget simulato minimo; nessuna spesa avviene nel prototipo.', contribution: 'Valore misurabile e nuova capacità.' }
  ],
  truth: {
    fact: { label: 'FATTO', text: 'La persona dichiara una competenza che vuole rendere economicamente utile.' },
    evidence: { label: 'EVIDENZA', text: 'Nessuna evidenza di domanda è stata ancora raccolta.' },
    inference: { label: 'INFERENZA', text: 'Una prova locale e limitata può ridurre il rischio prima di investire.' },
    hypothesis: { label: 'IPOTESI', text: 'Almeno 5 persone su 8 richiederanno una prima sessione.' },
    probability: { label: 'PROBABILITÀ', text: 'Confidenza dimostrativa: 46%. Cambia con le scelte, non deriva da un modello reale.' },
    speculation: { label: 'SPECULAZIONE', text: 'La competenza potrebbe diventare un’attività stabile; questa idea non è ancora sostenuta dai dati.' },
    unknown: { label: 'SCONOSCIUTO', text: 'Disponibilità a pagare, ripetibilità e carico operativo.' }
  },
  experimentOutcomes: {
    promising: { label: 'Promettente', requests: 6, completed: 5, signal: 'Il criterio minimo è raggiunto.', decision: 'Ripetere con un campione diverso prima di aumentare l’investimento.' },
    inconclusive: { label: 'Non conclusivo', requests: 4, completed: 3, signal: 'Il risultato è vicino alla soglia ma non la supera.', decision: 'Correggere messaggio e orari, poi ripetere la prova.' },
    failed: { label: 'Fallito', requests: 1, completed: 1, signal: 'L’ipotesi non è sostenuta dalla prova.', decision: 'Fermare questo percorso. Conservare metodo, vincoli ed evidenze come capitale informativo.' }
  },
  activity: [
    { system: 'JasVerse', text: 'Ambiente locale pronto. Nessun motore collegato.' }
  ]
};
