import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Edit, Plus, Minus, Settings2, Trash2, HelpCircle, ChevronRight, FastForward } from 'lucide-react';

const CELL_SIZE = 40;
const MOVES = [[0, 1], [1, 0], [0, -1], [-1, 0]];

const MazeGame = () => {
  const [maze, setMaze] = useState([
    ['S', '0', '1', '0', '0', '0', '0', '0', '0', '0'],
    ['1', '0', '1', '0', '1', '1', '1', '1', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '0', '1', '0', '0'],
    ['0', '1', '1', '1', '1', '0', '1', '1', '0', '0'],
    ['0', '0', '0', '0', '1', '0', '0', '0', '0', 'G']
  ]);
  const [algorithm, setAlgorithm] = useState('BFS');
  const [path, setPath] = useState([]);
  const [visited, setVisited] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [cellType, setCellType] = useState('wall'); // 'start', 'goal', 'wall', 'empty'
  const [speed, setSpeed] = useState(100);

  const generateRandomMaze = (rows = 8, cols = 12) => {
    let newMaze = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (Math.random() < 0.25 ? '1' : '0')));
    newMaze[0][0] = 'S';
    newMaze[rows - 1][cols - 1] = 'G';
    setMaze(newMaze);
    setPath([]);
    setVisited([]);
    setEditMode(false);
  };

  const findPos = (symbol) => {
    for (let i = 0; i < maze.length; i++) {
      for (let j = 0; j < maze[0].length; j++) {
        if (maze[i][j] === symbol) return [i, j];
      }
    }
    return null;
  };

  const isValid = (x, y) => {
    return x >= 0 && x < maze.length && y >= 0 && y < maze[0].length && maze[x][y] !== '1';
  };

  const bfs = () => {
    const start = findPos('S');
    const goal = findPos('G');
    if (!start || !goal) return { path: [], visited: [] };

    const queue = [[start, [start]]];
    const visitedSet = new Set([`${start[0]},${start[1]}`]);
    const visitedOrder = [];

    while (queue.length > 0) {
      const [[x, y], currentPath] = queue.shift();
      visitedOrder.push([x, y]);

      if (x === goal[0] && y === goal[1]) {
        return { path: currentPath, visited: visitedOrder };
      }

      for (const [dx, dy] of MOVES) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (isValid(nx, ny) && !visitedSet.has(key)) {
          visitedSet.add(key);
          queue.push([[nx, ny], [...currentPath, [nx, ny]]]);
        }
      }
    }
    return { path: [], visited: visitedOrder };
  };

  const dfs = () => {
    const start = findPos('S');
    const goal = findPos('G');
    if (!start || !goal) return { path: [], visited: [] };

    const stack = [[start, [start]]];
    const visitedSet = new Set();
    const visitedOrder = [];

    while (stack.length > 0) {
      const [[x, y], currentPath] = stack.pop();
      const key = `${x},${y}`;

      if (x === goal[0] && y === goal[1]) {
        return { path: currentPath, visited: visitedOrder };
      }

      if (!visitedSet.has(key)) {
        visitedSet.add(key);
        visitedOrder.push([x, y]);

        for (const [dx, dy] of MOVES) {
          const nx = x + dx;
          const ny = y + dy;
          if (isValid(nx, ny)) {
            stack.push([[nx, ny], [...currentPath, [nx, ny]]]);
          }
        }
      }
    }
    return { path: [], visited: visitedOrder };
  };

  const manhattan = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

  const astar = () => {
    const start = findPos('S');
    const goal = findPos('G');
    if (!start || !goal) return { path: [], visited: [] };

    const pq = [[0, start, [start]]];
    const visitedSet = new Set();
    const visitedOrder = [];
    const gScores = new Map();
    gScores.set(`${start[0]},${start[1]}`, 0);

    while (pq.length > 0) {
      pq.sort((a, b) => a[0] - b[0]);
      const [, current, currentPath] = pq.shift();
      const key = `${current[0]},${current[1]}`;

      if (current[0] === goal[0] && current[1] === goal[1]) {
        return { path: currentPath, visited: visitedOrder };
      }

      if (!visitedSet.has(key)) {
        visitedSet.add(key);
        visitedOrder.push(current);

        for (const [dx, dy] of MOVES) {
          const nx = current[0] + dx;
          const ny = current[1] + dy;
          const nKey = `${nx},${ny}`;

          if (isValid(nx, ny)) {
            const newG = currentPath.length;
            if (!gScores.has(nKey) || newG < gScores.get(nKey)) {
              gScores.set(nKey, newG);
              const h = manhattan([nx, ny], goal);
              pq.push([newG + h, [nx, ny], [...currentPath, [nx, ny]]]);
            }
          }
        }
      }
    }
    return { path: [], visited: visitedOrder };
  };

  const runAlgorithm = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPath([]);
    setVisited([]);

    let result;
    if (algorithm === 'BFS') result = bfs();
    else if (algorithm === 'DFS') result = dfs();
    else result = astar();

    // Animate visited cells
    for (let i = 0; i < result.visited.length; i++) {
      if (i % 2 === 0) { // Batch updates for performance
        await new Promise(resolve => setTimeout(resolve, speed / 2));
        setVisited(result.visited.slice(0, i + 1));
      }
    }
    setVisited(result.visited);

    // Animate path
    if (result.path.length > 0) {
      for (let i = 0; i < result.path.length; i++) {
        await new Promise(resolve => setTimeout(resolve, speed / 2));
        setPath(result.path.slice(0, i + 1));
      }
    }

    setIsAnimating(false);
  };

  const reset = () => {
    setPath([]);
    setVisited([]);
    setIsAnimating(false);
  };

  const handleCellClick = (rowIdx, colIdx) => {
    if (!editMode || isAnimating) return;

    setMaze(prevMaze => {
      const newMaze = prevMaze.map(row => [...row]);
      if (cellType === 'start') {
        for (let i = 0; i < newMaze.length; i++) {
          for (let j = 0; j < newMaze[0].length; j++) {
            if (newMaze[i][j] === 'S') newMaze[i][j] = '0';
          }
        }
        newMaze[rowIdx][colIdx] = 'S';
      } else if (cellType === 'goal') {
        for (let i = 0; i < newMaze.length; i++) {
          for (let j = 0; j < newMaze[0].length; j++) {
            if (newMaze[i][j] === 'G') newMaze[i][j] = '0';
          }
        }
        newMaze[rowIdx][colIdx] = 'G';
      } else if (cellType === 'wall') {
        if (newMaze[rowIdx][colIdx] !== 'S' && newMaze[rowIdx][colIdx] !== 'G') {
          newMaze[rowIdx][colIdx] = newMaze[rowIdx][colIdx] === '1' ? '0' : '1';
        }
      } else if (cellType === 'empty') {
        if (newMaze[rowIdx][colIdx] !== 'S' && newMaze[rowIdx][colIdx] !== 'G') {
          newMaze[rowIdx][colIdx] = '0';
        }
      }
      return newMaze;
    });
    reset();
  };

  const isInPath = (i, j) => path.some(([x, y]) => x === i && y === j);
  const isVisited = (i, j) => visited.some(([x, y]) => x === i && y === j);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">Maze Solver</h1>
            <p className="text-sm text-slate-400">Visualize pathfinding algorithms in real-time.</p>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Algorithm</label>
            <div className="flex flex-col gap-2">
              {['BFS', 'DFS', 'A*'].map((alg) => (
                <button
                  key={alg}
                  onClick={() => !isAnimating && setAlgorithm(alg)}
                  className={`px-4 py-2 rounded-lg text-left transition-all duration-200 flex items-center justify-between ${algorithm === alg
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  {alg}
                  {algorithm === alg && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Simulation Speed</label>
            <div className="flex items-center gap-4 bg-slate-700/50 p-2 rounded-xl">
              <button onClick={() => setSpeed(s => Math.min(500, s + 50))} className="p-2 hover:bg-slate-600 rounded-lg"><Plus size={16} /></button>
              <span className="flex-1 text-center font-mono text-cyan-400">{1000 - (speed * 1.8)}%</span>
              <button onClick={() => setSpeed(s => Math.max(10, s - 50))} className="p-2 hover:bg-slate-600 rounded-lg"><Minus size={16} /></button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-3">
            <button
              onClick={runAlgorithm}
              disabled={isAnimating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Play size={20} fill="currentColor" />
              Run Solver
            </button>
            <button
              onClick={reset}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={20} />
              Reset View
            </button>
            <button
              onClick={() => generateRandomMaze()}
              className="w-full border border-slate-600 hover:border-slate-500 text-slate-300 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <FastForward size={20} />
              Random Maze
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toolbar */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${editMode
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                <Edit size={18} />
                {editMode ? 'Finish Editing' : 'Edit Maze'}
              </button>

              {editMode && (
                <div className="flex items-center gap-2 px-2 border-l border-slate-700">
                  {[
                    { id: 'start', label: 'Start', color: 'bg-emerald-500' },
                    { id: 'goal', label: 'Goal', color: 'bg-rose-500' },
                    { id: 'wall', label: 'Wall', color: 'bg-slate-900' },
                    { id: 'empty', label: 'Clear', color: 'bg-white' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setCellType(type.id)}
                      className={`p-2 rounded-lg transition-all tool-tip relative group ${cellType === type.id ? 'bg-slate-600 ring-2 ring-slate-400' : 'hover:bg-slate-700'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-sm ${type.color}`}></div>
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-sm bg-blue-400/30"></div>
                Visited
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-sm bg-amber-400"></div>
                Final Path
              </div>
            </div>
          </div>

          {/* Maze Grid */}
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 flex items-center justify-center overflow-auto min-h-[500px] shadow-inner">
            <div className="inline-grid gap-1 bg-slate-800 p-2 rounded-xl shadow-2xl"
              style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 0}, ${CELL_SIZE}px)` }}>
              {maze.map((row, r) =>
                row.map((cell, c) => {
                  const isP = isInPath(r, c);
                  const isV = isVisited(r, c);
                  let bg = 'bg-slate-700/50';
                  let text = '';
                  let scale = 'scale-100';

                  if (cell === '1') bg = 'bg-slate-900 shadow-inner';
                  else if (cell === 'S') { bg = 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'; text = 'S'; }
                  else if (cell === 'G') { bg = 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'; text = 'G'; }
                  else if (isP) { bg = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] animate-pulse'; scale = 'scale-95'; }
                  else if (isV) { bg = 'bg-blue-500/20 border border-blue-500/30'; scale = 'scale-90'; }

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      disabled={isAnimating}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-300 ${bg} ${scale} ${editMode ? 'hover:ring-2 hover:ring-slate-400 cursor-crosshair' : 'cursor-default'
                        }`}
                    >
                      {text}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <span className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Exploration</span>
              <span className="text-xl font-mono text-blue-400">{visited.length} <small className="text-slate-500 text-sm">cells</small></span>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <span className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Path Efficiency</span>
              <span className="text-xl font-mono text-amber-400">{path.length > 0 ? path.length : '0'} <small className="text-slate-500 text-sm">steps</small></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MazeGame;
