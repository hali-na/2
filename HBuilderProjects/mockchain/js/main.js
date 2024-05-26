// 引入Supabase库
import { supabase } from '../supabaseClient.js';

document.addEventListener("DOMContentLoaded", function() {
  async function handleLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    const { data: user, error } = await supabase.auth.signInWithPassword({
      username: username,
      password: password,
    });

    if (error) {
      console.error('Login error:', error.message);
      errorMessage.textContent = 'Login failed: ' + error.message;
      return;
    }

    // 登录成功,跳转到视频池页面
    window.location.href = 'video-pool.html';
  }

  document.getElementById("login-button").addEventListener("click", handleLogin);
});
