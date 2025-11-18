// Global variables
let canvas, ctx;
let objects = [];
let currentTool = 'select';
let isDrawing = false;
let startPoint = null;
let tempObject = null;
let selectedObject = null;
let camera = {
    x: 0,
    y: 0,
    zoom: 1.5,
    is3D: true
};
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

// Configuration
const config = {
    wallHeight: 3,
    wallThickness: 0.2,
    doorWidth: 0.9,
    doorHeight: 2.1,
    windowWidth: 1.2,
    windowHeight: 1.2,
    windowSillHeight: 1.0,
    snapToGrid: true,
    gridSize: 0.5
};

// Colors
const COLORS = {
    background: '#f1f5f9',
    grid: '#cbd5e1',
    gridMajor: '#94a3b8',
    wall: '#8b7355',
    wallPreview: 'rgba(139, 115, 85, 0.5)',
    wallSelected: '#4f46e5',
    door: '#654321',
    doorFrame: '#8b7355',
    doorHandle: '#ffd700',
    window: '#87ceeb',
    windowFrame: '#8b7355',
    windowDivider: '#ffffff'
};

// Initialize the application
function init() {
    canvas = document.getElementById('renderCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Event listeners
    setupEventListeners();
    
    // Start animation loop
    animate();
    
    // Update status
    updateStatus('Ready - Select a tool to start');
}

// Resize canvas
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}

// Setup event listeners
function setupEventListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard events
    document.addEventListener('keydown', onKeyDown);

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.currentTarget.dataset.tool;
            setTool(tool);
        });
    });

    // Property inputs
    document.getElementById('wallHeight').addEventListener('change', (e) => {
        config.wallHeight = parseFloat(e.target.value);
    });
    document.getElementById('wallThickness').addEventListener('change', (e) => {
        config.wallThickness = parseFloat(e.target.value);
    });
    document.getElementById('doorWidth').addEventListener('change', (e) => {
        config.doorWidth = parseFloat(e.target.value);
    });
    document.getElementById('windowWidth').addEventListener('change', (e) => {
        config.windowWidth = parseFloat(e.target.value);
    });
    document.getElementById('snapToGrid').addEventListener('change', (e) => {
        config.snapToGrid = e.target.checked;
    });
    document.getElementById('gridSize').addEventListener('change', (e) => {
        config.gridSize = parseFloat(e.target.value);
    });

    // View buttons
    document.getElementById('view2D').addEventListener('click', () => {
        set2DView();
    });
    document.getElementById('view3D').addEventListener('click', () => {
        set3DView();
    });
    document.getElementById('resetView').addEventListener('click', () => {
        resetCamera();
    });

    // Header buttons
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('exportBtn').addEventListener('click', exportPlan);

    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}

// Convert screen coordinates to world coordinates
function screenToWorld(screenX, screenY) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const scale = 30 * camera.zoom;
    
    if (camera.is3D) {
        // Isometric view
        const isoX = (screenX - centerX) / scale;
        const isoY = (screenY - centerY) / scale;
        
        const worldX = (isoX / Math.sqrt(3) + isoY / Math.sqrt(3)) - camera.x;
        const worldY = (isoY / Math.sqrt(3) - isoX / Math.sqrt(3)) - camera.y;
        
        return { x: worldX, y: worldY };
    } else {
        // Top-down view
        const worldX = (screenX - centerX) / scale + camera.x;
        const worldY = (screenY - centerY) / scale + camera.y;
        return { x: worldX, y: worldY };
    }
}

// Convert world coordinates to screen coordinates
function worldToScreen(worldX, worldY, worldZ = 0) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const scale = 30 * camera.zoom;
    
    if (camera.is3D) {
        // Isometric projection
        const adjustedX = worldX + camera.x;
        const adjustedY = worldY + camera.y;
        
        const isoX = (adjustedX - adjustedY) * Math.sqrt(3);
        const isoY = (adjustedX + adjustedY) / Math.sqrt(3) - worldZ;
        
        return {
            x: centerX + isoX * scale,
            y: centerY + isoY * scale
        };
    } else {
        // Top-down view
        return {
            x: centerX + (worldX - camera.x) * scale,
            y: centerY + (worldY - camera.y) * scale
        };
    }
}

// Mouse event handlers
function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    lastMousePos = { x: mouseX, y: mouseY };
    
    if (event.button === 2) {
        // Right click - pan
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    const worldPos = screenToWorld(mouseX, mouseY);
    
    if (currentTool === 'select') {
        selectObject(worldPos);
    } else if (currentTool === 'delete') {
        deleteObject(worldPos);
    } else if (currentTool === 'wall') {
        startDrawingWall(worldPos);
    } else if (currentTool === 'door' || currentTool === 'window') {
        placeObject(worldPos, currentTool);
    }
}

function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    if (isDragging) {
        // Pan camera
        const scale = 30 * camera.zoom;
        camera.x -= (mouseX - lastMousePos.x) / scale;
        camera.y -= (mouseY - lastMousePos.y) / scale;
        lastMousePos = { x: mouseX, y: mouseY };
        return;
    }
    
    const worldPos = screenToWorld(mouseX, mouseY);
    
    // Update cursor position display
    updateCursorPosition(worldPos);
    
    // Update drawing preview
    if (isDrawing && tempObject && currentTool === 'wall') {
        updateWallPreview(worldPos);
    }
}

function onMouseUp(event) {
    if (event.button === 2) {
        isDragging = false;
        canvas.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
        return;
    }
    
    if (isDrawing && currentTool === 'wall') {
        finishDrawingWall();
    }
}

function onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    camera.zoom *= delta;
    camera.zoom = Math.max(0.3, Math.min(5, camera.zoom));
}

// Keyboard event handler
function onKeyDown(event) {
    const key = event.key.toLowerCase();
    
    switch(key) {
        case 'w':
            setTool('wall');
            event.preventDefault();
            break;
        case 'd':
            setTool('door');
            event.preventDefault();
            break;
        case 'i':
            setTool('window');
            event.preventDefault();
            break;
        case 'escape':
            setTool('select');
            event.preventDefault();
            break;
        case 'delete':
            if (selectedObject) {
                removeObject(selectedObject);
                selectedObject = null;
            }
            event.preventDefault();
            break;
    }
}

// Snap to grid
function snapToGrid(point) {
    if (!config.snapToGrid) return point;
    
    const size = config.gridSize;
    return {
        x: Math.round(point.x / size) * size,
        y: Math.round(point.y / size) * size
    };
}

// Set current tool
function setTool(tool) {
    currentTool = tool;
    
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tool === tool) {
            btn.classList.add('active');
        }
    });
    
    // Update cursor
    if (tool === 'select') {
        canvas.style.cursor = 'default';
        updateStatus('Select mode - Click on objects to select');
    } else if (tool === 'delete') {
        canvas.style.cursor = 'not-allowed';
        updateStatus('Delete mode - Click on objects to delete');
    } else {
        canvas.style.cursor = 'crosshair';
        updateStatus(`${tool.charAt(0).toUpperCase() + tool.slice(1)} mode - Click to place`);
    }
    
    // Clear selection
    selectedObject = null;
}

// Start drawing wall
function startDrawingWall(point) {
    point = snapToGrid(point);
    startPoint = { x: point.x, y: point.y };
    isDrawing = true;
    
    tempObject = {
        type: 'wall',
        x1: startPoint.x,
        y1: startPoint.y,
        x2: startPoint.x,
        y2: startPoint.y,
        height: config.wallHeight,
        thickness: config.wallThickness,
        isTemp: true
    };
    
    updateStatus('Drawing wall - Move mouse and release to finish');
}

// Update wall preview
function updateWallPreview(point) {
    if (!tempObject || !startPoint) return;
    
    point = snapToGrid(point);
    tempObject.x2 = point.x;
    tempObject.y2 = point.y;
}

// Finish drawing wall
function finishDrawingWall() {
    if (!tempObject || !startPoint) return;
    
    const dx = tempObject.x2 - tempObject.x1;
    const dy = tempObject.y2 - tempObject.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 0.5) {
        // Too short, cancel
        tempObject = null;
    } else {
        // Finalize wall
        tempObject.isTemp = false;
        tempObject.length = length;
        tempObject.id = Date.now();
        objects.push(tempObject);
        updateStatus(`Wall created (${length.toFixed(2)}m)`);
        tempObject = null;
    }
    
    isDrawing = false;
    startPoint = null;
}

// Place door or window
function placeObject(point, type) {
    point = snapToGrid(point);
    
    const object = {
        type: type,
        x: point.x,
        y: point.y,
        rotation: 0,
        id: Date.now()
    };
    
    if (type === 'door') {
        object.width = config.doorWidth;
        object.height = config.doorHeight;
        updateStatus(`Door placed at (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
    } else if (type === 'window') {
        object.width = config.windowWidth;
        object.height = config.windowHeight;
        object.sillHeight = config.windowSillHeight;
        updateStatus(`Window placed at (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
    }
    
    objects.push(object);
}

// Select object
function selectObject(worldPos) {
    selectedObject = null;
    
    // Check objects in reverse order (top to bottom)
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        
        if (obj.type === 'wall') {
            // Check if point is near wall
            const dist = distanceToLineSegment(
                worldPos.x, worldPos.y,
                obj.x1, obj.y1,
                obj.x2, obj.y2
            );
            
            if (dist < 0.3) {
                selectedObject = obj;
                updateStatus(`Selected ${obj.type} (${obj.length.toFixed(2)}m)`);
                return;
            }
        } else {
            // Check if point is inside object bounds
            const dx = Math.abs(worldPos.x - obj.x);
            const dy = Math.abs(worldPos.y - obj.y);
            const threshold = obj.width / 2 + 0.2;
            
            if (dx < threshold && dy < threshold) {
                selectedObject = obj;
                updateStatus(`Selected ${obj.type}`);
                return;
            }
        }
    }
    
    updateStatus('No object selected');
}

// Delete object
function deleteObject(worldPos) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        
        if (obj.type === 'wall') {
            const dist = distanceToLineSegment(
                worldPos.x, worldPos.y,
                obj.x1, obj.y1,
                obj.x2, obj.y2
            );
            
            if (dist < 0.3) {
                objects.splice(i, 1);
                updateStatus(`Deleted ${obj.type}`);
                return;
            }
        } else {
            const dx = Math.abs(worldPos.x - obj.x);
            const dy = Math.abs(worldPos.y - obj.y);
            const threshold = obj.width / 2 + 0.2;
            
            if (dx < threshold && dy < threshold) {
                objects.splice(i, 1);
                updateStatus(`Deleted ${obj.type}`);
                return;
            }
        }
    }
}

// Remove object from scene
function removeObject(object) {
    const index = objects.indexOf(object);
    if (index > -1) {
        objects.splice(index, 1);
        updateStatus(`Deleted ${object.type}`);
    }
}

// Clear all objects
function clearAll() {
    if (objects.length === 0) return;
    
    if (!confirm('Are you sure you want to clear all objects?')) return;
    
    objects = [];
    selectedObject = null;
    updateStatus('All objects cleared');
}

// Export plan
function exportPlan() {
    const plan = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        config: config,
        objects: objects
    };
    
    const dataStr = JSON.stringify(plan, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `house-plan-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    updateStatus('Plan exported successfully');
}

// Set 2D view
function set2DView() {
    camera.is3D = false;
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.5;
    
    document.getElementById('view2D').classList.add('active');
    document.getElementById('view3D').classList.remove('active');
    updateStatus('2D View active (Top-down)');
}

// Set 3D view
function set3DView() {
    camera.is3D = true;
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.5;
    
    document.getElementById('view3D').classList.add('active');
    document.getElementById('view2D').classList.remove('active');
    updateStatus('3D View active (Isometric)');
}

// Reset camera
function resetCamera() {
    camera.x = 0;
    camera.y = 0;
    camera.zoom = 1.5;
    updateStatus('Camera reset');
}

// Update status text
function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

// Update cursor position
function updateCursorPosition(point) {
    document.getElementById('cursorPos').textContent = 
        `X: ${point.x.toFixed(2)} m, Y: ${point.y.toFixed(2)} m`;
}

// Distance from point to line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    
    if (lengthSquared === 0) {
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

// Render functions
function render() {
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw objects
    objects.forEach(obj => {
        if (obj.type === 'wall') {
            drawWall(obj, obj === selectedObject);
        } else if (obj.type === 'door') {
            drawDoor(obj, obj === selectedObject);
        } else if (obj.type === 'window') {
            drawWindow(obj, obj === selectedObject);
        }
    });
    
    // Draw temp object
    if (tempObject && isDrawing) {
        if (tempObject.type === 'wall') {
            drawWall(tempObject, false);
        }
    }
}

function drawGrid() {
    const gridSize = config.gridSize;
    const scale = 30 * camera.zoom;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const startX = Math.floor((0 - centerX / scale - camera.x) / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - centerX) / scale - camera.x) * gridSize;
    const startY = Math.floor((0 - centerY / scale - camera.y) / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - centerY) / scale - camera.y) * gridSize;
    
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
        const screen1 = worldToScreen(x, startY);
        const screen2 = worldToScreen(x, endY);
        
        ctx.beginPath();
        ctx.moveTo(screen1.x, screen1.y);
        ctx.lineTo(screen2.x, screen2.y);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
        const screen1 = worldToScreen(startX, y);
        const screen2 = worldToScreen(endX, y);
        
        ctx.beginPath();
        ctx.moveTo(screen1.x, screen1.y);
        ctx.lineTo(screen2.x, screen2.y);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = COLORS.gridMajor;
    ctx.lineWidth = 2;
    
    const originX1 = worldToScreen(0, startY);
    const originX2 = worldToScreen(0, endY);
    ctx.beginPath();
    ctx.moveTo(originX1.x, originX1.y);
    ctx.lineTo(originX2.x, originX2.y);
    ctx.stroke();
    
    const originY1 = worldToScreen(startX, 0);
    const originY2 = worldToScreen(endX, 0);
    ctx.beginPath();
    ctx.moveTo(originY1.x, originY1.y);
    ctx.lineTo(originY2.x, originY2.y);
    ctx.stroke();
}

function drawWall(wall, isSelected) {
    const p1Bottom = worldToScreen(wall.x1, wall.y1, 0);
    const p2Bottom = worldToScreen(wall.x2, wall.y2, 0);
    const p1Top = worldToScreen(wall.x1, wall.y1, wall.height);
    const p2Top = worldToScreen(wall.x2, wall.y2, wall.height);
    
    ctx.fillStyle = wall.isTemp ? COLORS.wallPreview : (isSelected ? COLORS.wallSelected : COLORS.wall);
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    
    if (camera.is3D) {
        // Draw 3D wall
        ctx.beginPath();
        ctx.moveTo(p1Bottom.x, p1Bottom.y);
        ctx.lineTo(p2Bottom.x, p2Bottom.y);
        ctx.lineTo(p2Top.x, p2Top.y);
        ctx.lineTo(p1Top.x, p1Top.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add top face
        const thickness = wall.thickness;
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * thickness;
        const ny = dx / len * thickness;
        
        const p1TopFront = worldToScreen(wall.x1 + nx/2, wall.y1 + ny/2, wall.height);
        const p2TopFront = worldToScreen(wall.x2 + nx/2, wall.y2 + ny/2, wall.height);
        const p2TopBack = worldToScreen(wall.x2 - nx/2, wall.y2 - ny/2, wall.height);
        const p1TopBack = worldToScreen(wall.x1 - nx/2, wall.y1 - ny/2, wall.height);
        
        ctx.fillStyle = wall.isTemp ? COLORS.wallPreview : (isSelected ? '#6366f1' : '#9d8169');
        ctx.beginPath();
        ctx.moveTo(p1TopFront.x, p1TopFront.y);
        ctx.lineTo(p2TopFront.x, p2TopFront.y);
        ctx.lineTo(p2TopBack.x, p2TopBack.y);
        ctx.lineTo(p1TopBack.x, p1TopBack.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        // Draw 2D wall (top-down view)
        const thickness = wall.thickness * 30 * camera.zoom;
        ctx.lineWidth = Math.max(2, thickness);
        ctx.beginPath();
        ctx.moveTo(p1Bottom.x, p1Bottom.y);
        ctx.lineTo(p2Bottom.x, p2Bottom.y);
        ctx.stroke();
    }
}

function drawDoor(door, isSelected) {
    const centerBottom = worldToScreen(door.x, door.y, 0);
    const centerTop = worldToScreen(door.x, door.y, door.height);
    const width = door.width;
    const height = door.height;
    
    const leftBottom = worldToScreen(door.x - width/2, door.y, 0);
    const rightBottom = worldToScreen(door.x + width/2, door.y, 0);
    const leftTop = worldToScreen(door.x - width/2, door.y, height);
    const rightTop = worldToScreen(door.x + width/2, door.y, height);
    
    if (camera.is3D) {
        // Draw frame
        ctx.fillStyle = COLORS.doorFrame;
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(leftBottom.x, leftBottom.y);
        ctx.lineTo(rightBottom.x, rightBottom.y);
        ctx.lineTo(rightTop.x, rightTop.y);
        ctx.lineTo(leftTop.x, leftTop.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw door panel
        ctx.fillStyle = isSelected ? COLORS.wallSelected : COLORS.door;
        const panelLeft = worldToScreen(door.x - width/2 + 0.05, door.y, 0.05);
        const panelRight = worldToScreen(door.x + width/2 - 0.05, door.y, 0.05);
        const panelTopLeft = worldToScreen(door.x - width/2 + 0.05, door.y, height - 0.05);
        const panelTopRight = worldToScreen(door.x + width/2 - 0.05, door.y, height - 0.05);
        
        ctx.beginPath();
        ctx.moveTo(panelLeft.x, panelLeft.y);
        ctx.lineTo(panelRight.x, panelRight.y);
        ctx.lineTo(panelTopRight.x, panelTopRight.y);
        ctx.lineTo(panelTopLeft.x, panelTopLeft.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw handle
        const handlePos = worldToScreen(door.x + width * 0.3, door.y, height / 2);
        ctx.fillStyle = COLORS.doorHandle;
        ctx.beginPath();
        ctx.arc(handlePos.x, handlePos.y, 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // 2D view
        const scale = 30 * camera.zoom;
        const w = width * scale;
        ctx.fillStyle = isSelected ? COLORS.wallSelected : COLORS.door;
        ctx.strokeStyle = COLORS.doorFrame;
        ctx.lineWidth = 2;
        ctx.fillRect(centerBottom.x - w/2, centerBottom.y - w/2, w, w);
        ctx.strokeRect(centerBottom.x - w/2, centerBottom.y - w/2, w, w);
        
        // Door symbol
        ctx.beginPath();
        ctx.arc(centerBottom.x - w/2, centerBottom.y - w/2, w * 0.7, 0, Math.PI / 2);
        ctx.stroke();
    }
}

function drawWindow(window, isSelected) {
    const centerPos = worldToScreen(window.x, window.y, window.sillHeight + window.height / 2);
    const width = window.width;
    const height = window.height;
    const sillHeight = window.sillHeight;
    
    const leftBottom = worldToScreen(window.x - width/2, window.y, sillHeight);
    const rightBottom = worldToScreen(window.x + width/2, window.y, sillHeight);
    const leftTop = worldToScreen(window.x - width/2, window.y, sillHeight + height);
    const rightTop = worldToScreen(window.x + width/2, window.y, sillHeight + height);
    
    if (camera.is3D) {
        // Draw frame
        ctx.fillStyle = COLORS.windowFrame;
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(leftBottom.x, leftBottom.y);
        ctx.lineTo(rightBottom.x, rightBottom.y);
        ctx.lineTo(rightTop.x, rightTop.y);
        ctx.lineTo(leftTop.x, leftTop.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw glass
        ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.4)' : 'rgba(135, 206, 235, 0.4)';
        const glassLeft = worldToScreen(window.x - width/2 + 0.05, window.y, sillHeight + 0.05);
        const glassRight = worldToScreen(window.x + width/2 - 0.05, window.y, sillHeight + 0.05);
        const glassTopLeft = worldToScreen(window.x - width/2 + 0.05, window.y, sillHeight + height - 0.05);
        const glassTopRight = worldToScreen(window.x + width/2 - 0.05, window.y, sillHeight + height - 0.05);
        
        ctx.beginPath();
        ctx.moveTo(glassLeft.x, glassLeft.y);
        ctx.lineTo(glassRight.x, glassRight.y);
        ctx.lineTo(glassTopRight.x, glassTopRight.y);
        ctx.lineTo(glassTopLeft.x, glassTopLeft.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw dividers
        ctx.strokeStyle = COLORS.windowDivider;
        ctx.lineWidth = 1;
        
        const centerV = worldToScreen(window.x, window.y, sillHeight);
        const centerVTop = worldToScreen(window.x, window.y, sillHeight + height);
        ctx.beginPath();
        ctx.moveTo(centerV.x, centerV.y);
        ctx.lineTo(centerVTop.x, centerVTop.y);
        ctx.stroke();
        
        const leftH = worldToScreen(window.x - width/2, window.y, sillHeight + height/2);
        const rightH = worldToScreen(window.x + width/2, window.y, sillHeight + height/2);
        ctx.beginPath();
        ctx.moveTo(leftH.x, leftH.y);
        ctx.lineTo(rightH.x, rightH.y);
        ctx.stroke();
    } else {
        // 2D view
        const scale = 30 * camera.zoom;
        const w = width * scale;
        const pos = worldToScreen(window.x, window.y, 0);
        
        ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.4)' : 'rgba(135, 206, 235, 0.4)';
        ctx.strokeStyle = COLORS.windowFrame;
        ctx.lineWidth = 2;
        ctx.fillRect(pos.x - w/2, pos.y - w/2, w, w);
        ctx.strokeRect(pos.x - w/2, pos.y - w/2, w, w);
        
        // Cross divider
        ctx.strokeStyle = COLORS.windowDivider;
        ctx.beginPath();
        ctx.moveTo(pos.x - w/2, pos.y);
        ctx.lineTo(pos.x + w/2, pos.y);
        ctx.moveTo(pos.x, pos.y - w/2);
        ctx.lineTo(pos.x, pos.y + w/2);
        ctx.stroke();
    }
}

// Animation loop
function animate() {
    render();
    requestAnimationFrame(animate);
}

// Start the application
window.addEventListener('DOMContentLoaded', init);
