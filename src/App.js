import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [apiKey, setApiKey] = useState(''); // API key
  const [model, setModel] = useState(''); // Model mặc định
  const [settingsSaved, setSettingsSaved] = useState(false); // Trạng thái đã lưu cài đặt
  const [error, setError] = useState(''); // Trạng thái hiển thị thông báo lỗi

  // Hàm xử lý khi nhấn nút Save
  const handleSaveSettings = () => {
    if (!apiKey || !model) {
      setError('Please enter both API key and model to proceed.');
      return;
    }
    setError('');
    setSettingsSaved(true); // Đánh dấu cài đặt đã lưu
  };

  // Hàm xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!settingsSaved) {
      setError('Please save your API key and model first.');
      return;
    }

    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingResponse(''); // Reset phản hồi trước

    try {
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${apiKey}`, // Sử dụng API key đã lưu
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [...messages, userMessage],
          stream: true, // Bật stream để nhận phản hồi dần dần
        },
        requestOptions
      );

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            const text = new TextDecoder().decode(value);
            const payloads = text.split('\n\n');
            for (const payload of payloads) {
              if (payload.includes('[DONE]')) return;
              if (payload.trim().startsWith('data:')) {
                const json = JSON.parse(payload.trim().substring(5));
                if (json.choices) {
                  const delta = json.choices[0].delta.content;
                  if (delta) {
                    setStreamingResponse((prev) => prev + delta);
                  }
                }
              }
            }
          }
        },
      });
      stream.getReader();
    } catch (error) {
      console.error('Error fetching response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Chat with GPT-4</h1>

      {/* Hiển thị thông báo lỗi nếu có */}
      {error && <div className="error">{error}</div>}

      {/* Nhập API key và model */}
      <div className="settings">
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your OpenAI API key"
        />
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model (e.g., gpt-4, gpt-4-turbo, gpt-3.5-turbo)"
        />
        <button onClick={handleSaveSettings}>Save</button>
      </div>

      <div className="chat-box">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.content}
          </div>
        ))}
        {streamingResponse && (
          <div className="message assistant">
            {streamingResponse}
          </div>
        )}
      </div>

      {/* Khung nhập tin nhắn và nút gửi */}
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={!settingsSaved} // Không cho nhập khi chưa lưu cài đặt
        />
        <button onClick={handleSend} disabled={loading || !settingsSaved}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
