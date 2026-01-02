// Three.js 3D 가방 모델링 및 인터랙션
let scene, camera, renderer, bag;
let currentColor = '#8B4513';

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
    container.appendChild(renderer.domElement);

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

    // 3D 가방 모델 생성
    createBagModel();

    // 애니메이션 루프
    animate();

    // 윈도우 리사이즈 처리
    window.addEventListener('resize', onWindowResize);

    // 마우스 인터랙션
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);
}

// 3D 백팩 모델 생성
function createBagModel() {
    const bagGroup = new THREE.Group();

    // 백팩 본체 - 더 현실적인 형태
    const bagShape = new THREE.Shape();
    bagShape.moveTo(-1, -1.2);
    bagShape.lineTo(-1, 1.2);
    bagShape.quadraticCurveTo(-1, 1.3, -0.9, 1.3);
    bagShape.lineTo(0.9, 1.3);
    bagShape.quadraticCurveTo(1, 1.3, 1, 1.2);
    bagShape.lineTo(1, -1.2);
    bagShape.quadraticCurveTo(1, -1.3, 0.9, -1.3);
    bagShape.lineTo(-0.9, -1.3);
    bagShape.quadraticCurveTo(-1, -1.3, -1, -1.2);

    const extrudeSettings = {
        depth: 0.8,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 0.05,
        bevelThickness: 0.05
    };

    const bagGeometry = new THREE.ExtrudeGeometry(bagShape, extrudeSettings);
    const bagMaterial = new THREE.MeshPhongMaterial({ 
        color: currentColor,
        shininess: 30,
        roughness: 0.7,
        metalness: 0.1
    });
    const bagMesh = new THREE.Mesh(bagGeometry, bagMaterial);
    bagMesh.rotation.z = Math.PI / 2;
    bagMesh.position.set(0, 0, 0);
    bagMesh.castShadow = true;
    bagMesh.receiveShadow = true;
    bagGroup.add(bagMesh);

    // 백팩 상단 손잡이 - 더 현실적인 디자인
    const handleShape = new THREE.Shape();
    handleShape.moveTo(-0.3, 0);
    handleShape.quadraticCurveTo(-0.3, 0.2, -0.2, 0.3);
    handleShape.lineTo(0.2, 0.3);
    handleShape.quadraticCurveTo(0.3, 0.2, 0.3, 0);
    handleShape.lineTo(0.3, -0.05);
    handleShape.quadraticCurveTo(0.15, -0.1, 0, -0.1);
    handleShape.quadraticCurveTo(-0.15, -0.1, -0.3, -0.05);
    handleShape.lineTo(-0.3, 0);

    const handleExtrude = {
        depth: 0.08,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02
    };

    const handleGeometry = new THREE.ExtrudeGeometry(handleShape, handleExtrude);
    const handleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c2c2c,
        shininess: 80,
        roughness: 0.3
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 1.4, 0.45);
    handle.rotation.x = Math.PI / 2;
    handle.castShadow = true;
    bagGroup.add(handle);

    // 메인 지퍼 - 더 디테일한 디자인
    const zipperGeometry = new THREE.BoxGeometry(2.2, 0.08, 0.08);
    const zipperMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.1
    });
    const zipper = new THREE.Mesh(zipperGeometry, zipperMaterial);
    zipper.position.set(0, 1.35, 0.44);
    bagGroup.add(zipper);

    // 지퍼 풀러
    const pullerGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.1);
    const pullerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
    });
    const puller = new THREE.Mesh(pullerGeometry, pullerMaterial);
    puller.position.set(0.5, 1.35, 0.48);
    bagGroup.add(puller);

    // 전면 포켓 - 더 크고 현실적인 디자인
    const pocketShape = new THREE.Shape();
    pocketShape.moveTo(-0.7, 0);
    pocketShape.lineTo(-0.7, 0.6);
    pocketShape.quadraticCurveTo(-0.7, 0.65, -0.65, 0.65);
    pocketShape.lineTo(0.65, 0.65);
    pocketShape.quadraticCurveTo(0.7, 0.65, 0.7, 0.6);
    pocketShape.lineTo(0.7, 0);
    pocketShape.quadraticCurveTo(0.7, -0.05, 0.65, -0.05);
    pocketShape.lineTo(-0.65, -0.05);
    pocketShape.quadraticCurveTo(-0.7, -0.05, -0.7, 0);

    const pocketExtrude = {
        depth: 0.15,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.03,
        bevelThickness: 0.03
    };

    const pocketGeometry = new THREE.ExtrudeGeometry(pocketShape, pocketExtrude);
    const pocketMaterial = new THREE.MeshPhongMaterial({ 
        color: currentColor,
        shininess: 25,
        roughness: 0.8
    });
    const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
    pocket.position.set(0, 0.2, 0.45);
    pocket.rotation.z = Math.PI / 2;
    bagGroup.add(pocket);

    // 포켓 지퍼
    const pocketZipperGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.05);
    const pocketZipper = new THREE.Mesh(zipperGeometry, zipperMaterial);
    pocketZipper.position.set(0, 0.5, 0.53);
    bagGroup.add(pocketZipper);

    // 측면 포켓 (좌측)
    const sidePocketShape = new THREE.Shape();
    sidePocketShape.moveTo(-0.3, 0);
    sidePocketShape.lineTo(-0.3, 0.4);
    sidePocketShape.quadraticCurveTo(-0.3, 0.45, -0.25, 0.45);
    sidePocketShape.lineTo(0.25, 0.45);
    sidePocketShape.quadraticCurveTo(0.3, 0.45, 0.3, 0.4);
    sidePocketShape.lineTo(0.3, 0);
    sidePocketShape.quadraticCurveTo(0.3, -0.05, 0.25, -0.05);
    sidePocketShape.lineTo(-0.25, -0.05);
    sidePocketShape.quadraticCurveTo(-0.3, -0.05, -0.3, 0);

    const sidePocketGeometry = new THREE.ExtrudeGeometry(sidePocketShape, pocketExtrude);
    const sidePocket = new THREE.Mesh(sidePocketGeometry, pocketMaterial);
    sidePocket.position.set(0.9, 0, 0);
    sidePocket.rotation.z = Math.PI / 2;
    bagGroup.add(sidePocket);

    // 어깨 끈 - 더 현실적인 디자인
    const strapWidth = 0.08;
    const strapThickness = 0.04;
    
    // 좌측 어깨 끈
    const strap1Curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.95, 1.3, 0),
        new THREE.Vector3(-1.1, 1.0, 0.2),
        new THREE.Vector3(-1.0, 0.5, 0.3),
        new THREE.Vector3(-0.8, 0, 0.2),
        new THREE.Vector3(-0.6, -0.5, 0.1),
        new THREE.Vector3(-0.4, -1.0, 0)
    ]);

    const strap1Geometry = new THREE.TubeGeometry(strap1Curve, 20, strapWidth, 8, false);
    const strapMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c2c2c,
        shininess: 40,
        roughness: 0.6
    });
    const strap1 = new THREE.Mesh(strap1Geometry, strapMaterial);
    strap1.castShadow = true;
    bagGroup.add(strap1);

    // 우측 어깨 끈
    const strap2Curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.95, 1.3, 0),
        new THREE.Vector3(1.1, 1.0, 0.2),
        new THREE.Vector3(1.0, 0.5, 0.3),
        new THREE.Vector3(0.8, 0, 0.2),
        new THREE.Vector3(0.6, -0.5, 0.1),
        new THREE.Vector3(0.4, -1.0, 0)
    ]);

    const strap2Geometry = new THREE.TubeGeometry(strap2Curve, 20, strapWidth, 8, false);
    const strap2 = new THREE.Mesh(strap2Geometry, strapMaterial);
    strap2.castShadow = true;
    bagGroup.add(strap2);

    // 어깨 패드
    const padGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const padMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a1a,
        shininess: 20,
        roughness: 0.8
    });
    
    const pad1 = new THREE.Mesh(padGeometry, padMaterial);
    pad1.position.set(-1.1, 1.0, 0.2);
    pad1.rotation.z = Math.PI / 6;
    bagGroup.add(pad1);

    const pad2 = new THREE.Mesh(padGeometry, padMaterial);
    pad2.position.set(1.1, 1.0, 0.2);
    pad2.rotation.z = -Math.PI / 6;
    bagGroup.add(pad2);

    // 백팩 바닥 보강판
    const baseGeometry = new THREE.BoxGeometry(2.1, 0.08, 0.9);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a1a,
        shininess: 15,
        roughness: 0.9
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.35, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    bagGroup.add(base);

    // 백팩 로고 (전면)
    const logoGeometry = new THREE.PlaneGeometry(0.3, 0.15);
    const logoMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        emissive: 0x444444,
        emissiveIntensity: 0.2
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 0.8, 0.41);
    bagGroup.add(logo);

    // 반사 방지 스티커
    const reflectGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.02);
    const reflectMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    const reflect1 = new THREE.Mesh(reflectGeometry, reflectMaterial);
    reflect1.position.set(0.4, -1.2, 0.41);
    bagGroup.add(reflect1);

    const reflect2 = new THREE.Mesh(reflectGeometry, reflectMaterial);
    reflect2.position.set(-0.4, -1.2, 0.41);
    bagGroup.add(reflect2);

    bag = bagGroup;
    scene.add(bag);
}

// 가방 색상 변경
function changeBagColor(color) {
    if (!bag) return;
    
    currentColor = color;
    
    // 가방 본체와 포켓 색상 변경
    bag.children.forEach((child, index) => {
        if (index === 0 || index === 3) { // 본체와 포켓
            child.material.color.set(color);
        }
    });
}

// 애니메이션 루프 - 향상된 움직임
function animate() {
    requestAnimationFrame(animate);
    
    if (bag) {
        // 더 부드러운 자동 회전
        bag.rotation.y += 0.003;
        
        // 미세한 상하 움직임 추가
        bag.position.y = Math.sin(Date.now() * 0.001) * 0.05;
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
}

// 마우스 인터랙션 - 향상된 반응성
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let targetPositionY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
let currentPositionY = 0;

function onMouseMove(event) {
    const container = document.getElementById('threejs-container');
    const rect = container.getBoundingClientRect();
    
    mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    targetRotationY = mouseX * Math.PI * 0.8;
    targetRotationX = mouseY * Math.PI * 0.3;
    targetPositionY = mouseY * 0.2;
}

function onMouseLeave() {
    targetRotationX = 0;
    targetRotationY = 0;
    targetPositionY = 0;
}

// 향상된 마우스 인터랙션 업데이트
function updateMouseInteraction() {
    if (bag) {
        // 부드러운 보간을 통한 자연스러운 움직임
        currentRotationX += (targetRotationX - currentRotationX) * 0.08;
        currentRotationY += (targetRotationY - currentRotationY) * 0.08;
        currentPositionY += (targetPositionY - currentPositionY) * 0.08;
        
        // 회전과 위치 적용
        bag.rotation.x = currentRotationX;
        bag.rotation.y = bag.rotation.y + currentRotationY * 0.1; // 자동 회전과 결합
        bag.position.y = currentPositionY + Math.sin(Date.now() * 0.001) * 0.05; // 부유 효과와 결합
    }
    requestAnimationFrame(updateMouseInteraction);
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
    
    // 마우스 인터랙션 시작
    updateMouseInteraction();
    
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
