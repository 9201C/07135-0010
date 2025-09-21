import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "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", 
  dangerouslyAllowBrowser: true               
});

export async function transcribeAudio(blob) {
  try {
    const file = new File([blob], "recording.webm", { type: "audio/webm" });

    const result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return result.text; // the transcription
  } catch (err) {
    console.error("Transcription failed:", err);
    return null;
  }
}
