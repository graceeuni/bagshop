// Three.js 3D 캐러셀 시스템
let scenes = {};
let cameras = {};
let renderers = {};
let models = {};
let controls = {};
let currentColors = {
    bagpack: '#8B4513',
    crossbag: '#8B4513'
};
let originalMaterials = new Map();

// 3D 캐러셀 클래스
class Carousel3D {
    constructor() {
        this.currentIndex = 0;
        this.totalSlides = 2;
        this.isAnimating = false;
        this.autoPlayInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initThreeJS();
        this.startAutoPlay();
    }

    setupEventListeners() {
        // 캐러셀 버튼
        document.querySelectorAll('.carousel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('prev-btn')) {
                    this.prevSlide();
                } else {
                    this.nextSlide();
                }
            });
        });

        // 인디케이터 버튼
        document.querySelectorAll('.indicator').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const slideIndex = parseInt(btn.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });

        // 터치 지원
        this.setupTouchSupport();
    }

    setupTouchSupport() {
        const carousel = document.querySelector('.featured-carousel');
        let startX = 0;
        let endX = 0;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
    }

    initThreeJS() {
        // 백팩 모델 초기화
        this.initModel('bagpack');
        // 크로스백 모델 초기화
        this.initModel('crossbag');
    }

    initModel(modelName) {
        const container = document.getElementById(`threejs-container-${modelName}`);
        if (!container) return;

        // 씬 생성
        scenes[modelName] = new THREE.Scene();
        scenes[modelName].background = new THREE.Color(0xf0f0f0);

        // 카메라 설정
        cameras[modelName] = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        cameras[modelName].position.set(0, 0, 4);

        // 렌더러 설정
        renderers[modelName] = new THREE.WebGLRenderer({ antialias: true });
        renderers[modelName].setSize(container.clientWidth, container.clientHeight);
        renderers[modelName].shadowMap.enabled = true;
        renderers[modelName].shadowMap.type = THREE.PCFSoftShadowMap;
        renderers[modelName].outputEncoding = THREE.sRGBEncoding;
        renderers[modelName].toneMapping = THREE.ACESFilmicToneMapping;
        renderers[modelName].toneMappingExposure = 1.0;
        container.appendChild(renderers[modelName].domElement);

        // OrbitControls 설정
        controls[modelName] = new THREE.OrbitControls(cameras[modelName], renderers[modelName].domElement);
        controls[modelName].enableDamping = true;
        controls[modelName].dampingFactor = 0.05;
        controls[modelName].enableZoom = true;
        controls[modelName].minDistance = 2;
        controls[modelName].maxDistance = 10;
        controls[modelName].maxPolarAngle = Math.PI / 2;
        controls[modelName].autoRotate = true;
        controls[modelName].autoRotateSpeed = 2.0;

        // 조명 설정
        this.setupLighting(scenes[modelName]);

        // GLB 모델 로드
        this.loadGLBModel(modelName);

        // 애니메이션 루프
        this.animate(modelName);

        // 윈도우 리사이즈 처리
        window.addEventListener('resize', () => this.onWindowResize(modelName));
    }

    setupLighting(scene) {
        // 환경광
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // 메인 조명
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);

        // 보조 조명
        const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
        topLight.position.set(0, 10, 0);
        scene.add(topLight);

        const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.2);
        sideLight1.position.set(-5, 2, 0);
        scene.add(sideLight1);

        const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
        sideLight2.position.set(5, 2, 0);
        scene.add(sideLight2);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(-5, 0, -5);
        scene.add(rimLight);
    }

    loadGLBModel(modelName) {
        const loader = new THREE.GLTFLoader();
        const modelFile = modelName === 'bagpack' ? 'bagpack.glb' : 'crossbag.glb';
        
        loader.load(
            modelFile,
            (gltf) => {
                models[modelName] = gltf.scene;
                
                // 모델 크기 조절
                models[modelName].scale.set(2.0, 2.0, 2.0);
                models[modelName].position.set(0, 0, 0);
                
                // 그림자 설정
                models[modelName].traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        originalMaterials.set(`${modelName}-${child.uuid}`, child.material.clone());
                    }
                });
                
                scenes[modelName].add(models[modelName]);
                console.log(`${modelName} 모델이 성공적으로 로드되었습니다.`);
            },
            (xhr) => {
                console.log(`${modelName}: ${(xhr.loaded / xhr.total * 100)}% 로드됨`);
            },
            (error) => {
                console.error(`${modelName} 모델 로드 중 오류 발생:`, error);
                // 폴백 모델 생성
                this.createFallbackModel(modelName);
            }
        );
    }

    createFallbackModel(modelName) {
        console.log(`${modelName} 폴백 모델을 생성합니다.`);
        // 간단한 박스 모델 생성
        const geometry = new THREE.BoxGeometry(2, 2.5, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: currentColors[modelName],
            shininess: 30
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        models[modelName] = new THREE.Group();
        models[modelName].add(mesh);
        scenes[modelName].add(models[modelName]);
    }

    animate(modelName) {
        const render = () => {
            requestAnimationFrame(render);
            
            if (controls[modelName]) {
                controls[modelName].update();
            }
            
            if (renderers[modelName] && scenes[modelName] && cameras[modelName]) {
                renderers[modelName].render(scenes[modelName], cameras[modelName]);
            }
        };
        render();
    }

    onWindowResize(modelName) {
        const container = document.getElementById(`threejs-container-${modelName}`);
        if (!container) return;
        
        if (cameras[modelName] && renderers[modelName]) {
            cameras[modelName].aspect = container.clientWidth / container.clientHeight;
            cameras[modelName].updateProjectionMatrix();
            renderers[modelName].setSize(container.clientWidth, container.clientHeight);
            
            if (controls[modelName]) {
                controls[modelName].update();
            }
        }
    }

    prevSlide() {
        if (this.isAnimating) return;
        this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }

    nextSlide() {
        if (this.isAnimating) return;
        this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
        this.updateCarousel();
    }

    goToSlide(index) {
        if (this.isAnimating || index === this.currentIndex) return;
        this.currentIndex = index;
        this.updateCarousel();
    }

    updateCarousel() {
        this.isAnimating = true;
        
        // 슬라이드 업데이트
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentIndex);
        });
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
        
        // 슬라이더 위치 업데이트
        const wrapper = document.querySelector('.carousel-wrapper');
        wrapper.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        // 활성 모델의 컨트롤러 활성화
        this.updateActiveControls();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
        
        // 오토플레이 재설정
        this.resetAutoPlay();
    }

    updateActiveControls() {
        const activeSlide = document.querySelector('.carousel-slide.active');
        const modelName = activeSlide.dataset.model;
        
        // 해당 모델의 컨트롤러만 활성화
        Object.keys(controls).forEach(key => {
            if (controls[key]) {
                controls[key].enabled = (key === modelName);
            }
        });
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    // 색상 변경 기능
    changeModelColor(modelName, color) {
        if (!models[modelName]) return;
        
        currentColors[modelName] = color;
        
        if (models[modelName] && models[modelName].traverse) {
            models[modelName].traverse(function (child) {
                if (child.isMesh && child.material) {
                    // 재질 이름 확인 및 색상 변경
                    const materialName = (child.material.name || '').toLowerCase();
                    
                    // 가방 본체, 포켓, 패브릭 등 메인 부품만 색상 변경
                    // 금속, 지퍼, 하드웨어 부품은 제외
                    const isAccessory = materialName.includes('zipper') || 
                                      materialName.includes('buckle') || 
                                      materialName.includes('hardware') ||
                                      materialName.includes('metal') ||
                                      materialName.includes('strap') ||
                                      materialName.includes('handle') ||
                                      materialName.includes('button') ||
                                      materialName.includes('clasp');
                    
                    // 메인 가방 부품에만 색상 적용
                    if (!isAccessory) {
                        // 재질 속성 강제 업데이트
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => {
                                material.color.set(color);
                                material.emissive = new THREE.Color(0x000000);
                                material.emissiveIntensity = 0;
                                material.metalness = 0.1;
                                material.roughness = 0.8;
                                material.needsUpdate = true;
                            });
                        } else {
                            child.material.color.set(color);
                            child.material.emissive = new THREE.Color(0x000000);
                            child.material.emissiveIntensity = 0;
                            child.material.metalness = 0.1;
                            child.material.roughness = 0.8;
                            child.material.needsUpdate = true;
                        }
                    }
                }
            });
            
            // 씬의 모든 객체를 강제로 업데이트
            scenes[modelName].traverse(function (child) {
                if (child.isMesh) {
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();
                }
            });
            
            // 즉시 렌더링 업데이트
            if (renderers[modelName]) {
                renderers[modelName].render(scenes[modelName], cameras[modelName]);
            }
        }
    }
}

// 인기상품 슬라이더 기능
class ProductSlider {
    constructor() {
        this.slider = document.querySelector('.product-slider');
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.currentIndex = 0;
        this.cardWidth = 332; // 300px + 32px gap
        this.visibleCards = this.getVisibleCards();
        this.totalCards = document.querySelectorAll('.product-card').length;
        
        this.init();
    }

    getVisibleCards() {
        const containerWidth = document.querySelector('.slider-wrapper').offsetWidth;
        return Math.floor(containerWidth / this.cardWidth);
    }

    init() {
        if (this.prevBtn && this.nextBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
        }
        
        window.addEventListener('resize', () => {
            this.visibleCards = this.getVisibleCards();
            this.updateSliderPosition();
        });
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateSliderPosition();
        }
    }

    next() {
        const maxIndex = Math.max(0, this.totalCards - this.visibleCards);
        if (this.currentIndex < maxIndex) {
            this.currentIndex++;
            this.updateSliderPosition();
        }
    }

    updateSliderPosition() {
        const offset = this.currentIndex * this.cardWidth;
        this.slider.style.transform = `translateX(-${offset}px)`;
        this.updateButtonStates();
    }

    updateButtonStates() {
        const maxIndex = Math.max(0, this.totalCards - this.visibleCards);
        
        if (this.prevBtn) {
            this.prevBtn.style.opacity = this.currentIndex === 0 ? '0.5' : '1';
            this.prevBtn.style.cursor = this.currentIndex === 0 ? 'not-allowed' : 'pointer';
        }
        
        if (this.nextBtn) {
            this.nextBtn.style.opacity = this.currentIndex >= maxIndex ? '0.5' : '1';
            this.nextBtn.style.cursor = this.currentIndex >= maxIndex ? 'not-allowed' : 'pointer';
        }
    }
}

// 색상 선택 기능
function initColorOptions() {
    const colorButtons = document.querySelectorAll('.color-btn');
    
    colorButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modelName = this.dataset.model;
            const color = this.dataset.color;
            
            // 활성 상태 제거 (해당 모델의 버튼만)
            document.querySelectorAll(`.color-btn[data-model="${modelName}"]`).forEach(b => {
                b.classList.remove('active');
            });
            
            // 현재 버튼 활성화
            this.classList.add('active');
            
            // 시각적 피드백 추가
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
            
            // 해당 모델의 색상 변경
            if (window.carousel3D) {
                window.carousel3D.changeModelColor(modelName, color);
                
                // 색상 변경 성공 피드백
                console.log(`${modelName} 모델의 색상을 ${color}로 변경했습니다.`);
            }
        });
    });
}

// 장바구니 기능
function initCartFunctionality() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productName = this.dataset.product;
            
            // 장바구니에 상품 추가 시뮬레이션
            this.textContent = '장바구니에 추가됨!';
            this.style.background = '#27ae60';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.textContent = '장바구니에 담기';
                this.style.background = 'white';
                this.style.color = '#764ba2';
            }, 2000);
            
            // 카트 아이콘 애니메이션
            const cartIcon = document.querySelector('.fa-shopping-cart');
            if (cartIcon) {
                cartIcon.style.color = '#27ae60';
                cartIcon.style.transform = 'scale(1.2)';
                
                setTimeout(() => {
                    cartIcon.style.color = '#555';
                    cartIcon.style.transform = 'scale(1)';
                }, 1000);
            }
        });
    });
}

// 더보기 버튼 기능
function initMoreButton() {
    const moreBtn = document.querySelector('.more-btn');
    
    if (moreBtn) {
        moreBtn.addEventListener('click', function() {
            // 추가 상품 로드 시뮬레이션
            const slider = document.querySelector('.product-slider');
            const currentCards = slider.querySelectorAll('.product-card').length;
            
            for (let i = 1; i <= 3; i++) {
                const newCard = document.createElement('div');
                newCard.className = 'product-card';
                newCard.innerHTML = `
                    <div class="product-image">
                        <img src="https://via.placeholder.com/300x300/${getRandomColor()}/FFFFFF?text=Bag+${currentCards + i}" alt="가방 ${currentCards + i}">
                    </div>
                    <div class="product-details">
                        <h4>새로운 상품 ${currentCards + i}</h4>
                        <p class="price">₩${getRandomPrice()}</p>
                    </div>
                `;
                slider.appendChild(newCard);
            }
            
            // 슬라이더 재초기화
            if (window.productSlider) {
                window.productSlider.totalCards = slider.querySelectorAll('.product-card').length;
                window.productSlider.updateButtonStates();
            }
            
            this.textContent = '상품이 추가되었습니다!';
            setTimeout(() => {
                this.innerHTML = '더보기 <i class="fas fa-arrow-right"></i>';
            }, 2000);
        });
    }
}

// 랜덤 색상 생성
function getRandomColor() {
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 랜덤 가격 생성
function getRandomPrice() {
    const prices = [89000, 99000, 129000, 159000, 189000, 229000];
    return prices[Math.floor(Math.random() * prices.length)].toLocaleString();
}

// 부드러운 스크롤 기능
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 3D 캐러셀 초기화
    window.carousel3D = new Carousel3D();
    
    // 색상 선택 기능 초기화
    initColorOptions();
    
    // 장바구니 기능 초기화
    initCartFunctionality();
    
    // 인기상품 슬라이더 초기화
    window.productSlider = new ProductSlider();
    
    // 더보기 버튼 초기화
    initMoreButton();
    
    // 부드러운 스크롤 초기화
    initSmoothScroll();
});
