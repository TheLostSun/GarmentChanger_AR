// -----JS CODE-----
// -----JS CODE-----
// Lens Studio Script: Circular Image Arrangement
// Author: [Devcrew.io]
// Description: This script arranges user-provided SceneObjects in a circular pattern and provides various customization options.

// Attach this script to an empty object in the scene

//@input bool isHalfCircle = false // Bool to hide lower half elements
//@input bool enableLogging = false // Bool to enable or disable logging
//@ui {"widget":"separator"}
//@input int imageCount = 5 {"widget":"slider", "min":5, "max":20, "step":1} // Number of images to use
//@input float imageSize = 1.0 {"widget":"slider", "min":1, "max":100.0, "step":0.1} // Slider to change the size of images
//@input int radius = 70.0 {"widget":"slider", "min":10, "max":200, "step":1}
//@input int rotationSpeed = 50.0 {"widget":"slider", "min":10, "max":200, "step":1}
//@input float snapSpeed = 10.0 {"widget":"slider", "min":5, "max":30, "step":1} // instant move or tap on image move speed
//@ui {"widget":"separator"}
//@ui {"widget":"group_start", "label":"Objects to rotate"}
//@input SceneObject[] images // Array of images to arrange in a circle
//@ui {"widget":"group_end"}
//@ui {"widget":"separator"}
//@input bool enableApiCall = false // Bool to enable API call on image click
//@ui {"showIf": "enableApiCall", "widget":"group_start", "label":"API Settings"}
//@input Component.ScriptComponent apiScript {"showIf": "enableApiCall"} // API script to be called
//@input string[] apiFunctionNames {"showIf": "enableApiCall"} // Function names to be called based on image index
//@ui {"showIf": "enableApiCall", "widget":"group_end"}

global.touchSystem.touchBlocking = true;

// Validate the image count
if (!validateImageCount(script.imageCount, script.images.length)) {
    return;
}

// Ensure apiFunctionNames length matches the number of images
if (script.enableApiCall && script.apiFunctionNames.length < script.imageCount) {
    printError("The number of API function names must match the number of images.");
    return;
}

var initialRotation = 0;
var isDragging = false;
var lastTouchPos = new vec2(0, 0);
var targetRotation = 0;
var snapping = false;
var angleOffset = 0;
var isTapped = false;

// Validate the image count
function validateImageCount(imageCount, arrayLength) {
    if (imageCount > arrayLength) {
        printError("The number of images from the slider exceeds the number of provided images.");
        return false;
    }
    if (imageCount < 5) {
        printError("There must be at least 5 images.");
        return false;
    }
   
    return true;
}

// Print error messages
function printError(message) {
    print("Script cannot run: " + message);
    if (script.enableLogging) {
        print(message);
    }
}

// Function to arrange images in a circular pattern
function arrangeImages() {
    var numImages = script.imageCount;
    var angleStep = (2 * Math.PI) / numImages;

    // Adjust angleStep for half circle
    if (script.isHalfCircle) {
        angleStep = Math.PI / numImages; // Spread images over the upper half only
    }

    for (var i = 0; i < numImages; i++) {
        var angle = i * angleStep + initialRotation;
        var x = Math.cos(angle) * script.radius;
        var y = Math.sin(angle) * script.radius;

        var imageTransform = script.images[i].getTransform();

        // Adjust position for half circle wrap-around effect
        if (script.isHalfCircle && y < 0) {
            angle += Math.PI; // Wrap around to the lower half
            x = Math.cos(angle) * script.radius;
            y = Math.sin(angle) * script.radius;
        }

        imageTransform.setLocalPosition(new vec3(x, y, -141.5568));
        imageTransform.setLocalScale(new vec3(script.imageSize, script.imageSize, script.imageSize)); // Set the size of the images
        
       //  var optimalSize = calculateOptimalImageSize(angleStep, script.radius);
       //  imageTransform.setLocalScale(new vec3(optimalSize, optimalSize, optimalSize));

        // Hide elements in the lower half if isHalfCircle is true
        script.images[i].enabled = !script.isHalfCircle || y >= 0;
    }
}

function calculateOptimalImageSize(angleStep, radius) {
    // Simple formula to prevent overlap, adjust as needed
    return (radius * angleStep) / Math.PI;
}

// Update rotation based on user input
function onTouchStart(eventData) {
    if (script.enableLogging) print("Touch start");
    lastTouchPos = eventData.getTouchPosition();
}

function onTouchMove(eventData) {
    if (!isTapped) {
        isDragging = true;
        snapping = false;
        if (isDragging) {
            if (script.enableLogging) print("Touch move");
            var currentTouchPos = eventData.getTouchPosition();
            var delta = currentTouchPos.x - lastTouchPos.x;
            initialRotation += delta * script.rotationSpeed * (Math.PI / 180); // Convert degrees to radians
            lastTouchPos = currentTouchPos;
            arrangeImages();
        }
    }
}

function onTouchEnd(eventData) {
    if (!isTapped) {
        if (script.enableLogging) print("Touch end");
        isDragging = false;
        snapToNearestImage();
    }
}

// Snap to the nearest image
function snapToNearestImage() {
    var numImages = script.imageCount;
    var angleStep = (2 * Math.PI) / numImages;

    // Adjust angleStep for half circle
    if (script.isHalfCircle) {
        angleStep = Math.PI / numImages; // Spread images over the upper half only
    }

    var adjustedRotation = initialRotation - angleOffset;
    var closestIndex = Math.round(adjustedRotation / angleStep);
    targetRotation = closestIndex * angleStep + angleOffset;
    snapping = true;
}

// Smooth snapping animation
function update(eventData) {
    if (snapping) {
        var deltaRotation = targetRotation - initialRotation;
        if (Math.abs(deltaRotation) < 0.01) { // Threshold for snapping completion
            initialRotation = targetRotation;
            snapping = false;
        } else {
            initialRotation += deltaRotation * script.snapSpeed * getDeltaTime();
        }
        arrangeImages();
        isTapped = false;
    }
}

// Handle image click event
function onImageClick(image) {
    if (script.enableLogging) print("Tapped");
    isTapped = true;
    var numImages = script.imageCount;
    var angleStep = (2 * Math.PI) / numImages;
    var centerAngle = Math.PI / 2; // Top center position

    // Adjust angleStep for half circle
    if (script.isHalfCircle) {
        angleStep = Math.PI / numImages; // Spread images over the upper half only
    }

    for (var i = 0; i < numImages; i++) {
        if (script.images[i] === image) {
            var clickedIndex = i;
            targetRotation = centerAngle - clickedIndex * angleStep;
            snapping = true;
            if (script.enableLogging) print("Snapping to image " + i);

            // Call the API function if enabled
            if (script.enableApiCall && script.apiScript && script.apiFunctionNames.length > i) {
                var functionName = script.apiFunctionNames[i];
                if (typeof script.apiScript.api[functionName] === "function") {
                    script.apiScript.api[functionName]();
                } else {
                    printError("Function " + functionName + " is not defined in the API script.");
                }
            }
            break;
        }
    }
}

// Register touch event handlers
function registerTouchEvents() {
    var touchComponent = script.createEvent("TouchStartEvent");
    touchComponent.bind(onTouchStart);

    var touchMoveComponent = script.createEvent("TouchMoveEvent");
    touchMoveComponent.bind(onTouchMove);

    var touchEndComponent = script.createEvent("TouchEndEvent");
    touchEndComponent.bind(onTouchEnd);
}

// Register update event
function registerUpdateEvent() {
    var updateEvent = script.createEvent("UpdateEvent");
    updateEvent.bind(update);
}

// Register click event for each image
function registerImageClickEvents() {
    for (var i = 0; i < script.imageCount; i++) {
        (function(image) {
            image.getComponent("Component.InteractionComponent").onTap.add(function() {
                onImageClick(image);
            });
        })(script.images[i]);
    }
}

// Initial arrangement of images
function setInitialRotation() {
    var numImages = script.imageCount;
    var angleStep = (2 * Math.PI) / numImages;

    // Adjust angleStep for half circle
    if (script.isHalfCircle) {
        angleStep = Math.PI / numImages; // Spread images over the upper half only
    }

    switch (numImages) {
         case 20:
            angleOffset = -angleStep / 45 + 0.33; // Adjust to center an image at the top
            break;
        case 19:
            angleOffset = -angleStep / 45 + 0.3; // Adjust to center an image at the top
            break;
         case 18:
            angleOffset = -angleStep / 45 + 0.2; // Adjust to center an image at the top
            break;
         case 17:
            angleOffset = -angleStep / 45 + 0.1; // Adjust to center an image at the top
            break;
         case 16:
            angleOffset = -angleStep / 15; // Adjust to center an image at the top
            break;
        case 15:
            angleOffset = -angleStep / 3.6; // Adjust to center an image at the top
            break;
        case 14:
            angleOffset = -angleStep / 2; // Adjust to center an image at the top
            break;
         case 13:
            angleOffset = -angleStep / 1.4; // Adjust to center an image at the top
            break;
        case 10:
            angleOffset = -angleStep / 2.2; // Adjust to center an image at the top
            break;
         case 11:
            angleOffset = -angleStep / 0.8; // Adjust to center an image at the top
            break;
        case 9:
            angleOffset = -angleStep / 1.4; // Adjust to center an image at the top
            break;
        case 7:
            angleOffset = -angleStep / -1.4; // Adjust to center an image at the top
            break;
        case 6:
            angleOffset = -angleStep / 2; // Adjust to center an image at the top
            break;
        case 5:
            angleOffset = -angleStep / 1.4; // Adjust to center an image at the top
            break;
        default:
            angleOffset = -angleStep / 1; // Adjust to center an image at the top
    }
    initialRotation = angleOffset;
}

// Initial arrangement for half circle
function setInitialRotationHalf() {
    var numImages = script.imageCount;
    var angleStep = (2 * Math.PI) / numImages;

    // Adjust angleStep for half circle
    if (script.isHalfCircle) {
        angleStep = Math.PI / (numImages - 1); // Spread images over the upper half only
    }

    switch (numImages) {
        case 7:
            angleOffset = -angleStep / 2.2; // Adjust to center an image at the top
            break;
        case 6:
            angleOffset = -angleStep / 2.3; // Adjust to center an image at the top
            break;
        case 5:
            angleOffset = -angleStep / 2.5; // Adjust to center an image at the top
            break;
        default:
            angleOffset = -angleStep / 2; // Adjust to center an image at the top
    } 
    
    initialRotation = angleOffset;
}

// Call initial functions
if (script.isHalfCircle) {
    setInitialRotationHalf();
} else {
    setInitialRotation();
}
arrangeImages();
registerTouchEvents();
registerUpdateEvent();
registerImageClickEvents();
