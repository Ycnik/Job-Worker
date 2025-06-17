import { Camunda8 } from "@camunda8/sdk";
import { faker } from '@faker-js/faker';

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

// Der Worker holt die Kreditdaten vom JSON-Server
zeebe.createWorker({
 taskType: 'KreditwürdigkeitCheck',
  taskHandler: async (job) => {
    console.log("List of variables from Zeebe: ", job.variables); 
    const jobVariables = { ...job.variables };

    function pruefeKreditwuerdigkeit() {
        const einkommen = jobVariables.einkommen;
        const verbindlichkeiten = jobVariables.verbindlichkeiten;
        const vermoegen = jobVariables.vermoegen;
        const schufaScore = jobVariables.schufaScore;
        const insolvenz = jobVariables.insolvenz;
        const kreditsumme = jobVariables.kreditsumme;
        
        const monatsrate = Number(kreditsumme) / Number(jobVariables.laufzeit);
        const einkommensquote = monatsrate / Number(einkommen);

        const nettovermoegen = Number(vermoegen) - Number(verbindlichkeiten);

         const hatNegativeMerkmale =
            insolvenz === false &&
            Number(schufaScore) > 65 &&
            einkommensquote < 0.5 && 
            nettovermoegen > Number(kreditsumme) * 0.2;

        return hatNegativeMerkmale;
    }

    jobVariables.kreditwuerdig = pruefeKreditwuerdigkeit();
    
    console.log("Process variables retrieved from the prufeKreditwuerdigkeit: ", jobVariables);
    console.log('Kreditwürdigkeit berechnet:');
    return job.complete(jobVariables);
  },
});

// Der Worker holt die Kreditdaten vom JSON-Server
zeebe.createWorker({
  taskType: 'Datenhochladen', // Der Task-Typ aus dem BPMN-Modell
  taskHandler: async (job) => {
    console.log('Worker für "KreditwürdigkeitCheck" gestartet');
      // Abrufen der Kreditdaten vom JSON-Server
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/daten');
      const kreditdaten = response.data;

       // 2. Neue Daten vorbereiten
      const neuerEintrag: KreditDaten = {
      name: String(job.variables.name),
      schufascore: Number(job.variables.schufaScore),
      einkommen: Number(job.variables.einkommen),
      insolvenz: Boolean(job.variables.insolvenz),
      kreditsumme: Number(job.variables.kreditsumme),
      vermoegen: Number(job.variables.vermoegen),
      verbindlichkeiten: Number(job.variables.verbindlichkeiten),
      laufzeit: Number(job.variables.laufzeit)
      };

      // 3. Hochladen der neuen Daten an den JSON-Server
      const uploadResponse = await axios.post('http://localhost:3001/daten', neuerEintrag, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    

      console.log("Neue Daten erfolgreich hochgeladen:", uploadResponse.data);

      console.log('Kreditdaten abgerufen:');
      return job.complete(job.variables);
  },
});

zeebe.createWorker({
  taskType: 'RisikoBewerten', // Der Task-Typ aus dem BPMN-Modell
  taskHandler: async (job) => {
    console.log('Risikobewerten');
      return job.complete();
  },
});
  
main().catch(err => console.error(err));

