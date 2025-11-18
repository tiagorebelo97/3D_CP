# 🏠 3D House Planner

A modern, user-friendly web application for creating 3D house plans dynamically. Design your dream home with an intuitive interface inspired by AutoCAD, but simplified for everyone.

![3D House Planner](https://github.com/user-attachments/assets/3e6101ac-b516-40a8-bb9e-c6780168ae94)

## ✨ Features

### 🎨 Interactive Design Tools
- **Wall Tool (W)**: Draw walls by clicking and dragging on the canvas
- **Door Tool (D)**: Place doors with a single click
- **Window Tool (I)**: Add windows to your design
- **Select Tool (ESC)**: Select and inspect objects
- **Delete Tool (DEL)**: Remove unwanted objects

### 🔧 Customizable Properties
- Adjustable wall height and thickness
- Configurable door and window dimensions
- Grid snapping for precise placement
- Customizable grid size

### 📐 Dual View Modes
- **3D Isometric View**: Beautiful pseudo-3D visualization of your house plan
- **2D Top-Down View**: Traditional blueprint-style view for precise measurements

### 🎯 User-Friendly Features
- **Snap to Grid**: Automatically align objects to the grid for precision
- **Keyboard Shortcuts**: Fast workflow with intuitive hotkeys
- **Real-time Cursor Position**: Track your exact position in meters
- **Pan & Zoom**: Navigate your design with mouse wheel zoom and right-click pan
- **Export Plans**: Save your design as JSON for later use

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A local web server (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tiagorebelo97/3D_CP.git
cd 3D_CP
```

2. Start a local web server:
```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js http-server
npx http-server -p 8080
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

## 🎮 How to Use

### Basic Workflow

1. **Select a Tool**: Click on a tool button or use keyboard shortcuts
2. **Draw Walls**: 
   - Press `W` or click the Wall tool
   - Click to set the start point
   - Move your mouse to define the wall direction and length
   - Click again to finish the wall
3. **Add Doors & Windows**:
   - Press `D` for doors or `I` for windows
   - Click anywhere on the canvas to place them
4. **Select Objects**: 
   - Press `ESC` or click the Select tool
   - Click on any object to select it (it will highlight in blue)
5. **Delete Objects**:
   - Press `DEL` with an object selected, or
   - Use the Delete tool and click on objects to remove them

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `W` | Activate Wall tool |
| `D` | Activate Door tool |
| `I` | Activate Window tool |
| `ESC` | Activate Select tool |
| `DEL` | Delete selected object |
| `Mouse Wheel` | Zoom in/out |
| `Right Click + Drag` | Pan the canvas |

### View Controls

- **2D View**: Switch to top-down blueprint view
- **3D View**: Switch to isometric 3D visualization
- **Reset Camera**: Return to default view position

## 🎨 Screenshots

### 3D Isometric View
![3D View with Wall](https://github.com/user-attachments/assets/3a5abcd6-2dbc-4d60-abfa-f43982be1300)

### Complete Scene
![Complete Scene](https://github.com/user-attachments/assets/752ed05c-ae14-464b-a0bc-d29e6640316e)

### 2D Top-Down View
![2D View](https://github.com/user-attachments/assets/c69432a8-8fd4-4d19-87c9-618025b7ff9d)

## 🏗️ Technical Details

### Technology Stack
- **Pure HTML5**: Semantic markup for better accessibility
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No external dependencies for the core functionality
- **Canvas API**: Hardware-accelerated 2D rendering
- **ES6+**: Modern JavaScript features for clean, maintainable code

### Architecture
- **Modular Design**: Separation of concerns (rendering, input handling, state management)
- **Event-Driven**: Responsive to user interactions
- **Coordinate System**: Real-world metric measurements (meters)
- **Isometric Projection**: Mathematical transformation for 3D visualization

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📁 Project Structure

```
3D_CP/
├── index.html      # Main HTML structure
├── style.css       # Styling and UI design
├── app.js          # Core application logic
└── README.md       # Project documentation
```

## 🎯 Use Cases

- **Home Design**: Plan your dream home renovation
- **Architecture Students**: Learn basic floor planning
- **Interior Design**: Visualize room layouts
- **Real Estate**: Create simple property layouts
- **DIY Projects**: Plan room modifications

## 🔮 Future Enhancements

Potential features for future versions:
- Import/Load saved plans
- Furniture placement
- Room labeling and dimensions
- Multiple floor support
- Export to PDF or image formats
- Collaboration features
- Material textures
- Lighting simulation
- Cost estimation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created with ❤️ by the 3D_CP team

## 🙏 Acknowledgments

- Inspired by professional CAD tools like AutoCAD
- Built with modern web technologies
- Designed for ease of use and accessibility