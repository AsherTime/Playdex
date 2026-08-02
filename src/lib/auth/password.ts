export function isWeakPassword(password: string) {
  return password.length < 8;
}

export function doPasswordsMismatch(password: string, confirmation: string) {
  return password !== confirmation;
}
