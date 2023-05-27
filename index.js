const canvas = document.querySelector("#canvas");
canvas.width = 720;
canvas.height = 800;
const ctx = canvas.getContext("2d");

const areaSize = 17;
const squareWidth = (canvas.width - (30 * 2)) / areaSize;
const updateTime = 1000 / 9;
let currentPoints = 0;
let topPoints = 0;

let snake;
let apple;
let lastTimestamp = 0;
let time = 0;

let isLive = false;
let direction = "E";

const startPos = {
    x: 30,
    y: 110
};

const colors = {
    background1: "#578a34",
    background2: "#4a752c",
    board1: "#aad751",
    board2: "#a2d149"
};

const createPos = (x, y) => {
    return {
        x: x,
        y: y
    }
};

const drawApple = (x, y) => {
    ctx.fillStyle = "#E13A36";
    ctx.beginPath()
    ctx.arc(x, y, 40 * .35, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#8C563A";
    ctx.fillRect(x - 2, y - 20, 4, 10)
    ctx.beginPath()
    ctx.fillStyle = "#66B340";
    ctx.ellipse(x + 4.5, y - 19, 40 / 6, 40 / 15, .1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
}

const drawCup = (x, y) => {
    ctx.fillStyle = "#f4c006";
    ctx.strokeStyle = "#f4c006";
    ctx.beginPath()
    ctx.rect(x - 11, y - 20, 22, 25)
    ctx.roundRect(x - 11, y, 22, 10, 5)
    ctx.fill()
    ctx.beginPath()
    ctx.lineWidth = 3
    ctx.moveTo(x - 17, y - 20)
    ctx.lineTo(x + 17, y - 20)
    ctx.ellipse(x, y - 7, 17, 10, 0, 0, Math.PI)
    ctx.closePath()
    ctx.stroke()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + 18)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x, y + 22, 10, 4, 0, Math.PI, Math.PI * 2)
    ctx.fill()
}

function reloadScene () {
    ctx.reset()
    ctx.fillStyle = colors.background1
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = colors.background2
    ctx.fillRect(0, 0, canvas.width, 80)

    let color = true
    ctx.fillStyle = colors.board1
    ctx.fillRect(30, 110, canvas.width - 60, canvas.height - 110 - 30)

    drawApple(40, 42)
    ctx.font = "28px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "white"
    ctx.fillText(currentPoints, 65, 50)

    drawCup(140, 40)
    ctx.fillStyle = "white"
    ctx.fillText(topPoints, 168, 50)

    for (let i = 0; i < areaSize; i++) {
        for (let j = 0; j < areaSize; j++) {
            ctx.fillStyle = color ? colors.board1 : colors.board2
            ctx.fillRect(30 + j * squareWidth, 110 + i * squareWidth, squareWidth, squareWidth)
            color = !color
        }
        if (areaSize % 2 == 0)
            color = !color
    }
}

class Apple {
    constructor(size) {
        const center = Math.floor(size / 2)
        this.pos = createPos(center + 3, center)
    }

    async newPosition(array) {
        let count = 0;
        while (true) {
            const pos = createPos(Math.floor(Math.random() * areaSize), Math.floor(Math.random() * areaSize));
            if (!array.some(value => value.x == pos.x && value.y == pos.y)) {
                this.pos = pos;
                return;
            }
            if (count > Math.pow(areaSize, 2))
                break;
            count++;
        }
        for (let i = 0; i < areaSize; i++) {
            for (let j = 0; j < areaSize; j++) {
                if (!array.some(value => value.x == i && value.y == j)) {
                    this.pos = createPos(i, j);
                    return;
                }
            }
        }
    }

    isCollision(x, y) {
        return this.pos.x == x && this.pos.y == y;
    }

    draw() {
        ctx.fillStyle = "#E13A36";
        ctx.beginPath()
        ctx.arc(startPos.x + (this.pos.x + .5) * squareWidth, startPos.y + (this.pos.y + .6) * squareWidth, squareWidth * .35, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#8C563A";
        ctx.fillRect(startPos.x + (this.pos.x + .5) * squareWidth - squareWidth / 20, startPos.y + (this.pos.y + .1) * squareWidth, squareWidth / 10, squareWidth / 4)
        ctx.beginPath()
        ctx.fillStyle = "#66B340";
        ctx.ellipse(startPos.x + (this.pos.x + .61) * squareWidth, startPos.y + (this.pos.y + .12) * squareWidth, squareWidth / 6, squareWidth / 15, .1, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
    }
}

class Snake  {
    direction = "E" // N-up E-right S-down W-left
    size = []
    width = .75
    color = "#C338FA"

    constructor (size, direction = "E") {
        this.direction = direction
        const center = Math.floor(size / 2)
        for (let i = 0; i < 5; i++)
            this.size.push(createPos(center - i - 1, center))
    }

    #drawTurnedBody(x, y, direction = 0) {
        direction = direction % 360
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.lineWidth = squareWidth * this.width;
        const point = createPos(startPos.x + x * squareWidth, startPos.y + y * squareWidth)
        if (direction >= 90 && direction < 180) {
            point.x += squareWidth;
        } else if (direction >= 90) {
            if (direction < 270) {
                point.x += squareWidth;
                point.y += squareWidth;
            } else if (direction < 360) {
                point.y += squareWidth;
            } 
        }
        ctx.ellipse(point.x, point.y, squareWidth / 2, squareWidth / 2, direction * Math.PI / 180, -0.05, Math.PI / 2 + 0.05)
        ctx.stroke()
    }

    #drawMidBody(x, y, direction = 0) {
        direction = direction % 180
        ctx.fillStyle = this.color
        ctx.beginPath()
        if (direction < 90) {
            ctx.fillRect(startPos.x + x * squareWidth - .6, startPos.y + y * squareWidth + ((1 - this.width) / 2 * squareWidth), squareWidth + 1.2, this.width * squareWidth)
        } else {
            ctx.fillRect(startPos.x + x * squareWidth + ((1 - this.width) / 2 * squareWidth), startPos.y + y * squareWidth - .6, this.width * squareWidth, squareWidth + 1.2)
        }
    }

    #drawEndBody(x, y, direction = 0, isHead = false) {
        direction = direction % 360
        if (isHead) {
            let grd;
            if (direction < 90) {
                grd = ctx.createLinearGradient(startPos.x + x * squareWidth, 0, startPos.x + (x + .8) * squareWidth, 0);
            } else if (direction < 180) {
                grd = ctx.createLinearGradient(0, startPos.y + y * squareWidth, 0, startPos.y + (y + .8) * squareWidth);
            } else if (direction < 270) {
                grd = ctx.createLinearGradient(startPos.x + (x + .8) * squareWidth, 0, startPos.x + x * squareWidth, 0);
            } else if (direction < 360) {
                grd = ctx.createLinearGradient(0, startPos.y + (y + .8) * squareWidth, 0, startPos.y + y * squareWidth);
            }
            grd.addColorStop(0, this.color);
            grd.addColorStop(1, "#E5820E");

            ctx.fillStyle = grd;
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.beginPath()
        if (direction < 90) {
            ctx.rect(startPos.x + x * squareWidth, startPos.y + y * squareWidth + squareWidth * (1 - this.width) / 2, squareWidth / 2, squareWidth * this.width)
            ctx.ellipse(startPos.x + x * squareWidth + squareWidth / 2, startPos.y + y * squareWidth + squareWidth / 2, squareWidth / 2 * this.width, squareWidth / 2 * this.width, direction * Math.PI / 180, Math.PI / -2, Math.PI / 2)
        } else if (direction < 180) {
            ctx.rect(startPos.x + x * squareWidth + squareWidth * (1 - this.width) / 2, startPos.y + y * squareWidth, squareWidth * this.width, squareWidth / 2)
            ctx.ellipse(startPos.x + x * squareWidth + squareWidth / 2, startPos.y + y * squareWidth + squareWidth / 2, squareWidth / 2 * this.width, squareWidth / 2 * this.width, direction * Math.PI / 180, Math.PI / -2, Math.PI / 2)
        } else if (direction < 270) {
            ctx.ellipse(startPos.x + x * squareWidth + squareWidth / 2, startPos.y + y * squareWidth + squareWidth / 2, squareWidth / 2 * this.width, squareWidth / 2 * this.width, direction * Math.PI / 180, Math.PI / -2, Math.PI / 2)
            ctx.rect(startPos.x + (x + .5) * squareWidth, startPos.y + y * squareWidth + squareWidth * (1 - this.width) / 2, squareWidth / 2, squareWidth * this.width)
        } else if (direction < 360) {
            ctx.ellipse(startPos.x + x * squareWidth + squareWidth / 2, startPos.y + y * squareWidth + squareWidth / 2, squareWidth / 2 * this.width, squareWidth / 2 * this.width, direction * Math.PI / 180, Math.PI / -2, Math.PI / 2)
            ctx.rect(startPos.x + x * squareWidth + squareWidth * (1 - this.width) / 2, startPos.y + (y + .5) * squareWidth, squareWidth * this.width, squareWidth / 2)
        }
        ctx.fill()
    }

    drawBody() {
        this.size.forEach((value, index, array) => {
            let prev = (index != 0 ? array[index - 1] : null)
            let next = (index != array.length - 1 ? array[index + 1] : null)


            if (index == 0) {
                const direction = (next.x == value.x - 1 ? 0 :
                    (next.x == value.x + 1 ? 180 :
                        (next.y == value.y - 1 ? 90 : 270)
                    )
                )
                ctx.beginPath()
                this.#drawEndBody(value.x, value.y, direction, true)
            } else if (index == array.length - 1) {
                const direction = (prev.x == value.x - 1 ? 0 :
                    (prev.x == value.x + 1 ? 180 :
                        (prev.y == value.y - 1 ? 90 : 270)
                    )
                )
                ctx.beginPath()
                this.#drawEndBody(value.x, value.y, direction, false)
            } else {
                if (prev.y == next.y) {
                    this.#drawMidBody(value.x, value.y, 0)
                } else if (prev.x == next.x) {
                    this.#drawMidBody(value.x, value.y, 90)
                } else if (prev.x == value.x + 1 && next.y == value.y + 1) {
                    this.#drawTurnedBody(value.x, value.y, 180)
                } else if (prev.x == value.x + 1 && next.y == value.y - 1) {
                    this.#drawTurnedBody(value.x, value.y, 90)
                } else if (prev.x == value.x - 1 && next.y == value.y - 1) {
                    this.#drawTurnedBody(value.x, value.y, 0)
                } else if (prev.x == value.x - 1 && next.y == value.y + 1) {
                    this.#drawTurnedBody(value.x, value.y, 270)
                } else if (prev.y == value.y - 1 && next.x == value.x - 1) {
                    this.#drawTurnedBody(value.x, value.y, 0)
                } else if (prev.y == value.y - 1 && next.x == value.x + 1) {
                    this.#drawTurnedBody(value.x, value.y, 90)
                } else if (prev.y == value.y + 1 && next.x == value.x - 1) {
                    this.#drawTurnedBody(value.x, value.y, 270)
                } else if (prev.y == value.y + 1 && next.x == value.x + 1) {
                    this.#drawTurnedBody(value.x, value.y, 180)
                }
            }
        })
    }
}

async function start() {
    reloadScene()
    snake = new Snake(Math.round(areaSize))
    apple = new Apple(Math.round(areaSize))
    snake.drawBody()
    apple.draw()
    requestAnimationFrame(update)
}

async function update(timestamp) {
    requestAnimationFrame(update)
    if (isLive) time += timestamp - lastTimestamp;
    if (isLive && time >= updateTime) {
        time = 0;
        let pos;
        if (
            !((direction == "N" && snake.direction == "S") ||
            (direction == "S" && snake.direction == "N") ||
            (direction == "E" && snake.direction == "W") ||
            (direction == "W" && snake.direction == "E"))
        ) {
            snake.direction = direction;
        } else {
            direction = snake.direction;
        }

        switch (snake.direction) {
            case "N":
                pos = createPos(snake.size[0].x, snake.size[0].y - 1)
                break
            case "E":
                pos = createPos(snake.size[0].x + 1, snake.size[0].y)
                break
            case "S":
                pos = createPos(snake.size[0].x, snake.size[0].y + 1)
                break
            case "W":
                pos = createPos(snake.size[0].x - 1, snake.size[0].y)
                break
            default:
                break
        }
        if (snake.size.some(value => value.x == pos.x && value.y == pos.y) || pos.x >= areaSize || pos.x < 0 || pos.y >= areaSize || pos.y < 0 ) {
            isLive = false;
            currentPoints = 0;
            direction = "E"
            requestAnimationFrame(start)
            return;
        }
        snake.size.unshift(pos)
        if (apple.isCollision(pos.x, pos.y)) {
            apple.newPosition(snake.size)
            currentPoints++;
            if (topPoints < currentPoints)
                topPoints = currentPoints;
        } else {
            snake.size.pop()
        }
        reloadScene()
        snake.drawBody()
        apple.draw()
    }
    lastTimestamp = timestamp;
}

window.onload = () => start()

document.onkeydown = (e) => {
    console.log(e.key)
    switch (e.key) {
        case "w":
            isLive = true;
            direction = "N"
            break
        case "d":
            isLive = true;
            direction = "E"
            break
        case "s":
            isLive = true;
            direction = "S"
            break
        case "a":
            isLive = true;
            direction = "W"
            break
        case "ArrowUp":
            isLive = true;
            direction = "N"
            break
        case "ArrowRight":
            isLive = true;
            direction = "E"
            break
        case "ArrowDown":
            isLive = true;
            direction = "S"
            break
        case "ArrowLeft":
            isLive = true;
            direction = "W"
            break
        case "Escape":
            isLive = !isLive
            break
        default:
            break
    }
}