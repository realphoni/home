
const GITHUB_USERNAME = 'realphoni';


const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const els = {
  ghNavLink: document.getElementById('ghNavLink'),
  avatarWrap: document.getElementById('avatarWrap'),
  avatarImg: document.getElementById('avatarImg'),
  aboutAvatar: document.getElementById('aboutAvatar'),
  aboutName: document.getElementById('aboutName'),
  aboutBio: document.getElementById('aboutBio'),
  aboutMeta: document.getElementById('aboutMeta'),
  statRepos: document.getElementById('statRepos'),
  statFollowers: document.getElementById('statFollowers'),
  statFollowing: document.getElementById('statFollowing'),
  reposSubhead: document.getElementById('reposSubhead'),
  repoGrid: document.getElementById('repoGrid'),
  year: document.getElementById('year'),
};

els.year.textContent = new Date().getFullYear();
els.ghNavLink.href = `https://github.com/${GITHUB_USERNAME}`;

function iconLocation(){
  return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C4.7 0 2 2.7 2 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 8 3.8a2.2 2.2 0 0 1 0 4.4Z"/></svg>';
}
function iconLink(){
  return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.3 9.7a1 1 0 0 1 0-1.4l3-3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0Zm-2.6 2.6a2.7 2.7 0 0 1 0-3.8l1.7-1.7a1 1 0 1 1 1.4 1.4L5.1 9.9a.7.7 0 0 0 0 1l0 0a.7.7 0 0 0 1 0l1.7-1.7a1 1 0 1 1 1.4 1.4L7.5 12.3a2.7 2.7 0 0 1-3.8 0Zm8.6-8.6a2.7 2.7 0 0 1 0 3.8l-1.7 1.7a1 1 0 1 1-1.4-1.4l1.7-1.7a.7.7 0 0 0 0-1l0 0a.7.7 0 0 0-1 0L8.2 6.2a1 1 0 1 1-1.4-1.4l1.7-1.7a2.7 2.7 0 0 1 3.8 0Z"/></svg>';
}
function iconStar(){
  return '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .9l2.1 4.6 5 .6-3.7 3.5.9 5-4.3-2.4-4.3 2.4.9-5L.9 6.1l5-.6L8 .9Z"/></svg>';
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function tiltCard(card){
  if(reduceMotion) return;
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${(-y*7).toFixed(2)}deg) rotateY(${(x*7).toFixed(2)}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
}

function showSetupNotice(){
  els.reposSubhead.textContent = 'Waiting for setup';
  const note = document.createElement('div');
  note.className = 'empty-note glass';
  note.innerHTML = `Add your GitHub handle to <code>GITHUB_USERNAME</code> at the top of <code>script.js</code> and this section fills itself in.`;
  els.repoGrid.appendChild(note);
}

function renderRepos(repos){
  els.repoGrid.innerHTML = '';
  const originals = repos.filter(r => !r.fork).sort((a,b) => b.stargazers_count - a.stargazers_count);

  if(!originals.length){
    const note = document.createElement('div');
    note.className = 'empty-note glass';
    note.textContent = 'No original public repositories yet — once you push one, it shows up here.';
    els.repoGrid.appendChild(note);
    return;
  }

  originals.slice(0, 9).forEach(repo => {
    const card = document.createElement('a');
    card.className = 'repo-card glass';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener';

    const h3 = document.createElement('h3');
    h3.textContent = repo.name;

    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = repo.description || 'No description provided.';

    const foot = document.createElement('div');
    foot.className = 'repo-foot';
    foot.innerHTML = `
      <span class="lang"><span class="dot"></span>${repo.language ? escapeHtml(repo.language) : 'Unlabeled'}</span>
      <span class="stars">${iconStar()}${repo.stargazers_count}</span>
    `;

    card.append(h3, desc, foot);
    els.repoGrid.appendChild(card);
    tiltCard(card);
  });
}

function renderProfile(user){
  if(user.avatar_url){
    els.avatarImg.src = user.avatar_url;
    els.avatarImg.alt = user.login;
    els.avatarWrap.classList.add('loaded');
    els.aboutAvatar.src = user.avatar_url;
    els.aboutAvatar.alt = user.login;
  }

  els.aboutName.textContent = user.name || user.login;
  if(user.bio) els.aboutBio.textContent = user.bio;

  let meta = '';
  if(user.location) meta += `<span>${iconLocation()}${escapeHtml(user.location)}</span>`;
  if(user.blog) meta += `<span>${iconLink()}${escapeHtml(user.blog)}</span>`;
  els.aboutMeta.innerHTML = meta;

  els.statRepos.textContent = user.public_repos;
  els.statFollowers.textContent = user.followers;
  els.statFollowing.textContent = user.following;
}

async function loadOwnData(){
  if(GITHUB_USERNAME === 'your-github-username'){
    showSetupNotice();
    return;
  }
  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}`);
    if(!userRes.ok){
      els.reposSubhead.textContent = userRes.status === 403 ? "GitHub's rate limit was hit" : 'Could not load profile';
      return;
    }
    const user = await userRes.json();
    renderProfile(user);

    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?per_page=100&sort=updated`);
    const repos = reposRes.ok ? await reposRes.json() : [];
    renderRepos(Array.isArray(repos) ? repos : []);
  } catch (err) {
    els.reposSubhead.textContent = 'Could not reach GitHub';
  }
}

loadOwnData();
