import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Synchronizes camera, robot position/rotation, exploded-view assembly,
 * and engineering callout cards across all 5 page sections.
 */
export function initScrollChoreography(sceneManager, robotModel) {
  const isMobile = () => window.matchMedia('(max-width: 1024px)').matches;
  const explodeProxy = { value: 0 };

  const applyExplode = () => {
    robotModel.setExplode(explodeProxy.value);
  };

  // Initial Hero state
  sceneManager.scrollState.robotX = isMobile() ? 0 : 1.38;
  sceneManager.scrollState.rotY = -0.52;
  sceneManager.scrollState.rotX = 0.08;
  sceneManager.scrollState.scale = isMobile() ? 0.78 : 1.02;
  sceneManager.scrollState.parallaxWeight = 1.0;

  // SECTION 2: DETAY / PARÇALANMA (EXPLODED VIEW)
  const explodedTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#muhendislik',
      start: 'top 80%',
      end: 'bottom 55%',
      scrub: 1.1
    }
  });

  explodedTl
    .to(
      sceneManager.scrollState,
      {
        robotX: 0,
        rotY: 0.42,
        rotX: 0.18,
        scale: isMobile() ? 0.72 : 0.92,
        parallaxWeight: 0.45,
        ease: 'none'
      },
      0
    )
    .to(
      sceneManager.camera.position,
      {
        x: 0,
        y: 1.55,
        z: isMobile() ? 6.8 : 5.4,
        ease: 'none'
      },
      0
    )
    .to(
      explodeProxy,
      {
        value: 1,
        ease: 'power1.inOut',
        onUpdate: applyExplode
      },
      0.1
    );

  // Stagger in the 4 engineering callout cards as robot explodes
  gsap.from('.callout-card', {
    y: 28,
    opacity: 0,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#exploded-callouts',
      start: 'top 78%',
      once: true
    }
  });

  // SECTION 3: VARYASYON / TAKIM SEÇİCİ
  const variantsTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#takimlar',
      start: 'top 85%',
      end: 'top 20%',
      scrub: 1.1
    }
  });

  variantsTl
    .to(
      explodeProxy,
      {
        value: 0,
        ease: 'power2.out',
        onUpdate: applyExplode
      },
      0
    )
    .to(
      sceneManager.scrollState,
      {
        robotX: isMobile() ? 0 : 1.55,
        rotY: -1.12,
        rotX: 0.12,
        scale: isMobile() ? 0.76 : 0.98,
        parallaxWeight: 0.65,
        ease: 'none'
      },
      0
    )
    .to(
      sceneManager.camera.position,
      {
        x: 0,
        y: 1.25,
        z: isMobile() ? 6.6 : 5.7,
        ease: 'none'
      },
      0
    );

  // SECTION 4: TEKNİK İNCELEME / ARKA YÜZ (Cinematic 180° flip to rear spec plate)
  const inspectTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#teknik-inceleme',
      start: 'top 82%',
      end: 'top 18%',
      scrub: 1.1
    }
  });

  inspectTl
    .to(
      sceneManager.scrollState,
      {
        robotX: isMobile() ? 0 : 1.22,
        rotY: Math.PI, // Arka teknik plaka doğrudan kameraya döner
        rotX: 0.04,
        scale: isMobile() ? 0.84 : 1.06,
        parallaxWeight: 0.12,
        ease: 'none'
      },
      0
    )
    .to(
      sceneManager.camera.position,
      {
        x: 0,
        y: 0.92,
        z: isMobile() ? 5.6 : 4.55,
        ease: 'none'
      },
      0
    );

  // SECTION 5: KAPANIŞ / GENİŞ AÇI KOMPOZİSYON
  const closingTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#kapanis',
      start: 'top 85%',
      end: 'top 25%',
      scrub: 1.1
    }
  });

  closingTl
    .to(
      sceneManager.scrollState,
      {
        robotX: 0,
        rotY: Math.PI * 1.75,
        rotX: 0.14,
        scale: isMobile() ? 0.68 : 0.84,
        parallaxWeight: 0.4,
        ease: 'none'
      },
      0
    )
    .to(
      sceneManager.camera.position,
      {
        x: 0,
        y: 1.75,
        z: isMobile() ? 8.2 : 7.4,
        ease: 'none'
      },
      0
    );

  // Return helper for manual inspection buttons in Section 4
  return {
    setManualExplode(targetValue) {
      gsap.to(explodeProxy, {
        value: targetValue,
        duration: 0.85,
        ease: 'power2.inOut',
        onUpdate: applyExplode
      });
    },
    getExplodeValue() {
      return explodeProxy.value;
    }
  };
}
