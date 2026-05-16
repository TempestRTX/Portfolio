/**
 * Portfolio JavaScript - Three.js & GSAP Integration
 * 3D Visuals and Scroll Animations
 */

// ========================================
// Hero Section - 3D Particle Network
// ========================================
class HeroScene {
  constructor() {
    this.container = document.getElementById('hero-canvas');
    if (!this.container) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    this.particles = [];
    this.lines = [];
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }
  
  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    // Setup camera
    this.camera.position.z = 30;
    
    // Create particle network
    this.createParticles();
    this.createConnections();
    
    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    // Start animation
    this.animate();
  }
  
  createParticles() {
    const particleCount = 50;
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8
    });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material.clone());
      
      // Random position
      particle.position.x = (Math.random() - 0.5) * 50;
      particle.position.y = (Math.random() - 0.5) * 50;
      particle.position.z = (Math.random() - 0.5) * 20;
      
      // Store velocity for animation
      particle.userData = {
        velocity: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.01
        },
        originalY: particle.position.y
      };
      
      this.particles.push(particle);
      this.scene.add(particle);
    }
  }
  
  createConnections() {
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.1 
    });
    
    const maxConnections = 3; // Max connections per particle
    const connectionDistance = 8; // Max distance for connection
    
    // Create connection lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < this.particles.length && connections < maxConnections; j++) {
        const dist = this.particles[i].position.distanceTo(this.particles[j].position);
        
        if (dist < connectionDistance) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(6);
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const line = new THREE.Line(geometry, lineMaterial.clone());
          line.userData = { particleA: this.particles[i], particleB: this.particles[j] };
          
          this.lines.push(line);
          this.scene.add(line);
          connections++;
        }
      }
    }
  }
  
  onMouseMove(event) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    // Animate particles
    this.particles.forEach((particle, i) => {
      // Update position
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      
      // Add subtle wave motion
      particle.position.y = particle.userData.originalY + Math.sin(time + i) * 0.5;
      
      // Mouse interaction (only for every 5th particle for performance)
      if (i % 5 === 0) {
        particle.position.x += this.mouseX * 0.01;
        particle.position.y += this.mouseY * 0.01;
      }
      
      // Boundary check
      if (Math.abs(particle.position.x) > 25) particle.userData.velocity.x *= -1;
      if (Math.abs(particle.position.y) > 25) particle.userData.velocity.y *= -1;
      if (Math.abs(particle.position.z) > 10) particle.userData.velocity.z *= -1;
    });
    
    // Update connection lines
    this.lines.forEach(line => {
      const positions = line.geometry.attributes.position.array;
      const pA = line.userData.particleA.position;
      const pB = line.userData.particleB.position;
      
      positions[0] = pA.x; positions[1] = pA.y; positions[2] = pA.z;
      positions[3] = pB.x; positions[4] = pB.y; positions[5] = pB.z;
      
      line.geometry.attributes.position.needsUpdate = true;
      
      // Calculate distance for opacity
      const distance = pA.distanceTo(pB);
      line.material.opacity = Math.max(0, (10 - distance) / 10) * 0.2;
    });
    
    // Rotate camera slowly
    this.camera.position.x = Math.sin(time * 0.1) * 5;
    this.camera.position.y = Math.cos(time * 0.1) * 5;
    this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }
}

// ========================================
// Unity Section - Floating Data Cubes
// ========================================
class UnityScene {
  constructor() {
    this.container = document.getElementById('unity-canvas');
    if (!this.container) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    this.cubes = [];
    
    this.init();
  }
  
  init() {
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 20;
    
    // Create floating cubes
    this.createCubes();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.animate();
  }
  
  createCubes() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2, wireframe: true });
    
    for (let i = 0; i < 10; i++) {
      const cube = new THREE.Mesh(geometry, material);
      
      cube.position.x = (Math.random() - 0.5) * 30;
      cube.position.y = (Math.random() - 0.5) * 20;
      cube.position.z = (Math.random() - 0.5) * 10;
      
      cube.rotation.x = Math.random() * Math.PI;
      cube.rotation.y = Math.random() * Math.PI;
      
      cube.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2
      };
      
      this.cubes.push(cube);
      this.scene.add(cube);
    }
  }
  
  onResize() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    this.cubes.forEach(cube => {
      cube.rotation.x += cube.userData.rotationSpeed.x;
      cube.rotation.y += cube.userData.rotationSpeed.y;
      
      cube.position.y += Math.sin(time * cube.userData.floatSpeed + cube.userData.floatOffset) * 0.01;
    });
    
    this.renderer.render(this.scene, this.camera);
  }
}

// ========================================
// Contact Section - Animated Particles
// ========================================
class ContactScene {
  constructor() {
    this.container = document.getElementById('contact-particles');
    if (!this.container) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    this.particles = null;
    
    this.init();
  }
  
  init() {
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 30;
    
    this.createParticles();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.animate();
  }
  
  createParticles() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const color1 = new THREE.Color(0x3b82f6);
    const color2 = new THREE.Color(0x06b6d4);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }
  
  onResize() {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    if (this.particles) {
      this.particles.rotation.y = time * 0.1;
      this.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

// ========================================
// GSAP Scroll Animations
// ========================================
class ScrollAnimations {
  constructor() {
    gsap.registerPlugin(ScrollTrigger);
    this.init();
  }
  
  init() {
    // Timeline items
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
      gsap.to(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out'
      });
    });
    
    // Education cards
    gsap.utils.toArray('.education-card').forEach((card, i) => {
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'power2.out'
      });
    });
    
    // Project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power2.out'
      });
    });
    
    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
      gsap.from(header, {
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
    
    // Contact links stagger
    gsap.from('.contact-link', {
      scrollTrigger: {
        trigger: '.contact-links',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      x: -30,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out'
    });
    
    // Parallax effect for hero
    gsap.to('.hero-text', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 100,
      opacity: 0.5
    });
  }
}

// ========================================
// Navigation
// ========================================
class Navigation {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.mobileToggle = document.querySelector('.mobile-toggle');
    this.navLinks = document.querySelector('.nav-links');
    this.links = document.querySelectorAll('.nav-links a');
    
    this.init();
  }
  
  init() {
    // Mobile toggle
    this.mobileToggle?.addEventListener('click', () => {
      this.navLinks.classList.toggle('active');
      const icon = this.mobileToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
    
    // Close mobile menu on link click
    this.links.forEach(link => {
      link.addEventListener('click', () => {
        this.navLinks.classList.remove('active');
        const icon = this.mobileToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      });
    });
    
    // Scroll spy
    window.addEventListener('scroll', () => this.handleScroll());
    
    // Initial check
    this.handleScroll();
  }
  
  handleScroll() {
    const scrollY = window.scrollY;
    
    // Navbar background
    if (scrollY > 50) {
      this.navbar.style.background = 'rgba(15, 23, 42, 0.95)';
    } else {
      this.navbar.style.background = 'rgba(15, 23, 42, 0.8)';
    }
    
    // Update active link
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        this.links.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
}

// ========================================
// Initialize Everything
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Three.js scenes
  new HeroScene();
  new UnityScene();
  new ContactScene();
  
  // Initialize GSAP animations
  new ScrollAnimations();
  
  // Initialize navigation
  new Navigation();
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Performance optimization
window.addEventListener('beforeunload', () => {
  // Clean up Three.js scenes
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    const renderer = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (renderer) {
      renderer.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
});
