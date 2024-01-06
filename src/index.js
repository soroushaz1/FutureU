import {
  Engine,
  Scene,
  Vector3,
  SceneLoader,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Texture,
  Color3,
  Color4,
  DirectionalLight,
  ShadowGenerator
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF/2.0";
import "@babylonjs/core/Helpers/sceneHelpers";
import character from "../src/assets/pey_finished_1.gltf";
import env from "../src/assets/environment.env";
import texture from "../src/assets/baked_texture_painted_blurred_with_hair_pey.png"

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", Math.PI * 0.5, Math.PI * 0.5, 4, new Vector3(0, 1.2, 0));
camera.attachControl(canvas, true);

// Adjust camera properties
camera.inertia = 0.8;
camera.angularSensibility = 1000;
camera.lowerRadiusLimit = 2;
camera.upperRadiusLimit = 10;
camera.wheelPrecision = 30;

scene.createDefaultEnvironment({
  // Change ground and skybox colors
  // groundColor: new Color3(0.5, 0.5, 0.5), // Grey color for the ground
  skyboxColor: new Color3(0.8, 0.8, 0.8), // Light grey for the skybox
  groundColor: Color3.Black
});

function createCylinder(name, diameter, height, position, scene) {
  const cylinder = MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 64 }, scene);
  cylinder.position = position;

  // Create and assign a standard material to the cylinder
  let cylinderMaterial = new StandardMaterial(name + "Mat", scene);
  cylinderMaterial.diffuseColor = new Color3(1, 1, 1); // Default color, can be changed
  cylinder.material = cylinderMaterial;

  // Enable the cylinder to receive shadows
  cylinder.receiveShadows = true;

  return cylinder;
}

createCylinder("cylinder_top", 2, 0.2, new Vector3(0, 0, 0), scene);
createCylinder("cylinder_bottom", 3, 0.1, new Vector3(0, 0, 0), scene);

// Adding a directional light
const lightDirection = new Vector3(-1, -2, -1); // Adjust this direction as needed
const directionalLight = new DirectionalLight("dir01", lightDirection, scene);
directionalLight.position = new Vector3(20, 40, 20); // Position can be adjusted

// Create a shadow generator
const shadowGenerator = new ShadowGenerator(1024, directionalLight);
shadowGenerator.useBlurExponentialShadowMap = true;
shadowGenerator.blurKernel = 32;

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});

SceneLoader.ImportMeshAsync("", character, null, scene).then((chr) => {
  // Iterate over each mesh in the chr object
  chr.meshes.forEach(mesh => {
    mesh.position.y += 0.06;  // Add 1 to the Y position of each mesh, adjust this value as needed
    // Configure the meshes to cast shadows
    shadowGenerator.getShadowMap().renderList.push(mesh);
    mesh.receiveShadows = true;
  });
  // Update the texture of the main mesh (index 1)
  updateCharacterTexture(chr.meshes[1], texture);
});

function updateCharacterTexture(mesh, texturePath) {
  if (mesh.material) {
    // Append a timestamp to the texture path to bypass cache
    let newTexturePath = texturePath + "?v=" + new Date().getTime();
    let newTexture = new Texture(newTexturePath, scene);

    newTexture.uScale = -1.0;
    newTexture.vScale = -1.0;

    // Check if the material is a PBRMaterial and has an albedoTexture
    if (mesh.material instanceof PBRMaterial && mesh.material.albedoTexture) {
      mesh.material.albedoTexture = newTexture;
    }
  }
}
