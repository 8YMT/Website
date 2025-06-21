import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import "../Style/Style.css";

const AboutMe = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const tableRef = useRef(null);
  const tableItemsRef = useRef([]);
  const hoveredItemRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const isMobileRef = useRef(false);
  
  // UI State
  const [hoveredObject, setHoveredObject] = useState(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [titleShifted, setTitleShifted] = useState(false);

  // Object information
  const objectInfo = {
    controller: {
      title: "Video Game Industry",
      description: "With over 5 years of experience in game development, I’ve worked across both established studios and agile indie teams—sharpening my ability to design and implement gameplay systems that are both innovative and technically sound."
    },
    degree: {
      title: "Education",
      description: "I graduated from Holberton School, where I had the opportunity to connect with like-minded individuals and take our first steps into the industry. The curriculum was project-based, which constantly pushed us to step outside our comfort zones and find solutions as a team. Engaging in group problem-solving, sharing opinions, and remaining fully invested in the learning process proved how much more enjoyable and effective learning can be when it's collaborative and hands-on."
    },
    headphones: {
      title: "Music & Productivity",
      description: "After gaining confidence in my coding abilities, I embarked on a personal challenge to integrate my technical skills with my passion for music and music production. This endeavor enabled me to create interactive audio experiences."
    },
    paper: {
      title: "Summary",
      description: "I have developed the ability to adapt quickly, approach challenges with creativity, and discern when to follow established conventions—and when to challenge them. I now apply this versatility to building purposeful, engaging projects that thoughtfully integrate technology and creativity."
    }
  };

  useEffect(() => {
    let cleanup = () => {};
    let renderer, composer, outlinePass;

    const raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Check if mobile device
      isMobileRef.current = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x0a1128);

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(-10, 4, 2);

      // Rotation setup
      let azimuthAngle = -Math.PI;
      const polarAngle = Math.PI / 2;
      const baseAzimuth = -Math.PI;
      const yawRange = Math.PI / 4;
      const minAzimuth = baseAzimuth - yawRange;
      const maxAzimuth = baseAzimuth + yawRange;

      // Look direction
      const x = Math.sin(polarAngle) * Math.cos(azimuthAngle);
      const y = Math.cos(polarAngle);
      const z = Math.sin(polarAngle) * Math.sin(azimuthAngle);
      camera.lookAt(camera.position.x + x, camera.position.y + y, camera.position.z + z);

      // Renderer
      const context = canvas.getContext('webgl2', { antialias: true });
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        context, 
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Postprocessing
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));

      outlinePass = new OutlinePass(new THREE.Vector2(width, height), scene, camera);
      outlinePass.edgeStrength = 5;
      outlinePass.edgeGlow = 1;
      outlinePass.edgeThickness = 1;
      outlinePass.visibleEdgeColor.set('#ffffff');
      outlinePass.hiddenEdgeColor.set('#000000');
      composer.addPass(outlinePass);
      composer.addPass(new OutputPass());

      // Loaders
      const loader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();

      // Raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Store original rotations for hover effect
      const originalRotations = new Map();

      const loadTableItem = (modelPath, lightMapPath, position, rotation, scale, name) => {
        loader.load(modelPath, (gltf) => {
          const model = gltf.scene;
          model.position.set(position.x, position.y, position.z);
          if (rotation) model.rotation.set(rotation.x, rotation.y, rotation.z);
          model.scale.set(scale.x, scale.y, scale.z);
          model.userData.name = name;

          // Store original rotation
          originalRotations.set(model, {
            x: rotation?.x || 0,
            y: rotation?.y || 0,
            z: rotation?.z || 0
          });

          const lightMap = textureLoader.load(lightMapPath);
          lightMap.flipY = false;

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.lightMap = lightMap;
                child.material.lightMapIntensity = 5;
              }
            }
          });

          scene.add(model);
          tableItemsRef.current.push(model);
        });
      };

      // Room
      loader.load("/3D assets/Room2.glb", (gltf) => {
        const roomModel = gltf.scene;
        roomModel.scale.set(1, 1, 1);

        const box = new THREE.Box3().setFromObject(roomModel);
        const center = box.getCenter(new THREE.Vector3());
        roomModel.position.sub(center);
        roomModel.position.y = box.getSize(new THREE.Vector3()).y / 100;

        const lightMap = textureLoader.load("/Textures/Room2LightMap.png");
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
      });

      // Table and items
      loader.load("/3D assets/Table.glb", (gltf) => {
        const tableModel = gltf.scene;
        tableRef.current = tableModel;

        tableModel.position.set(-14, 2, 2);
        tableModel.rotation.set(0, -Math.PI, 0);
        tableModel.scale.set(5, 5, 5);

        const tableLightMap = textureLoader.load("/Textures/TableLightMap.png");
        tableLightMap.flipY = false;

        tableModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.lightMap = tableLightMap;
              child.material.lightMapIntensity = 10;
            }
          }
        });

        scene.add(tableModel);

        loadTableItem(
          "/3D assets/Controller.glb",
          "/Textures/ControllerLightMap.png",
          { x: -14.5, y: 2.3, z: 2 },
          { x: 0, y: 0, z: Math.PI * 2 + Math.PI / 8 },
          { x: 3, y: 3, z: 3 },
          "controller"
        );

        loadTableItem(
          "/3D assets/Degree.glb",
          "/Textures/DegreeLightMap.png",
          { x: -14, y: 2.2, z: 4.5 },
          { x: 0, y: Math.PI/2-Math.PI/4, z: 0 },
          { x: 2, y: 2, z: 2 },
          "degree"
        );

        loadTableItem(
          "/3D assets/Headphones.glb",
          "/Textures/HeadphonesLightMap.png",
          { x: -13, y: 2.5, z: 0 },
          { x: Math.PI, y: Math.PI + Math.PI / 3, z: -Math.PI / 2 - Math.PI / 8.5 },
          { x: 1.4, y: 1.4, z: 1.4 },
          "headphones"
        );

        loadTableItem(
          "/3D assets/Papper.glb",
          "/Textures/PapperLightMap.png",
          { x: -13, y: 2.2, z: 2 },
          { x: 0, y: Math.PI - Math.PI / 2, z: 0 },
          { x: 1, y: 1, z: 1 },
          "paper"
        );
      });

      // Interaction handlers
      let isDragging = false;
      let previousPosition = { x: 0, y: 0 };

      const getNormalizedPosition = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * 2 - 1,
          y: -((clientY - rect.top) / rect.height) * 2 + 1
        };
      };

      const handlePointerDown = (e) => {
        isDragging = true;
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        previousPosition = { x: clientX, y: clientY };
        
        // Prevent default to avoid scrolling on mobile
        if (e.cancelable) e.preventDefault();
      };

      const handlePointerMove = (e) => {
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
        
        if (!clientX || !clientY) return;
        
        // Handle rotation if dragging
        if (isDragging) {
          const deltaX = clientX - previousPosition.x;
          previousPosition = { x: clientX, y: clientY };
          
          // Adjust sensitivity based on device
          const sensitivity = isMobileRef.current ? 0.002 : 0.005;
          azimuthAngle -= deltaX * sensitivity;
          azimuthAngle = Math.max(minAzimuth, Math.min(maxAzimuth, azimuthAngle));
        }
        
        // Always handle hover/selection
        const pos = getNormalizedPosition(clientX, clientY);
        mouse.set(pos.x, pos.y);
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(tableItemsRef.current, true);

        if (intersects.length > 0) {
          let selectedObject = intersects[0].object;
          while (selectedObject.parent && selectedObject.parent !== scene) {
            selectedObject = selectedObject.parent;
          }
          
          outlinePass.visibleEdgeColor.set('#ff9900');
          outlinePass.selectedObjects = [selectedObject];
          
          if (hoveredItemRef.current !== selectedObject) {
            hoveredItemRef.current = selectedObject;
            setHoveredObject(selectedObject.userData.name);
            setShowPrompt(false);
            setTitleShifted(true);
          }
        } else {
          outlinePass.visibleEdgeColor.set('#ffffff');
          outlinePass.selectedObjects = [];
          
          if (hoveredItemRef.current) {
            hoveredItemRef.current = null;
            setHoveredObject(null);
            setShowPrompt(true);
            setTitleShifted(false);
          }
        }
      };

      const handlePointerUp = () => {
        isDragging = false;
      };

      // Add event listeners
      const passive = { passive: false };
      
      // Mouse events
      canvas.addEventListener('mousedown', handlePointerDown);
      canvas.addEventListener('mousemove', handlePointerMove);
      canvas.addEventListener('mouseup', handlePointerUp);
      canvas.addEventListener('mouseleave', handlePointerUp);
      
      // Touch events
      canvas.addEventListener('touchstart', handlePointerDown, passive);
      canvas.addEventListener('touchmove', handlePointerMove, passive);
      canvas.addEventListener('touchend', handlePointerUp);
      canvas.addEventListener('touchcancel', handlePointerUp);

      // Resize handler
      const handleResize = () => {
        const newRect = canvas.getBoundingClientRect();
        camera.aspect = newRect.width / newRect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(newRect.width, newRect.height);
        composer.setSize(newRect.width, newRect.height);
        outlinePass.setSize(newRect.width, newRect.height);
      };
      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();
        
        // Update camera look direction
        const x = Math.sin(polarAngle) * Math.cos(azimuthAngle);
        const y = Math.cos(polarAngle);
        const z = Math.sin(polarAngle) * Math.sin(azimuthAngle);
        camera.lookAt(camera.position.x + x, camera.position.y + y, camera.position.z + z);
        
        // Hover animation
        if (hoveredItemRef.current && originalRotations.has(hoveredItemRef.current)) {
          const item = hoveredItemRef.current;
          const originalRotation = originalRotations.get(item);
          const time = clockRef.current.getElapsedTime();
          const tiltAmount = 0.1;
          const tiltSpeed = 1.5;
          
          item.rotation.x = originalRotation.x + Math.sin(time * tiltSpeed) * tiltAmount * 0.5;
          item.rotation.y = originalRotation.y + Math.sin(time * tiltSpeed) * tiltAmount;
          item.rotation.z = originalRotation.z + Math.cos(time * tiltSpeed) * tiltAmount * 0.3;
        }
        
        composer.render();
      };
      animate();

      // Cleanup
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', handlePointerDown);
        canvas.removeEventListener('mousemove', handlePointerMove);
        canvas.removeEventListener('mouseup', handlePointerUp);
        canvas.removeEventListener('mouseleave', handlePointerUp);
        canvas.removeEventListener('touchstart', handlePointerDown);
        canvas.removeEventListener('touchmove', handlePointerMove);
        canvas.removeEventListener('touchend', handlePointerUp);
        canvas.removeEventListener('touchcancel', handlePointerUp);
        
        if (renderer) {
          renderer.dispose();
        }
        if (composer) {
          composer.dispose();
        }
      };
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return (
    <section className="Section" style={{ 
      position: 'relative',
      width: '100vw',
      height: '100vh',
      touchAction: 'none',
      overflow: 'hidden'
    }}>
      <div className="about-me-container">
        <div className="threejs-container">
          <canvas 
            ref={canvasRef} 
            className="threejs-canvas" 
            style={{ touchAction: 'none' }}
          />
        </div>
        
        <div className="about-me-ui">
          <h1 className={`about-me-title ${titleShifted ? 'shifted' : ''}`}>
            About Me
          </h1>
          
          {showPrompt && (
            <h2 className="hover-prompt">
              {isMobileRef.current ? 'Tap on Objects' : 'Hover Over Objects'}
            </h2>
          )}
          
          {hoveredObject && (
            <div className={`info-box ${isMobileRef.current ? 'mobile' : ''}`}>
              <h2>{objectInfo[hoveredObject].title}</h2>
              <p>{objectInfo[hoveredObject].description}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutMe;