import { Camunda8 } from "@camunda8/sdk";
import { faker } from '@faker-js/faker';
import { pruefeKreditwuerdigkeit } from "./kreditwürdigkeitcheck";

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
  taskType: 'KreditauftragAufnehmen', // Der Task-Typ aus dem BPMN-Modell
  taskHandler: async (job) => {
    console.log(`Bearbeite Aufgabe für Prozessinstanz ${job.processInstanceKey}`);
    console.log('Worker für "KreditdatenAufnehmen" gestartet');
      // Abrufen der Kreditdaten vom JSON-Server
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/daten');
      const kreditdaten = response.data;

      console.log('Kreditdaten abgerufen:', kreditdaten);
      return job.complete(kreditdaten);
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

