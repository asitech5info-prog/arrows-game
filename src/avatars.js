// 30 In-Game Profile Pictures (PFPs) + Custom Avatar Support

export const IN_GAME_PFPS = [
  { id: 'fox', name: 'Fox', emoji: '🦊', bg: 'linear-gradient(135deg, #ff7e5f, #feb47b)' },
  { id: 'cat', name: 'Cat', emoji: '🐱', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'panda', name: 'Panda', emoji: '🐼', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 'lion', name: 'Lion', emoji: '🦁', bg: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 'koala', name: 'Koala', emoji: '🐨', bg: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 'bear', name: 'Bear', emoji: '🐻', bg: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 'owl', name: 'Owl', emoji: '🦉', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', bg: 'linear-gradient(135deg, #89f7fe, #66a6ff)' },
  
  { id: 'astronaut', name: 'Astronaut', emoji: '🚀', bg: 'linear-gradient(135deg, #30cfd0, #330867)' },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', bg: 'linear-gradient(135deg, #2b5876, #4e4376)' },
  { id: 'wizard', name: 'Wizard', emoji: '🧙', bg: 'linear-gradient(135deg, #9b51e0, #3498db)' },
  { id: 'robot', name: 'Robot', emoji: '🤖', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 'alien', name: 'Alien', emoji: '👾', bg: 'linear-gradient(135deg, #0ba360, #3cba92)' },
  { id: 'superhero', name: 'Hero', emoji: '🦸', bg: 'linear-gradient(135deg, #f12711, #f5af19)' },
  { id: 'crown', name: 'Royal', emoji: '👑', bg: 'linear-gradient(135deg, #ffe259, #ffa751)' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', bg: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
  { id: 'fire', name: 'Blaze', emoji: '🔥', bg: 'linear-gradient(135deg, #f857a6, #ff5858)' },
  { id: 'lightning', name: 'Volt', emoji: '⚡', bg: 'linear-gradient(135deg, #f9d423, #ff4e50)' },
  
  { id: 'star', name: 'Nova', emoji: '⭐', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
  { id: 'archer', name: 'Archer', emoji: '🏹', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'bullseye', name: 'Target', emoji: '🎯', bg: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  { id: 'compass', name: 'Explorer', emoji: '🧭', bg: 'linear-gradient(135deg, #3a7bd5, #3a6073)' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', bg: 'linear-gradient(135deg, #b224ef, #7579ff)' },
  { id: 'unicorn', name: 'Mythic', emoji: '🦄', bg: 'linear-gradient(135deg, #f77062, #fe5196)' },
  { id: 'eagle', name: 'Falcon', emoji: '🦅', bg: 'linear-gradient(135deg, #c471ed, #f64f59)' },
  { id: 'dolphin', name: 'Wave', emoji: '🐬', bg: 'linear-gradient(135deg, #00d2ff, #3a7bd5)' },
  { id: 'gamer', name: 'Gamer', emoji: '🎮', bg: 'linear-gradient(135deg, #7f00ff, #e100ff)' },
  { id: 'puzzle', name: 'Master', emoji: '🧩', bg: 'linear-gradient(135deg, #434343, #000000)' }
];

export function getAvatarHTML(profile) {
  if (profile && profile.customPhoto) {
    return `<img src="${profile.customPhoto}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
  }
  const pfp = IN_GAME_PFPS.find(p => p.id === profile?.pfpId) || IN_GAME_PFPS[0];
  return `<div style="width:100%;height:100%;border-radius:50%;background:${pfp.bg};display:flex;align-items:center;justify-content:center;font-size:20px;">${pfp.emoji}</div>`;
}
