# 🎓 PrepRoute - Test Management Application

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

A comprehensive test management application for educators and administrators to create, manage, and publish tests for students. Built with React, TypeScript, Vite, and Tailwind CSS.

![PrepRoute Dashboard](https://via.placeholder.com/800x400?text=PrepRoute+Dashboard)

## ✨ Features

### 📝 Test Creation & Management
- **Create Tests** with customizable settings (duration, marking scheme, difficulty)
- **Multi-step Workflow**: Test Settings → Questions → Preview & Publish
- **Subject/Topic Hierarchy**: Cascading dropdowns for subjects → topics → sub-topics
- **Flexible Question Builder**: Add MCQs with 4 options, explanations, and difficulty levels
- **Bulk Question Management**: Add, edit, and delete questions efficiently

### 🚀 Publishing Options
- **Publish Now**: Make test immediately live
- **Schedule Publish**: Set future date and time (12-hour format with AM/PM)
- **Draft Mode**: Save tests for later completion
- **Live Until**: Control test availability (Always, 1-4 weeks, or custom duration)

### 📊 Dashboard & Analytics
- **Test Overview**: View all tests with status indicators
- **Statistics Cards**: Total tests, published, drafts, and question counts
- **Search & Filter**: Find tests by name, subject, or status
- **Quick Actions**: Edit, view, delete, or manage questions directly from dashboard

### 🔒 Authentication & Security
- **Hardcoded Authentication** for demo purposes
- **JWT Token Management** with localStorage persistence
- **Protected Routes** - Only authenticated users can access the app

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.6 | UI Library |
| TypeScript | 5.9.3 | Type Safety |
| Vite | 7.3.2 | Build Tool |
| Tailwind CSS | 4.1.17 | Styling |
| React Router DOM | 7.x | Navigation |

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/yourusername/preproute.git
cd preproute

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Default Login Credentials
```
User ID: vedant_admin
Password: vedant123
```

## 📁 Project Structure

```
preproute/
├── public/                 # Static assets
├── src/
│   ├── pages/             # Page components
│   │   ├── Login.tsx      # Authentication page
│   │   ├── Dashboard.tsx  # Test listing & management
│   │   ├── CreateTest.tsx # Test creation/editing
│   │   ├── AddQuestions.tsx # Question builder
│   │   └── PreviewPublish.tsx # Final review & publish
│   ├── services/
│   │   ├── api.ts         # API service layer
│   │   └── config.ts      # API configuration
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🌐 API Integration

The application supports both **mock data** (localStorage) and **real API** modes.

### Real API Configuration

Edit `src/services/config.ts`:

```typescript
export const API_CONFIG = {
  USE_REAL_API: true,                    // Toggle between real/mock
  BASE_URL: "https://your-api.com/api",  // Your API endpoint
  FALLBACK_TO_MOCK_ON_FAILURE: true,     // Fallback on API errors
};
```

### Supported API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User authentication |
| GET | `/subjects` | Get all subjects |
| GET | `/topics/subject/:id` | Get topics by subject |
| GET | `/sub-topics/topic/:id` | Get sub-topics by topic |
| POST | `/sub-topics/multi-topics` | Get sub-topics for multiple topics |
| GET | `/tests` | Get all tests |
| GET | `/tests/:id` | Get test by ID |
| POST | `/tests` | Create new test |
| PUT | `/tests/:id` | Update test |
| DELETE | `/tests/:id` | Delete test |
| POST | `/questions/bulk` | Bulk create questions |
| POST | `/questions/fetchBulk` | Fetch questions by IDs |

## 🚀 Usage Guide

### Creating a New Test

1. **Login** with provided credentials
2. Click **"Create New Test"** on Dashboard
3. Fill test details:
   - Select Subject, Topics, Sub-topics
   - Set Duration, Total Marks, Questions
   - Configure Marking Scheme (correct/wrong/unattempted)
   - Choose Difficulty Level
4. Click **"Next: Add Questions"**

### Adding Questions

1. Enter **Question Text**
2. Fill **4 Options** and select correct answer
3. Add **Explanation** (optional)
4. Set **Topic/Sub-topic** (optional)
5. Click **"+ Add Another Question"** or **"Save & Continue"**

### Publishing a Test

1. Review test details and all questions
2. Choose publish mode:
   - **Publish Now** - Immediate availability
   - **Schedule Publish** - Set future date/time
3. Set **Live Until** duration
4. Click **"Confirm"** to publish

### Editing a Published Test

1. From Dashboard, click **Edit** on any test
2. Modify test settings or publish configuration
3. Change status:
   - Keep as Draft
   - Publish Now
   - Schedule Publish (with date/time picker)
4. Save changes - status updates automatically

## 🎨 UI Features

### Responsive Design
- Fully responsive layout
- Mobile-friendly navigation
- Adaptive sidebar and content areas

### Interactive Elements
- **12-Hour Time Picker** with AM/PM toggle
- **Date Pickers** with past-date blocking
- **Multi-select Dropdowns** for topics/sub-topics
- **Real-time Notifications** with auto-dismiss
- **Inline Question Editing** in preview mode

### Visual Feedback
- Status badges (Draft, Scheduled, Published)
- Toast notifications for all actions
- Loading states and spinners
- Form validation with error messages

## ⚙️ Configuration Options

### Environment Variables

Create `.env` file for environment-specific settings:

```env
VITE_API_BASE_URL=https://your-api.com/api
VITE_USE_MOCK_API=false
```

### Customization

**Colors**: Edit Tailwind config or CSS variables in `src/index.css`

**Logo**: Replace SVG in `src/App.tsx` Logo component

**Default Values**: Modify `emptyTest` object in `CreateTest.tsx`

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Recommended rules
- **Prettier**: Code formatting (optional)

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| API connection failed | Check `API_CONFIG.BASE_URL` in `src/services/config.ts` |
| Login not working | Verify credentials: `vedant_admin` / `vedant123` |
| Questions not saving | Ensure at least 1 question is added before saving |
| Date picker not blocking past dates | Check browser compatibility (Chrome/Firefox recommended) |

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing component structure
- Use Tailwind utility classes for styling
- Add comments for complex logic

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [React Router](https://reactrouter.com/) - Navigation

---

Made with ❤️ by the CS
