import React, { useState } from 'react';
import { Play, RotateCcw, Edit, Plus, Minus } from 'lucide-react';

const CELL_SIZE = 60;
const MOVES = [[0, 1], [1, 0], [0, -1], [-1, 0]];

const MazeGame = () => {
  const [maze, setMaze] = useState([
    ['S', '0', '1', '0'],
    ['1', '0', '1', '0'],
    ['0', '0', '0', 'G']
  ]);
  const [algorithm, setAlgorithm] = useState('BFS');
  const [path, setPath] = useState([]);
  const [visited, setVisited] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [speed, setSpeed] = useState(200);

  const findPos = (symbol) => {
    for (let i = 0; i < maze.length; i++) {
      for (let j = 0; j < maze[0].length; j++) {
        if (maze[i][j] === symbol) return [i, j];
      }
    }
    return null;
  };

  const valid = (x, y) => {
    return x >= 0 && x < maze.length && y >= 0 && y < maze[0].length && maze[x][y] !== '1';
  };

  const bfs = () => {
    const start = findPos('S');
    const goal = findPos('G');
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
        
        if (valid(nx, ny) && !visitedSet.has(key)) {
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
          
          if (valid(nx, ny)) {
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
    const pq = [[0, start, [start]]];
    const visitedSet = new Set();
    const visitedOrder = [];

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
          
          if (valid(nx, ny)) {
            const g = currentPath.length;
            const h = manhattan([nx, ny], goal);
            pq.push([g + h, [nx, ny], [...currentPath, [nx, ny]]]);
          }
        }
      }
    }
    return { path: [], visited: visitedOrder };
  };

  const runAlgorithm = async () => {
    setIsAnimating(true);
    setPath([]);
    setVisited([]);

    let result;
    if (algorithm === 'BFS') result = bfs();
    else if (algorithm === 'DFS') result = dfs();
    else result = astar();

    // Animate visited cells
    for (let i = 0; i < result.visited.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speed));
      setVisited(prev => [...prev, result.visited[i]]);
    }

    // Animate path
    for (let i = 0; i < result.path.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speed));
      setPath(prev => [...prev, result.path[i]]);
    }

    setIsAnimating(false);
  };

  const reset = () => {
    setPath([]);
    setVisited([]);
    setIsAnimating(false);
  };

  const toggleCell = (i, j) => {
    if (!editMode || maze[i][j] === 'S' || maze[i][j] === 'G') return;
    
    const newMaze = maze.map(row => [...row]);
    newMaze[i][j] = newMaze[i][j] === '1' ? '0' : '1';
    setMaze(newMaze);
    reset();
  };

  const isInPath = (i, j) => path.some(([x, y]) => x === i && y === j);
  const isVisited = (i, j) => visited.some(([x, y]) => x === i && y === j);

  const getCellColor = (cell, i, j) => {
    if (cell === 'S') return 'bg-green-500';
    if (cell === 'G') return 'bg-red-500';
    if (cell === '1') return 'bg-gray-800';
    if (isInPath(i, j)) return 'bg-yellow-400';
    if (isVisited(i, j)) return 'bg-blue-300';
    return 'bg-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Maze Pathfinding</h1>
          <p className="text-blue-200">Visualize BFS, DFS, and A* algorithms</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={isAnimating}
              className="px-4 py-2 rounded-lg bg-white/20 text-white border-2 border-white/30 focus:outline-none focus:border-white/60"
            >
              <option value="BFS">BFS (Breadth-First)</option>
              <option value="DFS">DFS (Depth-First)</option>
              <option value="A*">A* (Heuristic)</option>
            </select>

            <button
              onClick={runAlgorithm}
              disabled={isAnimating}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Play size={20} /> Run
            </button>

            <button
              onClick={reset}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw size={20} /> Reset
            </button>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-6 py-2 ${editMode ? 'bg-purple-600' : 'bg-purple-500'} hover:bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2 transition`}
            >
              <Edit size={20} /> {editMode ? 'Edit On' : 'Edit Off'}
            </button>
          </div>

          {/* Speed Control */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="text-white font-semibold">Speed:</span>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-48"
            />
            <span className="text-white">{speed}ms</span>
          </div>

          {/* Maze Grid */}
          <div className="flex justify-center mb-6">
            <div className="inline-block bg-gray-900 p-4 rounded-xl">
              {maze.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((cell, j) => (
                    <div
                      key={`${i}-${j}`}
                      onClick={() => toggleCell(i, j)}
                      className={`${getCellColor(cell, i, j)} border-2 border-gray-700 flex items-center justify-center font-bold text-lg transition-all duration-300 ${editMode && cell !== 'S' && cell !== 'G' ? 'cursor-pointer hover:opacity-70' : ''}`}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    >
                      {cell === 'S' && <span className="text-white text-2xl">🚀</span>}
                      {cell === 'G' && <span className="text-white text-2xl">🎯</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span>Start</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span>Goal</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-gray-800 rounded"></div>
              <span>Wall</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-blue-300 rounded"></div>
              <span>Visited</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-yellow-400 rounded"></div>
              <span>Path</span>
            </div>
          </div>

          {/* Stats */}
          {path.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-white text-lg">
                <span className="font-bold">Path Length:</span> {path.length} steps | 
                <span className="font-bold"> Cells Explored:</span> {visited.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MazeGame;
