//@input SceneObject maleButton
//@input SceneObject femaleButton
//@input SceneObject upper
//@input SceneObject lower
//@input SceneObject selectedCharacterText
//@input SceneObject upperGameObject
//@input SceneObject lowerLowerGameObject

script.upper.enabled=false;
script.lower.enabled=false;
function genderSpecifier(isMale) {
    
    script.upper.getComponent("Component.ScriptComponent").isMale = isMale;
    script.lower.getComponent("Component.ScriptComponent").isMale = isMale;
    script.selectedCharacterText.getComponent("Component.Text").text=isMale?"Male":"Female";
}

// Set up touch component for male button
var maleTouchComponent = script.maleButton.getComponent("Component.TouchComponent");
if (!maleTouchComponent) {
    maleTouchComponent = script.maleButton.createComponent("Component.TouchComponent");
}

if (maleTouchComponent) {
    maleTouchComponent.onTap.add(function() {
        genderSpecifier(true);
    });
} else {
    print("Failed to create or retrieve the Touch Component for male button");
}

// Set up touch component for female button
var femaleTouchComponent = script.femaleButton.getComponent("Component.TouchComponent");
if (!femaleTouchComponent) {
    femaleTouchComponent = script.femaleButton.createComponent("Component.TouchComponent");
}

if (femaleTouchComponent) {
    femaleTouchComponent.onTap.add(function() {
        genderSpecifier(false);
    });
} else {
    print("Failed to create or retrieve the Touch Component for female button");
}
