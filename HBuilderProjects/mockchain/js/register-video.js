import { createClient } from '../supabaseClient.js';

const supabase = createClient();

let mediaRecorder;
let recordedBlobs = [];
let currentQuestionIndex = 0;
const questions = [
  'Tell me about yourself',
  'What is your biggest challenge?',
  'What is your biggest achievement?'
];

document.addEventListener("DOMContentLoaded", async function() {
  const user = supabase.auth.user();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  function startCountdown() {
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    countdownElement.innerHTML = countdown;

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        countdownElement.innerHTML = countdown;
      } else {
        clearInterval(interval);
        countdownElement.innerHTML = 'Start!';
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

    document.getElementById('start-recording-button').style.display = 'none';
    document.getElementById('stop-recording-button').style.display = 'block';

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        stopRecording();
      }
    }, 60000); // 自动停止录制60秒
  }

  function stopRecording() {
    mediaRecorder.stop();
    const video = document.getElementById("video");
    video.srcObject.getTracks().forEach(track => track.stop());
    const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
    video.src = window.URL.createObjectURL(superBuffer);
    document.getElementById('stop-recording-button').style.display = 'none';
    document.getElementById('playback-button').style.display = 'block';
    document.getElementById('re-record-button').style.display = 'block';
    document.getElementById('next-question-button').style.display = 'block';
  }

  function playbackRecording() {
    const video = document.getElementById("video");
    video.play();
  }

  async function reRecord() {
    recordedBlobs = [];
    showNextQuestion();
  }

  async function showNextQuestion() {
    if (currentQuestionIndex < questions.length) {
      document.getElementById('question').textContent = questions[currentQuestionIndex];
      document.getElementById('start-recording-button').style.display = 'block';
      document.getElementById('stop-recording-button').style.display = 'none';
      document.getElementById('playback-button').style.display = 'none';
      document.getElementById('re-record-button').style.display = 'none';
      document.getElementById('next-question-button').style.display = 'none';
    } else {
      await submitVideos();
    }
  }

  async function submitVideos() {
    const formData = new FormData();
    recordedBlobs.forEach((blob, index) => {
      formData.append(`video${index + 1}`, blob, `video${index + 1}.webm`);
    });

    // 将视频上传到Supabase存储
    for (let i = 0; i < recordedBlobs.length; i++) {
      const { data, error } = await supabase
        .storage
        .from('temporary-register-videos')
        .upload(`${user.username}/video${i + 1}.webm`, recordedBlobs[i], {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading video:', error.message);
        return;
      }
    }

    // 视频上传完成后，完成注册流程
    await supabase.from('profiles').insert([
      { username: user.username }
    ]);

    // 将视频从临时存储移动到永久存储
    for (let i = 0; i < recordedBlobs.length; i++) {
      await supabase
        .storage
        .from('temporary-register-videos')
        .move(`${user.username}/video${i + 1}.webm`, `videos/${user.username}/video${i + 1}.webm`);
    }

    window.location.href = '/video-pool.html';
  }

  document.getElementById('start-recording-button').addEventListener('click', startCountdown);
  document.getElementById('stop-recording-button').addEventListener('click', stopRecording);
  document.getElementById('playback-button').addEventListener('click', playbackRecording);
  document.getElementById('re-record-button').addEventListener('click', reRecord);
  document.getElementById('next-question-button').addEventListener('click', () => {
    currentQuestionIndex++;
    showNextQuestion();
  });

  showNextQuestion();
});
