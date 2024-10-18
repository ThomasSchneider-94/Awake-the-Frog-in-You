const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Select the game over panel and retry button
const gameOverPanel = document.getElementById('gameOverPanel');
const finalScoreElement = document.getElementById('finalScore');
const retryButton = document.getElementById('retryButton');

// Define game properties
let frog = { x: 50, y: canvas.height / 2, radius: 20, hp: 3, score: 0 }; // Renamed player to Frog
let insects = []; // Renamed enemies to Insects
let foodItems = []; // Array to store food objects
let keys = {};
let isGameOver = false;
let isExpanding = false; // Track if Tongue is expanding
let canExpand = true;    // Track if player can trigger the Tongue
let tongue = { width: 0, maxWidth: canvas.width, height: 15 }; // Change height to 15
const TONGUE_EXPANSION_SPEED = 10; // Speed at which the Tongue expands and contracts

// Handle key presses
window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
});

window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
});

// Trigger the expanding Tongue
function expandTongue() {
    if (canExpand) {
        isExpanding = true;
        tongue.width = 0;
        canExpand = false; // Disable further expansions until it fully contracts
    }
}

// Update game state
function update() {
    if (isGameOver) return; // Stop updating if the game is over

    // Move insects and check collisions
    for (let i = 0; i < insects.length; i++) {
        insects[i].x -= 2;

        // Check if insect reaches the left side (frog loses health)
        if (insects[i].x < 0) {
            frog.hp -= 1;
            insects.splice(i, 1); // Remove insect
            i--;
        }

        // Check for collisions with expanding Tongue
        if (isExpanding && tongue.width > 0) {
            let tongueRightEdge = frog.x + frog.radius + tongue.width; // Right edge of the Tongue

            // Check if the Tongue collides with the current insect
            if (tongueRightEdge > insects[i].x && 
                tongueRightEdge < insects[i].x + insects[i].size &&  // Insect is within the Tongue's width
                frog.y - tongue.height / 2 < insects[i].y + insects[i].size && // Tongue top < insect bottom
                frog.y + tongue.height / 2 > insects[i].y) { // Tongue bottom > insect top
                
                // Insect is hit by the expanding Tongue
                frog.score += 10;

                // Spawn food at the insect's position with the same size
                foodItems.push({ 
                    x: insects[i].x, 
                    y: insects[i].y, 
                    size: insects[i].size, 
                    isReturning: true,
                    yOffset: (frog.y - tongue.height / 2) // Align food with the Tongue's y-coordinate
                });

                insects.splice(i, 1); // Remove insect
                i--;

                // Stop expanding the Tongue after a collision
                isExpanding = false;
            }
        }
    }

    // Move frog in 2D using ZQSD and Arrow Keys
    if ((keys['ArrowUp'] || keys['KeyZ']) && frog.y - frog.radius > 0) frog.y -= 3; // Up (Z/ArrowUp)
    if ((keys['ArrowDown'] || keys['KeyS']) && frog.y + frog.radius < canvas.height) frog.y += 3; // Down (S/ArrowDown)
    if ((keys['ArrowLeft'] || keys['KeyQ']) && frog.x - frog.radius > 0) frog.x -= 3; // Left (Q/ArrowLeft)
    if ((keys['ArrowRight'] || keys['KeyD']) && frog.x + frog.radius < canvas.width) frog.x += 3; // Right (D/ArrowRight)

    // Trigger Tongue expansion when spacebar is pressed
    if (keys['Space'] && canExpand) {
        expandTongue();
    }

    // Handle Tongue expansion and contraction
    if (isExpanding) {
        tongue.width += TONGUE_EXPANSION_SPEED; // Expand the Tongue

        let tongueRightEdge = frog.x + frog.radius + tongue.width; // Right edge of the Tongue

        // Stop expanding if the Tongue hits the right edge of the screen
        if (tongueRightEdge >= canvas.width) {
            isExpanding = false; // Start retracting the Tongue if it reaches the right edge
        }
    } else if (!canExpand && tongue.width > 0) {
        tongue.width -= TONGUE_EXPANSION_SPEED; // Contract the Tongue
        if (tongue.width <= 0) {
            canExpand = true; // Once fully retracted, allow expansion again
        }
    }

    // Handle food returning to frog with the Tongue
    for (let i = 0; i < foodItems.length; i++) {
        let food = foodItems[i];
        if (food.isReturning) {
            // Move the food at the same speed as the Tongue's contraction
            let tongueRightEdge = frog.x + frog.radius + tongue.width; // Current right edge of the Tongue

            // Align food's y-coordinate with the Tongue
            food.y = frog.y - tongue.height / 2; // Set food y to align with the Tongue

            // Keep the food aligned with the Tongue's edge as it contracts
            food.x = tongueRightEdge - food.size; 

            // Once the food reaches the frog, consume it
            if (food.x <= frog.x + frog.radius) {
                // If food reaches the frog, consume it
                foodItems.splice(i, 1); // Remove food
                i--; // No score increase for food
            }
        }
    }

    // Check if game over
    if (frog.hp <= 0) {
        triggerGameOver();
    }
}

// Draw everything on canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frog (using the image)
    ctx.drawImage(frogImage, frog.x - frog.radius, frog.y - frog.radius, frog.radius * 2, frog.radius * 2);

    // Draw expanding Tongue if active
    if (tongue.width > 0) {
        ctx.fillStyle = 'pink';
        ctx.fillRect(frog.x + frog.radius, frog.y - tongue.height / 2, tongue.width, tongue.height);
    }

    // Draw insects (using the mosquito image)
    for (let insect of insects) {
        ctx.drawImage(mosquitoImage, insect.x, insect.y, insect.size, insect.size);
    }

    // Draw food (using the dead mosquito image)
    for (let food of foodItems) {
        ctx.drawImage(deadMosquitoImage, food.x, food.y, food.size, food.size); // Use dead mosquito image
    }

    // Draw score and health
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + frog.score, 10, 20);
    ctx.fillText('HP: ' + frog.hp, 10, 40);
}



// Spawn insects
function spawnInsect() { // Renamed function to spawn Insect
    let size = 30;
    let y = Math.random() * (canvas.height - size);
    insects.push({ x: canvas.width, y: y, size: size }); // Add insect
}

// Trigger the game over state
function triggerGameOver() {
    isGameOver = true;
    
    // Show the game over panel
    gameOverPanel.style.display = 'block';
    finalScoreElement.textContent = frog.score; // Display the frog's final score

    // Stop the game loop (pause updates)
}

// Main game loop
function gameLoop() {
    update();
    draw();
    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Retry the game when the retry button is clicked
retryButton.addEventListener('click', function() {
    // Reset game state
    frog = { x: 50, y: canvas.height / 2, radius: 20, hp: 3, score: 0 }; // Reset frog
    insects = []; // Clear insects
    foodItems = []; // Clear food items
    isGameOver = false;

    // Hide the game over panel
    gameOverPanel.style.display = 'none';

    // Restart the game loop
    gameLoop();
});


// Load images
const frogImage = new Image();
frogImage.src = 'Frog.png'; // Path to the frog image

const mosquitoImage = new Image();
mosquitoImage.src = 'Mosquito.png'; // Path to the mosquito image

const deadMosquitoImage = new Image(); // Add this line
deadMosquitoImage.src = 'DeadMosquito.png'; // Path to the dead mosquito image

let imagesLoaded = 0;

frogImage.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 3) startGame(); // Update the count to 3
};

mosquitoImage.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 3) startGame(); // Update the count to 3
};

deadMosquitoImage.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 3) startGame(); // Update the count to 3
};

function startGame() {
    // Start the game loop
    gameLoop();
    setInterval(spawnInsect, 2000); // Spawn an insect every 2 seconds
}
