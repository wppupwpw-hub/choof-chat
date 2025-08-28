import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);

    const params = new URLSearchParams();
    params.append("text", body.prompt);
    params.append("quality", "medium");
    params.append("size", "512x512");

    const apiUrl = `http://23.95.85.59/ai/image.php?${params.toString()}`;
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error("Image API failed");

    // نحفظ الصورة كـ Base64 أو نرجع URL مباشر
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const url = `data:image/png;base64,${base64}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
