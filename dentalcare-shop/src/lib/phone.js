// Accept familiar phone formatting, but count digits rather than punctuation.
// Validation does not claim that a number is assigned or reachable.
export function validPhone(value) {
    if (typeof value !== 'string') return false;
    const phone = value.trim();
    if (!phone || phone.length > 32 || !/^\+?[0-9 ()-]+$/.test(phone)) return false;
    const digits = phone.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15;
}
