let persistent;

setNavigate(url => location.href = url);

export function setNavigate(local) {
  persistent = local;
}

export function navigate(url) {
  persistent(url);
}
