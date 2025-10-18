export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export function validatePassword(password) {
  if (!password) return { ok: false, message: "Password is required" }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      message:
        "Password must be at least 8 characters long, include at least one uppercase letter and one number.",
    }
  }
  return { ok: true }
}
