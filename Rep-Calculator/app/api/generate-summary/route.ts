import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface LineItem {
  id: string;
  quantity: string;
  description: string;
  rcv: number;
  acv?: number;
  checked: boolean;
  notes: string;
}

interface Trade {
  id: string;
  name: string;
  checked: boolean;
  lineItems: LineItem[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trades } = body;

    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json(
        { error: 'Invalid trades data' },
        { status: 400 }
      );
    }

    // Collect work doing and work not doing items
    const workDoing: string[] = [];
    const workNotDoing: string[] = [];

    trades.forEach((trade: Trade) => {
      trade.lineItems.forEach((item: LineItem) => {
        if (item.checked) {
          workDoing.push(`${item.description} (${item.quantity})`);
        } else {
          workNotDoing.push(`${item.description} (${item.quantity})`);
        }
      });
    });

    // Create prompt for AI to generate natural language summary
    const prompt = `You are an insurance claim scope of work expert. Generate brief, professional natural language summaries based on the work items listed.

Work Being Done:
${workDoing.length > 0 ? workDoing.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'None'}

Work NOT Being Done:
${workNotDoing.length > 0 ? workNotDoing.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'None'}

Please provide:
1. A "Work Doing Summary" - ONE SENTENCE ONLY describing all the work being performed
2. A "Work Not Doing Summary" - ONE SENTENCE ONLY describing all the work that is NOT included in this scope

Keep summaries extremely concise and professional. Use simple language.

Format your response as JSON with these exact keys:
{
  "workDoingSummary": "...",
  "workNotDoingSummary": "..."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const summaries = JSON.parse(jsonMatch[0]);

    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
