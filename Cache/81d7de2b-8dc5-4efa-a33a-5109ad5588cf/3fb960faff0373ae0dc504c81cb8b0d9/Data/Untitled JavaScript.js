// @input Component.ScreenCapture screenCapture
// @input Component.Button button

function takeSnapshot() {
    // Set the output path for the captured image
    var path = "snapshot.png";

    // Capture the screen
    screenCapture.capture().then(function (image) {
        // Save the image
        image.save(path).then(function () {
            print("Image saved at: " + path);
        }).catch(function (error) {
            print("Error saving image: " + error);
        });
    });
}

// Connect the button press event to the snapshot function
script.button.onClick.add(takeSnapshot);
