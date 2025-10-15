import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey });

export const generateHeadshot = async (base64Image: string, mimeType: string, description: string): Promise<string> => {
  const fullPrompt = `
    Transform the provided image into a professional, studio-quality headshot.
    The final image must be well-lit with soft, even lighting, suitable for a corporate or business profile like LinkedIn.
    The background must be a neutral, blurred background (like a solid light gray, or a soft office blur).
    The person's facial details must be sharp and in focus.
    The person should be centered, looking at the camera with a natural, confident expression.
    The final image must be highly realistic, resembling a photograph taken with a high-end DSLR camera.
    Strictly do not include any text, watermarks, or logos.
    ${description ? `Incorporate these user instructions: "${description}"` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: fullPrompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image was generated. The response from the API was empty.");
  } catch (error) {
    console.error("Error generating image with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate headshot: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the headshot.");
  }
};