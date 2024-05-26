import { createClient } from '../supabaseClient.js';

// 初始化Supabase
const supabase = createClient();

document.addEventListener("DOMContentLoaded", function() {
  const inviteCodeInput = document.getElementById('invite-code');
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = urlParams.get('ref');
  if (referrer) {
    inviteCodeInput.value = referrer;
  }

  async function handleSubmit() {
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;  // 确保有电子邮件输入字段
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const inviteCode = inviteCodeInput.value;
    const errorMessage = document.getElementById("error-message");

    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match.';
      return;
    }

    // 检查用户名是否已存在
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (userError && userError.status !== 406) {
      console.error('Fetch error:', userError.message);
      errorMessage.textContent = 'An error occurred. Please try again.';
      return;
    }

    if (existingUser) {
      errorMessage.textContent = 'Username already exists.';
      return;
    }

    // 注册用户
    const { user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password
    }, {
      data: {
        username: username  // 保存用户名到用户元数据
      }
    });

    if (signUpError) {
      console.error('Registration error:', signUpError.message);
      errorMessage.textContent = 'Registration failed: ' + signUpError.message;
      return;
    }

    // 存储额外用户信息
    await supabase.from('profiles').insert([
      { id: user.id, username: username, invite_code: inviteCode }
    ]);

    if (inviteCode) {
      // 邀请码逻辑处理
    }

    // 自动登录用户
    const { error: signInError } = await supabase.auth.signIn({
      email: email,
      password: password
    });

    if (signInError) {
      console.error('Sign in error:', signInError.message);
      errorMessage.textContent = 'Sign in failed: ' + signInError.message;
    } else {
      // 用户登录成功后，重定向到视频录制页面
      window.location.href = '/register-video.html'; // 确保该 URL 是正确的
    }
  }

  document.getElementById("register-submit-button").addEventListener("click", handleSubmit);
});
