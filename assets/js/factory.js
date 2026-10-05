(function(){
  "use strict";
  var form=document.getElementById("factory-command-form");
  var input=document.getElementById("factory-command-input");
  var note=document.getElementById("factory-command-note");
  if(!form||!input||!note)return;

  form.addEventListener("submit",function(event){
    event.preventDefault();
    var value=input.value.trim();
    if(!value){
      note.textContent="Scrivi un macro-intento prima di preparare la missione.";
      return;
    }
    note.textContent="MISSIONE PREPARATA IN UI R0 · nessuna esecuzione inviata. Il prossimo incremento collegherà questa superficie al control plane privato JasVerse-Operations tramite un endpoint autenticato.";
  });
})();
