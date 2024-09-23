//@input Asset.RenderMesh[] maleMeshes
//@input Asset.RenderMesh[] femaleMeshes
//@input Asset.Material[] maleMaterials
//@input Asset.Material[] femaleMaterials
//@input SceneObject leftButton
//@input SceneObject rightButton
//@input SceneObject meshObject
//@input bool isMale
//@input Component.Text BrandLower;
var currentMeshIndex=0;
var lowerMaleBrands=["","Allen Solly","Mark Spencer","Levis"];
var lowerFemaleBrands=["","Pepe","Spykar","Aurelia","Biba","Libas"];

function moveRight(){
    var meshVisual=script.meshObject.getComponent("Component.MeshVisual");
    if(meshVisual){
       if(script.isMale){
            meshVisual.mesh=script.maleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.maleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex+1)%script.maleMeshes.length;
            script.BrandLower.text=lowerMaleBrands[currentMeshIndex];        
        }
        else{
            meshVisual.mesh=script.femaleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.femaleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex+1)%script.femaleMeshes.length;
            script.BrandLower.text=lowerFemaleBrands[currentMeshIndex];        
        }
        
    }
    else{
        print("Mesh Visual component not found on mesh Object.");
    } 
}

function moveLeft(){
    var meshVisual=script.meshObject.getComponent("Component.MeshVisual");
    if(meshVisual){
       if(script.isMale){
            meshVisual.mesh=script.maleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.maleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex-1)%script.maleMeshes.length;
            script.BrandLower.text=lowerMaleBrands[currentMeshIndex];
        }
        else{
            meshVisual.mesh=script.femaleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.femaleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex-1)%script.femaleMeshes.length;
            script.BrandLower.text=lowerFemaleBrands[currentMeshIndex];
        }
        
    }
    else{
        print("Mesh Visual component not found on mesh Object.");
    } 
}


var rightTouchComponent=script.rightButton.getComponent("Component.TouchComponent");
    if(!rightTouchComponent){
    rightTouchComponent=script.rightButton.createComponent("Component.TouchComponent");
    }

    if(rightTouchComponent){
        rightTouchComponent.onTap.add(moveRight);
    }

var leftTouchComponent=script.leftButton.getComponent("Component.TouchComponent");
    if(!leftTouchComponent){
    leftTouchComponent=script.leftButton.createComponent("Component.TouchComponent");
    }

    if(leftTouchComponent){
        leftTouchComponent.onTap.add(moveLeft);
    }
