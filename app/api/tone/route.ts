import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, x, y } = await request.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a tone adjustment expert. Rewrite the given text to match the tone indicated by these coordinates: x=${x}, y=${y}. 
          Where: 
          - Top (y=-1) is Gen Z style (informal, internet slang, emojis)
          - Right (x=1) is Millennial style (casual, friendly, some emojis)
          - Bottom (y=1) is Gen X style (straightforward, slightly cynical)
          - Left (x=-1) is Boomer style (formal, traditional)`
        },
        {
          role: "user",
          content: `Please rewrite this text: "${text}"`
        }
      ]
    });

    return NextResponse.json({ text: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
} 