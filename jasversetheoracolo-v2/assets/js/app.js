'use strict';
(() => {
  const content = window.OracoloV2Content;
  const workspace = document.querySelector('#workspace');
  const dialog = document.querySelector('#module-dialog');
  const dialogContent = document.querySelector('#module-content');
  const toast = document.querySelector('#toast');
  const stageIds = content.stages.map(stage => stage.id);

  const initialState = () => ({
    stage: 'intention', visited: ['intention'], ready: false,
    goal: '', goalId: '', context: 'persona', strategy: 'reuse',
    mode: 'assisted', memory: true, explanations: true, share: false,
    blockPurchase: true, blockPublish: true, blockPersonalData: true,
    approvalThreshold: 30, paused: false, revoked: false,
    authorized: false, denied: false, trialSize: 8, metric: 'richieste',
    demoOutcome: 'promising', ran: false, result: null,
    economicChoice: 'reuse', contributions: { knowledge: true, evidence: true, component: false, value: false },
    completed: false, openModule: '', moduleTab: '', inspectedCapability: '', selectedFlow: 'knowledge',
    activity: content.activity.map(item => ({ ...item }))
  });
  let state = initialState();

  const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const clamp = (text, length = 68) => text.length > length ? `${text.slice(0, length - 1)}…` : text;
  const modeLabels = { manual: 'Manuale', assisted: 'Assistita', delegated: 'Delegata', autonomous: 'Autonoma' };
  const modeDescriptions = {
    manual: 'Prepari e avvii ogni passaggio. JasVerse mostra soltanto strumenti e conseguenze.',
    assisted: 'JasVerse prepara proposte. Tu scegli, modifichi e autorizzi le azioni sensibili.',
    delegated: 'JasVerse può preparare un compito delimitato. Autorità e durata restano esplicite.',
    autonomous: 'La preparazione ordinaria può procedere entro le regole. Le soglie bloccano le azioni sensibili.'
  };
  const truthBadge = key => `<span class="truth-badge ${key}">${content.truth[key].label}</span>`;
  const currentStage = () => content.stages.find(stage => stage.id === state.stage) || content.stages[0];
  const systemAvailable = id => ({
    maikore: state.ready, oshi: true, lab: state.ready,
    bosskey: state.visited.includes('authority') || state.authorized || state.ran,
    bbp: state.ran || state.visited.includes('value') || state.visited.includes('contribution')
  })[id];

  function addActivity(system, text) {
    state.activity.unshift({ system, text });
    state.activity = state.activity.slice(0, 8);
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function visit(stage) {
    if (!state.visited.includes(stage)) state.visited.push(stage);
  }

  function goStage(stage, focus = true) {
    if (!stageIds.includes(stage) || (!state.visited.includes(stage) && stage !== 'intention')) return;
    state.stage = stage;
    if (location.hash !== `#${stage}`) location.hash = stage;
    else render(focus);
  }

  function workspaceHeader(system, title, copy, status) {
    return `<header class="workspace-header"><div class="workspace-header__copy"><span class="overline">${system}</span><h1>${title}</h1><p>${copy}</p></div><span class="state-chip">${status}</span></header>`;
  }

  function renderIntention() {
    const goals = content.goals.map(goal => `<button type="button" class="goal-option" data-goal="${goal.id}" aria-pressed="${state.goalId === goal.id}">${goal.label}</button>`).join('');
    const contexts = content.contexts.map(context => `<option value="${context.id}" ${state.context === context.id ? 'selected' : ''}>${context.label}</option>`).join('');
    return `<section class="entry-surface" aria-labelledby="entry-title">
      <div class="entry-kicker">AMBIENTE DI CAPACITÀ · DATI DIMOSTRATIVI</div>
      <h1 id="entry-title">Cosa vuoi rendere <em>possibile?</em></h1>
      <form class="intention-form" id="intention-form">
        <div class="intent-input-row"><div><label for="goal-input">LA TUA INTENZIONE</label><textarea id="goal-input" maxlength="260" placeholder="Descrivi un risultato che conta per te…">${escapeHTML(state.goal)}</textarea></div><button class="primary-action" type="submit">Assembla ambiente <span class="arrow">→</span></button></div>
        <div class="demo-goals"><span>OPPURE PROVA UN OBIETTIVO CONTROLLATO</span><div class="goal-list">${goals}</div></div>
        <div class="context-row"><label for="context-select">Contesto utile alla simulazione</label><select id="context-select">${contexts}</select></div>
      </form>
    </section>`;
  }

  function renderEnvironment() {
    const capabilities = content.capabilities.map(capability => `<button type="button" class="capability-node" data-capability="${capability.id}" data-status="${capability.status}"><span class="node-status"></span><span><strong>${capability.label}</strong><small>${capability.owner}</small></span><em>ISPEZIONA</em></button>`).join('');
    const confidence = state.strategy === 'reuse' ? 58 : state.strategy === 'adapt' ? 49 : 34;
    const choices = [
      ['reuse', 'Riusa una soluzione esistente', 'Riduce tempo e rischio. Il kit resta adattabile.'],
      ['adapt', 'Combina componenti disponibili', 'Più lavoro di integrazione, maggiore controllo.'],
      ['build', 'Costruisci da zero', 'Più lento e costoso; utile solo con una differenza verificabile.']
    ].map(([id, title, copy]) => `<label class="choice-row"><input type="radio" name="strategy" value="${id}" ${state.strategy === id ? 'checked' : ''}><span><strong>${title}</strong><small>${copy}</small></span></label>`).join('');
    return `${workspaceHeader('MAIKORE · COMPOSIZIONE ATTIVA','Le capacità si organizzano intorno alla tua intenzione.','Apri ogni oggetto per vedere perché è presente, cosa sa e cosa resta incerto.','AMBIENTE ASSEMBLATO')}
      ${state.paused ? '<div class="paused-banner">L’assistenza è in pausa. Puoi ispezionare lo stato, ma nessuna nuova preparazione procede.</div>' : ''}
      <div class="environment-grid"><section class="capability-field" aria-label="Ambiente delle capacità"><div class="field-topline"><span>OBIETTIVO ATTIVO</span><span>CONTROLLO: ${modeLabels[state.mode].toUpperCase()}</span></div><div class="human-core"><div><span>AL CENTRO</span><strong>${escapeHTML(clamp(state.goal, 48))}</strong><small>La tua intenzione</small></div></div><div class="capability-lines">${capabilities}</div></section>
      <aside class="decision-inspector"><span class="overline">SCELTA DI PERCORSO</span><h2>Prima riusare. Poi costruire.</h2><p>MaiKore confronta tre percorsi controllati. Nessuna ricerca esterna è stata eseguita.</p><div class="choice-stack">${choices}</div><div class="confidence"><label><span>CONFIDENZA DEL PERCORSO</span><strong>${confidence}% · IPOTESI</strong></label><div class="confidence-meter"><i style="width:${confidence}%"></i></div></div><div class="reason-line">${truthBadge('inference')}<span>La soluzione riutilizzabile sembra il primo passo con rischio minore.</span></div><div class="actions"><button class="secondary-action" type="button" data-module="maikore">Apri MaiKore</button><span class="spacer"></span><button class="primary-action" type="button" data-action="to-boundaries" ${state.paused ? 'disabled' : ''}>Definisci i confini <span class="arrow">→</span></button></div></aside></div>`;
  }

  function modeSwitch() {
    return `<div class="mode-switch" role="group" aria-label="Livello di automazione">${Object.entries(modeLabels).map(([id, label]) => `<button type="button" data-mode="${id}" aria-pressed="${state.mode === id}">${label}</button>`).join('')}</div>`;
  }

  function toggleRow(setting, title, copy, checked = state[setting]) {
    return `<div class="setting-row"><div><strong>${title}</strong><small>${copy}</small></div><label class="toggle"><input type="checkbox" data-setting="${setting}" ${checked ? 'checked' : ''}><i aria-hidden="true"></i><span class="sr-only"></span></label></div>`;
  }

  function renderBoundaries() {
    return `${workspaceHeader('OSHI · COSTITUZIONE PERSONALE','La capacità cambia comportamento quando cambi i confini.','Questi controlli governano la simulazione e restano modificabili o revocabili.','CONTROLLO UMANO ATTIVO')}
      <div class="boundary-workspace"><section class="governance-console"><span class="overline">LIVELLO DI AUTOMAZIONE</span><h2>${modeLabels[state.mode]}</h2><p class="small-copy">${modeDescriptions[state.mode]}</p>${modeSwitch()}
      ${toggleRow('explanations','Spiega prima di proporre','Mostra motivo, ipotesi e incognite per ogni proposta.')}
      ${toggleRow('memory','Mantieni contesto in questa sessione','Memoria volatile: il reset o la chiusura la eliminano.')}
      ${toggleRow('share','Contributo ai beni comuni','Solo evidenze e apprendimento selezionati; mai l’intenzione personale.')}
      <div class="setting-row threshold-row"><div><strong>Soglia di approvazione</strong><small>Oltre la soglia, TheBossKey richiede una decisione esplicita.</small></div><div><input type="range" min="0" max="100" step="10" value="${state.approvalThreshold}" data-setting="approvalThreshold" aria-label="Soglia di approvazione"><strong>${state.approvalThreshold}</strong></div></div>
      <div class="actions"><button class="danger-action" type="button" data-action="toggle-pause">${state.paused ? 'Riprendi assistenza' : 'Metti in pausa'}</button><button class="danger-action" type="button" data-action="revoke">Revoca deleghe</button><span class="spacer"></span><button class="primary-action" type="button" data-action="to-experiment" ${state.paused ? 'disabled' : ''}>Prepara una prova <span class="arrow">→</span></button></div></section>
      <aside class="live-policy"><span class="overline">POLITICA EFFETTIVA</span><h2>Quello che il sistema può fare ora</h2><p>La politica deriva direttamente dai controlli a sinistra.</p><ul class="policy-list"><li><span>Preparare proposte</span><strong>${state.paused ? 'BLOCCATO' : state.mode === 'manual' ? 'SU RICHIESTA' : 'CONSENTITO'}</strong></li><li><span>Avviare una prova</span><strong>APPROVAZIONE</strong></li><li><span>Spendere denaro reale</span><strong>${state.blockPurchase ? 'BLOCCATO' : 'APPROVAZIONE'}</strong></li><li><span>Pubblicare o contattare persone</span><strong>${state.blockPublish ? 'BLOCCATO' : 'APPROVAZIONE'}</strong></li><li><span>Condividere apprendimento</span><strong>${state.share ? 'SELETTIVO' : 'PRIVATO'}</strong></li><li><span>Spiegazione richiesta</span><strong>${state.explanations ? 'SÌ' : 'SOLO SU RICHIESTA'}</strong></li></ul><div class="actions"><button class="secondary-action" type="button" data-module="oshi" style="color:inherit;border-color:#76858a">Ispeziona permessi</button><button class="secondary-action" type="button" data-action="override-manual" style="color:inherit;border-color:#76858a">Override manuale</button></div></aside></div>`;
  }

  function truthLedger() {
    return Object.entries(content.truth).map(([key, item]) => `<div class="truth-item">${truthBadge(key)}<p>${item.text}</p></div>`).join('');
  }

  function renderExperiment() {
    const outcomes = Object.entries(content.experimentOutcomes).map(([id, result]) => `<label><input type="radio" name="demoOutcome" value="${id}" ${state.demoOutcome === id ? 'checked' : ''}> ${result.label}</label>`).join('');
    const authorization = state.authorized ? 'AUTORIZZAZIONE MONOUSO DISPONIBILE' : state.denied ? 'RICHIESTA NEGATA' : 'AUTORIZZAZIONE NECESSARIA';
    return `${workspaceHeader('JASVERSE LAB · PROVA DI REALTÀ','Un’ipotesi piccola, misurabile e reversibile.','Il protocollo usa soltanto dati prestabiliti. Nessuna persona viene contattata e nessuna risorsa viene spesa.',state.ran ? 'PROVA COMPLETATA' : 'PROTOCOLLO IN BOZZA')}
      ${state.paused ? '<div class="paused-banner">OSHI ha sospeso l’assistenza. La prova resta una bozza ispezionabile.</div>' : ''}
      <div class="lab-grid"><section class="lab-sheet"><div class="lab-sheet__header"><h2>Registro della verità</h2><span>OGNI AFFERMAZIONE HA UNO STATO</span></div><div class="truth-ledger">${truthLedger()}</div></section>
      <aside class="experiment-editor"><span class="overline">PROTOCOLLO MODIFICABILE</span><h2>Prova locale a rischio limitato</h2><p>Offri sessioni dimostrative e misura richieste e completamenti.</p><div class="field-group"><label for="trial-size">DIMENSIONE DELLA PROVA</label><select id="trial-size" data-setting="trialSize"><option value="4" ${state.trialSize === 4 ? 'selected' : ''}>4 posti · prova minima</option><option value="8" ${state.trialSize === 8 ? 'selected' : ''}>8 posti · prova bilanciata</option><option value="12" ${state.trialSize === 12 ? 'selected' : ''}>12 posti · maggiore evidenza</option></select></div><div class="field-group"><label for="metric-select">MISURA PRIMARIA</label><select id="metric-select" data-setting="metric"><option value="richieste" ${state.metric === 'richieste' ? 'selected' : ''}>Richieste qualificate</option><option value="completamenti" ${state.metric === 'completamenti' ? 'selected' : ''}>Sessioni completate</option><option value="ritorno" ${state.metric === 'ritorno' ? 'selected' : ''}>Intenzione di tornare</option></select></div><fieldset class="field-group" style="border-left:0;border-right:0;border-bottom:0"><legend>ESITO DELLA DEMO · PRESTABILITO</legend><div class="outcome-scenarios">${outcomes}</div></fieldset><div class="authorization-status" data-authorized="${state.authorized}"><i></i><span>${authorization}</span></div><div class="actions">${state.authorized ? `<button class="primary-action" type="button" data-action="run-experiment" ${state.paused ? 'disabled' : ''}>Avvia prova simulata <span class="arrow">→</span></button>` : `<button class="primary-action" type="button" data-action="request-authority" ${state.paused ? 'disabled' : ''}>Richiedi autorizzazione <span class="arrow">→</span></button>`}<button class="secondary-action" type="button" data-module="lab">Apri Lab</button></div></aside></div>`;
  }

  function renderAuthority() {
    const identity = state.context === 'team' ? 'Responsabile del team · sessione locale' : 'Tu · sessione locale';
    return `${workspaceHeader('THEBOSSKEY · AUTORITÀ CONTESTUALE','Una capacità disponibile non è un’autorizzazione.','La richiesta riguarda una sola prova fittizia e termina quando la prova viene eseguita.','DECISIONE RICHIESTA')}
      <section class="authority-sheet"><div class="authority-head"><div class="authority-seal">BK</div><div><h2>Richiesta di autorità limitata</h2><p>Nessuna autenticazione reale, biometria o verifica d’identità.</p></div><span>${state.denied ? 'NEGATA' : 'IN ATTESA'}</span></div><div class="receipt-grid"><div class="receipt-cell"><span>IDENTITÀ NEL CONTESTO</span><strong>${identity}</strong></div><div class="receipt-cell"><span>AZIONE RICHIESTA</span><strong>Eseguire una prova dimostrativa</strong></div><div class="receipt-cell"><span>AMBITO</span><strong>${state.trialSize} posti · metrica “${state.metric}”</strong></div><div class="receipt-cell"><span>DURATA</span><strong>Una sola esecuzione</strong></div><div class="receipt-cell"><span>DELEGA</span><strong>Preparazione ${modeLabels[state.mode].toLowerCase()}</strong></div><div class="receipt-cell"><span>AZIONI ESTERNE</span><strong>0 · completamente bloccate</strong></div></div><p class="authority-note">TheBossKey certifica la decisione soltanto dentro questa simulazione. L’approvazione non abilita acquisti, pubblicazione, contatti o trasferimenti di dati.</p><div class="authority-actions"><button class="secondary-action" type="button" data-action="edit-experiment">Modifica protocollo</button><button class="danger-action" type="button" data-action="deny-authority">Nega</button><button class="primary-action" type="button" data-action="approve-authority">Approva una volta <span class="arrow">→</span></button></div></section>`;
  }

  function renderResult() {
    const result = state.result || content.experimentOutcomes[state.demoOutcome];
    const ratio = Math.round(result.requests / state.trialSize * 100);
    const information = state.demoOutcome === 'failed'
      ? ['L’offerta iniziale non ha generato domanda sufficiente.','Metodo e strumenti restano riutilizzabili.','Il fallimento evita un investimento più grande.']
      : ['Il metodo produce un segnale misurabile.','La prova non dimostra ancora ripetibilità.','Il protocollo può essere riusato da un altro gruppo.'];
    return `${workspaceHeader('JASVERSE LAB · RICEVUTA DI ESPERIMENTO','Il sistema mostra ciò che è successo e ciò che non può ancora concludere.','L’autorizzazione monouso è scaduta. Tutti i valori sono dati dimostrativi.',`ESITO: ${result.label.toUpperCase()}`)}
      <div class="result-layout"><section class="result-receipt"><div class="result-head"><div><span class="overline">ESPERIMENTO JV-DEMO-01</span><h2>${result.signal}</h2></div><span class="result-status ${state.demoOutcome}">${result.label.toUpperCase()}</span></div><div class="measurements"><div class="measurement"><strong>${state.trialSize}</strong><span>posti nella prova</span></div><div class="measurement"><strong>${result.requests}</strong><span>richieste simulate</span></div><div class="measurement"><strong>${ratio}%</strong><span>segnale sulla capacità</span></div></div><div class="result-analysis"><div class="analysis-row">${truthBadge('evidence')}<p>${result.requests} richieste e ${result.completed} completamenti nel dataset controllato.</p></div><div class="analysis-row">${truthBadge('inference')}<p>${result.signal}</p></div><div class="analysis-row">${truthBadge('unknown')}<p>Domanda reale, disponibilità a pagare, qualità e sostenibilità restano sconosciute.</p></div><div class="analysis-row">${truthBadge('hypothesis')}<p>${result.decision}</p></div></div><div class="actions"><button class="secondary-action" type="button" data-action="edit-experiment">Rivedi la prova</button><button class="secondary-action" type="button" data-module="lab">Ispeziona evidenze</button><span class="spacer"></span><button class="primary-action" type="button" data-action="to-value">Esamina il valore <span class="arrow">→</span></button></div></section>
      <aside class="information-capital"><span class="overline">CAPITALE INFORMATIVO</span><h2>${state.demoOutcome === 'failed' ? 'Il fallimento non scompare.' : 'L’apprendimento può comporsi.'}</h2><ul>${information.map(item => `<li>${item}</li>`).join('')}</ul><p class="small-copy">Condivisione: <strong>${state.share ? 'consentita per elementi selezionati' : 'bozza privata'}</strong></p></aside></div>`;
  }

  function economicValues() {
    return {
      reuse: { cost: 48, label: 'Riusa kit aperto', copy: 'Adattamento minimo e prova locale.' },
      combine: { cost: 92, label: 'Combina più componenti', copy: 'Maggiore integrazione e controllo.' },
      build: { cost: 180, label: 'Costruisci da zero', copy: 'Costo opportunità più alto.' }
    };
  }

  function renderValue() {
    const options = economicValues();
    const selected = options[state.economicChoice];
    const avoided = options.build.cost - selected.cost;
    const optionHTML = Object.entries(options).map(([id, option]) => `<label class="economic-option"><input type="radio" name="economicChoice" value="${id}" ${state.economicChoice === id ? 'checked' : ''}><span><strong>${option.label}</strong><small>${option.copy}</small></span><output>${option.cost} crediti</output></label>`).join('');
    return `${workspaceHeader('BYEBYEPRICE · SUPERFICIE ECONOMICA APERTA','Proteggere la capacità economica prima di spendere.','ByeByePrice è qui usato soltanto per esplorare costo, alternativa e valore. La sua definizione canonica resta aperta.','NESSUN PREZZO REALE')}
      <div class="economic-layout"><section class="economic-console"><div class="economic-head"><span class="overline">CONFRONTO DIMOSTRATIVO</span><h2>Quanto costa imparare la prossima cosa?</h2><p>I “crediti” sono un’unità fittizia. Non rappresentano euro, offerte o prezzi.</p></div><div class="economic-options">${optionHTML}</div><div class="actions" style="padding:0 20px 20px"><button class="secondary-action" type="button" data-module="bbp">Apri ByeByePrice</button><span class="spacer"></span><button class="primary-action" type="button" data-action="to-contribution">Vedi cosa ritorna <span class="arrow">→</span></button></div></section>
      <aside class="value-protection"><span class="overline">CAPACITÀ ECONOMICA PERSONALE</span><div class="value-total">${avoided}</div><span>CREDITI DI COSTO OPPORTUNITÀ EVITATO</span><div class="value-rule"><span>Costo massimo simulato</span><strong>180</strong></div><div class="value-rule"><span>Percorso selezionato</span><strong>${selected.cost}</strong></div><div class="value-rule"><span>Quota JasVerse</span><strong>0 in questa prova</strong></div><p class="open-definition">BBP potrebbe misurare risparmio, protezione e opportunità economica. Questo prototipo non congela la sua missione finale.</p></aside></div>`;
  }

  function renderContribution() {
    const isFailed = state.demoOutcome === 'failed';
    const contributions = [
      ['knowledge', 'Conoscenza', isFailed ? 'Perché il percorso non ha funzionato.' : 'Metodo per una prova a rischio limitato.'],
      ['evidence', 'Evidenza', `${state.result?.requests || 0} richieste nel dataset dimostrativo.`],
      ['component', 'Componente', 'Adattamento del kit aperto di prenotazione.'],
      ['value', 'Valore', 'Nessun capitale reale; soltanto costo opportunità simulato.']
    ];
    const destinations = [['Commons','Metodi e componenti riusabili'],['Ricerca','Evidenze e incognite'],['Nuova prova','Un punto di partenza migliore']];
    const flowDetails = {
      knowledge: ['Commons', 'Metodo, vincoli e componente selezionato possono diventare capacità riusabile. La persona decide ogni elemento.'],
      evidence: ['Ricerca', 'Risultato, stato di verità e incognite possono alimentare nuova conoscenza senza includere dati personali.'],
      next: ['Nuova prova', 'L’apprendimento prepara un’altra iterazione; non la avvia e non trasferisce autorità.']
    };
    const inspectedFlow = flowDetails[state.selectedFlow || 'next'];
    const flowRows = destinations.map(([name, copy], index) => `<div class="flow-path" data-active="${Object.values(state.contributions)[index] || index === 2}"></div><button type="button" class="flow-entity destination" data-flow="${['knowledge','evidence','next'][index]}"><strong>${name}</strong><small>${copy}</small></button>`).join('');
    const options = contributions.map(([id, label, copy]) => `<label class="contribution-option"><input type="checkbox" data-contribution="${id}" ${state.contributions[id] ? 'checked' : ''}><span><strong>${label}</strong><small>${copy}</small></span></label>`).join('');
    return `${workspaceHeader('JASVERSE · PROTOCOLLO DI CONTRIBUTO','Il risultato resta tuo. Scegli cosa può aumentare la capacità di altri.','Ogni flusso è ispezionabile, revocabile finché resta una bozza e governato dal consenso.','FLUSSI SIMULATI')}
      <div class="flow-layout"><section class="flow-canvas"><div class="field-topline"><span>MOTHER LAYER · FLUSSI ATTIVI</span><span>${state.completed ? 'CONTRIBUTO REGISTRATO NELLA DEMO' : 'BOZZA LOCALE'}</span></div><div class="flow-map"><div class="flow-entity human"><strong>Tu + progetto autonomo</strong><small>${escapeHTML(clamp(state.goal, 78))}</small></div>${flowRows}</div><div class="reason-line" style="margin-top:18px">${truthBadge(isFailed ? 'evidence' : 'inference')}<span>${isFailed ? 'Il fallimento diventa informazione riusabile, senza essere trasformato in una storia di successo.' : 'Un figlio resta autonomo e restituisce soltanto ciò che scegli di contribuire.'}</span></div></section>
      <aside class="flow-inspector"><span class="overline">COSA PUÒ TORNARE</span><h2>Contributo selettivo</h2><p class="small-copy">I dati personali e l’intenzione completa restano esclusi.</p><div class="selected-flow"><span>FLUSSO ISPEZIONATO</span><strong>${inspectedFlow[0]}</strong><p>${inspectedFlow[1]}</p></div>${options}<div class="final-choice"><p class="small-copy">Consenso OSHI: <strong>${state.share ? 'attivo per la selezione' : 'disattivato · bozza privata'}</strong></p><div class="actions"><button class="secondary-action" type="button" data-action="keep-draft">Mantieni bozza</button><button class="primary-action" type="button" data-action="contribute">${state.completed ? 'Contributo registrato ✓' : 'Contribuisci alla demo'} </button><button class="secondary-action" type="button" data-action="new-experiment">Nuova prova</button></div></div></aside></div>`;
  }

  function renderWorkspace() {
    const views = { intention: renderIntention, environment: renderEnvironment, boundaries: renderBoundaries, experiment: renderExperiment, authority: renderAuthority, result: renderResult, value: renderValue, contribution: renderContribution };
    workspace.innerHTML = (views[state.stage] || renderIntention)();
  }

  function renderNavigation() {
    const currentIndex = stageIds.indexOf(state.stage);
    document.querySelector('#journey-progress').textContent = state.ready ? `${Math.max(1, currentIndex + 1)} di ${stageIds.length} · stato ispezionabile` : 'Pronto per iniziare';
    document.querySelector('#journey-nav').innerHTML = content.stages.map((stage, index) => {
      const visited = state.visited.includes(stage.id);
      return `<button type="button" class="journey-step" data-stage="${stage.id}" data-visited="${visited}" ${visited ? '' : 'disabled'} ${state.stage === stage.id ? 'aria-current="step"' : ''}><span class="step-mark">${visited && index < currentIndex ? '✓' : '·'}</span><span>${stage.label}</span><small>${stage.system}</small></button>`;
    }).join('');
  }

  function renderSystems() {
    document.querySelector('#system-dock').innerHTML = Object.entries(content.systems).map(([id, system]) => {
      const available = systemAvailable(id);
      return `<button type="button" class="system-launch" data-module="${id}" data-available="${available}" ${available ? '' : 'disabled'}><span class="system-code">${system.code}</span><span><strong>${system.name}</strong><small>${system.role}</small></span><em>${available ? 'DISPONIBILE' : 'CONTESTUALE'}</em></button>`;
    }).join('');
  }

  function renderActivity() {
    document.querySelector('#activity-log').innerHTML = state.activity.map(item => `<li><strong>${item.system}</strong>${escapeHTML(item.text)}</li>`).join('');
  }

  function renderControl() {
    const widths = { manual: 100, assisted: 82, delegated: 64, autonomous: 48 };
    const width = state.paused ? 100 : Math.max(30, widths[state.mode] - (state.explanations ? 0 : 8));
    const gauge = document.querySelector('#control-gauge');
    gauge.style.width = `${width}%`;
    gauge.style.background = state.paused ? 'var(--coral)' : 'var(--teal)';
    document.querySelector('#human-control-state').textContent = state.paused ? 'Assistenza in pausa' : `${modeLabels[state.mode]} · revocabile`;
    document.querySelector('#control-summary').textContent = state.paused ? 'OSHI ha sospeso la preparazione. Le evidenze restano ispezionabili.' : `${modeLabels[state.mode]}. Soglia di approvazione ${state.approvalThreshold}; azioni esterne bloccate.`;
  }

  function renderChrome() {
    document.querySelector('#active-intention strong').textContent = state.goal || 'Nessuna intenzione definita';
    renderNavigation(); renderSystems(); renderActivity(); renderControl();
  }

  function render(focus = false) {
    renderChrome(); renderWorkspace();
    document.title = `${currentStage().label} · JASVERSE THE ORACOLO V2`;
    if (focus) { workspace.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
  }

  function moduleHeader(id) {
    const system = content.systems[id];
    return `<div class="module-title"><span class="system-code">${system.code}</span><div><h2 id="module-title">${system.name}</h2><p>${system.role} · ${system.note}</p></div></div>`;
  }

  function maikoreModule() {
    const tabs = [['interpretation','Interpretazione'],['choices','Scelte'],['evidence','Verità']];
    const tab = state.moduleTab || 'interpretation';
    const selected = content.capabilities.find(item => item.id === state.inspectedCapability);
    let body = '';
    if (tab === 'interpretation') body = `<div class="module-section"><h3>Intenzione interpretata</h3><p>${escapeHTML(state.goal)}</p><ol class="decomposition"><li>Rendere visibile la competenza e il risultato desiderato.</li><li>Verificare domanda senza impegnare capitale reale.</li><li>Riutilizzare strumenti disponibili prima di costruire.</li><li>Misurare un segnale e scegliere se continuare.</li></ol>${selected ? `<h3>${selected.label} · perché è presente</h3><p>${selected.reason}</p><div class="reason-line">${truthBadge(selected.status === 'needed' ? 'unknown' : 'inference')}<span>${selected.contribution}</span></div>` : ''}</div>`;
    if (tab === 'choices') body = `<div class="module-section"><h3>Percorso attivo</h3><div class="mini-metric"><span>Strategia</span><strong>${{reuse:'RIUSA',adapt:'COMBINA',build:'COSTRUISCI'}[state.strategy]}</strong></div><div class="mini-metric"><span>Automazione</span><strong>${modeLabels[state.mode].toUpperCase()}</strong></div><div class="mini-metric"><span>Prossima decisione umana</span><strong>PROTOCOLLO DI PROVA</strong></div><p>Puoi cambiare la strategia nell’ambiente principale. MaiKore non converte una proposta in autorizzazione.</p></div>`;
    if (tab === 'evidence') body = `<div class="module-section"><h3>Stato delle affermazioni</h3>${Object.entries(content.truth).map(([key,item]) => `<div class="reason-line">${truthBadge(key)}<span>${item.text}</span></div>`).join('')}</div>`;
    return `${moduleHeader('maikore')}<div class="module-tabs">${tabs.map(([id,label]) => `<button type="button" data-module-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</div>${body}<div class="dialog-actions"><button class="primary-action" type="button" data-action="close-dialog">Torna all’ambiente</button></div>`;
  }

  function oshiModule() {
    const tab = state.moduleTab || 'controls';
    const tabs = [['controls','Controlli'],['permissions','Permessi'],['history','Attività']];
    let body = '';
    if (tab === 'controls') body = `<div class="module-section"><h3>Automazione</h3>${modeSwitch()}${toggleRow('explanations','Spiegazioni richieste','Ogni proposta mostra ragione e stato di verità.')}${toggleRow('memory','Contesto di sessione','Memoria volatile, controllata dalla persona.')}${toggleRow('share','Contributo selettivo','Soltanto elementi scelti, mai l’intenzione personale.')}</div>`;
    if (tab === 'permissions') body = `<div class="module-section"><h3>Confini effettivi</h3><table class="permission-table"><thead><tr><th>AZIONE</th><th>STATO</th><th>AUTORITÀ</th></tr></thead><tbody><tr><td>Preparare una proposta</td><td>${state.paused ? 'Bloccata' : 'Consentita'}</td><td>OSHI</td></tr><tr><td>Eseguire la prova</td><td>${state.authorized ? 'Una volta' : 'Richiesta'}</td><td>TheBossKey</td></tr><tr><td>Spendere denaro</td><td>${state.blockPurchase ? 'Vietata' : 'Richiede approvazione'}</td><td>Persona</td></tr><tr><td>Pubblicare</td><td>${state.blockPublish ? 'Vietata' : 'Richiede approvazione'}</td><td>Persona</td></tr><tr><td>Contribuire evidenze</td><td>${state.share ? 'Selezionabile' : 'Privata'}</td><td>Persona</td></tr></tbody></table><h3>Azioni vietate</h3>${toggleRow('blockPurchase','Blocca acquisti','Nessun acquisto reale o simulato come avvenuto.')}${toggleRow('blockPublish','Blocca pubblicazione','Nessuna pubblicazione o contatto esterno.')}${toggleRow('blockPersonalData','Blocca dati personali','L’intenzione personale non lascia questa pagina.')}</div>`;
    if (tab === 'history') body = `<div class="module-section"><h3>Registro locale</h3>${state.activity.map(item => `<div class="mini-metric"><span>${escapeHTML(item.text)}</span><strong>${item.system}</strong></div>`).join('')}</div>`;
    return `${moduleHeader('oshi')}<div class="module-tabs">${tabs.map(([id,label]) => `<button type="button" data-module-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</div>${body}<div class="dialog-actions"><button class="secondary-action" type="button" data-action="override-manual">Override manuale</button><button class="danger-action" type="button" data-action="toggle-pause">${state.paused ? 'Riprendi' : 'Pausa'}</button><button class="danger-action" type="button" data-action="revoke">Revoca</button><button class="primary-action" type="button" data-action="close-dialog">Applica e chiudi</button></div>`;
  }

  function labModule() {
    const tab = state.moduleTab || 'protocol';
    const tabs = [['protocol','Protocollo'],['ledger','Registro'],['receipt','Ricevuta']];
    let body = '';
    if (tab === 'protocol') body = `<div class="module-section"><h3>Problema → prova</h3><ol class="decomposition"><li>Problema: competenza non ancora convertita in domanda.</li><li>Evidenza: nessun segnale reale disponibile.</li><li>Ipotesi: almeno 5 richieste su ${state.trialSize} posti.</li><li>Esperimento: offerta locale fittizia e limitata.</li><li>Misura: ${state.metric}.</li><li>Decisione: ripetere, correggere o fermare.</li></ol></div>`;
    if (tab === 'ledger') body = `<div class="module-section">${Object.entries(content.truth).map(([key,item]) => `<div class="reason-line">${truthBadge(key)}<span>${item.text}</span></div>`).join('')}</div>`;
    if (tab === 'receipt') body = state.ran ? `<div class="module-section"><h3>Ricevuta JV-DEMO-01</h3><div class="mini-metric"><span>Esito</span><strong>${state.result.label.toUpperCase()}</strong></div><div class="mini-metric"><span>Richieste</span><strong>${state.result.requests}/${state.trialSize}</strong></div><div class="mini-metric"><span>Autorità</span><strong>SCADUTA</strong></div><p>${state.result.decision}</p></div>` : '<div class="module-section"><p>Nessuna prova è stata ancora eseguita.</p></div>';
    return `${moduleHeader('lab')}<div class="module-tabs">${tabs.map(([id,label]) => `<button type="button" data-module-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</div>${body}`;
  }

  function bosskeyModule() {
    return `${moduleHeader('bosskey')}<div class="module-section"><h3>Autorità della sessione</h3><div class="mini-metric"><span>Identità</span><strong>TU · LOCALE</strong></div><div class="mini-metric"><span>Permesso prova</span><strong>${state.authorized ? 'ATTIVO · UNA VOLTA' : 'NON ATTIVO'}</strong></div><div class="mini-metric"><span>Azioni esterne</span><strong>0 CONSENTITE</strong></div><div class="mini-metric"><span>Revoca</span><strong>IMMEDIATA</strong></div><p>Capacità e autorità restano separate. Questa ricevuta non autentica una persona reale.</p></div><div class="dialog-actions"><button class="danger-action" type="button" data-action="revoke">Revoca ogni delega</button></div>`;
  }

  function bbpModule() {
    const values = economicValues(); const selected = values[state.economicChoice];
    return `${moduleHeader('bbp')}<div class="module-section"><h3>Protezione economica simulata</h3><div class="mini-metric"><span>Percorso selezionato</span><strong>${selected.label.toUpperCase()}</strong></div><div class="mini-metric"><span>Costo fittizio</span><strong>${selected.cost} CREDITI</strong></div><div class="mini-metric"><span>Costo massimo evitato</span><strong>${180-selected.cost} CREDITI</strong></div><div class="mini-metric"><span>Acquisti eseguiti</span><strong>0</strong></div><div class="reason-line">${truthBadge('unknown')}<span>La missione finale di ByeByePrice resta deliberatamente aperta.</span></div><p>Questa superficie esplora soltanto confronto, costo totale, protezione e opportunità. Non presenta prezzi reali.</p></div>`;
  }

  function aboutModule() {
    return `<div class="module-body"><div class="module-title"><span class="system-code">V2</span><div><h2 id="module-title">JASVERSE — THE ORACOLO</h2><p>Ambiente operativo concettuale · nessun motore</p></div></div><div class="module-section"><p>Questa esperienza mostra come un’intenzione potrebbe assemblare capacità, regole, prova, autorità e valore intorno alla persona.</p><div class="about-grid"><div class="about-cell"><strong>SIMULATO</strong><p>Obiettivi, proposte, confidenza, prezzi, autorizzazioni, risultati e flussi.</p></div><div class="about-cell"><strong>NON COLLEGATO</strong><p>Nessuna IA, account, identità, pagamento, database o servizio esterno.</p></div><div class="about-cell"><strong>LOCALE</strong><p>Lo stato vive soltanto nella memoria di questa pagina e sparisce con il reset o la chiusura.</p></div><div class="about-cell"><strong>NON CANONICO</strong><p>È un prototipo UX, non documentazione JasVerse definitiva. La definizione BBP resta aperta.</p></div></div></div></div>`;
  }

  function resetModule() {
    return `<div class="module-body"><div class="module-title"><span class="system-code">↺</span><div><h2 id="module-title">Azzerare la simulazione?</h2><p>Rimuove intenzione, scelte, permessi e risultati locali.</p></div></div><p>Nessun dato esterno verrà modificato perché il prototipo non invia né salva dati.</p><div class="dialog-actions"><button class="secondary-action" type="button" data-action="close-dialog">Continua a esplorare</button><button class="danger-action" type="button" data-action="confirm-reset">Azzera tutto</button></div></div>`;
  }

  function moduleHTML(id) {
    return ({ maikore: maikoreModule, oshi: oshiModule, lab: labModule, bosskey: bosskeyModule, bbp: bbpModule, about: aboutModule, reset: resetModule }[id] || aboutModule)();
  }

  function openModule(id, tab = '') {
    if (content.systems[id] && !systemAvailable(id)) { notify(`${content.systems[id].name} diventa disponibile quando serve nel percorso.`); return; }
    state.openModule = id; state.moduleTab = tab;
    document.querySelector('#dialog-system').textContent = content.systems[id]?.name?.toUpperCase() || 'JASVERSE';
    dialogContent.innerHTML = `<div class="module-body">${moduleHTML(id)}</div>`;
    if (!dialog.open) dialog.showModal();
  }

  function refreshDialog() {
    if (dialog.open && state.openModule) dialogContent.innerHTML = `<div class="module-body">${moduleHTML(state.openModule)}</div>`;
  }

  function closeDialog() { if (dialog.open) dialog.close(); }

  function resetAll() {
    state = initialState(); closeDialog();
    history.replaceState(null, '', `${location.pathname}#intention`);
    render(true); notify('Simulazione azzerata. Nessun dato è stato conservato.');
  }

  function startJourney() {
    const input = document.querySelector('#goal-input');
    const value = input.value.trim();
    if (!value) { input.focus(); notify('Scrivi un’intenzione o scegli un obiettivo dimostrativo.'); return; }
    state.goal = value; state.context = document.querySelector('#context-select').value; state.ready = true;
    visit('environment'); addActivity('MaiKore', 'Intenzione interpretata; sei capacità rilevanti assemblate.');
    goStage('environment');
  }

  function handleAction(action) {
    if (action === 'to-boundaries') { visit('boundaries'); addActivity('OSHI','Confini pronti per essere regolati.'); goStage('boundaries'); }
    if (action === 'to-experiment') { visit('experiment'); addActivity('JasVerse Lab','Protocollo di prova creato come ipotesi modificabile.'); goStage('experiment'); }
    if (action === 'request-authority') { visit('authority'); state.denied = false; addActivity('TheBossKey','Richiesta limitata a una prova; nessuna azione esterna.'); goStage('authority'); }
    if (action === 'approve-authority') { state.authorized = true; state.denied = false; state.revoked = false; addActivity('TheBossKey','Autorizzazione monouso concessa.'); closeDialog(); visit('experiment'); goStage('experiment'); notify('Autorizzazione valida per una sola prova simulata.'); }
    if (action === 'deny-authority') { state.authorized = false; state.denied = true; addActivity('TheBossKey','Richiesta negata; il protocollo resta una bozza.'); render(); notify('Richiesta negata. Nessuna prova è stata avviata.'); }
    if (action === 'edit-experiment') { visit('experiment'); goStage('experiment'); }
    if (action === 'run-experiment') {
      if (!state.authorized || state.paused) { notify(state.paused ? 'OSHI ha messo in pausa l’assistenza.' : 'Serve un’autorizzazione TheBossKey valida.'); return; }
      state.result = { ...content.experimentOutcomes[state.demoOutcome] }; state.ran = true; state.authorized = false;
      visit('result'); addActivity('JasVerse Lab', `Prova simulata completata: ${state.result.label.toLowerCase()}.`); addActivity('TheBossKey','Autorizzazione monouso scaduta.'); goStage('result');
    }
    if (action === 'to-value') { visit('value'); addActivity('ByeByePrice','Dimensione economica resa ispezionabile; nessun prezzo reale.'); goStage('value'); }
    if (action === 'to-contribution') { visit('contribution'); addActivity('JasVerse','Possibili contributi collegati a commons, ricerca e nuova prova.'); goStage('contribution'); }
    if (action === 'toggle-pause') { state.paused = !state.paused; if (state.paused) state.authorized = false; addActivity('OSHI', state.paused ? 'Assistenza sospesa e autorità attiva revocata.' : 'Assistenza ripresa entro i confini correnti.'); render(); refreshDialog(); notify(state.paused ? 'Assistenza in pausa.' : 'Assistenza ripresa.'); }
    if (action === 'revoke') { state.authorized = false; state.revoked = true; state.mode = 'manual'; state.paused = true; addActivity('OSHI','Deleghe revocate; modalità riportata a Manuale.'); render(); refreshDialog(); notify('Deleghe revocate. Le evidenze restano disponibili.'); }
    if (action === 'override-manual') { state.authorized = false; state.revoked = false; state.mode = 'manual'; state.paused = false; addActivity('OSHI','Override applicato: percorso manuale e autorità precedente rimossa.'); render(); refreshDialog(); notify('Override manuale attivo. Ogni passaggio torna sotto controllo diretto.'); }
    if (action === 'contribute') {
      if (state.completed) return;
      if (!state.share) { openModule('oshi','controls'); notify('Attiva un contributo selettivo in OSHI oppure mantieni la bozza privata.'); return; }
      state.completed = true; addActivity('JasVerse','Contributo fittizio registrato nella simulazione.'); render(); notify('Contributo registrato soltanto nella demo locale.');
    }
    if (action === 'keep-draft') { state.completed = false; addActivity('OSHI','Contributo mantenuto come bozza privata.'); render(); notify('Bozza privata. Nessun dato è stato condiviso.'); }
    if (action === 'new-experiment') { state.authorized = false; state.denied = false; state.ran = false; state.result = null; state.completed = false; visit('experiment'); addActivity('JasVerse Lab','Nuova iterazione preparata dal capitale informativo esistente.'); goStage('experiment'); }
    if (action === 'open-about') openModule('about');
    if (action === 'open-reset') openModule('reset');
    if (action === 'confirm-reset') resetAll();
    if (action === 'close-dialog') closeDialog();
  }

  document.addEventListener('submit', event => {
    if (event.target.id !== 'intention-form') return;
    event.preventDefault(); startJourney();
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.goal) {
      const goal = content.goals.find(item => item.id === button.dataset.goal);
      state.goalId = goal.id; state.goal = goal.text; state.context = goal.context;
      render(); document.querySelector('#goal-input').focus(); return;
    }
    if (button.dataset.stage) { goStage(button.dataset.stage); return; }
    if (button.dataset.module) { openModule(button.dataset.module); return; }
    if (button.dataset.capability) { state.inspectedCapability = button.dataset.capability; openModule('maikore','interpretation'); return; }
    if (button.dataset.moduleTab) { state.moduleTab = button.dataset.moduleTab; refreshDialog(); return; }
    if (button.dataset.mode) { state.mode = button.dataset.mode; state.paused = false; addActivity('OSHI', `Automazione impostata su ${modeLabels[state.mode]}.`); render(); refreshDialog(); return; }
    if (button.dataset.flow) { state.selectedFlow = button.dataset.flow; render(); notify(`Flusso “${button.textContent.trim()}” selezionato per l’ispezione.`); return; }
    if (button.dataset.action) handleAction(button.dataset.action);
  });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'context-select') state.context = target.value;
    if (target.name === 'strategy') { state.strategy = target.value; addActivity('MaiKore', `Strategia aggiornata: ${target.closest('label').querySelector('strong').textContent}.`); render(); }
    if (target.name === 'demoOutcome') { state.demoOutcome = target.value; state.ran = false; state.result = null; render(); }
    if (target.name === 'economicChoice') { state.economicChoice = target.value; addActivity('ByeByePrice','Alternativa economica aggiornata.'); render(); }
    if (target.dataset.setting) {
      const key = target.dataset.setting;
      state[key] = target.type === 'checkbox' ? target.checked : target.type === 'range' || key === 'trialSize' ? Number(target.value) : target.value;
      if (key === 'share') addActivity('OSHI', state.share ? 'Contributo selettivo consentito.' : 'Contributo riportato a bozza privata.');
      render(); refreshDialog();
    }
    if (target.dataset.contribution) { state.contributions[target.dataset.contribution] = target.checked; state.completed = false; render(); }
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog();
  });

  window.addEventListener('hashchange', () => {
    const requested = location.hash.slice(1);
    if (stageIds.includes(requested) && state.visited.includes(requested)) state.stage = requested;
    else if (requested && requested !== state.stage) history.replaceState(null, '', `${location.pathname}#${state.stage}`);
    render(true);
  });

  const initialHash = location.hash.slice(1);
  if (initialHash === 'intention' || !initialHash) state.stage = 'intention';
  else history.replaceState(null, '', `${location.pathname}#intention`);
  render();
})();
