import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

interface ToneRequest {
  text: string;
  coordinates: {
    x: number;
    y: number;
  };
  tones: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

export async function POST(request: Request) {
  try {
    const { text, coordinates, tones } = (await request.json()) as ToneRequest;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a tone adjustment expert. Rewrite the given text to match the tone indicated by these coordinates: x=${coordinates.x}, y=${coordinates.y}.
          Where: 
          - Top (y=-1) is ${tones.top}
          - Right (x=1) is ${tones.right}
          - Bottom (y=1) is ${tones.bottom}
          - Left (x=-1) is ${tones.left}`
        },
        {
          role: "user",
          content: `Please rewrite this text: "${text}"`
        }
      ]
    });

    return NextResponse.json({
      text: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
} 