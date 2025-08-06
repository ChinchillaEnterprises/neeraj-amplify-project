import { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Mock scraping function - in production, you'd use real scraping APIs
async function scrapeLeads(searchParams: any) {
  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock leads based on search parameters
  const mockLeads = [];
  const numLeads = Math.floor(Math.random() * 20) + 10;
  
  for (let i = 0; i < numLeads; i++) {
    mockLeads.push({
      companyName: `${searchParams.industry || 'Tech'} Company ${i + 1}`,
      website: `https://company${i + 1}.com`,
      email: `contact@company${i + 1}.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      industry: searchParams.industry || 'Technology',
      companySize: ['1-10', '11-50', '51-200', '201-500', '500+'][Math.floor(Math.random() * 5)],
      location: searchParams.location || 'San Francisco, CA',
      city: searchParams.location?.split(',')[0] || 'San Francisco',
      state: searchParams.location?.split(',')[1]?.trim() || 'CA',
      country: 'USA',
      contactName: `John Doe ${i + 1}`,
      contactTitle: ['CEO', 'CTO', 'VP Sales', 'Marketing Director'][Math.floor(Math.random() * 4)],
      contactEmail: `john.doe${i + 1}@company${i + 1}.com`,
      linkedinUrl: `https://linkedin.com/company/company${i + 1}`,
      description: `Leading ${searchParams.industry || 'technology'} company specializing in innovative solutions.`,
      founded: String(2010 + Math.floor(Math.random() * 14)),
      employees: Math.floor(Math.random() * 500) + 10,
      source: 'Web Scraping',
      sourceUrl: `https://google.com/search?q=${encodeURIComponent(searchParams.keywords?.join('+') || 'companies')}`,
      scrapedAt: new Date().toISOString(),
      status: 'new',
      score: Math.floor(Math.random() * 100),
      tags: searchParams.keywords || [],
    });
  }
  
  return mockLeads;
}

export const handler: Handler = async (event) => {
  console.log('Lead scraper invoked with:', JSON.stringify(event));
  
  try {
    const { searchId, searchParams, tableName } = event;
    
    if (!searchId || !tableName) {
      throw new Error('Missing required parameters');
    }
    
    // Update search status to running
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id: searchId },
      UpdateExpression: 'SET #status = :status, startedAt = :startedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'running',
        ':startedAt': new Date().toISOString()
      }
    }));
    
    // Scrape leads
    const leads = await scrapeLeads(searchParams);
    
    // Save leads to database
    for (const lead of leads) {
      await docClient.send(new PutCommand({
        TableName: tableName.replace('LeadSearch', 'Lead'),
        Item: {
          id: `${searchId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          searchId,
          ...lead,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: event.owner || 'system'
        }
      }));
    }
    
    // Update search status to completed
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id: searchId },
      UpdateExpression: 'SET #status = :status, completedAt = :completedAt, totalFound = :totalFound, processedCount = :processedCount',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':completedAt': new Date().toISOString(),
        ':totalFound': leads.length,
        ':processedCount': leads.length
      }
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Lead scraping completed',
        leadsFound: leads.length
      })
    };
    
  } catch (error) {
    console.error('Error in lead scraper:', error);
    
    // Update search status to failed
    if (event.searchId && event.tableName) {
      await docClient.send(new UpdateCommand({
        TableName: event.tableName,
        Key: { id: event.searchId },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'failed'
        }
      }));
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Lead scraping failed',
        message: error.message
      })
    };
  }
};