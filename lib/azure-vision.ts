export interface ImageAnalysis {
  isBuilding: boolean
  isUsable: boolean
  qualityIssues: string[]
  description: string
  suggestions: string[]
}

export async function analyzeImageWithAzure(
  imageUrl: string
): Promise<ImageAnalysis> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT

  if (!endpoint || !apiKey || !deployment) {
    console.warn('Azure OpenAI not configured — rejecting image for safety')
    return {
      isBuilding: false,
      isUsable: false,
      qualityIssues: ['Image validation service not configured'],
      description: 'Analysis skipped (Azure OpenAI not configured)',
      suggestions: ['Please contact support — image validation is temporarily unavailable.'],
    }
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`

  const body = {
    messages: [
      {
        role: 'system',
        content: `You are a STRICT image validator for a house/building renovation app. Your job is to REJECT any image that is NOT a real photograph showing an identifiable house or building structure. Analyze the uploaded photo and respond ONLY with valid JSON (no markdown, no code fences). Use this exact schema:
{
  "isBuilding": boolean,       // true ONLY if the image shows a recognizable house or building structure
  "isUsable": boolean,          // true if quality is good enough for renovation analysis
  "qualityIssues": string[],   // list of specific quality problems (blur, dark, overexposed, low detail, etc.)
  "description": string,        // one-line description of what the image shows
  "suggestions": string[]      // actionable tips if the image is not ideal
}

Rules:
- isBuilding = true ONLY if the image shows an identifiable house, building, or room where you can see the overall structure (e.g. a house exterior with roof/windows/doors visible, or a room interior showing walls+floor/ceiling together)
- isBuilding = false for ALL of the following:
  * Close-up textures of surfaces (stone, brick, wood, concrete, tile patterns)
  * Material samples or swatches
  * Single isolated wall surfaces without any building context
  * People, animals, cars, food, landscapes without buildings
  * Selfies, memes, screenshots, documents, abstract art
  * Random objects, nature scenes, sky photos
  * Construction materials (loose bricks, paint cans, tools)
  * Any image where you cannot identify it as a specific house or building
- The image MUST show enough of a building to understand its structure — a zoomed-in patch of wall texture or stone pattern is NOT a building photo
- When in doubt, set isBuilding = false — reject borderline images
- isUsable = false if the image is extremely blurry, nearly black/white, corrupted, or not a real photograph
- qualityIssues should be empty if the image is good
- suggestions should help the user take a better photo if needed`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image for use in a house exterior renovation tool:',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'low' },
          },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.1,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Azure OpenAI error:', response.status, errText)
    return {
      isBuilding: false,
      isUsable: false,
      qualityIssues: ['Image validation service error'],
      description: 'Analysis unavailable',
      suggestions: ['Please try again in a moment.'],
    }
  }

  const data = await response.json()
  const content: string = data.choices?.[0]?.message?.content || ''

  try {
    const cleaned = content.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as ImageAnalysis
    return {
      isBuilding: Boolean(parsed.isBuilding),
      isUsable: Boolean(parsed.isUsable),
      qualityIssues: Array.isArray(parsed.qualityIssues) ? parsed.qualityIssues : [],
      description: parsed.description || '',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch {
    console.error('Failed to parse Azure OpenAI response:', content)
    return {
      isBuilding: false,
      isUsable: false,
      qualityIssues: ['Failed to validate image content'],
      description: content.slice(0, 100),
      suggestions: ['Please try uploading again.'],
    }
  }
}
