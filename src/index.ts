/*TODO: 
- screens: start, insctrution, menu, losing, winning, exiting 
- button: start, instruction, mute/unmute, to homescreen, restart/ replay, resume, exit 

what to include in each screen 
start: start, instruction, mute/unmute 
instruction: back to homepage  
menu: mute/unmute, resume, restart, exit to losing screen
losing: replay, back to homepage + level and score
winning: replay, back to homepage 

add escape function to access menu page 
need to add pause and resume to game 
menu restart button doesn't work
 */

/*FIXME:  

*/

// constants 
const FPS = 30 //30 frames per sec
let PEW_SIZE = 30 // pew frame size in pixels
const ROIDS_NUM = 4; //starting number of asteroids 
const ROIDS_JAG = 0.4; //jaggedness of the asteroid (0 = none, 1 = lots)
let ROIDS_SIZE = 70; //starting size of asteroids in pixels
const MIN_ROID_SPD = 100; //min starting speed of asteroid in pixels per second 
const ROIDS_SPD = 200; //max starting speed of asteroids in pixels per second 
const ROIDS_VERT = 10; //average number of verticles on each asteroid 
const EXPLODE_DUR = 0.3; //duratioin of the ship's explosion 
const SHOW_BOUNDING = false; //show or hide collision bounding 
const SHOW_CENTRE_DOT = false; //show or hide ship's center dot 
const TEXT_FADE = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; //text font height in pixels 
let pewCollision = false;

//DOM documents elements
const canv = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canv.getContext("2d");

const startBtn = document.getElementById("start-btn") as HTMLElement;
const instructionBtn = document.getElementById("instruction-btn") as HTMLElement;
const menuBtn = document.getElementById("menu-btn") as HTMLElement;
const resumeBtn = document.getElementById("resume-btn") as HTMLElement;

const player = document.getElementById("player") as HTMLAudioElement; // Ensure this path is correct
const volumeSliders = document.querySelectorAll(".music-control") as NodeListOf<HTMLInputElement>;
const volumeDisplays = document.querySelectorAll(".volume-display") as NodeListOf<HTMLElement>; 
const volumeSvgs = document.querySelectorAll(".volume-svg") as NodeListOf<HTMLElement>; 
const playPauseButtons = document.querySelectorAll(".play") as NodeListOf<HTMLInputElement>;

// let currentScreen:string = "starting-screen"; 
let gameActive:boolean = false;

//set up game variables 
let level: number 
let pew: PewObject
let roids: Asteroid[]
let score: number | string
let text: string;
let textAlpha: number;
let asteroidDebris: Asteroid[] =[]; 

let timer: Timer; 
let gameLoop: number | NodeJS.Timeout;
let checkGameId: number | NodeJS.Timeout;

let clicked = false; 
let clickedRectangle: { x: number; y: number; r: number } | null = null; //position of clicked rec (if x and y number else null)

//images
const mouse = new Image(); 
mouse.src = "medias/mouse.png"; 

const paw = new Image(); 
paw.src = "medias/cat_paw_2.png";

//interface 
interface PewObject { 
  //center the starting position
  x: number;
  y: number;
  h: number; 
  w: number;
  r: number; //radius
  // a: 90 / 180 * Math.PI //convert to radian of 90 degrees 
  explodeTime: number;
  dead: boolean; 
}

interface Asteroid {
  x: number;
  y: number;
  xv: number;
  yv: number;
  r: number;
  a: number;
  vert: number;
  offs: number[]; 
  rotation: number;
}

//class 
class Timer { 
  private counter: number;
  private intervalid: NodeJS.Timeout | undefined; 
  private isPaused: boolean = false; 
  private remainingTime: number = 0; 
  private startTime: number = 0; 

  constructor(public initial: number){ 
    this.counter = initial; 
    this.startTime = Date.now();
    this.intervalid = setInterval(()=> { 
      if(!this.isPaused){ 
        this.counter--;
        if (this.counter === 0 ){ 
          clearInterval(this.intervalid)
          this.intervalid = undefined; 
        } 
      }
       
      // console.log(`Countdown: ${this.counter}`);
      
      }, 1000)
  }

  public get timer(): number {
    return this.counter;
  }

  public pause(): void { 
    this.isPaused = true; 
    this.remainingTime = this.counter; 
    clearInterval(this.intervalid!);
    this.intervalid = undefined; 
  }

  public resume(): void {
    this.isPaused = false;
    const elapsedTime = Date.now() - this.startTime; // Calculate elapsed time during pause
    const adjustedCounter = this.initial - Math.floor(elapsedTime / 1000); // Adjust counter based on elapsed time
    this.counter = Math.max(adjustedCounter, 0); // Ensure counter doesn't go negative
    this.intervalid = setInterval(() => {
      if (!this.isPaused) {
        this.counter--;
        if (this.counter === 0) {
          clearInterval(this.intervalid!);
          this.intervalid = undefined;
        }
      }
    }, 1000);
  }

  public reset(): void {
    this.pause();
    this.counter = this.initial;
    this.resume();
  }

  public clear(): void { 
    this.intervalid = undefined; 
    clearInterval(this.intervalid)
  }
}

//event listener 
//id button to swtich screen
function switchScreenBtn (buttonId:string, screenId:string){ 
  const button = document.getElementById(buttonId) as HTMLElement; 
  button.addEventListener("click", ()=> { 
    switchScreen(screenId); 
    if (screenId === "game-screen"){ 
      newGame(); 
    }
  })
};

switchScreen("starting-screen");
switchScreenBtn("start-btn", "game-screen"); 
switchScreenBtn("instruction-btn", "instruction-screen"); 
switchScreenBtn("music-btn", "music-screen"); 

//for class buttons 
function buttonQuery (btnClassName:string, screen:string){ 
  document.addEventListener("DOMContentLoaded", () => {
  let buttons = document.getElementsByClassName(btnClassName); 
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i]; 
    button.addEventListener("click", (event) => {
      event.preventDefault(); // prevent default 
      event.stopImmediatePropagation(); // stop propagation

      // Switch to the starting screen
      switchScreen(screen);

      if (screen === "game-screen"){ 
        newGame(); 
        
      } else if (screen === "starting-screen"){ 
        clearInterval(gameLoop);
        clearInterval(checkGameId);
        pew.dead = true; 
        gameActive = false;
      }
       // Switch to the starting screen
       switchScreen(screen); 
      });
    } 
  }); 
}; 

buttonQuery("home-btn", "starting-screen");
buttonQuery("game-btn", "game-screen");

//switch screen management 
function switchScreen(screenId:string) { 
  document.querySelectorAll(".screen").forEach(function(screen) {
    screen.classList.add("hidden");
  });
  const element = document.getElementById(screenId) as HTMLElement;
  element.classList.remove("hidden");
  // currentScreen = screenId;
  // console.log(currentScreen); 
}

//handle escape menu screen
function menuScreen(){ 
  let isEscPressed = false; 

  document.body.addEventListener("keydown", function(e: KeyboardEvent) {
    if (e.key === "Escape" && gameActive) {
      if (!isEscPressed) {
        switchScreen("menu-screen");
        timer.pause();
      } else {
        switchScreen("game-screen");
        timer.resume();
      }
      isEscPressed = !isEscPressed;
    }
  });

  //resume button event listener outside the keydown event listener
  resumeBtn.addEventListener("click", () => {
    switchScreen("game-screen");
    timer.resume();
    isEscPressed = !isEscPressed; // change state when the resume button is clicked
  });


};  

menuScreen();


//music 
if (!player || !volumeSliders || !playPauseButtons) {
    console.error("One or more elements not found.");
}

player.loop = true;
try {
  player.play();
} catch (error) {
  console.error('Playback failed:', error);
}

playPauseButtons.forEach((playPauseButton)=> { 
  const playSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-pause-filled" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffcd28" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" stroke-width="0" fill="#ffcd28" />
        <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" stroke-width="0" fill="#ffcd28" />
    </svg>`; 
  const pauseSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play-filled" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffcd28" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" stroke-width="0" fill="#ffcd28" />
    </svg>`; 

  //handle default svg
  if (player.paused){ 
    playPauseButton.innerHTML = pauseSvg;
  } else { 
    playPauseButton.innerHTML = playSvg;
  }

  //handle click events
  playPauseButton.addEventListener("click", () => {
    if (player.paused) {
      //shows pause button when music plays
      
      player.play();
      playPauseButton.innerHTML = playSvg;  //pause button svg
    } else {
      //shows play button when music is paused
      player.pause();
      playPauseButton.innerHTML = pauseSvg; //play button svg

    }
});
})


//event listener for volume slider
volumeSliders!.forEach((volumeSlider)=> { 
  function updateVolume (volume:number):void { //adjust volume based on slider position and updates all volume 
    const currentVolume = volumeSlider.valueAsNumber; 
    player.volume = currentVolume / 10; 

    volumeDisplays!.forEach((volumeDisplay) => { 
        volumeDisplay.textContent = `${(currentVolume)}`;
      })

    volumeSlider.value = volume.toString()
  } //end of updatevolume function 

  function handleVolumeChange(event: Event): void { //act as event handler, apply change to player volume and update display 
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    updateVolume(newValue);

    volumeSvgs.forEach(volumeSvg=>{ //for svg control 
      if(newValue === 0){ 
        volumeSvg.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-volume-3" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffcd28" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
            <path d="M16 10l4 4m0 -4l-4 4" />
        </svg>`;
      } else if (newValue > 0 && newValue <= 5) { 
        volumeSvg.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-volume-2" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffcd28" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 8a5 5 0 0 1 0 8" />
              <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
          </svg>`;
      } else { 
        volumeSvg.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-volume" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffcd28" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M15 8a5 5 0 0 1 0 8" />
            <path d="M17.7 5a9 9 0 0 1 0 14" />
            <path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5" />
          </svg>`;
      }; 
    }); //end of svg control 
    
  }

volumeSliders.forEach(control => {
  control.addEventListener('input', handleVolumeChange);
});

setInterval(updateVolume, 100);

}) //end of volume slider 
  
 

canv.addEventListener("click", handleCanvasClick);

function handleCanvasClick(ev: MouseEvent):void { 
  if (pew.dead){ 
    return; 
  }
  // if (shipExploded) return; 
  ev.preventDefault();
  // calculate the position on the canvas
  const rectX = ev.clientX - canv.getBoundingClientRect().left;
  const rectY = ev.clientY - canv.getBoundingClientRect().top;

  clicked = true;
  // Update the rectangle position if another click is made
  clickedRectangle = { x: rectX - pew.w/2, y: rectY - pew.h/2, r:pew.r};
}

function createAsteroidBelt() { 
  roids = []; 
  let x:number, y:number; 
  for (let i = 0; i < ROIDS_NUM; i++){ 
    do {
         x = Math.floor( Math.random() * canv.width); 
         y = Math.floor( Math.random() * canv.height); 
    } while (distanceBtwPts(pew.x, pew.y, x, y) < ROIDS_SIZE * 1.5 + pew.r);
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2))); 
    }
}

//check timer and destoryed mouse number for game over
function destroyAsteroids(index:number){ 

  const asteroid= roids[index]; 

  asteroidDebris.push(asteroid); 
  roids.splice(index, 1); 
  //add one to score for destorying 
  score = asteroidDebris.length;

  //spawn from one of the edges 
  const side = Math.floor(Math.random()*4); //this will randomly determine which side to spawn 
  let x:number,  y:number;
  switch(side){ 
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
      y = Math.floor(Math.random()* canv.height); 
      break;
    case 3: //left
      x = 0; 
      y = Math.floor(Math.random()* canv.height); 
      break;
    default: 
      x = Math.floor(Math.random()*canv.width); 
      y = Math.floor(Math.random()*canv.height); 
      break; 
  }

  roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));

  if(asteroidDebris.length == 10){ //when hit 10 asteroid

    //increase level
    newLevel();

    //increase difficulty when hit every 10 level
    if (level === 100){ 
      return; 
    } else if (level % 10 === 0){ 
      ROIDS_SIZE = ROIDS_SIZE - 5; 
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
      PEW_SIZE -= 2.5; 
    } 
  } else if (level === 100){
    winGame();
  }
}

function distanceBtwPts (x1:number, y1: number, x2: number, y2: number) { 
  //for buffer zone
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function newAsteroid(x: number, y: number, r:number): Asteroid { 

  let lvlMul = 1 + 0.3 * level; 

  const centreX = canv.width / 2; 
  const centreY = canv.height /2; 

  //calculate direction from asteroid to center 
  const dx = centreX - x; 
  const dy = centreY - y 

  //caculate length of direction vector 
  const unitX = dx / (Math.sqrt(dx*dx + dy*+dy)); 
  const unitY = dy / (Math.sqrt(dx*dx + dy*+dy)); 

  const speed = (Math.random() * lvlMul * (ROIDS_SPD - MIN_ROID_SPD) + MIN_ROID_SPD) / FPS;
  const direction = Math.random() < 0.5 ? 1 : -1; // math random if less than 0.5, go positive, otherwsie go negative
 
  let roid: Asteroid = {
    x: x,
    y: y, 
    //x velocity
    xv: unitX * speed * direction, 
    //y velocity 
    yv: unitY * speed * direction, 
    r: r, //radius 
    a: Math.random() * Math.PI * 2, //angles in radians
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2), 
    offs: [], 
    rotation: 0, 
  }; 

  return roid; 
}

function newGame(){ 
  gameActive = true;
  clearInterval(gameLoop);
  clearInterval(checkGameId);
  //check here after timer.timer is declared
  checkGameId = setInterval(() => {
    if (timer.timer === 0 && asteroidDebris.length < 10){ 
      gameOver();
    }
  }, 500); //check game very second
  clicked = false; 
  asteroidDebris = [];
  timer = new Timer(10); 
  level = 1; 
  pew = newPew(); 
  score = 0; 
  createAsteroidBelt(); 
  gameLoop = setInterval(base, 1000 / FPS); 
}

function newLevel(){ 
  asteroidDebris = []; //empty score
  level++; //increase level
  text = "Level " + level; 
  textAlpha = 1; 
  timer = new Timer(10); 
}

function winGame (){ 
  gameActive = !gameActive;
  switchScreen("winning-screen")
    // text = "You Beat the Game! Congradulation!!!!"
    clearInterval(checkGameId);
    clearInterval(gameLoop);
    pew.dead = true; 
    // textAlpha = 1; 
}

function gameOver(){ 
  gameActive = !gameActive;
  console.log("Entering gameOver"); // Debug statement
  switchScreen("gameover-screen");
  console.log("Before clearing intervals, checkGameId:", checkGameId); // Debug statement
  clearInterval(checkGameId);
  clearInterval(gameLoop);
  console.log("After clearing intervals, checkGameId:", checkGameId); // Debug statement
  pew.dead = true; 

  console.log("clear end game");
}

function newPew(): PewObject{ 
  return{ 
    x: canv.width / 2 - PEW_SIZE / 2,  
    y: canv.height / 2 - PEW_SIZE / 2, 
    h: PEW_SIZE, 
    w: PEW_SIZE, 
    r: PEW_SIZE / 2, //radius
    // a: 90 / 180 * Math.PI //convert to radian of 90 degrees 
    explodeTime: 0,
    dead: false, 
  }
}


function base() { 
  
  //draw space 
  ctx!.fillStyle = "#537CBC"; 
  ctx!.fillRect(0, 0, canv.width, canv.height); // draw a filled rectangle

  //draw pew (rectangle)---------------------------------------------------------
  ctx!.strokeStyle = "white", 
  ctx!.lineWidth = PEW_SIZE / 20; 

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
    ctx!.drawImage(paw, pew.x, pew.y, pew.w*1.2, pew.h*1.7);

  } else if (clickedRectangle && !pew.dead) { //activate cursor 

    const centerX = clickedRectangle.x + pew.w*1.2  / 2;
    const centerY = clickedRectangle.y + pew.h*1.7 / 2;
    ctx!.drawImage(paw, centerX - pew.w*1.2 / 2, centerY - pew.h*1.7  / 2, pew.w*1.2 , pew.h *1.7); 

    if(SHOW_BOUNDING) { 
      ctx!.strokeStyle = "lime"; 
      ctx!.beginPath();
      // calculate the center of the rectangle
      // making a larger radius for the circle to be bigger than the square
      const circleRadius = pew.r * 1.5; // increase the radius by 50%
      // draw the circle at the center with the new radius
      ctx!.arc(centerX, centerY, circleRadius, 0, Math.PI * 2, false); 
      ctx!.stroke(); 
    }

     //check or asteroid collisions
      if(pew.dead){
        return; 
       } 

      for(let i = 0; i < roids.length; i++){
        const {x:ax, y:ay, r:ar} = roids[i]; 
        const {x:rx, y:ry, r:rr} = clickedRectangle; 

        if (clickedRectangle && distanceBtwPts(rx, ry, ax, ay) < rr+ ar) { 
          //check distance btw cursor and mouse 
          destroyAsteroids(i);

          pewCollision = false;
          break; // exit the loop as we have destroyed one asteroid
        }
      
      } 

  } 

  //text ---------------------------------------------

  if (textAlpha >= 0) {
    ctx!.textAlign = "center";
    ctx!.textBaseline = "middle";
    ctx!.fillStyle = "rgba(255, 205, 40, " + textAlpha + ")";
    ctx!.font = "small-caps " + TEXT_SIZE + "px Josefin Sans";
    ctx!.fillText(text, canv.width / 2, canv.height * 0.75);
    textAlpha -= (1.0 / TEXT_FADE / FPS);
  } 

  //draw the score
  ctx!.textAlign = "left";
  ctx!.textBaseline = "middle";
  ctx!.fillStyle = "rgba(255, 205, 40)";
  ctx!.font = 30 + "px Poppins";
  const scoreTxt = "Score: " + score.toString() //turn into string 
  ctx!.fillText(scoreTxt, canv.width - PEW_SIZE* 4.75 , PEW_SIZE);

  //draw timer
  let lowTime = false; 
  if (timer.timer <= 4 ){ 
    lowTime = true; 
  }
  ctx!.textAlign = "left";
  ctx!.textBaseline = "middle";
  ctx!.fillStyle = lowTime ? "red" : "rgba(255, 205, 40)";
  ctx!.font = 20 + "px Poppins";
  let timerTxt = "Time: " + timer.timer.toString(); 
  if (timer.timer === 0){ 
    timerTxt = "Timeout!"
  }
  ctx!.fillText(timerTxt, PEW_SIZE / 2, PEW_SIZE);


  
  //draw asteroids --------------------------------------
  // let x, y, r, a, vert, offs; 
  for (let i = 0; i < roids.length; i++){ 

    ctx!.strokeStyle = "slategrey"; 
    ctx!.lineWidth = PEW_SIZE / 20; 

    //get the asteroid properties 
    const {x, y, r, a, vert, offs} = roids[i]; 

    //move the asteroid
    roids[i].x += roids[i].xv; 
    roids[i].y += roids[i].yv; 

    const rotate = Math.atan2(roids[i].yv, roids[i].xv) + (90 * Math.PI/180) //find angle + 1.5 to adjust angle facing

    ctx!.save();
    ctx!.translate(roids[i].x, roids[i].y); //translate on roid's x and y position 
    ctx!.rotate(rotate); //rotate to roid rotation
    ctx!.drawImage(mouse, -r, -r, r * 2, r * 2);
    ctx!.restore();

    //handle edge of screen 
    //if go off screen, it will appear on the other side 
    //x direction 
    if(roids[i].x < 0 - roids[i].r) { 
      roids[i].x = canv.width + roids[i].r; 
    } else if (roids[i].x > canv.width + roids[i].r) { 
      roids[i].x = 0 - roids[i].r; 
    }

    //y direction 
    if(roids[i].y < 0 - roids[i].r) { 
      roids[i].y = canv.height + roids[i].r; 
    } else if (roids[i].y > canv.height + roids[i].r) { 
      roids[i].y = 0 - roids[i].r; 
    }

    if(SHOW_BOUNDING) { 
      ctx!.strokeStyle = "lime"; 
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2, false); 
      ctx!.stroke(); 
    }
  }
  
}

