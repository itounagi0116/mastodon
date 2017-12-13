export const CHANGE_NAVIGATE = 'CHANGE_NAVIGATE';

export function changeNavigate(navigate) {
  return {
    type: CHANGE_NAVIGATE,
    navigate,
  };
}
