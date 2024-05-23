import { createClient } from '../supabaseClient.js';

// 初始化Supabase
const supabase = createClient();

document.addEventListener("DOMContentLoaded", async function() {
  const user = supabase.auth.user();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  let currentChatId = null;

  // 加载聊天列表
  async function loadChatList() {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .contains('user_ids', [user.username]);

    if (error) {
      console.error('Error loading chat list:', error.message);
      return;
    }

    const chatListContainer = document.querySelector('.chat-list');
    chatListContainer.innerHTML = '';
    chats.forEach(chat => {
      const otherUser = chat.user_ids.find(username => username !== user.username);
      const chatElement = document.createElement('div');
      chatElement.className = 'chat-item';
      chatElement.textContent = otherUser;
      chatElement.onclick = () => openChat(chat.id);
      chatListContainer.appendChild(chatElement);
    });
  }

  // 打开聊天窗口
  async function openChat(chatId) {
    currentChatId = chatId;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error.message);
      return;
    }

    const chatWindow = document.querySelector('.chat-window');
    chatWindow.innerHTML = '';
    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      messageElement.textContent = `${message.sender}: ${message.content}`;
      chatWindow.appendChild(messageElement);
    });
  }

  // 发送消息
  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value;
    if (!content || !currentChatId) return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: currentChatId, sender: user.username, content }]);

    if (error) {
      console.error('Error sending message:', error.message);
      return;
    }

    input.value = '';
    openChat(currentChatId);
  }

  loadChatList();

  window.sendMessage = sendMessage;
});
