import { createClient } from '../supabaseClient.js';

// Initialize Supabase
const supabase = createClient();

document.addEventListener("DOMContentLoaded", async function() {
  const app = document.getElementById("app");

  async function fetchUserProfile() {
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('username, membership, membership_expiry, tokens')
      .eq('username', supabase.auth.user().user_metadata.username)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      return null;
    }

    return userProfile;
  }

  const userProfile = await fetchUserProfile();

  async function fetchVideoToRate() {
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('id, username, url, created_at')
      .order('created_at', { ascending: true })
      .limit(1);

    if (videoError) {
      console.error('Video fetch error:', videoError.message);
      return;
    }

    if (videos.length === 0) {
      app.innerHTML = "<p>No videos available for rating.</p>";
      return;
    }

    const video = videos[0];
    app.innerHTML = `
      <div class="video-container">
        <video controls>
          <source src="${video.url}" type="video/webm">
          Your browser does not support the video tag.
        </video>
        <div class="slider-container">
          <input type="range" min="0" max="10" value="0" class="slider" id="rating-slider-${video.id}">
          <span class="slider-value" id="slider-value-${video.id}">0</span>
        </div>
        <button onclick="submitRating('${video.id}', document.getElementById('rating-slider-${video.id}').value)">Submit Rating</button>
      </div>
    `;
    const slider = document.getElementById(`rating-slider-${video.id}`);
    const sliderValue = document.getElementById(`slider-value-${video.id}`);
    slider.oninput = function() {
      sliderValue.innerText = this.value;
    };
  }

  async function submitRating(videoId, rating) {
    const userProfile = await fetchUserProfile();

    const { data: existingRating, error: existingRatingError } = await supabase
      .from('ratings')
      .select('id')
      .eq('username', userProfile.username)
      .eq('video_id', videoId)
      .single();

    if (existingRatingError) {
      console.error('Fetch existing rating error:', existingRatingError.message);
      return;
    }

    if (existingRating) {
      alert('You have already rated this video.');
      return;
    }

    await supabase.from('ratings').insert([{ username: userProfile.username, video_id: videoId, rating: rating }]);

    // Update the video owner's tokens
    const { data: videoOwnerProfile, error: videoOwnerProfileError } = await supabase
      .from('profiles')
      .select('username, tokens')
      .eq('username', video.username)
      .single();

    if (videoOwnerProfileError) {
      console.error('Fetch video owner profile error:', videoOwnerProfileError.message);
      return;
    }

    const newTokenCount = (videoOwnerProfile.tokens || 0) + 0.01;
    await supabase.from('profiles').update({ tokens: newTokenCount }).eq('username', video.username);

    alert('Rating submitted successfully!');
    fetchVideoToRate();
  }

  fetchVideoToRate();
});
