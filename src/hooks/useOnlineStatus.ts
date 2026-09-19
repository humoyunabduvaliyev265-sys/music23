import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [reconnectedNotice, setReconnectedNotice] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleOnline = () => {
      setIsOnline(true);
      setReconnectedNotice(true);
      timer = setTimeout(() => {
        setReconnectedNotice(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setReconnectedNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { isOnline, reconnectedNotice };
}
