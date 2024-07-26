"use strict";
// constants 
const FPS = 30; //30 frames per sec
const PEW_SIZE = 30; // pew frame size in pixels
const ROIDS_NUM = 5; //starting number of asteroids 
const ROIDS_JAG = 0.4; //jaggedness of the asteroid (0 = none, 1 = lots)
const ROIDS_SIZE = 100; //starting size of asteroids in pixels
const MIN_ROID_SPD = 60; //min starting speed of asteroid in pixels per second 
const ROIDS_SPD = 100; //max starting speed of asteroids in pixels per second 
const ROIDS_VERT = 10; //average number of verticles on each asteroid 
const EXPLODE_DUR = 0.3; //duratioin of the ship's explosion 
const SHOW_BOUNDING = false; //show or hide collision bounding 
const SHOW_CENTRE_DOT = false; //show or hide ship's center dot 
let pewCollision = false;
const canv = document.getElementById("gameCanvas");
const ctx = canv.getContext("2d");
let level = 1;
//pew object
const pew = {
    //center the starting position
    x: canv.width / 2 - PEW_SIZE / 2,
    y: canv.height / 2 - PEW_SIZE / 2,
    h: PEW_SIZE,
    w: PEW_SIZE,
    r: PEW_SIZE / 2, //radius
    // a: 90 / 180 * Math.PI //convert to radian of 90 degrees 
    explodeTime: 0,
};
//set up asteriod object 
let roids = [];
createAsteroidBelt();
let asteroidDebris = [];
let clicked = false;
let clickedRectangle = null; //position of clicked rec (if x and y number else null)
setInterval(base, 1000 / FPS);
canv.addEventListener("click", handleCanvasClick);
function handleCanvasClick(ev) {
    // if (shipExploded) return; 
    ev.preventDefault();
    // calculate the position on the canvas
    const rectX = ev.clientX - canv.getBoundingClientRect().left;
    const rectY = ev.clientY - canv.getBoundingClientRect().top;
    clicked = true;
    // Update the rectangle position if another click is made
    clickedRectangle = { x: rectX - pew.w / 2, y: rectY - pew.h / 2, r: pew.r };
}
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
function destroyAsteroids(index) {
    const asteroid = roids[index];
    asteroidDebris.push(asteroid);
    roids.splice(index, 1);
    //add new asteroid after one is destoryed
    // const x = Math.floor( Math.random() * canv.width); 
    // const y = Math.floor( Math.random() * canv.height); 
    // roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    //spawn from one of the edges 
    const side = Math.floor(Math.random() * 4); //this will randomly determine which side to spawn 
    let x;
    let y;
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
        level++;
        console.log(level);
        // newLevel(); 
    }
}
function distanceBtwPts(x1, y1, x2, y2) {
    //for buffer zone
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
// function explodeShip(){
//   pew.explodeTime = Math.ceil(EXPLODE_DUR * FPS); //explosion time 
//   if (!clickedRectangle) return; // check if variable is null 
//   ctx!.strokeStyle = "lime";
//   ctx!.lineWidth = PEW_SIZE / 20;
//   ctx!.strokeRect(clickedRectangle.x, clickedRectangle.y, pew.w, pew.h); // Draw the red rectangle at the clicked position
//   ctx!.beginPath();
//     //horzontal line
//     ctx!.moveTo(clickedRectangle.x + pew.w / 4, clickedRectangle.y + pew.h / 2); // Start at one side of the middle
//     ctx!.lineTo(clickedRectangle.x + 3 * pew.w / 4, clickedRectangle.y + pew.h / 2); // Draw line to the other side of the middle
//     //verticle line
//     ctx!.moveTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + pew.h / 4); // Start at the top of the middle
//     ctx!.lineTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + 3 * pew.h / 4); // Draw line to the bottom of the middle
//   ctx!.stroke(); 
//   console.log(pew.explodeTime)
// }
function newAsteroid(x, y, r) {
    let roid = {
        x: x,
        y: y,
        //x velocity
        xv: (Math.random() * (ROIDS_SPD - MIN_ROID_SPD) + MIN_ROID_SPD) / FPS * (Math.random() < 0.5 ? 1 : -1), // math random if less than 0.5, go positive, otherwsie go negative
        //y velocity 
        yv: (Math.random() * (ROIDS_SPD - MIN_ROID_SPD) + MIN_ROID_SPD) / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r, //radius 
        a: Math.random() * Math.PI * 2, //angles in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: []
    };
    //create the vertex offset array 
    for (var i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}
function base() {
    let exploding = pew.explodeTime > 0;
    //draw space 
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height); // draw a filled rectangle
    //draw pew (rectangle)---------------------------------------------------------
    ctx.strokeStyle = "white",
        ctx.lineWidth = PEW_SIZE / 20;
    // determine if the pew is colliding with any asteroids
    if (clickedRectangle) {
        pewCollision = false;
        for (let i = 0; i < roids.length; i++) {
            if (distanceBtwPts(clickedRectangle.x, clickedRectangle.y, roids[i].x, roids[i].y) < clickedRectangle.r + roids[i].r) { //check if it's in collision with asteroids 
                pewCollision = true;
            }
        }
    }
    // draw the clicked rectangle if it exists
    if (!clicked && !exploding) {
        // draw the pew (rectangle) at the center
        ctx.strokeStyle = "white"; //base target
        ctx.lineWidth = PEW_SIZE / 20;
        ctx.strokeRect(pew.x, pew.y, pew.w, pew.h);
        //cross 
        ctx.beginPath();
        //horzontal line
        ctx.moveTo(pew.x + pew.w / 4, pew.y + pew.h / 2); // Start at one side of the middle
        ctx.lineTo(pew.x + 3 * pew.w / 4, pew.y + pew.h / 2); // Draw line to the other side of the middle
        //verticle line
        ctx.moveTo(pew.x + pew.w / 2, pew.y + pew.h / 4); // Start at the top of the middle
        ctx.lineTo(pew.x + pew.w / 2, pew.y + 3 * pew.h / 4); // Draw line to the bottom of the middle
        ctx.stroke();
    }
    else if (clickedRectangle) { //before first colision 
        ctx.strokeStyle = pewCollision ? "lime" : "red";
        ctx.lineWidth = PEW_SIZE / 20;
        ctx.strokeRect(clickedRectangle.x, clickedRectangle.y, pew.w, pew.h); // Draw the red rectangle at the clicked position
        ctx.beginPath();
        //horzontal line
        ctx.moveTo(clickedRectangle.x + pew.w / 4, clickedRectangle.y + pew.h / 2); // Start at one side of the middle
        ctx.lineTo(clickedRectangle.x + 3 * pew.w / 4, clickedRectangle.y + pew.h / 2); // Draw line to the other side of the middle
        //verticle line
        ctx.moveTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + pew.h / 4); // Start at the top of the middle
        ctx.lineTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + 3 * pew.h / 4); // Draw line to the bottom of the middle
        ctx.stroke();
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            // calculate the center of the rectangle
            const centerX = clickedRectangle.x + pew.w / 2;
            const centerY = clickedRectangle.y + pew.h / 2;
            // making a larger radius for the circle to be bigger than the square
            const circleRadius = pew.r * 1.5; // increase the radius by 50%
            // draw the circle at the center with the new radius
            ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2, false);
            ctx.stroke();
        }
        //check or asteroid collisions
        if (!exploding) {
            for (let i = 0; i < roids.length; i++) {
                const { x: ax, y: ay, r: ar } = roids[i];
                const { x: rx, y: ry, r: rr } = clickedRectangle;
                // if (clickedRectangle && distanceBtwPts(clickedRectangle.x + pew.r, clickedRectangle.y + pew.r, roids[i].x, roids[i].y) < clickedRectangle.r + roids[i].r) {
                if (clickedRectangle && distanceBtwPts(rx, ry, ax, ay) < rr + ar) {
                    destroyAsteroids(i);
                    // pew.explodeTime = Math.ceil(EXPLODE_DUR * FPS);
                    pewCollision = false;
                    break; // exit the loop as we have destroyed one asteroid
                }
            }
        }
    }
    // else if(exploding){ //after collision 
    //   if (!clickedRectangle) return;
    //   // calculate the center of the rectangle
    //   const centerX = clickedRectangle.x + pew.w / 2;
    //   const centerY = clickedRectangle.y + pew.h / 2;
    //   // making a larger radius for the circle to be bigger than the square
    //   // draw the circle at the center with the new radius
    //   // //draw explosion
    //   // ctx!.fillStyle = "darkred"; 
    //   // ctx!.beginPath();
    //   // // draw the circle at the center with the new radius
    //   // ctx!.arc(centerX, centerY, pew.r * 1.7, 0, Math.PI * 2, false); 
    //   // ctx!.fill(); 
    //   // ctx!.fillStyle = "red"; 
    //   // ctx!.beginPath();
    //   // // draw the circle at the center with the new radius
    //   // ctx!.arc(centerX, centerY, pew.r * 1.4, 0, Math.PI * 2, false); 
    //   // ctx!.fill(); 
    //   // ctx!.fillStyle = "orange"; 
    //   // ctx!.beginPath();
    //   // // draw the circle at the center with the new radius
    //   // ctx!.arc(centerX, centerY, pew.r * 1.1, 0, Math.PI * 2, false); 
    //   // ctx!.fill(); 
    //   // ctx!.fillStyle = "yellow"; 
    //   // ctx!.beginPath();
    //   // // draw the circle at the center with the new radius
    //   // ctx!.arc(centerX, centerY, pew.r * 0.8, 0, Math.PI * 2, false); 
    //   // ctx!.fill(); 
    //   // ctx!.fillStyle = "white"; 
    //   // ctx!.beginPath();
    //   // // draw the circle at the center with the new radius
    //   // ctx!.arc(centerX, centerY, pew.r * 0.5, 0, Math.PI * 2, false); 
    //   // ctx!.fill();
    //   ctx!.strokeStyle = pewCollision ? "lime" : "red"; //color changes depends if its collision 
    //   ctx!.lineWidth = PEW_SIZE / 20;
    //   ctx!.strokeRect(clickedRectangle.x, clickedRectangle.y, pew.w, pew.h);
    //   ctx!.beginPath();
    //     ctx!.moveTo(clickedRectangle.x + pew.w / 4, clickedRectangle.y + pew.h / 2);
    //     ctx!.lineTo(clickedRectangle.x + 3 * pew.w / 4, clickedRectangle.y + pew.h / 2);
    //     ctx!.moveTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + pew.h / 4);
    //     ctx!.lineTo(clickedRectangle.x + pew.w / 2, clickedRectangle.y + 3 * pew.h / 4);
    //   ctx!.stroke();
    // } 
    //draw asteroids --------------------------------------
    // let x, y, r, a, vert, offs; 
    for (let i = 0; i < roids.length; i++) {
        ctx.strokeStyle = "slategrey";
        ctx.lineWidth = PEW_SIZE / 20;
        //get the asteroid properties 
        const { x, y, r, a, vert, offs } = roids[i];
        // x = roids[i].x; 
        // y = roids[i].y; 
        // r = roids[i].r; 
        // a = roids[i].a; 
        // vert = roids[i].vert; 
        // offs = roids[i].offs; 
        // draw a path 
        ctx.beginPath();
        ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
        //draw the polygon 
        for (let j = 1; j < vert; j++) {
            ctx.lineTo(x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert), y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert));
        }
        ctx.closePath();
        ctx.stroke();
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "lime";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    }
    // collision case 
    // for(let i = roids.length - 1; i >=0; i--){ 
    //   const {x:ax, y:ay, r:ar} = roids[i]; 
    //   if(!clickedRectangle) return; 
    //   if (pew.explodeTime == 0 && distanceBtwPts(ax, ay, clickedRectangle.x, clickedRectangle.y) < ar) { 
    //     destroyAsteroids(i); 
    //     pew.explodeTime = Math.ceil(EXPLODE_DUR * FPS);
    //     break; 
    //   }
    // }
    //move the asteroid 
    for (let i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;
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
