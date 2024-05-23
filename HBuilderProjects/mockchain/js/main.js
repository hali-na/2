// 引入Supabase库
import { supabase } from '../supabaseClient.js';

document.addEventListener("DOMContentLoaded", function() {
  async function handleSubmit() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      errorMessage.textContent = 'An error occurred. Please try again.';
      return;
    }

    if (existingUser) {
      // 用户名已存在，尝试登录
      const { data: user, error } = await supabase.auth.signInWithPassword({
        username: username,
        password: password,
      });

      if (error) {
        console.error('Login error:', error.message);
        errorMessage.textContent = 'Login failed: ' + error.message;
        return;
      }

      // 登录成功，跳转到视频池页面
      window.location.href = '/public/video-pool.html';
    } else {
      // 用户名不存在，尝试注册
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        username: username,
        password: password,
      });

      if (signUpError) {
        console.error('Registration error:', signUpError.message);
        errorMessage.textContent = 'Registration failed: ' + signUpError.message;
        return;
      }

      await supabase.from('profiles').insert([
        { username: username, password: password }
      ]);

      // 注册成功，跳转到用户注册页面进行视频录制
      window.location.href = '/public/register-video.html';
    }
  }

  document.getElementById("submit-button").addEventListener("click", handleSubmit);
});
