import { useRegisterSW } from 'virtual:pwa-register/react';

// Nowa wersja apki czeka w service workerze — odświeżamy dopiero na Twoje tapnięcie,
// żeby nie przerwać pisania wiadomości.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  if (!needRefresh) return null;
  return (
    <div className="toast" role="status">
      <span>Świeża wersja Chleba wyszła z pieca.</span>
      <button type="button" onClick={() => updateServiceWorker(true)}>
        Odśwież
      </button>
      <button type="button" onClick={() => setNeedRefresh(false)}>
        Później
      </button>
    </div>
  );
}
