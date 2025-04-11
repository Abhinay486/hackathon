import { useState } from "react";
import "./App.css";
import { marked } from "marked";
import ReactMarkdown from "react-markdown";
function App() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [prompt1, setPrompt1] = useState("");
  const [prompt2, setPrompt2] = useState("");
  const formatText = (text) => {
    // Add line breaks before bold headers and remove any remaining '*' symbols
    const formattedText = text
      .replace(/\*\*([^*]+)\*\*/g, "<br><strong>$1</strong>") // Adds a <br> before bold text
      .replace(/\*/g, ""); // Removes remaining '*' symbols (used for bullet points)

    // Replace any line breaks with <br> to maintain perfect alignment
    return formattedText.replace(/\n/g, "<br>");
  };
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

  const handleClick = async (prompt, setText) => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: image.type,
                data: image.base64,
              },
            },
            {
              text:
                prompt ||
                `Start the response with a heading that summarizes the symptoms in image content. Focus only on key visual elements without adding unnecessary details or disclaimers, notes.`,
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      const resultText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setText(marked.parse(resultText));
    } catch (err) {
      console.error(err);
      setText("Something went wrong.");
    }

    setLoading(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="container">
      <h1>Gemini 1.5 Pro Image + Text</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <input
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
      />
      <button
        className="fetch-btn"
        onClick={() => {
          handleClick(prompt1, setText1);
          handleClick(prompt2, setText2);
        }}
      >
        Generate
      </button>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="res" dangerouslySetInnerHTML={{ __html: text1 }} />
          <div className="res" dangerouslySetInnerHTML={{ __html: text2 }} />
        </>
      )}
    </div>
  );
}

export default App;
