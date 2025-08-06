import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { leadScraper } from './functions/lead-scraper/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  leadScraper,
});

// Grant the lead scraper function access to the data
backend.leadScraper.resources.lambda.addToRolePolicy({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      Resource: [
        backend.data.resources.tables["Lead"].tableArn,
        backend.data.resources.tables["LeadSearch"].tableArn,
        `${backend.data.resources.tables["Lead"].tableArn}/index/*`,
        `${backend.data.resources.tables["LeadSearch"].tableArn}/index/*`
      ]
    }
  ]
});
