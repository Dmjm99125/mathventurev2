# MathVenture 🎮📐

MathVenture is an interactive, gamified math learning platform designed for young learners, built on modern web technologies. It bridges game-based education with classroom integration, offering separate dashboards and features for both **Students** and **Teachers**.

*   **Legacy Version (v1):** [mathventurev1.netlify.app](https://mathventurev1.netlify.app)
*   **Repository:** [GitHub Repository](https://github.com/Thalanas110/MathVenture)

---

## 🚀 Features

### 👦 Student Adventure
*   **Gamified Topics:** Quizzes and learning models covering:
    *   🔢 **Numbers** & Counting
    *   ➕ **Addition** & ➖ **Subtraction**
    *   ⚖️ **Comparison** (Greater than, Less than, Equal to)
    *   ⏰ **Clock** & Time reading
    *   🎨 **Colors** & 🔺 **Shapes**
    *   🔄 **Sequencing** & Pattern completion
    *   📏 **Measurement**
    *   🎮 **Free Play** mode for unrestricted exploration
*   **Interactive UI:** High-fidelity animations, responsive audio feedback, and celebration effects (confetti) upon module completion.
*   **Multilingual Support:** Localized and translated user interface options.

### 👩‍🏫 Teacher Control Panel
*   **Classroom Management:** View, edit, and organize multiple class sections.
*   **Student Monitoring:** Detailed statistics, progress tracking, and activity reports for each student.
*   **Assignments:** Assign specific topics or custom quizzes to groups of students.

---

## 🛠️ Technology Stack

*   **Frontend Framework:** React 19 + TypeScript + Vite 6
*   **Styling:** Tailwind CSS v4 + Vanilla CSS
*   **UI Components:** Radix UI primitives, Lucide Icons, and Framer Motion (for fluid animations)
*   **Routing:** Wouter (lightweight React router)
*   **State Management & Data Fetching:** TanStack Query (React Query)
*   **Backend & Auth:** Supabase (Database, Auth, and Edge Functions)
*   **Visualizations:** Recharts (for student dashboard statistics)

---

## 📁 Repository Structure

```text
mathventure/
├── src/
│   ├── components/      # Shared components (Layout, UI, Audio Buttons)
│   ├── data/            # Game data, question sets, and topic lists
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility contexts (Auth, Language providers)
│   ├── pages/           # Landing, About, Auth, Student, and Teacher pages
│   ├── App.tsx          # Router configuration and application shell
│   └── main.tsx         # Application entry point
├── public/
│   └── assets/
│       ├── images/      # Illustrations and user interface assets
│       └── papers/      # Academic research manuscripts and PDFs
├── supabase/            # Database migrations and configurations
└── package.json         # Scripts and project dependencies
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or Deno

### 🔧 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Thalanas110/MathVenture.git
   cd mathventure
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or update the existing one) with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` to view the application.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔬 Academic Research & Background

MathVenture is backed by active educational research investigating gamified learning efficacy. 
*   **Thesis Manuscript:** You can find the research paper ["Counting the Uncounted"](file:///public/assets/papers/FIN-GROUP1-RESEARCH-MANUSCRIPT.pdf) in the public assets directory.
*   **Research Team:** Developed and designed by MR (Main Researcher), GY, ALR, DMM, and GV.
