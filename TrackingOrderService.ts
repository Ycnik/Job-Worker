import { JSONDoc } from "@camunda8/sdk/dist/zeebe/types";

export class TrackingOrderService {   

    // Service duration in milliseconds
    private static readonly TRACKING_TIME: number = 10000; // 10 seconds
  
    // Simulate tracking order status with a delay
    public static async trackOrderStatus(): Promise<void> {
      return new Promise((resolve) => {
        setTimeout(resolve, TrackingOrderService.TRACKING_TIME);
      });
    }
  
    // Simulate packing items
    public static async KreditauftragHandler(): Promise<JSONDoc> {
      const axios = require('axios'); 

      const response = await axios.get('http://localhost:3001/daten');
      const posts = response.data;
      return posts;
    }
  
    // Simulate processing payment
    public static async processPayment(): Promise<string> {
      return String(Date.now());
    }
}