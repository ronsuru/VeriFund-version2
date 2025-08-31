export const openLoginModal = () => {
  try {
    window.dispatchEvent(new CustomEvent('open-login'));
  } catch {}
};

export const closeLoginModal = () => {
  try {
    window.dispatchEvent(new CustomEvent('close-login'));
  } catch {}
};



