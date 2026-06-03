⚙️ Core Application Modules
1. Unified Authentication Gate (src/pages/Login.tsx)
Provides a clean fallback access viewport protecting active analytical data paths.

Form inputs feature client-side event propagation suppression and state persistence maps.

2. Analytical assessment Matrix Catalog (src/pages/Dashboard.tsx)
High-level overview presenting historical summaries, total deployment durations, question counts, and visibility rules.

Contains structural action controllers to instantiate the multi-stage assessment configuration sequence.

3. Step-by-Step Test Creation Orchestration Engine (src/pages/TestCreation.tsx)
Acts as a structural workflow controller managing the multi-step test layout configuration lifecycle:

Phase I (CreateTest.tsx): Captures underlying test parameters including formal title, operational test category, duration parameters, total score criteria, and high-level evaluation metrics.

Phase II (AddQuestions.tsx): Dynamic canvas allowing real-time injection, removal, and editing of functional technical questions containing structured properties (Question string, Answer choices selection array, points weight variables).

Phase III (PreviewPublish.tsx): Aggregate system layout that dynamically stitches previous state structures together for review before hitting the network publication layer.

🚀 Installation & Local Development Lifecycle
Ensure you have Node.js (LTS version) installed on your regional development space before following these instructions.

1. Clone & Access the Workspace
Bash
git clone [https://github.com/chayansehgalll/preproute.git](https://github.com/chayansehgalll/preproute.git)
cd preproute
2. Pull Package Tree Mappings
Bash
npm install
3. Execute Dev Instance (Hot-Reload Mode)
Bash
npm run dev
The client architecture will stand up locally on your address point, typical index target: http://localhost:5173.

4. Code Base Compilation & Static Optimization
Bash
npm run build