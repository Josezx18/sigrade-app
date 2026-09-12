import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { PeriodProvider } from './hooks/usePeriod';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import {
  Login,
  Dashboard,
  Students,
  StudentsPage,
  Teachers,
  Grades,
  Attendance,
  Planning,
  Academic,
  Analytics,
  Profile,
  Counseling,
  AI,
  ExportData,
  QRScanner,
  SchoolCalendar,
  FileManager,
  Config,
} from './pages';

const roles = {
  admin: ['SUPER_ADMIN', 'MINERD_ANALYST'],
  regional: ['REGIONAL_DIRECTOR', 'REGIONAL_TECHNICIAN'],
  district: ['DISTRICT_DIRECTOR', 'DISTRICT_TECHNICIAN'],
  school: ['SCHOOL_DIRECTOR', 'VICE_DIRECTOR', 'COORDINATOR'],
  schoolMgmt: ['COORDINATOR', 'SCHOOL_DIRECTOR', 'VICE_DIRECTOR'],
  teacher: ['TEACHER'],
  counselor: ['COUNSELOR', 'PSYCHOLOGIST'],
  student: ['STUDENT'],
  parent: ['PARENT'],
};

function App() {
  return (
    <AuthProvider>
      <PeriodProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />

              <Route path="students" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><Students /></ProtectedRoute>
              } />
              <Route path="academico/estudiantes" element={
                <ProtectedRoute allowedRoles={roles.schoolMgmt}><StudentsPage /></ProtectedRoute>
              } />
              <Route path="teachers" element={
                <ProtectedRoute allowedRoles={roles.schoolMgmt}><Teachers /></ProtectedRoute>
              } />
              <Route path="grades" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><Grades /></ProtectedRoute>
              } />
              <Route path="attendance" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><Attendance /></ProtectedRoute>
              } />
              <Route path="planning" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><Planning /></ProtectedRoute>
              } />
              <Route path="academic" element={
                <ProtectedRoute allowedRoles={roles.schoolMgmt}><Academic /></ProtectedRoute>
              } />
              <Route path="analytics" element={
                <ProtectedRoute allowedRoles={[...roles.schoolMgmt, ...roles.district, ...roles.regional, ...roles.admin]}><Analytics /></ProtectedRoute>
              } />
              <Route path="counseling" element={
                <ProtectedRoute allowedRoles={[...roles.counselor, ...roles.schoolMgmt]}><Counseling /></ProtectedRoute>
              } />
              <Route path="ai" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><AI /></ProtectedRoute>
              } />
              <Route path="export" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt, ...roles.admin]}><ExportData /></ProtectedRoute>
              } />
              <Route path="qr" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.student]}><QRScanner /></ProtectedRoute>
              } />
              <Route path="calendar" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt, ...roles.student]}><SchoolCalendar /></ProtectedRoute>
              } />
              <Route path="files" element={
                <ProtectedRoute allowedRoles={[...roles.teacher, ...roles.schoolMgmt]}><FileManager /></ProtectedRoute>
              } />
              <Route path="config" element={
                <ProtectedRoute allowedRoles={[...roles.admin, ...roles.regional, ...roles.district, ...roles.schoolMgmt]}><Config /></ProtectedRoute>
              } />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </PeriodProvider>
    </AuthProvider>
  );
}

export default App;
