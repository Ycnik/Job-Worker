import { Camunda8 } from "@camunda8/sdk";
import { faker } from '@faker-js/faker';
import { TrackingOrderService } from "./TrackingOrderService";

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
    const order = createRandomOrder();
    const p = await zeebe.createProcessInstance({
      bpmnProcessId: `orderProcess`,
      variables: {...order},
    });
    console.log(`Process instance: ${p.processInstanceKey} started`);
  }
}
/*
//Daten von JSON-Server abrufen
const axios = require('axios'); 

async function getData() {
  const response = await axios.get('http://localhost:3001/daten');
  const posts = response.data;
  return posts;
}

//Kreditwürdigkeit ermitteln und ausgeben
getData().then(kreditdaten => {
  const ergebnis = pruefeKreditwuerdigkeit(kreditdaten);
  console.log(ergebnis);
}).catch(err => {
  console.error('Fehler:', err.message);
});
*/

console.log("Starting worker trackOrderStatus...");
zeebe.createWorker({
  taskType: "KreditauftragAufnehmen",
  taskHandler: async (job) => {
    console.log(`Handling job: ${job.key} ${job.type}`);
    await TrackingOrderService.trackOrderStatus();
    console.log(`Handling job: ${job.key} Order status tracked successfully`);
    return job.complete();
  },
  //timeout: 15000,
});

console.log("Starting worker Kreditauftrag entgegenehmen...");
zeebe.createWorker({
    taskType: "packItems",
    taskHandler: async (job) => {
        const jobVariables = { ...job.variables };// spread operator to copy the object
        console.log("Process variables retrieved from the Kreditauftrag: ", jobVariables);
        const packed = await TrackingOrderService.KreditauftragHandler();
        jobVariables.packaged = packed;
        console.log(`Kreditauftrag wurde erfolgreich entgegengenommen`);
        return job.complete({ packaged: packed });
    },
});


console.log("Starting worker processPayment...");
zeebe.createWorker({
    taskType: "processPayment",
    taskHandler: async (job) => {
        const jobVariables = { ...job.variables };// spread operator to copy the object
        console.log("Process variables retrieved from the processPayment: ", jobVariables);
        const orderId = jobVariables.orderId;
        console.log(`Order: ${orderId} Processing payment`);    
        const paymentProcessed = await TrackingOrderService.processPayment();
        jobVariables.paymentConfirmation = paymentProcessed;
        console.log(`Order: ${orderId} Payment processed`);
        return job.complete(jobVariables);
    },
});



function createRandomOrder() {
  return {
    orderId: faker.string.alphanumeric(10),
    packaged: false,
    productName: faker.commerce.productName(),
    price: faker.commerce.price(),
    promotionCode: faker.commerce.isbn(),
    material: faker.commerce.productMaterial(),
    department: faker.commerce.department(),
    paymentConfirmation: 'UNCONFIRMED'
  };
}
  
main().catch(err => console.error(err));

