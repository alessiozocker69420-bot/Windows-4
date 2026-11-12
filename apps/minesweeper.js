const MinesweeperApp = {
  render(container, winId) {
    const W = 9, H = 9, MINES = 10;
    let grid = [], revealed = [], flagged = [], dead = false, won = false;

    const init = () => {
      dead = won = false;
      grid = Array.from({ length: H }, () => Array(W).fill(0));
      revealed = Array.from({ length: H }, () => Array(W).fill(false));
      flagged = Array.from({ length: H }, () => Array(W).fill(false));
      let placed = 0;
      while (placed < MINES) {
        const x = Math.floor(Math.random() * W), y = Math.floor(Math.random() * H);
        if (grid[y][x] !== -1) { grid[y][x] = -1; placed++; }
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (grid[y][x] === -1) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < H && nx >= 0 && nx < W && grid[ny][nx] === -1) n++;
        }
        grid[y][x] = n;
      }
      draw();
    };

    const flood = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H || revealed[y][x] || flagged[y][x]) return;
      revealed[y][x] = true;
      if (grid[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) flood(x + dx, y + dy);
      }
    };

    const checkWin = () => {
      let hidden = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!revealed[y][x]) hidden++;
      if (hidden === MINES) { won = true; VirtualPC.notify('Minesweeper', 'Gewonnen!', '🏆'); }
    };

    const draw = () => {
      const cells = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let content = '', bg = '#333';
        if (flagged[y][x] && !revealed[y][x]) { content = '🚩'; bg = '#3a2a1a'; }
        else if (revealed[y][x]) {
          bg = '#1a1a1a';
          if (grid[y][x] === -1) content = '💣';
          else if (grid[y][x] > 0) content = String(grid[y][x]);
        }
        cells.push(`<button data-x="${x}" data-y="${y}" style="width:32px;height:32px;border:1px solid #444;background:${bg};color:#fff;font-size:14px;cursor:pointer;touch-action:manipulation;">${content}</button>`);
      }
      container.innerHTML = `
        <div style="padding:16px;height:100%;background:#1a1a1a;display:flex;flex-direction:column;align-items:center;">
          <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center;">
            <span style="font-size:18px;">${dead ? '💀' : won ? '😎' : '🙂'} Minesweeper</span>
            <button class="btn-primary" id="${winId}_new" style="padding:6px 12px;">Neu</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(${W},32px);gap:2px;">${cells.join('')}</div>
          <p style="margin-top:12px;font-size:12px;opacity:0.5;">Tipp: Rechtsklick / langes Drücken = Flagge</p>
        </div>
      `;
      document.getElementById(winId + '_new').addEventListener('click', init);
      container.querySelectorAll('button[data-x]').forEach(btn => {
        const x = +btn.dataset.x, y = +btn.dataset.y;
        btn.addEventListener('click', () => {
          if (dead || won || flagged[y][x]) return;
          if (grid[y][x] === -1) {
            revealed[y][x] = true; dead = true;
            for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (grid[yy][xx] === -1) revealed[yy][xx] = true;
            draw();
            return;
          }
          flood(x, y); checkWin(); draw();
        });
        btn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (dead || won || revealed[y][x]) return;
          flagged[y][x] = !flagged[y][x];
          draw();
        });
        let lt = null;
        btn.addEventListener('touchstart', () => {
          lt = setTimeout(() => {
            if (!revealed[y][x] && !dead) { flagged[y][x] = !flagged[y][x]; draw(); }
          }, 500);
        }, { passive: true });
        btn.addEventListener('touchend', () => clearTimeout(lt));
      });
    };
    init();
  }
};
window.MinesweeperApp = MinesweeperApp;
