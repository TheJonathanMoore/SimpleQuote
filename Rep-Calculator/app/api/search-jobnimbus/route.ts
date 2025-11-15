import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  displayName: string;
  address: string;
  jnid: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    const jnApiKey = process.env.JOBNIMBUS_API_KEY;
    if (!jnApiKey) {
      return NextResponse.json(
        { error: 'JobNimbus API key not configured' },
        { status: 500 }
      );
    }

    // Split query into parts for first/last name searching
    const queryParts = query.trim().split(/\s+/);

    // Build filter objects for different search scenarios
    const filters = [];

    // If multiple words, try first and last name separately
    if (queryParts.length > 1) {
      filters.push({
        must: [
          {
            term: {
              first_name: queryParts[0],
            },
          },
          {
            term: {
              last_name: queryParts.slice(1).join(' '),
            },
          },
        ],
      });
    }

    // Single word search - search first name OR last name OR company
    filters.push({
      should: [
        {
          term: {
            first_name: query,
          },
        },
        {
          term: {
            last_name: query,
          },
        },
        {
          term: {
            company: query,
          },
        },
      ],
      minimum_should_match: 1,
    });

    // Wildcard search for partial matches
    filters.push({
      should: [
        {
          wildcard: {
            first_name: `*${query}*`,
          },
        },
        {
          wildcard: {
            last_name: `*${query}*`,
          },
        },
        {
          wildcard: {
            company: `*${query}*`,
          },
        },
      ],
      minimum_should_match: 1,
    });

    // Fetch results from all filter queries
    const allResults = new Map<string, SearchResult>();

    for (const filter of filters) {
      try {
        const filterJson = JSON.stringify(filter);
        const searchUrl = `https://app.jobnimbus.com/api1/contacts?size=20&filter=${encodeURIComponent(filterJson)}`;

        console.log(`Searching JobNimbus with filter:`, filter);

        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            Authorization: `bearer ${jnApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`JobNimbus response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const contacts = Array.isArray(data) ? data : data.results || data.contacts || [];
          console.log(`JobNimbus returned ${contacts.length} results`);

          // Transform and add results (using jnid as key to avoid duplicates)
          contacts.forEach((contact: any) => {
            const displayName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company || '';
            const address = contact.address_line1
              ? `${contact.address_line1}${contact.city ? ', ' + contact.city : ''}`
              : 'No address';

            if (!allResults.has(contact.jnid)) {
              allResults.set(contact.jnid, {
                id: contact.jnid || contact.recid,
                displayName: displayName,
                address: address,
                jnid: contact.jnid || contact.recid,
              });
            }
          });
        } else {
          const errorData = await response.text();
          console.error(`JobNimbus API error (${response.status}):`, errorData);
        }
      } catch (err) {
        console.error(`Error with filter search:`, err);
        // Continue with next filter
      }
    }

    // Convert map to array and limit to 10 results
    const results: SearchResult[] = Array.from(allResults.values()).slice(0, 10);
    console.log(`Returning ${results.length} total results`);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching JobNimbus:', error);
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}
