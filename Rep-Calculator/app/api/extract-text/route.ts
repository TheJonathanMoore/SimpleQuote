import { NextRequest, NextResponse } from 'next/server';

interface ExtractionRequest {
  text: string; // Already extracted text from client-side
  filename: string;
}

/**
 * This endpoint receives pre-extracted text from the client.
 * All extraction (PDF and OCR) happens client-side to avoid Node.js DOM API issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExtractionRequest;
    const { text, filename } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text to process' },
        { status: 400 }
      );
    }

    // Clean up the text
    const cleanedText = cleanExtractedText(text);

    return NextResponse.json({
      success: true,
      text: cleanedText,
      filename,
      sourceType: 'extracted',
    });
  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process text' },
      { status: 500 }
    );
  }
}

function cleanExtractedText(text: string): string {
  // Remove extra whitespace
  let cleaned = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  // Remove control characters by filtering non-printable characters
  cleaned = cleaned.split('').filter((char) => {
    const code = char.charCodeAt(0);
    // Keep printable ASCII and common whitespace
    return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
  }).join('');

  cleaned = cleaned
    .replace(/([^\w\s\n\-$.])\1{3,}/g, '') // Remove repeated junk characters
    .replace(/\n{3,}/g, '\n\n'); // Remove excessive newlines

  return cleaned.trim();
}
