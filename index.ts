import { Camunda8 } from "@camunda8/sdk";

const camunda = new Camunda8({
  CAMUNDA_OAUTH_URL: "https://login.cloud.camunda.io/oauth/token",
  CAMUNDA_CONSOLE_CLIENT_ID: "HAoRlBLf-vGfb82MdY0lA5-fuLaoe2bL",
  CAMUNDA_CONSOLE_CLIENT_SECRET: "u.wKMQE9mhk93gYWs_dObszK_rfWu6LRUj-w~QgdFOHyX92xkPd8wqhDRLp0tfYY",
  ZEEBE_ADDRESS: "487e2664-45fe-4a21-9e53-860eddc37e5e.bru-2.zeebe.camunda.io:443",
  ZEEBE_CLIENT_ID: "HAoRlBLf-vGfb82MdY0lA5-fuLaoe2bL",
  ZEEBE_CLIENT_SECRET: "u.wKMQE9mhk93gYWs_dObszK_rfWu6LRUj-w~QgdFOHyX92xkPd8wqhDRLp0tfYY",
  CAMUNDA_SECURE_CONNECTION: true
});
const zeebe = camunda.getZeebeGrpcApiClient({
});

const NUM_INSTANCES = 1; // Set this to the number of instances you want to create

async function main() {
  for (let i = 0; i < NUM_INSTANCES; i++) {
    const p = await zeebe.createProcessInstance({
      bpmnProcessId: `orderProcess`,
      variables: {}
    });
    console.log(`Process instance: ${p.processInstanceKey} started`);
  }
}

zeebe.createWorker({
 taskType: 'KreditwürdigkeitCheck',
  taskHandler: async (job) => {
   
    
    console.log("List of variables from Zeebe: ", job.variables); 
    const jobVariables = { ...job.variables };

    //Prozessvariablen als Typescript-Variablen deklarieren
    const id = String(jobVariables.id);
    const name = String(jobVariables.name);
    const einkommen = Number(jobVariables.einkommen);
    const verbindlichkeiten = Number(jobVariables.verbindlichkeiten);
    const vermoegen = Number(jobVariables.vermoegen);
    const schufaScore = Number(jobVariables.schufaScore);
    const insolvenz = jobVariables.insolvenz;
    const kreditsumme = Number(jobVariables.kreditsumme);
    const laufzeit = Number(jobVariables.laufzeit);

    // Prüfung auf Stornierung, wenn ja job.error zurückgeben und Error-Boundary-Event KREDITPRUEFUNG_FEHLER wird ausgelöst
    if (jobVariables.storniert === true) {
      console.log("⛔️ Prozess wurde storniert – Job wird nicht weiter ausgeführt.");
      return job.error('KREDITPRUEFUNG_FEHLER', 'Prozess wurde vom Benutzer abgebrochen.');
    }

    //Daten an Json-Server übergeben
    console.log("Daten an JSON-Server geben");
    const axios = require('axios');
    try {
      const jsonDaten = {
      id: id,
      name: name,
      insolvenz: insolvenz,
      einkommen: einkommen,
      kreditsumme: kreditsumme,
      schufaScore: schufaScore,
      laufzeit: laufzeit,
      verbindlichkeiten: verbindlichkeiten,
      vermoegen: vermoegen
    };
      const uploadResponse = await axios.post('http://localhost:3001/daten', jsonDaten, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Upload auf JSON-Server erfolgreich:', uploadResponse.data);
      // Wenn Daten nicht an Json-Server übertragen werdenjob.error zurückgeben und Error-Boundary-Event KREDITPRUEFUNG_FEHLER wird ausgelöst
    } catch (error) {
      console.error('Fehler beim Hochladen:');
      return job.error("KREDITPRUEFUNG_FEHLER");
    }

    try {
    // Prüfung auf gültige Zahlenwerte oder null
    if (
      isNaN(einkommen) || einkommen <= 0 ||
      isNaN(verbindlichkeiten) || verbindlichkeiten < 0 ||
      isNaN(vermoegen) || vermoegen < 0 ||
      isNaN(schufaScore) || schufaScore <= 0 ||
      typeof insolvenz !== 'boolean' ||
      isNaN(kreditsumme) || kreditsumme <= 0 ||
      isNaN(laufzeit) || laufzeit <= 0
    ) {
      throw new Error("Ungültige oder fehlende Eingabedaten für Kreditprüfung");
    }

    //Prüfung der Kreditwürdigkeit als Funktion
    function pruefeKreditwuerdigkeit() {  
        const monatsrate = kreditsumme / laufzeit;
        const einkommensquote = monatsrate / einkommen;

        const nettovermoegen = vermoegen - verbindlichkeiten;

         const hatNegativeMerkmale =
            insolvenz === false &&
            schufaScore > 65 &&
            einkommensquote < 0.5 && 
            nettovermoegen > kreditsumme * 0.2;

        return hatNegativeMerkmale;
    }

    //Setzen der Prozessvariable "kreditwuerdig" auf ermittelten boolean wert
    jobVariables.kreditwuerdig = pruefeKreditwuerdigkeit();

    //Neu gesetze Prozessvariablen ausgeben
    console.log("Process variables retrieved from the prufeKreditwuerdigkeit: ", jobVariables);
    console.log('Kreditwürdigkeit berechnet');
    return job.complete(jobVariables);
  
    //Job-error wird zurückgegeben der in BPMN das Error-Boundary-Event KREDITPRUEFUNG_FEHLER auslöst
 } catch (error) {
      console.error('Fehler bei der Kreditwürdigkeitsprüfung:');
      return job.error("KREDITPRUEFUNG_FEHLER");
    } finally {
      console.log("Job Worker ist fertig");
    }
}});
  
main().catch(err => console.error(err));

