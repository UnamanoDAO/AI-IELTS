# IELTS Vocabulary Learning - Frontend

Vue 3 frontend application for the IELTS Vocabulary Learning Platform.

## Features

- 📚 **Learning Mode**: Study words with phonetics, meanings, roots, and examples
- ✏️ **Quiz Mode**: Test your knowledge with multiple choice, fill-in-blank, and listening tests
- 📊 **Progress Tracking**: Track your learning progress and quiz scores (localStorage)
- 🎯 **Unit-based Learning**: Words organized into weekly units (50-100 words each)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:5174

3. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client
│   ├── components/       # Reusable components
│   │   ├── WordCard.vue
│   │   ├── QuizMultipleChoice.vue
│   │   ├── QuizFillBlank.vue
│   │   └── QuizListening.vue
│   ├── views/            # Page components
│   │   ├── Home.vue
│   │   ├── Learn.vue
│   │   └── Quiz.vue
│   ├── stores/           # Pinia stores
│   │   └── progress.js
│   ├── router/           # Vue Router
│   │   └── index.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
└── package.json
```

## Usage

### Learning Mode
- Navigate to a unit from the home page
- Click "开始学习" to enter learning mode
- Use arrow keys or buttons to navigate between words
- Press space or click the circle to mark words as learned
- Audio plays automatically for each word

### Quiz Mode
- Click "开始测验" from any unit card
- Complete 25 mixed questions (multiple choice, fill-blank, listening)
- Get immediate feedback after each answer
- View detailed results and review incorrect answers
- Progress is automatically saved to localStorage

## Technology Stack

- Vue 3 (Composition API)
- Vue Router 4
- Pinia (State Management)
- Vite (Build Tool)
- Axios (HTTP Client)



Vue 3 frontend application for the IELTS Vocabulary Learning Platform.

## Features

- 📚 **Learning Mode**: Study words with phonetics, meanings, roots, and examples
- ✏️ **Quiz Mode**: Test your knowledge with multiple choice, fill-in-blank, and listening tests
- 📊 **Progress Tracking**: Track your learning progress and quiz scores (localStorage)
- 🎯 **Unit-based Learning**: Words organized into weekly units (50-100 words each)
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:5174

3. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client
│   ├── components/       # Reusable components
│   │   ├── WordCard.vue
│   │   ├── QuizMultipleChoice.vue
│   │   ├── QuizFillBlank.vue
│   │   └── QuizListening.vue
│   ├── views/            # Page components
│   │   ├── Home.vue
│   │   ├── Learn.vue
│   │   └── Quiz.vue
│   ├── stores/           # Pinia stores
│   │   └── progress.js
│   ├── router/           # Vue Router
│   │   └── index.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── vite.config.js
└── package.json
```

## Usage

### Learning Mode
- Navigate to a unit from the home page
- Click "开始学习" to enter learning mode
- Use arrow keys or buttons to navigate between words
- Press space or click the circle to mark words as learned
- Audio plays automatically for each word

### Quiz Mode
- Click "开始测验" from any unit card
- Complete 25 mixed questions (multiple choice, fill-blank, listening)
- Get immediate feedback after each answer
- View detailed results and review incorrect answers
- Progress is automatically saved to localStorage

## Technology Stack

- Vue 3 (Composition API)
- Vue Router 4
- Pinia (State Management)
- Vite (Build Tool)
- Axios (HTTP Client)

