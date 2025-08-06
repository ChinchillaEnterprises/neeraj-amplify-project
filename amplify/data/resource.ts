import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Lead model - stores individual lead information
  Lead: a
    .model({
      // Basic Information
      companyName: a.string().required(),
      website: a.url(),
      email: a.email(),
      phone: a.phone(),
      
      // Company Details
      industry: a.string(),
      companySize: a.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
      location: a.string(),
      city: a.string(),
      state: a.string(),
      country: a.string(),
      
      // Contact Information
      contactName: a.string(),
      contactTitle: a.string(),
      contactEmail: a.email(),
      contactPhone: a.phone(),
      linkedinUrl: a.url(),
      
      // Additional Data
      description: a.string(),
      founded: a.string(),
      revenue: a.string(),
      employees: a.integer(),
      
      // Lead Management
      status: a.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
      score: a.integer().default(0),
      tags: a.string().array(),
      notes: a.string(),
      
      // Source Information
      source: a.string(),
      sourceUrl: a.url(),
      scrapedAt: a.datetime(),
      
      // Relationship to search
      searchId: a.id(),
      search: a.belongsTo('LeadSearch', 'searchId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Search model - stores search parameters and results
  LeadSearch: a
    .model({
      searchName: a.string().required(),
      
      // Search Parameters
      industry: a.string(),
      location: a.string(),
      companySize: a.string(),
      keywords: a.string().array(),
      
      // Search Settings
      maxResults: a.integer().default(100),
      includeEmails: a.boolean().default(true),
      includePhones: a.boolean().default(true),
      includeSocial: a.boolean().default(true),
      
      // Search Status
      status: a.enum(['pending', 'running', 'completed', 'failed']),
      totalFound: a.integer().default(0),
      processedCount: a.integer().default(0),
      
      // Timestamps
      startedAt: a.datetime(),
      completedAt: a.datetime(),
      
      // Relationships
      leads: a.hasMany('Lead', 'searchId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Saved templates for quick searches
  SearchTemplate: a
    .model({
      templateName: a.string().required(),
      description: a.string(),
      
      // Template Parameters
      industry: a.string(),
      location: a.string(),
      companySize: a.string(),
      keywords: a.string().array(),
      
      // Usage tracking
      usageCount: a.integer().default(0),
      lastUsed: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // Email verification tracking
  EmailVerification: a
    .model({
      email: a.email().required(),
      isValid: a.boolean(),
      verifiedAt: a.datetime(),
      
      // Verification details
      mxRecordValid: a.boolean(),
      smtpValid: a.boolean(),
      formatValid: a.boolean(),
      
      leadId: a.id(),
      lead: a.belongsTo('Lead', 'leadId'),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
