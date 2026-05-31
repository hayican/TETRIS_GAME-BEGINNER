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

// Variabel Status Game
let gameState = 'idle';

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

// Fungsi Teks Tengah
function drawText(text) {
    context.save();
    context.scale(1/30, 1/30);
    
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '30px "Pixelify Sans", sans-serif';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    context.restore();
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

    if (gameState !== 'gameover') {
        drawMatrix(player.matrix, player.pos);
    }

    if (gameState === 'paused') {
        drawText('Paused');
    } else if (gameState === 'gameover') {
        drawText('Game Over T_T');
    } else if (gameState === 'ready') {
        drawText(readyText);
    }
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
        gameState = 'gameover'; 
        
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('tetrisBestScore', bestScore); 
        }
        score = 0;
        updateScoreUI(); 
        draw();
    }
}

// siklus Game Loop
function update(time = 0) {
    if (isPaused || gameState !== 'playing') return;
    
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
    if (gameState !== 'playing') return;

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


// btn play/pause
const playBtn = document.getElementById('play-btn');

playBtn.addEventListener('click', () => {
    if (gameState === 'gameover') return; // Kalau udah mati, wajib klik reset

    if (gameState === 'idle') {
        gameState = 'ready';
        readyText = 'Ready?';
        draw();
        playBtn.disabled = true; 

        setTimeout(() => {
            readyText = 'Go!';
            draw(); 

            setTimeout(() => {
                gameState = 'playing';
                isPaused = false;
                playBtn.disabled = false;
                playBtn.innerText = "Pause Game";
                update(); 
            }, 1000);
        }, 1000);

    } else if (gameState === 'playing') {
        // FUNGSI PAUSE
        gameState = 'paused';
        isPaused = true;
        playBtn.innerText = "Resume Game";
        draw(); 
    } else if (gameState === 'paused') {
        // FUNGSI RESUME
        gameState = 'playing';
        isPaused = false;
        playBtn.innerText = "Pause Game";
        update();
    }
});

// Tombol Reset
document.getElementById('reset-btn').addEventListener('click', () => {
    arena.forEach(row => row.fill(0));
    
    score = 0;
    updateScoreUI();
    
    gameState = 'idle';
    isPaused = true;
    playBtn.innerText = "Start Game";
    playBtn.disabled = false;
    
    playerReset();
    draw(); 
});

// Mulai Game
document.fonts.ready.then(() => {
    updateScoreUI();
    playerReset();
    update();
});