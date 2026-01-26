import { openai } from '@ai-sdk/openai';
import { embed, convertToModelMessages, streamText } from 'ai';
import { Pinecone } from '@pinecone-database/pinecone';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1];
  
  let inputQuery = '';
  
  if (lastMessage.parts) {
    inputQuery = lastMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  } else if (typeof lastMessage.content === 'string') {
    inputQuery = lastMessage.content;
  }

  let contextText = '';
  if (inputQuery.trim().length > 0) {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: inputQuery, 
    });

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.index('pdf-rag-project');

    const queryResponse = await index.namespace('pdf-rag').query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    });

    contextText = queryResponse.matches
      .map(match => match.metadata?.text || '')
      .join('\n\n---\n\n');
  }

  const modelMessages = await convertToModelMessages(messages); //

  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: `You are a helpful assistant. Answer the user's question based ONLY on the context below.
    
    Context:
    ${contextText}`,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}