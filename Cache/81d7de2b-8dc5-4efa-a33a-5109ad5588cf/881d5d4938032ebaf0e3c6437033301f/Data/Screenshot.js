//@input SceneObject buttonPress

// Get the button and set up the touch event
var touchComponent=script.buttonPress.createComponent("Component.TouchComponent");

function onButtonTap(event) {
    // Capture the screenshot
    print("ScrenshotTook");
    var screenshot = Screen.capture();
    // You can do something with the screenshot here, like saving or processing it
}

touchComponent.onTap.add(onButtonTap);
// Bind the touch event to the button
