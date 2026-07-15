async function loadAchievements() {
  const container = document.querySelector('.achievement-list');
  const response = await fetch('/api/achievements', {
      headers: { 'X-User-Id': localStorage.getItem('zeriah_token') || '' }
  });
  const achievements = await response.json();

  container.innerHTML = achievements.map(ach => `
    <div class="achievement-item ${ach.isUnlocked ? '' : 'locked'}">
      <div class="achievement-badge">${ach.isUnlocked ? ach.icon : '🔒'}</div>
      <div class="achievement-info">
        <h4>${ach.title}</h4>
        <p>${ach.isUnlocked ? ach.description : 'Locked'}</p>
      </div>
      <div class="achievement-points">${ach.xp_reward} XP</div>
    </div>
  `).join('');
}
