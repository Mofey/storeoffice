import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { SiteContentProvider } from './contexts/SiteContentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProductProvider>
          <SiteContentProvider>
            <Router>
              <ScrollToTop />
              <div className="app-shell min-h-screen">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<AdminDashboard />} />
                </Routes>
              </div>
            </Router>
          </SiteContentProvider>
        </ProductProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
