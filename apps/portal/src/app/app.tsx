import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentGrades } from './pages/StudentGrades';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentSchedule } from './pages/StudentSchedule';
import { StudentHomework } from './pages/StudentHomework';
import { StudentProfile } from './pages/StudentProfile';
import { PortalLayout } from './components/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/grades" element={<StudentGrades />} />
          <Route path="/attendance" element={<StudentAttendance />} />
          <Route path="/schedule" element={<StudentSchedule />} />
          <Route path="/homework" element={<StudentHomework />} />
          <Route path="/profile" element={<StudentProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
