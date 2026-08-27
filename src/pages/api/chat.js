export const prerender = false;

export async function POST({ request }) {
    try {
        const apiKey = import.meta.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Falta la API Key de Gemini en el .env" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { messages } = await request.json();

        // Instrucción de sistema estricta para evitar recomendaciones y enfocar en indagación
        const systemPrompt = `Eres el asistente virtual de soporte emocional de MindCare. Tu único objetivo es practicar la escucha activa e indagar en las emociones del usuario.

REGLAS STRICTAS:
1. NUNCA des consejos, recomendaciones, soluciones, ejercicios ni diagnósticos.
2. NUNCA le digas al usuario qué hacer o qué pensar.
3. Estructura SIEMPRE tu respuesta en dos partes cortas:
   - Una frase breve que valide de forma empática lo que siente.
   - Una sola pregunta abierta reflexiva para invitar al usuario a indagar más a fondo en su sentir.
4. Mantén tus respuestas extremadamente concisas (máximo 2 o 3 oraciones), ideales para pantalla móvil.`;

        // Convertir el historial al formato de Gemini
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        // Petición a la API de Gemini
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: contents,
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 120
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify({ error: data.error?.message || "Error en la API de Gemini" }), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "¿Podrías contarme un poco más sobre cómo te sientes?";

        return new Response(JSON.stringify({
            choices: [{ message: { content: botReply } }]
        }), {
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