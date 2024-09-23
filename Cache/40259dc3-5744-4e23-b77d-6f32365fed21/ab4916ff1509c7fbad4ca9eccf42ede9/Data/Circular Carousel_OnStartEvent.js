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
script.createEvent("OnStartEvent").bind(function() { require("Circular Carousel_wrapped")(script)})