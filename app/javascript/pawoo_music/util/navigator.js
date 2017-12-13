let persistent;

export function setNavigate(local) {
	persistent = local;
}

export function navigate(url) {
	persistent(url);
}
