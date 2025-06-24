import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import "../Style/Style.css";

// Use PUBLIC_URL for icon paths for GitHub Pages compatibility
const GitHubIcon = `${process.env.PUBLIC_URL}/social-icons/github.png`;
const InstagramIcon = `${process.env.PUBLIC_URL}/social-icons/instagram.png`;
const SoundcloudIcon = `${process.env.PUBLIC_URL}/social-icons/soundcloud.png`;
const YoutubeIcon = `${process.env.PUBLIC_URL}/social-icons/youtube.png`;

const Catalogue = ({ currentSection, sectionIndex }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);

  // Cube rain state
  const worldRef = useRef(null);
  const cubesRef = useRef([]);
  const cubeIntervalRef = useRef(null);
  const MAX_CUBES = 15;
  const INITIAL_CUBES = 10;

  const projectCategories = [
    {
      id: 'unity-audio',
      title: 'Unity Audio Tools',
      description: [
        'Unity Audio Analyser.',
        'Unity Drum Machine.',
        'Unity Synthesizer.'
      ],
      size: 'large',
      color: '#ffffff',
      icons: [
        { icon: YoutubeIcon, url: 'https://www.youtube.com/watch?v=9j1WuMP-Mj0' },
        { icon: GitHubIcon, url: 'https://github.com/8YMT/UnityAudio' },
        { icon: YoutubeIcon, url: 'https://www.youtube.com/watch?v=UlliXdbxVrI&t=7s' },
        { icon: GitHubIcon, url: 'https://github.com/8YMT/Unity-Drum-Machine' },
        { icon: YoutubeIcon, url: 'https://www.youtube.com/watch?v=4H67CaYYZ3E' }
      ]
    },
    {
      id: 'unity-games',
      title: 'Unity Games',
      description: 'I develop hypercasual games for various clients, focusing on rapid prototyping, strong core loops, and engaging mechanics. I also build third-person games to experiment with new techniques and explore gameplay ideas.',
      size: 'medium',
      color: '#ffffff',
      icons: [
        { icon: YoutubeIcon, url: 'https://www.youtube.com/watch?v=ZN8nqeHUC8U&t=12s' },
        { icon: GitHubIcon, url: 'https://github.com/FaroukAjimi?tab=repositories' }
      ]
    },
    {
      id: 'music-production',
      title: 'Music Production',
      description: 'My music production skills have evolved significantly in terms of sound design, mixing, and workflow efficiency. While I focus on technical precision, I also aim to maintain a clear creative intent to ensure the final result aligns with the desired emotional tone.',
      size: 'medium',
      color: '#ffffff',
      icons: [
        { icon: SoundcloudIcon, url: 'https://soundcloud.com/takeatour/8ymt-id-1/s-ERxKJdXxy1D?si=0e56ae3513f74ba4ab85a4f1649a8d93&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing' },
        { icon: SoundcloudIcon, url: 'https://soundcloud.com/takeatour/in-and-out-of-psytrance/s-i6kF2vXk778?si=eb9a746a32a54234ba12c87f5b810153&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing' }
      ]
    },
    {
      id: 'music-visualizer',
      title: 'Music Visualizer',
      description: 'A music visualizer is a Unity-based environment.',
      size: 'small',
      color: '#ffffff',
      icons: [
        { icon: YoutubeIcon, url: 'https://www.fiverr.com/faroukbenajimi/bring-your-music-to-life-with-mesmerizing-3d-visuals?utm_campaign=gigs_show&utm_medium=shared&utm_source=copy_link&utm_term=yjbyvr' },
      ]
    },
    {
      id: 'vr',
      title: 'VR Development',
      description: 'Solfennex is a VR game developed for an independent NFT project, where I served as the tech lead. My role involved overseeing the technical development to create an immersive VR experience that promotes and enhances the value of the NFT collection.',
      size: 'small',
      color: '#ffffff',
      icons: [
        { icon: YoutubeIcon, url: 'https://www.youtube.com/watch?v=rrNhGg2wN5o' }
      ]
    }
  ];

  // Cube rain functions
  const createFallingCube = (initialRotation = null) => {
    if (!worldRef.current || !sceneRef.current || cubesRef.current.length >= MAX_CUBES) return;

    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    loader.load(`${process.env.PUBLIC_URL}/3D assets/Cube3.glb`, (gltf) => {
      const cube = gltf.scene.clone();
      const lightMap = textureLoader.load(`${process.env.PUBLIC_URL}/Textures/Cube3LightMap.png`);
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
      loader.load(`${process.env.PUBLIC_URL}/3D assets/Room3.glb`, (gltf) => {
        const roomModel = gltf.scene;
        roomModel.scale.set(1, 1, 1);

        const box = new THREE.Box3().setFromObject(roomModel);
        const center = box.getCenter(new THREE.Vector3());
        roomModel.position.sub(center);
        roomModel.position.y = box.getSize(new THREE.Vector3()).y / 100;

        const lightMap = textureLoader.load(`${process.env.PUBLIC_URL}/Textures/Room3LightMap.png`);
        lightMap.flipY = false;

        roomModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.lightMap = lightMap;
              child.material.lightMapIntensity = 15;
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
        return { gridColumn: 'span 2', gridRow: 'span 2' };
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
          Projects & Work
        </h1>
        
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '20px',
          pointerEvents: 'none'
        }}>
          {projectCategories.map((category) => (
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
                  backgroundColor: 'rgba(10, 17, 40, 0.3)',
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
                fontSize: category.size === 'large' ? '2rem' : '1.5rem',
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
              
              {category.id === 'unity-audio' ? (
                <div style={{
                  maxHeight: hoveredSection === category.id ? '500px' : '0',
                  opacity: hoveredSection === category.id ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  fontSize: category.size === 'large' ? '1.1rem' : '0.9rem',
                  fontFamily:"Microma",
                  lineHeight: '1.6',
                  padding: hoveredSection === category.id ? '15px 0' : '0',
                  width: '90%'
                }}>
                  <p>{category.description[0]}</p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    margin: '10px 0',
                    opacity: hoveredSection === category.id ? 1 : 0,
                    transform: hoveredSection === category.id ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.3s ease'
                  }}>
                    {category.icons.slice(0, 2).map((iconData, index) => (
                      <a 
                        key={index}
                        href={iconData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          width: '30px',
                          height: '30px',
                          transition: 'transform 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img 
                          src={iconData.icon}
                          alt={`${category.title} link`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                          }}
                        />
                      </a>
                    ))}
                  </div>
                  
                  <p>{category.description[1]}</p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    margin: '10px 0',
                    opacity: hoveredSection === category.id ? 1 : 0,
                    transform: hoveredSection === category.id ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.3s ease'
                  }}>
                    {category.icons.slice(2, 4).map((iconData, index) => (
                      <a 
                        key={index}
                        href={iconData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          width: '30px',
                          height: '30px',
                          transition: 'transform 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img 
                          src={iconData.icon}
                          alt={`${category.title} link`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                          }}
                        />
                      </a>
                    ))}
                  </div>
                  
                  <p>{category.description[2]}</p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    margin: '10px 0',
                    opacity: hoveredSection === category.id ? 1 : 0,
                    transform: hoveredSection === category.id ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.3s ease'
                  }}>
                    {category.icons.slice(4, 6).map((iconData, index) => (
                      <a 
                        key={index}
                        href={iconData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          width: '30px',
                          height: '30px',
                          transition: 'transform 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img 
                          src={iconData.icon}
                          alt={`${category.title} link`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  maxHeight: hoveredSection === category.id ? '500px' : '0',
                  opacity: hoveredSection === category.id ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textAlign: 'center',
                  fontSize: category.size === 'large' ? '1.1rem' : '0.9rem',
                  fontFamily:"Microma",
                  lineHeight: '1.6',
                  padding: hoveredSection === category.id ? '15px 0' : '0',
                  width: '90%'
                }}>
                  {category.description}
                </div>
              )}
              
              {/* Icons that appear on hover (for non-unity-audio items) */}
              {category.id !== 'unity-audio' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '15px',
                  marginTop: '15px',
                  opacity: hoveredSection === category.id ? 1 : 0,
                  transform: hoveredSection === category.id ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.3s ease'
                }}>
                  {category.icons.map((iconData, index) => (
                    <a 
                      key={index}
                      href={iconData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        transition: 'transform 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img 
                        src={iconData.icon}
                        alt={`${category.title} link`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                        }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Catalogue;