import { createClient } from '../supabaseClient.js';

// Initialize Supabase
const supabase = createClient();

document.addEventListener("DOMContentLoaded", async function() {
  const tasksContainer = document.getElementById("tasks-list");
  const tokenBalanceElement = document.getElementById("token-balance");
  const claimTotals = {
    invite: document.getElementById('invite-total'),
    'first-upload': document.getElementById('first-upload-total'),
    'daily-checkin': document.getElementById('daily-checkin-total'),
    'rate-video': document.getElementById('rate-video-total'),
  };

  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('username, tokens, membership, membership_expiry')
    .eq('username', supabase.auth.user().user_metadata.username)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError.message);
    return;
  }

  tokenBalanceElement.textContent = userProfile.tokens || 0;

  // Update claim totals based on task_logs
  for (const task in claimTotals) {
    const { data: taskLogs, error: taskLogsError } = await supabase
      .from('task_logs')
      .select('*')
      .eq('username', userProfile.username)
      .eq('task', task);
    if (taskLogsError) {
      console.error(`Fetch ${task} logs error:`, taskLogsError.message);
      continue;
    }
    claimTotals[task].textContent = `Total: ${taskLogs.length * (task === 'invite' ? 5 : task === 'first-upload' ? 1 : task === 'daily-checkin' ? 0.1 : 0.01)}`;
  }

  document.querySelectorAll(".claim-button").forEach(button => {
    button.addEventListener("click", async () => {
      const task = button.getAttribute("data-task");

      const { data: taskLog, error: taskLogError } = await supabase
        .from('task_logs')
        .select('id')
        .eq('username', userProfile.username)
        .eq('task', task)
        .single();

      if (taskLogError || !taskLog) {
        let reward = 0;
        switch (task) {
          case "invite":
            reward = 5;
            break;
          case "first-upload":
            reward = 1;
            break;
          case "daily-checkin":
            reward = 0.1;
            break;
          case "rate-video":
            reward = 0.01;
            break;
        }

        await supabase.from('task_logs').insert([{ username: userProfile.username, task: task }]);
        const newTokenCount = (userProfile.tokens || 0) + reward;
        await supabase.from('profiles').update({ tokens: newTokenCount }).eq('username', userProfile.username);
        tokenBalanceElement.textContent = newTokenCount;
        alert(`You have claimed ${reward} tokens for completing the task: ${task}!`);

        // Update claim total
        const { data: updatedTaskLogs, error: updatedTaskLogsError } = await supabase
          .from('task_logs')
          .select('*')
          .eq('username', userProfile.username)
          .eq('task', task);
        if (updatedTaskLogsError) {
          console.error(`Fetch updated ${task} logs error:`, updatedTaskLogsError.message);
        } else {
          claimTotals[task].textContent = `Total: ${updatedTaskLogs.length * reward}`;
        }
      } else {
        alert(`You have already claimed the reward for the task: ${task}.`);
      }
    });
  });

  document.getElementById("silver-membership").addEventListener("click", () => purchaseMembership("Silver Membership", 25));
  document.getElementById("gold-membership").addEventListener("click", () => purchaseMembership("Gold Membership", 40));
  document.getElementById("flash-card").addEventListener("click", () => purchaseMembership("Flash Card", 40));

  async function purchaseMembership(membership, price) {
    if (userProfile.tokens < price) {
      alert('You do not have enough tokens to purchase this membership.');
      return;
    }

    const newTokenCount = userProfile.tokens - price;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    await supabase.from('profiles').update({
      tokens: newTokenCount,
      membership: membership,
      membership_expiry: expiryDate.toISOString()
    }).eq('username', userProfile.username);

    tokenBalanceElement.textContent = newTokenCount;
    alert(`You have successfully purchased the ${membership}!`);
  }
});
