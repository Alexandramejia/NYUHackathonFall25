import { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello!', sender: 'bot' },
    { id: 2, text: 'Hi there!', sender: 'user' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const newMessageObj = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
    };
    setMessages([...messages, newMessageObj]);
    setNewMessage('');
  };

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      // Display the image immediately
      setMessages(prevMessages => [...prevMessages, { id: prevMessages.length + 1, text: '', sender: 'user', image: imageUrl }]);

      const formData = new FormData();
      formData.append('image', file);

      try {
        // Step 1: Call the image classification API
        const classifyResponse = await fetch('http://127.0.0.1:5000/classify_image', {
          method: 'POST',
          body: formData,
        });

        if (classifyResponse.ok) {
          const classifyData = await classifyResponse.json();
          const classificationResult = classifyData.result; // e.g., "Low Risk"

          // Step 2: Create the prompt for the LLM
          const llmPrompt = `My AI vision model classified a patient's image as '${classificationResult}'. Write an empathetic response, but remind them to see a real doctor.`;

          // Step 3: Call the Anything LLM API
          const llmResponse = await fetch('http://127.0.0.1:3001/api/v1/workspace/your-workspace-slug/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: llmPrompt }),
          });

          if (llmResponse.ok) {
            const llmData = await llmResponse.json();
            // Step 5: Add the final text response to the messages state
            const newMessageObj = {
              id: messages.length + 2,
              text: llmData.text, // Assuming the response has a "text" property
              sender: 'bot',
            };
            setMessages(prevMessages => [...prevMessages, newMessageObj]);
          } else {
            console.error('Anything LLM API call failed');
          }
        } else {
          console.error('Image classification failed');
        }
      } catch (error) {
        console.error('Error during API calls:', error);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-log">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.sender}`}>
            {message.text}
            {message.image && <img src={message.image} alt="Uploaded" className="uploaded-image" />}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="chat-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
        <label htmlFor="file-upload" className="attach-button">
          📎 Attach
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </form>
    </div>
  );
}

export default App;
