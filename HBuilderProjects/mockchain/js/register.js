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
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const inviteCode = inviteCodeInput.value;
    const errorMessage = document.getElementById("error-message");

    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match.';
      return;
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError.message);
      errorMessage.textContent = 'An error occurred. Please try again.';
      return;
    }

    if (existingUser) {
      errorMessage.textContent = 'Username already exists.';
      return;
    }

    const { user: newUser, error: signUpError } = await supabase.auth.signUp({
      email: `${username}@mockchain.com`,
      password: password
    });

    if (signUpError) {
      console.error('Registration error:', signUpError.message);
      errorMessage.textContent = 'Registration failed: ' + signUpError.message;
      return;
    }

    await supabase.from('profiles').insert([
      { id: newUser.id, username: username, invite_code: inviteCode }
    ]);

    if (inviteCode) {
      const { data: inviter, error: fetchInviterError } = await supabase
        .from('profiles')
        .select('id, tokens')
        .eq('username', inviteCode)
        .single();

      if (fetchInviterError) {
        console.error('Fetch inviter error:', fetchInviterError.message);
      } else if (inviter) {
        const newTokenCount = (inviter.tokens || 0) + 5;
        await supabase.from('profiles').update({ tokens: newTokenCount }).eq('id', inviter.id);
        alert('Your friend has earned 5 tokens for your registration!');
      }
    }

    window.location.href = '/register-video.html';
  }

  document.getElementById("register-submit-button").addEventListener("click", handleSubmit);
});
