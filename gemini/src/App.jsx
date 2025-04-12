import { useState } from "react";
import "./App.css";
import { marked } from "marked";
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [prompt1, setPrompt1] = useState("");
  const [prompt2, setPrompt2] = useState("");

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      setImage({ base64, type: file.type });
    };
    reader.readAsDataURL(file);
  };
  const defaultPrompt = `
Analyze the image carefully and provide a detailed medical assessment. Structure the response using the following headings, and present the content in simple, clear bullet points:

### 1. Symptoms
List the key symptoms that are visually noticeable or commonly associated with the condition shown in the image.

### 2. Measures to Reduce Symptoms
Suggest effective home remedies, medical practices, or supportive treatments that help reduce or manage the symptoms.

### 3. Best Diet
Recommend the most suitable diet or foods that promote healing, reduce inflammation, or support recovery.

### 4. Precautions
Mention the important precautions or lifestyle adjustments the patient should follow to prevent worsening of the condition.

### 5. Tablets / Medications
Provide a list of commonly used over-the-counter or prescription medications/tablets used to treat or relieve the condition.
`;
  const handleClick = async (prompt, setText) => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const imagePart = {
      inlineData: {
        mimeType: image.type,
        data: image.base64,
      },
    };

    try {
      const result = await model.generateContentStream({
        contents: [
          {
            role: "user",
            parts: [imagePart, { 
                text: defaultPrompt
            }],
          },
        ],
      });

      let fullText = "";
      setText(""); // Clear old text

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setText(marked.parse(fullText)); // render markdown progressively
      }
    } catch (err) {
      console.error(err);
      setText("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Gemini 1.5 Pro Image + Text</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
    <br />
      {/* <input
        type="text"
        placeholder="Enter your prompt1 (optional)"
        value={prompt1}
        onChange={(e) => setPrompt1(e.target.value)}
        className="prompt-input"
      />
      <input
        type="text"
        placeholder="Enter your prompt2 (optional)"
        value={prompt2}
        onChange={(e) => setPrompt2(e.target.value)}
        className="prompt-input"
      /> */}

      <button
        className="fetch-btn"
        onClick={() => {
          handleClick(prompt1, setText1);
          handleClick(prompt2, setText2);
        }}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="res" dangerouslySetInnerHTML={{ __html: text1 }} />
          {/* <div className="res" dangerouslySetInnerHTML={{ __html: text2 }} /> */}
        </>
      )}
    </div>
  );
}

export default App;
