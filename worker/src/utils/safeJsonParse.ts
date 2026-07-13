export function safeJsonParse(raw: string): unknown | null {
    let cleaned = raw.trim();

    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
        cleaned = cleaned.replace(/\s*```$/, '');
        cleaned = cleaned.trim();
    }

    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}