import * as React from "react";
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// We will add a new CSS class for the welcome screen background
const Welcome = () => {
  useEffect(() => {
    // Prefetch Login and SignUp components when Welcome component mounts
    import('../pages/Login');
    import('../pages/SignUp');
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-logo-circle">
          <img src="/logo-splash.png" alt="Tapiro Barbershop Logo" className="welcome-main-logo" />
        </div>
        <div className="welcome-text-box">
          <h1 className="welcome-title">Tapiro Barbershop</h1>
          <p className="welcome-tagline">הרגע שלך להתחדש</p>
          <div className="welcome-actions">
            <Button asChild size="lg" className="welcome-button-login">
              <Link to="/login">התחברות</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="welcome-button-signup">
              <Link to="/signup">הרשמה</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
