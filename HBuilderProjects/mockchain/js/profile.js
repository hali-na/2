import { createClient } from '../supabaseClient.js';
import Web3 from 'web3';

// 初始化Supabase
const supabase = createClient();

document.addEventListener("DOMContentLoaded", async function() {
  const usernameElement = document.getElementById("username");
  const tokenBalanceElement = document.getElementById("token-balance");
  const membershipElement = document.getElementById("membership");
  const flashCardsElement = document.getElementById("flash-cards");
  const videoListElement = document.getElementById("video-list");

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('username, tokens, membership, flash_cards')
    .eq('username', supabase.auth.user().user_metadata.username)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError.message);
    return;
  }

  usernameElement.textContent = userProfile.username;
  tokenBalanceElement.textContent = userProfile.tokens || 0;
  membershipElement.textContent = userProfile.membership || "None";
  flashCardsElement.textContent = userProfile.flash_cards || 0;

  const { data: userVideos, error: videosError } = await supabase
    .from('videos')
    .select('id, url, title')
    .eq('username', userProfile.username);

  if (videosError) {
    console.error('Videos fetch error:', videosError.message);
    return;
  }

  userVideos.forEach(video => {
    const videoElement = document.createElement('div');
    videoElement.className = 'video-container';
    videoElement.innerHTML = `
      <h4>${video.title}</h4>
      <video src="${video.url}" controls></video>
      <button onclick="deleteVideo('${video.id}')">Delete</button>
    `;
    videoListElement.appendChild(videoElement);
  });

  document.getElementById("connect-wallet-button").addEventListener("click", connectWallet);
  document.getElementById("record-new-video-button").addEventListener("click", recordNewVideo);

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        alert(`Connected to wallet: ${account}`);
      } catch (error) {
        console.error('Wallet connection error:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  }

  async function recordNewVideo() {
    const customTitle = prompt("Enter custom title or leave blank for a random question:");
    if (customTitle) {
      window.location.href = `/record-video.html?title=${encodeURIComponent(customTitle)}`;
    } else {
      const randomTitle = await getRandomTitle();
      window.location.href = `/record-video.html?title=${encodeURIComponent(randomTitle)}`;
    }
  }

  async function getRandomTitle() {
    const questions = [
      "Tell me about yourself.",
      "What is your biggest challenge?",
      "What is your biggest achievement?",
      // 添加更多问题
    ];
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }
});

async function deleteVideo(videoId) {
  await supabase.from('videos').delete().eq('id', videoId);
  alert('Video deleted successfully.');
  window.location.reload();
}
