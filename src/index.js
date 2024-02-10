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
  ShadowGenerator,
  CubeTexture
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF/2.0";
import "@babylonjs/core/Helpers/sceneHelpers";
import animatioOne from "../src/assets/pey_finished_0.gltf";
import animatioTwo from "../src/assets/pey_finished_1.gltf";
import animatioThree from "../src/assets/pey_finished_2.gltf";
import env from "../src/assets/environment.env";
import texture from "../src/assets/baked_texture_bw_img_blured_baked.png"
import charToneZero from "../src/assets/gltfs/pey_finished_2_tone_0.0.gltf"
import charToneOne from "../src/assets/gltfs/pey_finished_2_tone_0.1.gltf"
import charToneTwo from "../src/assets/gltfs/pey_finished_2_tone_0.2.gltf"
import charToneThree from "../src/assets/gltfs/pey_finished_2_tone_0.3.gltf"
import charToneFour from "../src/assets/gltfs/pey_finished_2_tone_0.4.gltf"
import charTonefive from "../src/assets/gltfs/pey_finished_2_tone_0.5.gltf"

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", Math.PI * 0.5, Math.PI * 0.5, 8, new Vector3(0, 1.2, 0));
camera.attachControl(canvas, true);

// Adjust camera properties
camera.inertia = 0.8;
camera.angularSensibility = 1000;
camera.lowerRadiusLimit = .1;
camera.upperRadiusLimit = 10;
camera.wheelPrecision = 30;
camera.minZ = 0.01; // Near clipping plane

const hdrTexture = CubeTexture.CreateFromPrefilteredData(env, scene);
scene.environmentTexture = hdrTexture;

scene.createDefaultEnvironment({
  // Change ground and skybox colors
  // groundColor: new Color3(0.5, 0.5, 0.5), // Grey color for the ground
  skyboxColor: new Color3(0.8, 0.8, 0.8), // Light grey for the skybox
  groundColor: Color3.Black,
  // diffuseColor: Color3.White


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
directionalLight.diffuse = new Color3(1, 1, 1); // White light
directionalLight.specular = new Color3(1, 1, 1); // White specular highlights
directionalLight.intensity = 1;

// Create a shadow generator
// const shadowGenerator = new ShadowGenerator(1024, directionalLight);
// shadowGenerator.useBlurExponentialShadowMap = true;
// shadowGenerator.blurKernel = 32;
// shadowGenerator.useContactHardeningShadow = true;
// shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_LOW;
var shadowGenerator = new ShadowGenerator(1024, directionalLight);
//shadowGenerator.bias = 0.0001;
directionalLight.shadowMaxZ = 130;
directionalLight.shadowMinZ = 10;
shadowGenerator.useContactHardeningShadow = true;
shadowGenerator.setDarkness(0.5);

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});

// Object to hold the imported mesh references
const charTones = {
  "0.0": null,
  "0.1": null,
  "0.2": null,
  "0.3": null,
  "0.4": null,
  "0.5": null,
};

// Counter to track loaded meshes
let loadedMeshesCount = 0;
const totalMeshesToLoad = 6; // Adjust based on the number of meshes you're loading

function importMesh(char, toneValue) {
  SceneLoader.ImportMeshAsync("", char, null, scene).then((chr) => {
    charTones[toneValue] = chr.meshes;
    
    chr.meshes.forEach(mesh => {
      mesh.isVisible = false;
      mesh.position.y += 0.06;
      shadowGenerator.getShadowMap().renderList.push(mesh);
      mesh.receiveShadows = true;
    });

    // Increment the counter and check if all meshes are loaded
    loadedMeshesCount++;
    if (loadedMeshesCount === totalMeshesToLoad) {
      // All meshes are loaded, now update visibility based on the initial slider value
      updateMeshVisibility(slider.value);
    }
  });
}

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

// Import meshes with their corresponding tone values
importMesh(charToneZero, "0.0");
importMesh(charToneOne, "0.1");
importMesh(charToneTwo, "0.2");
importMesh(charToneThree, "0.3");
importMesh(charToneFour, "0.4");
importMesh(charTonefive, "0.5");

// Function to update mesh visibility based on slider value
function updateMeshVisibility(value) {
  const toneValue = (value * 0.1).toFixed(1).toString();
  Object.keys(charTones).forEach(key => {
    if(charTones[key]) {
      charTones[key].forEach(mesh => {
        mesh.isVisible = key === toneValue;
      });
    }
  });
}

// Slider event listener
const slider = document.getElementById("debugSlider");
const sliderValueDisplay = document.getElementById("sliderValue");
slider.addEventListener("input", function() {
  const value = this.value;
  const toneValue = (value * 0.1).toFixed(1);
  sliderValueDisplay.textContent = toneValue;
  updateMeshVisibility(value);
});

// Initially set the visibility based on the default slider value
updateMeshVisibility(slider.value);

