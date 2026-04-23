export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-5 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg rounded-br-md'
            : 'bg-white/80 backdrop-blur-sm border border-white/50 text-gray-800 shadow-md rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{message.content}</p>
        <span className={`text-xs mt-2 block ${isUser ? 'text-indigo-100' : 'text-gray-400'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}