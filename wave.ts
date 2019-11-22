
const stream = process.stdout;
let consoleWidth = undefined;

function delay(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

function sinBuffer(buf: Buffer, memory: boolean[][], row: number, column: number) {
    const bytes = 3;
    for (let r = 0; r < row; r++) {
        for (let j = 0, cidx = 0; j < column * bytes; j += 3, cidx++) {
            if (memory[r][cidx] == true) {
                buf.write("█", j + r * (column * bytes + 1), "utf-8")
            } else {
                buf.writeIntLE(0x00, j + r * (column * bytes + 1), 3);
                buf.write(" ", j + r * (column * bytes + 1), "utf-8")
            }
        }
        // '\n'
        buf.writeInt8(0x0a, column * 3 + r * (column * 3 + 1))
    }
}

function initMemory(row: number, column: number) {
    const memory = [[]];
    for (let i = 0; i < row; i++) {
        memory[i] = [];
        for (let j = 0; j < column; j++) {
            memory[i][j] = false;
        }
    }
    return memory;
}

const updateSin = (memory: boolean[][], time: number, d: number = 0.145, row: number, column: number) => {
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < column; j++) {
            memory[i][j] = false;
        }
    }
    // const step = 1.0 / row;
    const step = 2.0 / row;
    for (let i = 0; i < column; i++) {
        // const val =Math.max(0, Math.sin(time+d*i));
        const val = (Math.sin((time + d * i)) + Math.sin(1.1 * (time + d * i))) / 2 + 1.0;
        const level = Math.floor(val / step);
        // console.log(`Level '${level}`);
        for (let l = 0; l < level; l++) {
            memory[row - 1 - l][i] = true
        }
    }

};
const loop = async () => {
    const row = stream.rows;
    const column = stream.columns;
    const buf = Buffer.alloc(row * (column * 3 + 1), 0x00, "utf-8");
    const memory = initMemory(row, column);
    const unit = 200;
    let time = 0;
    let lastTime = Date.now();
    let i = 0;
    while (true) {
        time = unit * i;
        updateSin(memory, time, 0.11, row, column);
        sinBuffer(buf, memory, row, column);
        stream.write(buf);

        stream.moveCursor(0, -row);
        stream.cursorTo(0)
        // await moveCursorPromise(0,-row);
        // await cursorToPromise(0);

        const now = Date.now();
        const diff = now - lastTime;
        lastTime = now;
        await delay(Math.max(0, 100));
        i = (i + 1) % Number.MAX_SAFE_INTEGER;
    }
};

loop();
