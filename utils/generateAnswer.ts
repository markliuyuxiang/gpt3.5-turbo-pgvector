// path: /utils/generateAnswer.ts
const generateAnswer = async (question: string): Promise<string> => {
    const response = await fetch("/api/docs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
      }),
    });
  
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  
    if (!response.body) {
      return "";
    }
  
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  
    const data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (let chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
  
    const textDecoder = new TextDecoder();
    const decodedData = textDecoder.decode(data);
  
    return decodedData;
  };
  
  export default generateAnswer;
  