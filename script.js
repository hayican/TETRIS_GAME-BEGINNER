// Siapin Canvas & Context
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// Palet warna
const colors = [
    null,
    '#00BFFF',
    '#1E90FF',
    '#87CEFA',
    '#4169E1',
    '#20B2AA',
    '#00FFFF',
    '#4682B4' 
];

// Setting Skala
context.scale(30, 30);

// Variabel Waktu & Jeda
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// Variabel Skor dan ambil best score
let score = 0;
let bestScore = localStorage.getItem('tetrisBestScore') || 0;

// Variabel Pause
let isPaused = true; 
let animationId = null;

// Fungsi buat nampilin skor ke HTML
function updateScoreUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('best-score').innerText = bestScore;
}

// Fungsi Bikin Matriks (Arena)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Bikin Arena 10x20
const arena = createMatrix(10, 20);

// Data Balok Aktif (Player)
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
};

// Fungsi Cetak Tipe Balok
function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

// Fungsi Gambar Matriks ke Layar
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Fungsi Gambar Keseluruhan (Arena & Player)
function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

// Fungsi Sensor Deteksi Tabrakan
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Fungsi Nge-lem Balok ke Arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Fungsi Hapus Baris yang Penuh
function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
    }
}

// Fungsi Turunin Balok
function playerDrop() {
    player.pos.y++;
    
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        score += 100;
        updateScoreUI();
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

// Fungsi Geser Balok
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// Rumus Matematika Rotasi
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Fungsi Putar Balok Anti-Nembus
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);

    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }   
    }
}

// Fungsi Panggil Balok Acak
function playerReset() {
    const pieces = 'ILJOTSZ';
    const randomPiece = pieces[pieces.length * Math.random() | 0];
    
    player.matrix = createPiece(randomPiece);
    player.pos.y = 0;
    
    player.pos.x = (Math.floor(arena[0].length / 2)) - 
                   (Math.floor(player.matrix[0].length / 2));


    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0)); 
        
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('tetrisBestScore', bestScore); 
        }
        score = 0;
        updateScoreUI(); 
    }
}

// siklus Game Loop
function update(time = 0) {
    if (isPaused) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    animationId = requestAnimationFrame(update);
}

// Kontrol Keyboard
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q' || event.key === 'Q') {
        playerRotate(-1);
    } else if (event.key === 'w' || event.key === 'W') {
        playerRotate(1);
    }
});

// Tombol Play / Pause
const playBtn = document.getElementById('play-btn');

playBtn.addEventListener('click', () => {
    isPaused = !isPaused; 

    if (!isPaused) {
        update();
        playBtn.innerText = "Pause Game";
    } else {
        playBtn.innerText = "Resume Game";
    }
});

// Tombol Reset
document.getElementById('reset-btn').addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    playerReset();
    draw(); 
});

// Mulai Game
updateScoreUI();
playerReset();
update();