import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const body = await request.json();
  const { scraper, brandId } = body;

  if (!scraper) {
    return NextResponse.json(
      { error: 'Scraper type is required (competitor, comments, trends, or all)' },
      { status: 400 }
    );
  }

  const validScrapers = ['competitor', 'comments', 'trends', 'all'];
  if (!validScrapers.includes(scraper)) {
    return NextResponse.json(
      { error: `Invalid scraper type. Must be one of: ${validScrapers.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // Note: In production, you'd want to run this in a background job queue
    // For now, we'll return a message that the scraper needs to be run manually

    return NextResponse.json({
      message: 'Scraper execution scheduled',
      scraper,
      brandId,
      note: 'To run scrapers, use: npm run ' + scraper + ' from the project directory'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
