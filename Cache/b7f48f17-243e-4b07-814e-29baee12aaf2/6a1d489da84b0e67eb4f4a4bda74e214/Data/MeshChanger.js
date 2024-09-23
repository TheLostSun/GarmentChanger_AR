//@input Asset.RenderMesh[] maleMeshes
//@input Asset.RenderMesh[] femaleMeshes
//@input Asset.Material[] maleMaterials
//@input Asset.Material[] femaleMaterials
//@input SceneObject meshObject
//@input bool isMale
var currentMeshIndex=0;

function changeMesh(){
    if(script.maleMeshes.length===0&&script.femaleMeshes.length===0){
        print("Meshes not assigned.");
        return;
    }
    
    var meshVisual=script.meshObject.getComponent("Component.MeshVisual");
    if(meshVisual){
        if(script.isMale){
            meshVisual.mesh=script.maleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.maleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex+1)%script.maleMeshes.length;
        }
        else{
            meshVisual.mesh=script.femaleMeshes[currentMeshIndex];
            meshVisual.mainMaterial=script.femaleMaterials[currentMeshIndex];
            currentMeshIndex=(currentMeshIndex+1)%script.femaleMeshes.length;
        }
        
    }
    else{
        print("Mesh Visual component not found on mesh Object.");
    }
}

var touchComponent=script.meshObject.getComponent("Component.TouchComponent");
if(!touchComponent){
    touchComponent=script.meshObject.createComponent("Component.TouchComponent");
}

if(touchComponent){
    touchComponent.onTap.add(changeMesh);
}
else{
    print("Failed to crete or retrieve the Touch Component");
}