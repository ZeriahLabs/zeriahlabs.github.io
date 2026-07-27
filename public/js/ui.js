async function loadAchievements(priorityKeyword = null) {
  const container = document.querySelector('.achievement-list');
  if (!container) return;

  try {
      const response = await fetch('/api/achievements', {
          headers: { 'X-User-Id': localStorage.getItem('zeriah_token') || '' }
      });
      
      if (!response.ok) throw new Error("Not logged in");
      
      let achievements = await response.json();

      // Sort achievements so the priority keyword (e.g., 'dino') floats to the top
      if (priorityKeyword) {
          achievements.sort((a, b) => {
              const aMatch = (a.id && a.id.toLowerCase().includes(priorityKeyword)) || 
                             (a.title && a.title.toLowerCase().includes(priorityKeyword));
              const bMatch = (b.id && b.id.toLowerCase().includes(priorityKeyword)) || 
                             (b.title && b.title.toLowerCase().includes(priorityKeyword));
              
              if (aMatch && !bMatch) return -1;
              if (!aMatch && bMatch) return 1;
              return 0; // Keep original order for the rest
          });
      }

      container.innerHTML = achievements.map(ach => `
        <div class="achievement-item ${ach.isUnlocked ? '' : 'locked'}">
          <div class="achievement-badge">${ach.isUnlocked ? (ach.icon || '🏆') : '🔒'}</div>
          <div class="achievement-info">
            <h4>${ach.title}</h4>
            <p>${ach.isUnlocked ? ach.description : 'Locked'}</p>
          </div>
          <div class="achievement-points">${ach.xp_reward} XP</div>
        </div>
      `).join('');
  } catch (err) {
      container.innerHTML = `<div style="text-align: center; color: var(--muted); padding: 20px; font-size: 0.85rem; border: 1px dashed var(--rule); border-radius: 12px;">Sign in to track your global progress and earn rewards!</div>`;
  }
}

// Ensure the achievement list re-renders when a new achievement is unlocked during gameplay
window.renderAchievements = () => loadAchievements(window.currentAchievementFilter || null);
