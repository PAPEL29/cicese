export const prerender = false;

export async function POST({ request }) {
    try {
        const { messages } = await request.json();
        const apiKey = import.meta.env.OPENAI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Falta la API Key en las variables de entorno" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}