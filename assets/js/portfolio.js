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
    this.isVisible = true;
    this.rafId = null;
    this._mousePending = false;
    
    this.init();
  }
  
  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 30;
    
    this.createParticles();
    this.createConnections();
    
    window.addEventListener('resize', () => this.onResize());

    // Throttled, passive mousemove via rAF
    document.addEventListener('mousemove', (e) => {
      if (!this._mousePending) {
        this._mousePending = true;
        requestAnimationFrame(() => {
          this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
          this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
          this._mousePending = false;
        });
      }
    }, { passive: true });

    // Pause animation when hero is not visible
    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && !this.rafId) this.animate();
    }, { threshold: 0 });
    observer.observe(this.container);
    
    this.animate();
  }
  
  createParticles() {
    const particleCount = 50;
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    // Single shared material — no per-particle clone
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8
    });
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(geometry, material);
      
      particle.position.x = (Math.random() - 0.5) * 50;
      particle.position.y = (Math.random() - 0.5) * 50;
      particle.position.z = (Math.random() - 0.5) * 20;
      
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
    // Single shared line material
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.1 
    });
    
    const maxConnections = 3;
    const connectionDistance = 8;
    
    for (let i = 0; i < this.particles.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < this.particles.length && connections < maxConnections; j++) {
        const dist = this.particles[i].position.distanceTo(this.particles[j].position);
        
        if (dist < connectionDistance) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(6);
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          // Each line needs its own material to have independent opacity
          const line = new THREE.Line(geometry, lineMaterial.clone());
          line.userData = { particleA: this.particles[i], particleB: this.particles[j] };
          
          this.lines.push(line);
          this.scene.add(line);
          connections++;
        }
      }
    }
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    this.particles.forEach((particle, i) => {
      particle.position.x += particle.userData.velocity.x;
      particle.position.z += particle.userData.velocity.z;
      
      particle.position.y = particle.userData.originalY + Math.sin(time + i) * 0.5;
      
      // Mouse interaction only for every 5th particle
      if (i % 5 === 0) {
        particle.position.x += this.mouseX * 0.01;
        particle.position.y += this.mouseY * 0.01;
      }
      
      if (Math.abs(particle.position.x) > 25) particle.userData.velocity.x *= -1;
      if (Math.abs(particle.position.y) > 25) particle.userData.velocity.y *= -1;
      if (Math.abs(particle.position.z) > 10) particle.userData.velocity.z *= -1;
    });
    
    this.lines.forEach(line => {
      const positions = line.geometry.attributes.position.array;
      const pA = line.userData.particleA.position;
      const pB = line.userData.particleB.position;
      
      positions[0] = pA.x; positions[1] = pA.y; positions[2] = pA.z;
      positions[3] = pB.x; positions[4] = pB.y; positions[5] = pB.z;
      
      line.geometry.attributes.position.needsUpdate = true;
      
      const distance = pA.distanceTo(pB);
      line.material.opacity = Math.max(0, (10 - distance) / 10) * 0.2;
    });
    
    this.camera.position.x = Math.sin(time * 0.1) * 5;
    this.camera.position.y = Math.cos(time * 0.1) * 5;
    this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
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
    this.camera = null;
    this.renderer = null;
    this.cubes = [];
    this.isVisible = false;
    this.rafId = null;
    this.initialized = false;

    // Use IntersectionObserver to defer init until section is visible,
    // avoiding the 0×0 size problem when canvas is off-screen on load.
    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible) {
        if (!this.initialized) this.init();
        else if (!this.rafId) this.animate();
      } else {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    }, { threshold: 0 });
    observer.observe(this.container);
  }
  
  init() {
    this.initialized = true;
    const w = this.container.offsetWidth || window.innerWidth;
    const h = this.container.offsetHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 20;
    
    this.createCubes();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.animate();
  }
  
  createCubes() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // Single shared material for all cubes
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
    if (!this.camera || !this.renderer) return;
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  
  animate() {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    this.cubes.forEach(cube => {
      cube.rotation.x += cube.userData.rotationSpeed.x;
      cube.rotation.y += cube.userData.rotationSpeed.y;
      cube.position.y += Math.sin(time * cube.userData.floatSpeed + cube.userData.floatOffset) * 0.01;
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer) this.renderer.dispose();
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
    this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / (this.container.offsetHeight || 400), 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.particles = null;
    this.isVisible = false;
    this.rafId = null;
    
    this.init();

    const observer = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
      if (this.isVisible && !this.rafId) this.animate();
    }, { threshold: 0 });
    observer.observe(this.container);
  }
  
  init() {
    const w = this.container.offsetWidth || 400;
    const h = this.container.offsetHeight || 400;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 30;
    
    this.createParticles();
    
    window.addEventListener('resize', () => this.onResize());
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
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  
  animate() {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    if (this.particles) {
      this.particles.rotation.y = time * 0.1;
      this.particles.rotation.x = Math.sin(time * 0.2) * 0.2;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
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
    // Timeline items — fromTo so initial state is guaranteed
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, y: 30 },
        {
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
        }
      );
    });
    
    // Education cards
    gsap.utils.toArray('.education-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        {
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
        }
      );
    });
    
    // Project cards
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        {
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
        }
      );
    });
    
    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
      gsap.fromTo(header,
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out'
        }
      );
    });
    
    // Contact links stagger
    gsap.fromTo('.contact-link',
      { opacity: 0, x: -30 },
      {
        scrollTrigger: {
          trigger: '.contact-links',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      }
    );
    
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

    // Cache section offsets once; update on resize
    this.sectionData = [];
    this.cacheSectionOffsets();
    window.addEventListener('resize', () => this.cacheSectionOffsets());
    
    this.init();
  }

  cacheSectionOffsets() {
    const sections = document.querySelectorAll('section[id]');
    this.sectionData = Array.from(sections).map(section => ({
      id: section.getAttribute('id'),
      top: section.offsetTop - 100,
      height: section.offsetHeight
    }));
  }
  
  init() {
    this.mobileToggle?.addEventListener('click', () => {
      this.navLinks.classList.toggle('active');
      const icon = this.mobileToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
    
    this.links.forEach(link => {
      link.addEventListener('click', () => {
        this.navLinks.classList.remove('active');
        const icon = this.mobileToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      });
    });
    
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    
    this.handleScroll();
  }
  
  handleScroll() {
    const scrollY = window.scrollY;
    
    this.navbar.style.background = scrollY > 50
      ? 'rgba(15, 23, 42, 0.95)'
      : 'rgba(15, 23, 42, 0.8)';
    
    // Use cached offsets — no layout reflow on every scroll
    this.sectionData.forEach(({ id, top, height }) => {
      if (scrollY >= top && scrollY < top + height) {
        this.links.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
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
  new HeroScene();
  new UnityScene();
  new ContactScene();
  
  new ScrollAnimations();
  
  new Navigation();
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// Clean up WebGL contexts on page unload
window.addEventListener('beforeunload', () => {
  document.querySelectorAll('canvas').forEach(canvas => {
    const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (ctx) ctx.getExtension('WEBGL_lose_context')?.loseContext();
  });
});
