export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
        isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
      }`}>
        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
        <span className={`text-xs mt-1 block ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}