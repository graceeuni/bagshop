// Three.js 3D 백팩 모델링 및 인터랙션
let scene, camera, renderer, bag, controls;
let currentColor = '#8B4513';
let gltfModel = null;
let originalMaterials = new Map();

// Three.js 초기화
function initThreeJS() {
    const container = document.getElementById('threejs-container');
    if (!container) return;

    // 씬 생성
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 카메라 설정
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    // 렌더러 설정
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // OrbitControls 설정
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    // 향상된 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 메인 조명 (부드러운 그림자)
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

    // 보조 조명 (상단)
    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // 측면 조명 (좌측)
    const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.2);
    sideLight1.position.set(-5, 2, 0);
    scene.add(sideLight1);

    // 측면 조명 (우측)
    const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    sideLight2.position.set(5, 2, 0);
    scene.add(sideLight2);

    // 후광 효과 (배경 조명)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // GLB 모델 로드
    loadGLBModel();

    // 애니메이션 루프
    animate();

    // 윈도우 리사이즈 처리
    window.addEventListener('resize', onWindowResize);
}

// GLB 모델 로드 함수
function loadGLBModel() {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'bagpack.glb',
        function (gltf) {
            gltfModel = gltf.scene;
            
            // 모델 크기 조절
            gltfModel.scale.set(1.5, 1.5, 1.5);
            
            // 모델 위치 조절
            gltfModel.position.set(0, 0, 0);
            
            // 모델 회전 조절 (필요시)
            gltfModel.rotation.set(0, 0, 0);
            
            // 그림자 설정
            gltfModel.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // 원본 재질 저장
                    originalMaterials.set(child.uuid, child.material.clone());
                }
            });
            
            scene.add(gltfModel);
            bag = gltfModel;
            
            console.log('GLB 모델이 성공적으로 로드되었습니다.');
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% 로드됨');
        },
        function (error) {
            console.error('GLB 모델 로드 중 오류 발생:', error);
            // GLB 모델 로드 실패시 기본 모델 생성
            createFallbackModel();
        }
    );
}

// 폴백 모델 (GLB 로드 실패시 사용)
function createFallbackModel() {
    console.log('폴백 모델을 생성합니다.');
    createBagModel();
}

// 가방 색상 변경 (GLB 모델용)
function changeBagColor(color) {
    if (!bag) return;
    
    currentColor = color;
    
    if (gltfModel) {
        // GLB 모델의 색상 변경
        gltfModel.traverse(function (child) {
            if (child.isMesh && child.material) {
                // 메인 백팩 본체 색상 변경 (메인 재질만)
                if (child.material.name && 
                    (child.material.name.toLowerCase().includes('main') || 
                     child.material.name.toLowerCase().includes('body') ||
                     child.material.name.toLowerCase().includes('fabric'))) {
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.color.set(color);
                        });
                    } else {
                        child.material.color.set(color);
                    }
                }
                
                // 포켓 색상 변경
                if (child.material.name && 
                    child.material.name.toLowerCase().includes('pocket')) {
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.color.set(color);
                        });
                    } else {
                        child.material.color.set(color);
                    }
                }
            }
        });
    } else {
        // 폴백 모델의 색상 변경
        bag.children.forEach((child, index) => {
            if (index === 0 || index === 3) { // 본체와 포켓
                child.material.color.set(color);
            }
        });
    }
}

// 애니메이션 루프 - OrbitControls용
function animate() {
    requestAnimationFrame(animate);
    
    // OrbitControls 업데이트
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}

// 윈도우 리사이즈 처리
function onWindowResize() {
    const container = document.getElementById('threejs-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // OrbitControls 업데이트
    if (controls) {
        controls.update();
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
            // 활성 상태 제거
            colorButtons.forEach(b => b.classList.remove('active'));
            
            // 현재 버튼 활성화
            this.classList.add('active');
            
            // 가방 색상 변경
            const color = this.dataset.color;
            changeBagColor(color);
        });
    });
}

// 장바구니 기능
function initCartFunctionality() {
    const addToCartBtn = document.querySelector('.add-to-cart');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
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
    }
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
                        <img src="https://via.placeholder.com/300x300/${this.getRandomColor()}/FFFFFF?text=Bag+${currentCards + i}" alt="가방 ${currentCards + i}">
                    </div>
                    <div class="product-details">
                        <h4>새로운 상품 ${currentCards + i}</h4>
                        <p class="price">₩${this.getRandomPrice()}</p>
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
    // Three.js 초기화
    initThreeJS();
    
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
