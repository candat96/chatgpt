import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');

  const apiKey = 'sk-cI8F4OQOkyzW8SGBILOGdSaNa3k5lhDX4mZbGRwgxbT3BlbkFJDxYW0SqzKwPRJpG69_xXmY53N0u265SPp3a5EUGxUA'; // API key
  const [model, setModel] = useState('gpt-4'); // Model mặc định

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setStreamingResponse(''); // Reset phản hồi trước

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: updatedMessages, // Gửi toàn bộ lịch sử hội thoại
          stream: true, // Bật stream để nhận phản hồi dần dần
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let assistantMessage = { role: 'assistant', content: '' };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          console.log(line);
          if (line === 'data: [DONE]') break;

          if (line.startsWith('data:')) {
            const json = JSON.parse(line.substring(5));

            if (json.choices && json.choices[0].delta.content) {
              const delta = json.choices[0].delta.content;
              assistantMessage.content += delta;
              setStreamingResponse((prev) => prev + delta);
            }
          }
        }
      }

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
    } finally {
      setLoading(false);
      setStreamingResponse(''); // Xóa streamingResponse khi phản hồi đã hoàn thành
    }
  };

  return (
    <div className="App">
      <h1>Chat with GPT-4</h1>

      <div className="settings">
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model (e.g., gpt-4, gpt-3.5-turbo)"
        />
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

      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
