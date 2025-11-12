import { NextRequest, NextResponse } from 'next/server';
import faqs from '@/data/faqs.json';

interface FAQ {
    id: string;
    title: string;
    body: string;
}

interface SearchResult extends FAQ {
    score: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query } = body;

        if (!query || typeof query !== 'string' || query.trim() === '') {
            return NextResponse.json(
                { error: 'Query parameter is required and cannot be empty' },
                { status: 400 }
            );
        }

        const results = search(query.trim());
        if (results.length === 0) {
            return NextResponse.json({
                results: [],
                message: 'No matches found for your query. Try different keywords.',
                summary: null,
                sources: []
            });
        }

        const topResults = results.slice(0, 3);
        const response = {
            results: topResults.map(({ id, title, body }) => ({
                id,
                title,
                body
            })),
            summary: generateSummary(topResults, query.trim()),
            sources: topResults.map(r => r.id),
            message: `Found ${topResults.length} match${topResults.length !== 1 ? 'es' : ''}`
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'An error occurred while processing your search' },
            { status: 500 }
        );
    }
}

function search(query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    const scoredResults: SearchResult[] = faqs.map((faq) => {
        let score = 0;
        const titleLower = faq.title.toLowerCase();
        const bodyLower = faq.body.toLowerCase();

        // exact phrase match in title and bodu (highest priority)
        if (titleLower.includes(queryLower))   score += 20;
        if (bodyLower.includes(queryLower))   score += 10;

        queryTerms.forEach(term => {
            if (titleLower.includes(term))  score += 5;
            if (bodyLower.includes(term))   score += 2;
          
        });

        return {
            ...faq,
            score
        };
    });

    // filtered out non-matches & sorted by score
    const filteredResults = scoredResults
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);
    return filteredResults;
}

function generateSummary(results: SearchResult[], query: string): string {
    if (results.length === 0) return '';

    const count = results.length;

    // Extract key topics from the results
    const allText = results.map(r => `${r.title} ${r.body}`).join(' ').toLowerCase();
    const keywords = ['conversion', 'trust', 'form', 'badge', 'cta', 'button', 'headline', 'testimonial', 'urgency', 'pricing', 'checkout', 'funnel', 'landing', 'optimization', 'test', 'experiment'];
    const foundKeywords = keywords.filter(keyword => allText.includes(keyword));

    // Build contextual summary
    let summary = `Your search for "${query}" returned ${count} relevant result${count > 1 ? 's' : ''}.`;

    if (foundKeywords.length > 0) {
        const topKeywords = foundKeywords.slice(0, 3);
        summary += ` The results focus on ${topKeywords.join(', ')} strategies.`;
    }

    // Add high-level overview based on top result
    if (results.length > 0) {
        const topResult = results[0];
        const firstSentence = topResult.body.split('.')[0];
        if (firstSentence && firstSentence.length < 120) {
            summary += ` Top result: ${firstSentence}.`;
        }
    }

    return summary;
}