import { createClient } from '../supabaseClient.js';

// 初始化Supabase
const supabase = createClient();

const questions = [
  "Tell me about yourself.",
  "What is your biggest challenge?",
  "What is your biggest achievement?",
  "Describe a time you worked in a team.",
  "How do you handle stress?",
  // 添加更多问题，总计100个
];

let currentQuestionIndex = 0;
let mediaRecorder;
let recordedBlobs = [];
let recordedVideos = [];
let customQuestion = null;

document.addEventListener("DOMContentLoaded", async function() {
  const user = supabase.auth.user();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const questionType = urlParams.get('type');
  customQuestion = urlParams.get('question');

  document.getElementById('stop-recording-button').addEventListener('click', stopRecording);
  document.getElementById('next-question-button').addEventListener('click', showNextQuestion);
  document.getElementById('submit-button').addEventListener('click', submitVideo);

  async function showNextQuestion() {
    if (currentQuestionIndex < 3) {
      const questionTitle = document.getElementById('question-title');
      if (questionType === 'custom' && customQuestion) {
        questionTitle.textContent = customQuestion;
      } else {
        const randomIndex = Math.floor(Math.random() * questions.length);
        questionTitle.textContent = questions[randomIndex];
      }
      customQuestion = null; // Reset custom question for subsequent questions
      startCountdown();
      currentQuestionIndex++;
    } else {
      // 完成视频录制，将视频保存到数据库并跳转到视频池页面
      submitVideo();
    }
  }

  function startCountdown() {
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    countdownElement.innerHTML = `Get ready: ${countdown}`;

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        countdownElement.innerHTML = `Get ready: ${countdown}`;
      } else {
        clearInterval(interval);
        countdownElement.innerHTML = '';
        startRecording();
      }
    }, 1000);
  }

  async function startRecording() {
    const video = document.getElementById("video");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;
    mediaRecorder = new MediaRecorder(stream);
    recordedBlobs = [];
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    };
    mediaRecorder.start();

    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        stopRecording();
      }
    }, 60000); // 60秒后自动停止录制
  }

  function stopRecording() {
    mediaRecorder.stop();
    const video = document.getElementById("video");
    video.srcObject.getTracks().forEach(track => track.stop());
    const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
    recordedVideos.push(superBuffer);
    video.src = window.URL.createObjectURL(superBuffer);
    document.getElementById('playback-button').style.display = 'block';
    document.getElementById('re-record-button').style.display = 'block';
    document.getElementById('next-question-button').style.display = 'block';
    document.getElementById('submit-button').style.display = 'block';
  }

  async function submitVideo() {
    const formData = new FormData();
    recordedVideos.forEach((video, index) => {
      formData.append(`video${index + 1}`, video, `video${index + 1}.webm`);
    });

    fetch('https://your-backend-api.com/upload', {
      method: 'POST',
      body: formData
    }).then(response => response.json())
      .then(async data => {
        console.log('Success:', data);
        // 更新用户信息
        await supabase.from('profiles').update({ registration_complete: true }).eq('id', user.id);
        window.location.href = '/video-pool.html';
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  showNextQuestion();
});
