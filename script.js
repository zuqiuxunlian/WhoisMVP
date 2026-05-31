// MVP投票系统 - JavaScript主脚本

// 初始数据
let players = [];
let votingData = {};
let currentPair = null;
let currentUser = null;

// 检查用户认证
function checkAuth() {
    const userData = localStorage.getItem('mvpUser');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(userData);
    displayUserInfo();
    
    // 设置登出按钮
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // 根据用户角色显示/隐藏管理选项
    if (currentUser.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// 显示用户信息
function displayUserInfo() {
    const roleName = currentUser.role === 'admin' ? '管理员' : '投票者';
    document.getElementById('username-display').textContent = currentUser.username;
    document.getElementById('role-display').textContent = roleName;
}

// 登出
function logout() {
    if (confirm('确定要登出吗？')) {
        localStorage.removeItem('mvpUser');
        window.location.href = 'login.html';
    }
}

// 初始化应用
function initApp() {
    checkAuth();
    loadFromLocalStorage();
    if (players.length === 0) {
        // 添加默认队员
        const defaultPlayers = [
            { id: 1, name: '队员A', image: 'https://via.placeholder.com/150/667eea/ffffff?text=A', votes: 0 },
            { id: 2, name: '队员B', image: 'https://via.placeholder.com/150/764ba2/ffffff?text=B', votes: 0 },
            { id: 3, name: '队员C', image: 'https://via.placeholder.com/150/f093fb/ffffff?text=C', votes: 0 },
            { id: 4, name: '队员D', image: 'https://via.placeholder.com/150/f5576c/ffffff?text=D', votes: 0 }
        ];
        players = defaultPlayers;
        defaultPlayers.forEach(p => {
            votingData[p.id] = 0;
        });
        saveToLocalStorage();
    }
    
    setupEventListeners();
    loadNextPair();
    updateStats();
    renderRankings();
    renderPlayersList();
}

// 事件监听器
function setupEventListeners() {
    // 模式切换
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', switchMode);
    });

    // 投票按钮
    document.getElementById('vote-btn-1').addEventListener('click', () => voteFor(0));
    document.getElementById('vote-btn-2').addEventListener('click', () => voteFor(1));

    // 下一轮
    document.getElementById('next-pk').addEventListener('click', loadNextPair);

    // 管理队员（仅管理员）
    const addBtn = document.getElementById('add-player-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addNewPlayer);
    }

    // 重置和导出
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetData);
    }
    document.getElementById('export-btn').addEventListener('click', exportResults);
}

// 模式切换
function switchMode(e) {
    const mode = e.target.dataset.mode;
    
    // 权限检查
    if (mode === 'manage' && currentUser.role !== 'admin') {
        alert('只有管理员可以管理队员');
        return;
    }
    
    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // 显示对应的模式内容
    document.querySelectorAll('.mode-content').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${mode}-mode`).classList.add('active');

    // 刷新数据
    if (mode === 'view') {
        renderRankings();
    } else if (mode === 'manage') {
        renderPlayersList();
    }
}

// 加载下一个PK对
function loadNextPair() {
    if (players.length < 2) {
        alert('需要至少2个队员才能进行PK投票');
        return;
    }

    // 随机选择两个不同的队员
    let id1, id2;
    do {
        id1 = Math.floor(Math.random() * players.length);
        id2 = Math.floor(Math.random() * players.length);
    } while (id1 === id2);

    currentPair = [players[id1], players[id2]];
    
    // 更新UI
    document.getElementById('player1-img').src = currentPair[0].image;
    document.getElementById('player1-name').textContent = currentPair[0].name;
    document.getElementById('player1-votes').textContent = `投票数: ${votingData[currentPair[0].id] || 0}`;

    document.getElementById('player2-img').src = currentPair[1].image;
    document.getElementById('player2-name').textContent = currentPair[1].name;
    document.getElementById('player2-votes').textContent = `投票数: ${votingData[currentPair[1].id] || 0}`;

    // 移除高亮
    document.querySelectorAll('.player-card').forEach(card => {
        card.classList.remove('highlight');
    });
}

// 投票函数
function voteFor(index) {
    const player = currentPair[index];
    votingData[player.id] = (votingData[player.id] || 0) + 1;

    // 更新UI
    const cardClass = index === 0 ? '.left' : '.right';
    const card = document.querySelector(cardClass);
    
    // 高亮效果
    card.classList.add('highlight');
    setTimeout(() => card.classList.remove('highlight'), 300);

    // 更新投票数显示
    if (index === 0) {
        document.getElementById('player1-votes').textContent = `投票数: ${votingData[player.id]}`;
    } else {
        document.getElementById('player2-votes').textContent = `投票数: ${votingData[player.id]}`;
    }

    // 更新统计信息
    updateStats();
    saveToLocalStorage();

    // 自动加载下一对（200ms延迟）
    setTimeout(() => {
        loadNextPair();
    }, 200);
}

// 添加新队员
function addNewPlayer() {
    // 权限检查
    if (currentUser.role !== 'admin') {
        alert('只有管理员可以添加队员');
        return;
    }

    const nameInput = document.getElementById('player-name');
    const imgInput = document.getElementById('player-img');

    const name = nameInput.value.trim();
    const image = imgInput.value.trim();

    if (!name) {
        alert('请输入队员名称');
        return;
    }

    const newId = Math.max(...players.map(p => p.id), 0) + 1;
    const newPlayer = {
        id: newId,
        name: name,
        image: image || `https://via.placeholder.com/150?text=${name.charAt(0)}`,
        votes: 0
    };

    players.push(newPlayer);
    votingData[newId] = 0;

    // 清空表单
    nameInput.value = '';
    imgInput.value = '';

    // 更新UI
    renderPlayersList();
    updateStats();
    saveToLocalStorage();

    alert('队员添加成功！');
}

// 删除队员
function deletePlayer(id) {
    // 权限检查
    if (currentUser.role !== 'admin') {
        alert('只有管理员可以删除队员');
        return;
    }

    if (confirm('确定要删除这个队员吗？')) {
        players = players.filter(p => p.id !== id);
        delete votingData[id];
        
        renderPlayersList();
        renderRankings();
        updateStats();
        loadNextPair();
        saveToLocalStorage();
    }
}

// 渲染排名列表
function renderRankings() {
    const rankingList = document.getElementById('ranking-list');
    
    // 按投票数排序
    const sortedPlayers = [...players].sort((a, b) => {
        return (votingData[b.id] || 0) - (votingData[a.id] || 0);
    });

    rankingList.innerHTML = '';

    sortedPlayers.forEach((player, index) => {
        const medal = getMedal(index);
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="ranking-rank ${getRankClass(index)}">${medal}</div>
            <img src="${player.image}" alt="${player.name}" class="ranking-img">
            <div class="ranking-info">
                <h4>${player.name}</h4>
                <p>排名: 第 ${index + 1} 名</p>
            </div>
            <div class="ranking-votes">${votingData[player.id] || 0} 票</div>
        `;
        rankingList.appendChild(item);
    });
}

// 获取奖牌
function getMedal(index) {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || `#${index + 1}`;
}

// 获取排名样式类
function getRankClass(index) {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
}

// 渲染队员列表
function renderPlayersList() {
    const container = document.getElementById('players-container');
    if (!container) return;
    
    container.innerHTML = '';

    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.innerHTML = `
            <img src="${player.image}" alt="${player.name}">
            <h4>${player.name}</h4>
            <p>投票: ${votingData[player.id] || 0}</p>
            <button class="delete-btn" onclick="deletePlayer(${player.id})" ${currentUser.role !== 'admin' ? 'disabled' : ''} style="${currentUser.role !== 'admin' ? 'opacity: 0.5; cursor: not-allowed;' : ''}">删除</button>
        `;
        container.appendChild(item);
    });
}

// 更新统计信息
function updateStats() {
    const totalVotes = Object.values(votingData).reduce((sum, v) => sum + v, 0);
    document.getElementById('total-votes').textContent = totalVotes;
    document.getElementById('total-players').textContent = players.length;
}

// 重置数据
function resetData() {
    // 权限检查
    if (currentUser.role !== 'admin') {
        alert('只有管理员可以重置数据');
        return;
    }

    if (confirm('确定要重置所有投票数据吗？此操作无法撤销！')) {
        players.forEach(p => {
            votingData[p.id] = 0;
        });
        updateStats();
        renderRankings();
        renderPlayersList();
        loadNextPair();
        saveToLocalStorage();
        alert('数据已重置');
    }
}

// 导出结果
function exportResults() {
    const sortedPlayers = [...players].sort((a, b) => {
        return (votingData[b.id] || 0) - (votingData[a.id] || 0);
    });

    let csvContent = "排名,队员名称,投票数\n";
    sortedPlayers.forEach((player, index) => {
        csvContent += `${index + 1},${player.name},${votingData[player.id] || 0}\n`;
    });

    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `MVP投票结果_${new Date().toLocaleString()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('结果已导出为CSV文件');
}

// 本地存储
function saveToLocalStorage() {
    const data = {
        players: players,
        votingData: votingData
    };
    localStorage.setItem('mvpVotingData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('mvpVotingData');
    if (data) {
        const parsed = JSON.parse(data);
        players = parsed.players || [];
        votingData = parsed.votingData || {};
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
