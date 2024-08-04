"use strict";
/*TODO: 8/04
- add pause, resume, start, and reset method in timer classs
- reset timer when new level hits
 */
/*FIXME:
- determine correct score variable type to get rid of the red underline
*/
// constants 
const FPS = 30; //30 frames per sec
let PEW_SIZE = 30; // pew frame size in pixels
const ROIDS_NUM = 4; //starting number of asteroids 
const ROIDS_JAG = 0.4; //jaggedness of the asteroid (0 = none, 1 = lots)
let ROIDS_SIZE = 70; //starting size of asteroids in pixels
const MIN_ROID_SPD = 100; //min starting speed of asteroid in pixels per second 
const ROIDS_SPD = 200; //max starting speed of asteroids in pixels per second 
const ROIDS_VERT = 10; //average number of verticles on each asteroid 
const EXPLODE_DUR = 0.3; //duratioin of the ship's explosion 
const SHOW_BOUNDING = true; //show or hide collision bounding 
const SHOW_CENTRE_DOT = false; //show or hide ship's center dot 
const TEXT_FADE = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; //text font height in pixels 
let pewCollision = false;
const canv = document.getElementById("gameCanvas");
const ctx = canv.getContext("2d");
//set up game parameters 
let level, pew, roids, score, text, textAlpha;
newGame();
const mouse = new Image();
mouse.src = "medias/mouse.png";
const paw = new Image();
paw.src = "medias/cat_paw.png";
//set up asteriod object 
// let roids: Asteroid[] = []; 
createAsteroidBelt();
let asteroidDebris = [];
let clicked = false;
let clickedRectangle = null; //position of clicked rec (if x and y number else null)
setInterval(base, 1000 / FPS);
canv.addEventListener("click", handleCanvasClick);
function handleCanvasClick(ev) {
    if (pew.dead) {
        return;
    }
    // if (shipExploded) return; 
    ev.preventDefault();
    // calculate the position on the canvas
    const rectX = ev.clientX - canv.getBoundingClientRect().left;
    const rectY = ev.clientY - canv.getBoundingClientRect().top;
    clicked = true;
    // Update the rectangle position if another click is made
    clickedRectangle = { x: rectX - pew.w / 2, y: rectY - pew.h / 2, r: pew.r };
}
let counter;
class Timer {
    constructor(initial) {
        this.initial = initial;
        this.counter = initial;
        let intervalid = setInterval(() => {
            this.counter--;
            console.log(`Countdown: ${this.counter}`);
            if (this.counter === 0)
                clearInterval(intervalid);
        }, 1000);
    }
    get timer() {
        return this.counter;
    }
}
let timer = new Timer(10);
//check timer and destoryed mouse number for game over
function checkTimer() {
    if (timer.timer === 0 && asteroidDebris.length < 10) {
        gameOver();
    }
    else {
        console.log("still got " + timer.timer + " seconds");
    }
}
setInterval(checkTimer, 1000); //check counter very second
function createAsteroidBelt() {
    roids = [];
    let x, y;
    for (let i = 0; i < ROIDS_NUM; i++) {
        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
        } while (distanceBtwPts(pew.x, pew.y, x, y) < ROIDS_SIZE * 1.5 + pew.r);
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    }
}
//check timer and destoryed mouse number for game over
function destroyAsteroids(index) {
    const asteroid = roids[index];
    asteroidDebris.push(asteroid);
    roids.splice(index, 1);
    //add one to score for destorying 
    score = asteroidDebris.length;
    //spawn from one of the edges 
    const side = Math.floor(Math.random() * 4); //this will randomly determine which side to spawn 
    let x, y;
    switch (side) {
        case 0: //top
            x = Math.floor(Math.random() * canv.width);
            y = 0;
            break;
        case 1: //bottom
            x = Math.floor(Math.random() * canv.width);
            y = canv.height;
            break;
        case 2: //right
            x = canv.width;
            y = Math.floor(Math.random() * canv.height);
            break;
        case 3: //left
            x = 0;
            y = Math.floor(Math.random() * canv.height);
            break;
        default:
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
            break;
    }
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    if (asteroidDebris.length == 10) { //when hit 10 asteroids
        asteroidDebris = [];
        //increase level
        newLevel();
        //increase difficulty when hit every 10 level
        if (level % 10 === 0) {
            ROIDS_SIZE = ROIDS_SIZE - 5;
            roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
            PEW_SIZE -= 2.5;
        }
        else if (level === 100) {
            return;
        }
    }
    else if (level === 100) {
        winGame();
    }
}
function distanceBtwPts(x1, y1, x2, y2) {
    //for buffer zone
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function newAsteroid(x, y, r) {
    let lvlMul = 1 + 0.3 * level;
    const centreX = canv.width / 2;
    const centreY = canv.height / 2;
    //calculate direction from asteroid to center 
    const dx = centreX - x;
    const dy = centreY - y;
    //caculate length of direction vector 
    const unitX = dx / (Math.sqrt(dx * dx + dy * +dy));
    const unitY = dy / (Math.sqrt(dx * dx + dy * +dy));
    const speed = (Math.random() * lvlMul * (ROIDS_SPD - MIN_ROID_SPD) + MIN_ROID_SPD) / FPS;
    let roid = {
        x: x,
        y: y,
        //x velocity
        xv: unitX * speed * (Math.random() < 0.5 ? 1 : -1), // math random if less than 0.5, go positive, otherwsie go negative
        //y velocity 
        yv: unitY * speed * (Math.random() < 0.5 ? 1 : -1),
        r: r, //radius 
        a: Math.random() * Math.PI * 2, //angles in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: [],
        rotation: 0,
    };
    //create the vertex offset array 
    for (var i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}
function newGame() {
    level = 1;
    pew = newPew();
    score = 0;
}
function newLevel() {
    level++;
    text = "Level " + level;
    textAlpha = 1;
    console.log(level);
    timer = new Timer(10);
}
function winGame() {
    text = "You Beat the Game! Congradulation!!!!";
    textAlpha = 1;
}
function gameOver() {
    text = "Game Over :(";
    textAlpha = 1;
    pew.dead = true;
    // ctx!.clearRect(0, 0, canv.width, canv.height);
}
function newPew() {
    return {
        x: canv.width / 2 - PEW_SIZE / 2,
        y: canv.height / 2 - PEW_SIZE / 2,
        h: PEW_SIZE,
        w: PEW_SIZE,
        r: PEW_SIZE / 2, //radius
        // a: 90 / 180 * Math.PI //convert to radian of 90 degrees 
        explodeTime: 0,
        dead: false,
    };
}
function base() {
    // let exploding = pew.explodeTime > 0 
    //draw space 
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height); // draw a filled rectangle
    //draw pew (rectangle)---------------------------------------------------------
    ctx.strokeStyle = "white",
        ctx.lineWidth = PEW_SIZE / 20;
    // determine if the pew is colliding with any asteroids
    if (clickedRectangle && !pew.dead) {
        pewCollision = false;
        for (let i = 0; i < roids.length; i++) {
            if (distanceBtwPts(clickedRectangle.x, clickedRectangle.y, roids[i].x, roids[i].y) < clickedRectangle.r + roids[i].r) { //check if it's in collision with asteroids 
                pewCollision = true;
            }
        }
    }
    // draw the clicked rectangle if it exists
    if (!clicked) {
        ctx.drawImage(paw, pew.x, pew.y, pew.w, pew.h * 1.5);
    }
    else if (clickedRectangle && !pew.dead) { //before first colision 
        const centerX = clickedRectangle.x + pew.w / 2;
        const centerY = clickedRectangle.y + pew.h / 2;
        ctx.drawImage(paw, centerX - pew.w / 2, centerY - pew.h / 2, pew.w, pew.h * 1.5);
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            // calculate the center of the rectangle
            // making a larger radius for the circle to be bigger than the square
            const circleRadius = pew.r * 1.5; // increase the radius by 50%
            // draw the circle at the center with the new radius
            ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2, false);
            ctx.stroke();
        }
        //check or asteroid collisions
        if (!pew.dead) {
            for (let i = 0; i < roids.length; i++) {
                const { x: ax, y: ay, r: ar } = roids[i];
                const { x: rx, y: ry, r: rr } = clickedRectangle;
                if (clickedRectangle && distanceBtwPts(rx, ry, ax, ay) < rr + ar) {
                    //check distance
                    destroyAsteroids(i);
                    pewCollision = false;
                    break; // exit the loop as we have destroyed one asteroid
                }
            }
        }
    }
    else { //pew.dead = true
        gameOver();
    }
    //text ---------------------------------------------
    if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE / FPS);
    }
    else if (pew.dead) {
        //start new game after game over
        newGame();
    }
    //draw the score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    const scoreTxt = "Score: " + score;
    ctx.fillText(scoreTxt, canv.width - PEW_SIZE / 2, PEW_SIZE);
    //draw timer
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(timer.timer, PEW_SIZE / 2, PEW_SIZE);
    //draw asteroids --------------------------------------
    // let x, y, r, a, vert, offs; 
    for (let i = 0; i < roids.length; i++) {
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = PEW_SIZE / 20;
        //get the asteroid properties 
        const { x, y, r, a, vert, offs } = roids[i];
        // // draw a path 
        // ctx!.beginPath(); 
        // ctx!.moveTo(
        //   x + r * offs[0] * Math.cos(a), 
        //   y + r * offs[0] * Math.sin(a), 
        // );
        // //draw the polygon 
        // for (let j = 1; j < vert; j++){ 
        //   ctx!.lineTo(
        //     x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
        //     y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
        //   )
        // }
        // // ctx!.drawImage(img, 0, 0, ROIDS_SIZE, ROIDS_SIZE);
        // ctx!.closePath(); 
        // ctx!.stroke();
        // const mouseX = roids[i].xv;
        // const mouseY = roids[i].yv; 
        // console.log("yv " + roids[i].yv)
        // console.log("xv " + roids[i].xv)
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;
        const rotate = Math.atan2(roids[i].yv, roids[i].xv) + (90 * Math.PI / 180); //find angle + 1.5 to adjust angle facing
        ctx.save();
        ctx.translate(roids[i].x, roids[i].y); //translate on roid's x and y position 
        ctx.rotate(rotate); //rotate to roid rotation
        ctx.drawImage(mouse, -r, -r, r * 2, r * 2);
        ctx.restore();
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    }
    //move the asteroid 
    for (let i = 0; i < roids.length; i++) {
        // roids[i].x += roids[i].xv; 
        // roids[i].y += roids[i].yv;
        //handle edge of screen 
        //if go off screen, it will appear on the other side 
        //x direction 
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r;
        }
        else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r;
        }
        //y direction 
        if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canv.height + roids[i].r;
        }
        else if (roids[i].y > canv.height + roids[i].r) {
            roids[i].y = 0 - roids[i].r;
        }
    }
}
