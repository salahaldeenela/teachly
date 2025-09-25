📚 Teachly – Find the Perfect Tutor in Real Time

Teachly is a modern mobile app that connects students with tutors tailored to their exact needs. Built with React Native, Expo, NativeWind (TailwindCSS), and Firebase, it delivers a seamless real-time experience for discovering, booking, and connecting with tutors anytime, anywhere.

🚀 Quick Start
git clone https://github.com/YOUR-USERNAME/teachly.git
cd teachly
npm install
npx expo start

📦 Tech Stack

⚡ React Native + Expo → Cross-platform app (Android, iOS, Web)

🎨 NativeWind (TailwindCSS) → Clean, modern, and responsive UI

🔥 Firebase → Realtime Database & Authentication for instant connections

🌓 Dark/Light Theme → System sync with manual toggle

📱 Responsive Design → Optimized for mobile-first learning

✨ Features

🔍 Smart Tutor Matching – Find tutors based on subject, level, and preferences

⏱ Real-Time Availability – Instantly see which tutors are free to help

💬 Realtime Updates – Powered by Firebase for instant session syncing

🎨 Sleek UI – Styled with Tailwind (NativeWind) for a smooth user experience

🌙 Dark/Light Mode – Study in comfort, day or night

📁 Project Structure
teachly/
├── app/
│   ├── layout.tsx        # Root layout with theme provider
│   ├── index.tsx         # Home screen
│   └── +not-found.tsx    # 404 page
├── components/
│   └── ThemeToggle.tsx   # Dark/Light mode toggle
├── context/
│   └── ThemeProvider.tsx # Theme state management
├── tailwind.config.js    # TailwindCSS configuration
├── babel.config.js       # Babel + NativeWind config
└── tsconfig.json         # TypeScript configuration

🛠 Configuration

tailwind.config.js → Customize colors, spacing, and themes

babel.config.js → Required NativeWind + Expo configuration

📱 Supported Platforms

✅ Android

✅ iOS

✅ Web (with Expo setup)

📄 License

MIT License.

🤝 Contributing

Contributions are welcome! Please open an issue to discuss major changes before submitting a PR.

✨ Teachly makes finding the right tutor as easy as tapping a button — so you can spend less time searching and more time learning.
