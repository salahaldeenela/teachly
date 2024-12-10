# React Native + NativeWind Template

A minimal but robust template for React Native projects using NativeWind (TailwindCSS), Expo Router, and TypeScript with built-in dark/light theme support.

## 🚀 Quick Start
```sh
    git clone https://github.com/SalehAhmed10/Expo-ReactNative-NativeWind-Tailwind-Template.git
```

```
    cd Expo-ReactNative-NativeWind-Tailwind-Template
    npm install
    npx expo start
```
## 📦 What's Included

- ⚡️ Expo Router for navigation
- 🎨 NativeWind (TailwindCSS) for styling
- 🌓 Dark/Light theme with system sync
- 📱 Responsive design ready
- 🔍 TypeScript for type safety

## 🎨 Theme System

The template includes a complete theme system with:

- System theme detection
- Manual theme toggle
- HSL color system with opacity support
- Consistent styling across light/dark modes

## ⚠️ Known Issues & Fixes

### 1. NativeWind Babel Error
**Fix**: Use NativeWind version 2.0.11

json
{
"dependencies": {
"nativewind": "^2.0.11"
}
}



## 📁 Project Structure
├── app/
│ ├── layout.tsx # Root layout with theme provider
│ ├── index.tsx # Home screen
│ └── +not-found.tsx # 404 page
├── components/
│ └── ThemeToggle.tsx # Theme toggle component
├── context/
│ └── ThemeProvider.tsx # Theme management
├── babel.config.js
├── tailwind.config.js # Theme configuration
└── tsconfig.json

## 🛠 Configuration Files

### tailwind.config.js
Contains theme colors and configuration. Modify this file to customize your color scheme.

### babel.config.js
Includes necessary configuration for NativeWind.

## 📱 Supported Platforms

- iOS
- Android
- Web (with appropriate configuration)
  
## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
