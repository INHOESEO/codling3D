import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Scene 설정
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Camera 설정
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer 설정
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Controls 설정
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const getBasePath = () => {
    // 깃허브 페이지인 경우 저장소 이름을 포함한 경로 반환
    if (window.location.hostname.includes('github.io')) {
        return '/codling3d';  // 저장소 이름은 소문자로
    }
    // 로컬 환경인 경우 상대 경로 사용
    return '.';
};

const basePath = getBasePath();

// 텍스처와 머터리얼 생성
const loadTextures = () => {
    const textureLoader = new THREE.TextureLoader();
    const texturePromises = [
        textureLoader.loadAsync(`${basePath}/img/green-apple3d/apple02/apple02_baseColor.png`),
        textureLoader.loadAsync(`${basePath}/img/green-apple3d/apple02/apple02_normal.png`),
        textureLoader.loadAsync(`${basePath}/img/green-apple3d/apple02/apple02_metallic.png`),
        textureLoader.loadAsync(`${basePath}/img/green-apple3d/apple02/apple02_roughness.png`)
    ];

    return Promise.all(texturePromises);
};

// 모든 리소스 로딩을 관리
async function loadModel() {
    try {
        document.getElementById("loading").style.display = "block";
        
        const [baseColorMap, normalMap, metallicMap, roughnessMap] = await loadTextures();
        
        const material = new THREE.MeshStandardMaterial({
            map: baseColorMap,
            normalMap: normalMap,
            metalnessMap: metallicMap,
            roughnessMap: roughnessMap,
            metalness: 0.5,
            roughness: 0.5
        });

        const objLoader = new OBJLoader();
        objLoader.load(
            `${basePath}/img/green-apple3d/apple02.obj`,  // 여기도 basePath 적용
            function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material = material;
                    }
                });

                object.scale.set(0.5, 0.5, 0.5);
                
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                object.position.sub(center);
                
                scene.add(object);
                document.getElementById("loading").style.display = "none";

                controls.minDistance = 3;
                controls.maxDistance = 20;
            },
            // 로딩 진행상황
            function (xhr) {
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    document.getElementById("loading").textContent = 
                        '로딩 중... ' + Math.round(percentComplete) + '%';
                }
            },
            function (error) {
                console.error('모델 로딩 에러:', error);
                document.getElementById("loading").textContent = '로딩 실패';
            }
        );
    } catch (error) {
        console.error('리소스 로딩 에러:', error);
        // 더 자세한 디버깅 정보 추가
        console.log('현재 환경:', window.location.hostname);
        console.log('basePath:', basePath);
        console.log('전체 파일 경로:', `${basePath}/img/green-apple3d/apple02.obj`);
        document.getElementById("loading").textContent = '로딩 실패';
    }
}

// 초기화 및 리소스 로딩 시작
loadModel();

// 화면 크기 조정 처리
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();