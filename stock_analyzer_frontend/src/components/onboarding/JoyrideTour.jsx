import React, { useMemo, useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useApp } from '../../state/AppContext.jsx';

// PUBLIC_INTERFACE
export default function JoyrideTour() {
  /** Interactive onboarding tour: auto-runs once for first-time users and is restartable from Help. */
  const { onboardingCompleted, setOnboardingCompleted } = useApp();
  const [run, setRun] = useState(!onboardingCompleted);

  const steps = useMemo(() => {
    return [
      {
        target: '[data-tour="brand"]',
        content: 'Welcome! This app uses mock data to demonstrate stock insights and portfolio tools.'
      },
      {
        target: '[data-tour="nav"]',
        content: 'Use the sidebar to switch sections. On mobile, open it with the menu button.'
      },
      {
        target: '[data-tour="topbar"]',
        content: 'Keyboard navigation is supported throughout. Use Tab to move and Enter/Space to activate.'
      }
    ];
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      hideCloseButton={false}
      disableOverlayClose={false}
      styles={{
        options: { primaryColor: '#2563EB', zIndex: 2000 }
      }}
      callback={(data) => {
        const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
        if (finished) {
          setRun(false);
          setOnboardingCompleted(true);
          try {
            window.localStorage.setItem('sia.onboardingCompleted.v1', 'true');
          } catch {
            // ignore
          }
        }
      }}
    />
  );
}

// PUBLIC_INTERFACE
export function startTour() {
  /** Starts the onboarding tour by clearing completion flag and reloading. */
  try {
    window.localStorage.removeItem('sia.onboardingCompleted.v1');
  } catch {
    // ignore
  }
  window.location.assign('/help?tour=1');
}
