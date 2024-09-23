//@input Asset.RenderMesh[] maleMeshes
//@input Asset.RenderMesh[] femaleMeshes
//@input Asset.Material[] maleMaterials
//@input Asset.Material[] femaleMaterials
//@input SceneObject leftButton
//@input SceneObject rightButton
//@input SceneObject meshObject
//@input Component.Text BrandUpper
//@input bool isMale

var currentMeshIndex = 0;
var upperMaleBrands = ["Wrangler", "Lee Cooper", "Gucci", "Allen Solly", "Peter England", "Van Heusen"];
var upperFemaleBrands = [ "W", "U.S. Polo", "Mark Spencer", "Biba", "Aurelia", "Tommy Hilfiger", "Libas", "Zara"];

function updateMesh() {
    var meshVisual = script.meshObject.getComponent("Component.ClothVisual");
    if (meshVisual) {
        if (script.isMale) {
            meshVisual.mesh = script.maleMeshes[currentMeshIndex];
            meshVisual.mainMaterial = script.maleMaterials[currentMeshIndex];
            script.BrandUpper.text = upperMaleBrands[currentMeshIndex];
        } else {
            meshVisual.mesh = script.femaleMeshes[currentMeshIndex];
            meshVisual.mainMaterial = script.femaleMaterials[currentMeshIndex];
            script.BrandUpper.text = upperFemaleBrands[currentMeshIndex];
        }
    } else {
        print("Mesh Visual component not found on mesh Object.");
    }
}

function moveRight() {
    currentMeshIndex = (currentMeshIndex + 1) % (script.isMale ? script.maleMeshes.length : script.femaleMeshes.length);
    updateMesh();
}

function moveLeft() {
    currentMeshIndex = (currentMeshIndex - 1 + (script.isMale ? script.maleMeshes.length : script.femaleMeshes.length)) % (script.isMale ? script.maleMeshes.length : script.femaleMeshes.length);
    updateMesh();
}

// Initialize touch components
var rightTouchComponent = script.rightButton.getComponent("Component.TouchComponent");
if (!rightTouchComponent) {
    rightTouchComponent = script.rightButton.createComponent("Component.TouchComponent");
}
if (rightTouchComponent) {
    rightTouchComponent.onTap.add(moveRight);
}

var leftTouchComponent = script.leftButton.getComponent("Component.TouchComponent");
if (!leftTouchComponent) {
    leftTouchComponent = script.leftButton.createComponent("Component.TouchComponent");
}
if (leftTouchComponent) {
    leftTouchComponent.onTap.add(moveLeft);
}

// Initial update to set the first mesh
updateMesh();
