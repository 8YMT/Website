import { useEffect, useRef, useState } from "react";
import React from 'react';
import * as THREE from "three";
import * as CANNON from 'cannon-es';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import "./App.css";
import AboutMe from './components/AboutMe';
import Skills from './components/Skills';
import Catalogue from './components/Catalogue';

const ScrollIndicator = ({ currentSection, sectionCount }) => {
  return (
    <div className="scroll-indicator">
      {Array.from({ length: sectionCount }).map((_, index) => (
        <div 
          key={index}
          className={`scroll-dot ${currentSection === index ? 'active' : ''}`}
        />
      ))}
    </div>
  );
};

function App() {
  // State and refs
  const refContainer = useRef(null);
  const [showResetButton, setShowResetButton] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [enableScroll, setEnableScroll] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  const resetButtonRef = useRef(null);
  const sceneRef = useRef(null);
  const frontModelRef = useRef(null);
  const controlsRef = useRef(null);
  const worldRef = useRef(null);
  const cubesRef = useRef([]);
  const scrollContainerRef = useRef(null);
  
  const isResettingRef = useRef(false);
  const allowRotationRef = useRef(true);
  const isScrollingRef = useRef(false);
  const startYRef = useRef(0);
  
  const cubeIntervalRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Constants
  const MAX_CUBES = 15;
  const INITIAL_CUBES = 10;

  // Scroll handling
  useEffect(() => {
    if (!enableScroll) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let isAnimating = false;

    const handleScroll = () => {
      if (isAnimating) return;
      
      const scrollPosition = container.scrollTop;
      const windowHeight = window.innerHeight;
      const newSection = Math.round(scrollPosition / windowHeight);
      
      if (newSection !== currentSection) {
        setCurrentSection(newSection);
      }
    };

    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
      isScrollingRef.current = true;
      clearTimeout(scrollTimeoutRef.current);
    };

    const handleTouchMove = (e) => {
      if (!isScrollingRef.current) return;
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (Math.abs(deltaY) > 5) e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      if (!isScrollingRef.current) return;
      isScrollingRef.current = false;
      
      const deltaY = e.changedTouches[0].clientY - startYRef.current;
      const threshold = window.innerHeight * 0.15;
      
      if (Math.abs(deltaY) > threshold) {
        const direction = deltaY > 0 ? 1 : -1;
        const newSection = Math.max(0, Math.min(3, currentSection + direction));
        scrollToSection(newSection);
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      const newSection = Math.max(0, Math.min(3, currentSection + delta));
      
      if (newSection !== currentSection) {
        scrollToSection(newSection);
      }
    };

    const scrollToSection = (sectionIndex) => {
      if (isAnimating) return;
      
      isAnimating = true;
      setCurrentSection(sectionIndex);
      
      const targetScroll = sectionIndex * window.innerHeight;
      container.style.scrollBehavior = 'smooth';
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      
      scrollTimeoutRef.current = setTimeout(() => {
        container.style.scrollBehavior = 'auto';
        isAnimating = false;
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [enableScroll, currentSection]);

  // Three.js initialization
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1128);

    // Physics world
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    worldRef.current = world;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 4, 2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#B069DB');
    outlinePass.hiddenEdgeColor.set('#000000');
    composer.addPass(outlinePass);
    composer.addPass(new OutputPass());

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    const baseYaw = Math.PI / 2;
    const yawRange = Math.PI / 4;
    controls.minAzimuthAngle = baseYaw - yawRange;
    controls.maxAzimuthAngle = baseYaw + yawRange;
    controls.minPolarAngle = Math.PI / 2.3;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    // Loaders
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Physics ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ 
      mass: 0,
      shape: groundShape,
      position: new CANNON.Vec3(0, 1, 0)
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Interaction setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDraggingModel = false;
    let previousMousePosition = { x: 0, y: 0 };
    const originalRotation = new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0);

    // Load room
    loader.load("/3D assets/Room.glb", (gltf) => {
      const roomModel = gltf.scene;
      roomModel.scale.set(1, 1, 1);
      
      const box = new THREE.Box3().setFromObject(roomModel);
      const center = box.getCenter(new THREE.Vector3());
      roomModel.position.sub(center);
      roomModel.position.y = box.getSize(new THREE.Vector3()).y / 100;

      const lightMap = textureLoader.load("/Textures/RoomMap.png");
      lightMap.flipY = false;
      roomModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.lightMap = lightMap;
            child.material.lightMapIntensity = 1.5;
          }
        }
      });

      scene.add(roomModel);
      loadFrontModel();
    });

    // Load cassette model
    function loadFrontModel() {
      const frontModelContainer = new THREE.Group();
      scene.add(frontModelContainer);

      loader.load("/3D assets/Casette.glb", (gltf) => {
        const frontModel = gltf.scene;
        frontModelRef.current = frontModel;
        frontModel.position.set(0, 0, -5);
        frontModel.rotation.copy(originalRotation);
        frontModel.scale.set(3, 3, 3);

        const lightMap = textureLoader.load("/Textures/CasetteLightMap.png");
        lightMap.flipY = false;
        frontModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.lightMap = lightMap;
              child.material.lightMapIntensity = 1.5;
            }
          }
        });

        frontModelContainer.add(frontModel);
        setShowResetButton(true);
      });
    }

    // Create falling cube
    const createFallingCube = (initialRotation = null) => {
      if (cubesRef.current.length >= MAX_CUBES) return;

      loader.load("/3D assets/Cube.glb", (gltf) => {
        const cube = gltf.scene.clone();
        const lightMap = textureLoader.load("/Textures/CubeLightMap.png");
        lightMap.flipY = false;
        
        cube.traverse((child) => {
          if (child.isMesh) {
            child.material.lightMap = lightMap;
            child.material.lightMapIntensity = 1.5;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const x = (Math.random() - 0.5) * 10;
        const z = 10;
        cube.position.set(x, 15, z);
        cube.scale.set(1, 1, 1);
        
        if (initialRotation) {
          cube.rotation.copy(initialRotation);
        } else {
          cube.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );
        }
        
        scene.add(cube);

        const size = 1;
        const cubeShape = new CANNON.Box(new CANNON.Vec3(size, size, size));
        const cubeBody = new CANNON.Body({
          mass: 1,
          shape: cubeShape,
          position: new CANNON.Vec3(x, 15, z),
          quaternion: new CANNON.Quaternion().setFromEuler(
            cube.rotation.x,
            cube.rotation.y,
            cube.rotation.z
          ),
          material: new CANNON.Material({ restitution: 0.7 })
        });
        world.addBody(cubeBody);

        cubesRef.current.push({ mesh: cube, body: cubeBody });
      });
    };

    // Create initial cubes
    const createCubeStorm = () => {
      const cubesToCreate = Math.min(INITIAL_CUBES, MAX_CUBES - cubesRef.current.length);
      for (let i = 0; i < cubesToCreate; i++) {
        setTimeout(() => createFallingCube(), i * 100);
      }
      
      cubeIntervalRef.current = setInterval(() => {
        if (cubesRef.current.length < MAX_CUBES) {
          createFallingCube();
        } else {
          clearInterval(cubeIntervalRef.current);
        }
      }, 5000);
    };

    // Event handlers
    const onPointerDown = (event) => {
      if (!frontModelRef.current || isResettingRef.current || !allowRotationRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(frontModelRef.current, true);

      if (intersects.length > 0) {
        isDraggingModel = true;
        controls.enabled = false;
        previousMousePosition = { x: event.clientX, y: event.clientY };
        outlinePass.selectedObjects = [frontModelRef.current];
      }
    };

    const onPointerMove = (event) => {
      if (isResettingRef.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (frontModelRef.current) {
        const intersects = raycaster.intersectObject(frontModelRef.current, true);
        outlinePass.selectedObjects = intersects.length > 0 ? [frontModelRef.current] : [];
      }

      if (isDraggingModel && frontModelRef.current && allowRotationRef.current) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        frontModelRef.current.rotation.y += deltaX * 0.01;
        frontModelRef.current.rotation.x += deltaY * 0.01;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const onPointerUp = () => {
      if (isDraggingModel) {
        isDraggingModel = false;
        controls.enabled = true;
      }
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      outlinePass.setSize(window.innerWidth, window.innerHeight);
    };

    // Mount
    if (refContainer.current) {
      refContainer.current.replaceChildren(renderer.domElement);
    }

    // Event listeners
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onWindowResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      world.step(1/60);

      cubesRef.current.forEach(cube => {
        cube.mesh.position.copy(cube.body.position);
        cube.mesh.quaternion.copy(cube.body.quaternion);
      });

      cubesRef.current = cubesRef.current.filter(cube => {
        if (cube.body.position.y < -10) {
          scene.remove(cube.mesh);
          world.removeBody(cube.body);
          return false;
        }
        return true;
      });

      if (!isDraggingModel && !isResettingRef.current) {
        controls.update();
      }

      if (sceneRef.current && frontModelRef.current) {
        const container = frontModelRef.current.parent;
        if (container) {
          container.position.copy(camera.position);
          container.quaternion.copy(camera.quaternion);
        }
      }

      composer.render();
    };

    animate();

    return () => {
      clearInterval(cubeIntervalRef.current);
      renderer.dispose();
      composer.dispose();
      window.removeEventListener("resize", onWindowResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      if (refContainer.current) refContainer.current.innerHTML = "";
    };
  }, []);

  const handleResetClick = () => {
    if (frontModelRef.current && !isResettingRef.current) {
      isResettingRef.current = true;
      controlsRef.current.enabled = false;
      allowRotationRef.current = false;
      setShowResetButton(false);

      const frontModel = frontModelRef.current;
      const startRotation = frontModel.rotation.clone();
      const targetRotation = new THREE.Euler(
        THREE.MathUtils.degToRad(-45),
        THREE.MathUtils.degToRad(90),
        0
      );

      const rotationDuration = 1000;
      const rotationStartTime = Date.now();

      const animateRotation = () => {
        const elapsed = Date.now() - rotationStartTime;
        const progress = Math.min(elapsed / rotationDuration, 1);
        const t = easeOutCubic(progress);

        frontModel.rotation.x = THREE.MathUtils.lerp(startRotation.x, targetRotation.x, t);
        frontModel.rotation.y = THREE.MathUtils.lerp(startRotation.y, targetRotation.y, t);
        frontModel.rotation.z = THREE.MathUtils.lerp(startRotation.z, targetRotation.z, t);

        if (progress < 1) {
          requestAnimationFrame(animateRotation);
        } else {
          const targetPosition = new THREE.Vector3(0, -2, -3);
          const startPosition = frontModel.position.clone();
          const translationStartTime = Date.now();

          const animateTranslation = () => {
            const elapsed = Date.now() - translationStartTime;
            const progress = Math.min(elapsed / 1000, 1);
            const t = easeOutCubic(progress);

            frontModel.position.lerpVectors(startPosition, targetPosition, t);

            if (progress < 1) {
              requestAnimationFrame(animateTranslation);
            } else {
              isResettingRef.current = false;
              controlsRef.current.enabled = true;
              setShowTitle(true);
              setShowHeader(true);
              setEnableScroll(true);
              document.body.style.overflow = 'auto';
              
              if (worldRef.current) {
                createCubeStorm();
              }
            }
          };

          animateTranslation();
        }
      };

      animateRotation();
    }
  };

  const createCubeStorm = () => {
    if (worldRef.current && sceneRef.current) {
      const cubesToCreate = Math.min(INITIAL_CUBES, MAX_CUBES - cubesRef.current.length);
      for (let i = 0; i < cubesToCreate; i++) {
        setTimeout(() => createFallingCube(), i * 100);
      }
      
      cubeIntervalRef.current = setInterval(() => {
        if (cubesRef.current.length < MAX_CUBES) {
          createFallingCube();
        } else {
          clearInterval(cubeIntervalRef.current);
        }
      }, 5000);
    }
  };

  const createFallingCube = () => {
    if (worldRef.current && sceneRef.current && cubesRef.current.length < MAX_CUBES) {
      const loader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();
      
      loader.load("/3D assets/Cube.glb", (gltf) => {
        const cube = gltf.scene.clone();
        const lightMap = textureLoader.load("/Textures/CubeLightMap.png");
        lightMap.flipY = false;
        
        cube.traverse((child) => {
          if (child.isMesh) {
            child.material.lightMap = lightMap;
            child.material.lightMapIntensity = 1.5;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const x = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        cube.position.set(x, 15, z);
        cube.scale.set(1, 1, 1);
        
        cube.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        sceneRef.current.add(cube);

        const size = 1.5;
        const cubeShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const cubeBody = new CANNON.Body({
          mass: 1,
          shape: cubeShape,
          position: new CANNON.Vec3(x, 15, z),
          quaternion: new CANNON.Quaternion().setFromEuler(
            cube.rotation.x,
            cube.rotation.y,
            cube.rotation.z
          ),
          material: new CANNON.Material({ restitution: 0.7 })
        });
        worldRef.current.addBody(cubeBody);

        cubesRef.current.push({ mesh: cube, body: cubeBody });
      });
    }
  };

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  return (
    <div 
      ref={scrollContainerRef}
      style={{ 
        position: "relative", 
        width: "100%", 
        height: "100vh",
        overflow: enableScroll ? "auto" : "hidden",
        scrollSnapType: enableScroll ? "y mandatory" : "none",
        touchAction: enableScroll ? "none" : "auto"
      }}
    >
      {/* Landing Section */}
      <div style={{ 
        scrollSnapAlign: "start",
        height: "100vh",
        position: "relative",
        borderBottom: "3px solid rgba(255, 255, 255, 0.63)"
      }}>
        <div ref={refContainer} style={{ width: "100%", height: "100%" }} />

        {showResetButton && (
          <button
            ref={resetButtonRef}
            onClick={handleResetClick}
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "24px",
              zIndex: 100,
              animation: "pulseOpacity 2s infinite ease-in-out",
              opacity: 0.7,
              transition: "all 0.1s ease",
              fontFamily: "'Microma', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.animation = "none";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.animation = "pulseOpacity 2s infinite ease-in-out";
            }}
          >
            Play Tape
          </button>
        )}

        {showTitle && (
          <>
            <h1
              style={{
                position: "absolute",
                top: "35%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0,
                animation: "fadeInUp 1s forwards",
                color: "#fff",
                fontSize: "clamp(40px, 8vw, 90px)",
                textAlign: "center",
                zIndex: 101,
                pointerEvents: "none",
                width: "90%",
                maxWidth: "1200px",
                margin: 0,
                fontFamily: "'Microma', sans-serif",
                padding: "0 20px",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                lineHeight: 1.2,
                whiteSpace: "pre-line"
              }}
            >
              Farouk Ben Ajimi
            </h1>

            <h2
              style={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0,
                animation: "fadeInUp 1s forwards 0.5s",
                color: "#fff",
                fontSize: "clamp(20px, 4vw, 40px)",
                textAlign: "center",
                zIndex: 101,
                pointerEvents: "none",
                width: "90%",
                maxWidth: "800px",
                margin: 0,
                fontFamily: "'Microma', sans-serif",
                padding: "0 20px",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                lineHeight: 1.3,
                whiteSpace: "pre-line"
              }}
            >
              Game Developer
            </h2>
          </>
        )}
      </div>

      {/* Other Sections */}
      {enableScroll && (
        <>
          <div style={{ 
            scrollSnapAlign: "start",
            height: "100vh",
            position: "relative"
          }}>
            <AboutMe currentSection={currentSection} sectionIndex={1} />
          </div>
          
          <div style={{ 
            scrollSnapAlign: "start",
            height: "100vh",
            position: "relative"
          }}>
            <Skills currentSection={currentSection} sectionIndex={2} />
          </div>
          
          <div style={{ 
            scrollSnapAlign: "start",
            height: "100vh",
            position: "relative"
          }}>
            <Catalogue currentSection={currentSection} sectionIndex={3} />
          </div>
        </>
      )}

      {enableScroll && (
        <ScrollIndicator currentSection={currentSection} sectionCount={4} />
      )}

      {/* Header */}
      {showHeader && (
        <header style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px 0",
          backgroundColor: "rgba(10, 17, 40, 0.05)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.63)",
          zIndex: 102,
          backdropFilter: "blur(5px)",
          animation: "fadeInUp 2s forwards"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
            {[
              { href: "https://www.linkedin.com/in/farouk-ben-ajimi-79a557365/", src: "/social-icons/linkedin.png", alt: "LinkedIn" },
              { href: "https://github.com/8YMT", src: "/social-icons/github.png", alt: "GitHub" },
              { href: "https://www.youtube.com/@FaroukBenAjimi", src: "/social-icons/youtube.png", alt: "YouTube" },
              { href: "https://www.instagram.com/8aymt/", src: "/social-icons/instagram.png", alt: "Instagram" }
            ].map((icon, i, arr) => (
              <React.Fragment key={icon.alt}>
                <a
                  href={icon.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 5vw",
                  }}
                >
                  <img
                    src={icon.src}
                    alt={icon.alt}
                    style={{
                      width: "32px",
                      height: "32px",
                      transition: "transform 0.2s"
                    }}
                  />
                </a>

                {i < arr.length - 1 && (
                  <div style={{
                    width: "1px",
                    height: "24px",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    margin: "0 5px"
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </header>
      )}
      {showHeader && (
  <a 
    href="mailto:your-email@example.com" 
    className="email-footer"
    style={{
      animation: "fadeIn 1s forwards 1s",
      opacity: 0
    }}
  >
    fbenajimi@gmail.com
  </a>
)}
    </div>
  );
}

export default App;