import * as SPLAT from "gsplat";

class GSplatViewer {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentSplat = null;
        this.animationId = null;
        this.fpsCounter = 0;
        this.lastTime = performance.now();
        this.defaultCameraPosition = { x: 0, y: 0, z: 5 };
        this.defaultCameraTarget = { x: 0, y: 0, z: 0 };
        
        this.init();
        this.setupEventListeners();
    }

    async init() {
        try {
            console.log('Инициализация gsplat.js...');
            
            // Создаем основные компоненты gsplat.js
            this.scene = new SPLAT.Scene();
            this.camera = new SPLAT.Camera();
            this.renderer = new SPLAT.WebGLRenderer(this.canvas);
            this.controls = new SPLAT.OrbitControls(this.camera, this.canvas);

            // Настройка компонентов
            this.setupCamera();
            this.setupRenderer();
            this.setupControls();

            // Запуск рендер-лупа
            this.startRenderLoop();

            // Обработка изменения размера окна
            window.addEventListener('resize', () => {
                this.handleResize();
            });

            this.showStatus('gsplat.js успешно инициализирован');
            console.log('gsplat.js инициализирован успешно');
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError(`Ошибка инициализации gsplat.js: ${error.message}`);
        }
    }

    setupCamera() {
        try {
            // Настройка камеры с безопасными проверками
            if (this.camera.position) {
                if (typeof this.camera.position.set === 'function') {
                    this.camera.position.set(this.defaultCameraPosition.x, this.defaultCameraPosition.y, this.defaultCameraPosition.z);
                } else {
                    this.camera.position.x = this.defaultCameraPosition.x;
                    this.camera.position.y = this.defaultCameraPosition.y;
                    this.camera.position.z = this.defaultCameraPosition.z;
                }
            }

            // Настройка параметров камеры
            if (this.camera.near !== undefined) this.camera.near = 0.1;
            if (this.camera.far !== undefined) this.camera.far = 1000;
            if (this.camera.fov !== undefined) this.camera.fov = 75;

            console.log('Камера настроена:', this.camera);
        } catch (error) {
            console.warn('Предупреждение при настройке камеры:', error);
        }
    }

    setupRenderer() {
        try {
            // Настройка рендерера
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
            
            // Проверяем доступные методы рендерера
            if (typeof this.renderer.setClearColor === 'function') {
                this.renderer.setClearColor(0x0f0f23);
            }
            
            // Настройка качества
            if (typeof this.renderer.setPixelRatio === 'function') {
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }
            
            console.log('Рендерер настроен');
        } catch (error) {
            console.warn('Предупреждение при настройке рендерера:', error);
        }
    }

    setupControls() {
        try {
            if (this.controls) {
                // Настройка контролов
                if (this.controls.enableDamping !== undefined) this.controls.enableDamping = true;
                if (this.controls.dampingFactor !== undefined) this.controls.dampingFactor = 0.05;
                if (this.controls.enableZoom !== undefined) this.controls.enableZoom = true;
                if (this.controls.enableRotate !== undefined) this.controls.enableRotate = true;
                if (this.controls.enablePan !== undefined) this.controls.enablePan = true;
                if (this.controls.autoRotate !== undefined) this.controls.autoRotate = false;
                
                // Установка целевой точки
                if (this.controls.target) {
                    if (typeof this.controls.target.set === 'function') {
                        this.controls.target.set(this.defaultCameraTarget.x, this.defaultCameraTarget.y, this.defaultCameraTarget.z);
                    } else {
                        this.controls.target.x = this.defaultCameraTarget.x;
                        this.controls.target.y = this.defaultCameraTarget.y;
                        this.controls.target.z = this.defaultCameraTarget.z;
                    }
                }

                console.log('Контролы настроены');
            }
        } catch (error) {
            console.warn('Предупреждение при настройке контролов:', error);
        }
    }

    startRenderLoop() {
        const render = (currentTime) => {
            try {
                // Обновляем контролы
                if (this.controls && typeof this.controls.update === 'function') {
                    this.controls.update();
                }
                
                // Рендерим сцену
                if (this.renderer && typeof this.renderer.render === 'function') {
                    this.renderer.render(this.scene, this.camera);
                }
                
                // Обновляем метрики производительности
                this.updatePerformanceMetrics(currentTime);
            } catch (error) {
                // Логируем ошибки, но не останавливаем рендеринг
                if (currentTime % 5000 < 16) {
                    console.warn('Предупреждение в рендер-лупе:', error);
                }
            }
            
            this.animationId = requestAnimationFrame(render);
        };
        
        this.animationId = requestAnimationFrame(render);
    }

    setupEventListeners() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        // Drag & Drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Улучшенные контролы камеры
        document.getElementById('cameraSpeed').addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.setCameraSpeed(speed);
        });

        document.getElementById('cameraSensitivity').addEventListener('input', (e) => {
            const sensitivity = parseFloat(e.target.value);
            this.setCameraSensitivity(sensitivity);
        });

        document.getElementById('renderQuality').addEventListener('input', (e) => {
            const quality = parseFloat(e.target.value);
            this.setRenderQuality(quality);
        });

        document.getElementById('resetCamera').addEventListener('click', () => {
            this.resetCamera();
        });

        document.getElementById('exportScreenshot').addEventListener('click', () => {
            this.exportScreenshot();
        });

        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleSidebar();
            }
        });
    }

    setCameraSpeed(speed) {
        try {
            if (this.controls) {
                // Устанавливаем скорость для разных типов движения
                if (this.controls.panSpeed !== undefined) this.controls.panSpeed = speed;
                if (this.controls.rotateSpeed !== undefined) this.controls.rotateSpeed = speed;
                if (this.controls.zoomSpeed !== undefined) this.controls.zoomSpeed = speed;
                if (this.controls.keyPanSpeed !== undefined) this.controls.keyPanSpeed = speed;
                
                console.log('Скорость камеры изменена на:', speed);
            }
        } catch (error) {
            console.warn('Ошибка изменения скорости камеры:', error);
        }
    }

    setCameraSensitivity(sensitivity) {
        try {
            if (this.controls) {
                // Изменяем чувствительность через dampingFactor
                if (this.controls.dampingFactor !== undefined) {
                    this.controls.dampingFactor = 0.05 / sensitivity;
                }
                
                console.log('Чувствительность камеры изменена на:', sensitivity);
            }
        } catch (error) {
            console.warn('Ошибка изменения чувствительности камеры:', error);
        }
    }

    setRenderQuality(quality) {
        try {
            if (this.renderer && typeof this.renderer.setPixelRatio === 'function') {
                const pixelRatio = Math.min(window.devicePixelRatio * quality, 3);
                this.renderer.setPixelRatio(pixelRatio);
                console.log('Качество рендеринга изменено на:', quality, 'PixelRatio:', pixelRatio);
            }
        } catch (error) {
            console.warn('Ошибка изменения качества рендеринга:', error);
        }
    }

    async handleFile(file) {
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();

        console.log('Обрабатываем файл:', {
            name: file.name,
            size: file.size,
            type: file.type,
            extension: fileExtension
        });

        this.hideError();
        this.hideStatus();
        this.showLoading();

        try {
            // Очищаем предыдущую модель
            if (this.currentSplat && this.scene) {
                if (typeof this.scene.remove === 'function') {
                    this.scene.remove(this.currentSplat);
                } else if (this.scene.children && Array.isArray(this.scene.children)) {
                    const index = this.scene.children.indexOf(this.currentSplat);
                    if (index > -1) {
                        this.scene.children.splice(index, 1);
                    }
                }
                this.currentSplat = null;
            }

            const fileUrl = URL.createObjectURL(file);

            if (fileExtension === 'splat') {
                await this.loadSplatFile(fileUrl, file.name);
            } else if (fileExtension === 'ply') {
                await this.loadPlyFile(fileUrl, file.name);
            } else {
                throw new Error('Неподдерживаемый формат файла. Используйте .splat или .ply');
            }

            this.centerCameraOnModel();
            URL.revokeObjectURL(fileUrl);
            this.hideLoading();
            this.showStatus(`Файл "${file.name}" успешно загружен`);

        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            this.showError(`Ошибка загрузки файла: ${error.message}`);
            this.hideLoading();
        }
    }

    async loadSplatFile(fileUrl, fileName) {
        try {
            console.log('Загружаем .splat файл...');
            
            await SPLAT.Loader.LoadAsync(fileUrl, this.scene, (progress) => {
                console.log(`Прогресс загрузки: ${Math.round(progress * 100)}%`);
            });

            console.log('Splat файл успешно загружен:', fileName);
        } catch (error) {
            console.error('Ошибка загрузки splat файла:', error);
            throw new Error(`Не удалось загрузить .splat файл: ${error.message}`);
        }
    }

    async loadPlyFile(fileUrl, fileName) {
        try {
            console.log('Загружаем .ply файл...');
            
            // Пробуем разные способы загрузки PLY
            if (SPLAT.PLYLoader && typeof SPLAT.PLYLoader.LoadAsync === 'function') {
                await SPLAT.PLYLoader.LoadAsync(fileUrl, this.scene, (progress) => {
                    console.log(`Прогресс загрузки: ${Math.round(progress * 100)}%`);
                });
            } else {
                // Альтернативный способ через основной загрузчик
                await SPLAT.Loader.LoadAsync(fileUrl, this.scene, (progress) => {
                    console.log(`Прогресс загрузки: ${Math.round(progress * 100)}%`);
                });
            }

            console.log('PLY файл успешно загружен:', fileName);
        } catch (error) {
            console.error('Ошибка загрузки PLY файла:', error);
            throw new Error(`Не удалось загрузить .ply файл: ${error.message}`);
        }
    }

    centerCameraOnModel() {
        try {
            if (this.scene && this.scene.children && this.scene.children.length > 0) {
                // Пытаемся получить границы модели
                let boundingBox = null;
                
                if (typeof this.scene.getBoundingBox === 'function') {
                    boundingBox = this.scene.getBoundingBox();
                } else if (this.scene.children[0] && typeof this.scene.children[0].getBoundingBox === 'function') {
                    boundingBox = this.scene.children[0].getBoundingBox();
                }

                if (boundingBox) {
                    const center = boundingBox.getCenter ? boundingBox.getCenter() : { x: 0, y: 0, z: 0 };
                    const size = boundingBox.getSize ? boundingBox.getSize() : { x: 2, y: 2, z: 2 };
                    const maxDim = Math.max(size.x || 2, size.y || 2, size.z || 2);
                    
                    // Устанавливаем позицию камеры
                    const distance = maxDim * 2.5;
                    this.setCameraPosition(center.x, center.y, center.z + distance);
                    this.setCameraTarget(center.x, center.y, center.z);
                } else {
                    // Базовое центрирование
                    this.setCameraPosition(0, 0, 5);
                    this.setCameraTarget(0, 0, 0);
                }
                
                console.log('Камера центрирована на модели');
            }
        } catch (error) {
            console.warn('Не удалось центрировать камеру:', error);
            // Fallback к базовой позиции
            this.setCameraPosition(0, 0, 5);
            this.setCameraTarget(0, 0, 0);
        }
    }

    setCameraPosition(x, y, z) {
        try {
            if (this.camera && this.camera.position) {
                if (typeof this.camera.position.set === 'function') {
                    this.camera.position.set(x, y, z);
                } else {
                    this.camera.position.x = x;
                    this.camera.position.y = y;
                    this.camera.position.z = z;
                }
            }
        } catch (error) {
            console.warn('Ошибка установки позиции камеры:', error);
        }
    }

    setCameraTarget(x, y, z) {
        try {
            if (this.controls && this.controls.target) {
                if (typeof this.controls.target.set === 'function') {
                    this.controls.target.set(x, y, z);
                } else {
                    this.controls.target.x = x;
                    this.controls.target.y = y;
                    this.controls.target.z = z;
                }
                
                if (typeof this.controls.update === 'function') {
                    this.controls.update();
                }
            }
        } catch (error) {
            console.warn('Ошибка установки цели камеры:', error);
        }
    }

    resetCamera() {
        try {
            this.setCameraPosition(this.defaultCameraPosition.x, this.defaultCameraPosition.y, this.defaultCameraPosition.z);
            this.setCameraTarget(this.defaultCameraTarget.x, this.defaultCameraTarget.y, this.defaultCameraTarget.z);

            // Если есть модель, центрируем на ней
            if (this.scene && this.scene.children && this.scene.children.length > 0) {
                setTimeout(() => {
                    this.centerCameraOnModel();
                }, 100);
            }
            
            console.log('Камера сброшена');
            this.showStatus('Камера сброшена');
        } catch (error) {
            console.warn('Ошибка сброса камеры:', error);
        }
    }

    exportScreenshot() {
        try {
            // Убеждаемся, что последний кадр отрендерен
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            
            // Небольшая задержка для завершения рендеринга
            setTimeout(() => {
                try {
                    const dataURL = this.canvas.toDataURL('image/png', 1.0);
                    
                    // Проверяем, что canvas не пустой
                    if (dataURL === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==') {
                        throw new Error('Canvas пустой');
                    }
                    
                    const link = document.createElement('a');
                    link.download = `gsplat_screenshot_${Date.now()}.png`;
                    link.href = dataURL;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    this.showStatus('Скриншот сохранен');
                    console.log('Скриншот успешно создан');
                } catch (error) {
                    console.error('Ошибка создания скриншота:', error);
                    this.showError('Не удалось создать скриншот: ' + error.message);
                }
            }, 100);
            
        } catch (error) {
            console.error('Ошибка экспорта скриншота:', error);
            this.showError('Не удалось создать скриншот');
        }
    }

    toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    this.showStatus('Полноэкранный режим включен');
                }).catch((error) => {
                    console.warn('Ошибка включения полноэкранного режима:', error);
                });
            } else {
                document.exitFullscreen().then(() => {
                    this.showStatus('Полноэкранный режим выключен');
                }).catch((error) => {
                    console.warn('Ошибка выключения полноэкранного режима:', error);
                });
            }
        } catch (error) {
            console.warn('Ошибка переключения полноэкранного режима:', error);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('toggleSidebar');
        
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleButton.textContent = '›';
            toggleButton.title = 'Развернуть меню';
        } else {
            toggleButton.textContent = '‹';
            toggleButton.title = 'Свернуть меню';
        }
        
        setTimeout(() => {
            this.handleResize();
        }, 300);
    }

    handleResize() {
        try {
            if (this.renderer && typeof this.renderer.setSize === 'function') {
                const width = this.canvas.clientWidth;
                const height = this.canvas.clientHeight;
                
                this.renderer.setSize(width, height);
                
                // Обновляем аспект камеры
                if (this.camera && this.camera.aspect !== undefined) {
                    this.camera.aspect = width / height;
                    if (typeof this.camera.updateProjectionMatrix === 'function') {
                        this.camera.updateProjectionMatrix();
                    }
                }
            }
        } catch (error) {
            console.warn('Ошибка при изменении размера:', error);
        }
    }

    updatePerformanceMetrics(currentTime) {
        this.fpsCounter++;
        
        if (currentTime - this.lastTime >= 1000) {
            const fps = Math.round(this.fpsCounter * 1000 / (currentTime - this.lastTime));
            
            // Безопасное обновление UI
            const fpsElement = document.getElementById('fpsDisplay');
            if (fpsElement) {
                fpsElement.textContent = fps;
            }
            
            // Обновляем счетчик сплатов
            const splatElement = document.getElementById('splatCount');
            if (splatElement && this.scene) {
                let count = 0;
                if (this.scene.children && Array.isArray(this.scene.children)) {
                    count = this.scene.children.length;
                } else if (this.scene.getSplatCount && typeof this.scene.getSplatCount === 'function') {
                    count = this.scene.getSplatCount();
                }
                splatElement.textContent = count.toLocaleString();
            }
            
            this.fpsCounter = 0;
            this.lastTime = currentTime;
        }
    }

    showLoading() {
        const element = document.getElementById('loadingIndicator');
        if (element) element.classList.remove('hidden');
    }

    hideLoading() {
        const element = document.getElementById('loadingIndicator');
        if (element) element.classList.add('hidden');
    }

    showError(message) {
        const container = document.getElementById('errorContainer');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
            container.classList.remove('hidden');
            
            // Автоматически скрыть через 5 секунд
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    hideError() {
        const container = document.getElementById('errorContainer');
        if (container) container.classList.add('hidden');
    }

    showStatus(message) {
        const container = document.getElementById('statusContainer');
        if (container) {
            container.innerHTML = `<div class="status-info">${message}</div>`;
            container.classList.remove('hidden');
            
            // Автоматически скрыть через 3 секунды
            setTimeout(() => {
                this.hideStatus();
            }, 3000);
        }
    }

    hideStatus() {
        const container = document.getElementById('statusContainer');
        if (container) container.classList.add('hidden');
    }

    destroy() {
        try {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            
            if (this.scene && typeof this.scene.dispose === 'function') {
                this.scene.dispose();
            }
            
            if (this.renderer && typeof this.renderer.dispose === 'function') {
                this.renderer.dispose();
            }
            
            console.log('GSplatViewer уничтожен');
        } catch (error) {
            console.warn('Ошибка при уничтожении:', error);
        }
    }
}

// Инициализация с обработкой ошибок
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.gsplatViewer = new GSplatViewer();
    } catch (error) {
        console.error('Критическая ошибка инициализации:', error);
    }
});

// Безопасная очистка при закрытии
window.addEventListener('beforeunload', () => {
    if (window.gsplatViewer) {
        window.gsplatViewer.destroy();
    }
});
