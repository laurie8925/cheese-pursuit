"use strict";
// constants 
const FPS = 30; //30 frames per sec
const PEW_SIZE = 30; // pew frame size in pixels
const ROIDS_NUM = 5; //starting number of asteroids 
const ROIDS_JAG = 0.4; //jaggedness of the asteroid (0 = none, 1 = lots)
const ROIDS_SIZE = 100; //starting size of asteroids in pixels
const ROIDS_SPD = 50; //max starting speed of asteroids in pixels per second 
const ROIDS_VERT = 10; //average number of verticles on each asteroid 
const SHOW_BOUNDING = true; //show or hide collision bounding 
const SHOW_CENTRE_DOT = false; //show or hide ship's center dot 
const canv = document.getElementById("gameCanvas");
const ctx = canv.getContext("2d");
//pew object
const pew = {
    //center the starting position
    x: canv.width / 2 - PEW_SIZE / 2,
    y: canv.height / 2 - PEW_SIZE / 2,
    h: PEW_SIZE,
    w: PEW_SIZE,
    r: PEW_SIZE / 2, //radius
    // a: 90 / 180 * Math.PI //convert to radian of 90 degrees 
};
//set up asteriod object 
let roids = [];
createAsteroidBelt();
let clicked = false;
let clickedRectangle = null; //position of clicked rec (if x and y number else null)
setInterval(base, 1000 / FPS);
canv.addEventListener("click", handleCanvasClick);
function handleCanvasClick(ev) {
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
        roids.push(newAsteroid(x, y));
    }
}
function distanceBtwPts(x1, y1, x2, y2) {
    //for buffer zone
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function newAsteroid(x, y) {
    let roid = {
        x: x,
        y: y,
        //x velocity
        xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1), // math random if less than 0.5, go positive, otherwsie go negative
        //y velocity 
        yv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: ROIDS_SIZE / 2, //radius 
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
    //draw space 
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.width, canv.height); // draw a filled rectangle
    //draw pew (rectangle)
    ctx.strokeStyle = "white",
        ctx.lineWidth = PEW_SIZE / 20;
    // draw the clicked rectangle if it exists
    if (!clicked) {
        // draw the pew (rectangle) at the center
        ctx.strokeStyle = "white";
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
    else if (clickedRectangle) {
        ctx.strokeStyle = "red";
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
    }
    //draw asteroids 
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = PEW_SIZE / 20;
    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
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
        //move the asteroid 
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
