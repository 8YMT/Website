import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import "../Style/Style.css";

const Skills = ({ currentSection, sectionIndex }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  // Cube rain state
  const worldRef = useRef(null);
  const cubesRef = useRef([]);
  const cubeIntervalRef = useRef(null);
  const MAX_CUBES = 15;
  const INITIAL_CUBES = 10;

  const skillCategories = [
    {
      id: 'unity',
      title: 'Unity',
      description: 'I develop both 2D and 3D games using Unity, a platform that has greatly influenced my approach to game development. Unity’s workspace has pushed me to think critically and reason like a game developer, which has also made me confident in working with other game development software such as Unreal. My focus lies in developing hypercasual, third-person, and VR games. Specifically, I design game mechanics, gameplay systems, and ideas, ensuring that they are executed in a technically sound and efficient manner.',
      size: 'large',
      color: '#ffffff'
    },
    {
      id: 'blender',
      title: 'Blender',
      description: 'Like many game developers, I found myself wanting more creative control than pre-made assets could offer. This led me to learn 3D modeling using Blender. I now design custom environments, decorative assets, and avatars—and handle everything from modeling and rigging to animation, allowing me to bring fully original content into my projects.',
      size: 'medium',
      color: '#ffffff'
    },
    {
      id: 'Coding',
      title: 'Coding',
      description: 'I’m proficient in C#, C++, and C—core languages in the game development space.I also work with Python, JavaScript, Bash and Git.',
      size: 'large',
      color: '#ffffff'
    },
    {
      id: 'music',
      title: 'Music',
      description: 'Producing electronic music led me to explore digital audio theory and merge sound with interactive design in games.',
      size: 'medium',
      color: '#ffffff'
    },
    {
      id: 'languages',
      title: 'Languages',
      description: 'I speak Arabic, French, and English fluently.',
      size: 'small',
      color: '#ffffff'
    },
    {
      id: 'soft-skills',
      title: 'Soft Skills',
      description: 'I excel in collaboration, adaptability, and creative problem-solving. I value open communication and feedback, staying engaged throughout every project phase.',
      size: 'small',
      color: '#ffffff'
    },
  ];

  // Cube rain functions
  const createFallingCube = (initialRotation = null) => {
    if (!worldRef.current || !sceneRef.current || cubesRef.current.length >= MAX_CUBES) return;

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    loader.load(`${process.env.PUBLIC_URL}/3D assets/Cube2.glb`, (gltf) => {
      const cube = gltf.scene.clone();
      const lightMap = textureLoader.load(`${process.env.PUBLIC_URL}/Textures/Cube2LightMap.png`);
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

      if (initialRotation) {
        cube.rotation.copy(initialRotation);
      } else {
        cube.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
      }

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
  };

  const createCubeStorm = () => {
    if (!worldRef.current || !sceneRef.current) return;

    // Clear existing cubes
    cubesRef.current.forEach(cube => {
      sceneRef.current.remove(cube.mesh);
      worldRef.current.removeBody(cube.body);
    });
    cubesRef.current = [];

    // Create initial cubes
    const cubesToCreate = Math.min(INITIAL_CUBES, MAX_CUBES - cubesRef.current.length);
    for (let i = 0; i < cubesToCreate; i++) {
      setTimeout(() => createFallingCube(), i * 100);
    }

    // Set up interval for continuous cube creation
    cubeIntervalRef.current = setInterval(() => {
      if (cubesRef.current.length < MAX_CUBES) {
        createFallingCube();
      }
    }, 3000);
  };

  useEffect(() => {
    let renderer;
    let animationFrameId;

    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x0a1128);

      // Physics world
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
      worldRef.current = world;

      // Physics ground
      const groundShape = new CANNON.Plane();
      const groundBody = new CANNON.Body({ 
        mass: 0,
        shape: groundShape,
        position: new CANNON.Vec3(0, 1, 0)
      });
      groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      world.addBody(groundBody);

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(10, 4, 2);
      camera.rotation.set(0,Math.PI/2,0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Loaders
      const loader = new GLTFLoader();
      const textureLoader = new THREE.TextureLoader();

      // Load room
      loader.load(`${process.env.PUBLIC_URL}/3D assets/Room4.glb`, (gltf) => {
        const roomModel = gltf.scene;
        roomModel.scale.set(1, 1, 1);

        const box = new THREE.Box3().setFromObject(roomModel);
        const center = box.getCenter(new THREE.Vector3());
        roomModel.position.sub(center);
        roomModel.position.y = box.getSize(new THREE.Vector3()).y / 100;

        const lightMap = textureLoader.load(`${process.env.PUBLIC_URL}/Textures/Room4LightMap.png`);
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

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        // Update physics
        worldRef.current.step(1/60);

        // Update cube positions
        cubesRef.current.forEach(cube => {
          cube.mesh.position.copy(cube.body.position);
          cube.mesh.quaternion.copy(cube.body.quaternion);
        });

        // Clean up fallen cubes
        cubesRef.current = cubesRef.current.filter(cube => {
          if (cube.body.position.y < -10) {
            scene.remove(cube.mesh);
            worldRef.current.removeBody(cube.body);
            return false;
          }
          return true;
        });

        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        const newRect = canvas.getBoundingClientRect();
        camera.aspect = newRect.width / newRect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(newRect.width, newRect.height);
      };
      window.addEventListener('resize', handleResize);

      // Start cube rain when this section is active
      if (currentSection === sectionIndex) {
        createCubeStorm();
      } else {
        // Clean up cubes when not active
        clearInterval(cubeIntervalRef.current);
        cubesRef.current.forEach(cube => {
          scene.remove(cube.mesh);
          worldRef.current.removeBody(cube.body);
        });
        cubesRef.current = [];
      }

      // Cleanup function
      return () => {
        clearInterval(cubeIntervalRef.current);
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (renderer) renderer.dispose();
      };
    };

    const cleanup = init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentSection, sectionIndex]);

  const getSizeStyles = (size) => {
    switch(size) {
      case 'large':
        return { gridColumn: 'span 2', gridRow: 'span 2' };
      case 'medium':
        return { gridColumn: 'span 2', gridRow: 'span 2' };
      case 'small':
        return { gridColumn: 'span 2', gridRow: 'span 1' };
      default:
        return { gridColumn: 'span 1', gridRow: 'span 1' };
    }
  };

  return (
    <section className="Section" style={{ 
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <canvas 
        ref={canvasRef} 
        className="threejs-canvas" 
      />
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        boxSizing: 'border-box',
        pointerEvents: 'none'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '3rem',
          fontWeight: '300',
          textAlign: 'center',
          margin: '30px 0 30px 0',
          textShadow: '0 0 10px rgba(255,255,255,0.3)',
          pointerEvents: 'none'
        }}>
          What I Do
        </h1>
        
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '20px',
          pointerEvents: 'none',
        }}>
          {skillCategories.map((category) => (
            <div 
              key={category.id}
              className="skill-card"
              style={{
                position: 'relative',
                border: `1px solid ${category.color}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                margin:"10px",
                backgroundColor: 'rgba(10, 17, 40, 0)',
                backdropFilter: 'blur(5px)',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                overflow: 'hidden',
                ...getSizeStyles(category.size),
                ...(hoveredSection === category.id ? {
                  backgroundColor: 'rgba(10, 17, 40, 0)',
                  boxShadow: `0 0 20px ${category.color}`,
                  transform: 'scale(1.02)'
                } : {})
              }}
              onMouseEnter={() => setHoveredSection(category.id)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <h3 style={{
                margin: 0,
                color: category.color,
                fontSize: category.size === 'large' ? '2rem' : '2rem',
                fontWeight: '300',
                fontFamily:"Microma",
                textAlign: 'center',
                transition: 'all 0.3s ease',
                textShadow: '0 0 5px rgba(0,0,0,0.5)',
                ...(hoveredSection === category.id ? {
                  transform: 'translateY(-20px)',
                  fontSize: category.size === 'large' ? '1.8rem' : '1.3rem'
                } : {})
              }}>
                {category.title}
              </h3>
              <div style={{
                maxHeight: hoveredSection === category.id ? '500px' : '0',
                opacity: hoveredSection === category.id ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                fontSize: category.size === 'large' ? '1.1rem' : '1.1rem',
                fontFamily:"Microma",
                lineHeight: '1.6',
                padding: hoveredSection === category.id ? '15px 0' : '0',
                width: '90%'
              }}>
                {category.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;