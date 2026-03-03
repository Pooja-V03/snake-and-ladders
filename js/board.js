

const Board = (() => {

  // Cell order: bottom-left = 1, zigzag
  function buildOrder() {
    const cells = [];
    for (let row = 9; row >= 0; row--) {
      const base = row * 10;
      const fromBottom = 9 - row;
      if (fromBottom % 2 === 0) {
        for (let col = 0; col < 10; col++) cells.push(base + col + 1);
      } else {
        for (let col = 9; col >= 0; col--) cells.push(base + col + 1);
      }
    }
    return cells;
  }

  const CELL_ORDER = buildOrder();

  function cellCenter(num) {
    const idx = CELL_ORDER.indexOf(num);
    const col = idx % 10;
    const row = Math.floor(idx / 10);
    return {
      x: col * CONFIG.STEP + CONFIG.CELL / 2,
      y: row * CONFIG.STEP + CONFIG.CELL / 2,
    };
  }

  // Apply move rules
  function applyMove(pos, roll) {
    const np = pos + roll;
    if (np > 100)              return { pos, event:'overshoot', via:0 };
    if (np === 100)            return { pos:100, event:'win', via:0 };
    if (CONFIG.SNAKES[np])    return { pos:CONFIG.SNAKES[np],  event:'snake',  via:np };
    if (CONFIG.LADDERS[np])   return { pos:CONFIG.LADDERS[np], event:'ladder', via:np };
    return                           { pos:np, event:'normal', via:0 };
  }

  //  Build grid DOM 
  function buildGrid() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    CELL_ORDER.forEach((num, i) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (i % 2 === 0 ? ' alt' : '');
      cell.id = `c${num}`;
      const numDiv = document.createElement('div');
      numDiv.className = 'cell-num';
      numDiv.textContent = num;
      cell.appendChild(numDiv);
      board.appendChild(cell);
    });
  }

  // SVG helpers 
  function mkNS(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }
  function setA(el, attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  function bp(p0,p1,p2,p3,t) {
    return (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t**2*p2 + t**3*p3;
  }

  //  Draw snakes & ladders 
  function drawSVG() {
    const svg = document.getElementById('boardSvg');
    svg.querySelectorAll('.snake-el,.ladder-el').forEach(e => e.remove());

    // Ladders
    Object.entries(CONFIG.LADDERS).forEach(([from, to]) => {
      const a = cellCenter(+from), b = cellCenter(+to);
      const g = mkNS('g'); g.classList.add('ladder-el');
      const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy);
      const nx=-dy/len*6, ny=dx/len*6;

      [1,-1].forEach(s => {
        const l = mkNS('line');
        setA(l, {x1:a.x+nx*s, y1:a.y+ny*s, x2:b.x+nx*s, y2:b.y+ny*s,
          stroke:'#4ade80', 'stroke-width':4, 'stroke-linecap':'round', opacity:0.92});
        g.appendChild(l);
      });

      const rungs = Math.max(3, Math.floor(len/28));
      for (let i=1; i<rungs; i++) {
        const t=i/rungs, mx=a.x+dx*t, my=a.y+dy*t;
        const r = mkNS('line');
        setA(r, {x1:mx+nx, y1:my+ny, x2:mx-nx, y2:my-ny,
          stroke:'#86efac', 'stroke-width':3, 'stroke-linecap':'round', opacity:0.85});
        g.appendChild(r);
      }
      [a,b].forEach(pt => {
        const c = mkNS('circle');
        setA(c, {cx:pt.x, cy:pt.y, r:5, fill:'#4ade80', opacity:0.7});
        g.appendChild(c);
      });
      svg.appendChild(g);
    });

    // Snakes
    Object.entries(CONFIG.SNAKES).forEach(([from, to]) => {
      const a = cellCenter(+from), b = cellCenter(+to);
      const g = mkNS('g'); g.classList.add('snake-el');
      const dx=b.x-a.x, dy=b.y-a.y;
      const cp1x=a.x-dy*.35+dx*.25, cp1y=a.y+dx*.35+dy*.25;
      const cp2x=b.x+dy*.35-dx*.25, cp2y=b.y-dx*.35-dy*.25;
      const d = `M${a.x},${a.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${b.x},${b.y}`;

      const bg = mkNS('path');
      setA(bg, {d, stroke:'#fca5a5', 'stroke-width':11, fill:'none', 'stroke-linecap':'round', opacity:0.5});
      g.appendChild(bg);

      const p = mkNS('path');
      setA(p, {d, stroke:'#f87171', 'stroke-width':7, fill:'none', 'stroke-linecap':'round', opacity:0.92});
      g.appendChild(p);

      for (let i=1; i<=7; i++) {
        const t=i/8;
        const dot = mkNS('circle');
        setA(dot, {cx:bp(a.x,cp1x,cp2x,b.x,t), cy:bp(a.y,cp1y,cp2y,b.y,t), r:2.5, fill:'#fecaca', opacity:0.8});
        g.appendChild(dot);
      }

      const head = mkNS('circle');
      setA(head, {cx:a.x, cy:a.y, r:9, fill:'#ef4444', opacity:0.95});
      g.appendChild(head);

      [-1,1].forEach(s => {
        const eye = mkNS('circle'); setA(eye, {cx:a.x+s*2.8, cy:a.y-2, r:2, fill:'white'});
        const pu  = mkNS('circle'); setA(pu,  {cx:a.x+s*2.8, cy:a.y-2, r:1, fill:'#1f2937'});
        g.appendChild(eye); g.appendChild(pu);
      });

      const tail = mkNS('circle');
      setA(tail, {cx:b.x, cy:b.y, r:5, fill:'#fca5a5', opacity:0.8});
      g.appendChild(tail);

      svg.appendChild(g);
    });
  }

  // Tokens 
  function initTokens(players) {
    const svg = document.getElementById('boardSvg');
    svg.querySelectorAll('.token-g').forEach(e => e.remove());
    players.forEach(p => {
      const g = mkNS('g');
      g.classList.add('token-g');
      g.id = `tok${p.id}`;
      g.style.transition = 'transform 0.55s cubic-bezier(0.34,1.3,0.64,1)';

      const circle = mkNS('circle');
      setA(circle, {r:18, fill:p.bg, stroke:p.color, 'stroke-width':3, opacity:0.95});

      const text = mkNS('text');
      setA(text, {'text-anchor':'middle', 'dominant-baseline':'middle', 'font-size':18, dy:1});
      text.textContent = p.token;

      g.appendChild(circle);
      g.appendChild(text);
      g.setAttribute('transform', 'translate(-100,-100)');
      svg.appendChild(g);
    });
  }

  function moveToken(playerId, pos, players) {
    const el = document.getElementById(`tok${playerId}`);
    if (!el) return;
    if (pos === 0) { el.setAttribute('transform', 'translate(-100,-100)'); return; }

    const {x, y} = cellCenter(pos);
    const sameCell = players.filter(p => p.position === pos);
    const myIndex  = sameCell.findIndex(p => p.id === playerId);
    const offsets  = [-12, 12, 0, -6];
    const ox = sameCell.length > 1 ? (offsets[myIndex] || 0) : 0;

    el.setAttribute('transform', `translate(${x + ox}, ${y})`);
  }

  return { buildGrid, drawSVG, initTokens, moveToken, applyMove, cellCenter };

})();