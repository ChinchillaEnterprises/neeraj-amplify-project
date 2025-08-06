import { defineFunction } from '@aws-amplify/backend';

export const leadScraper = defineFunction({
  name: 'lead-scraper',
  runtime: 20,
  memoryMB: 512,
  timeoutSeconds: 300,
  environment: {
    PROXY_API_KEY: process.env.PROXY_API_KEY || '',
  }
});