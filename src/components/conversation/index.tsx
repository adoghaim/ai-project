import React from 'react';
import { BotMessage, CustomerMessage, MessageContainer, MessageDetails } from './style.js';

const ChatConversations = () => {
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/chats');
        const data = await response.json();
        if (data?.length && data[0].messages) {
          console.log('data', data);
          setMessages(data[0].messages);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Sample data
  // const conversationData = {
  //   id: '64925c4c30a14f6d3ab16910',
  //   customer_id: '91849084912jdals',
  //   messages: [
  //     {
  //       id: '1',
  //       timestamp: new Date('2023-06-20T21:00:00.000+00:00'),
  //       sender: 'customer',
  //       message: 'Hello!',
  //     },
  //     {
  //       id: '2',
  //       timestamp: new Date('2023-06-20T21:05:00.000+00:00'),
  //       sender: 'bot',
  //       message: 'Hi there! How can I help you?',
  //     },
  //     {
  //       id: '3',
  //       timestamp: new Date('2023-06-20T21:10:00.000+00:00'),
  //       sender: 'customer',
  //       message: 'I am interested in buying a car.',
  //     },
  //     {
  //       id: '4',
  //       timestamp: new Date('2023-06-20T21:15:00.000+00:00'),
  //       sender: 'bot',
  //       message:
  //         'Great! We have a wide range of cars available. What type of car are you looking for?',
  //     },
  //     {
  //       id: '5',
  //       timestamp: new Date('2023-06-20T21:20:00.000+00:00'),
  //       sender: 'customer',
  //       message: 'I need a compact SUV with good fuel efficiency.',
  //     },
  //     {
  //       id: '6',
  //       timestamp: new Date('2023-06-20T21:25:00.000+00:00'),
  //       sender: 'bot',
  //       message: 'Sure, we have some great options for you. Can you provide your budget range?',
  //     },
  //     {
  //       id: '7',
  //       timestamp: new Date('2023-06-20T21:30:00.000+00:00'),
  //       sender: 'customer',
  //       message: 'My budget is around $25,000 to $30,000.',
  //     },
  //     {
  //       id: '8',
  //       timestamp: new Date('2023-06-20T21:35:00.000+00:00'),
  //       sender: 'bot',
  //       message: "Got it! I'll check our inventory and get back to you with some suitable options.",
  //     },
  //   ],
  //   createdAt: new Date('2023-06-20T21:00:00.000+00:00'),
  //   updatedAt: new Date('2023-06-22T19:00:33.620+00:00'),
  // };

  // React.useEffect(() => {
  //   // Fetch messages data from API and set it to 'messages' state
  //   setMessages(conversationData.messages);
  // }, []);

  return (
    <MessageContainer>
      {messages?.length > 0 &&
        messages.map((message) => (
          <React.Fragment key={message.id}>
            {message.sender === 'customer' ? (
              <CustomerMessage>
                {message.message}
                <MessageDetails className="message-details">
                  {message.timestamp.toLocaleString()}
                </MessageDetails>
              </CustomerMessage>
            ) : (
              <BotMessage>
                {message.message}
                <MessageDetails className="message-details" alignRight>
                  {message.timestamp.toLocaleString()}
                </MessageDetails>
              </BotMessage>
            )}
          </React.Fragment>
        ))}
    </MessageContainer>
  );
};

export default ChatConversations;
